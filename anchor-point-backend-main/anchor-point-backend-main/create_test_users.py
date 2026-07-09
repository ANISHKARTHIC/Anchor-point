import sys
import os

# Ensure the correct paths so imports work
sys.path.append(os.path.join(os.path.dirname(__file__), "src"))

import dotenv
dotenv.load_dotenv(os.path.join(os.path.dirname(__file__), "src", ".env"))

from app_models.database import SessionMaker, db_session_context
from app_models.models import Organizer, Vendor, Coordinator, VendorCity
from app_models.crud import insert_record, select_records
from common_utils import utils as cutils
from app_routes.organizer.schema import OrganizerRole

def main():
    session = SessionMaker()
    db_session_context.set(session)

    try:
        # 1. Super Organizer
        organizer_email = "admin@example.com"
        existing_org = select_records(Organizer, filter_conditions=[Organizer.email == organizer_email]).first()
        if not existing_org:
            insert_record(Organizer, email=organizer_email, name="Super Admin", password=cutils.get_hashed_password("password123"), role=OrganizerRole.SUPER.value, is_active=True, is_verified=True)
            print("Created Organizer: admin@example.com / password123")
        else:
            print("Organizer admin@example.com already exists")

        # 2. City
        city_name = "TestCity"
        existing_city = select_records(VendorCity, filter_conditions=[VendorCity.city == city_name]).first()
        if not existing_city:
            existing_city = insert_record(VendorCity, city=city_name, is_active=True)
            print("Created City: TestCity")

        # 3. Vendor
        vendor_email = "vendor@example.com"
        existing_vendor = select_records(Vendor, filter_conditions=[Vendor.email == vendor_email]).first()
        if not existing_vendor:
            insert_record(Vendor, email=vendor_email, name="Test Vendor", password=cutils.get_hashed_password("password123"), primary_mobile="1234567890", address="123 Vendor St", city_id=existing_city.id, is_active=True, is_verified=True)
            print("Created Vendor: vendor@example.com / password123")
        else:
            print("Vendor vendor@example.com already exists")

        # 4. Coordinator
        coord_email = "coordinator@example.com"
        existing_coord = select_records(Coordinator, filter_conditions=[Coordinator.email == coord_email]).first()
        if not existing_coord:
            insert_record(Coordinator, email=coord_email, name="Test Coordinator", mobile="0987654321", is_active=True, is_verified=True)
            print("Created Coordinator: coordinator@example.com")
        else:
            print("Coordinator coordinator@example.com already exists")

        session.commit()
        print("Database commit successful.")
    except Exception as e:
        session.rollback()
        print(f"Error creating users: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    main()
