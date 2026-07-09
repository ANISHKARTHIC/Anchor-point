import json
from app_models import crud
from app_models.models import Booking, Coordinator, CostCentre, HotelBooking, Organizer, Package, Plan, Trip, TripEvent, Vehicle, VehicleModel, Vendor, Driver, VendorBookings, VendorCity, VendorGarageLocation, VendorHotelBookings, VendorInvoices
from app_routes.booking.schema import BookingStatus
from app_routes.hotel_bookings.schema import VendorHotelBookingStatus
from app_routes.plan.utils import build_plan_json
from app_routes.trip.schema import TripStatus
from app_routes.trip.utils import insert_new_trip_event
from app_routes.vendor.schema import TripInfo, VendorBase, VendorBookingStatus, VendorGarageLocationBase, VendorUpdate
from app_routes.invoice.schema import InvoiceEvent
from app_schemas.schema import Role
from app_utils.utils import build_coordinator_json, get_booking_by_booking_id, get_trip_record_by_booking_id, get_vendor_invoice_by_booking_id, latest_booking_event_query
from app_routes.booking import utils as booking_utils
from common_utils import utils as cutils
from app_utils.decorators import authentic_user, transactional, email_exists_or_raise, verify_jwt_role_and_email
from app_routes.organizer.utils import build_organizer_json, super_organizer_only
from app_routes.invoice.utils import store_documents_in_s3, create_invoice_booking_events
from app_utils import exception as ex
from app_utils import utils as app_utils
from sqlalchemy import func, exc, case, Integer, desc, and_, or_
from itertools import chain
from typing import List, Union
from logger import logger as logging
from app_configs import constants as const
from sqlalchemy.orm import aliased
from common_utils import utils as cutils , obj_to_dict

def build_vendor_json():
    return func.jsonb_build_object(
        "id",
        Vendor.id,
        "name",
        Vendor.name,
        "email",
        Vendor.email,
        "primary_mobile",
        Vendor.primary_mobile,
        "secondary_mobile",
        Vendor.secondary_mobile,
        "address",
        Vendor.address,
        "vendor_type",
        Vendor.vendor_type,
        "is_third_party",
        Vendor.is_third_party,
        "city_id",
        Vendor.city_id,
        "city",
        VendorCity.city,
        "coordinates",
        Vendor.coordinates,
        "tax",
        Vendor.tax,
        "is_verified",
        Vendor.is_verified,
        "is_active",
        Vendor.is_active,
    ).label("vendor_json")


@transactional
@authentic_user(Vendor)
def login(vendor: Vendor) -> dict:
    """
    Logs in an vendor by verifying their email and password.
    Args:
        vendor (Vendor): An instance of Vendor model.
    Returns:
        dict: A dictionary containing the access token and a login success message if login is successful.
    Raises:
        HTTPException:
            -401 Unauthorized : If the password is incorrect.
            -404 Not found: If the given email not present in db.
    """
    payload = {"email": vendor.email, "role": Role.VENDOR.value}
    access_token = cutils.create_access_token(payload).get("access_token")
    cutils.update_login_status(Vendor, vendor.email)
    return {
        "id": vendor.id,
        "name": vendor.name,
        "email": vendor.email,
        "vendor_type": vendor.vendor_type,
        "is_third_party": vendor.is_third_party,
        "is_active": vendor.is_active,
        "is_verified": vendor.is_verified,
        "access_token": access_token,
        "message": "Logged in successfully",
    }

@transactional
def prepare_vendor_records(vendors: List[VendorBase]):
    """
    Prepare vendor records with necessary data.
    Args:
        vendors (List[OrganizerModel    ]): List of vendors to be created.
    Returns:
        List[dict]: List of prepared vendor records.
    """
    return [
        {**vendor.model_dump(exclude_unset=True), "password": cutils.generate_password()}
        for vendor in vendors
    ]


def insert_vendor_records(records: List[dict]) -> List[dict]:
    """
    Insert vendor records into the database after hashing passwords.
    Args:
        records (List[dict]): List of vendor records with plain passwords.
    Returns:
        List[dict]: List of inserted vendor records with hashed passwords.
    """
    try:
        records = [
            {**record, "password": cutils.get_hashed_password(record["password"])}
            for record in records
        ]
        return crud.insert_records(Vendor, records=records)
    except exc.SQLAlchemyError:
        raise ex.DatabaseOperationFailed(action="insert")


