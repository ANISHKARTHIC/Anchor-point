"""
The table app_schemas used in our app are placed here as app_models.
"""
import uuid
from sqlalchemy import (
    Column,
    Sequence,
    Integer,
    String,
    BigInteger,
    Float,
    Boolean,
    Text,
    TIMESTAMP,
    ForeignKey,
    BOOLEAN,
    Date,
    func,
    ARRAY
)
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import JSONB, UUID
from datetime import datetime, timezone

Base = declarative_base()

hotel_invoice_id_seq = Sequence('hotel_invoice_id_seq')
yearly_cab_invoice_id_seq = Sequence('yearly_cab_invoice_id_seq')
yearly_cab_credit_note_id_seq = Sequence('yearly_cab_credit_note_id_seq')

class Booking(Base):
    """
    Represents a booking in the system.

    Attributes:
        id (int): The unique identifier for the booking.
        organizer_id (int): The ID of the organization that made the booking.
        coordinator_id (int): The ID of the coordinator responsible for the booking.
        status (str): The status of the booking.
        booking_date (datetime): The date and time of the booking.
        agreed_package_id (int): The ID of the agreed plan for the booking.
        organizers (Organizer): Relationship to the organizer of the booking.
        coordinators (Coordinator): Relationship to the coordinator of the booking.
        plan (Plan): Relationship to the agreed plan for the booking.
    """

    __tablename__ = "bookings"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False,
    )
    type = Column(String)
    bid = Column(String)
    cost_centre_id = Column(Integer, ForeignKey("cost_centres.id"))
    cab_type = Column(String)
    organizer_id = Column(BigInteger, ForeignKey("organizers.id"))
    vendor_id = Column(BigInteger, ForeignKey("vendors.id"))
    coordinator_id = Column(BigInteger, ForeignKey("coordinators.id"))
    plan_id = Column(BigInteger, ForeignKey("plans.id"))
    travel_mode = Column(String)
    driver_id = Column(BigInteger, ForeignKey("drivers.id"))
    city_id = Column(BigInteger, ForeignKey("vendor_cities.id"))
    booking_datetime = Column(TIMESTAMP(timezone=True))
    description = Column(String)
    po_number = Column(String, nullable=False)
    cc_recipients = Column(ARRAY(String))
    cdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.utcnow,
        server_default=func.now(),
        nullable=False,
    )
    mdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
    cost_centre = relationship("CostCentre")
    organizers = relationship("Organizer")
    coordinators = relationship("Coordinator")
    vendor = relationship("Vendor")
    plan = relationship("Plan")
    driver = relationship("Driver")
    city = relationship("VendorCity")


class BookingLogs(Base):
    """
    Represents a booking logs in the system.

    Attributes:
        id (int): The unique identifier for the booking.
        coordinator_id (int): The ID of the coordinator responsible for the booking.
        source (int): The source of the guest.
        destination (int): The destination of the guest.
        organizers (Organizer): Relationship to the organizer of the booking.
        coordinators (Coordinator): Relationship to the coordinator of the booking.
    """

    __tablename__ = "booking_logs"

    id = Column(BigInteger, primary_key=True)
    source_id = Column(BigInteger, ForeignKey("locations.id"))
    destination_id = Column(BigInteger, ForeignKey("locations.id"))
    coordinator_id = Column(BigInteger, ForeignKey("coordinators.id"))
    rank= Column(String)
    internal_id= Column(String)
    vessel_name= Column(String)
    flight_details= Column(String)
    guest_message_sid = Column(String)
    date_of_duty = Column(TIMESTAMP(timezone=True))
    booking_id = Column(UUID, ForeignKey("bookings.id"))
    email = Column(String)
    mobile = Column(String)
    alternate_email = Column(String)
    alternate_mobile = Column(String)
    name = Column(String)
    cdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.utcnow,
        server_default=func.now(),
        nullable=False,
    )
    mdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
    coordinators = relationship("Coordinator")
    source = relationship("Location", foreign_keys=[source_id])
    destination = relationship("Location", foreign_keys=[destination_id])

