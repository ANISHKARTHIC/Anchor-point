import { AlternateEmail } from "@mui/icons-material";

export const BASE_URL = `${import.meta.env.VITE_BASE_SERVER_URL}/api`;

export const environment = `${import.meta.env.VITE_ENV}`;

export const GOOGLE_MAP_API_KEY = `${import.meta.env.VITE_GOOGLE_MAP_API_KEY}`;

export const STRING_LOGIN = {
  TEXT_GREET: "Welcome to",
  TEXT_ANCHORP: "ANCHORP",
  TEXT_INT: "INT",
  TEXT_HELPER_SIGN_IN: "Please sign-in to your account and start the bookings!",
  TEXT_ENTEROTP: "Enter OTP Received in Email",
  LABEL_SIGN_IN: "Sign In",
  LABEL_VENDOR: "Sign-in as vendor",
  LABEL_COORDINATOR: "Sign-in as co-ordinator",
  LABEL_CONFIRM: "Confirm",
};

export const STRING_HOME = {
  LABEL_SHOW_TOAST: "Show Toast",
  TASK_SUMMARY: "Task Summary",
  LAST_UPDATED: "Last Updated on 2 hours ago",
};

export const STRING_ALERT = {
  CHECK: "Check it out!",
  DEFAULT: "Something went wrong",
};

export const STRING_BOOKINGS_LIST = {
  SEE_ALL: "See All",
  OPEN_REQUESTS: "Open Requests",
  NEW_REQUESTS: "New Requests",
  MY_REQUESTS: "My Requests",
  REQUEST: "Request from",
  FOR: "for",
  ON: "on",
  LABEL_ASSIGN_ME: "Assign me",
  LABEL_VIEW_DETAILS: "VIEW DETAILS",
  TEXT_TOOLTIP: "High Priority! This request is still",
  NEW_INVOICE: " has Raised Invoice for",
};

export const STRING_ERROR = {
  NETWORK_RESPONSE: "Network response was not ok",
};

export const BOOKING_STATUS = {
  PENDING: "pending",
  CANCELLED: "cancelled",
  ORGANIZER_ASSIGNED: "organizer_assigned",
  VENDOR_REQUESTED: "vendor_requested",
  VENDOR_DECLINED: "vendor_declined",
  VENDOR_ACCEPTED: "vendor_accepted",
  VENDOR_REASSIGNED: "vendor_reassigned",
  VENDOR_REVOKED: "vendor_assign_revoked",
  CONFIRMED: "confirmed",
  DRIVER_ASSIGNED: "driver_assigned",
  DRIVER_REASSIGNED: "driver_reassigned",
  INVOICE_CREATED: "invoice_created",
  INVOICE_APPROVED: "invoice_approved",
  INVOICE_REJECTED: "invoice_rejected",
  INVOICE_CREATED_BY_ORGANIZER: "invoice_created_by_organizer",
  INVOICE_CREATED_BY_SUPER_ORGANIZER: "invoice_created_by_super_organizer",
  TRIP_IN_24HR:"trips_in_24hrs",
};

export const GUEST_DETAILS_TABLE_HEADER = {
  name: "Name",
  email:"Email",
  // alternate_email: "Alternate Email",
  mobile: "Mobile",
  // alternate_mobile:"Alternate Mobile",
  flight_details: "Flight details",
  // source: {
  //   name: "Pickup Door no",
  //   address: "Pickup Address",
  //   title: "Address Title",
  //   landmark: "Pickup Landmark",
  // },
  pickup:"Pick up",
  waypoints:"Waypoints",
  // waypoints: {
  //   address: "Waypoint Addresses",
  // },
  // destination: {
  //   name: "Drop Door no",
  //   address: "Drop Address",
  //   title:"Address Title",
  //   landmark: "Drop Landmark",
  // },
  drop:"Drop"
};

export const HOTEL_GUEST_TABLE_HEADER = {
  name: "Name",
  mobile: "Mobile",
  email: "email",
  internal_id: "Internal ID",
  rank: "Rank",
  vessel_name: "Vessel Name",
};

export const NEW_BOOKINGS_PAGINATION_LIMIT = 5;

export const PRIORITY_STATUS = {
  pending: "not yet assigned to an organizer",
  organizer_assigned: "not yet assigned to a vendor",
  vendor_requested: "not yet responded",
  vendor_accepted: "not yet assigned a driver",
  vendor_declined: "not yet assigned to a vendor",
};

export const DRIVER_DETAILS_TABLE_HEADER = {
  name: "Name",
  primary_mobile: "Primary Number",
  secondary_mobile: "Secondary Number",
  vehicle_no: "Cab Number",
};

export const TRIP_STATUS = {
  STARTED: "started",
  COMPLETED: "completed",
  PICKED: "picked",
  DROPPED: "dropped",
  NOSHOW: "noshow",
};

export const EDIT_STATUS = {
  EDIT_REQUESTED: "edit_requested",
  EDIT_ACKNOWLEDGED: "edit_acknowledged",
  EDIT_CONFIRMED: "edit_confirmed",
};