def send_acc_creation_emails(vendors: List[dict]):
    """
    Send account creation confirmation emails to vendors.
    Args:
        vendors (List[dict]): List of vendors to whom the emails should be sent.
    """
    for vendor in vendors:
        subject, body = cutils.vendor_acc_creation_mail_content(
            vendor_name=vendor["name"],
            vendor_email=vendor["email"],
            vendor_password=vendor["password"],
        )
        cutils.send_mail(recipient_email=vendor["email"], subject=subject, body=body)


@transactional
@super_organizer_only
def create_vendor(super_organizer: Organizer, vendor: VendorBase) -> dict:
    """
    Create vendor account and send confirmation email.
    Args:
        super_organizer (Organizer): The super organizer initiating the creation.
        vendor (VendorBase): Vendor model to be created.
    Returns:
        dict: A dictionary containing a success message upon successful creation.
    """
    try:
        existing_record = crud.select_records(Vendor, filter_conditions=[Vendor.email == vendor.email]).first()

        if existing_record:
            raise ex.RecordExists(field_name="email", field_value=vendor.email)   
                 
        password = cutils.generate_password()
        hash_password = cutils.get_hashed_password(password)
        records_to_insert = {**vendor.model_dump(exclude_unset=True), "password": hash_password}
        new_record = crud.insert_record(Vendor, **records_to_insert)
        if not new_record.is_third_party:
            subject, body = cutils.vendor_acc_creation_mail_content(
                vendor_name=vendor.name,
                vendor_email=vendor.email,
                vendor_password=password,
            )
            cutils.send_mail(recipient_email=vendor.email, subject=subject, body=body)
        return {"email": new_record.email, "message": "Successfully created new vendor account"}

    except exc.SQLAlchemyError:
        raise ex.DatabaseOperationFailed(action="insert")


@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.COORDINATOR.value, Role.ORGANIZER.value])
def get_vendors(user: Union[Coordinator, Organizer], city, vendor_type):
    select_cols = [build_vendor_json()]
    join_conditions = [(VendorCity, VendorCity.id == Vendor.city_id)]
    filter_conditions = []
    
    if city:
        filter_conditions.append(VendorCity.city.ilike(city))
    if vendor_type:
        filter_conditions.append(Vendor.vendor_type.ilike(vendor_type))

    records = crud.select_records(
        primary_table=Vendor, select_cols=select_cols, 
        join_conditions=join_conditions, 
        filter_conditions=filter_conditions,
        order_by=[Vendor.name]
    ).all()
    return {"vendors": list(chain.from_iterable(records))}


@transactional
def get_vendor_by_id(email: str, role: str, vendor_id: int):
    model = {"organizer": Organizer, "vendor": Vendor}.get(role)
    if not model:
        raise ex.InvalidRole

    if not app_utils.is_valid_email_for_role(email, model):
        raise ex.EmailNotFound

    select_cols = [build_vendor_json()]
    join_conditions = [(VendorCity, VendorCity.id == Vendor.city_id)]
    record = crud.select_records(
        primary_table=Vendor,
        select_cols=select_cols,
        join_conditions=join_conditions,
        filter_conditions=[Vendor.id == vendor_id],
    ).scalar()
    if not record:
        raise ex.RecordNotFound(model="Vendor")
    return {"vendor": record}


@transactional
@super_organizer_only
def update_vendor_by_id(
    organizer: Organizer, vendor_id: int, update_vendor_request: VendorUpdate
):
    if get_vendor_by_id(organizer.email, Role.ORGANIZER.value, vendor_id).get("vendor"):
        filter_criteria = [Vendor.id == vendor_id]
        records_to_update = update_vendor_request.model_dump(exclude_unset=True)
        result = crud.update_records(
            Vendor, filter_criteria=filter_criteria, records_to_update=records_to_update
        )
        if result.rowcount:
            return {"message": "Vendor updated successfully"}
        raise ex.DatabaseOperationFailed(action="update")


