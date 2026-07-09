from app_routes.hotel_bookings.schema import HotelBookingStatus
from common_utils import utils as cutils
from datetime import datetime
from app_configs import constants as const

def booking_info_as_dict(booking):
    return {
        "id": booking.id,
        "type": booking.type,
        "cab_type": booking.cab_type,
        "cc_recipients": booking.cc_recipients,
        "travel_mode": booking.travel_mode,
        "pickup_date": cutils.get_pickup_date(booking.booking_datetime),
        "pickup_time": cutils.get_pickup_time(booking.booking_datetime),
        "bid": booking.bid,
        "po_number": booking.po_number,
        "city": city_info_as_dict(booking.city) if booking.city else None,
        "created_at": cutils.convert_datetime(booking.cdate, to_utc=False),
    }

def city_info_as_dict(city):
    return { 
        "id": city.id,
        "name": city.city
    }

def cost_centre_info_as_dict(cost_centre):
    return { 
        "id": cost_centre.id,
        "code": cost_centre.code, 
        "gstin_no": cost_centre.gstin_no, 
        "address": cost_centre.address 
    }

def coordinator_info_as_dict(coordinator):
    return {
        "id": coordinator.id,
        "name": coordinator.name,
        "email": coordinator.email,
        "mobile": coordinator.mobile,
        "is_active": coordinator.is_active,
        "is_verified": coordinator.is_verified,
    }


def guest_info_as_dict(guest):
    return {
        "id": guest.id,
        "name": guest.name,
        "email": guest.email,
        "mobile": guest.mobile
    }


def location_info_as_dict(location):
    return {
        "location_id": location.id,
        "name": location.name,
        "address": location.address,
        "title": location.title,
        "landmark": location.landmark,
        "latitude": location.latitude,
        "longitude": location.longitude,
    }

def get_or_default(value, default=""):
        return value or default
    
def booking_log_info_as_dict(booking_log, source_info, waypoint_infos, destination_info):
    return {
        "booking_log_id": booking_log.id,
        "name": booking_log.name,
        "email": booking_log.email,
        "mobile": booking_log.mobile,
        "alternate_email": booking_log.alternate_email,
        "alternate_mobile": booking_log.alternate_mobile,
        "rank": get_or_default(booking_log.rank),
        "internal_id": get_or_default(booking_log.internal_id),
        "vessel_name": get_or_default(booking_log.vessel_name),
        "flight_details": get_or_default(booking_log.flight_details),
        "date_of_duty": cutils.get_pickup_date(booking_log.date_of_duty) if booking_log.date_of_duty else "",
        "start_time": cutils.get_pickup_time(booking_log.date_of_duty) if booking_log.date_of_duty else "",
        "source": source_info,
        "waypoints": waypoint_infos,
        "destination": destination_info
    }


def package_info_as_dict(package):
    return {
        "id": package.id,
        "name": package.name,
        "distance_kms": package.distance_kms,
        "interval_hrs": package.interval_hrs,
        "description": package.description,
    }


def vehicle_info_as_dict(vehicle):
    return {
        "id": vehicle.id,
        "name": vehicle.name,
        "model": vehicle.vehicle_model.vehicle_model,
    }


def vendor_info_as_dict(vendor):
    return {
        "id": vendor.id,
        "name": vendor.name,
        "email": vendor.email,
        "primary_mobile": vendor.primary_mobile,
        "secondary_mobile": vendor.secondary_mobile,
        "address": vendor.address,
        "coordinates": vendor.coordinates,
        "tax": vendor.tax,
        "vendor_type": vendor.vendor_type,
        "is_third_party": vendor.is_third_party,
        "city_id": vendor.city_id,
        "city": vendor.vendor_city.city
    }


def driver_charge_info_as_dict(driver_charge):
    return {
        "vehicle_model": driver_charge.vehicle_model.vehicle_model,
        "charge": driver_charge.charge,
    }


def driver_info_as_dict(driver):
    return {
        "id": driver.id,
        "name": driver.name,
        "vehicle_no":driver.vehicle_no,
        "primary_mobile":driver.primary_mobile,
        "secondary_mobile":driver.secondary_mobile,
        "otp":driver.otp
    }

def plan_info_as_dict(plan):
    return {
        "id": plan.id,
        "cost": plan.vendor_cost,
        "extra_distance_cost": plan.extra_distance_cost,
        "extra_hour_cost": plan.extra_hour_cost,
        "package": package_info_as_dict(plan.package),
        "vehicle": vehicle_info_as_dict(plan.vehicle),
        "vendor": vendor_info_as_dict(plan.vendor)
    }

