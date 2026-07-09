from typing import Union
from app_routes.booking.schema import BookingStatus
from app_routes.invoice import helpers
from app_schemas.schema import Role
from pyhtml2pdf import converter
from logger import logger as logging
from fastapi import BackgroundTasks
import os
import shutil
from tempfile import SpooledTemporaryFile
from PIL import Image
import io
from jinja2 import Environment, FileSystemLoader
import os.path as path
from app_utils.decorators import transactional, verify_jwt_role_and_email
from app_utils.utils import get_booking_by_booking_id, get_trip_record_by_booking_id, is_valid_email_for_role, build_invoice_json, is_valid_email_for_multiple_roles
from sqlalchemy import func, Numeric, literal, select
from sqlalchemy.orm import aliased
from sqlalchemy.exc import SQLAlchemyError
from itertools import chain
from datetime import datetime, timedelta, timezone
from app_utils import exception as ex
from app_models import crud
from sqlalchemy import or_, asc, desc, and_, text
from typing_extensions import Type, Dict
from common_utils import utils as cutils
from app_routes.invoice.schema import InvoiceEvent, InvoiceStatus
from app_routes.organizer.schema import OrganizerRole
from app_routes.trip.schema import TripStatus
from app_configs import constants as const
from common_utils.push_notifications import NotificationSenderFactory
from common_utils import obj_to_dict
from app_routes.booking import utils as booking_utils
from app_utils import utils as app_utils
from num2words import num2words
import pandas as pd
from fastapi.responses import StreamingResponse
from app_models.models import (
    Booking,
    BookingLogs,
    BookingEvent,
    CostCentre,
    CreditNoteInvoice,
    Guest,
    Location,
    Vehicle,
    Plan,
    Trip,
    TripEvent,
    Invoice,
    DriverCharge,
    Vendor,
    Coordinator,
    Organizer,
    Package,
    Waypoint,
    VendorInvoices,
    yearly_cab_invoice_id_seq,
    yearly_cab_credit_note_id_seq
)

base_directory =  path.abspath(path.join(__file__ ,"../../.."))
templates_dir = os.path.join(base_directory, const.TEMPLATES_DIR)

env = Environment(loader=FileSystemLoader(templates_dir))
template = env.get_template(const.RENDERED_HTML)

report_dir = os.path.join(base_directory, 'reports')
rendered_html_dir = os.path.join(base_directory, 'rendered_html')

for directory in [report_dir, rendered_html_dir]:
   if not os.path.exists(directory):
      os.makedirs(directory)
      logging.info(f"Directory '{os.path.basename(directory)}' created.")


@transactional
def get_invoice_info_by_booking_id(booking_id: str):
   """
   Retrieve invoice information for a specific booking.

   Args:
        email (str): Email of the user.
        role (str): Role of the user.
        booking_id (str): Booking ID for which invoice information is retrieved.

   Returns:
        dict: Invoice information associated with the booking.
   """

   if get_booking_by_booking_id(booking_id):
      source_location = aliased(Location, name="source_location")
      destination_location = aliased(Location, name="destination_location")

      select_cols = [func.jsonb_build_object("invoice", build_invoice_json(source_location, destination_location))]
      filter_conditions = [
         Booking.id == booking_id,
         or_(
            and_(TripEvent.event == TripStatus.STARTED.value, TripEvent.trip_id == Trip.id),
            and_(TripEvent.event == TripStatus.COMPLETED.value, TripEvent.trip_id == Trip.id),
            TripEvent.id.is_(None)  # Allow for cases where there are no associated TripEvents
         )
      ]
      join_conditions = [
         (CostCentre, CostCentre.id == Booking.cost_centre_id, 'left'),
         (Plan, Plan.id == Booking.plan_id),
         (Package, Package.id == Plan.package_id),
         (BookingLogs, BookingLogs.booking_id == Booking.id),
         (Trip, Trip.booking_id == Booking.id, 'left'),
         (TripEvent, TripEvent.trip_id == Trip.id, 'left'),
         (Guest, Guest.id == BookingLogs.guest_id),
         # Left join for Waypoint with filtering condition
         (Waypoint, (Waypoint.guest_id == Guest.id) & ((Waypoint.booking_id == Booking.id) | (Waypoint.booking_id.is_(None))), 'left'),
         (Location, Location.id == Waypoint.location_id, 'left'),
         (source_location, source_location.id == BookingLogs.source_id),
         (destination_location, destination_location.id == BookingLogs.destination_id, 'left'),
         (Vehicle, Vehicle.id == Plan.vehicle_id),
         (DriverCharge, and_(DriverCharge.vendor_id == Booking.vendor_id, DriverCharge.vehicle_model_id == Vehicle.vehicle_model_id), 'left'),
         (Vendor, Vendor.id == Booking.vendor_id),
         (Coordinator, Coordinator.id == Booking.coordinator_id),
         (VendorInvoices, VendorInvoices.booking_id == Booking.id, 'left')
      ]

      return (
      crud.select_records(
         primary_table=Booking,
         select_cols=select_cols,
         join_conditions=join_conditions,
         filter_conditions=filter_conditions,
      )
      .distinct()
      .scalar()
   )



def delete_sub_folder(base_directory, subfolder_name):
   """
    Delete a subfolder and its contents from the specified base directory.

   Args:
        base_directory (str): Base directory containing the subfolder.
        subfolder_name (str): Name of the subfolder to delete.
   """
   subfolder_path = os.path.join(base_directory, subfolder_name)

   try:
      shutil.rmtree(subfolder_path)
      logging.info(f"Subfolder '{subfolder_name}' and its contents have been deleted.")
   except FileNotFoundError:
      logging.error(f"Subfolder '{subfolder_name}' not found.")
   except Exception as e:
      logging.error(f"Error deleting subfolder '{subfolder_name}': {e}")  


def cleanup_files(rendered_html: str, pdf_path: str, pdf_name: str):
   """
   Clean up temporary files generated during PDF generation.

   Args:
        rendered_html (str): Path to the rendered HTML file.
        pdf_path (str): Path to the generated PDF file.
        pdf_name (str): Name of the PDF file.
   """
   if os.path.exists(rendered_html):
      try:
         os.remove(rendered_html)
         logging.info(f"Rendered HTML file deleted for {pdf_name}.pdf")
      except Exception as e:
         logging.error(f"Failed to delete rendered HTML file for {pdf_name}.pdf: {e}")

   if os.path.exists(pdf_path):
      try:
         os.remove(pdf_path)
         logging.info(f"Generated PDF file deleted for {pdf_name}.pdf")
      except Exception as e:
         logging.error(f"Failed to delete generated PDF file for {pdf_name}.pdf: {e}")


@transactional
def insert_invoice_record(model: Type, records: Dict):
   """
   Insert a new record into the database.

   Args:
        model (Type): The model (database table) to insert records into.
        records (Dict): Data to insert into the specified table.

   Returns:
      str: The ID of the newly inserted record.
   """
   result = crud.insert_record(model, **records)
   if result:
      return result.id
   raise ex.DatabaseOperationFailed(action="insert")


