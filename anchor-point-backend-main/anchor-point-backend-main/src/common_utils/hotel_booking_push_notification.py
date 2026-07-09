import json
from app_routes.hotel_bookings.schema import HotelBookingEditRequestStatusEnum, HotelBookingStatus
from app_schemas.schema import Role
from app_routes.hotel_bookings.hotel_operations import utils as hotel_booking_utils
from app_routes.device import utils as device_utils
from app_utils.decorators import transactional
from common_utils import utils as cutils
from app_utils import exception as ex
from app_configs import constants as const
from logger import logger as logging


def handle_exceptions(func):
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as err:
            logging.error(str(err))
            raise err
    return wrapper


class NotificationSender:
    def send_notification(self):
        raise NotImplementedError()


class PendingNotificationSender(NotificationSender):
    def __init__(self, **kwargs):
        self.booking_id = kwargs.get("booking_id")
        self.status = kwargs.get("status")
        self.booking_info = hotel_booking_utils.get_hotel_bookings(booking_id=self.booking_id)
    
    @handle_exceptions
    def send_notification(self):
        title = const.HOTEL_PUSH_NOTIFICATION_FORMAT[self.status]["title"]
        body = const.HOTEL_PUSH_NOTIFICATION_FORMAT[self.status]["body"].format(
            check_in=self.booking_info["check_in"],
            check_out=self.booking_info["check_out"]
        )
        data = {
            "status": HotelBookingStatus.PENDING.value,
            "booking": json.dumps(self.booking_info),
            "target": Role.ORGANIZER.value,
            "type": "hotel"
        }
        tokens = device_utils.get_device_info(role=Role.ORGANIZER.value)
        for token in tokens:
            cutils.send_push_notification_message(
                token=token, title=title, body=body, data=data
            )

class OrganizerNotificationSender(NotificationSender):
    def __init__(self, **kwargs):
        self.booking_id = kwargs.get("booking_id")
        self.status = kwargs.get("status")
        self.booking_info = hotel_booking_utils.get_hotel_bookings(booking_id=self.booking_id)

    @handle_exceptions
    def send_notification(self):        
        data = {
            "status": self.status,
            "booking": json.dumps(self.booking_info),
            "target": Role.COORDINATOR.value,
            "type": "hotel"
        }
        body = const.HOTEL_PUSH_NOTIFICATION_FORMAT[self.status]["body"].format(
            coordinator=self.booking_info["coordinator"]["name"],
            organizer=self.booking_info["organizer"]["name"],
            bid=self.booking_info["bid"],
        )
        title = const.HOTEL_PUSH_NOTIFICATION_FORMAT[self.status]["title"]
        tokens = device_utils.get_device_info(
            email=self.booking_info["coordinator"]["email"], role=Role.COORDINATOR.value
        )
        for token in tokens:
            cutils.send_push_notification_message(
                token=token, title=title, body=body, data=data
            )

class ConfirmationNotificationSender(NotificationSender):
    def __init__(self, **kwargs):
        self.metadata = kwargs.get("metadata")
        self.booking_id = kwargs.get("booking_id")
        self.status = kwargs.get("status")
        self.role = self.metadata.get("role")
        self.vendor_name = self.metadata.get("vendor_name")
        self.booking_info = hotel_booking_utils.get_hotel_bookings(booking_id=self.booking_id)

    @handle_exceptions
    def send_coordinator_notification(self, title, body, data):
        role =  Role.COORDINATOR.value
        data["target"] = role

        tokens = device_utils.get_device_info(
            email=self.booking_info["coordinator"]["email"], role=role
        )
        for token in tokens:
            cutils.send_push_notification_message(
                token=token, title=title, body=body, data=data
            )
    
    @handle_exceptions
    def send_organizer_notification(self, title, body, data):
        role =  Role.ORGANIZER.value
        data["target"] = role

        tokens = device_utils.get_device_info(
            email=self.booking_info["organizer"]["email"], role=role
        )
        for token in tokens:
            cutils.send_push_notification_message(
                token=token, title=title, body=body, data=data
            )

    @handle_exceptions
    def send_notification(self):        
        data = {
            "status": self.status,
            "booking": json.dumps(self.booking_info),
            "type": "hotel"
        }
        title = const.HOTEL_PUSH_NOTIFICATION_FORMAT[self.status]["title"]
        body = const.HOTEL_PUSH_NOTIFICATION_FORMAT[self.status]["body"].format(
            vendor=self.vendor_name,
            bid=self.booking_info["bid"],
        )
        self.send_coordinator_notification(title, body, data)
        if self.role == "vendor":
            self.send_organizer_notification(title, body, data)

