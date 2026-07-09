export default statusCategories = {
  CANCELLED: ['cancelled'],

  AWAITING_APPROVAL: [
    'pending',
    'organizer_assigned',
    'vendor_requested',
    'vendor_declined',
  ],

  PENDING_DRIVER_ASSIGNMENT: ['vendor_accepted', 'vendor_assign_revoked'],

  DRIVER_ASSIGNED: ['driver_assigned', 'driver_reassigned'],

  INVOICE_ACTIONS: ['invoice_created', 'invoice_approved', 'invoice_rejected'],

  COMPLETED: [
    'invoice_created_by_organizer',
    'invoice_created_by_super_organizer',
  ],
};



