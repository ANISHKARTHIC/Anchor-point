import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./features/authSlice";
import tasksSlice from "./features/tasksSlice";
import guestSlice from "./features/guestSlice";
import driverSlice from "./features/driverSlice";
import pendingCountVendorSlice from "./features/pendingCountVendorSlice";
import pendingCountSlice from "./features/pendingCountSlice";
import bookingReducer from "./features/bookingSlice";
import creditNoteInvoiceSlice from './features/creditNoteSlice'

const store = configureStore({
  reducer: {
    auth: authSlice,
    tasks: tasksSlice,
    guests: guestSlice,
    driver: driverSlice,
    pendingVendor: pendingCountVendorSlice,
    pending: pendingCountSlice,
    booking: bookingReducer,
    creditNote: creditNoteInvoiceSlice,
  },
});

export default store;
export type AppDispatch = typeof store.dispatch;
