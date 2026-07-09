from contextlib import asynccontextmanager
import uvicorn
from fastapi import  FastAPI, Depends, status, Query, BackgroundTasks
from typing import Annotated
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from app_configs.configs import configs as cfg
from app_dependencies.middlewares import timing_middleware
from common_utils import utils as cutils
from app_routes.booking import utils as booking_utils
from app_routes.coordinator import coordinator_operations
from app_routes.booking import booking_operations
from app_routes.organizer import organizer_operations
from app_routes.vehicle import vehicle_operations
from app_routes.plan import plan_operations
from app_routes.vendor import vendor_operations
from app_routes.driver import driver_operations
from app_routes.invoice import invoice_operations
from app_routes.device import device_operations
from app_routes.auth import auth_operations
from app_routes.package import package_operations
from app_routes.callback import callback_operations
from app_routes.hotel_bookings import hotel_operations
from app_schemas.schema import AccessToken, ChatMessage, CostCentreModel, GuestModel, GuestUpdate, VerifyRequest, TariffPlanSchema, UpdateTariffPlanSchema
from common_utils import chat_messages_push_notification
from app_dependencies.schedulers.notify_vendor import start_scheduer,stop_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduer()
    yield
    stop_scheduler()

app = FastAPI(lifespan=lifespan)

# Middleware
# app.middleware("http")(timing_middleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(coordinator_operations.router, prefix="/api/coordinators")
app.include_router(booking_operations.router, prefix="/api/bookings")
app.include_router(organizer_operations.router, prefix="/api/organizers")
app.include_router(vehicle_operations.router, prefix="/api/vehicles")
app.include_router(plan_operations.router, prefix="/api/plans")
app.include_router(driver_operations.router, prefix="/api/drivers")
app.include_router(vendor_operations.router, prefix="/api/vendors")
app.include_router(package_operations.router, prefix="/api/packages")
app.include_router(invoice_operations.router, prefix="/api/invoices")
app.include_router(device_operations.router, prefix="/api/devices")
app.include_router(auth_operations.router, prefix="/api/auth")
app.include_router(callback_operations.router, prefix="/api/callbacks")
app.include_router(hotel_operations.router, prefix="/api/hotel_bookings")

@app.get("/api/health")
def health():
    return {"message":"Hello from the anchor point"}

@app.post("/api/cost-centres", status_code=status.HTTP_201_CREATED, response_model=dict)
def create_cost_centre(cost_centre_model: CostCentreModel, decoded_access_token: AccessToken = Depends(cutils.JWTBearer())):
    return cutils.create_cost_centre(decoded_access_token.email, decoded_access_token.role.value, cost_centre_model)

@app.get("/api/cost-centres", status_code=status.HTTP_200_OK, response_model=dict)
def get_cost_centres(decoded_access_token: AccessToken = Depends(cutils.JWTBearer())):
    return cutils.get_cost_centres(decoded_access_token.email, decoded_access_token.role.value)

@app.get("/api/cost-centres/{cost_centre_id}", status_code=status.HTTP_200_OK, response_model=dict)
def get_cost_centres_by_id(cost_centre_id: int , decoded_access_token: AccessToken = Depends(cutils.JWTBearer())):
    return cutils.get_cost_centre_by_id(decoded_access_token.email, decoded_access_token.role.value, cost_centre_id)

@app.put("/api/cost-centres/{cost_centre_id}", status_code=status.HTTP_200_OK, response_model=dict)
def update_cost_centre_by_id(cost_centre_id: int, update_cost_centre: CostCentreModel, decoded_access_token: AccessToken = Depends(cutils.JWTBearer())):
    return cutils.update_cost_centre_by_id(decoded_access_token.email, decoded_access_token.role.value, cost_centre_id, update_cost_centre)

@app.delete("/api/cost-centres/{cost_centre_id}", status_code=status.HTTP_200_OK, response_model=dict)
def delete_cost_centre_by_id(cost_centre_id: int , decoded_access_token: AccessToken = Depends(cutils.JWTBearer())):
    return cutils.delete_cost_centre_by_id(decoded_access_token.email, decoded_access_token.role.value, cost_centre_id)

@app.post("/api/access-token", status_code=status.HTTP_200_OK)
def get_access_token(credentials: HTTPAuthorizationCredentials= Depends(HTTPBearer())):
    return cutils.get_access_token(token=credentials.credentials)   

@app.post("/api/firebase/generate-token", status_code=status.HTTP_200_OK)
def generate_firebase_access_token(decoded_access_token: AccessToken = Depends(cutils.JWTBearer())):
    return cutils.generate_firebase_access_token(decoded_access_token.email, decoded_access_token.role.value)

@app.post("/api/firebase/verify-token", status_code=status.HTTP_200_OK)
def verify_firebase_access_token(request: VerifyRequest, decoded_access_token: AccessToken = Depends(cutils.JWTBearer())):
    return cutils.verify_firebase_access_token(decoded_access_token.email, decoded_access_token.role.value, request)

