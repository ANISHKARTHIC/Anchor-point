ACCESS_TOKEN_EXPIRE_TIME = 1  # Value in terms of hours
OTP_EXPIREY_TIME = 300  # Value in terms of seconds
SAC=998551
OTP_MAIL_SUBJECT = "OTP Verification Code"
OTP_MAIL_BODY = """Dear User,

Your One-Time Password (OTP) for authentication is: {otp}

Please use this OTP to complete your login or action. Note that the OTP is valid for a limited time.
If you did not request this OTP, please ignore this message.

Please do not reply to this email. This is an automated message and responses will not be monitored.
If you have any queries, Please reach out to this number {contact_support} or mail bookings@anchorpoint.in

Best regards,
Anchorpoint.
"""
ADMIN_CREATION_MAIL_SUBJECT = "Admin Account Information"
ADMIN_CREATION_MAIL_BODY = """
Dear {admin_name},

Here are your admin account details:
Email: {admin_email}
Password: {admin_password}

Ensure the security of these credentials and change the password upon first login for enhanced security.

Please do not reply to this email. This is an automated message and responses will not be monitored.
If you have any queries, Please reach out to this number {contact_support} or mail bookings@anchorpoint.in

Best regards,
Anchorpoint."""
VENDOR_CREATION_MAIL_SUBJECT = "Vendor Account Information"
VENDOR_CREATION_MAIL_BODY = """
Dear {vendor_name},

Here are your account details:
Email: {vendor_email}
Password: {vendor_password}

Ensure the security of these credentials and change the password upon first login for enhanced security.

Please do not reply to this email. This is an automated message and responses will not be monitored.
If you have any queries, Please reach out to this number {contact_support} or mail bookings@anchorpoint.in

Best regards,
Anchorpoint."""
UPDATE_PASSWORD_SUBJECT = "Reset Your Password"
UPDATE_PASSWORD_MAIL_BODY = """
Dear {admin_name},

To enhance the security of your account, try to update your password. Please visit our website and create a new password by entering it in the provided field:

Password: {password}

Please do not reply to this email. This is an automated message and responses will not be monitored.
If you have any queries, Please reach out to this number {contact_support} or mail bookings@anchorpoint.in

Best regards,
Anchorpoint."""
VENDOR_ASSIGN_MAIL_SUBJECT="Vendor request for cab booking"
VENDOR_ASSIGN_MAIL_BODY="""
Hello {vendor_name},

You have been assigned by the organizer to manage booking plan {bid}.
Please review the booking details and proceed with the necessary arrangements.

Please do not reply to this email. This is an automated message and responses will not be monitored.
If you have any queries, Please reach out to this number {contact_support} or mail bookings@anchorpoint.in

Best regards,
Anchorpoint.
"""
DRIVER_ASSIGNMENT_REMAINDER_MAIL_SUBJECT = "Reminder: Driver Details Not Updated for Booking - {bid}"
DRIVER_ASSIGNMENT_REMAINDER_MAIL_BODY = """
Hi {vendor_name},

We noticed that the driver information for Booking ID {bid} has not been provided yet.
To ensure the booking proceeds smoothly, please update the driver details as soon as possible.

Please do not reply to this email. This is an automated message and responses will not be monitored.
If you have any queries, Please reach out to this number {contact_support} or mail bookings@anchorpoint.in

Best regards,
Anchorpoint.
"""
DRIVER_ASSIGN_MAIL_SUBJECT="Driver Assigned for Your Cab Booking"
DRIVER_ASSIGN_MAIL_BODY = """
Hi {coordinator_name},

Your ride is confirmed! Please find below details,

Booking Details:
Booking ID: {bid}
Pickup Date: {pickup_date}
Pickup Time: {pickup_time}

Guest Details:
{guest_details}
Driver Details:
Driver's Name: {driver_name}
Driver's Contact: {driver_contact}
Vehicle Number: {vehicle_no}

Feel free to contact the driver if needed. Have a safe trip!

Please do not reply to this email. This is an automated message and responses will not be monitored.
If you have any queries, Please reach out to this number {contact_support} or mail bookings@anchorpoint.in

Best regards,
Anchorpoint."""
DRIVER_REASSIGN_MAIL_SUBJECT="Driver Reassigned for Your Cab Booking"
DRIVER_REASSIGN_MAIL_BODY = """
Hi {coordinator_name},

We wanted to let you know that your driver has been reassigned for your upcoming cab booking. Please find below details,

Booking Details:
Booking ID: {bid}
Pickup Date: {pickup_date}
Pickup Time: {pickup_time}

Guest Details:
{guest_details}
New Driver Details:
Driver's Name: {driver_name}
Driver's Contact: {driver_contact}
Vehicle Number: {vehicle_no}

Feel free to contact the driver if needed. Have a safe trip!

Please do not reply to this email. This is an automated message and responses will not be monitored.
If you have any queries, Please reach out to this number {contact_support} or mail bookings@anchorpoint.in

Best regards,
Anchorpoint."""
OPERATION_FAILURE_ERR_MSG = "{} operation failed: No Rows Matched the given condition"
INSERT_SUCCESS_MSG = "New {model} with {email} created successfully"
UPDATE_SUCCESS_MSG = "{model} details updated successfully"
DELETE_SUCCESS_MSG = "{model} with '{email}' deleted successfully"
LOGOUT_SUCCESS_MSG = {"message": "Logout successfully"}
OTP_SUCCESS_MSG = {"message": "OTP sent successfully"}
PASSWORD_RESET_SUCCESS_MSG = {"message": "Password has been reset successfully"}
SMS_BODY = "Hello {guest_name}, Your ride is confirmed. DOJ:{pickup_date}, Driver Mobile:{driver_mobile}, Vehicle No:{vehicle_no}, Please ensure your timely arrival- Team AnchorPoint"
DRIVER_SMS_BODY = """
New booking on {pickup_date} {pickup_time}.Arrive on time for first pickup.
{url}
"""
DRIVER_MESSAGE_CONTENT_SID = "HX0f06a845df438457f5de111fabecc844"
DRIVER_WHATSAPP_BODY = """
🚖 New Trip Assigned!

📅 Date: {pickup_date}  
🕒 Time: {pickup_time}  

🏪 Vendor: {vendor_name}  
📞 Vendor Contact: {vendor_contact}  

🧍 Guest: {guest_name}  
📱 Guest Contact: {guest_contact}  

🔑 OTP: {otp}  
🔗 Login: {url}  

📌 Please be on time for the pickup.

📞 Support: {contact_support}"""
GUEST_MESSAGE_CONTENT_SID  = "HX5d424fee12071b9ec130c15fec98a8ef"
GUEST_WHATSAPP_BODY = """🚖 *Booking Confirmation*

Hello {guest_name},

Your ride is confirmed! Please find the below details,

📅 *Date:* {pickup_date}
🕒 *Time:* {pickup_time}
🚗 *Vehicle Number:* {vehicle_no}
👨‍✈️ *Driver's Name:* {driver_name}
📱 *Driver's Contact:* {driver_contact}

Your safety and comfort are our priority. Have a pleasant journey with us!
If you have any queries, Please reach out to this number {contact_support}

Best regards, 
AnchorPoint"""
HOTEL_BOOKING_CONFIRMATION_SUBJECT = "Hotel Booking Confirmation"
HOTEL_BOOKING_CONFIRMATION_BODY = """Dear {coordinator_name},
We are pleased to confirm your hotel booking at {vendor_name}. Please find your reservation details below:

Booking ID: {bid}
Check-in Date: {check_in}
Check-out Date: {check_out}
Room Type: {room_type}
Number of Rooms: {no_of_rooms}
Number of Guests: {no_of_guests}
Confirmation Number: {confirmation_no}
Hotel Address: {vendor_address}

Description: {description} 

Please do not reply to this email. This is an automated message and responses will not be monitored.
If you have any queries, Please reach out to this number {contact_support} or mail bookings@anchorpoint.in. 

Best regards,
Anchorpoint."""
HOTEL_BOOKING_EDIT_CONFIRMATION_SUBJECT = "Confirmation of Your Booking Change Request"
HOTEL_BOOKING_EDIT_CONFIRMATION_BODY = """Dear {coordinator_name},

We would like to inform you that your change request for booking {bid} has been confirmed.

Change request: {edit_request_description}
Organizer Description: {confirmation_description}

Please do not reply to this email. This is an automated message and responses will not be monitored.

If you have any queries, Please reach out to this number {contact_support} or mail bookings@anchorpoint.in. 

Best regards,
Anchorpoint."""
HOTEL_GUEST_SMS_BODY="""
Hello {guest_name},
Your booking at {vendor_name} Hotel has been confirmed! 
Confirmation No: {confirmation_no}
For any support call at {contact_support}
Team AnchorPoint.
"""
HOTEL_MESSAGE_CONTENT_SID = "HX633de3f662ea49c8f04c57471ceef554"
HOTEL_GUEST_WHATSAPP_BODY = """*Booking Confirmed* ✅

Hello {guest_name},
Your hotel booking at {vendor_name} has been confirmed! Please find the booking details below:

*Booking ID:* {bid}
*Check-in Date:* {check_in}
*Check-out Date:* {check_out}
*Room Type:* {room_type}
*Number of Rooms:* {no_of_rooms}
*Number of Guests:* {no_of_guests}
*Confirmation Number:* {confirmation_no}
*Hotel Address:* {hotel_address}

If you have any questions, feel free to reach out to us at {contact_support} or email us at bookings@anchorpoint.in.

We look forward to welcoming you!"""""
RESET_PASSWORD_BODY = """
Hi {user},

To reset your password, click the link below:

{reset_password_link}

If you didn't request this change, just ignore this email.

The link will expire in 5 minutes.

For help, contact us at bookings@anchorpoint.in.

Thanks,
AnchorPoint."""
domains = [
    "@samudhramarine.co.in",
    "@synergyocean.com",
    "@gsshipmanagement.com",
    "@synergyship.com",
    "@alphaori.sg",
    "@gmail.com",
    "@bigthinkcode.com",
    "@anchorpoint.in"
]
public_domains = [
    "gmail.com", "outlook.com", "yahoo.com", "hotmail.com", "live.com",
    "aol.com", "icloud.com", "mail.com", "yandex.com", "zoho.com",
    "gmx.com", "protonmail.com", "inbox.com", "rediffmail.com", "hushmail.com"
]