class Waypoint(Base):
    __tablename__ = "waypoints"
    
    id = Column(BigInteger, primary_key=True)
    booking_log_id = Column(BigInteger, ForeignKey("booking_logs.id"), nullable=True)
    location_id = Column(BigInteger, ForeignKey("locations.id"), nullable=False)
    waypoint = relationship("Location", foreign_keys=[location_id])


class Organizer(Base):
    """
    Represents an organizer in the system.

    Attributes:
        id (int): The unique identifier for the organizer.
        name (str): The name of the organizer.
        email (str): The email address of the organizer.
        password (str): The password of the organizer.
    """

    __tablename__ = "organizers"

    id = Column(BigInteger, primary_key=True)
    email = Column(String(255), nullable=False, unique=True)
    name = Column(String(255), nullable=True)
    password = Column(Text, nullable=False)
    role = Column(Integer, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    last_logged_in = Column(TIMESTAMP(timezone=True), nullable=True)
    cdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.utcnow,
        server_default=func.now(),
        nullable=False,
    )
    mdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )


class Domain(Base):
    """
    Represents a domain in the system.

    Attributes:
        name (str): The name of the domain.
        is_active (bool): A flag indicating whether the domain is active or not.
    """

    __tablename__ = "domains"

    name = Column(String(255), nullable=False, primary_key=True)
    is_active = Column(Boolean, default=True)


class Coordinator(Base):
    """
    Represents a coordinator in the system.

    Attributes:
        id (int): The unique identifier for the organizer.
        email (str): The email address of the organizer.
        mobile(str): The primary mobile number of the driver.
        otp (int): The one-time password for authentication.
        is_active (bool): A flag indicating whether the organizer is active or not.
        is_verified (bool): A flag indicating whether the organizer is verified or not.
        last_otp_sent (datetime): The date and time when the last OTP was sent.
        last_logged_in (datetime): The date and time of the last login.
    """

    __tablename__ = "coordinators"

    id = Column(BigInteger, primary_key=True)
    email = Column(String(255), nullable=False, unique=True)
    name = Column(String(255), nullable=True)
    mobile = Column(String(20), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    last_logged_in = Column(TIMESTAMP(timezone=True), nullable=True)
    cdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.utcnow,
        server_default=func.now(),
        nullable=False,
    )
    mdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )


class Vendor(Base):
    """
    Represents a vendor in the system.

    Attributes:
        id (int): The unique identifier for the vendor.
        name (str): The name of the vendor.
        password (str): The password of the vendor.
        primary_mobile (str): The primary mobile number of the vendor.
        secondary_mobile (str): The secondary mobile number of the vendor.
        address (str): The address of the vendor.
        is_active (bool): A flag indicating whether the vendor is active or not.
    """

    __tablename__ = "vendors"

    id = Column(BigInteger, primary_key=True)
    vendor_type = Column(String, default='cab')
    is_third_party = Column(String, default=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    password = Column(Text, nullable=False)
    primary_mobile = Column(String(20), nullable=False)
    secondary_mobile = Column(String(20))
    tax = Column(Float, default=0)
    coordinates = Column(String)
    gst = Column(Integer, default=0)
    address = Column(Text, nullable=False)
    city_id = Column(Integer, ForeignKey("vendor_cities.id"))
    is_active = Column(Boolean, nullable=False, default=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    last_logged_in = Column(TIMESTAMP(timezone=True), nullable=True)
    cdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.utcnow,
        server_default=func.now(),
        nullable=False,
    )
    mdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
    vendor_city = relationship("VendorCity")

class VendorGarageLocation(Base):
    __tablename__ = "vendor_garage_locations"

    id = Column(BigInteger, primary_key=True)
    city_id = Column(Integer, ForeignKey("vendor_cities.id", ondelete='CASCADE'), nullable=False)
    vendor_id = Column(BigInteger, ForeignKey("vendors.id", ondelete='CASCADE'), nullable=False)
    title = Column(String)
    address = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    cdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.utcnow,
        server_default=func.now(),
        nullable=False,
    )
    mdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
    vendor = relationship("Vendor")
    vendor_city = relationship("VendorCity")

