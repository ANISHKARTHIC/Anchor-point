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

export const statusTags = {
  PENDING: ['pending'],

  CONFIRMED: ['organizer_assigned'],

  INPROGRESS: [
    'vendor_requested',
    'vendor_declined',
    'vendor_accepted',
    'vendor_assign_revoked',
  ],

  DRIVER: ['driver_assigned', 'driver_reassigned'],

  COMPLETED: [
    'invoice_created',
    'invoice_approved',
    'invoice_rejected',
    'invoice_created_by_organizer',
    'invoice_created_by_super_organizer',
  ],

  CANCELLED: ['cancelled'],
};