@transactional
def generate_pdf(rendered_html, output_pdf_path, invoice_id, invoice_summary, pdf_name, subfolder, id):
   """
   Generate a PDF report and upload it to S3, then clean up temporary files.

   Args:
        rendered_html (str): Path to the rendered HTML file.
        output_pdf_path (str): Path to the generated PDF file.
        invoice_id (str): ID of the associated invoice.
        pdf_name (str): Name of the PDF file.
        subfolder (str): Name of the subfolder containing temporary files.
   """
   try:
      converter.convert(f'file:///{rendered_html}', output_pdf_path)

      updated_invoice_id_format = f"INVOICE_{invoice_id.replace('/', '-')}"

      s3_object_key = f"{pdf_name}/{const.INVOICES_S3_BUCKET_FOLDER}/{updated_invoice_id_format}.pdf"

      downloads_directory = os.path.join(base_directory, const.DOWNLOADS_DIR)
      if not os.path.exists(downloads_directory):
         os.makedirs(downloads_directory)

      cutils.upload_to_s3(output_pdf_path, s3_object_key)
      delete_sub_folder(downloads_directory, subfolder) 
      cleanup_files(rendered_html, output_pdf_path, pdf_name)
      NotificationSenderFactory.create_notification_sender(booking_id=invoice_summary["booking_id"], status=BookingStatus.INVOICE_CREATED.value).send_notification()
      crud.update_records(
      Invoice, filter_criteria=[Invoice.id == id], 
      records_to_update={"status": InvoiceStatus.INVOICE_SUCCESS.value}
      )
      logging.info(f"PDF report generated for booking ID {pdf_name}")

   except Exception as e:
      logging.error(f"PDF conversion failed for booking ID{pdf_name}: {e}")
     
@transactional
def generate_credit_note_pdf(rendered_html, output_pdf_path, credit_invoice_id, invoice_summary, pdf_name, subfolder, id):
   """
   Generate a PDF report and upload it to S3, then clean up temporary files.

   Args:
        rendered_html (str): Path to the rendered HTML file.
        output_pdf_path (str): Path to the generated PDF file.
        invoice_id (str): ID of the associated invoice.
        pdf_name (str): Name of the PDF file.
        subfolder (str): Name of the subfolder containing temporary files.
   """
   try:
      converter.convert(f'file:///{rendered_html}', output_pdf_path)

      updated_invoice_id_format = f"INVOICE_{credit_invoice_id.replace('/', '-')}"

      s3_object_key = f"{pdf_name}/{const.CREDIT_NOTE_INVOICES_S3_BUCKET_FOLDER}/{updated_invoice_id_format}.pdf"

      downloads_directory = os.path.join(base_directory, const.DOWNLOADS_DIR)
      if not os.path.exists(downloads_directory):
         os.makedirs(downloads_directory)

      cutils.upload_to_s3(output_pdf_path, s3_object_key)
      delete_sub_folder(downloads_directory, subfolder) 
      cleanup_files(rendered_html, output_pdf_path, pdf_name)
      logging.info(f"PDF report generated for booking ID {pdf_name}")

   except Exception as e:
      logging.error(f"PDF conversion failed for booking ID{pdf_name}: {e}")
     
def guest_details(invoice_info):
   """
   Extract guest details from invoice information.

   Args:
      invoice_info (dict): Invoice information.

   Returns:
      dict: Guest details including name, starting and ending locations, cost centers, email, phone number, and waypoints.
   """

   guest_summary = {}

   for trip in invoice_info:
      guest_name = trip.get('guest_name')
      if guest_name:
         if guest_name not in guest_summary:
            guest_summary[guest_name] = {
               'starting_location': trip.get('source', {}).get('address'),
               'ending_location': trip.get('destination', {}).get('address') if trip.get('destination') else 'NA',
               'email': trip.get('email'),
               'phone_number': trip.get('mobile'),
               'waypoints': [],
               'rank': trip['rank'] if trip['rank'] else 'NA',
               'vessel_name':  trip['vessel_name'] if trip['vessel_name'] else  'NA',
               'internal_id': trip['internal_id'] if trip['internal_id'] else  'NA',
               'date_of_duty': trip['date_of_duty'] if trip['date_of_duty'] else  'NA',
               'start_time':  trip['start_time'] if trip['start_time'] else  'NA',
               'flight_details':  trip['flight_details'] if trip['flight_details'] else  'NA',
               }
            
         else:
            # Add waypoint if not already present for the guest
            waypoint = trip.get('waypoint')
            if waypoint and waypoint not in guest_summary[guest_name]['waypoints']:
               guest_summary[guest_name]['waypoints'].append(waypoint)

   return guest_summary


def trip_start_drop_time(invoice_info):
   """
   Extract start and drop times from invoice information.

   Args:
      invoice_info (dict): Invoice information.

   Returns:
      tuple: Start time and maximum drop time.
   """

   for info in invoice_info:

      if not info['trip_event']:
         return 0
      
      if info['trip_event'] == TripStatus.STARTED.value:
         start_time = info['trip_cdate']
      if info['trip_event'] == TripStatus.COMPLETED.value:
         drop_time = info['trip_cdate']

   start_time = int(start_time[11:13])
   drop_time = int(drop_time[11:13])
            
   return drop_time - start_time


def get_invoice_details(invoice_info, travelled_distance=0, trip_duration=0):
      
      invoice = invoice_info[0]

      return {
        'booking_id': str(invoice['booking_id']),
        'bid': str(invoice['bid']),
        'organizer_id': str(invoice['organizer_id']),
        'vendor_id': str(invoice['vendor_id']),
        'vendor_cost': int(invoice['vendor_cost']),
        'vendor_tax': float(invoice['vendor_tax']),
        'driver_charge': float(invoice['driver_charge']) if invoice['driver_charge'] else 0,
        'plan_distance_kms': int(invoice['distance_kms']),
        'plan_interval_hrs': int(invoice['interval_hrs']),
        'travelled_distance': int(invoice['distance']) if invoice['distance'] else 0,
        'trip_duration': int(invoice['duration']) if invoice['duration'] else 0,
        'extra_hour_cost': int(invoice['extra_hour_cost']),
        'extra_distance_cost': int(invoice['extra_distance_cost']),
        'calculated_extra_hrs': int(invoice['calculated_extra_hrs']),
        'calculated_extra_kms': int(invoice['calculated_extra_kms']),
        'booking_date': str(invoice['booking_datetime']),
        'booking_type': str(invoice['booking_type']),
        'coordinator_name': str(invoice['coordinator_name']),
        'cost_centre': str(invoice['cost_centre']),
        'address': str(invoice['address']) if invoice['address'] else "",
        'gstin_no': str(invoice['gstin_no']) if invoice['gstin_no'] else "",
        'cancellation_fare': float(invoice['cancellation_fare']) if invoice['cancellation_fare'] else 0,
        'vendor_tax_amount': float(invoice['vendor_tax_amount']) if invoice['vendor_tax_amount'] else 0,
        'starting_time': invoice['starting_time'], 
        'ending_time': invoice['ending_time'],
        'starting_odo': invoice['starting_odo'] or 'NA',
        'ending_odo': invoice['ending_odo'] or 'NA',
        'package_detail': invoice['package_detail'],
        'cab_type': invoice['cab_type']
      }

