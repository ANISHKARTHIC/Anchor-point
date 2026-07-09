from typing import Union
from app_models import crud
from app_models.models import Coordinator, Organizer, Vehicle, VehicleModel, Vendor
from app_routes.vehicle.schema import VehicleInfo
from app_schemas.schema import Role
from app_utils.decorators import transactional, email_exists_or_raise, verify_jwt_role_and_email
from app_utils import exception as ex
from sqlalchemy import func, exc
from itertools import chain
from logger import logger as logging
from common_utils import utils as cutils
from itertools import chain

def build_vehicle_model_json():
    return func.jsonb_build_object(
        "id",
        VehicleModel.id,
        "name",         
        VehicleModel.vehicle_model,
    ).label("vehicle_model_json")


def build_vehicle_json():
    return func.jsonb_build_object(
        "id",
        Vehicle.id,
        "name",
        Vehicle.name,
        "vehicle_model_id",
        Vehicle.vehicle_model_id,
    ).label("vehicle_json")

@transactional
@email_exists_or_raise(Organizer)
def create_vehicle_model(organizer: Organizer, vehicle_model: str) -> dict:
    if cutils.is_record_present(VehicleModel, "vehicle_model", vehicle_model):
        raise ex.RecordExists(field_name="Vehicle model", field_value=vehicle_model)
    
    result = crud.insert_record(VehicleModel, vehicle_model=vehicle_model)
    return {
        "vehicle_model_id": result.id,
        "vehicle_model": vehicle_model,
        "message": "Successfully created new vehicle model",
    }

@transactional
@email_exists_or_raise(Organizer)
def get_vehicle_model_by_vehicle_model(organizer: Organizer, vehicle_model: str):
    select_cols = [build_vehicle_model_json()]
    record = crud.select_records(
        primary_table=VehicleModel,
        select_cols=select_cols,
        filter_conditions=[VehicleModel.vehicle_model == vehicle_model, VehicleModel.is_active == True],
    ).first()
    if record:
        return {"vehicle_model": record.vehicle_model_json}
    raise ex.RecordNotFound(model="Vehicle Model")

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.COORDINATOR.value, Role.ORGANIZER.value, Role.VENDOR.value])
def get_vehicle_models(user: Union[Coordinator, Organizer, Vendor]):
    select_cols = [build_vehicle_model_json()]
    filter_conditions=[VehicleModel.is_active == True]
    order_by = [VehicleModel.vehicle_model]
    records = crud.select_records(
        primary_table=VehicleModel, 
        select_cols=select_cols,
        filter_conditions=filter_conditions, 
        order_by=order_by
    ).all()
    return {"vehicle_models": list(chain.from_iterable(records))}


@transactional
@email_exists_or_raise(Organizer)
def get_vehicle_model_by_id(organizer: Organizer, vehicle_model_id: int):
    select_cols = [build_vehicle_model_json()]
    filter_conditions=[VehicleModel.id == vehicle_model_id, VehicleModel.is_active == True]
    record = crud.select_records(
        primary_table=VehicleModel,
        select_cols=select_cols,
        filter_conditions=filter_conditions,
    ).first()
    if record:
        return {"vehicle_model": record.vehicle_model_json}
    raise ex.RecordNotFound(model="Vehicle Model")


@transactional
@email_exists_or_raise(Organizer)
def update_vehicle_model(
    organizer: Organizer, vehicle_model_id: int, vehicle_model: str
):
    vehicle_model_record = get_vehicle_model_by_id(organizer, vehicle_model_id).get(
        "vehicle_model"
    )
    if cutils.is_record_present(VehicleModel, "vehicle_model", vehicle_model, vehicle_model_id):
        raise ex.RecordExists(field_name="Vehicle model", field_value=vehicle_model)

    filter_criteria = [VehicleModel.id == vehicle_model_id]
    records_to_update = {"vehicle_model": vehicle_model}
    result = crud.update_records(
        VehicleModel,
        filter_criteria=filter_criteria,
        records_to_update=records_to_update,
    )
    if not result.rowcount:
        raise ex.DatabaseOperationFailed(action="update")

    return {
        "vehicle_model_id": vehicle_model_id,
        "message": "Successfully updated vehicle model"
    }