@transactional
@super_organizer_only
def delete_vendor_by_id(organizer: Organizer, vendor_id: int):
    if get_vendor_by_id(organizer.email, Role.ORGANIZER.value, vendor_id).get("vendor"):
        filter_criteria = [Vendor.id == vendor_id]
        records_to_update = {"is_active": False}
        result = crud.update_records(
            Vendor, filter_criteria=filter_criteria, records_to_update=records_to_update
        )
        if result.rowcount:
            return {"message": "Vendor deleted successfully"}
        raise ex.DatabaseOperationFailed(action="delete")


@transactional
def get_driver_by_id(driver_id):
    result = crud.select_records(
        primary_table=Driver, filter_conditions=[Driver.id == driver_id]
    ).first()
    if result:
        return result
    raise ex.DriverNotFound


@transactional
def get_driver_info_by_booking_id(vendor: Vendor, booking_id: str):
    booking_record = get_booking_by_booking_id(booking_id)
    select_cols = [
        func.json_build_object(
            "id",
            Driver.id,
            "name",
            Driver.name,
            "vehicle_no",
            Driver.vehicle_no,
            "primary_mobile",
            Driver.primary_mobile,
            "secondary_mobile",
            Driver.secondary_mobile,
        )
    ]
    filter_conditions = [Driver.id == booking_record.driver_id]
    driver_record = crud.select_records(
        primary_table=Driver,
        select_cols=select_cols,
        filter_conditions=filter_conditions,
    ).scalar()
    return {"driver": driver_record}

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value, Role.VENDOR.value])
def add_invoice_info(user, booking_id, driver_charge, base_fare,
      invoice_amount, cancellation_amount, description, discount_percent, miscellaneous, parking_and_toll, 
      extra_kms_amount, extra_hrs_amount, plan_id, extra_kms_qty, extra_hrs_qty, trip_documents):

    """
    Add invoice information for a vendor.

    Args:
        booking_id (str): The booking ID associated with the invoice.
        invoice_number (str): The invoice number.
        cgst_amount (float): The CGST amount.
        sgst_amount (float): The SGST amount.
        invoice_amount (float): The total invoice amount.
        trip_documents (list): List of trip documents to store in S3.
        email (str): The email address of the vendor.

    Returns:
        dict: A message indicating the success of the operation.

    Raises:
        ex.EmailNotFound: If the provided email does not belong to a valid vendor.
        ex.DatabaseOperationFailed: If the database operation fails.
    """
    records_to_insert_or_update = {
        "booking_id": booking_id,
        "event": InvoiceEvent.INVOICE_CREATED.value,
        "invoice_amount": invoice_amount,
        "cancellation_amount": cancellation_amount,
        "miscellaneous": miscellaneous,
        "parking_and_toll": parking_and_toll,
        "driver_charge": driver_charge,
        "base_fare": base_fare,
        "discount_percent": discount_percent,
        "extra_kms": extra_kms_amount,
        "extra_hrs": extra_hrs_amount,
        "extra_kms_qty": extra_kms_qty,
        "extra_hrs_qty": extra_hrs_qty,
        "plan_id": plan_id,
        "description": description or "",
        "comment": ""
    }
    vendor_invoice = app_utils.get_vendor_invoice_by_booking_id(booking_id)
    
    if not vendor_invoice:
        result = crud.insert_record(VendorInvoices, **records_to_insert_or_update)
        if not result:
            raise ex.DatabaseOperationFailed(action="insert")        
    else:
        filter_criteria = [VendorInvoices.booking_id == booking_id]
        result = crud.update_records(VendorInvoices, filter_criteria, records_to_insert_or_update)
        if not result.rowcount:
            raise ex.DatabaseOperationFailed(action="update")
        
    create_invoice_booking_events(booking_id, event = InvoiceEvent.INVOICE_CREATED.value, meta_data={})

    if trip_documents:
        store_documents_in_s3(trip_documents, booking_id, folder_name=const.DOCUMENTS_S3_BUCKET_FOLDER)   

    return {"message": "Vendor Invoice details successfully added."}


def get_vendor_booking_json(booking):
    booking_id, bid, booking_type, cab_type, plan_id, pickup_date, pickup_time, coordinator_id, coordinator_name, coordinator_email, status, meta_data = booking
    return {
        "id": booking_id,
        "bid": bid,
        "type": booking_type,
        "cab_type": cab_type,
        "plan_id": plan_id,
        "pickup_date": pickup_date,
        "pickup_time": pickup_time,
        "coordinator": {
            "id": coordinator_id,
            "name": coordinator_name,
            "email": coordinator_email,
        },
        "status": status,
        "meta_data": meta_data
    }