def write_html_to_file(rendered_html, invoice_summary_obj: helpers.InvoiceSummaryGenerator, invoice_summary: dict, invoice_record: Union[Invoice, CreditNoteInvoice], tariff_plan_record, image_urls: list[str]):
   """
   Write HTML content to a file using the provided template and data.

   Args:
        template: The HTML template to render.
        rendered_html (str): The path to the HTML file to be created.
        booking_id (str): The booking ID associated with the invoice.
        invoice_info (dict): Information related to the invoice.
        image_urls (list): List of image URLs associated with the invoice.
        total_trip_cost (float): Total cost of the trip.
        total_distance (float): Total distance traveled in the trip.
        total_duration (float): Total duration of the trip.
        total_trip_cost_with_tax (float): Total trip cost including tax.
   """
   try:
      billing_items = [
         ("Base Fare", "base_fare", None, False),
         ("Extra Distance Cost", "extra_distance_cost", "extra_kms", True),
         ("Extra Duration Cost", "extra_hour_cost", "extra_hrs", True),
         ("Parking and Toll", "parking_and_toll", None, False),
         ("Miscellaneous", "miscellaneous", None, False),
         ("Driver Batta", "driver_charge", None, False),
         ("Cancellation Fare", "cancellation_amount", None, False),
      ]

      billing_details = []

      # Example: discount info
      discount_percent = getattr(invoice_record, "discount_percent", 0)  # can come from record

      for label, rate_field, extra_field, multiply in billing_items:
         rate = getattr(invoice_record, rate_field)
         extra = getattr(invoice_record, extra_field) if extra_field else 1.0
         amount = rate * extra if multiply else rate

         # skip items where rate or amount is zero
         if not rate or amount == 0:
            continue

         # apply discount only for Base Fare
         if label == "Base Fare" and discount_percent > 0:
            discount_amount = amount * discount_percent / 100
            net_amount = amount - discount_amount
         else:
            discount_amount = 0.0
            net_amount = amount

         billing_details.append({
            "particular": label,
            "rate": round(rate, 2),
            "extra": round(extra, 2),
            "amount": round(amount, 2),
            "discount": round(discount_amount, 2),
            "net_amount": round(net_amount, 2)
         })

      final_invoice_amount=round(invoice_record.invoice_amount, 2)
      invoice_date = cutils.convert_datetime(invoice_record.cdate, to_utc=False).strftime(const.DATEFORMAT)   
      
      with open(rendered_html, 'w') as fh:
         fh.write(
            template.render(
               booking_id=invoice_summary['bid'],
               invoice_id=invoice_record.invoice_id if isinstance(invoice_record, Invoice) else invoice_record.credit_note_id,
               invoice_date=invoice_date,  
               image_urls=image_urls,
               billing_details=billing_details,
               cancellation_fare=round(invoice_record.cancellation_amount, 2),
               extra_distance_cost=round(invoice_record.extra_distance_cost, 2),
               extra_hour_cost=round(invoice_record.extra_hour_cost, 2),
               taxable_value=round(invoice_record.taxable_sub_total, 2),
               sub_total=round(invoice_record.taxable_sub_total, 2),
               final_invoice_amount=final_invoice_amount,
               discount_percent=invoice_record.discount_percent,
               po_number=invoice_summary['po_number'],
               cgst=invoice_record.cgst_amount,
               sgst=invoice_record.sgst_amount,
               base_fare=invoice_record.base_fare,
               miscellaneous=invoice_record.miscellaneous,
               parking_and_toll=invoice_record.parking_and_toll,
               driver_charge=invoice_record.driver_charge,
               invoice_cost_in_sentence=get_amount_in_sentence(round(final_invoice_amount, 2)),
               cost_centre=invoice_summary["cost_centre"],
               guest_info=invoice_summary_obj.get_guests_info(),
               booking_type=invoice_summary['booking_type'],
               booking_date=invoice_summary['booking_date'],
               booked_by=invoice_summary['coordinator_name'],
               address=invoice_summary['address'],
               gstin_no=invoice_summary['gstin_no'],
               original_invoice_no=invoice_summary.get('original_invoice_no', None),
               package_detail=tariff_plan_record["package"]["name"],
               opening_kms=invoice_summary['starting_odo'],
               closing_kms=invoice_summary['ending_odo'],
               starting_time=invoice_summary['starting_time'],
               ending_time=invoice_summary['ending_time'],
               cab_type=tariff_plan_record["vehicle"]["vehicle_model"]
            )  
         )
   except Exception as e:
      logging.info(f"Error writing HTML to file: {e}")


def create_invoice_record(booking_id: str, event: str, records_to_insert: dict):
   """
   Create a new invoice record in the database.

   Args:
      booking_id (str): The booking ID associated with the invoice.
      total_trip_cost (float): Total cost of the trip.

   Returns:
      str: The ID of the newly created invoice record.
   """
   records_to_insert.update({
      "booking_id": booking_id,
      "event": event
   })
   invoice_id = insert_invoice_record(Invoice, records_to_insert)
   return invoice_id


def calculate_tax(cost: float, tax_percent: float):
   """
   Calculate tax based on a percentage of the given cost.
   """
   return (tax_percent / 100) * cost


def calculate_gst(cost: float, cgst_tax_percent: float, sgst_tax_percent: float):
   """
   Calculate tax based on a percentage of the given cost.
   """
   cgst = round(cost * (cgst_tax_percent / 100), 2)
   sgst = round(cost * (sgst_tax_percent / 100), 2)

   return cgst, sgst, round(cgst+ sgst, 2)


def create_invoice_booking_events(booking_id: str, event: str, meta_data: dict):
   """
   Create booking events record for a specific booking.

   Args:
      booking_id (str): The booking ID for which the event is recorded.
      event (str): The type of invoice event to record
      meta_data (dict): Additional metadata associated with the event.

   Returns:
      int: The ID of the inserted record in the BookingEvent table.
   """

   records_to_insert = {
      "booking_id": booking_id,
      "event": event,
      "meta_data": meta_data
   }
   return insert_invoice_record(BookingEvent, records_to_insert)


def get_invoice_event(role: str, email: str):

   if role == 'vendor':
      event = InvoiceEvent.INVOICE_CREATED.value

   elif role == 'organizer':
      user = crud.select_records(primary_table=Organizer,filter_conditions=[Organizer.email == email]).first()
      if user.role == OrganizerRole.NORMAL.value:
         event = InvoiceEvent.INVOICE_CREATED_BY_ORGANIZER.value
      else:
         event = InvoiceEvent.INVOICE_CREATED_BY_SUPER_ORGANIZER.value

   return event
      

def validate_user(role: str, email: str, booking_id: str):

   if role == "organizer":
      user = crud.select_records(primary_table=Organizer,filter_conditions=[Organizer.email == email]).first()

      if user.role == OrganizerRole.NORMAL.value:
         invoice = crud.select_records(primary_table=Invoice, 
                  filter_conditions=[Invoice.booking_id == booking_id, Invoice.event == InvoiceEvent.INVOICE_CREATED_BY_ORGANIZER.value],
                  ).first()

         if invoice:
            return False

   return True


def get_current_financial_year():
    today = datetime.today()
    year = today.year
    if today.month >= 4:
        start_year = year
        end_year = year + 1
    else:
        start_year = year - 1
        end_year = year

    return f"{str(start_year)[-2:]}{str(end_year)[-2:]}"


def generate_invoice_id(id, booking_type):
   current_financial_year = get_current_financial_year()
   return f"AP/{booking_type.upper()}{current_financial_year}-{id}"


@transactional
def get_invoice(booking_id):

   invoice = crud.select_records(
      primary_table=Invoice,
      filter_conditions=[Invoice.booking_id == booking_id]
      ).limit(1).first()
  
   return invoice