class VendorBookings(Base):
    __tablename__ = "vendor_bookings"

    id = Column(BigInteger, primary_key=True)
    vendor_id = Column(BigInteger, ForeignKey("vendors.id"), nullable=False)
    booking_id = Column(UUID, ForeignKey("bookings.id"), nullable=False)
    status = Column(String, nullable=False)
    meta_data = Column(JSONB)
    cdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.utcnow,
        server_default=func.now(),
        nullable=False,
    )
    mdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
    booking = relationship("Booking")

class TripEvent(Base):
    """
    Represents an event associated with a trip.

    Attributes:
        trip_id (int): The ID of the trip to which the event is related.
        event (str): The type of the event.
        configs (dict): Additional configs associated with the event.
        trip (Trip): Relationship to the trip associated with the event.
    """

    __tablename__ = "trip_events"
    id = Column(BigInteger, primary_key=True)
    trip_id = Column(BigInteger, ForeignKey("trips.id"))
    event = Column(String, nullable=False)
    meta_data = Column(JSONB)
    cdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.utcnow,
        server_default=func.now(),
        nullable=False,
    )
    mdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
    trip = relationship("Trip")


class BookingEvent(Base):
    """
    Represents an event associated with a booking.

    Attributes:
        booking_id (UUID): The ID of the booking to which the event is related.
        type (str): The type of the event.
        configs (dict): Additional configs associated with the event.
        booking (Booking): Relationship to the booking associated with the event.
    """

    __tablename__ = "booking_events"
    id = Column(BigInteger, primary_key=True)
    booking_id = Column(UUID, ForeignKey("bookings.id"))
    event = Column(String, nullable=False)
    meta_data = Column(JSONB)
    cdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.utcnow,
        server_default=func.now(),
        nullable=False,
    )
    mdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
    booking = relationship("Booking")


class CostCentre(Base):
    """
    Represents a cost center in the system.

    Attributes:
        code (str): The code or identifier for the cost center.
        is_active (bool): A flag indicating whether the cost center is active or not.
    """

    __tablename__ = "cost_centres"
    id = Column(Integer, autoincrement=True, primary_key=True)
    code = Column(String(255), unique=True)
    gstin_no = Column(String)
    address = Column(String)


class Guest(Base):
    """
    Represents a guest in the system.

    Attributes:
        id (int): The unique identifier for the guest.
        email (str): The email address of the guest.
        mobile (str): The mobile number of the guest.
        cost_center (list): List of cost centers associated with the guest.
        check_in (int): The check-in timestamp.
        check_out (int): The check-out timestamp.
    """

    __tablename__ = "guests"

    id = Column(BigInteger, primary_key=True)
    name = Column(String(255))
    email = Column(String(255))
    mobile = Column(String(20))
    cdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.utcnow,
        server_default=func.now(),
        nullable=False,
    )
    mdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )


class Location(Base):
    """
    Represents a location information.

    Attributes:
        id (int): Primary key for the location record.
        name (str): Name or description of the location.
        address (str): Street address of the location.
        landmark (str): Notable landmark associated with the location.
        latitude (float): Latitude coordinate of the location.
        longitude (float): Longitude coordinate of the location.
    """

    __tablename__ = "locations"

    id = Column(BigInteger, primary_key=True)
    name = Column(String)
    address = Column(String)
    title = Column(String)
    landmark = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    cdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.utcnow,
        server_default=func.now(),
        nullable=False,
    )
    mdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )


class Vehicle(Base):
    """
    Represents a vehicle in the system.

    Attributes:
       id (int): The unique identifier for the vehicle.
       name (str): The name of the vehicle.
       vehicle_model_id (str): The Id of vehicle model table.
    """

    __tablename__ = "vehicles"

    id = Column(BigInteger, primary_key=True)
    name = Column(String, unique=True)
    vehicle_model_id = Column(
        BigInteger, ForeignKey("vehicle_models.id", ondelete="CASCADE"), nullable=False
    )
    is_active = Column(Boolean, nullable=False, default=True)
    vehicle_model = relationship("VehicleModel")


