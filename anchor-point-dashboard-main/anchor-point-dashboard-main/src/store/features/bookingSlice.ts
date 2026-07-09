import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  prefilledBookingData: null,
};

const bookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    setPrefilledBookingData: (state, action) => {
      state.prefilledBookingData = action.payload;
    },
    clearPrefilledBookingData: (state) => {
      state.prefilledBookingData = null;
    },
    clearBooking: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setPrefilledBookingData,
  clearPrefilledBookingData,
  clearBooking,
} = bookingSlice.actions;

export default bookingSlice.reducer;
