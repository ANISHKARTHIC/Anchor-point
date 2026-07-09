import { useEffect, useState } from "react";
import React from "react";
import { ROUTE } from "./constants/routes";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Message from "./pages/Message";
import { Route, Routes } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import MyTasks from "./pages/MyTasks";
import AppBar from "./components/AppBar";
import BookingDetails from "./pages/BookingDetail";
import DriverDetails from "./pages/DriverDetails";
import PastBookings from "./pages/PastBookings";
import { useDispatch } from "react-redux";
import { incrementPendingCount } from "./store/features/pendingCountSlice";
import DriverLogin from "./pages/DriverLogin";
import DriverBookingDetails from "./pages/DriverBookingDetails";
import DriverTrip from "./pages/DriverTrip";
import DriverTripEnd from "./pages/DriverTripEnd";
import { incrementVendorPendingCount } from "./store/features/pendingCountVendorSlice";
import { Button, Snackbar, IconButton, Slide } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import VendorList from "./pages/VendorList";
import Bookings from "./pages/Bookings";
import HotelCreateBooking from "./pages/HotelCreateBooking";
import OrganizerList from "./pages/OrganizerList";
import TariffPlans from "./components/TariffPlans";
import Settings from "./pages/Settings";
import PrivateRoute from "./pages/PrivateRoute";
import AllBookings from "./pages/AllBookings";
import Report from "./pages/Report";
import CoordinatorBookings from "./pages/CoordinatorBookings";
import CoordinatorBookingDetails from "./pages/CoordinatorBookingDetails";
import ProfilePage from './pages/ProfilePage'
function App() {
  const dispatch = useDispatch();
  const [openToast, setOpenToast] = useState(false);
  const [booking, setBooking] = useState<any>();
  const [notification, setNotification] = useState({ title: "", body: "" });
  const navigate = useNavigate();

  const isVendor = localStorage.getItem("isVendor");
  const [bookingtype,setbookingtype] = useState(localStorage.getItem("bookingtype"));

  navigator.serviceWorker.addEventListener("message", (event) => {
    setBooking(event.data.data.booking);
    if(event.data.data.notification_type!=null&&event.data.data.notification_type==="chat"){
      setOpenToast(true);
      setNotification({
        title: event.data.notification.title,
        body: event.data.notification.body,
      });
    }
    else if (isVendor == "true" && event.data.data.target === "vendor") {
      setOpenToast(true);
      setNotification({
        title: event.data.notification.title,
        body: event.data.notification.body,
      });
    } else if (isVendor == "false" && event.data.data.target === "organizer") {
      setOpenToast(true);
      setNotification({
        title: event.data.notification.title,
        body: event.data.notification.body,
      });
    }

    if (event.data.data.status === "pending" && isVendor == "false") {
      dispatch(incrementPendingCount());
    } else if (
      event.data.data.status === "vendor_requested" &&
      isVendor == "true"
    ) {
      dispatch(incrementVendorPendingCount());
    }
  });

  const action = (
    <React.Fragment>
      <Button color="secondary" size="small">
        {notification.title}
      </Button>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={() => setOpenToast(false)}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </React.Fragment>
  );

  function TransitionRight(props: any) {
    return <Slide {...props} direction="up" />;
  }

  const handleclick = () => {
    navigate(ROUTE.HOME + "/" + ROUTE.BOOKING_DETAILS, {
      state: JSON.parse(booking),
    });
  };

  useEffect(()=>{
    setbookingtype(localStorage.getItem("bookingtype"))
  },[localStorage.getItem("bookingtype")])

  return (
    <>
      <Routes>
        <Route path={ROUTE.LOGIN} element={<Login />} />
        <Route path={ROUTE.HOME} element={<PrivateRoute />}>
          <Route path={ROUTE.HOME} element={<AppBar />}>
            <Route path="" element={<Home />} />
            <Route path={ROUTE.ORGANIZERS} element={<OrganizerList />} />
            <Route path={ROUTE.VENDOR} element={<VendorList />} />
            <Route path={ROUTE.TASKS} element={<MyTasks />} />
            <Route path={ROUTE.BOOKINGS} element={bookingtype == "cab" ? <Bookings /> : <HotelCreateBooking/>} />
            <Route path={ROUTE.TARIFF_PLANS} element={<TariffPlans />} />
            <Route path={ROUTE.SETTINGS} element={<Settings />} />
            <Route path={ROUTE.ALL_BOOKINGS} element={<AllBookings/>} />
            <Route path={ROUTE.COORDINATOR_BOOKINGS} element={<CoordinatorBookings/>} />
            <Route path={ROUTE.COORDINATOR_BOOKINGS_DETAILS} element={<CoordinatorBookingDetails/>} />
            <Route path={ROUTE.USER_PROFILE_PAGE} element={<ProfilePage/>} />
            <Route path={ROUTE.PASTBOOKINGS} element={<PastBookings />} />
            <Route path={ROUTE.MESSAGE} element={<Message />} />
            <Route path={ROUTE.BOOKING_DETAILS} element={<BookingDetails />} />
            <Route path={ROUTE.DRIVER_DETAILS} element={<DriverDetails />} />
            <Route path={ROUTE.JOB_REPORT} element={<Report type={"Job"}/>} />
            <Route path={ROUTE.INVOICE_REPORT} element={<Report type={"Invoice"}/>} />
          </Route>
        </Route>
        <Route path={"*"} element={<Login />} />
        <Route path={ROUTE.PASSWORD_RESET} element={<Login/>} />
        <Route path={ROUTE.DRIVER_LOGIN} element={<DriverLogin />} />
        <Route
          path={ROUTE.DRIVER_BOOKING_DETAILS}
          element={<DriverBookingDetails />}
        />
        <Route path={ROUTE.DRIVER_TRIP} element={<DriverTrip />} />
        <Route path={ROUTE.DRIVER_TRIP_END} element={<DriverTripEnd />} />
      </Routes>
      <Snackbar
        open={openToast}
        autoHideDuration={5000}
        onClose={() => setOpenToast(false)}
        message={notification.body}
        action={action}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        TransitionComponent={TransitionRight}
        onClick={handleclick}
      />
    </>
  );
}

export default App;