booking_status_nofication_msg = {
    "Pending": {
        "title": "Booking Status: Pending",
        "body": "Your booking is currently in a 'Pending' status. We're working on processing it. We'll keep you updated.",
    },
    "Acknowledged": {
        "title": "Booking Status: Acknowledged",
        "body": "Your booking is currently in a 'Pending' status. It's being reviewed, and we're getting it ready for the next steps.",
    },
    "Confirmed": {
        "title": "Booking Status: Confirmed",
        "body": "Your booking is 'Confirmed' and in our system. We're preparing to fulfill it and will update you shortly.",
    },
    "Completed": {
        "title": "Booking Status: Completed",
        "body": "Your booking is 'Completed' and on its way to you. We hope you're satisfied with your reservation.",
    },
    "Cancelled": {
        "title": "Booking Status: Cancelled",
        "body": "We regret to inform you that your booking has been 'Cancelled'. If you have any questions, please contact us for assistance.",
    },
}
START_OF_DAY = " 00:00:00"
END_OF_DAY = " 23:59:59"
DISTANCE_MATRIX_URL = (
    "https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial"
)
DIRECTIONS_URL = "https://maps.googleapis.com/maps/api/directions/json?"
GOOGLE_MAPS_URL = "https://www.google.com/maps/dir/"
SMS_DELAY_IN_HOURS = 2.25
DATE_TIME_FORMAT = "DD-MM-YYYY HH24:MI"
DATE_FORMAT = "DD-MM-YYYY"
TIME_FORMAT = "HH12:MI AM"
DATEFORMAT = "%d-%m-%Y"
DATETIME24HRFORMAT = f"{DATEFORMAT} %H:%M"
TIMEFORMAT = "%I:%M %p"
SOURCE_TZ = "UTC"
TARGET_TZ = "Asia/Kolkata"
DATETIME_TZ = "%Y-%m-%d %H:%M:%S %z"
PRESIGNED_URL_EXPIRATION_TIME = 3600
DRIVER_LOGIN_URL = "{api_url}/drivers/login/{booking_id}?otp={otp}"
RESET_PASSWORD_URL= "{api_url}/auth/{reset_password_token}"
PROOFS_S3_BUCKET_FOLDER = 'proofs'
INVOICES_S3_BUCKET_FOLDER = 'invoices'
DOCUMENTS_S3_BUCKET_FOLDER = 'documents'
CREDIT_NOTE_INVOICES_S3_BUCKET_FOLDER = 'credit_notes'
CGST_PERCENT = 2.5
SGST_PERCENT = 2.5

