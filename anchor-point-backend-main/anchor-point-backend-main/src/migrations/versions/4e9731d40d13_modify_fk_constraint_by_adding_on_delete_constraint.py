"""modify_fk_constraint_by_adding_on_delete_constraint

Revision ID: 4e9731d40d13
Revises: f0a95a57c66e
Create Date: 2024-06-06 05:57:59.816008

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4e9731d40d13'
down_revision: Union[str, None] = 'f0a95a57c66e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def update_foreign_key_constraint(
    table_name, 
    constraint_name, 
    column_name, 
    referred_table_name, 
    referred_column_name, 
    ondelete='CASCADE'
):
    # Drop the existing foreign key constraint
    op.drop_constraint(constraint_name, table_name, type_='foreignkey')
    
    # Add the new foreign key constraint with specified ON DELETE option
    op.create_foreign_key(
        constraint_name,
        table_name,
        referred_table_name,
        [column_name],
        [referred_column_name],
        ondelete=ondelete
    )

def revert_foreign_key_constraint(
    table_name, 
    constraint_name, 
    column_name, 
    referred_table_name, 
    referred_column_name
):
    # Drop the existing foreign key constraint
    op.drop_constraint(constraint_name, table_name, type_='foreignkey')
    
    # Add the old foreign key constraint without ON DELETE option
    op.create_foreign_key(
        constraint_name,
        table_name,
        referred_table_name,
        [column_name],
        [referred_column_name]
    )

def upgrade():
    # Bookings
    update_foreign_key_constraint('bookings', 'bookings_coordinator_id_fkey', 'coordinator_id', 'coordinators', 'id')
    update_foreign_key_constraint('bookings', 'bookings_driver_id_fkey', 'driver_id', 'drivers', 'id')
    update_foreign_key_constraint('bookings', 'bookings_organizer_id_fkey', 'organizer_id', 'organizers', 'id')
    update_foreign_key_constraint('bookings', 'bookings_plan_id_fkey', 'plan_id', 'plans', 'id')
    update_foreign_key_constraint('bookings', 'bookings_vendor_id_fkey', 'vendor_id', 'vendors', 'id')
    update_foreign_key_constraint('bookings', 'cost_centres_fkey', 'cost_centre_id', 'cost_centres', 'id')

    # BookingEvents
    update_foreign_key_constraint('booking_events', 'booking_events_booking_id_fkey', 'booking_id', 'bookings', 'id')

    # VendorBookings
    update_foreign_key_constraint('vendor_bookings', 'vendor_bookings_booking_id_fkey', 'booking_id', 'bookings', 'id')

    # VendorInvoices
    update_foreign_key_constraint('vendor_invoices', 'vendor_invoices_booking_id_fkey', 'booking_id', 'bookings', 'id')

    # Vendors
    update_foreign_key_constraint('vendors', 'vendors_city_id_fkey', 'city_id', 'vendor_cities', 'id')

    # Waypoints
    update_foreign_key_constraint('waypoints', 'waypoints_booking_id_fkey', 'booking_id', 'bookings', 'id')
    update_foreign_key_constraint('waypoints', 'waypoints_guest_id_fkey', 'guest_id', 'guests', 'id')
    update_foreign_key_constraint('waypoints', 'waypoints_location_id_fkey', 'location_id', 'locations', 'id')

    # BookingOptimalRoutes
    update_foreign_key_constraint('booking_optimal_routes', 'booking_optimal_routes_booking_id_fkey', 'booking_id', 'bookings', 'id')

    # BookingLogs
    update_foreign_key_constraint('booking_logs', 'booking_logs_booking_id_fkey', 'booking_id', 'bookings', 'id')
    update_foreign_key_constraint('booking_logs', 'booking_logs_coordinator_id_fkey', 'coordinator_id', 'coordinators', 'id')
    update_foreign_key_constraint('booking_logs', 'booking_logs_source_id_fkey', 'source_id', 'locations', 'id')
    update_foreign_key_constraint('booking_logs', 'booking_logs_destination_id_fkey', 'destination_id', 'locations', 'id')
    update_foreign_key_constraint('booking_logs', 'booking_logs_guest_id_fkey', 'guest_id', 'guests', 'id')

    # DriverCharges
    update_foreign_key_constraint('driver_charges', 'driver_charges_vehicle_model_id_fkey', 'vehicle_model_id', 'vehicle_models', 'id')
    update_foreign_key_constraint('driver_charges', 'driver_charges_vendor_id_fkey', 'vendor_id', 'vendors', 'id')

    # Invoice 
    update_foreign_key_constraint('invoices', 'invoices_booking_id_fkey', 'booking_id', 'bookings', 'id')
    
    # Plans
    update_foreign_key_constraint('plans', 'plans_vendor_id_fkey', 'vendor_id', 'vendors', 'id')
    update_foreign_key_constraint('plans', 'plans_package_id_fkey', 'package_id', 'packages', 'id')
    update_foreign_key_constraint('plans', 'plans_vehicle_id_fkey', 'vehicle_id', 'vehicles', 'id')

    # Trip
    update_foreign_key_constraint('trips', 'trips_booking_id_fkey', 'booking_id', 'bookings', 'id')

    # TripEvents
    update_foreign_key_constraint('trip_events', 'trip_events_trip_id_fkey', 'trip_id', 'trips', 'id')
    
    # Vehicles
    update_foreign_key_constraint('vehicles', 'vehicles_vehicle_model_id_fkey', 'vehicle_model_id', 'vehicle_models', 'id')

def downgrade():
    # Bookings
    revert_foreign_key_constraint('bookings', 'bookings_coordinator_id_fkey', 'coordinator_id', 'coordinators', 'id')
    revert_foreign_key_constraint('bookings', 'bookings_driver_id_fkey', 'driver_id', 'drivers', 'id')
    revert_foreign_key_constraint('bookings', 'bookings_organizer_id_fkey', 'organizer_id', 'organizers', 'id')
    revert_foreign_key_constraint('bookings', 'bookings_plan_id_fkey', 'plan_id', 'plans', 'id')
    revert_foreign_key_constraint('bookings', 'bookings_vendor_id_fkey', 'vendor_id', 'vendors', 'id')
    revert_foreign_key_constraint('bookings', 'cost_centres_fkey', 'cost_centre_id', 'cost_centres', 'id')

    # BookingEvents
    revert_foreign_key_constraint('booking_events', 'booking_events_booking_id_fkey', 'booking_id', 'bookings', 'id')

    # VendorBookings
    revert_foreign_key_constraint('vendor_bookings', 'vendor_bookings_booking_id_fkey', 'booking_id', 'bookings', 'id')

    # VendorInvoices
    revert_foreign_key_constraint('vendor_invoices', 'vendor_invoices_booking_id_fkey', 'booking_id', 'bookings', 'id')

    # Vendors
    revert_foreign_key_constraint('vendors', 'vendors_city_id_fkey', 'city_id', 'vendor_cities', 'id')

    # Waypoints
    revert_foreign_key_constraint('waypoints', 'waypoints_booking_id_fkey', 'booking_id', 'bookings', 'id')
    revert_foreign_key_constraint('waypoints', 'waypoints_guest_id_fkey', 'guest_id', 'guests', 'id')
    revert_foreign_key_constraint('waypoints', 'waypoints_location_id_fkey', 'location_id', 'locations', 'id')

    # BookingOptimalRoutes
    revert_foreign_key_constraint('booking_optimal_routes', 'booking_optimal_routes_booking_id_fkey', 'booking_id', 'bookings', 'id')

    # BookingLogs
    revert_foreign_key_constraint('booking_logs', 'booking_logs_booking_id_fkey', 'booking_id', 'bookings', 'id')
    revert_foreign_key_constraint('booking_logs', 'booking_logs_coordinator_id_fkey', 'coordinator_id', 'coordinators', 'id')
    revert_foreign_key_constraint('booking_logs', 'booking_logs_source_id_fkey', 'source_id', 'locations', 'id')
    revert_foreign_key_constraint('booking_logs', 'booking_logs_destination_id_fkey', 'destination_id', 'locations', 'id')
    revert_foreign_key_constraint('booking_logs', 'booking_logs_guest_id_fkey', 'guest_id', 'guests', 'id')

    # DriverCharges
    revert_foreign_key_constraint('driver_charges', 'driver_charges_vehicle_model_id_fkey', 'vehicle_model_id', 'vehicle_models', 'id')
    revert_foreign_key_constraint('driver_charges', 'driver_charges_vendor_id_fkey', 'vendor_id', 'vendors', 'id')

    # Invoice 
    revert_foreign_key_constraint('invoices', 'invoices_booking_id_fkey', 'booking_id', 'bookings', 'id')
    
    # Plans
    revert_foreign_key_constraint('plans', 'plans_vendor_id_fkey', 'vendor_id', 'vendors', 'id')
    revert_foreign_key_constraint('plans', 'plans_package_id_fkey', 'package_id', 'packages', 'id')
    revert_foreign_key_constraint('plans', 'plans_vehicle_id_fkey', 'vehicle_id', 'vehicles', 'id')

    # Trip
    revert_foreign_key_constraint('trips', 'trips_booking_id_fkey', 'booking_id', 'bookings', 'id')

    # TripEvents
    revert_foreign_key_constraint('trip_events', 'trip_events_trip_id_fkey', 'trip_id', 'trips', 'id')
    
    # Vehicles
    revert_foreign_key_constraint('vehicles', 'vehicles_vehicle_model_id_fkey', 'vehicle_model_id', 'vehicle_models', 'id')