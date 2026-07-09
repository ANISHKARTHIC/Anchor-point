import json
import firebase_admin
from itertools import chain
from app_models.models import Device, Vendor
from app_routes.booking.schema import BookingStatus
from app_schemas.schema import Role
from app_utils import utils as app_utils
from app_routes.device import utils as device_utils
from app_utils.decorators import transactional
from common_utils import utils as cutils
from app_utils import exception as ex
from app_configs import constants as const
from app_models import crud
from logger import logger as logging


def handle_exceptions(func):
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as err:
            logging.error(str(err))

    return wrapper

def get_booking_data(booking_id):
    booking_data = app_utils.get_booking_info(
        role=Role.ORGANIZER.value, booking_id=booking_id
    ).get("booking")
    return json.dumps(
        booking_data,
        default=str,
    )


class NotificationSender:
    def send_notification(self):
        raise NotImplementedError()


class PendingNotificationSender(NotificationSender):
    def __init__(self, **kwargs):
        self.booking_info = app_utils.get_booking_by_booking_id(kwargs.get("booking_id"))
        self.status = kwargs.get("status")
        self.pickup_date = cutils.get_pickup_date(self.booking_info.booking_datetime)
    
    @handle_exceptions
    def send_notification(self):
        title = const.PUSH_NOTIFICATION_FORMAT[self.status]["title"]
        body = const.PUSH_NOTIFICATION_FORMAT[self.status]["body"].format(
            type=self.booking_info.type,
            date=cutils.get_pickup_date(self.booking_info.booking_datetime),
            time=cutils.get_pickup_time(self.booking_info.booking_datetime),
        )
        data = {
            "status": BookingStatus.PENDING.value,
            "booking": get_booking_data(self.booking_info.id),
            "target": Role.ORGANIZER.value,
        }
        tokens = device_utils.get_device_info(role=Role.ORGANIZER.value)
        for token in tokens:
            cutils.send_push_notification_message(
                token=token, title=title, body=body, data=data
            )


class OrganizerNotificationSender(NotificationSender):
    def __init__(self, **kwargs):
        self.booking_info = app_utils.get_booking_by_booking_id(kwargs.get("booking_id"))
        self.status = kwargs.get("status")
        self.pickup_date = cutils.get_pickup_date(self.booking_info.booking_datetime)

    @transactional
    def fetch_fcm_token(self, email):
        select_cols = [Device.fcm_token]
        filter_conditions = [Device.role == Role.ORGANIZER.value, Device.email != email]
        devices = crud.select_records(
            Device, select_cols=select_cols, filter_conditions=filter_conditions
        ).all()
        return list(chain.from_iterable(devices))

    def send_organizer_assigned_notification(self):
        data = {
            "status": self.status,
            "booking": get_booking_data(self.booking_info.id),
            "target": Role.COORDINATOR.value,
        }
        body = const.PUSH_NOTIFICATION_FORMAT[self.status]["body"].format(
            coordinator=self.booking_info.coordinators.name,
            organizer=self.booking_info.organizers.name,
            type=self.booking_info.type,
            date=self.pickup_date,
        )
        title = const.PUSH_NOTIFICATION_FORMAT[self.status]["title"]
        tokens = device_utils.get_device_info(
            email=self.booking_info.coordinators.email, role=Role.COORDINATOR.value
        )
        for token in tokens:
            cutils.send_push_notification_message(
                token=token, title=title, body=body, data=data
            )

    def send_booking_accepted_notification(self):
        status = BookingStatus.BOOKING_ACCEPTED.value
        title = const.PUSH_NOTIFICATION_FORMAT[status]["title"]
        body = const.PUSH_NOTIFICATION_FORMAT[status]["body"].format(
            organizer=self.booking_info.organizers.name,
            date=cutils.get_pickup_date(self.booking_info.booking_datetime),
        )
        data = {
            "status": status,
            "booking": get_booking_data(self.booking_info.id),
            "target": Role.ORGANIZER.value,
        }
        tokens = self.fetch_fcm_token(self.booking_info.organizers.email)
        for token in tokens:
            cutils.send_push_notification_message(
                token=token, title=title, body=body, data=data
            )

    @handle_exceptions
    def send_notification(self):
        self.send_organizer_assigned_notification()
        self.send_booking_accepted_notification()