# Constants for file and directory names
RENDERED_HTML_DIR = 'rendered_html'
REPORTS_DIR = 'reports'
DOWNLOADS_DIR = 'downloads'
TEMPLATES_DIR = 'templates'
RENDERED_HTML = 'invoice.html'
HOTEL_INVOICE_HTML = 'hotel_invoice.html'
S3_PUBLIC_URL = "https://{bucket}.s3.{region}.amazonaws.com/{object_name}"
HOTEL_PUSH_NOTIFICATION_FORMAT = {
    "pending": {
        "title": "New Booking Request 🏨📅",
        "body": "Hey organizer!, A new hotel booking request has been received for the dates {check_in} to {check_out}."
    },
    "organizer_assigned": {
        "title": "Organizer Assigned 👨‍💻📆",         
        "body": "Hey {coordinator}!, {organizer} acknowledged your hotel booking request {bid}."
    },
    "vendor_requested": {
        "title": "New Booking Request 🏨📅",
        "body": "Hey {vendor}! You have a new hotel booking request has been received for the dates {check_in} to {check_out}. Review and confirm the request.",
    },
    "vendor_assign_revoked": {
        "title": "Booking Request Revoked 👨‍💻🚫",
        "body": "Hey {vendor}! The booking request {bid} has been revoked by {organizer}.",
    },
    "vendor_accepted": {
        "title": "Vendor Request Accepted 👨‍💻✅",
        "body": "Great news! Your vendor request for a hotel booking {bid} has been confirmed by {vendor}.",
    },
    "vendor_declined": {
        "title": "Vendor Request Declined 👨‍💻🚫",
        "body": "Unfortunately, {vendor} is unable to fulfill your hotel booking request {bid}.",
    },
    "confirmed": {
        "title": "Booking Confirmed 🏨✅",
        "body": "Good news! The hotel booking request {bid} has been confirmed by {vendor}.",
    },
    "cancelled": {
        "title": "Booking Cancelled 🏨❌",
        "body": "Hey {user}! The booking request {bid} has been cancelled by {cancelled_user}.",
    },
    "edit_requested": {
        "title": "Booking Edit Requested ✏️🔄",
        "body": "A change request has been made to booking {bid}. Please review the details."
    },
    "edit_acknowledged": {
        "title": "Booking Edit Acknowledged ✏️👨‍💻",
        "body": "Your edit request for booking {bid} has been acknowledged by the {organizer}. We are processing it"
    },
    "edit_confirmed": {
        "title": "Booking Edit Confirmed ✏️✅",
        "body": "The changes to booking {bid} have been successfully confirmed. The updated details are now active."
    }
}
PUSH_NOTIFICATION_FORMAT = {
    "pending": {
        "title": "New Booking Request 🚖📅",
        "body": "Hey organizer!, A new booking request for {type} on {date} at {time} just came in."
    },
    "booking_accepted": {
        "title": "Booking Accepted 👨‍💻✅",         
        "body": "{organizer} accepted the booking request on {date}."
    },
    "organizer_assigned": {
        "title": "Organizer Assigned 👨‍💻📆",         
        "body": "Hey {coordinator}!, {organizer} acknowledged your {type} booking request on {date}."
    },
    "vendor_requested": {
        "title": "New Booking Request 🚖📅",
        "body": "Hey {vendor}! You have a new booking request on {date}. Review and confirm the request.",
    },
    "vendor_assign_revoked": {
        "title": "Booking Request Revoked 👨‍💻🚫",
        "body": "Hey {vendor}! The booking request on {date} has been revoked by {organizer}.",
    },
    "vendor_accepted": {
        "title": "Vendor Request Accepted 🚖✅",
        "body": "Great news! Your vendor request for a booking on {date} has been confirmed by {vendor}.",
    },
    "vendor_declined": {
        "title": "Vendor Request Declined 🚖🚫",
        "body": "Unfortunately, {vendor} is unable to fulfill your booking request on {date}.",
    },
    "driver_assigned":{
        "title": "Driver Assigned 🚖🧑‍✈️",
        "body": "Good news! {driver} driver is now assigned to booking on {date}."
    },      
    "driver_reassigned":{
        "title": "Driver Re-Assigned 🚖🔄",
        "body": "Update: Your booking on {date} will now be handled by new driver Mr.{driver}."
    },
    "invoice_created": {
        "title": "New Vendor Invoice 📑✍️",
        "body": "A new invoice for the booking on {date} has been raised by {vendor}. Please review it promptly."
    },
    "invoice_approved": {
        "title": "Invoice Approved 🧾✅",
        "body": "Hey {vendor}! Greate news, Your invoice for the booking on {date} has been approved by {organizer} and is ready for payment."
    },
    "invoice_generated":{
        "title": "Invoice Ready 🧾✅",
        "body": "Hey {coordinator}! The invoice for the booking on {date} is now available. Tap to view"
    },
    "invoice_rejected": {
        "title": "Invoice Rejected 🧾❌",
        "body": "Unfortunately, Your invoice for the booking on {date} has been rejected by {organizer}. Please review the details and make necessary adjustments."
    },
    "cancelled": {
        "title": "Booking Cancelled 🧾❌",
        "body": "Hey {user}! The booking request on {date} has been cancelled by {cancelled_user}.",
    },
}
HOTEL_BOOKING_CONFIRMATION_HTML = "hotel_booking_confirmation.html"
BOOKING_CREATED_HTML = "booking_created.html"
BOOKING_CREATED_MAIL_SUBJECT = "New Booking Request Confirmation"
HOTEL_BOOKING_CREATED_HTML = "hotel_booking_created.html"
HOTEL_BOOKING_CREATED_MAIL_SUBJECT = "New Hotel Booking Request Confirmation"
APN_CERTIFICATE_INVALID = "APNs certificate or web push auth key was invalid or missing"
WHATSAPP_DRIVER_CALLBACK_URL="{api_url}/api/callbacks/twilio/drivers"
WHATSAPP_GUEST_CALLBACK_URL="{api_url}/api/callbacks/twilio/guests"
WHATSAPP_HOTEL_GUEST_CALLBACK_URL="{api_url}/api/callbacks/twilio/hotel_bookings/guests"
ALL_BOOKING_STATUS = {
    "pending": "Pending",
    "cancelled": "Cancelled",
    "organizer_assigned": "Organizer Assigned",
    "vendor_requested": "Vendor Requested",
    "vendor_declined": "Vendor Declined",
    "vendor_accepted": "Vendor Accepted",
    "vendor_reassigned": "Vendor Reassigned",
    "vendor_assign_revoked": "Vendor Assign Revoked",
    "driver_assigned": "Driver Assigned",
    "driver_reassigned": "Driver Reassigned",
    "invoice_created": "Invoice Created",
    "invoice_approved": "Invoice Approved",
    "invoice_rejected": "Invoice Rejected",
    "invoice_created_by_super_organizer": "Client Invoice(S.O)",
    "invoice_created_by_organizer": "Client Invoice",
}
VENDOR_BOOKING_STATUS = {
    "vendor_requested": "Vendor Requested",
    "vendor_accepted": "Vendor Accepted",
    "vendor_reassigned": "Vendor Reassigned",
    "driver_assigned": "Driver Assigned",
    "driver_reassigned": "Driver Reassigned",
    "invoice_created": "Invoice Created",
    "invoice_approved": "Invoice Approved",
    "invoice_rejected": "Invoice Rejected",
    "cancelled": "Cancelled"
}
ALL_HOTEL_BOOKING_STATUS = {
    "pending": "Pending",
    "cancelled": "Cancelled",
    "organizer_assigned": "Organizer Assigned",
    "vendor_requested": "Vendor Requested",
    "vendor_declined": "Vendor Declined",
    "vendor_accepted": "Vendor Accepted",
    "vendor_reassigned": "Vendor Reassigned",
    "vendor_assign_revoked": "Vendor Assign Revoked",
    "confirmed": "Confirmed",
    "invoice_created": "Invoice Created",
    "invoice_approved": "Invoice Approved",
    "invoice_rejected": "Invoice Rejected",
    "invoice_created_by_super_organizer": "Client Invoice(S.O)",
    "invoice_created_by_organizer": "Client Invoice",
}
VENDOR_HOTEL_BOOKING_STATUS = {
    "vendor_requested": "Vendor Requested",
    "vendor_accepted": "Vendor Accepted",
    "vendor_reassigned": "Vendor Reassigned",
    "confirmed": "Confirmed",
    "invoice_created": "Invoice Created",
    "invoice_approved": "Invoice Approved",
    "invoice_rejected": "Invoice Rejected",
    "cancelled": "Cancelled"
}
INVOICE_REPORT_COLUMNS_VIEW = ["S.No", "Invoice No", "Invoice Date", "Booking ID", "Booked by", "Client Name", "Client GST No", "Tariff Applied", "Base fare", "Discount", "Gross Amount (Taxable Amount)", f"CGST ({CGST_PERCENT}%)", f"SGST ({SGST_PERCENT}%)", "Gross Amount (Non-Taxable Amount)", "Total Invoice Amount", "Original Invoice No", "booking_id", "booking_date"] 
INVOICE_REPORT_COLUMNS = ["S.No", "Invoice No", "Invoice Date", "Booking ID", "Booked by", "Client Name", "Client GST No", "PO Number", "Tariff Applied", "Base fare", "Discount", "Gross Amount (Taxable Amount)", f"CGST ({CGST_PERCENT}%)", f"SGST ({SGST_PERCENT}%)", "Gross Amount (Non-Taxable Amount)", "Total Invoice Amount", "Original Invoice No"]
JOB_REPORT_COLUMNS = ["S.No", "Booking ID", "Booked By","Booked Date", "Cost Centre", "PO Number", "Organizer Name", "Guest Name", "Rank", "Vessel Name", "Internal ID", "Pickup Location", "Drop Location", "Stops", "Vendor Name", "Driver Name", "Status", "Distance", "Duration", "Tariff Applied", "Vendor Invoice Status", "Vendor Base Fare", "Miscellaneous", "Vendor Invoice Amount", "Travel Mode"]
HOTEL_JOB_REPORT_COLUMNS = ["S.No", "Booking ID", "Booked Date", "Check In", "Check Out", "Trip Type", "Organizer Name", "Hotel Name", "City", "Booked By", "Status", "Cost Centre", "Guest Name", "Rank", "Vessel Name", "Internal ID", "Billing Option" ]
HOTEL_INVOICE_REPORT_COLUMNS = ["S.No", "Booking ID", "Invoice Date", "Invoice No", "Gross Amount (Taxable Amount)", "Gross Amount (Non-Taxable Amount)", "CGST Amount", "SGST Amount", "Total Invoice Amount", "PO Number", "Booked By", "Booked Date",  "Cost Centre", "GST No", "Check In", "Check Out", "Cost Centre", "Trip Type", "Hotel Name", "City", "Billing Option"]