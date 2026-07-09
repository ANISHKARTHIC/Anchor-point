from typing import Union
from app_models import crud
from app_models.models import (
    Organizer,
    Package,
    Plan,
    VehicleModel,
    Vendor,
    Vehicle,
    VendorCity,
    VendorGarageLocation,
)
from app_routes.organizer.utils import super_organizer_only
from app_routes.package.utils import build_package_json
from app_routes.plan.schema import PlanInfo
from app_schemas.schema import Role
from common_utils import obj_to_dict
from app_utils.decorators import transactional, email_exists_or_raise, verify_jwt_role_and_email
from app_utils import exception as ex
from app_utils import utils as app_utils
from sqlalchemy import func, exc, or_, and_, exists
from itertools import chain


@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value, Role.VENDOR.value])
def get_plans(user: Union[Organizer, Vendor], vendor_id: int = None, vehicle_id: int = None):
    filter_conditions = []
    if vendor_id:
        filter_conditions.append(Plan.vendor_id == vendor_id)
    if vehicle_id:
        filter_conditions.append(Plan.vehicle_id == vehicle_id)

    plans = crud.select_records(Plan, filter_conditions=filter_conditions).all()
    if not plans:
        raise ex.RecordNotFound(model="Plans")
    return {"plans": [obj_to_dict.plan_info_as_dict(plan) for plan in plans]}

def get_plan_by_details(package_id: int , vehicle_id: int, vendor_id:int, plan_id: int = None):
    filter_conditions=[
        Plan.package_id == package_id, 
        Plan.vehicle_id == vehicle_id, 
        Plan.vendor_id == vendor_id,
        Plan.is_active == True
    ]
    if package_id:
        filter_conditions.append(Plan.id != plan_id)

    return crud.select_records(
        primary_table=Plan,
        filter_conditions=filter_conditions,
    ).first()

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value, Role.VENDOR.value])
def get_plan_by_id(user: Union[Organizer,Vendor], plan_id: int):
    filter_conditions = [Plan.id == plan_id]
    if isinstance(user, Vendor):
        filter_conditions.append(Plan.vendor_id == user.id)
    
    plan = crud.select_records(Plan, filter_conditions=filter_conditions).first()
    if not plan:
        raise ex.RecordNotFound(model="Plan")
    return {"plan": obj_to_dict.plan_info_as_dict(plan)}


@transactional
def get_plan_data_by_filters(**kwargs):
    filter_cols = {
        "package_id": Plan.package_id,
        "vehicle_id": Plan.vehicle_id,
        "vendor_id": Plan.vendor_id,
        "vendor_cost": Plan.vendor_cost,
        "extra_distance_cost": Plan.extra_distance_cost,
        "extra_hour_cost": Plan.extra_hour_cost,
    }
    filter_condition = [filter_cols[key] == value for key, value in kwargs.items()]
    return crud.select_records(Plan, filter_conditions=filter_condition).first()

@transactional
@super_organizer_only
def delete_plan(organizer: Organizer, plan_id: int):
    plan_info = app_utils.get_model_record_by_id(Plan, plan_id)
    filter_criteria = [Plan.id == plan_info.id]
    records_to_update = {"is_active": False}
    result = crud.update_records(Plan, filter_criteria=filter_criteria, records_to_update=records_to_update)
    
    if not result.rowcount:
        raise ex.DatabaseOperationFailed(action="delete")
    
    return {"plan_id": plan_id, "message": "Successfully deleted plan"}

@transactional
@super_organizer_only
def create_plan(organizer: Organizer, plan_request: PlanInfo):
    if get_plan_by_details(plan_request.package_id, plan_request.vehicle_id, plan_request.vendor_id):
        raise ex.RecordExists(msg="The vendor already has a plan in place for this specific package and vehicle.")

    records_to_insert = {
        "package_id": plan_request.package_id,
        "vehicle_id": plan_request.vehicle_id,
        "vendor_id": plan_request.vendor_id,
        "vendor_cost": plan_request.cost,
        "extra_distance_cost": plan_request.extra_distance_cost,
        "extra_hour_cost": plan_request.extra_hour_cost,
    }
    plan_record = crud.insert_record(Plan, **records_to_insert)

    if not plan_record:
        raise ex.DatabaseOperationFailed(action="insert")
    return {
        "message": "Successfully created new plan for the vendor",
        "plan_id": plan_record.id,
    }

@transactional
@super_organizer_only
def update_plan(
    organizer: Organizer,
    plan_id: int,
    update_request: PlanInfo,
):
    if get_plan_by_details(update_request.package_id, update_request.vehicle_id, update_request.vendor_id, plan_id):
        raise ex.RecordExists(msg="The vendor already has a plan in place for this specific package and vehicle.")

    plan_info = app_utils.get_model_record_by_id(Plan, plan_id)
    records_to_update = {
        "package_id": update_request.package_id,
        "vehicle_id": update_request.vehicle_id,
        "vendor_id": update_request.vendor_id,
        "vendor_cost": update_request.cost,
        "extra_distance_cost": update_request.extra_distance_cost,
        "extra_hour_cost": update_request.extra_hour_cost,
    }

    filter_criteria = [Plan.id == plan_info.id]
    result = crud.update_records(
        Plan,
        filter_criteria=filter_criteria,
        records_to_update=records_to_update,
    )

    if not result.rowcount:
        raise ex.DatabaseOperationFailed(action="update")
    return {"plan_id": plan_id, "message": "Successfully updated plan details"}