@transactional
def upsert_invoice(booking_id, invoice_summary, invoice_event, records_to_insert_or_update):
   invoice = get_invoice(booking_id)
   if invoice:
      crud.update_records(
         Invoice, 
         filter_criteria=[Invoice.id == invoice.id], 
         records_to_update=records_to_insert_or_update
      )
      folder_prefix = f"{booking_id}/invoices/"
      cutils.delete_objects_in_folder(folder_prefix)
      logging.info(f"{folder_prefix} objects deleted.")
   else:
      seq_id = crud.fetch_seq_value(yearly_cab_invoice_id_seq)
      invoice_id = generate_invoice_id(id=seq_id, booking_type='CAB')
      invoice = crud.insert_record(
         Invoice,
         invoice_id=invoice_id,
         booking_id=booking_id,
         event=invoice_event,
         **records_to_insert_or_update
      )
      # invoice_id = generate_invoice_id(invoice.id, invoice_summary['booking_type'])

      # crud.update_records(
      #    Invoice, 
      #    filter_criteria=[Invoice.id == invoice.id], 
      #    records_to_update={"invoice_id": invoice_id}
      # )

@transactional
def get_credit_note_invoice(invoice_id):
   invoice = crud.select_records(
      primary_table=CreditNoteInvoice,
      filter_conditions=[CreditNoteInvoice.invoice_id == invoice_id]
      ).limit(1).first()
  
   return invoice

@transactional
def upsert_credit_note_invoice(booking_id, invoice_id, records_to_insert_or_update):
   credit_note_invoice = get_credit_note_invoice(invoice_id)
   if credit_note_invoice:
      crud.update_records(
         CreditNoteInvoice, 
         filter_criteria=[CreditNoteInvoice.id == credit_note_invoice.id], 
         records_to_update=records_to_insert_or_update
      )
      folder_prefix = f"{booking_id}/credit_note_invoices/"
      cutils.delete_objects_in_folder(folder_prefix)
      logging.info(f"{folder_prefix} objects deleted.")

   else:
      seq_id = crud.fetch_seq_value(yearly_cab_credit_note_id_seq)
      credit_note_id = generate_invoice_id(id=seq_id, booking_type='CN')
      crud.insert_record(
         CreditNoteInvoice,
         credit_note_id=credit_note_id,
         invoice_id=invoice_id,
         **records_to_insert_or_update
      )

def download_images_from_s3(booking_id):
   result = []
   for folder in [const.PROOFS_S3_BUCKET_FOLDER, const.DOCUMENTS_S3_BUCKET_FOLDER]:
      s3_folder_path = f"{booking_id}/{folder}"
      downloads_directory = os.path.join(base_directory, const.DOWNLOADS_DIR)
      local_folder_path = os.path.join(downloads_directory, booking_id)
      image_urls = cutils.download_s3_objects_in_subfolder(s3_folder_path, local_folder_path)
      result.extend(image_urls)

   return result


def get_amount_in_sentence(num):
   return num2words(num, lang='en_IN').title().replace(',', '') + " Rupees Only"
    

@transactional
def generate_and_store_invoice_pdf(
   background_tasks: BackgroundTasks, booking_id, base_fare, driver_charge, discount_percent, cancellation_amount, extra_kms, extra_hrs, extra_distance_cost, extra_duration_cost, taxable_sub_total, non_taxable_sub_total, final_invoice_amount,
   po_number, description, miscellaneous, parking_and_toll, cgst_amount, sgst_amount, package_id, vehicle_id, trip_documents, email, role):
   """
   Generate and store an invoice PDF asynchronously.

   Args:
      background_tasks (BackgroundTasks): BackgroundTasks instance for asynchronous task scheduling.
      email (str): Email of the user initiating the invoice generation.
      role (str): Role of the user.
      booking_id (str): Booking ID for which the invoice is generated.
      include_additional_distance (bool): Flag indicating whether additional distance cost should be included.
      include_additional_hour (bool): Flag indicating whether additional hour cost should be included.
      custom_driver_charge (float): Custom driver charge if provided.

   Returns:
      dict: A dictionary containing a message indicating the status of the invoice generation process.
   """
   if not validate_user(role, email, booking_id):
      raise ex.InvoiceDeniedInvalidUser

   booking_record = app_utils.get_model_record_by_id(Booking, booking_id)
   tariff_plan_record = cutils.get_tariff_plan_by_filters(booking_record.city_id, package_id, vehicle_id)
   invoice_summary_obj = helpers.InvoiceSummaryGenerator(booking_record)
   invoice_summary = invoice_summary_obj.get_invoice_summary()
   records_to_insert_or_update = {
      "base_fare": base_fare,
      "discount_percent": discount_percent,
      "cancellation_amount": cancellation_amount,
      "extra_kms": extra_kms, 
      "extra_hrs": extra_hrs,
      "extra_distance_cost": extra_distance_cost,
      "extra_hour_cost": extra_duration_cost,
      "driver_charge": driver_charge,
      "taxable_sub_total": taxable_sub_total,
      "cgst_amount": cgst_amount,
      "sgst_amount": sgst_amount,
      "non_taxable_sub_total": non_taxable_sub_total,
      "invoice_amount": final_invoice_amount,
      "description": description or "",
      "parking_and_toll": parking_and_toll,
      "miscellaneous": miscellaneous,
      "po_number": po_number or ""
   }
   invoice_documents = store_documents_in_s3(trip_documents, booking_id) if trip_documents else []

   image_urls = download_images_from_s3(booking_id)

   # Generate HTML file
   rendered_html = os.path.join(base_directory, const.RENDERED_HTML_DIR, const.RENDERED_HTML)
   reports_path = os.path.join(base_directory, const.REPORTS_DIR)

   invoice_event = get_invoice_event(role, email)

   upsert_invoice(booking_id, invoice_summary, invoice_event, records_to_insert_or_update)
   
   invoice_record = get_invoice(booking_id)
   # Write to HTML file
   write_html_to_file(rendered_html, invoice_summary_obj, invoice_summary, invoice_record, tariff_plan_record, image_urls)
   # update invoice events 
   create_invoice_booking_events(booking_id, invoice_event, meta_data={})
   
   # Initiate Background tasks for generating PDF and other asynchronous tasks
   output_pdf_path = os.path.join(reports_path, f'{booking_id}.pdf')
   background_tasks.add_task(generate_pdf, rendered_html, output_pdf_path, invoice_record.invoice_id, invoice_summary, pdf_name=booking_id, subfolder=booking_id, id=invoice_record.id)

   return {"message": "Successfully generated invoice", "invoice_id": invoice_record.id, "invoice_document": invoice_documents}