class VehicleModel(Base):
    """
    Represents a vehicle models in the system.

    Attributes:
       id (int): The unique identifier for the vehicle.
       model (str): The model of the vehicle.
    """

    __tablename__ = "vehicle_models"

    id = Column(BigInteger, primary_key=True)
    vehicle_model = Column(String, unique=True)
    is_active = Column(Boolean, nullable=False, default=True)


class VendorCity(Base):
    """
    Represents a vehicle models in the system.

    Attributes:
       id (int): The unique identifier for the vehicle.
       city (str): The name of the city.
    """
    __tablename__ = "vendor_cities"
    
    id = Column(BigInteger, primary_key=True)
    city = Column(String, unique=True)
    is_active = Column(Boolean, nullable=False, default=True)


class Driver(Base):
    """
    Represents a driver in the system.

    Attributes:
       id (int): The unique identifier for the driver.
       name (str): The name of the driver.
       primary_mobile (str): The primary mobile number of the driver.
       secondary_mobile (str, optional): The optional secondary mobile number of the driver.
    """

    __tablename__ = "drivers"

    id = Column(BigInteger, primary_key=True)
    name = Column(String)
    vehicle_no = Column(String)
    primary_mobile = Column(String(20), nullable=False)
    secondary_mobile = Column(String(20))
    otp = Column(String(5))
    message_sid = Column(String)


class DriverCharge(Base):
    """
    Represents the charges for a driver.

    Attributes:
       model (str): The model of the charges.
       bata (float): The bata value.
    """

    __tablename__ = "driver_charges"
    id = Column(BigInteger, primary_key=True)
    vendor_id = Column(BigInteger, ForeignKey("vendors.id"), nullable=False)
    vehicle_model_id = Column(
        BigInteger, ForeignKey("vehicle_models.id"), nullable=False
    )
    charge = Column(Float)
    is_active = Column(Boolean, nullable=False, default=True)
    vendor = relationship("Vendor")
    vehicle_model = relationship("VehicleModel")


class Plan(Base):
    """
    Represents the association between a plan and a vendor in the system.

    Attributes:
       package_id (int): The ID of the associated plan.
       vendor_id (int): The ID of the associated vendor.
       vendor_cost (float): The cost associated with the vendor for the plan.
       extra_distance_cost (float): The extra distance cost for the plan.
       extra_hour_cost (float): The extra hour cost for the plan.
       plan (relationship): Relationship to the associated Plan object.
       vendor (relationship): Relationship to the associated Vendor object.
    """

    __tablename__ = "plans"

    id = Column(BigInteger, primary_key=True, index=True)
    package_id = Column(BigInteger, ForeignKey("packages.id"), nullable=False)
    vehicle_id = Column(BigInteger, ForeignKey("vehicles.id"), nullable=False)
    vendor_id = Column(BigInteger, ForeignKey("vendors.id"), nullable=False)
    vendor_cost = Column(Float, nullable=False)
    extra_distance_cost = Column(Float, nullable=False)
    extra_hour_cost = Column(Float, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    package = relationship("Package")
    vendor = relationship("Vendor")
    vehicle = relationship("Vehicle")


class TariffPlan(Base):
    """
    Represents a tariff plan in the system.

    Attributes:
       package_id (int): The ID of the associated plan.
       city_id (int): The ID of the associated city.
       vehicle_id (int): The ID of the associated vehicle.
       cost (float): The cost associated for the tariff plan.
       extra_distance_cost (float): The extra distance cost for the plan.
       extra_hour_cost (float): The extra hour cost for the plan.       
       package (relationship): Relationship to the associated Plan object.
       city (relationship): Relationship to the associated Vendor object.
    """

    __tablename__ = "tariff_plans"

    id = Column(BigInteger, primary_key=True, index=True)
    package_id = Column(BigInteger, ForeignKey("packages.id"), nullable=False)
    vehicle_id = Column(BigInteger, ForeignKey("vehicles.id"), nullable=False)
    city_id = Column(Integer, ForeignKey("vendor_cities.id"), nullable=False)
    cost = Column(Float, nullable=False)
    extra_distance_cost = Column(Float, nullable=False)
    extra_hour_cost = Column(Float, nullable=False)
    cdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
    mdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.now(timezone.utc),
        onupdate=datetime.now(timezone.utc),
        nullable=False,
    )
    package = relationship("Package")
    vehicle = relationship("Vehicle")
    city = relationship("VendorCity")