class VendorNotificationSender(NotificationSender):
    def __init__(self, **kwargs):
        self.metadata = kwargs.get("metadata")
        self.booking_id = kwargs.get("booking_id")
        self.status = kwargs.get("status")
        self.vendor_name = self.metadata.get("vendor_name")
        self.vendor_email = self.metadata.get("vendor_email")
        self.booking_info = hotel_booking_utils.get_hotel_bookings(booking_id=self.booking_id)
        self.organizer_info = self.booking_info["organizer"]
    
    @transactional
    def _get_tokens(self, target_role):
        if target_role == Role.VENDOR.value:
            return device_utils.get_device_info(email=self.vendor_email, role=Role.VENDOR.value)
        elif target_role == Role.ORGANIZER.value:
            return device_utils.get_device_info(email=self.organizer_info["email"], role=Role.ORGANIZER.value)
        return []

    def _get_notification_content(self):
        if self.status == HotelBookingStatus.VENDOR_REQUESTED.value:
            body = const.HOTEL_PUSH_NOTIFICATION_FORMAT[self.status]["body"].format(
                vendor=self.vendor_name,
                check_in=self.booking_info["check_in"],
                check_out=self.booking_info["check_out"]            
            )
            target_role = Role.VENDOR.value
        elif self.status == HotelBookingStatus.VENDOR_ACCEPTED.value or self.status == HotelBookingStatus.VENDOR_DECLINED.value:
            body = const.HOTEL_PUSH_NOTIFICATION_FORMAT[self.status]["body"].format(
                vendor=self.vendor_name,
                bid=self.booking_info["bid"] 
            )
            target_role = Role.ORGANIZER.value
        else:
            body = const.HOTEL_PUSH_NOTIFICATION_FORMAT[self.status]["body"].format(
                organizer=self.organizer_info["name"],
                vendor=self.vendor_name,
                bid=self.booking_info["bid"]
            )
            target_role = Role.VENDOR.value
        return body, target_role

    @handle_exceptions
    def send_notification(self):
        title = const.HOTEL_PUSH_NOTIFICATION_FORMAT[self.status]["title"]
        body, target_role = self._get_notification_content()
        tokens = self._get_tokens(target_role) 
        data = {
            "status": self.status,
            "booking": json.dumps(self.booking_info),
            "type": "hotel",
            "target": target_role
        }

        for token in tokens:
            cutils.send_push_notification_message(
                token=token, title=title, body=body, data=data
            )
            
class CancelledNotificationSender(NotificationSender):
    def __init__(self, **kwargs):
        self.metadata = kwargs.get("metadata")
        self.booking_id = kwargs.get("booking_id")
        self.status = kwargs.get("status")
        self.booking_info = hotel_booking_utils.get_hotel_bookings(booking_id=self.booking_id)
        
    def get_notification_body_for_booking_cancel(self, user, cancelled_user):
        return const.HOTEL_PUSH_NOTIFICATION_FORMAT[self.status]["body"].format(
            user=user,
            cancelled_user=cancelled_user,
            bid=self.booking_info["bid"]
        )

    def send_booking_cancelled_notification(self, email, body, role):
        status = HotelBookingStatus.CANCELLED.value
        title = const.HOTEL_PUSH_NOTIFICATION_FORMAT[status]["title"]
        data = {
            "status": status,
            "type": "hotel",
            "booking": json.dumps(self.booking_info),
            "target": role,
        }
        tokens = device_utils.get_device_info(email=email, role=role)
        for token in tokens:
            cutils.send_push_notification_message(
                token=token, title=title, body=body, data=data
            )

    def send_booking_cancelled_notification_role(self, user, cancelled_user, role):
        email = user["email"]
        body = self.get_notification_body_for_booking_cancel(user=user["name"], cancelled_user=cancelled_user)
        self.send_booking_cancelled_notification(email, body, role)

    @handle_exceptions
    def send_notification(self):
        coordinator = self.booking_info["coordinator"]
        organizer = self.booking_info["organizer"]
        vendor = self.booking_info["vendor"]
            
        if self.metadata.get("coordinator_id"):
            cancelled_user = coordinator["name"]

            if organizer:
                self.send_booking_cancelled_notification_role(organizer, cancelled_user, Role.ORGANIZER.value)
            
            if vendor:
                self.send_booking_cancelled_notification_role(vendor, cancelled_user, Role.VENDOR.value)

        else:
            cancelled_user = organizer["name"]
            
            if coordinator:
                self.send_booking_cancelled_notification_role(coordinator, cancelled_user, Role.COORDINATOR.value)

            if vendor:
                self.send_booking_cancelled_notification_role(vendor, cancelled_user, Role.VENDOR.value)

