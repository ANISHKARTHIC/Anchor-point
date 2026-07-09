from app_utils import utils as app_utils, exception as ex
from common_utils  import utils as cutils
from app_configs import constants as const

class InvoiceSummaryGenerator:
    def __init__(self, booking_record):
        self.booking_record = booking_record
        self.coordinator_record = booking_record.coordinators
        self.vendor_record = booking_record.vendor
        self.cost_centre_record = booking_record.cost_centre
        self.plan_record = booking_record.plan
        self.trip_record = app_utils.get_trip_record_by_booking_id(booking_record.id)
        self.vendor_invoice_record = app_utils.get_vendor_invoice_by_booking_id(booking_record.id)
        self._validate_required_records()

    def _validate_required_records(self):
        """Helper method to validate if all required records are present."""
        missing_records = []

        for record, model in [("Vendor", self.vendor_record), ("Plan", self.plan_record)]:
            if not model:
                missing_records.append(record)
        
        if missing_records:
            raise ex.InvoiceGenerationError(f"Missing records: {', '.join(missing_records)}")
        
    def get_guests_info(self):
        return app_utils.get_guests_info(self.booking_record.id)
    
    def get_invoice_summary(self):
        package_record = self.plan_record.package
        driver_charge_record = app_utils.get_driver_charge_by_details(
            self.vendor_record.id, self.plan_record.vehicle.vehicle_model_id
        )

        def calculate_extra(value, limit):
            return value - limit if value and value > limit else 0

        booking_datetime = cutils.convert_datetime(self.booking_record.booking_datetime, to_utc=False)
        starting_time = cutils.convert_datetime(self.trip_record.starting_time, to_utc=False).strftime(const.DATETIME24HRFORMAT) if self.trip_record.starting_time else None
        ending_time = cutils.convert_datetime(self.trip_record.ending_time, to_utc=False).strftime(const.DATETIME24HRFORMAT) if self.trip_record.ending_time else None
        
        trip_distance = self.trip_record.distance
        trip_duration = self.trip_record.duration

        distance_kms = package_record.distance_kms
        interval_hrs = package_record.interval_hrs

        return {
            'booking_id': self.booking_record.id,
            'bid': self.booking_record.bid,
            'po_number': self.booking_record.po_number,
            'organizer_id': str(self.booking_record.organizer_id),
            'vendor_id': str(self.booking_record.vendor_id),
            "city_id": self.booking_record.city_id,
            'vendor_cost': int(self.plan_record.vendor_cost),
            'vendor_tax': float(self.vendor_record.tax),
            'driver_charge': float(driver_charge_record.charge if driver_charge_record else 0),
            'plan_distance_kms': int(distance_kms),
            'travelled_distance': int(trip_distance) if trip_distance else 0,
            'calculated_extra_kms': calculate_extra(trip_distance, distance_kms),
            'extra_distance_cost': self.plan_record.extra_distance_cost,
            'plan_interval_hrs': int(interval_hrs),
            'trip_duration': int(trip_duration) if trip_duration else 0,
            'calculated_extra_hrs': calculate_extra(trip_duration, interval_hrs),
            'extra_hour_cost': self.plan_record.extra_hour_cost,
            'booking_date': booking_datetime.strftime(const.DATEFORMAT),
            'booking_type': self.booking_record.type,
            'cab_type': self.booking_record.cab_type,
            'coordinator_name': self.coordinator_record.name,
            'cost_centre': self.cost_centre_record.code,
            'address': self.cost_centre_record.address or "",
            'gstin_no': self.cost_centre_record.gstin_no or  "",
            'cancellation_fare': self.vendor_invoice_record.cancellation_amount if self.vendor_invoice_record else 0,
            'vendor_tax_amount': round((self.vendor_invoice_record.base_fare + self.vendor_invoice_record.cancellation_amount) * (self.vendor_record.tax / 100), 2) if self.vendor_invoice_record else 0,
            'starting_time': starting_time,
            'ending_time': ending_time,
            'starting_odo': self.trip_record.starting_odo or 'NA',
            'ending_odo': self.trip_record.ending_odo or 'NA',
            'package_detail': package_record.name
        }

