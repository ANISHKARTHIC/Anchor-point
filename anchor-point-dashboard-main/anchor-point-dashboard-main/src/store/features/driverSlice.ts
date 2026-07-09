import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { BASE_URL } from "../../constants/string";

const initialState = {
  driver: {},
  status: "idle",
};

const driverSlice = createSlice({
    name: "driver",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
      builder
        .addCase(driverDetailsRequest.pending, (state, action) => {
          state.status = "Loading";
        })
        .addCase(driverDetailsRequest.fulfilled, (state, action) => {
          state.driver = action.payload?.driver;
          state.status = "satisfied";
        })
        .addCase(driverDetailsRequest.rejected, (state, action) => {
          state.status = "error";
        });
    },
  });
  
export default driverSlice.reducer;

export const driverDetailsRequest = createAsyncThunk(
  "driver/get",
  async ({ rejectWithValue, bookingId }: any) => {
    const data = await fetch(
      `${BASE_URL}/vendors/bookings/${bookingId}/drivers`,
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