def booking_history_as_dict(booking_history):
    booking_datetime = booking_history.meta_data.get("booking_datetime")
    if booking_datetime:
        date_format = const.DATETIME_TZ
        datetime_object = datetime.strptime(booking_datetime, date_format)
        booking_history.meta_data["booking_datetime"] = cutils.convert_datetime(datetime_object, to_utc=False)
    return {
        "id": booking_history.id,
        "booking_id": booking_history.booking_id,
        "event": booking_history.event, 
        "created_at": cutils.convert_datetime(booking_history.cdate, to_utc=False),
        "metadata":  booking_history.meta_data
    }

def booking_activity_log_info_as_dict(booking_activity_log):
    return {
        "id": booking_activity_log.id,
        "booking_id": booking_activity_log.booking_id,
        "booking_type": booking_activity_log.booking_type,
        "event": booking_activity_log.event, 
        "created_at": cutils.convert_datetime(booking_activity_log.cdate, to_utc=False),
        "metadata":  booking_activity_log.meta_data
    }

def trip_history_as_dict(trip_history):
    return {
        "id": trip_history.id,
        "trip_id": trip_history.trip.id,
        "event": trip_history.event, 
        "created_at": cutils.convert_datetime(trip_history.cdate, to_utc=False),
        "metadata":  trip_history.meta_data
    }

def hotel_booking_history_as_dict(hotel_booking_history):
    metadata = hotel_booking_history.meta_data
    
    if hotel_booking_history.event == HotelBookingStatus.CONFIRMED.value:
        folder_prefix = f"{hotel_booking_history.booking_id}/confirmation_attachment/"
        s3_url = cutils.generate_presigned_urls_for_folder(folder_prefix)
        metadata['document_urls'] = s3_url
    
    return {
        "id": hotel_booking_history.id,
        "booking_id": hotel_booking_history.booking_id,
        "event": hotel_booking_history.event,
        "created_at": cutils.convert_datetime(hotel_booking_history.cdate, to_utc=False),
        "metadata":  metadata
    }

def hotel_booking_edit_request_as_dict(hotel_booking_edit_request):
    return {
        "id": hotel_booking_edit_request.id,
        "booking_id": hotel_booking_edit_request.booking_id,
        "description": hotel_booking_edit_request.description,
        "created_at": cutils.convert_datetime(hotel_booking_edit_request.cdate, to_utc=False)
    }

def hotel_booking_edit_request_history_as_dict(hotel_booking_edit_request_history):
    return {
        "id": hotel_booking_edit_request_history.id,
        "edit_request_id": hotel_booking_edit_request_history.edit_request_id,
        "status": hotel_booking_edit_request_history.status,
        "metadata":  hotel_booking_edit_request_history.meta_data,
        "created_at": cutils.convert_datetime(hotel_booking_edit_request_history.cdate, to_utc=False)
    }

def trip_info_as_dict(trip):
    return {
        "id": trip.id,
        "booking_id": trip.booking_id,
        "starting_location": trip.starting_location,
        "starting_odo_proof": trip.starting_odo_proof,
        "starting_odo": trip.starting_odo if trip.starting_odo else 0,
        "ending_odo": trip.ending_odo if trip.ending_odo else 0,
        "starting_time": cutils.convert_datetime(trip.starting_time, to_utc=False) if trip.starting_time else None,
        "ending_time": cutils.convert_datetime(trip.ending_time, to_utc=False) if trip.ending_time else None,
        "ending_location": trip.ending_location,
        "ending_odo_proof": trip.ending_odo_proof,
        "total_distance": int(trip.distance) if trip.distance else 0,
        "total_duration": int(trip.duration) if trip.duration else 0,
        "created_at": cutils.convert_datetime(trip.cdate, to_utc=False),
        "modified_at": cutils.convert_datetime(trip.mdate, to_utc=False)
    }

def hotel_invoice_as_dict(invoice):
    return {
        "id": invoice.id,
        "booking_id": invoice.booking_id,
        "invoice_no": invoice.invoice_no,
        "taxable_amount": invoice.taxable_amount,
        "non_taxable_amount": invoice.non_taxable_amount,
        "cgst_amount": invoice.cgst_amount,
        "sgst_amount": invoice.sgst_amount,
        "igst_amount": invoice.igst_amount,
        "total_amount": invoice.total_amount,
        "po_number": invoice.po_number or "",
        "description": invoice.description or "",
        "created_at": cutils.convert_datetime(invoice.cdate, to_utc=False),
        "modified_at": cutils.convert_datetime(invoice.mdate, to_utc=False),
    }