class VendorNotificationSender(NotificationSender):
    def __init__(self, **kwargs):
        self.booking_request = kwargs.get("booking_request")
        self.vendor_id = self.booking_request.metadata.get("vendor_id")
        self.booking_info = app_utils.get_booking_by_booking_id(kwargs.get("booking_id"))
        self.status = kwargs.get("status")
        self.pickup_date = cutils.get_pickup_date(self.booking_info.booking_datetime)
        self.vendor_info = None
    
    @transactional
    def _get_vendor_info(self):
        if not self.vendor_info:
            self.vendor_info = crud.select_records(Vendor, filter_conditions=[Vendor.id == self.vendor_id]).first()
        return self.vendor_info
    
    @transactional
    def _get_tokens(self, target_role):
        if target_role == Role.VENDOR.value:
            return device_utils.get_device_info(email=self.vendor_info.email, role=Role.VENDOR.value)
        elif target_role == Role.ORGANIZER.value:
            return device_utils.get_device_info(email=self.booking_info.organizers.email, role=Role.ORGANIZER.value)
        return []

    def _get_notification_content(self):
        if self.status == BookingStatus.VENDOR_REQUESTED.value:
            body = const.PUSH_NOTIFICATION_FORMAT[self.status]["body"].format(
                vendor=self.vendor_info.name,
                date=self.pickup_date,
            )
            target_role = Role.VENDOR.value
        elif self.status == BookingStatus.VENDOR_ACCEPTED.value or self.status == BookingStatus.VENDOR_DECLINED.value:
            body = const.PUSH_NOTIFICATION_FORMAT[self.status]["body"].format(
                vendor=self.vendor_info.name,
                date=self.pickup_date,
            )
            target_role = Role.ORGANIZER.value
        else:
            body = const.PUSH_NOTIFICATION_FORMAT[self.status]["body"].format(
                organizer=self.booking_info.organizers.name,
                vendor=self.vendor_info.name,
                date=self.pickup_date
            )
            target_role = Role.VENDOR.value
        return body, target_role

    @handle_exceptions
    def send_notification(self):
        self.vendor_info = self._get_vendor_info()
        tokens = self._get_tokens(Role.VENDOR.value) 
        title = const.PUSH_NOTIFICATION_FORMAT[self.status]["title"]
        body, target_role = self._get_notification_content()
        data = {
            "status": self.status,
            "booking": get_booking_data(self.booking_info.id),
            "target": target_role
        }

        for token in tokens:
            cutils.send_push_notification_message(
                token=token, title=title, body=body, data=data
            )


class DriverNotificationSender(NotificationSender):
    def __init__(self, **kwargs):
        self.booking_request = kwargs.get("booking_request")
        self.booking_info = app_utils.get_booking_by_booking_id(kwargs.get("booking_id"))
        self.status = kwargs.get("status")
        self.pickup_date = cutils.get_pickup_date(self.booking_info.booking_datetime)
        self.driver_name = self.booking_request.metadata.get("driver_name")
    
    @handle_exceptions
    def send_notification(self):
        data = {
            "status": self.status,
            "booking": get_booking_data(self.booking_info.id),
            "target": Role.ORGANIZER.value,
        }
        body = const.PUSH_NOTIFICATION_FORMAT[self.status]["body"].format(
            driver=self.driver_name, date=self.pickup_date
        )
        title = const.PUSH_NOTIFICATION_FORMAT[self.status]["title"]
        tokens = device_utils.get_device_info(
            email=self.booking_info.organizers.email, role=Role.ORGANIZER.value
        )
        for token in tokens:
            cutils.send_push_notification_message(
                token=token, title=title, body=body, data=data
            )