class Package(Base):
    """
    Represents a packages in the system.

    Attributes:
       id (int): The unique identifier for the package.
       vehicle_id (int): The ID of the associated vehicle for the package.
       distance_kms (int): The distance in kilometers for the package.
       interval_hrs (int): The interval in hours for the package.
       description (str): The description of the package.
       cdate (datetime): The creation date of the package.
       mdate (datetime): The last modification date of the package.
       vehicle (relationship): Relationship to the associated Vehicle object.
    """

    __tablename__ = "packages"

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String, nullable=False)
    distance_kms = Column(Integer, nullable=False)
    interval_hrs = Column(Integer, nullable=False)
    description = Column(String(255))
    is_active = Column(Boolean, nullable=False, default=True)
    cdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.utcnow,
        server_default=func.now(),
        nullable=False,
    )
    mdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )


class Trip(Base):
    """
    Represents a trip in the system.

    Attributes:
       id (int): The unique identifier for the trip.
       booking_id (str): The ID of the associated booking for the trip.
       starting_odo (int): The starting odometer reading for the trip.
       ending_odo (int): The ending odometer reading for the trip.
       starting_odo_proof (str): The starting odometer proof for the trip.
       ending_odo_proof (str): The ending odometer proof for the trip.
       signature (str): The signature for the trip.
       tracker_url (str): The URL of the tracker for the trip.
       cdate (datetime): The creation date of the trip.
       mdate (datetime): The last modification date of the trip.
       plan (relationship): Relationship to the associated Plan object.
       driver (relationship): Relationship to the associated Driver object.
       vendor (relationship): Relationship to the associated Vendor object.
       bookings (relationship): Relationship to the associated Booking objects.
    """

    __tablename__ = "trips"

    id = Column(BigInteger, primary_key=True, index=True)
    booking_id = Column(UUID, ForeignKey("bookings.id"))
    starting_location = Column(String)
    starting_odo = Column(Integer)
    starting_odo_proof = Column(String)
    starting_time = Column(TIMESTAMP(timezone=True))
    ending_odo = Column(Integer)
    ending_location = Column(String)
    ending_odo_proof = Column(String)
    ending_time = Column(TIMESTAMP(timezone=True))
    signature = Column(String)
    distance = Column(Float)
    duration = Column(Float)
    cdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.utcnow,
        server_default=func.now(),
        nullable=False,
    )
    mdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
    bookings = relationship("Booking")


class Invoice(Base):
    """
    Represents an invoice in the system.

    Attributes:
        id (uuid.UUID): The unique identifier for the invoice.
        booking_id (uuid.UUID): The identifier for the associated booking.
        event (str): The event description associated with the invoice.
        comment (str): Additional comments related to the invoice.
        invoice_amount (float): The amount specified in the invoice.
        driver_cost (float): The amount of driver cost specified in the invoice.
        extra_kms_cost (float): Trip extra kms cost.
        extra_hours_cost (float):  Trip extra hours cost.
        cdate (datetime): The creation date of the invoice.
        booking (Booking): The associated Booking object.
    """

    __tablename__ = "invoices"

    id = Column(BigInteger, primary_key=True, index=True)
    invoice_id = Column(String, unique=True)
    booking_id = Column(UUID, ForeignKey("bookings.id"))
    event = Column(String, nullable=False)
    description = Column(String)
    invoice_amount = Column(Float, nullable=False)
    cgst_amount = Column(Float, nullable=False, default=0.0)
    sgst_amount = Column(Float, nullable=False, default=0.0)
    extra_kms = Column(Float, nullable=False, default=0.0)
    extra_hrs = Column(Float, nullable=False, default=0.0)
    extra_distance_cost = Column(Float, nullable=False, default=0.0)
    extra_hour_cost = Column(Float, nullable=False, default=0.0)
    parking_and_toll = Column(Float, nullable=False, default=0.0)
    miscellaneous = Column(Float, nullable=False, default=0.0)
    cancellation_amount = Column(Float, nullable=False, default=0.0)
    discount_percent = Column(Float, default=0.0)
    base_fare = Column(Float)
    driver_charge = Column(Float)
    po_number = Column(String)
    supporting_document_url = Column(String)
    cdate = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, server_default=func.now(), nullable=False)
    mdate = Column(
    TIMESTAMP(timezone=True),
    default=datetime.utcnow,
    onupdate=datetime.utcnow,
    nullable=False,
    )
    taxable_sub_total = Column(Float, default=0)
    non_taxable_sub_total = Column(Float, default=0)
    status = Column(String, nullable=False, default='None')
    booking = relationship("Booking")