export const HOTEL_STRING = {
  check_in: "Check in",
  check_out: "Check out",
  cost_centre: "Cost center",
  no_of_rooms: "No of Rooms",
  no_of_adults: "No of Adults",
  no_of_children: "No of Kids",
  trip_type: "Trip type",
  room_type: "Room type",
  pickup: "Pickup",
  drop: "Drop",
  city: "City",
  related_booking_id: "Related booking ID",
  cc_recipients: "CC Recipients",
  billing_option: "Billing option",
  description: "Description",
}

export const CAB_STRING = {
  cost_centre: "Cost center",
  pickup_date: "Pickup Date",
  pickup_time: "Pickup Time",
  cab_type: "Cab type",
  description : "Description",
  name: "Name",
  mobile: "Mobile",
  email: "email",
  flight_details: "Flight details",
  internal_id: "Internal ID",
  rank: "Rank",
  vessel_name: "Vessel Name",
  date_of_duty: "Date of Duty",
  start_time: "Start Time",
  pickup: "Pickup",
  po_number: "PO Number",
  stop: "Stop",
  drop: "Drop",
  alternate_mobile:"Alternate Number",
  alternate_email:"Alternate Email"
};

export const CAB_BOOKING_ACTIVITY = {
  CAB_TYPE_CHANGE: "cab_type_change",
  PICKUP_DATE_CHANGE: "pickup_date_change",
  PICKUP_TIME_CHANGE: "pickup_time_change",
  COST_CENTRE_CHANGE: "cost_centre_change",
  DESCRIPTION_CHANGE: "description_change",
  PO_NUMBER_CHANGE: "po_number_change",
  GUEST_ADD_CHANGE: "guest_add_change",
  GUEST_EDIT_CHANGE: "guest_edit_change",
  GUEST_DELETE_CHANGE: "guest_delete_change",
  GUEST_DROP_CHANGE: "guest_drop_change",
  GUEST_PICKUP_CHANGE: "guest_pickup_change",
  GUEST_STOP_ADDED_CHANGE: "guest_stop_added_change",
  GUEST_STOP_REMOVED_CHANGE: "guest_stop_removed_change",
}

export const HOTEL_BOOKING_ACTIVITY = {
  COST_CENTRE_CHANGE: "cost_centre_change",
  GUEST_ADD_CHANGE: "guest_add_change",
  GUEST_EDIT_CHANGE: "guest_edit_change",
  GUEST_DELETE_CHANGE: "guest_delete_change",
  CITY_CHANGE: "city_change",
	TRIP_TYPE_CHANGE: "trip_type_change",
	CHECK_IN_CHANGE: "check_in_change",
	CHECK_OUT_CHANGE: "check_out_change",
	NO_OF_ADULTS_CHANGE: "no_of_adults_change",
	NO_OF_CHILDREN_CHANGE: "no_of_children_change",
	NO_OF_ROOMS_CHANGE: "no_of_rooms_change",
	ROOM_TYPE_CHANGE: "room_type_change",
	RELATED_BOOKING_ID_CHANGE: "related_booking_id_change",
	CC_RECIPIENTS_CHANGE: "cc_recipients_change",
	PICKUP_CHANGE: "pickup_change",
	DROP_CHANGE: "drop_change",
	BILLING_OPTION_CHANGE: "billing_option_change",
  DESCRIPTION_CHANGE: "description_change",
};

export const INVOICE_STATUS = {
  INVOICE_CREATED: "invoice_created",
  INVOICE_APPROVED: "invoice_approved",
  INVOICE_REJECTED: "invoice_rejected",
  INVOICE_CREATED_BY_ORGANIZER: "invoice_created_by_organizer",
  INVOICE_CREATED_BY_SUPER_ORGANIZER: "invoice_created_by_super_organizer",
};

export const ADD_USERS = {
  ORGANIZER: "Organizer",
  VENDOR: "Vendor",
};

export const STRING_BOOKINGS = {
  BOOKINGMAIN_HEADER: "Create Booking",
  BOOKINGEDIT_HEADER: "Edit Booking",
  BOOKING_HEADER: "Book a Cab",
  HOTEL_HEADER: "Book a Hotel",
  COORDINATOR: "Coordinator Email",
  PEOPLE: "Guests",
  KIDS: "Kids",
  DATE: "Select Date",
  MULTI_DATE: "Select Multiple Dates",
  TIME: "Select Time",
  CHECKIN: "Check-in date",
  CHECKOUT: "Check-out date",
  TRIPTYPE: "Accompanied by Family?",
  CABTYPE: "Cab Type",
  COSTCENTER: "Cost Center",
  ROOMTYPE: "Room Type",
  ROOMNO: "No. of Rooms",
  CITY: "City",
  HOTEL: "Hotel",
  PASSENGERHEADING: "Passengers",
  FORMHEADING: "Passenger Information",
  DESCRIPTION: "Description",
  PO_NUMBER: "PO Number",
  CC_EmailIds: "CC Email IDs",
  RELATED_BID: "Related Booking ID",
  PICKUP: "Airport Pickup",
  DROP: "Airport Drop",
  FLIGHT_DETAILS: "Flight Details",
  FLIGHT_TIME: "Flight Time",
  BILLING_OPTION: "Billing Option",
  RENT_A_CAB: "Rent a Cab",
};