class InvoiceCreatedNotificationSender(NotificationSender):
    def __init__(self, **kwargs):
        self.booking_info = app_utils.get_booking_by_booking_id(kwargs.get("booking_id"))
        self.status = kwargs.get("status")
        self.pickup_date = cutils.get_pickup_date(self.booking_info.booking_datetime)

    @handle_exceptions
    def send_notification(self):
        title = const.PUSH_NOTIFICATION_FORMAT[self.status]["title"]
        body = const.PUSH_NOTIFICATION_FORMAT[self.status]["body"].format(
            vendor=self.booking_info.vendor.name,
            date=self.pickup_date,
        )
        data = {
            "status": self.status,
            "booking": get_booking_data(self.booking_info.id),
            "target": Role.ORGANIZER.value,
        }
        tokens = device_utils.get_device_info(
            email=self.booking_info.organizers.email, role=Role.ORGANIZER.value
        )
        for token in tokens:
            cutils.send_push_notification_message(
                token=token, title=title, body=body, data=data
            )


class InvoiceApprovedNotificationSender(NotificationSender):
    def __init__(self, **kwargs):
        self.booking_info = app_utils.get_booking_by_booking_id(kwargs.get("booking_id"))
        self.status = kwargs.get("status")
        self.pickup_date = cutils.get_pickup_date(self.booking_info.booking_datetime)

    def send_invoice_generated_nofitication(self, data):
        data = {**data, "target": Role.COORDINATOR.value}
        status = BookingStatus.INVOICE_GENERATED.value
        title = const.PUSH_NOTIFICATION_FORMAT[status]["title"]
        body = const.PUSH_NOTIFICATION_FORMAT[status]["body"].format(
            date=self.pickup_date,
            coordinator=self.booking_info.coordinators.name,
        )
        tokens = device_utils.get_device_info(
            email=self.booking_info.coordinator.email, role=Role.COORDINATOR.value
        )
        for token in tokens:
            cutils.send_push_notification_message(
                token=token, title=title, body=body, data=data
            )

    def send_invoice_approved_nofitication(self, data):
        data = {**data, "target": Role.VENDOR.value}
        title = const.PUSH_NOTIFICATION_FORMAT[self.status]["title"]
        body = const.PUSH_NOTIFICATION_FORMAT[self.status]["body"].format(
            booking_id=self.booking_info.id,
            date=self.pickup_date,
            vendor=self.booking_info.vendor.name,
            organizer=self.booking_info.organizers.name,
        )
        tokens = device_utils.get_device_info(
            email=self.booking_info.vendor.email, role=Role.VENDOR.value
        )
        for token in tokens:
            cutils.send_push_notification_message(
                token=token, title=title, body=body, data=data
            )

    @handle_exceptions
    def send_notification(self):
        data = {
            "status": self.status,
            "booking": get_booking_data(self.booking_info.id),
        }
        self.send_invoice_approved_nofitication(data)
        self.send_invoice_generated_nofitication(data)


class InvoiceRejectedNotificationSender(NotificationSender):
    def __init__(self, **kwargs):
        self.booking_info = app_utils.get_booking_by_booking_id(kwargs.get("booking_id"))
        self.status = kwargs.get("status")
        self.pickup_date = cutils.get_pickup_date(self.booking_info.booking_datetime)
    
    @handle_exceptions
    def send_notification(self):
        title = const.PUSH_NOTIFICATION_FORMAT[self.status]["title"]
        body = const.PUSH_NOTIFICATION_FORMAT[self.status]["body"].format(
            organizer=self.booking_info.organizers.name,
            date=self.pickup_date,
        )
        data = {
            "status": self.status,
            "booking": get_booking_data(self.booking_info.id),
            "target": Role.VENDOR.value,
        }
        tokens = device_utils.get_device_info(
            email=self.booking_info.vendor.email, role=Role.VENDOR.value
        )
        for token in tokens:
            cutils.send_push_notification_message(
                token=token, title=title, body=body, data=data
            )