class CreditNoteInvoice(Base):
    """
    Represents an credit note invoices in the system.

    Attributes:
        id (uuid.UUID): The unique identifier for the invoice.
        invoice_id (uuid.UUID): The identifier for the associated invoice.
        invoice_amount (float): The amount specified in the invoice.
        driver_cost (float): The amount of driver cost specified in the invoice.
        extra_kms_cost (float): Trip extra kms cost.
        extra_hours_cost (float):  Trip extra hours cost.
        cdate (datetime): The creation date of the invoice.
    """

    __tablename__ = "credit_note_invoices"

    id = Column(BigInteger, primary_key=True, index=True)
    invoice_id = Column(BigInteger, ForeignKey("invoices.id"), unique=True)
    credit_note_id = Column(String, unique=True)
    base_fare = Column(Float)
    extra_kms = Column(Float, nullable=False, default=0.0)
    extra_hrs = Column(Float, nullable=False, default=0.0)
    extra_distance_cost = Column(Float, nullable=False, default=0.0)
    extra_hour_cost = Column(Float, nullable=False, default=0.0)
    parking_and_toll = Column(Float, nullable=False, default=0.0)
    miscellaneous = Column(Float, nullable=False, default=0.0)
    cancellation_amount = Column(Float, nullable=False, default=0.0)
    discount_percent = Column(Float, default=0.0)
    driver_charge = Column(Float)
    cgst_amount = Column(Float, nullable=False, default=0.0)
    sgst_amount = Column(Float, nullable=False, default=0.0)
    taxable_sub_total = Column(Float, default=0.0)
    non_taxable_sub_total = Column(Float, default=0.0)
    invoice_amount = Column(Float, nullable=False)
    description = Column(String)
    cdate = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, server_default=func.now(), nullable=False)
    mdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
    invoice = relationship("Invoice")

class Device(Base):
    __tablename__= "devices"

    id = Column(BigInteger, primary_key=True)
    email = Column(String, nullable=False)
    role = Column(String, nullable=False)
    fcm_token = Column(String, nullable=False)
    device_type = Column(String, nullable=False)
    cdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.utcnow,
        server_default=func.now(),
        nullable=False,
    )

class BookingOptimalRoute(Base):
    __tablename__= "booking_optimal_routes"

    id = Column(BigInteger, primary_key=True)
    booking_id = Column(UUID, ForeignKey("bookings.id"))
    depot = Column(String, nullable=False)
    optimal_route = Column(JSONB, nullable=False)
    cdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.utcnow,
        server_default=func.now(),
        nullable=False,
    )
    booking = relationship("Booking")


class VendorInvoices(Base):
    __tablename__= "vendor_invoices"

    id = Column(BigInteger, primary_key=True)
    booking_id = Column(UUID, ForeignKey("bookings.id"), unique=True)
    plan_id = Column(BigInteger, ForeignKey("plans.id"))
    invoice_amount = Column(Float, nullable=False)
    cancellation_amount = Column(Float, nullable=True)
    event = Column(String, nullable=False)
    comment = Column(String)
    miscellaneous = Column(Float)
    parking_and_toll = Column(Float)
    driver_charge = Column(Float, nullable=False)
    base_fare = Column(Float, nullable=False)
    discount_percent = Column(Float)
    extra_kms = Column(Float)
    extra_hrs = Column(Float)
    extra_kms_qty = Column(Float)
    extra_hrs_qty = Column(Float)
    description = Column(String)
    cdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
    booking = relationship("Booking")
    plan = relationship("Plan")