def get_vendor_status_condition(latest_booking_event):
    return case((VendorBookings.status != VendorBookingStatus.REASSIGNED.value, latest_booking_event.c.event),
        else_="vendor_reassigned")
   
def get_vendor_meta_data_condition(latest_booking_event):
    return case((VendorBookings.status != VendorBookingStatus.REASSIGNED.value, latest_booking_event.c.meta_data),
        else_=json.dumps({"message": "The booking has been assigned to a different vendor"}))
    
def get_vendor_plan_condition():
    return case((VendorBookings.status == VendorBookingStatus.OWNED.value, Booking.plan_id),
        else_=VendorBookings.meta_data["plan_id"].astext.cast(Integer))

def get_driver_condition():
    return case((and_(VendorBookings.status != VendorBookingStatus.REASSIGNED.value, Booking.driver_id != None), 
        booking_utils.build_driver_json()), else_=None)


def build_filter_conditions(filters, latest_booking_event):
    curr_date = booking_utils.get_local_timestamp(timezone=const.TARGET_TZ).date()
    filter_conditions = []

    for key, value in filters.items():
        if value is None or value == "":
            continue  # Skip empty or None values
        if key == "booking_type":
            filter_conditions.append(Booking.type.in_(value))
        elif key == "cab_type":
            filter_conditions.append(Booking.cab_type.in_(value))
        elif key == "status":
            if BookingStatus.VENDOR_REASSIGNED.value in value:
                filter_conditions.append(or_(latest_booking_event.c.event.in_(value), VendorBookings.status == VendorBookingStatus.REASSIGNED.value))
            elif BookingStatus.INVOICE_APPROVED.value in value:
                value = value + [InvoiceEvent.INVOICE_CREATED_BY_ORGANIZER.value, InvoiceEvent.INVOICE_CREATED_BY_SUPER_ORGANIZER.value]
                filter_conditions.append(latest_booking_event.c.event.in_(value))
            else:
                filter_conditions.append(latest_booking_event.c.event.in_(value))
        elif key == "vendor_city":
            filter_conditions.append(VendorCity.city.in_(value))
        elif key == "coordinator":
            filter_conditions.append(Coordinator.name.in_(value))
        elif key == "organizer":
            filter_conditions.append(Organizer.name.in_(value))
        elif key == "vendor_id":
            filter_conditions.append(VendorBookings.vendor_id == value)
        elif key == "driver":
            filter_conditions.append(Driver.name.in_(value))
        elif key == "bid":
            filter_conditions.append(Booking.bid == value)
        elif key == "pickup_date":
            date_obj = booking_utils.parse_date(value)
            filter_conditions.append(booking_utils.filter_by_date(Booking.booking_datetime, date_obj))
        elif key == "pickup_start_date":
            date_obj = booking_utils.parse_date(value)
            filter_conditions.append(booking_utils.filter_by_start_date(Booking.booking_datetime, date_obj))
        elif key == "pickup_end_date":
            date_obj = booking_utils.parse_date(value)
            filter_conditions.append(booking_utils.filter_by_end_date(Booking.booking_datetime, date_obj))
        elif key == "pickup_start_datetime":
            filter_conditions.append(Booking.booking_datetime >= app_utils.convert_date_str_to_utc(value))
        elif key == "pickup_end_datetime":
            filter_conditions.append(Booking.booking_datetime <= app_utils.convert_date_str_to_utc(value))
        elif key == "today":
            filter_conditions.append(booking_utils.filter_by_today(curr_date))
        elif key == "this_week":
            filter_conditions.append(booking_utils.filter_by_this_week(curr_date))
        elif key == "travel_mode":
            filter_conditions.append(Booking.travel_mode.in_(value))
            
    return filter_conditions