class CancelledNotificationSender(NotificationSender):
    def __init__(self, **kwargs):
        self.booking_request = kwargs.get("booking_request")
        self.metadata = self.booking_request.metadata
        self.booking_info = app_utils.get_booking_by_booking_id(kwargs.get("booking_id"))
        self.status = kwargs.get("status")
        self.pickup_date = cutils.get_pickup_date(self.booking_info.booking_datetime)

    def get_notification_body_for_booking_cancel(self, user, cancelled_user):
        return const.PUSH_NOTIFICATION_FORMAT[self.status]["body"].format(
            user=user,
            cancelled_user=cancelled_user,
            date=self.pickup_date
        )

    def send_booking_cancelled_notification(self, email, body, role):
        status = BookingStatus.CANCELLED.value
        title = const.PUSH_NOTIFICATION_FORMAT[status]["title"]
        data = {
            "status": status,
            "booking": get_booking_data(self.booking_info.id),
            "target": role,
        }
        tokens = device_utils.get_device_info(email=email, role=role)
        for token in tokens:
            cutils.send_push_notification_message(
                token=token, title=title, body=body, data=data
            )

    def send_booking_cancelled_notification_role(self, user, cancelled_user, role):
        email = user.email
        body = self.get_notification_body_for_booking_cancel(user=user.name, cancelled_user=cancelled_user)
        self.send_booking_cancelled_notification(email, body, role)

    @handle_exceptions
    def send_notification(self):
        coordinator = self.booking_info.coordinators
        organizer = self.booking_info.organizers
        vendor = self.booking_info.vendor
            
        if self.metadata.get("coordinator_id"):
            cancelled_user = coordinator.name

            if organizer:
                self.send_booking_cancelled_notification_role(organizer, cancelled_user, Role.ORGANIZER.value)
            
            if vendor:
                self.send_booking_cancelled_notification_role(vendor, cancelled_user, Role.VENDOR.value)

        else:
            cancelled_user = organizer.name
            
            if coordinator:
                self.send_booking_cancelled_notification_role(coordinator, cancelled_user, Role.COORDINATOR.value)

            if vendor:
                self.send_booking_cancelled_notification_role(vendor, cancelled_user, Role.VENDOR.value)

class NotificationSenderFactory:
    @staticmethod
    def create_notification_sender(**kwargs):
        status = kwargs.get("status")
        notification_senders = {
            BookingStatus.PENDING.value: PendingNotificationSender,
            BookingStatus.ORGANIZER_ASSIGNED.value: OrganizerNotificationSender,
            BookingStatus.VENDOR_REQUESTED.value: VendorNotificationSender,
            BookingStatus.VENDOR_ACCEPTED.value: VendorNotificationSender,
            BookingStatus.VENDOR_DECLINED.value: VendorNotificationSender,
            BookingStatus.VENDOR_ASSIGN_REVOKED.value: VendorNotificationSender,
            BookingStatus.DRIVER_ASSIGNED.value: DriverNotificationSender,
            BookingStatus.DRIVER_REASSIGNED.value: DriverNotificationSender,
            BookingStatus.INVOICE_CREATED.value: InvoiceCreatedNotificationSender,
            BookingStatus.INVOICE_APPROVED.value: InvoiceApprovedNotificationSender,
            BookingStatus.INVOICE_REJECTED.value: InvoiceRejectedNotificationSender,
            BookingStatus.CANCELLED.value: CancelledNotificationSender
        }
        if status in notification_senders:
            return notification_senders[status](**kwargs)
        else:
            raise ex.InvalidBookingStatus