@transactional
def generate_and_store_credit_note_invoice_pdf(
   background_tasks: BackgroundTasks, invoice_id, base_fare, driver_charge, discount_percent, cancellation_amount, extra_kms, extra_hrs, extra_distance_cost, extra_duration_cost, taxable_sub_total, non_taxable_sub_total, final_invoice_amount,
   po_number, description, miscellaneous, parking_and_toll, cgst_amount, sgst_amount, package_id, vehicle_id, trip_documents, email, role
   ):

   invoice_record = app_utils.get_model_record_by_id(Invoice, invoice_id)

   if not invoice_record:
      raise ex.RecordNotFound(model="Invoice")
   
   booking_record = app_utils.get_model_record_by_id(Booking, invoice_record.booking_id)
   booking_id = str(booking_record.id)

   tariff_plan_record = cutils.get_tariff_plan_by_filters(booking_record.city_id, package_id, vehicle_id)
   invoice_summary_obj = helpers.InvoiceSummaryGenerator(booking_record)
   invoice_summary = invoice_summary_obj.get_invoice_summary()
   records_to_insert_or_update = {
      "base_fare": base_fare,
      "discount_percent": discount_percent,
      "cancellation_amount": cancellation_amount,
      "extra_kms": extra_kms, 
      "extra_hrs": extra_hrs,
      "extra_distance_cost": extra_distance_cost,
      "extra_hour_cost": extra_duration_cost,
      "driver_charge": driver_charge,
      "taxable_sub_total": taxable_sub_total,
      "cgst_amount": cgst_amount,
      "sgst_amount": sgst_amount,
      "non_taxable_sub_total": non_taxable_sub_total,
      "invoice_amount": final_invoice_amount,
      "description": description or "",
      "parking_and_toll": parking_and_toll,
      "miscellaneous": miscellaneous,
   }
   invoice_documents = store_documents_in_s3(trip_documents, booking_id) if trip_documents else []

   image_urls = download_images_from_s3(booking_id)

   # Generate HTML file
   rendered_html = os.path.join(base_directory, const.RENDERED_HTML_DIR, const.RENDERED_HTML)
   reports_path = os.path.join(base_directory, const.REPORTS_DIR)

   upsert_credit_note_invoice(booking_id, invoice_id, records_to_insert_or_update)
   credit_invoice_record = get_credit_note_invoice(invoice_id)
   # Write to HTML file
   invoice_summary["original_invoice_no"] = invoice_record.invoice_id
   write_html_to_file(rendered_html, invoice_summary_obj, invoice_summary, credit_invoice_record, tariff_plan_record, image_urls)
   # update invoice events 
   
   # Initiate Background tasks for generating PDF and other asynchronous tasks
   output_pdf_path = os.path.join(reports_path, f'{booking_id}.pdf')
   background_tasks.add_task(generate_credit_note_pdf, rendered_html, output_pdf_path, credit_invoice_record.credit_note_id, invoice_summary, pdf_name=booking_id, subfolder=booking_id, id=invoice_record.id)

   return {"message": "Successfully generated credit note invoice", "credit_note_id": credit_invoice_record.id}

def generate_hotel_pdf(rendered_html, output_pdf_path, invoice_id, pdf_name, subfolder):
   try:
      converter.convert(f'file:///{rendered_html}', output_pdf_path)
      updated_invoice_id_format = f"INVOICE_{invoice_id.replace('/', '-')}"
      s3_object_key = f"{pdf_name}/{const.INVOICES_S3_BUCKET_FOLDER}/{updated_invoice_id_format}.pdf"

      downloads_directory = os.path.join(base_directory, const.DOWNLOADS_DIR)
      if not os.path.exists(downloads_directory):
         os.makedirs(downloads_directory)

      cutils.upload_to_s3(output_pdf_path, s3_object_key)
      delete_sub_folder(downloads_directory, subfolder) 
      cleanup_files(rendered_html, output_pdf_path, pdf_name)
      logging.info(f"PDF report generated for booking ID {pdf_name}")

   except Exception as e:
      logging.error(f"PDF conversion failed for booking ID{pdf_name}: {e}")
     
@transactional
def generate_hotel_invoice(booking, guests, invoice, invoice_items, background_tasks):
      booking_id = booking["id"]
      invoice_id = invoice["invoice_no"]

      rendered_html = os.path.join(base_directory, const.RENDERED_HTML_DIR, const.HOTEL_INVOICE_HTML)
      reports_path = os.path.join(base_directory, const.REPORTS_DIR)
      invoice_template = env.get_template(const.HOTEL_INVOICE_HTML)
      
      with open(rendered_html, 'w') as fh:
         fh.write(invoice_template.render(
            booking=booking,
            guests=guests,
            invoice=invoice,
            amount_in_words=get_amount_in_sentence(invoice["total_amount"]),
            invoice_items=invoice_items    
         ))
      output_pdf_path = os.path.join(reports_path, f'{booking_id}.pdf')
      background_tasks.add_task(generate_hotel_pdf, rendered_html, output_pdf_path, invoice_id, pdf_name=booking_id, subfolder=booking_id)

@transactional
def update_invoice_event(email: str, booking_id: str, comment=None, reject=False):
   """
   Update the invoice event status (approve or reject) for a booking.

   Args:
      booking_id (str): Booking ID for which the invoice event is updated.
      comment (str): Optional comment for the update.
      reject (bool): Flag indicating whether to reject the invoice.

   Returns:
      dict: A dictionary containing a message indicating the status of the update process.
   """
   if not is_valid_email_for_role(email, Organizer):
      raise ex.EmailNotFound
   comment = comment or ""
   event = InvoiceEvent.INVOICE_REJECTED.value if reject else InvoiceEvent.INVOICE_APPROVED.value
   records_to_update = {"event": event, "comment": comment}

   update_event = crud.update_records(
        VendorInvoices, filter_criteria=[VendorInvoices.booking_id == booking_id, VendorInvoices.event == InvoiceEvent.INVOICE_CREATED.value], 
        records_to_update=records_to_update
    )
   
   if update_event.rowcount > 0:
      event = InvoiceEvent.INVOICE_REJECTED.value if reject else InvoiceEvent.INVOICE_APPROVED.value
      create_invoice_booking_events(booking_id, event, {"comment": comment})
      NotificationSenderFactory.create_notification_sender(booking_id=booking_id, status=event).send_notification()
      return {"message": f"{event} status for booking {booking_id} updated successfully"}
   raise ex.DatabaseOperationFailed(action="update")


@transactional
def update_invoice_info(id: str, invoice_id: str, records_to_update: dict):
   """
   Update invoice information with additional costs and S3 public URL.
   Args:
      booking_id (str): Booking ID for the invoice.
      invoice_id (str): ID of the invoice to update.
      include_additional_distance (bool): Flag indicating whether additional distance cost should be included.
      include_additional_hour (bool): Flag indicating whether additional hour cost should be included.
      additional_distance_cost (float): Additional cost for extra kilometers.
      additional_hour_cost (float): Additional cost for extra hours.

   Returns:
      object: The result of the update operation.
   """
   
   try:

      records_to_update["invoice_id"] = invoice_id

      crud.update_records(
         Invoice, filter_criteria=[Invoice.id == id], records_to_update=records_to_update
      )
      logging.info('Invoice Info updated.')

   except ex.DatabaseOperationFailed as e:
      logging.error(f"Update Invoice Info failed: {str(e)}")
      raise ex.DatabaseOperationFailed(action="update")


def build_invoice_booking_events_json_obj():
   return func.jsonb_build_object(
      "booking_id",
      BookingEvent.booking_id,
      "event",
      BookingEvent.event,
      "meta_data",
      BookingEvent.meta_data,
      "cdate",
      BookingEvent.cdate,
   ).label("invoice_booking_events_json")


@transactional
def get_invoice_history_info(email: str, role: str, booking_id: str):
   """
   Get the invoice history information for a specific booking.

   Args:
      email (str): The email address of the user.
      role (str): The role of the user.
      booking_id (str) : The ID of the booking for which events are retrieved.
      result: dict A dictionary containing a list of invoice booking events for the provided booking.

   Returns:
      List[dict]: List of invoice history events for the specified booking.
   """
   try:
      if not is_valid_email_for_multiple_roles(email, Organizer, Vendor):
         raise ex.EmailNotFound      
      
      filter_conditions = [BookingEvent.booking_id == booking_id, 
                           or_(
                           BookingEvent.event == InvoiceEvent.INVOICE_CREATED.value,
                           BookingEvent.event == InvoiceEvent.INVOICE_APPROVED.value,
                           BookingEvent.event == InvoiceEvent.INVOICE_REJECTED.value,
                              ),]
      order_by = [asc(BookingEvent.cdate)]
      records = crud.select_records(primary_table=BookingEvent, filter_conditions=filter_conditions, order_by=order_by).all()
      
      return {"booking_history": [obj_to_dict.booking_history_as_dict(booking_history) for booking_history in records]}
   
   except SQLAlchemyError:
      raise ex.DatabaseOperationFailed(action="get")

