import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  value: 0,
};

const pendingCountVendorSlice = createSlice({
  name: "pendingCount",
  initialState,
  reducers: {
    incrementVendorPendingCount: (state) => {
      state.value += 1;
    },
  },
});

export const { incrementVendorPendingCount } = pendingCountVendorSlice.actions;
export default pendingCountVendorSlice.reducer;