def hotel_invoice_item_as_dict(invoice_item):
    return {
        "id": invoice_item.id,
        "name":  invoice_item.name,
        "sac": invoice_item.sac,
        "rate": invoice_item.rate,
        "tax_rate": invoice_item.tax_rate,
        "tax_percent": invoice_item.tax_percent,
        "quantity": invoice_item.quantity,
        "amount": invoice_item.amount
    }

def hotel_room_category_as_dict(room_category):
    return {
        "id": room_category.id,
        "name": room_category.name
    }

def hotel_meal_plan_as_dict(meal_plan):
    return {
        "id": meal_plan.id,
        "name": meal_plan.name
    }

def hotel_pricing_as_dict(hotel_pricing):
    return {
        "id": hotel_pricing.id,
        "vendor": vendor_info_as_dict(hotel_pricing.vendor),
        "room_category": hotel_room_category_as_dict(hotel_pricing.room_category),
        "meal_plan": hotel_room_category_as_dict(hotel_pricing.meal_plan),
        "single_room_rate": hotel_pricing.single_room_rate,
        "double_room_rate": hotel_pricing.double_room_rate,
        "inclusions": hotel_pricing.inclusions,
        "created_at": cutils.convert_datetime(hotel_pricing.cdate, to_utc=False),
        "modified_at": cutils.convert_datetime(hotel_pricing.mdate, to_utc=False)
    }

def hotel_booking_guest_as_dict(hotel_booking_guest):
    return {
        "hotel_booking_guest_id": hotel_booking_guest.id,
        "is_primary": hotel_booking_guest.is_primary,
        "name": hotel_booking_guest.name,
        "email": hotel_booking_guest.email,
        "mobile": hotel_booking_guest.mobile,
        "rank": get_or_default(hotel_booking_guest.rank),
        "internal_id": get_or_default(hotel_booking_guest.internal_id),
        "vessel_name": get_or_default(hotel_booking_guest.vessel_name),
        "flight_details": get_or_default(hotel_booking_guest.flight_details),
        "created_at": cutils.convert_datetime(hotel_booking_guest.cdate, to_utc=False)    
    }

def hotel_booking_info_as_dict(hotel_booking):
    return {
        "id": hotel_booking.id,
        "bid": hotel_booking.bid,
        "trip_type": hotel_booking.trip_type,
        "no_of_rooms": hotel_booking.no_of_rooms,
        "room_type": hotel_booking.room_type,
        "city": hotel_booking.city,
        "cost_centre": cost_centre_info_as_dict(hotel_booking.cost_centre),
        "no_of_adults": hotel_booking.no_of_adults,
        "no_of_children": hotel_booking.no_of_children,
        "no_of_rooms": hotel_booking.no_of_rooms,
        "check_in": hotel_booking.check_in,
        "check_out": hotel_booking.check_out,
        "confirmation_no": hotel_booking.confirmation_no,
        "description": hotel_booking.description,
        "related_booking_id": hotel_booking.related_booking_id,
        "billing_option": hotel_booking.billing_option,
        "cc_recipients": hotel_booking.cc_recipients,
        "pickup": hotel_booking.pickup,
        "drop": hotel_booking.drop,
        "created_at": cutils.convert_datetime(hotel_booking.cdate, to_utc=False),
        "modified_at": cutils.convert_datetime(hotel_booking.mdate, to_utc=False)     
    }

def vendor_garage_location_as_dict(vendor_garage_location):
    return {
        "id": vendor_garage_location.id,
        "vendor_id": vendor_garage_location.vendor_id,
        "city_id": vendor_garage_location.vendor_city.id,
        "city": vendor_garage_location.vendor_city.city,
        "title": vendor_garage_location.title,
        "address": vendor_garage_location.address,
        "latitude": vendor_garage_location.latitude,
        "longitude": vendor_garage_location.longitude,
        "created_at": cutils.convert_datetime(vendor_garage_location.cdate, to_utc=False),
        "modified_at": cutils.convert_datetime(vendor_garage_location.mdate, to_utc=False)      
    }