import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  value: 0,
};

const pendingCountSlice = createSlice({
  name: "pendingCount",
  initialState,
  reducers: {
    incrementPendingCount: (state) => {
      state.value += 1;
    },
  },
});

export const { incrementPendingCount } = pendingCountSlice.actions;
export default pendingCountSlice.reducer;
