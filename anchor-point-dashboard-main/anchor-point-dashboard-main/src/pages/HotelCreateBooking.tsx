import * as React from "react";
import {
  STRING_BOOKINGS,
  BASE_URL,
} from "../constants/string";

import { useState } from "react";
import { Backdrop, Button, CircularProgress, Stepper } from "@mui/material";

import HotelGuestInfo from "../components/HotelGuestInfo";
import HotelBookingInfo from "../components/HotelBookingInfo"
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import PassengerList from "../components/PassengerList";

import { useLocation, useNavigate } from "react-router-dom";
import { ROUTE } from "../constants/routes";
import Toast from "../components/Toast";
import { useDispatch, useSelector } from "react-redux";
import { clearBooking } from "../store/features/bookingSlice";

const steps = ["Enter Stay Details", "Enter Guest Details", "Completed"];

function HotelCreateBooking() {
  const navigate = useNavigate();
  const prefilledBookingData = useSelector(
    (state) => state.booking.prefilledBookingData,
  );
  const dispatch = useDispatch();
  const [open, setOpen] = React.useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedIndex, setSelelctedIndex] = useState(0);
  const [bookingData, setBookingData] = useState(
    prefilledBookingData || {
    coordinator_email : "",
    vendor_id : "",
    trip_type: "",
    cost_centre_id: "",
    city: "",
    no_of_adults: 0,
    no_of_children: 0,
    no_of_rooms: 0,
    check_in: "",
    check_out: "",
    guests: [],
    description: ""
  });

  const [openToast, setOpenToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [deleteGuestsData, setDeleteGuestsData] = useState<any[]>([]);

  const userRole=localStorage.getItem('role')

  const handleNext = () => {
    if (activeStep !== steps.length) {
      setActiveStep(1);
    }
  };
  
  const handlePlaceBooking = () => {
    if (activeStep !== steps.length) {
      setActiveStep(2);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  const handleBookingDataChange = (newData: any) => {
    setBookingData((prevData) => ({
      ...prevData,
      ...newData ,
    }));
  };

  const handleEditFinish = async () => {
    if(bookingData.trip_type == "Official" && bookingData.guests.length != bookingData.no_of_adults) return alert("Please fill details of all the guests")

    setOpen(true)

    const updatedBookingData = { ...bookingData };

    const modifiedGuests: any = updatedBookingData.guests.map((guest: any,index: number) => (
      index == 0 ? {
        ...guest,
        is_primary: true,
        mobile: guest.mobile.replaceAll(/\s/g,''),
      } : {
        ...guest,
        is_primary: false,
        mobile: guest.mobile.replaceAll(/\s/g,''),
      }
    ));

    if (deleteGuestsData && deleteGuestsData.length > 0) {
      updatedBookingData.guests = [
        ...modifiedGuests,
        ...deleteGuestsData,
      ];
    } else {
      updatedBookingData.guests = [
        ...modifiedGuests,
      ];
    }

    const url = `${BASE_URL}/hotel_bookings/${updatedBookingData.id}`;
    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
        body: JSON.stringify(updatedBookingData),
      });

      const responseData = await response.json();
      if (!response.ok) {
        console.error("Error Response:", responseData);
        throw new Error(
          responseData?.detail ||
            "An error occurred while updating the booking.",
        );
      }

      console.log("Booking updated successfully:", responseData);
      setToastMessage("Booking updated successfully!");
      setToastType("success");
      setOpenToast(true);

      setTimeout(() => {
        setOpen(false);
        const navigatePath =
          userRole === "coordinator"
            ? `../${ROUTE.COORDINATOR_BOOKINGS}`
            : `../${ROUTE.BOOKING}/${responseData.bid}`;
        navigate(navigatePath);
      }, 1000);
    } catch (error) {
      setOpen(false);
      console.error("Error updating booking:", error);
      setToastMessage(`Error updating booking: ${error.message}`);
      setToastType("error");
      setOpenToast(true);
    }
  };

  const handleFinish = async () => {
    if(bookingData.trip_type == "Official" && bookingData.guests.length != bookingData.no_of_adults) return alert("Please fill details of all the guests")

    setOpen(true)
    const modifiedGuests: any = bookingData.guests.map((guest: any,index: number) => (
      index == 0 ? {
        ...guest,
        is_primary: true,
        mobile: guest.mobile.replaceAll(/\s/g,''),
      } : {
        ...guest,
        mobile: guest.mobile.replaceAll(/\s/g,''),
      }
    ));

    bookingData.guests = modifiedGuests;
    try {
      const response = await fetch(`${BASE_URL}/hotel_bookings/`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
        body: JSON.stringify(bookingData),
      });
      const data = await response.json();
      if (!response.ok) {
        (response.status != 422 && response.status != 500) ? console.log("Error:",data) : "";
        throw new Error(data?.detail);
      }
      setTimeout(() => {
        setOpenToast(false)
        setOpen(false)
        if(userRole!=null&&userRole==="coordinator"){
          navigate("../" + ROUTE.COORDINATOR_BOOKINGS);
        }else{
          navigate("../" + ROUTE.TASKS)
        }
      }, 1000);
      setToastMessage("Booking created successfully!");
      setToastType("success");
      setOpenToast(true);
    } catch (error: any) {
      setOpen(false)
      setToastMessage("Error creating booking: " + error.message);
      setToastType("error");
      setOpenToast(true);
      console.error("Error creating booking:", error);
    }
  };

  const isGuestValid = (guest: any) => {
    return (
      guest.name &&
      guest.email &&
      guest.mobile
    );
  };

  const allGuestsValid =
    bookingData.guests &&
    bookingData.guests.length > 0 &&
    bookingData.guests.every(isGuestValid);

  React.useEffect(() => {
    if (prefilledBookingData) {
      setBookingData(prefilledBookingData);
      handleNext();
    }
  }, [prefilledBookingData]);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col w-full bg-appBg p-3">
      <div className="text-base font-bold">
      {prefilledBookingData
          ? `${STRING_BOOKINGS.BOOKINGEDIT_HEADER} - ${prefilledBookingData.bid}`
          : STRING_BOOKINGS.BOOKINGMAIN_HEADER}
      </div>

      {openToast && <Toast message={toastMessage} toastType={toastType} />}

      <div className="w-full flex flex-col md:flex-row justify-between mt-1 mb-1">
        <Stepper activeStep={activeStep} sx={{ width: "80%" }}>
          {steps.map((label) => {
            const stepProps: { completed?: boolean } = {};
            const labelProps: {
              optional?: React.ReactNode;
            } = {};

            return (
              <Step key={label} {...stepProps}>
                <StepLabel {...labelProps}>
                  <div className="hidden text-base md:block font-thin">{label}</div>
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
        <div className="flex flex-row justify-center md:justify-end items-center md:items-end m-5">
          {activeStep >= 0 && !prefilledBookingData && (
            <Button
              variant="contained"
              onClick={handleReset}
              sx={{ mr: 1 }}
              disabled={activeStep === 0}
            >
              Reset
            </Button>
          )}

          {prefilledBookingData && (
            <Button
              variant="contained"
              onClick={() => {
                dispatch(clearBooking());
                navigate(`/home/booking/${prefilledBookingData.bid}`);
              }}
              sx={{ mr: 1 }}
              disabled={activeStep === 0}
            >
              Cancel
            </Button>
          )}

          <Button
            onClick={bookingData.bid ? handleEditFinish : handleFinish}
            variant="contained"
            disabled={!allGuestsValid}
          >
            Finish
          </Button>
          <Backdrop
            sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.drawer + 1 })}
            open={open}
          >
            <CircularProgress color="inherit" />
          </Backdrop>
        </div>
      </div>
        <div className="flex flex-col md:flex-row justify-between w-full bg-appBg pt-2 lg:pt-0">
          <HotelBookingInfo
            bookingData={bookingData}
            onClick={handleNext}
            onDataChange={handleBookingDataChange}
            stepper={activeStep}
          />
          {activeStep > 0 && (
            <div className="flex flex-col md:flex-row justify-center md:justify-evenly w-full ">
              <PassengerList
                bookingData={bookingData}
                onDataChange={handleBookingDataChange}
                onSelectedIndex={setSelelctedIndex}
                OnDeleteGuestsData={setDeleteGuestsData}
                deleteGuestsData={deleteGuestsData}
              />
              <HotelGuestInfo
                bookingData={bookingData}
                onDataChange={handleBookingDataChange}
                selectedIndex={selectedIndex}
                onFinish={handlePlaceBooking}
                stepper={activeStep}
              />
            </div>
          )}
        </div>
    </div>
  );
}

export default HotelCreateBooking;
