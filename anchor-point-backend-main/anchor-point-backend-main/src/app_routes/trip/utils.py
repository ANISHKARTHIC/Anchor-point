from itertools import chain
from tempfile import SpooledTemporaryFile
from app_schemas.schema import Role
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import asc, func, or_, and_
from app_routes.trip.schema import TripStatus
from botocore.exceptions import BotoCoreError, ClientError
from typing import List
from datetime import datetime
from dateutil import parser
from app_models.models import Trip, TripEvent, Vendor
from app_utils import utils as app_utils
from common_utils import utils as cutils
from app_utils.decorators import transactional
from logger import logger as logging
from app_utils import exception as ex
from app_models import crud
from app_configs import constants as const
from common_utils import obj_to_dict

def booking_exists_or_raise(func):
    def wrapper(booking_id, *args, **kwargs):
        app_utils.get_booking_by_booking_id(booking_id)
        return func(booking_id, *args, **kwargs)

    return wrapper


@transactional
def get_trip_record_or_raise(booking_id: str):
    result = crud.select_records(
        Trip, filter_conditions=[Trip.booking_id == booking_id]
    ).first()
    if not result:
        raise ex.RecordNotFound(model="Trip")
    return result


@transactional
def get_or_create_trip_by_booking_id(booking_id: str):
    record = crud.select_records(
        Trip, filter_conditions=[Trip.booking_id == booking_id]
    ).first()
    if not record:
        record = crud.insert_record(Trip, booking_id=booking_id)
    return record


def validate_trip_status(status: str):
    if status not in [TripStatus.PICKED.value, TripStatus.DROPPED.value]:
        raise ex.InvalidTripStatus


def generate_trip_entry(entry_type: str, odo_reading: str, location: str):
    data_dict = {
        f"{entry_type}_odo": odo_reading,
        f"{entry_type}_location": location,
        f"{entry_type}_time": cutils.current_utc_time(),
    }
    odo_proof = f"{entry_type}_odo_proof"
    return data_dict, odo_proof


@transactional
def insert_new_trip_event(trip_id: str, event: str, meta_data: dict = {}):
    records_to_insert = {
        "trip_id": trip_id,
        "event": event,
        "meta_data": meta_data,
    }
    result = crud.insert_record(TripEvent, **records_to_insert)
    if not result:
        raise ex.DatabaseOperationFailed(action="insert")
    
    return result


@transactional
@booking_exists_or_raise
def create_trip_event_with_signature(
    booking_id: str,
    status: str,
    location: str,
    booking_log_id: str,
    guest_name: str,
    image: SpooledTemporaryFile = None,
):
    # Check if whether the trip status is valid
    validate_trip_status(status)
    trip_record = get_trip_record_or_raise(booking_id)

    # Upload signature file to s3 and generate presigned url
    metadata = {"booking_log_id": booking_log_id, "guest_name": guest_name, "location": location}
    if image:
        file_name = f"{booking_id}/{const.PROOFS_S3_BUCKET_FOLDER}/{guest_name}_signature"
        img_url = cutils.upload_and_generate_presigned_url(image.file, file_name)
        metadata["img_url"] = img_url
    event = TripStatus(status).value
    # Add new trip event
    insert_new_trip_event(trip_record.id, event, metadata)

    return {"status": event, "message": "Succesfully created event"}


def create_manual_trip_entry(trip_record, status, distance, duration):
    insert_new_trip_event(trip_id=trip_record.id, event=status)
    update_trip_distance_and_duration(status, trip_record.booking_id, trip_record.id, distance, duration)