@transactional
@email_exists_or_raise(Vendor)
def get_booking_info(vendor: Vendor, **filters):
    latest_booking_event = aliased(latest_booking_event_query())
    plan_condition = get_vendor_plan_condition()
    BookingCity = aliased(VendorCity)
    select_cols = [
        "id",
        Booking.id,
        "bid",
        Booking.bid,
        "type",
        Booking.type,
        "cab_type",
        Booking.cab_type,
        "pickup_date",
        cutils.format_booking_datetime(Booking.booking_datetime, const.DATE_FORMAT),
        "pickup_time",
        cutils.format_booking_datetime(Booking.booking_datetime, const.TIME_FORMAT),
        "description",
        Booking.description,
        "coordinator",
        case((Booking.coordinator_id != None, build_coordinator_json()), else_=None),
        "organizer",
        case((Booking.organizer_id != None, build_organizer_json()), else_=None),
        "vendor", 
        case((Booking.vendor_id != None, build_vendor_json()), else_=None),
        "driver",
        get_driver_condition(),
        "plan_id",
        plan_condition,
        "plan",
        build_plan_json(),
        "status",
        get_vendor_status_condition(latest_booking_event),
        "meta_data",
        get_vendor_meta_data_condition(latest_booking_event),
        "cost_centre",
        app_utils.build_cost_centre_json(),
        "travel_mode",
        Booking.travel_mode,
        "po_number",
        Booking.po_number,
        "booking_city",
        case((Booking.city_id != None, app_utils.build_city_json(BookingCity)), else_=None),        "garage_location",
        VendorBookings.meta_data["garage_location"].astext
    ]
    join_conditions = [
        (Booking, Booking.id == VendorBookings.booking_id, 'left'),
        (Coordinator, Coordinator.id == Booking.coordinator_id, 'left'),
        (Organizer, Organizer.id == Booking.organizer_id, 'left'),
        (Vendor, Vendor.id == Booking.vendor_id, 'left'),
        (Driver, Driver.id == Booking.driver_id, 'left'),
        (Plan, Plan.id == plan_condition, 'left'),
        (Package, Package.id == Plan.package_id, 'left'),
        (latest_booking_event, latest_booking_event.c.booking_id == VendorBookings.booking_id, 'left'),
        (BookingCity, BookingCity.id == Booking.city_id, 'left'),
        (VendorCity, VendorCity.id == Vendor.city_id, 'left'),
        (Vehicle, Vehicle.id == Plan.vehicle_id, 'left'),
        (VehicleModel, VehicleModel.id == Vehicle.vehicle_model_id, 'left'),
        (CostCentre, CostCentre.id == Booking.cost_centre_id, 'left')
    ]
    group_by = [
            Booking.id, latest_booking_event.c.event, latest_booking_event.c.meta_data, VendorBookings.status, VendorBookings.meta_data, VendorBookings.cdate, 
            Coordinator.id, Organizer.id, Vendor.id, VendorCity.city, BookingCity.id,
            Driver.id, Plan.id, Package.id, Vehicle.id, VehicleModel.vehicle_model,
            CostCentre.id, CostCentre.code, CostCentre.gstin_no
        ]
    order_by = [desc(VendorBookings.cdate)]

    select_cols = [func.jsonb_build_object(*select_cols)]

    limit = filters.get("limit", 10)
    page = filters.get("page", 1)
    offset = (page - 1) * limit

    filter_conditions = build_filter_conditions(filters, latest_booking_event)

    query = crud.select_records(
        primary_table=VendorBookings,
        select_cols=select_cols,
        join_conditions=join_conditions,
        filter_conditions=filter_conditions,
        group_by=group_by,
        order_by=order_by,
    )
    result = query.limit(limit).offset(offset).all()
    total_bookings = query.count()
    booking_records = list(chain.from_iterable(result))

    return {
        "page": page,
        "total_records": total_bookings,
        "records_per_page": limit,
        "total_pages": (total_bookings + limit - 1) // limit,
        "bookings": booking_records,
    }

def build_vendor_city_json():
    return func.jsonb_build_object(
        "id",
        VendorCity.id,
        "city",         
        VendorCity.city,
    ).label("vendor_city_json")

def get_vendor_city_by_name(city_name: str):
    return crud.select_records(
        primary_table=VendorCity,
        filter_conditions=[VendorCity.city.ilike(city_name), VendorCity.is_active == True],
    ).first()