class PasswordResetTokens(Base):
    __tablename__= "password_reset_tokens"
    
    id = Column(BigInteger, primary_key=True)
    email =  Column(String(255))
    role = Column(String(255))
    token = Column(String(255))
    cdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
    mdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.now(timezone.utc),
        onupdate=datetime.now(timezone.utc),
        nullable=False,
    )

class BookingActivityLog(Base):
    __tablename__= "booking_activity_log"
    
    id = Column(BigInteger, primary_key=True)
    booking_id = Column(UUID)
    booking_type = Column(String)
    event = Column(String)
    meta_data = Column(JSONB)
    cdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

class HotelBooking(Base):   
    __tablename__= "hotel_bookings"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False,
        index=True
    )
    bid = Column(String, nullable=False)
    city = Column(String, nullable=False)
    trip_type = Column(String, nullable=False)
    no_of_rooms = Column(Integer, nullable=False)
    room_type = Column(String, nullable=False)
    no_of_adults = Column(Integer, nullable=False)
    no_of_children = Column(Integer, nullable=False)
    coordinator_id = Column(BigInteger, ForeignKey("coordinators.id", ondelete='CASCADE'))
    organizer_id = Column(BigInteger, ForeignKey("organizers.id", ondelete='CASCADE'))
    vendor_id = Column(BigInteger, ForeignKey("vendors.id", ondelete='CASCADE'))
    check_in = Column(Date, nullable=False)
    check_out = Column(Date, nullable=False)
    cost_centre_id = Column(Integer, ForeignKey("cost_centres.id", ondelete='CASCADE'))
    billing_option = Column(String)
    description = Column(String)
    pickup = Column(JSONB)
    drop = Column(JSONB)
    confirmation_no = Column(String)
    related_booking_id = Column(String)
    po_number = Column(String)
    cc_recipients = Column(ARRAY(String))
    cdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
    mdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.now(timezone.utc),
        onupdate=datetime.now(timezone.utc),
        nullable=False,
    )
    cost_centre = relationship("CostCentre")
    organizers = relationship("Organizer")
    coordinators = relationship("Coordinator")
    vendor = relationship("Vendor")

class HotelBookingGuest(Base):
    __tablename__ = 'hotel_booking_guests'
    
    id = Column(BigInteger, primary_key=True, index=True)
    booking_id = Column(UUID, ForeignKey('hotel_bookings.id', ondelete='CASCADE'),nullable=False)
    is_primary = Column(BOOLEAN, default=False)
    rank = Column(String)
    vessel_name = Column(String)
    internal_id = Column(String)
    email = Column(String)
    mobile = Column(String)
    name = Column(String)
    guest_message_sid = Column(String)
    cdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    ) 
    booking = relationship("HotelBooking")   

class HotelBookingRoomDetail(Base):
    __tablename__ = 'hotel_booking_room_details'
    
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(UUID, ForeignKey('hotel_bookings.id', ondelete='CASCADE'), nullable=False)
    room_type = Column(String, nullable=False)
    no_of_rooms = Column(Integer, nullable=False)
    cdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    ) 
    booking = relationship("HotelBooking")

class HotelBookingEditRequest(Base):
    __tablename__ = 'hotel_booking_edit_requests'
    
    id = Column(BigInteger, primary_key=True, index=True)
    booking_id = Column(UUID, ForeignKey('hotel_bookings.id', ondelete='CASCADE'), nullable=False)
    description = Column(String, nullable=False)
    cdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    ) 
    booking = relationship("HotelBooking")

