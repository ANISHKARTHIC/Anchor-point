from app_models.models import Organizer, Package
from app_routes.package.schema import PackageInfo
from app_utils.decorators import email_exists_or_raise, transactional
from app_models import crud
from app_models.models import Organizer
from app_utils.decorators import transactional, email_exists_or_raise
from app_utils import exception as ex
from sqlalchemy import func, exc
from itertools import chain


def build_package_json():
    return func.jsonb_build_object(
        "id",
        Package.id,
        "name",
        Package.name,
        "distance_kms",
        Package.distance_kms,
        "interval_hrs",
        Package.interval_hrs,
        "description",
        Package.description,
    ).label("package_json")


def get_package_by_distance_and_duration(distance_kms: int , interval_hrs: int, package_id: int = None):
    filter_conditions=[
        Package.distance_kms == distance_kms, 
        Package.interval_hrs == interval_hrs, 
        Package.is_active == True
    ]
    if package_id:
        filter_conditions.append(Package.id != package_id)

    return crud.select_records(
        primary_table=Package,
        filter_conditions=filter_conditions,
    ).first()

@transactional
@email_exists_or_raise(Organizer)
def create_package(organizer: Organizer, package_request: PackageInfo) -> dict:
    if get_package_by_distance_and_duration(package_request.distance_kms, package_request.interval_hrs):
        raise ex.RecordExists(msg=f"Package with distance {package_request.distance_kms} kms and duration {package_request.interval_hrs} hrs is already present.")
    
    records_to_insert = package_request.model_dump(exclude_unset=True)
    result = crud.insert_record(Package, **records_to_insert)
    if not result:
        ex.DatabaseOperationFailed(action="insert")
    return {
        "package_id": result.id,
        "message": "Successfully created new package",
    }
@transactional
@email_exists_or_raise(Organizer)
def get_packages(organizer: Organizer):
    select_cols = [build_package_json()]
    records = crud.select_records(
        primary_table=Package, select_cols=select_cols, order_by=[Package.id]
    ).all()
    if not records:
        raise ex.RecordNotFound(model="Packages")
    return {"packages": list(chain.from_iterable(records))}


@transactional
@email_exists_or_raise(Organizer)
def get_package_by_id(organizer: Organizer, package_id: int):
    select_cols = [build_package_json()]
    record = crud.select_records(
        primary_table=Package,
        select_cols=select_cols,
        filter_conditions=[Package.id == package_id],
    ).first()
    if not record:
        raise ex.RecordNotFound(model="Package")
    return {"package": record.package_json}


@transactional
@email_exists_or_raise(Organizer)
def update_package(
    organizer: Organizer, package_id: int, update_package_request: PackageInfo
):
    package_record = get_package_by_id(organizer, package_id).get("package")
    if get_package_by_distance_and_duration(update_package_request.distance_kms, update_package_request.interval_hrs, package_id):
        raise ex.RecordExists(msg=f"Package with distance {update_package_request.distance_kms} kms and duration {update_package_request.interval_hrs} hrs is already present.")
    
    filter_criteria = [Package.id == package_id]
    records_to_update = update_package_request.model_dump(exclude_unset=True)
    result = crud.update_records(
        Package,
        filter_criteria=filter_criteria,
        records_to_update=records_to_update,
    )
    if not result.rowcount:
        raise ex.DatabaseOperationFailed(action="update")
    return {
        "package_id": package_id,
        "message": "Successfully updated package",
    }

@transactional
@email_exists_or_raise(Organizer)
def delete_package(organizer: Organizer, package_id: int):
    package_record = get_package_by_id(organizer, package_id).get("package")
    filter_criteria = [Package.id == package_id]
    records_to_update = {"is_active": False}
    result = crud.update_records(Package, filter_criteria=filter_criteria, records_to_update=records_to_update)
    
    if not result.rowcount:
        raise ex.DatabaseOperationFailed(action="delete")
    
    return {"package_id": package_id, "message": "Successfully deleted package"}