def build_invoice_records_json_obj():
   return func.jsonb_build_object(
      "event",
      VendorInvoices.event,
      "cdate",
      VendorInvoices.cdate,
      "comment",
      VendorInvoices.comment,
      "miscellaneous",
      VendorInvoices.miscellaneous,
      "parking_and_toll",
      VendorInvoices.parking_and_toll,
      "invoice_amount",
      VendorInvoices.invoice_amount,
      "cancellation_amount",
      VendorInvoices.cancellation_amount,
      "base_fare",
      VendorInvoices.base_fare,
      "driver_charge",
      VendorInvoices.driver_charge,
      "discount_percent",
      VendorInvoices.discount_percent,
      "extra_kms",
      VendorInvoices.extra_kms,
      "extra_hrs",
      VendorInvoices.extra_hrs,
      "description",
      VendorInvoices.description,
      ).label("vendor_invoice_json")


def build_client_invoice_records_json_obj():
   return func.jsonb_build_object(
      "base_fare",
      Invoice.base_fare,
      "invoice_amount",
      Invoice.invoice_amount,
      "discount_percent",
      Invoice.discount_percent,
      "description",
      Invoice.description,
      "taxable_sub_total",
      Invoice.taxable_sub_total,
      "non_taxable_sub_total",
      Invoice.non_taxable_sub_total,
      "driver_charge",
      Invoice.driver_charge,
      "parking_and_toll",
      Invoice.parking_and_toll,
      "miscellaneous",
      Invoice.miscellaneous,
      "cancellation_amount",
      Invoice.cancellation_amount,
      "po_number",
      Invoice.po_number
   ).label("client_invoice_json")

@transactional
def get_vendor_invoice_by_booking_id(booking_id):
   select_cols = [build_invoice_records_json_obj()]
   filter_conditions = [VendorInvoices.booking_id == booking_id]

   vendor_invoice_info = crud.select_records(
         primary_table=VendorInvoices,
         select_cols=select_cols,
         filter_conditions=filter_conditions,
      ).scalar()

   if vendor_invoice_info:
      folder_prefix = f"{booking_id}/{const.DOCUMENTS_S3_BUCKET_FOLDER}/"
      documents_urls = cutils.generate_presigned_urls_for_folder(folder_prefix)
      vendor_invoice_info['documents'] = documents_urls

   return vendor_invoice_info

@transactional
def get_client_invoice_by_booking_id(booking_id):
   select_cols = [build_client_invoice_records_json_obj()]
   filter_conditions = [Invoice.booking_id == booking_id]

   client_invoice_info = crud.select_records(
         primary_table=Invoice,
         select_cols=select_cols,
         filter_conditions=filter_conditions,
      ).scalar()
   
   if client_invoice_info:
      folder_prefix = f"{booking_id}/invoices/"
      invoice_urls = cutils.generate_presigned_urls_for_folder(folder_prefix)
      invoice_url = invoice_urls[0] if invoice_urls else None
      client_invoice_info['s3_invoice_url'] = invoice_url
   
   return client_invoice_info

@transactional
def get_vendor_tax_by_booking_id(booking_id):
   select_cols = [Vendor.tax]
   filter_conditions = [Booking.id == booking_id]
   join_conditions = [(Vendor, Vendor.id == Booking.vendor_id)]
   
   return crud.select_records(
         primary_table=Booking,
         select_cols=select_cols,
         filter_conditions=filter_conditions,
         join_conditions=join_conditions,
      ).scalar()

@transactional
def is_booking_cancelled(booking_id):
   filter_conditions = [BookingEvent.booking_id == booking_id, BookingEvent.event.in_([BookingStatus.CANCELLED.value])]
   
   return crud.select_records(
         primary_table=BookingEvent,
         filter_conditions=filter_conditions,
      ).first()

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value, Role.VENDOR.value])
def get_invoice_trip_summary(user: Union[Organizer, Vendor], booking_id: str):
   """
   Get the trip summary for a specific booking id.

   Args:
      email (str): Email of the user.
      role (str): Role of the user.
      booking_id (str): Booking ID for the invoice.

   Returns:
      dict: Trip summary information for the specified invoice.
   """
   try:
      invoice_summary = {
            "vendor_cost": 0,
            "vendor_tax": get_vendor_tax_by_booking_id(booking_id),
            "driver_charge": 0,
            "extra_hour_cost": 0,
            "extra_distance_cost": 0,
            "plan_distance_kms": 0,
            "plan_interval_hrs": 0,
            "calculated_extra_kms": 0,
            "calculated_extra_hrs": 0,
            "invoice_info": {},
            "client_invoice_info": {}
      }

      if not is_booking_cancelled(booking_id):
         booking_record = app_utils.get_model_record_by_id(Booking, booking_id)
         invoice_summary_obj = helpers.InvoiceSummaryGenerator(booking_record)

         trip_summary = invoice_summary_obj.get_invoice_summary()   

         for field in ["vendor_cost", "driver_charge", "extra_hour_cost", "extra_distance_cost", "plan_distance_kms", "plan_interval_hrs", "calculated_extra_hrs", "calculated_extra_kms"] :
            invoice_summary[field] = trip_summary[field]

      invoice_summary['invoice_info'] = get_vendor_invoice_by_booking_id(booking_id)

      invoice_summary['client_invoice_info'] = get_client_invoice_by_booking_id(booking_id)

      invoice_summary["driver_charge"] = invoice_summary["invoice_info"].get("driver_charge", 0) if invoice_summary.get("invoice_info") else invoice_summary.get("driver_charge", 0)

      return invoice_summary
   
   except Exception as e:
      logging.error(f"An error occurred: {e}")
      raise e
   

@transactional
def get_invoice_public_url(email: str, role: str, booking_id: str):
   try:
      # Retrieve the latest s3 invoice public url
      if not is_valid_email_for_role(email, Coordinator):
         raise ex.EmailNotFound
      
      order_by = [desc(Invoice.cdate)]
      select_cols = [Invoice.s3_public_url]
      filter_conditions = [Invoice.booking_id == booking_id, Invoice.event == InvoiceEvent.INVOICE_APPROVED.value]

      s3_public_url = crud.select_records(
            primary_table=Invoice,
            filter_conditions=filter_conditions,
            select_cols=select_cols,
            order_by=order_by
            ).first()
      return {"s3_public_url": s3_public_url[0]} if s3_public_url else {"s3_public_url": None}
   except SQLAlchemyError:
      logging.error(f'Database operation failed during get_invoice_trip_summary', exc_info=True)
      raise ex.DatabaseOperationFailed(action="get")
   

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value, Role.COORDINATOR.value])
def get_client_invoice_presigned_url(user: Union[Organizer, Coordinator], booking_id:str , invoice_type: str, invoice_time: str = None):
   try:
      folder_prefix = f"{booking_id}/{invoice_type}/"
      invoice_url = cutils.get_latest_object_after_time(folder_prefix, invoice_time)
      return {"s3_invoice_url": invoice_url}
   
   except SQLAlchemyError:
      logging.error(f'Database operation failed while getting client invoice public url', exc_info=True)
      raise ex.DatabaseOperationFailed(action="get")