@transactional
@email_exists_or_raise(Organizer)
def create_vendor_city(organizer: Organizer, city: str) -> dict:
    if cutils.is_record_present(VendorCity, "city", city):
        raise ex.RecordExists(field_name="Vendor city", field_value=city)    
    
    vendor_city = crud.insert_record(VendorCity, city=city)
    return {
        "vendor_city_id": vendor_city.id,
        "vendor_city": city,
        "message": "Successfully created new vendor city",
    }

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.COORDINATOR.value, Role.ORGANIZER.value])
def get_vendor_cities(user: Union[Coordinator, Organizer]):
    select_cols = [build_vendor_city_json()]
    filter_conditions=[VendorCity.is_active == True]
    order_by = [VendorCity.city]
    records = crud.select_records(
        primary_table=VendorCity, 
        select_cols=select_cols,
        filter_conditions=filter_conditions, 
        order_by=order_by
    ).all()
    return {"vendor_city": list(chain.from_iterable(records))}

@transactional
@email_exists_or_raise(Organizer)
def get_vendor_city_by_id(organizer: Organizer, vendor_city_id: int):
    select_cols = [build_vendor_city_json()]
    filter_conditions=[VendorCity.id == vendor_city_id, VendorCity.is_active == True]
    record = crud.select_records(
        primary_table=VendorCity,
        select_cols=select_cols,
        filter_conditions=filter_conditions,
    ).first()
    if not record:
        raise ex.RecordNotFound(model=f"Vendor city with id {vendor_city_id}")
    return record.vendor_city_json


@transactional
@email_exists_or_raise(Organizer)
def update_vendor_city(
    organizer: Organizer, vendor_city_id: int, vendor_city: str
):
    try:
        vendor_city_record = get_vendor_city_by_id(organizer, vendor_city_id).get(
            "vendor_city"
        )
        if cutils.is_record_present(VendorCity, "city", vendor_city, vendor_city_id):
            raise ex.RecordExists(field_name="Vendor city", field_value=vendor_city)

        filter_criteria = [VendorCity.id == vendor_city_id]
        records_to_update = {"city": vendor_city}
        result = crud.update_records(
            VendorCity,
            filter_criteria=filter_criteria,
            records_to_update=records_to_update,
        )
        if result.rowcount:
            return {
                "vendor_city_id": vendor_city_id,
                "message": "Successfully updated vendor city",
            }
        raise ex.DatabaseOperationFailed(action="update")
    except exc.IntegrityError as err:
        logging.error(err)
        raise ex.RecordExists(field_name="vendor city", field_value=vendor_city)


@transactional
@email_exists_or_raise(Organizer)
def delete_vendor_city(organizer: Organizer, vendor_city_id: int):
    vendor_city_record = get_vendor_city_by_id(organizer, vendor_city_id).get(
        "vendor_city"
    )
    filter_criteria = [VendorCity.id == vendor_city_id]
    records_to_update = {"is_active": False} 
    result = crud.update_records(VendorCity, filter_criteria=filter_criteria, records_to_update=records_to_update)
    
    if not result.rowcount:
        raise ex.DatabaseOperationFailed(action="delete")
    return {
        "vendor_city_id": vendor_city_id,
        "message": "Successfully deleted vendor city",
    }


@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def get_vendor_hotel_booking_request(organizer: Organizer, booking_id: str):
    select_cols = [
        func.jsonb_build_object(
            "vendor",  func.jsonb_build_object(
                "id", Vendor.id,
                "name", Vendor.name,
                "is_third_party", Vendor.is_third_party
            ),
            "created_at", booking_utils.convert_booking_datetime(VendorHotelBookings.cdate)    
    )]
    join_conditions = [(Vendor, Vendor.id == VendorHotelBookings.vendor_id)]
    filter_conditions = [VendorHotelBookings.booking_id == booking_id, VendorHotelBookings.status == VendorBookingStatus.REQUESTED.value]
    order_by = [VendorHotelBookings.cdate]
    
    result = crud.select_records(
        primary_table=VendorHotelBookings,
        select_cols=select_cols,
        join_conditions=join_conditions,
        filter_conditions=filter_conditions,
        order_by=order_by,
    ).all()
    return {"bookings": list(chain.from_iterable(result))}

