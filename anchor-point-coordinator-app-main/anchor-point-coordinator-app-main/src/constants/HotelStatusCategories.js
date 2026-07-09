const HotelStatusCategories = {
  CANCELLED: ['cancelled'],

  AWAITING_APPROVAL: [
    'pending',
    'organizer_assigned',
    'vendor_requested',
    'vendor_declined',
    'vendor_accepted',
    'vendor_assign_revoked',
  ],

  CONFIRMED: ['confirmed'],

  INVOICE_ACTIONS: ['invoice_created', 'invoice_approved', 'invoice_rejected'],

  COMPLETED: [
    'invoice_created_by_organizer',
    'invoice_created_by_super_organizer',
  ],
};

export default HotelStatusCategories;