@app.get("/api/all_bookings", status_code=status.HTTP_200_OK, response_model=dict)
def get_organizer_booking_info(
    page: int = Query(1, title="Page Number", description="Page number for pagination"),
    limit: int = Query(10, title="Limit", description="Number of items per page", ge=1, le=10),
    booking_type: Annotated[list[str] | None, Query(title="Booking Type", description="Type of booking ie. hotel or cab")] = None,
    cab_type: Annotated[list[str] | None, Query(title="Cab Type", description="Type of cab ie. SUV, Sedan etc")] = None,
    status: Annotated[list[str] | None, Query(title="Status", description="Status of booking")] = None,
    vendor_city: Annotated[list[str] | None, Query(title="Vendor City", description="City of vendor")] = None,
    guest: Annotated[str | None, Query(title="Guest Name", description="Name of the guest")] = None,
    coordinator: Annotated[list[str] | None, Query(title="Coordinator Name", description="Name of the coordinator")] = None,
    organizer: Annotated[list[str] | None, Query(title="Organizer Name", description="Name of the organizer")] = None,
    vendor: Annotated[list[str] | None, Query(title="Vendor Name", description="Name of the vendor")] = None,
    bid: Annotated[str | None, Query(title="bid", description="Booking sequence id")] = None,
    travel_mode: Annotated[list[str] | None, Query(title="Travel Mode", description="Mode of travel")] = None,
    today: str = Query(None, title="Today Date", description="Filter by today"),
    this_week: str = Query(None, title="This Week", description="Filter by this week"),
    pickup_date: str = Query(None, title="Exact Date", description="Filter by exact date"),
    pickup_start_date: str = Query( None, title="Start Date", description="Filter by start date"),
    pickup_end_date: str = Query(None, title="End Date", description="Filter by end date"),
    decoded_access_token: AccessToken = Depends(cutils.JWTBearer()),
):
    return booking_utils.get_all_bookings(
        email=decoded_access_token.email,
        role=decoded_access_token.role.value,
        page=page,
        limit=limit,
        bid=bid,
        today=today,
        this_week=this_week,
        booking_type=booking_type,
        cab_type=cab_type,
        pickup_date=pickup_date,
        pickup_start_date=pickup_start_date,
        pickup_end_date=pickup_end_date,
        status=status,
        vendor_city=vendor_city,
        guest=guest,
        coordinator=coordinator,
        organizer=organizer,
        vendor=vendor,
        travel_mode=travel_mode
    )

@app.get("/api/guests/search", status_code=status.HTTP_200_OK, response_model=dict)
def search_guest_by_name(
    name: str = Query(None, title="Name", description="Name of the guest"),
    decoded_access_token: AccessToken = Depends(cutils.JWTBearer())):
    return booking_utils.search_guest_by_name(decoded_access_token.email, decoded_access_token.role.value, name)

@app.post("/api/guests", status_code=status.HTTP_200_OK, response_model=dict)
def get_guest_info(
    guest_request: GuestModel, decoded_access_token: AccessToken = Depends(cutils.JWTBearer()),
):
    return booking_utils.get_guest_info(decoded_access_token.email, decoded_access_token.role.value, guest_request)

@app.put("/api/guests", status_code=status.HTTP_200_OK, response_model=dict)
def get_guest_info(
    update_request: GuestUpdate, decoded_access_token: AccessToken = Depends(cutils.JWTBearer()),
):
    return booking_utils.create_or_update_guest_info(update_request.mobile, update_request.email, update_request.name)

@app.post("/api/send-push-notification", status_code=status.HTTP_200_OK)
def send_push_notification(background_tasks: BackgroundTasks, request: ChatMessage, decoded_access_token: AccessToken = Depends(cutils.JWTBearer())):
    background_tasks.add_task(chat_messages_push_notification.send_push_notification, decoded_access_token.email, decoded_access_token.role.value, request)
    return {"messaege": "Successfully send push notification"}

@app.post("/api/tariff_plans",status_code=status.HTTP_200_OK)
def create_tariff_plan_endpoint(tariff_plan: TariffPlanSchema, decoded_access_token: AccessToken = Depends(cutils.JWTBearer())):
    return cutils.create_tariff_plan(decoded_access_token.email, decoded_access_token.role.value, tariff_plan)

@app.get("/api/tariff_plans", status_code=status.HTTP_200_OK)
def get_all_tariff_plans_endpoint(
    city_id: int = Query(None, title="City ID", description="City ID"),
    package_id: int = Query(None, title="Package ID", description="Package ID"),
    decoded_access_token: AccessToken = Depends(cutils.JWTBearer()),
):
    return cutils.get_all_tariff_plans(
        decoded_access_token.email, decoded_access_token.role.value, city_id, package_id
    )
@app.get("/api/tariff_packages_vehicles", status_code=status.HTTP_200_OK)
def get_tariff_packages_vehicles_endpoint(
    city_id: int = Query(None, title="City ID", description="City ID"),
    decoded_access_token: AccessToken = Depends(cutils.JWTBearer()),
):
    return cutils.get_tariff_packages_vehicles(decoded_access_token.email, decoded_access_token.role.value, city_id)

@app.get("/api/tariff_plans/{tariff_plan_id}",status_code=status.HTTP_200_OK)
def get_single_tariff_plan(tariff_plan_id:int,decoded_access_token: AccessToken = Depends(cutils.JWTBearer())):
    return cutils.get_tariff_plan_by_id(decoded_access_token.email, decoded_access_token.role.value, tariff_plan_id)

@app.put("/api/tariff_plans/{tariff_plan_id}",status_code=status.HTTP_200_OK)
def update_tariff_plan(tariff_plan_id: int, update_tariff_plan : TariffPlanSchema, decoded_access_token: AccessToken = Depends(cutils.JWTBearer())):
    return cutils.update_tariff_plan_by_id(decoded_access_token.email, decoded_access_token.role.value, tariff_plan_id, update_tariff_plan)

@app.delete("/api/tariff_plans/{tariff_plan_id}",status_code=status.HTTP_200_OK)
def delete_tariff_plan(tariff_plan_id: int, decoded_access_token: AccessToken = Depends(cutils.JWTBearer())):
    return cutils.delete_tariff_plan(decoded_access_token.email, decoded_access_token.role.value, tariff_plan_id)

# Run the app
if __name__ == "__main__":
    uvicorn.run(
        app="app:app", host=cfg.LOCAL_HOST, port=int(cfg.LOCAL_PORT), reload=True
    )