def get_trip_info(column, value):
    filter_conditions = [column == value]
    result = crud.select_records(Trip, filter_conditions=filter_conditions).first()
    return result

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.VENDOR.value])
def create_trip_info(vendor: Vendor, trip_info_request: TripInfo):
    cur_utc_time = cutils.current_utc_time()
    trip_record = get_trip_info(Trip.booking_id, trip_info_request.booking_id)
    
    if trip_record:
    
        filter_conditions = [Trip.booking_id == trip_info_request.booking_id]
        records_to_update = {**trip_info_request.model_dump(exclude_unset=True), "mdate": cur_utc_time}
        result = crud.update_records(Trip, filter_criteria=filter_conditions, records_to_update=records_to_update)
        
        if not result.rowcount:
            raise ex.DatabaseOperationFailed(action="update")    
    
    else:
        trip_record = crud.insert_record(
            Trip, 
            booking_id = trip_info_request.booking_id,
            starting_odo = trip_info_request.starting_odo,
            starting_time = trip_info_request.starting_time,
            ending_odo = trip_info_request.ending_odo,
            ending_time = trip_info_request.ending_time,
            distance = trip_info_request.distance,
            duration = trip_info_request.duration,
            cdate = cur_utc_time,
            mdate = cur_utc_time
        )
        
    insert_new_trip_event(trip_id=trip_record.id, event=TripStatus.COMPLETED.value)
    return {
        "trip": obj_to_dict.trip_info_as_dict(trip_record),
        "message": "Successfully created trip"
    }

@transactional
def get_lastest_trip_event(trip_id: int):
    filter_conditions = [TripEvent.trip_id == trip_id] 
    order_by = [desc(TripEvent.cdate)]
    return crud.select_records(TripEvent, filter_conditions=filter_conditions, order_by=order_by).limit(1).first()

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.VENDOR.value])
def update_trip_info(vendor: Vendor, trip_id: int , update_trip_info_request: TripInfo):
    cur_utc_time = cutils.current_utc_time()
    filter_conditions = [Trip.id == trip_id]
    records_to_update = {**update_trip_info_request.model_dump(exclude_unset=True), "mdate": cur_utc_time}

    trip_record = get_trip_info(Trip.id, trip_id)
    if not trip_record:
        raise ex.RecordNotFound(model="Trip")

    result = crud.update_records(Trip, filter_criteria=filter_conditions, records_to_update=records_to_update)
    
    if not result.rowcount:
        raise ex.DatabaseOperationFailed(action="update")
    
    latest_trip_event = get_lastest_trip_event(trip_id)
    if latest_trip_event.event != TripStatus.COMPLETED.value:
        insert_new_trip_event(trip_id=trip_record.id, event=TripStatus.COMPLETED.value)

    return {
        "trip_id": trip_id,
        "message": "Successfully update trip details"
    }

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def create_vendor_garage_location(organizer: Organizer, vendor_garage_location_request: VendorGarageLocationBase):
    try:
        cur_utc_time = cutils.current_utc_time()
        vendor_garage_location_record = crud.insert_record(
            VendorGarageLocation, 
            vendor_id = vendor_garage_location_request.vendor_id,
            city_id = vendor_garage_location_request.city_id,
            title = vendor_garage_location_request.title,
            latitude = vendor_garage_location_request.latitude,
            longitude = vendor_garage_location_request.longitude,
            address = vendor_garage_location_request.address,
            cdate = cur_utc_time,
            mdate = cur_utc_time
        )
        return {
            "vendor_garage_location": obj_to_dict.vendor_garage_location_as_dict(vendor_garage_location_record),
            "message": "Successfully created vendor garage location"
        }
    except exc.IntegrityError as e:
        error_msg = str(e.orig)

        if 'vendor_id' in error_msg:
            raise ex.RecordNotFound(model=f"Vendor with ID {vendor_garage_location_request.vendor_id}")
        elif 'city_id' in error_msg:
            raise ex.RecordNotFound(model=f"City with ID {vendor_garage_location_request.city_id}")
        

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def get_garage_locations(organizer: Organizer, vendor_id: int = None, city_id: int = None):
    filter_conditions = []
    
    if vendor_id:
        filter_conditions.append(VendorGarageLocation.vendor_id == vendor_id)
    if city_id:
        filter_conditions.append(VendorGarageLocation.city_id == city_id)
    
    garage_locations = crud.select_records(VendorGarageLocation, filter_conditions=filter_conditions).all()
    
    return {
        "vendor_garage_locations": [
            obj_to_dict.vendor_garage_location_as_dict(garage_location) 
            for garage_location in garage_locations
        ] if garage_locations  else []
    }

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def get_garage_location_by_id(organizer: Organizer, garage_location_id: int):
    garage_location = app_utils.get_model_record_by_id(VendorGarageLocation, garage_location_id)
    return {
        "vendor_garage_location": obj_to_dict.vendor_garage_location_as_dict(garage_location) if garage_location else {}
    }


