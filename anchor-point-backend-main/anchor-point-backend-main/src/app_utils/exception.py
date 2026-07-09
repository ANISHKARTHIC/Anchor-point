from fastapi import HTTPException, status


class EmailNotFound(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_404_NOT_FOUND
        detail = "Email not found"
        super().__init__(status_code, detail)


class RecordExists(HTTPException):
    def __init__(self, msg=None, field_name=None, field_value=None) -> None:
        status_code = status.HTTP_409_CONFLICT
        if msg:
            detail = msg
        else:
            detail = f"A record with {field_name} '{field_value}' already exists."
        super().__init__(status_code, detail)

class BookingNotFound(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_404_NOT_FOUND
        detail = "Booking details not found"
        super().__init__(status_code, detail)

class BadRequestException(HTTPException):
    def __init__(self, msg) -> None:
        status_code = status.HTTP_400_BAD_REQUEST
        super().__init__(status_code, msg)
    
class TripNotFound(HTTPException):
    def __init__(self, booking_id) -> None:
        status_code = status.HTTP_404_NOT_FOUND
        detail = f"Trip details not found for booking {booking_id}"
        super().__init__(status_code, detail)


class VendorRessignedException(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_409_CONFLICT
        detail = "Booking has been reassigned to different vendor"
        super().__init__(status_code, detail)

class VendorBookingAssigned(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_409_CONFLICT
        detail = "The booking has been assigned to vendor. To assign new vendor, please revoke existing vendor request"
        super().__init__(status_code, detail)

class BookingAlreadyTaken(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_409_CONFLICT
        detail = "Booking taken already"
        super().__init__(status_code, detail)

class ChangePasswordRequired(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_401_UNAUTHORIZED
        detail = "Change password before logging in"
        super().__init__(status_code, detail)


class SMSException(HTTPException):
    def __init__(self, err_msg) -> None:
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        detail = f"Error while sending message: {err_msg}"
        super().__init__(status_code, detail)


class SMSSSchedulingError(HTTPException):
    def __init__(self, err_msg) -> None:
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        detail = f"Error scheduling message: {err_msg}"
        super().__init__(status_code, detail)


class EmailTaken(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_409_CONFLICT
        detail = "Email already taken"
        super().__init__(status_code, detail)


class InvalidDomainName(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
        detail = "Invalid domain name"
        super().__init__(status_code, detail)


class InvalidRole(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
        detail = "Invalid role. The user's role is not allowed to access the requested resource."
        super().__init__(status_code, detail)


class DomainNotFound(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_404_NOT_FOUND
        detail = "Domain not found"
        super().__init__(status_code, detail)

class PublicEmailDomainNotAllowedException(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_403_FORBIDDEN
        detail = "Public email domains are not allowed"
        super().__init__(status_code, detail)


class DriverNotFound(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_404_NOT_FOUND
        detail = "Driver not found"
        super().__init__(status_code, detail)


class InvalidOrExpiredOTP(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_403_FORBIDDEN
        detail = "Invalid or Expired OTP"
        super().__init__(status_code, detail)


class DatabaseOperationFailed(HTTPException):
    def __init__(self, action) -> None:
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
        detail = f"Failed to {action} record"
        super().__init__(status_code, detail)


class IncorrectPassword(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
        detail = "Invalid password. Please try again"
        super().__init__(status_code, detail)


class PermissionDenied(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_403_FORBIDDEN
        detail = "Permission denied. Super organizer accesss required"
        super().__init__(status_code, detail)


class RecordNotFound(HTTPException):
    def __init__(self, model) -> None:
        status_code = status.HTTP_404_NOT_FOUND
        detail = f"{model} not found"
        super().__init__(status_code, detail)


class GoogleMapsError(HTTPException):
    def __init__(self, status_code, err_msg) -> None:
        super().__init__(status_code, err_msg)


class AWSS3Error(HTTPException):
    def __init__(self, err_msg) -> None:
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        super().__init__(status_code, err_msg)

class InvalidBookingStatus(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_400_BAD_REQUEST
        err_msg = "Invalid booking status"
        super().__init__(status_code, err_msg)

class InvalidTripStatus(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_400_BAD_REQUEST
        err_msg = "Invalid trip status"
        super().__init__(status_code, err_msg)

class PlanNotAssigned(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_404_NOT_FOUND
        err_msg = "No plan assigned for the booking"
        super().__init__(status_code, err_msg)

class InvalidDeviceToken(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
        err_msg = "Invalid FCM device token"
        super().__init__(status_code, err_msg)

class PlansNotFound(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_404_NOT_FOUND
        detail = "No plans are available for vendors"
        super().__init__(status_code, detail)

class PlanExists(HTTPException):
    def __init__(self, err_msg) -> None:
        status_code = status.HTTP_409_CONFLICT
        detail = err_msg    
        super().__init__(status_code, detail)

class ForeginKeyViolation(HTTPException):
    def __init__(self, action, table, foreign_key_table) -> None:
        status_code = status.HTTP_400_BAD_REQUEST   
        detail = f"The {table} record cannot be {action} because it is referenced in a {foreign_key_table}"
        super().__init__(status_code, detail)

class InvalidDateTimeFormat(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_400_BAD_REQUEST   
        detail = "Invalid date or time format. Please enter a date in the format YYYY-MM-DD and time in HH:MM."
        super().__init__(status_code, detail)

class ManagerEmailMissing(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_400_BAD_REQUEST   
        detail = "Please provide manager email for booking request approval."
        super().__init__(status_code, detail)

class InvalidAccessToken(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_403_FORBIDDEN
        detail = "Invalid token. The provided authentication token does not have sufficient permissions to access the requested resource."
        super().__init__(status_code, detail)

class InvalidFirebaseAccessToken(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_403_FORBIDDEN
        detail = "The provided token is invalid. Ensure you are using a valid token."
        super().__init__(status_code, detail)

class TokenExpired(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_403_FORBIDDEN
        detail = "Token Expired. The authentication token provided has expired. Please refresh your token or reauthenticate to regain access to the requested resource."
        super().__init__(status_code, detail)

class InvalidBookingId(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_403_FORBIDDEN
        detail = "Invalid booking ID format"
        super().__init__(status_code, detail)

class InvalidUserNameOrPassword(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_403_FORBIDDEN
        detail = "Invalid username or password"
        super().__init__(status_code, detail)

class GoogleMapsException(HTTPException):
    def __init__(self, err_msg) -> None:
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        super().__init__(status_code, detail=err_msg)

class GoogleMapsRequestDenined(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_403_FORBIDDEN
        detail = "Google maps api key has expired. Please renew api key to continue using mapping services."
        super().__init__(status_code, detail)

class LoginDeniedError(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_403_FORBIDDEN
        detail = "Login denied since the trip has been completed"
        super().__init__(status_code, detail)


class InvalidTripProofType(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_403_FORBIDDEN
        detail = "Only Image or PDF are supported as trip documents."
        super().__init__(status_code, detail)


class InvoiceDenied(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_403_FORBIDDEN
        detail = "Invoice generation denied. Invoice can only be generated after at least one hour from the booking time."
        super().__init__(status_code, detail)


class InvoiceDeniedInvalidUser(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_403_FORBIDDEN
        detail = "Invoice generation denied. An invoice has already been generated for this booking by a normal organizer."
        super().__init__(status_code, detail)
    
class InactiveUser(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_403_FORBIDDEN
        detail = "Your account is currently inactive. Please contact support for assistance"
        super().__init__(status_code, detail)

class OdometerReadingError(HTTPException):
    def __init__(self, starting_odo_meter, ending_odo_meter):
        status_code = status.HTTP_400_BAD_REQUEST
        detail = f"Ending odo reading '{ending_odo_meter}' should be greater than starting odo reading '{starting_odo_meter}'"
        super().__init__(status_code, detail)

class ResetPasswordLinkExpired(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_400_BAD_REQUEST
        detail = "Reset password link expired"
        super().__init__(status_code, detail)

class InvalidMobileNumber(HTTPException):
    def __init__(self) -> None:
        status_code = status.HTTP_400_BAD_REQUEST
        detail = "Invalid mobile number"
        super().__init__(status_code, detail)

class InvoiceGenerationError(HTTPException):
    def __init__(self, err_message) -> None:
        status_code = status.HTTP_400_BAD_REQUEST
        detail = f"Failed to fetch invoice information. {err_message}"
        super().__init__(status_code, detail)

class InvalidLatLong(HTTPException):
    def __init__(self, address_type) -> None:
        status_code = status.HTTP_400_BAD_REQUEST
        detail = f"Choose {address_type} address from Google Maps suggestions instead entering manually."
        super().__init__(status_code, detail)

class CrossUpdateError(HTTPException):
    def __init__(self, guest_name) -> None:
        status_code = status.HTTP_400_BAD_REQUEST
        detail = f"Cross-booking update detected. {guest_name} guest does not belong to booking."
        super().__init__(status_code, detail)   