@transactional
@booking_exists_or_raise
def create_trip(
    booking_id: str,
    status: str,
    odo_reading: str,
    location: str,
    distance: str,
    duration: str,
    image: SpooledTemporaryFile = None,
):
    try:
        trip_record = get_or_create_trip_by_booking_id(booking_id)
        if not distance and not duration:
            records_to_update = {}

            if status == TripStatus.STARTED.value:
                records_to_update, object_name = generate_trip_entry(
                    "starting", odo_reading, location, 
                )

            elif status == TripStatus.COMPLETED.value:
                if int(odo_reading) < int(trip_record.starting_odo):
                    raise ex.OdometerReadingError(trip_record.starting_odo, odo_reading)
                
                records_to_update, object_name = generate_trip_entry(
                    "ending", odo_reading, location
                )

            else:
                raise ex.InvalidTripStatus

            if image:
                # Upload file to S3 bucket and generate presigned url
                file_name = f"{booking_id}/{const.PROOFS_S3_BUCKET_FOLDER}/{object_name}"
                img_url = cutils.upload_and_generate_presigned_url(image.file, file_name)

                # Update trip record
                records_to_update[object_name] = img_url
                    
            result = crud.update_records(
                Trip, [Trip.id == trip_record.id], records_to_update
            )
            if not result.rowcount:
                raise ex.DatabaseOperationFailed(action="update")
                
            # Add new trip event
            result = insert_new_trip_event(trip_id=trip_record.id, event=status)

            if result:
                update_trip_distance_and_duration(status, booking_id, trip_record.id, distance, duration)
        else:
            create_manual_trip_entry(trip_record, status, distance, duration)
            
        return {"message": "Successfully added new trip", "trip_id": trip_record.id}
    except (ClientError, BotoCoreError) as e:
        logging.error(e)
        raise ex.AWSS3Error(err_msg=str(e))
    

def update_trip_distance_and_duration(status, booking_id, trip_id, distance, duration):

    records_to_update = {}
    if status == TripStatus.COMPLETED.value:
        
        if not (distance and duration):
            distance, duration = get_distance_duration(booking_id)

        records_to_update.update({'distance': distance, 'duration': duration})
        crud.update_records(
                Trip, [Trip.id == trip_id], records_to_update
            )

def get_distance_duration(booking_id):

    trip_events = get_trip_history(booking_id, filter_conditions=[
                                or_(
                                    and_(TripEvent.event == TripStatus.STARTED.value),
                                    and_(TripEvent.event == TripStatus.COMPLETED.value),
                                )])
    
    started_timestamp, completed_timestamp = get_timestamps(trip_events['trip_history'])
    
    duration = calculate_total_hours(started_timestamp, completed_timestamp)

    trip = crud.select_records(primary_table=Trip, filter_conditions=[Trip.booking_id == booking_id]).first()

    distance = int(trip.ending_odo) - int(trip.starting_odo)

    return distance, duration


def build_trip_events_json_obj():
    return func.jsonb_build_object(
        "id",
        TripEvent.id,
        "trip_id",
        TripEvent.trip_id,
        "event",
        TripEvent.event,
        "created_at",
        func.timezone(const.SOURCE_TZ, func.timezone(const.TARGET_TZ, TripEvent.cdate)),
        "metadata",
        TripEvent.meta_data,
    ).label("trip_events_json")


@transactional
@booking_exists_or_raise
def get_trip_history(booking_id: str, filter_conditions: List = None):
    try:
        join_conditions = [(Trip, Trip.id == TripEvent.trip_id)]
        filter_conditions = [Trip.booking_id == booking_id] + (filter_conditions or [])
        order_by = [asc(TripEvent.cdate)]
        records = crud.select_records(
            primary_table=TripEvent,
            join_conditions=join_conditions,
            filter_conditions=filter_conditions,
            order_by=order_by
        ).all()
        return {"trip_history": [obj_to_dict.trip_history_as_dict(trip_history) for trip_history in records]}
    except SQLAlchemyError:
        raise ex.DatabaseOperationFailed(action="get")
    

def get_timestamps(trip_events):

    for event in trip_events:
        if event['event'] == TripStatus.STARTED.value:
            started_timestamp = event['created_at']
        elif event['event'] == TripStatus.COMPLETED.value:
            completed_timestamp = event['created_at']

    return started_timestamp, completed_timestamp


def calculate_total_hours(timestamp1, timestamp2):

    # Calculate the difference in hours
    difference = timestamp2 - timestamp1
    total_hours = difference.total_seconds() / 3600

    return int(total_hours)