@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def update_garage_location_by_id(organizer: Organizer, garage_location_id: int, update_request: VendorGarageLocationBase):
    garage_location = app_utils.get_model_record_by_id(VendorGarageLocation, garage_location_id)
    if not garage_location:
        raise ex.RecordNotFound(model="Garage location")
    
    filter_criteria = [VendorGarageLocation.id == garage_location_id]
    records_to_update = update_request.model_dump()

    result = crud.update_records(VendorGarageLocation, filter_criteria=filter_criteria, records_to_update=records_to_update)
    
    if not result.rowcount:
       raise ex.DatabaseOperationFailed(model="update")

    return {
        "garage_location_id": garage_location_id,
        "message": "Successfully updated garage location"
    }

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def delete_garage_location_by_id(organizer: Organizer, garage_location_id: int):
    garage_location = app_utils.get_model_record_by_id(VendorGarageLocation, garage_location_id)
    if not garage_location:
        raise ex.RecordNotFound(model="Garage location")
    
    filter_criteria = [VendorGarageLocation.id == garage_location_id]
    result = crud.delete_record(VendorGarageLocation, filter_criteria)
    
    if not result.rowcount:
       raise ex.DatabaseOperationFailed(model="delete")

    return {
        "garage_location_id": garage_location_id,
        "message": "Successfully deleted garage location"
    }

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.VENDOR.value,Role.ORGANIZER.value])
def get_vendor_invoice_summary(vendor: Vendor,  booking_id: str, plan_id: int = None):
    booking_record = get_booking_by_booking_id(booking_id)
    plan_id = booking_record.plan.id if plan_id is None else plan_id  # Set default package id 
    plan_record = app_utils.get_model_record_by_id(Plan, plan_id)
    plan_data = obj_to_dict.plan_info_as_dict(plan_record)

    trip_record = get_trip_record_by_booking_id(booking_id)
    if not trip_record:
        raise ex.RecordNotFound(model="Trip")

    total_distance = int(trip_record.distance)
    package_distance = plan_data["package"]["distance_kms"]
    total_duration = int(trip_record.duration)
    package_duration = plan_data["package"]["interval_hrs"]

    extra_kms_qty = (
    total_distance - package_distance if total_distance > package_distance else 0
    )
    extra_hrs_qty = (
    total_duration - package_duration if total_duration > package_duration else 0
    )

    # Tariff Plan Particulars
    base_fare = plan_data["cost"]
    extra_distance_cost = plan_data["extra_distance_cost"]
    extra_hour_cost = plan_data["extra_hour_cost"]

    return {
      "base_fare": base_fare,
      "extra_kms_qty": extra_kms_qty,
      "extra_kms": extra_distance_cost,
      "extra_hrs_qty": extra_hrs_qty,
      "extra_hrs": extra_hour_cost,
      "cancellation_amount": 0,
      "plan": plan_data
   }


@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value, Role.VENDOR.value])
def get_vendor_invoice_data_by_booking_id(user: Union[Organizer, Vendor], booking_id: str):
   invoice_record = get_vendor_invoice_by_booking_id(booking_id)
   if not invoice_record:
      raise ex.RecordNotFound(model="Vendor Invoice")
   
   folder_prefix = f"{booking_id}/{const.DOCUMENTS_S3_BUCKET_FOLDER}/"
   documents_urls = cutils.generate_presigned_urls_for_folder(folder_prefix)
   
   return {
      "base_fare": invoice_record.base_fare,
      "extra_kms_qty": invoice_record.extra_kms_qty,
      "extra_hrs_qty": invoice_record.extra_hrs_qty,
      "extra_kms": invoice_record.extra_kms,
      "extra_hrs": invoice_record.extra_hrs,
      "driver_charge": invoice_record.driver_charge,
      "miscellaneous": invoice_record.miscellaneous,
      "parking_and_toll": invoice_record.parking_and_toll,
      "discount_percent": invoice_record.discount_percent,
      "description": invoice_record.description,
      "cancellation_amount": invoice_record.cancellation_amount,
      "plan": obj_to_dict.plan_info_as_dict(invoice_record.plan),
      "documents":documents_urls,
   }