def compress_image(image_bytes):
   # Open image using Pillow
   image = Image.open(io.BytesIO(image_bytes))
   
   # Compress the image
   image = image.convert("RGB")
   image.thumbnail((800, 600))  # Resize the image if needed
   with io.BytesIO() as output:
      image.save(output, format="JPEG", quality=70)
      return output.getvalue()

def store_document(document: SpooledTemporaryFile, filename: str):
   file_byte = document.file.read()

   if document.content_type.startswith('image'):
      s3_url = cutils.upload_and_generate_presigned_url(compress_image(file_byte), filename)
   elif document.content_type == 'application/pdf':
      s3_url = cutils.upload_and_generate_presigned_url(file_byte, filename, content_type = 'application/pdf')
   else:
      raise ex.InvalidTripProofType
   
   return s3_url

def store_documents_in_s3(trip_documents: list[SpooledTemporaryFile], booking_id, folder_name=const.PROOFS_S3_BUCKET_FOLDER):
   doc_urls = []  # List to store generated URLs
   
   if trip_documents:
      for document in trip_documents:
         s3_url = store_document(document, f"{booking_id}/{folder_name}/{document.filename}")
         doc_urls.append(s3_url)

   logging.info('Document URLs:', doc_urls)
   return doc_urls

def apply_sort_condition(column, order):
   return desc(column) if order == "desc" else column

def build_sort_criteria_for_cab_report(sort):
   sort_field_mapping = {
      "invoice_date": Invoice.cdate,
      "invoice_amount": Invoice.invoice_amount,
      "gross_amount": Plan.vendor_cost,
      "booking_date": Booking.booking_datetime,
      "gross_taxable_amount": text("gross_taxable_amount"),
      "gross_non_taxable_amount": text("gross_non_taxable_amount"),
      "total_invoice_amount": text("invoice_amount"),
   }
   return cutils.build_sort_criteria(sort_field_mapping, sort)

def calculate_discount_on_base_fare():
   """
   Calculate the discount amount on the base fare of an invoice.
   Returns:
      float: The discounted amount on the base fare.
   """
   return func.round(
      func.cast(Invoice.base_fare * (Invoice.discount_percent / 100), Numeric), 2
   )

def get_invoice_query(filters):
   return (
      select(
         Invoice.invoice_id.label("invoice_no"),
         Invoice.cdate.label("invoice_date"),
         Booking.bid,
         Coordinator.name.label("booked_by"),
         CostCentre.code.label("client_name"),
         CostCentre.gstin_no.label("client_gst_no"),
         Booking.po_number,
         Package.name.label("tariff_applied"),
         Invoice.base_fare,
         Invoice.discount_percent,
         Invoice.taxable_sub_total.label("gross_taxable_amount"),
         Invoice.cgst_amount.label("cgst"),
         Invoice.sgst_amount.label("sgst"),
         Invoice.non_taxable_sub_total.label("gross_non_taxable_amount"),
         Invoice.invoice_amount.label("total_invoice_amount"),
         literal("-").label("original_invoice_no"),
         Booking.id.label("booking_id"),
         Booking.booking_datetime.label("booking_date")
    )
    .join(Booking, Booking.id == Invoice.booking_id)
    .join(Coordinator, Coordinator.id == Booking.coordinator_id)
    .outerjoin(Plan, Plan.id == Booking.plan_id)
    .outerjoin(Package, Package.id == Plan.package_id)
    .outerjoin(CostCentre, CostCentre.id == Booking.cost_centre_id)
    .outerjoin(VendorInvoices, VendorInvoices.booking_id == Invoice.booking_id)
    .outerjoin(Vendor, Vendor.id == Booking.vendor_id)
)


def get_credit_note_invoice_query(filters):
   return  (
      select(
         CreditNoteInvoice.credit_note_id.label("invoice_no"),
         CreditNoteInvoice.cdate.label("invoice_date"),
         Booking.bid,
         Coordinator.name.label("booked_by"),
         CostCentre.code.label("client_name"),
         CostCentre.gstin_no.label("client_gst_no"),
         Booking.po_number,
         Package.name.label("tariff_applied"),
         CreditNoteInvoice.base_fare,
         CreditNoteInvoice.discount_percent,
         CreditNoteInvoice.taxable_sub_total.label("gross_taxable_amount"),
         CreditNoteInvoice.cgst_amount.label("cgst"),
         CreditNoteInvoice.sgst_amount.label("sgst"),
         CreditNoteInvoice.non_taxable_sub_total.label("gross_non_taxable_amount"),
         CreditNoteInvoice.invoice_amount.label("total_invoice_amount"),
         Invoice.invoice_id.label("original_invoice_no"),
         Booking.id.label("booking_id"),
         Booking.booking_datetime.label("booking_date"),
      )
      .join(Invoice, Invoice.id == CreditNoteInvoice.invoice_id)
      .join(Booking, Booking.id == Invoice.booking_id)
      .join(Coordinator, Coordinator.id == Booking.coordinator_id)
      .outerjoin(Plan, Plan.id == Booking.plan_id)
      .outerjoin(Package, Package.id == Plan.package_id)
      .outerjoin(CostCentre, CostCentre.id == Booking.cost_centre_id)
      .outerjoin(VendorInvoices, VendorInvoices.booking_id == Invoice.booking_id)
      .outerjoin(Vendor, Vendor.id == Booking.vendor_id)
   )
@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def get_invoice_reports(organizer: Organizer, **filters):
   invoice_query = get_invoice_query(filters)

   credit_note_query = get_credit_note_invoice_query(filters)
   
   combined_subquery = invoice_query.union_all(credit_note_query).subquery(name="combined")

   sort_exp = filters.get("sort")

   if sort_exp:
      sort_field_mapping = {
         "invoice_date": combined_subquery.c.invoice_date,
         "gross_taxable_amount": combined_subquery.c.gross_taxable_amount,
         "gross_non_taxable_amount": combined_subquery.c.gross_non_taxable_amount,
         "total_invoice_amount": combined_subquery.c.total_invoice_amount
      }
      order_by =  cutils.build_sort_criteria(sort_field_mapping, sort_exp)
   else:
      order_by = [desc(combined_subquery.c.invoice_date)]
   
   filter_conditions = build_filter_conditions(combined_subquery, filters)

   final_query_select_cols = [
      func.row_number().over(order_by=order_by).label("sno"),
      combined_subquery.c.invoice_no,
      cutils.format_booking_datetime(combined_subquery.c.invoice_date, const.DATE_FORMAT).label("invoice_date"),
      combined_subquery.c.bid,
      combined_subquery.c.booked_by,
      combined_subquery.c.client_name,
      combined_subquery.c.client_gst_no,
      combined_subquery.c.po_number,
      combined_subquery.c.tariff_applied,
      combined_subquery.c.base_fare,
      combined_subquery.c.discount_percent,
      combined_subquery.c.gross_taxable_amount,
      combined_subquery.c.cgst,
      combined_subquery.c.sgst,
      combined_subquery.c.gross_non_taxable_amount,
      combined_subquery.c.total_invoice_amount,
      combined_subquery.c.original_invoice_no,
      combined_subquery.c.booking_id,
      combined_subquery.c.booking_date
   ]
   
   final_query = crud.select_records(primary_table=combined_subquery, select_cols=final_query_select_cols, filter_conditions=filter_conditions)

   columns = const.INVOICE_REPORT_COLUMNS

   # ---- Download Excel ----
   if filters.get("download"):
      result = final_query.all()
      invoice_reports = cutils.rows_to_dict_list(columns, result)
      df = pd.DataFrame(invoice_reports, columns=columns)
      return generate_excel_stream_response(df)

   # ---- Pagination ----
   limit = filters.get("limit", 10)
   page = filters.get("page", 1)
   offset = (page - 1) * limit

   result = final_query.limit(limit).offset(offset).all()
   total_records = final_query.count()
   invoice_reports = cutils.rows_to_dict_list(columns, result)

   return {
      "page": page,
      "total_records": total_records,
      "records_per_page": limit,
      "total_pages": (total_records + limit - 1) // limit,
      "invoice_reports": invoice_reports,
      "headers": columns,
    }

