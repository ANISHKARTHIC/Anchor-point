import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { BASE_URL } from "../../constants/string";

const initialState = {
  guests: [],
  status: "idle",
};
const bookingtype = localStorage.getItem("bookingtype");

const guestSlice = createSlice({
    name: "guests",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
      builder
        .addCase(guestsInBookingRequest.pending, (state, action) => {
          state.status = "Loading";
        })
        .addCase(guestsInBookingRequest.fulfilled, (state, action) => {
          state.guests = bookingtype == "cab" ? action.payload?.guests : action.payload?.hotel_booking_guests;
          state.status = "satisfied";
        })
        .addCase(guestsInBookingRequest.rejected, (state, action) => {
          state.status = "error";
        });
    },
  });
  
export default guestSlice.reducer;

export const guestsInBookingRequest = createAsyncThunk(
  "guests/fetch",
  async ({ rejectWithValue, bookingId }: any) => {
    const isVendor = localStorage.getItem("isVendor");
    const url = isVendor == "true"
      ? bookingtype == "cab"
        ? `${BASE_URL}/vendors/bookings/${bookingId}/guests` 
        : `${BASE_URL}/hotel_bookings/${bookingId}/guests`
      :  bookingtype == "cab"
        ? `${BASE_URL}/organizers/bookings/${bookingId}/guests`
        : `${BASE_URL}/hotel_bookings/${bookingId}/guests`
    const data = await fetch(
      url,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
      },
    );
    if (!data.ok) {
      return rejectWithValue({
        status: data.status,
        message: await data.json(),
      });
    }
    const result = await data.json();
    return result;
  },
);