@transactional
@email_exists_or_raise(Organizer)
def delete_vehicle_model(organizer: Organizer, vehicle_model_id: int):
    vehicle_model_record = get_vehicle_model_by_id(organizer, vehicle_model_id).get(
        "vehicle_model"
    )
    filter_criteria = [VehicleModel.id == vehicle_model_id]
    result = crud.update_records(
        VehicleModel,
        filter_criteria=filter_criteria, 
        records_to_update={"is_active": False})
    if not result.rowcount:
        raise ex.DatabaseOperationFailed(action="delete")
    return {
        "vehicle_model_id": vehicle_model_id,
        "message": "Successfully deleted vehicle model",
    }
    
@transactional
def get_vehicle_by_id_and_name(vehicle_model_id: int, vehicle_name: str, vehicle_id: int = None):
    filter_conditions=[
        Vehicle.vehicle_model_id == vehicle_model_id, 
        Vehicle.name.ilike(vehicle_name), 
        Vehicle.is_active == True
    ]
    if vehicle_id:
        filter_conditions.append(Vehicle.id != vehicle_id)

    return crud.select_records(
        primary_table=Vehicle,
        filter_conditions=filter_conditions,
    ).first()

@transactional
@email_exists_or_raise(Organizer)
def create_vehicle(organizer: Organizer, vehicle: VehicleInfo) -> dict:
    if get_vehicle_by_id_and_name(vehicle.vehicle_model_id, vehicle.name):
        raise ex.RecordExists(field_name="Vehicle", field_value=vehicle.name)
    
    result = crud.insert_record(
        Vehicle, name=vehicle.name, vehicle_model_id=vehicle.vehicle_model_id
    )
    if not result:
        raise ex.DatabaseOperationFailed(action="insert")
    return {"vehicle_id": result.id, "message": "Successfully created new vehicle"}

@transactional
@email_exists_or_raise(Organizer)
def get_vehicles(organizer: Organizer):
    select_cols = [build_vehicle_json()]
    records = crud.select_records(
        primary_table=Vehicle, select_cols=select_cols, order_by=[Vehicle.id]
    ).all()
    if not records:
        raise ex.RecordNotFound(model="Vehicles")
    return {"vehicles": list(chain.from_iterable(records))}


@transactional
@email_exists_or_raise(Organizer)
def get_vehicle_by_id(organizer: Organizer, vehicle_id: int):
    select_cols = [build_vehicle_json()]
    record = crud.select_records(
        primary_table=Vehicle,
        select_cols=select_cols,
        filter_conditions=[Vehicle.id == vehicle_id],
    ).first()
    if not record:
        raise ex.RecordNotFound(model="Vehicle")
    return {"vehicle": record.vehicle_json}


@transactional
@email_exists_or_raise(Organizer)
def update_vehicle(
    organizer: Organizer, vehicle_id: int, update_vehicle_request: VehicleInfo
):
    try:
        vehicle_record = get_vehicle_by_id(organizer, vehicle_id).get("vehicle")
        
        if get_vehicle_by_id_and_name(update_vehicle_request.vehicle_model_id, update_vehicle_request.name, vehicle_id):
            raise ex.RecordExists(field_name="Vehicle", field_value=update_vehicle_request.name)

        filter_criteria = [Vehicle.id == vehicle_id]
        records_to_update = update_vehicle_request.model_dump(exclude_unset=True)
        result = crud.update_records(
            Vehicle,
            filter_criteria=filter_criteria,
            records_to_update=records_to_update,
        )
        if not result.rowcount:
            raise ex.DatabaseOperationFailed(action="update")
        return {"vehicle_id": vehicle_id, "message": "Successfully updated vehicle"}
    except exc.IntegrityError:
        raise ex.RecordExists


@transactional
@email_exists_or_raise(Organizer)
def delete_vehicle(organizer: Organizer, vehicle_id: int):
    try:
        vehicle_record = get_vehicle_by_id(organizer, vehicle_id).get("vehicle")
        filter_criteria = [Vehicle.id == vehicle_id]
        result = crud.update_records(
            Vehicle, 
            filter_criteria=filter_criteria, 
            records_to_update={"is_active": False})
        if not result.rowcount:
            raise ex.DatabaseOperationFailed(action="delete")
        return {"vehicle_id": vehicle_id, "message": "Successfully deleted vehicle"}
    except exc.IntegrityError:
        raise ex.ForeginKeyViolation(
            action="deleted", table="vehicle", foreign_key_table="plan"
        )
