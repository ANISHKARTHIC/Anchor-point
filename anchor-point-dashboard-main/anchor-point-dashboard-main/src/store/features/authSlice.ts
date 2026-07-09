import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { BASE_URL } from "../../constants/string";

const initialState = {
  data: {},
  status: "idle",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(adminLogin.pending, (state, action) => {
        state.status = "Loading";
      })
      .addCase(adminLogin.fulfilled, (state, action) => {
        state.data = action.payload;
        state.status = "satisfied";
      })
      .addCase(adminLogin.rejected, (state, action: any) => {
        state.data = action.payload;
        state.status = "error";
      })
      .addCase(validateOTP.pending, (state, action) => {
        state.status = "Loading";
      })
      .addCase(validateOTP.fulfilled, (state, action: any) => {
        state.data = action.payload;
        state.status = "satisfied";
      })
      .addCase(validateOTP.rejected, (state, action:any) => {
        state.data = action.payload;
        state.status = "error";
      });
  },
});

export default authSlice.reducer;

export const adminLogin = createAsyncThunk(
  "auth/login",
  async (
    { email, password, isVendor, isCoordinator, }: any,
    { rejectWithValue },
  ) => {
    let url = isVendor
      ? `${BASE_URL}/vendors/login`
      : isCoordinator
      ? `${BASE_URL}/coordinators/signup`
      : `${BASE_URL}/organizers/login`;
    const data = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    if (!data.ok) {
      return rejectWithValue({
        status: data.status,
        message: await data.json(),
      });
    }
    const result = await data.json();
    console.log("result",result)
    if (!isCoordinator) {
      localStorage.setItem("isVendor", isVendor);
      localStorage.setItem("userToken", result.access_token);
      localStorage.setItem("userID", result.id);
      localStorage.setItem("userName", result.name);
      localStorage.setItem("userEmail",email);
      localStorage.setItem("role", result.role);
      localStorage.setItem("isAuthenticated", "true");
      result.vendor_type
        ? localStorage.setItem("bookingtype", result.vendor_type)
        : localStorage.setItem("bookingtype", "cab");
    }
    return result;
  },
);

export const validateOTP = createAsyncThunk(
  "auth/otp",
  async ({ email, otp }: any, { rejectWithValue }) => {
    let url = `${BASE_URL}/coordinators/login`;
    const data = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp }),
    });
    if (!data.ok) {
      return rejectWithValue({
        status: data.status,
        message: await data.json(),
      });
    }
    const result = await data.json();
    if(result.name && result.mobile){
      localStorage.setItem("userName", result.name);
      localStorage.setItem("userMobile",result.mobile)
    }
    localStorage.setItem("userEmail",email);
    localStorage.setItem("isVendor","false");
    localStorage.setItem("userToken", result.access_token);
    localStorage.setItem("userID", result.id);
    localStorage.setItem("role",'coordinator');
    localStorage.setItem("isAuthenticated","true");

    result.vendor_type ? localStorage.setItem("bookingtype",result.vendor_type) : localStorage.setItem("bookingtype", "cab")
      
    return result;
  },
);