def build_filter_conditions(combined_subquery, filters):
    curr_date = booking_utils.get_local_timestamp(timezone=const.TARGET_TZ).date()
    filter_conditions = []

    for key, value in filters.items():
        if value is None or value == "":
            continue  # Skip empty or None values
        elif key == "bid":
            filter_conditions.append(combined_subquery.c.bid == value)
        elif key == "cost_centre":
            filter_conditions.append(combined_subquery.c.client_name.in_(value))
        elif key == "invoice_date":
            date_obj = booking_utils.parse_date(value)
            filter_conditions.append(booking_utils.filter_by_date(combined_subquery.c.invoice_date, date_obj))
        elif key == "invoice_start_date":
            date_obj = booking_utils.parse_date(value)
            filter_conditions.append(booking_utils.filter_by_start_date(combined_subquery.c.invoice_date, date_obj))
        elif key == "invoice_end_date":
            date_obj = booking_utils.parse_date(value)
            filter_conditions.append(booking_utils.filter_by_end_date(combined_subquery.c.invoice_date, date_obj))
        elif key == "today":
            local_datetime = booking_utils.convert_booking_datetime(combined_subquery.c.booking_date)
            filter_conditions.append(func.date_trunc('day', local_datetime) == curr_date)
        elif key == "this_week":
            current_weekday = curr_date.weekday()
            days_to_saturday = 5 - current_weekday
            saturday_date = curr_date + timedelta(days=days_to_saturday)
            local_datetime = booking_utils.convert_booking_datetime(combined_subquery.c.booking_date)
            filter_conditions.append(func.date_trunc('day', local_datetime).between(curr_date, saturday_date))

    return filter_conditions

def generate_excel_stream_response(df: pd.DataFrame) -> StreamingResponse:
    """
    Generates a streaming response for an Excel file containing the provided DataFrame.
    Param:
    - df (pd.DataFrame): The DataFrame to be converted to Excel.
    Returns:
    - StreamingResponse: A streaming response object representing the Excel file.
    """
    # Write DataFrame to Excel buffer
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer) as writer:
        df.to_excel(writer, index=False)
    
    # Return StreamingResponse
    return StreamingResponse(
        io.BytesIO(buffer.getvalue()),
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={"Content-Disposition": f"attachment; filename=data.xlsx", "Content-Length": str(buffer.getbuffer().nbytes)}
   )

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def get_invoice_data_by_booking_id(organizer: Organizer, booking_id: str):
   invoice_record = get_invoice(booking_id)
   if not invoice_record:
      raise ex.RecordNotFound(model="Invoice")
   
   folder_prefix = f"{booking_id}/{const.PROOFS_S3_BUCKET_FOLDER}/"
   documents_urls = cutils.generate_presigned_urls_for_folder(folder_prefix)
   
   return {
      "id": invoice_record.id,
      "base_fare": invoice_record.base_fare,
      "extra_kms": invoice_record.extra_kms,
      "extra_hrs": invoice_record.extra_hrs,
      "extra_distance_cost": invoice_record.extra_distance_cost,
      "extra_hour_cost": invoice_record.extra_hour_cost,
      "driver_charge": invoice_record.driver_charge,
      "miscellaneous": invoice_record.miscellaneous,
      "parking_and_toll": invoice_record.parking_and_toll,
      "discount_percent": invoice_record.discount_percent,
      "description": invoice_record.description,
      "cancellation_amount": invoice_record.cancellation_amount,
      "documents": documents_urls,
   }
   
@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def get_credit_note_invoice_data_by_invoice_id(organizer: Organizer, invoice_id: int):
   invoice_record = get_credit_note_invoice(invoice_id)
   if not invoice_record:
      raise ex.RecordNotFound(model="Credit Note Invoice")
   
   return {
      "id": invoice_record.id,
      "base_fare": invoice_record.base_fare,
      "extra_kms": invoice_record.extra_kms,
      "extra_hrs": invoice_record.extra_hrs,
      "extra_distance_cost": invoice_record.extra_distance_cost,
      "extra_hour_cost": invoice_record.extra_hour_cost,
      "driver_charge": invoice_record.driver_charge,
      "miscellaneous": invoice_record.miscellaneous,
      "parking_and_toll": invoice_record.parking_and_toll,
      "discount_percent": invoice_record.discount_percent,
      "description": invoice_record.description,
      "cancellation_amount": invoice_record.cancellation_amount,
   }

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def get_invoice_tariff_plan_summary(
   organizer: Organizer, booking_id: int, package_id: int, vehicle_id: int
):
   booking_record = get_booking_by_booking_id(booking_id)
   if not booking_record.city_id:
      raise ex.BadRequestException(msg="City information is missing for this booking.")
   
   tariff_plan_record = cutils.get_tariff_plan_by_filters(booking_record.city_id, package_id, vehicle_id)
   if not tariff_plan_record:
      raise ex.BadRequestException(msg="City information is missing for this booking.")
   
   trip_record = get_trip_record_by_booking_id(booking_id)
   if not trip_record:
      raise ex.RecordNotFound(model="Trip")

   vendor_invoice = get_vendor_invoice_by_booking_id(booking_id)
   if not vendor_invoice:
      raise ex.RecordNotFound(model="Vendor Invoice")

   total_distance = trip_record.distance
   package_distance = tariff_plan_record["package"]["distance_kms"]
   total_duration = trip_record.duration
   package_duration = tariff_plan_record["package"]["interval_hrs"]

   extra_kms = (
      total_distance - package_distance if total_distance > package_distance else 0
   )
   extra_hrs = (
      total_duration - package_duration if total_duration > package_duration else 0
   )

   # Tariff Plan Particulars
   base_fare = tariff_plan_record["cost"]
   extra_distance_cost = tariff_plan_record["extra_distance_cost"]
   extra_hour_cost = tariff_plan_record["extra_hour_cost"]

   # Vendor Invoice Particulars
   driver_charge = vendor_invoice["driver_charge"]
   parking_and_toll = vendor_invoice["parking_and_toll"]
   miscellaneous = vendor_invoice["miscellaneous"]

   return {
      "base_fare": base_fare,
      "extra_kms": extra_kms,
      "extra_hrs": extra_hrs,
      "extra_distance_cost": extra_distance_cost,
      "extra_hour_cost": extra_hour_cost,
      "driver_charge": driver_charge,
      "parking_and_toll": parking_and_toll,
      "miscellaneous": miscellaneous,
      "discount_percent": 0,
      "description": "",
      "cancellation_amount": 0,
   }