def build_vendors_json():
    return func.jsonb_agg(
        func.jsonb_build_object(
            "id",
            Vendor.id,
            "name",
            Vendor.name,
            "email",
            Vendor.email,
            "address",
            Vendor.address,
            "coordinates",
            Vendor.coordinates,
            "cost",
            Plan.vendor_cost,
            "extra_hour_cost",
            Plan.extra_hour_cost,
            "extra_distance_cost",
            Plan.extra_distance_cost,
        )
    ).label("vendors")


def build_plan_vendor_json():
    return func.jsonb_build_object(
        "plan_id",
        Package.id,
        "plan_name",
        Package.name,
        "distance_kms",
        Package.distance_kms,
        "interval_hrs",
        Package.interval_hrs,
        "description",
        Package.description,
        "vendors",
        build_vendors_json(),
    ).label("plan_vendor_json")

def build_plan_json():
    return func.jsonb_build_object(
        "id", Plan.id,
        "package", build_package_json(),
        "vehicle", func.jsonb_build_object( "id", Vehicle.id, "name", Vehicle.name, "vehicle_model", VehicleModel.vehicle_model),
        "cost", Plan.vendor_cost,
        "extra_distance_cost", Plan.extra_distance_cost,
        "extra_hour_cost", Plan.extra_hour_cost,
    ).label("plan_json")

def get_vehicles_subquery(cab_type=None, city_id=None):
    select_cols = [
        Plan.package_id.label("package_id"),
        Plan.vendor_id.label("vendor_id"),
        Plan.id.label("plan_id"),
        func.jsonb_agg(
            func.jsonb_build_object(
                "name",
                Vehicle.name,
                "id",
                Vehicle.id,
                "vehicle_model",
                VehicleModel.vehicle_model,
            )
        ).label("vehicles"),
    ]
    join_conditions = [
        (Vehicle, Plan.vehicle_id == Vehicle.id),
        (VehicleModel, Vehicle.vehicle_model_id == VehicleModel.id),
        (Vendor, Plan.vendor_id == Vendor.id)
    ]
    group_by = [Plan.id, Plan.package_id, Plan.vendor_id]
    filter_conditions = []
    
    if city_id:
        filter_conditions.append(Vendor.city_id == city_id)
    if cab_type:
        filter_conditions.append(VehicleModel.vehicle_model == cab_type)

    order_by = [Plan.id]
    return crud.select_records(
        primary_table=Plan,
        select_cols=select_cols,
        join_conditions=join_conditions,
        group_by=group_by,
        filter_conditions=filter_conditions,
        order_by=order_by,
    ).subquery()


@transactional
def fetch_plans(cab_type=None, city_id=None):
    vehicles_subquery = get_vehicles_subquery(cab_type, city_id)
    select_cols = [
        func.jsonb_build_object(
            "id",
            Vendor.id,
            "name",
            Vendor.name,
            "address",
            Vendor.address,
            "coordinates",
            Vendor.coordinates,
            "city",
            VendorCity.city,
            "plans",
            func.jsonb_agg(
                func.jsonb_build_object(
                    "plan_id",
                    vehicles_subquery.c.plan_id,
                    "id",
                    Package.id,
                    "name",
                    Package.name,
                    "vehicles",
                    vehicles_subquery.c.vehicles,
                )
            ),
        )
    ]
    group_by = [Vendor.id, Vendor.name, Vendor.address, Vendor.coordinates, VendorCity.city]
    join_conditions = [
        (Package, Package.id == vehicles_subquery.c.package_id),
        (Vendor, Vendor.id == vehicles_subquery.c.vendor_id),
        (VendorCity, VendorCity.id ==  Vendor.city_id),
    ]
    order_by = [Vendor.id]
    filter_conditions = [Vendor.is_active == True]
    result = crud.select_records(
        primary_table=vehicles_subquery,
        select_cols=select_cols,
        join_conditions=join_conditions,
        filter_conditions=filter_conditions,
        group_by=group_by,
        order_by=order_by,
    ).all()
    return {"vendors": list(chain.from_iterable(result))}


def fetch_vendor_garage_location(vendor_id: int):
    result = crud.select_records(VendorGarageLocation, filter_conditions=[VendorGarageLocation.vendor_id == vendor_id]).all()
    return [obj_to_dict.vendor_garage_location_as_dict(row) for row in result]

@transactional
@email_exists_or_raise(Organizer)
def get_plan_vendors(organizer: Organizer, cab_type, city_id):
    def attach_garage_locations(vendors):
        for vendor in vendors:
            vendor["garage_locations"] = fetch_vendor_garage_location(vendor["id"])
        return vendors
    
    # Try fetching with cab_type
    result = fetch_plans(cab_type=cab_type, city_id=city_id)
    if result["vendors"]:
        result["vendors"] = attach_garage_locations(result["vendors"])
        return result

    # Try fetching without cab_type
    result = fetch_plans(city_id=city_id)
    if result["vendors"]:
        result["vendors"] = attach_garage_locations(result["vendors"])
        return result

    # If still no vendors, raise error
    raise ex.PlansNotFound