class HotelBookingEditRequestHistory(Base):
    __tablename__ = 'hotel_booking_edit_request_history'
    
    id = Column(BigInteger, primary_key=True)
    edit_request_id = Column(BigInteger, ForeignKey('hotel_booking_edit_requests.id', ondelete='CASCADE'), nullable=False)
    status = Column(String, nullable=False)
    meta_data = Column(JSONB)
    cdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
        ) 
    hotel_booking_edit_request = relationship("HotelBookingEditRequest")

class HotelBookingEvent(Base):
    __tablename__ = "hotel_booking_events"

    id = Column(BigInteger, primary_key=True)
    booking_id = Column(UUID, ForeignKey('hotel_bookings.id', ondelete='CASCADE'), nullable=False)
    event = Column(String, nullable=False)
    meta_data = Column(JSONB)
    cdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
    mdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.now(timezone.utc),
        onupdate=datetime.now(timezone.utc),
        nullable=False,
    )
    booking = relationship("HotelBooking")

class VendorHotelBookings(Base):
    __tablename__ = "vendor_hotel_bookings"

    id = Column(BigInteger, primary_key=True)
    vendor_id = Column(BigInteger, ForeignKey("vendors.id"), nullable=False)
    booking_id = Column(UUID, ForeignKey('hotel_bookings.id', ondelete='CASCADE'), nullable=False)
    status = Column(String, nullable=False)
    meta_data = Column(JSONB)
    cdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
    mdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.now(timezone.utc),
        onupdate=datetime.now(timezone.utc),
        nullable=False,
    )
    booking = relationship("HotelBooking")
    vendor = relationship("Vendor")

class HotelMealPlan(Base):
    __tablename__ = "hotel_meal_plans"
    
    id = Column(BigInteger, primary_key=True)
    name = Column(String, nullable=False)

class HotelRoomCategory(Base):
    __tablename__ = "hotel_room_categories"

    id = Column(BigInteger, primary_key=True)
    name = Column(String, nullable=False)

class HotelPricing(Base):
    __tablename__ = "hotel_pricing"

    id = Column(BigInteger, primary_key=True)
    vendor_id = Column(BigInteger, ForeignKey("vendors.id"), nullable=False)
    meal_plan_id = Column(BigInteger, ForeignKey("hotel_meal_plans.id"), nullable=False)
    room_category_id = Column(BigInteger, ForeignKey("hotel_room_categories.id"), nullable=False)
    single_room_rate = Column(Float, nullable=False)
    double_room_rate = Column(Float, nullable=True)
    inclusions = Column(String, nullable=False)
    cdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
    mdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.now(timezone.utc),
        onupdate=datetime.now(timezone.utc),
        nullable=False,
    )
    vendor = relationship("Vendor")
    meal_plan = relationship("HotelMealPlan")
    room_category = relationship("HotelRoomCategory")

class HotelInvoice(Base):
    __tablename__ = "hotel_invoices"

    id = Column(BigInteger, primary_key=True)
    booking_id = Column(UUID, ForeignKey('hotel_bookings.id', ondelete='CASCADE'), nullable=False, unique=True)
    invoice_no = Column(String, unique=True)
    taxable_amount = Column(Float, nullable=False)
    non_taxable_amount = Column(Float, nullable=False)
    cgst_amount = Column(Float, nullable=False)
    sgst_amount = Column(Float, nullable=False)
    igst_amount = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    po_number = Column(String)
    hotel_name = Column(String)
    supporting_document_url = Column(String)
    description = Column(String)
    cdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
    mdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.now(timezone.utc),
        onupdate=datetime.now(timezone.utc),
        nullable=False,
    )
    booking = relationship("HotelBooking")

class HotelInvoiceItem(Base):
    __tablename__ = "hotel_invoice_items"

    id = Column(BigInteger, primary_key=True)
    invoice_id = Column(BigInteger, ForeignKey('hotel_invoices.id', ondelete='CASCADE'), nullable=False)
    name = Column(String, nullable=False)
    sac = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=False)
    tax_percent = Column(Float, nullable=False)
    tax_rate = Column(Float, nullable=False)
    rate = Column(Float, nullable=False)
    amount = Column(Float, nullable=False)
    cdate = Column(
        TIMESTAMP(timezone=True),
        default=datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
    invoice = relationship("HotelInvoice")