class EditRequestNotificationSender(NotificationSender):
    def __init__(self, **kwargs):
        self.booking_id = kwargs.get("booking_id")
        self.status = kwargs.get("status")
        self.booking_info = hotel_booking_utils.get_hotel_bookings(booking_id=self.booking_id)
    
    @handle_exceptions
    def send_notification(self):
        title = const.HOTEL_PUSH_NOTIFICATION_FORMAT[self.status]["title"]
        body = const.HOTEL_PUSH_NOTIFICATION_FORMAT[self.status]["body"].format(
            bid=self.booking_info["bid"]
        )
        data = {
            "status": HotelBookingEditRequestStatusEnum.requested.value,
            "booking": json.dumps(self.booking_info),
            "target": Role.ORGANIZER.value,
            "type": "hotel"
        }
        
        kwargs = {"role": Role.ORGANIZER.value}
        if self.booking_info["organizer"]:
            kwargs["email"] = self.booking_info["organizer"]["email"]
        
        tokens = device_utils.get_device_info(**kwargs)        
        for token in tokens:
            cutils.send_push_notification_message(
                token=token, title=title, body=body, data=data
            )

class EditRequestAcknowledgedNotificationSender(NotificationSender):
    def __init__(self, **kwargs):
        self.booking_id = kwargs.get("booking_id")
        self.status = kwargs.get("status")
        self.booking_info = hotel_booking_utils.get_hotel_bookings(booking_id=self.booking_id)
        self.metadata = kwargs.get("metadata")
            
    @handle_exceptions
    def send_notification(self):        
        data = {
            "status": self.status,
            "booking": json.dumps(self.booking_info),
            "target": Role.COORDINATOR.value,
            "type": "hotel"
        }
        organizer_name = self.booking_info["organizer"]["name"] if self.booking_info["organizer"] else self.metadata["organizer_name"]
        body = const.HOTEL_PUSH_NOTIFICATION_FORMAT[self.status]["body"].format(
            organizer=organizer_name,
            bid=self.booking_info["bid"],
        )
        title = const.HOTEL_PUSH_NOTIFICATION_FORMAT[self.status]["title"]
        tokens = device_utils.get_device_info(
            email=self.booking_info["coordinator"]["email"], role=Role.COORDINATOR.value
        )
        for token in tokens:
            cutils.send_push_notification_message(
                token=token, title=title, body=body, data=data
            )

class EditRequestConfirmationNotificationSender(NotificationSender):
    def __init__(self, **kwargs):
        self.booking_id = kwargs.get("booking_id")
        self.status = kwargs.get("status")
        self.booking_info = hotel_booking_utils.get_hotel_bookings(booking_id=self.booking_id)

    @handle_exceptions
    def send_notification(self):        
        data = {
            "status": self.status,
            "booking": json.dumps(self.booking_info),
            "target": Role.COORDINATOR.value,
            "type": "hotel"
        }
        body = const.HOTEL_PUSH_NOTIFICATION_FORMAT[self.status]["body"].format(
            bid=self.booking_info["bid"],
        )
        title = const.HOTEL_PUSH_NOTIFICATION_FORMAT[self.status]["title"]
        tokens = device_utils.get_device_info(
            email=self.booking_info["coordinator"]["email"], role=Role.COORDINATOR.value
        )
        for token in tokens:
            cutils.send_push_notification_message(
                token=token, title=title, body=body, data=data
            )

class NotificationSenderFactory:
    @staticmethod
    def create_notification_sender(**kwargs):
        status = kwargs.get("status")
        notification_senders = {
            HotelBookingStatus.PENDING.value: PendingNotificationSender,
            HotelBookingStatus.ORGANIZER_ASSIGNED.value: OrganizerNotificationSender,
            HotelBookingStatus.VENDOR_REQUESTED.value: VendorNotificationSender,
            HotelBookingStatus.VENDOR_ACCEPTED.value: VendorNotificationSender,
            HotelBookingStatus.VENDOR_DECLINED.value: VendorNotificationSender,
            HotelBookingStatus.VENDOR_ASSIGN_REVOKED.value: VendorNotificationSender,
            HotelBookingStatus.CONFIRMED.value: ConfirmationNotificationSender,
            HotelBookingStatus.CANCELLED.value: CancelledNotificationSender,
            HotelBookingEditRequestStatusEnum.requested.value: EditRequestNotificationSender,
            HotelBookingEditRequestStatusEnum.acknowledged.value: EditRequestAcknowledgedNotificationSender,
            HotelBookingEditRequestStatusEnum.confirmed.value: EditRequestConfirmationNotificationSender,
        }
        if status in notification_senders:
            return notification_senders[status](**kwargs)
        else:
            raise ex.InvalidBookingStatus
        