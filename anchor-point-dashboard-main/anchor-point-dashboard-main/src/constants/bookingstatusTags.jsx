import { CancelOutlined as CancelledIcon, EventAvailableRounded as ConfirmedIcon, HourglassTopOutlined as WaitingIcon , PendingActionsOutlined as PendingIcon } from "@mui/icons-material";

export const timelineEvents = {
  'Request Initiated': [
    'pending',
    'organizer_assigned',
    'vendor_requested',
    'vendor_declined',
  ],

  'Vendor Accepted': ['vendor_accepted', 'vendor_assign_revoked'],

  'Driver Assigned': [
    'driver_assigned',
    'driver_reassigned',
    'invoice_created',
    'invoice_approved',
    'invoice_rejected',
  ],

  'Trip Completed': [
    'invoice_created_by_organizer',
    'invoice_created_by_super_organizer',
  ],

  Cancelled: ['cancelled'],
};

export const cabStatusTags = {
  PENDING: ["pending"],

  CONFIRMED: ["organizer_assigned"],

  INPROGRESS: [
    "vendor_requested",
    "vendor_declined",
    "vendor_accepted",
    "vendor_assign_revoked",
  ],

  DRIVER: ["driver_assigned", "driver_reassigned"],

  COMPLETED: [
    "invoice_created",
    "invoice_approved",
    "invoice_rejected",
    "invoice_created_by_organizer",
    "invoice_created_by_super_organizer",
  ],

  CANCELLED: ["cancelled"],
};
export const hotelStatusTags = (status) =>
  ({
    pending: "Pending - Oranganiser not assigned",
    confirmed: "Booking Confirmed",
    declined: "Declined",
    cancelled: "Cancelled",
  })[status] || "Waiting for confirmation";
export const hotelStatusColor = (status) =>
  ({
    pending: "#f3a637",
    confirmed: "#42b504",
    declined: "#FF3838",
    cancelled: "#FF3838",
  })[status] || "#2DCCFF";
export const hotelStatusIcons = (status) =>
  ({
    pending: <PendingIcon sx={{ mr: 0.5, color: hotelStatusColor("pending")}}></PendingIcon>,
    confirmed: <ConfirmedIcon sx={{ mr: 0.5, color: hotelStatusColor("confirmed") }}></ConfirmedIcon> ,
    declined: <CancelledIcon sx={{ mr: 0.5, color: hotelStatusColor("declined") }}></CancelledIcon>,
    cancelled: <CancelledIcon sx={{ mr: 0.5, color: hotelStatusColor("cancelled") }}></CancelledIcon>,
  })[status] || <WaitingIcon sx={{ mr: 0.5, color: hotelStatusColor("unknown") }}></WaitingIcon>;

export const cabStatusColor = {
  PENDING: "#f3a637",
  CONFIRMED: "#42b504",
  "IN-PROGRESS": "#2DCCFF",
  "DRIVER ASSIGNED": "#FCE83A",
  COMPLETED: "#42b504",
  CANCELLED: "#FF3838",
};

export const editRequestStatusTags = (status) =>
  ({
    edit_requested: "Edit Requested",
    edit_acknowledged: "Request Acknowledged",
    edit_confirmed: "Edit Confirmed",
  })[status] || "Contact Organiser";

  export const editRequestStatusColor = (status) =>
    ({
      edit_requested: "#f3a637",
      edit_acknowledged: "#2DCCFF",
      edit_confirmed: "#42b504",
    })[status] || "#2DCCFF";
