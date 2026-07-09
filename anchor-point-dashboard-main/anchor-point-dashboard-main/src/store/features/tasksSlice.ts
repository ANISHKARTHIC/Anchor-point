import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { BASE_URL } from "../../constants/string";

const initialState = {
  list: {
    data: [],
  },
  status: "idle",
};

const tasksSlice = createSlice({
  name: "taks",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(myRequests.pending, (state, action) => {
        state.status = "Loading";
      })
      .addCase(myRequests.fulfilled, (state, action) => {
        state.list = action.payload;
        state.status = "satisfied";
      })
      .addCase(myRequests.rejected, (state, action) => {
        state.status = "error";
      });
  },
});

export default tasksSlice.reducer;

export const myRequests = createAsyncThunk(
  "myRequests/get",
  async ({ rejectWithValue, url }: any) => {
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
