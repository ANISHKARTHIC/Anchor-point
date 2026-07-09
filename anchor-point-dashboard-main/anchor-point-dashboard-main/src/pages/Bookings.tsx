import * as React from "react";
import { STRING_BOOKINGS, BASE_URL } from "../constants/string";

import { useState } from "react";
import {
  Button,
  Box,
  Stepper,
  CircularProgress,
  Backdrop,
} from "@mui/material";

import FormComponent from "../components/FormComponent";
import BookingDateTimeForm from "../components/BookingDateTimeForm";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import PassengerList from "../components/PassengerList";
import { useDispatch } from "react-redux";

import { useNavigate } from "react-router-dom";
import { ROUTE } from "../constants/routes";
import Toast from "../components/Toast";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import {
  clearBooking,
  clearPrefilledBookingData,
} from "../store/features/bookingSlice";

const steps = ["Enter Travel Details", "Enter Passenger Details", "Completed"];

function BookingDetail() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const prefilledBookingData = useSelector(
    (state) => state.booking.prefilledBookingData,
  );

  const [activeStep, setActiveStep] = useState(0);
  const [selectedIndex, setSelelctedIndex] = useState(0);
  const [coordinatorEmail] = useState("");
  const [description] = useState("");
  const [poNumber] = useState("");
  let initialData = {
    type: "Cab",
    data: {
      cab_type: "",
      cost_centre_id: "",
      pick_up_date: "",
      pick_up_time: "",
      travel_mode: "standard",
      guests: [],
      po_number: poNumber,
      city_id:"",
    },
    booking_escalation: "False",
    approver_email: "",
    coordinator_email: coordinatorEmail,
    description: description,
  };

  const [bookingData, setBookingData] = useState(
    prefilledBookingData || initialData,
  );

  const [openToast, setOpenToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [open, setOpen] = React.useState(false);
  const [deletedWaypoints, setDeletedWaypoints] = useState<any[]>([]);
  const [deleteGuestsData, setDeleteGuestsData] = useState<any[]>([]);

  const userRole = localStorage.getItem("role");

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
      data: { ...prevData.data, ...newData },
    }));
  };

  const handleCabDataChange = (newData: any) => {
    setBookingData((prevData) => ({
      ...prevData,
      ...newData,
    }));
  };

  const handleCoordinatesChange = (newData: any) => {
    setBookingData((prevData) => ({
      ...prevData,
      coordinator_email: newData,
    }));
  };

  const handleDescription = (newData: any) => {
    setBookingData((prevData) => ({
      ...prevData,
      description: newData,
    }));
  };

  const handleFinish = async () => {
    setOpen(true);

    const modifiedGuests: any = bookingData.data.guests.map((guest: any) => ({
  ...guest,
      mobile: guest.mobile.replaceAll(/\s/g, ""),
      alternate_mobile: guest.alternate_mobile.replaceAll(/\s/g, ""),
}));

    // Convert pick_up_date based on its length
    const pickUpDate = bookingData.data.pick_up_date;
    let formattedPickUpDate;

    if (Array.isArray(pickUpDate) && pickUpDate.length === 1) {
      // Handle the case where there's only one date
      formattedPickUpDate = dayjs(pickUpDate[0].$d).format("YYYY-MM-DD");
    } else if (Array.isArray(pickUpDate)) {
      // Handle the case where there are multiple dates
      formattedPickUpDate = pickUpDate.map(
        (date: any) => dayjs(date.$d).format("YYYY-MM-DD"), // "en-GB" gives DD/MM/YYYY format
      );
    }

    let tempURL =
      userRole != null && userRole === "coordinator"
        ? `${BASE_URL}/bookings/`
        : `${BASE_URL}/organizers/bookings`;

    // Log the data to see what will be sent
    const dataToSend = {
      ...bookingData,
      data: {
        ...bookingData.data,
        guests: modifiedGuests,
        pick_up_date: formattedPickUpDate,
      },
    };

    try {
      const response = await fetch(tempURL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();
      if (!response.ok) {
        response.status != 422 && response.status != 500
          ? console.log("Error:", data)
          : "";
        throw new Error(data?.detail);
      }

      bookingData.data.guests = modifiedGuests;

      let b_id = data.bid;

      setTimeout(() => {
        setOpenToast(false);
        setOpen(false);

        if (userRole != null && userRole === "coordinator") {
          navigate("../" + ROUTE.COORDINATOR_BOOKINGS + `/` + data.booking_id);
        } else {
          if (typeof formattedPickUpDate === "string") {
            navigate("../" + ROUTE.BOOKING + "/" + b_id);
          } else {
            navigate("../" + ROUTE.ALL_BOOKINGS);
          }
        }
        setBookingData(initialData);
      }, 1000);
      setToastMessage("Booking created successfully!");
      setToastType("success");
      setOpenToast(true);
    } catch (error: any) {
      setOpen(false);

      setToastMessage("Error creating booking: " + error.message);
      setToastType("error");
      setOpenToast(true);
      setTimeout(() => {
        setOpenToast(false);
      }, 2000);
      console.error("Error creating booking:", error);
    }
  };

  const handleEditFinish = async () => {
    // Step 1: Clone the bookingData to avoid mutations   
    const updatedBookingData = { ...bookingData };

    // Step 2: Process waypoints for guests
    if (deletedWaypoints && Object.keys(deletedWaypoints).length > 0) {
      for (const bookingLogId in deletedWaypoints) {
        if (deletedWaypoints.hasOwnProperty(bookingLogId)) {
          const waypointsForBooking = deletedWaypoints[bookingLogId];

          if (
            !updatedBookingData?.data?.guests ||
            !Array.isArray(updatedBookingData.data.guests)
          ) {
            console.error(
              "Bookings data is missing or invalid:",
              updatedBookingData,
            );
            continue;
          }

          const bookingIndex = updatedBookingData.data.guests.findIndex(
            (booking) => booking.booking_log_id === parseInt(bookingLogId, 10),
          );

          if (bookingIndex === -1) {
            console.warn(`Booking with log ID ${bookingLogId} not found.`);
            continue;
          }

          const booking = updatedBookingData.data.guests[bookingIndex];

          const existingWaypoints = booking.waypoints || [];

          booking.waypoints = [...existingWaypoints, ...waypointsForBooking];
        }
      }
    }

    // Step 3: Add deleted guests to the guest list
    if (deleteGuestsData && deleteGuestsData.length > 0) {
      updatedBookingData.data.guests = [
        ...updatedBookingData.data.guests,
        ...deleteGuestsData,
      ];
    }

    // Step 3/5 : format h epickup date recurrent changes
    const pickUpDate = updatedBookingData.data.pick_up_date;
    let formattedPickUpDate;

    if (Array.isArray(pickUpDate) && pickUpDate.length === 1) {
      // Handle the case where there's only one date
      formattedPickUpDate = dayjs(pickUpDate[0].$d).format("YYYY-MM-DD");
    } else if (Array.isArray(pickUpDate)) {
      // Handle the case where there are multiple dates
      formattedPickUpDate = pickUpDate.map(
        (date: any) => dayjs(date.$d).format("YYYY-MM-DD"), // "en-GB" gives DD/MM/YYYY format
      );
    }

    // Step 4: Preprocess guests based on travel mode
    let processedGuests = updatedBookingData.data.guests;

    if (updatedBookingData.data.travel_mode === "rental") {
      processedGuests = processedGuests.map((guest: any) => {
        const { destination, waypoints, ...rest } = guest;
        rest.mobile = rest.mobile.replace(/\s+/g, "");
        rest.alternate_mobile = rest.alternate_mobile.replace(/\s+/g, "");
        return rest;
      });
    } else {
      processedGuests = processedGuests.map((guest: any) => {
        return {
          ...guest,
          mobile:
            guest.mobile && typeof guest.mobile === "string"
              ? guest.mobile.replace(/\s+/g, "")
              : guest.mobile,
          alternate_mobile:
            guest.alternate_mobile && typeof guest.alternate_mobile === "string"
              ? guest.alternate_mobile.replace(/\s+/g, "")
              : guest.alternate_mobile,
        };
      });
    }
    // Step 5: Construct a clean payload
    const payload = {
      id: updatedBookingData.id,
      // type: updatedBookingData.type,
      coordinator_email: updatedBookingData.coordinator_email,
      description: updatedBookingData.description || "",
      // data: {
      bid: updatedBookingData.bid,
      cost_centre: updatedBookingData.cost_center,
      cab_type: updatedBookingData.data.cab_type,
      pick_up_date: formattedPickUpDate,
      pick_up_time: updatedBookingData.data.pick_up_time,
      travel_mode: updatedBookingData.data.travel_mode,
      po_number: updatedBookingData.data.po_number,
      city:updatedBookingData?.data?.city,
      guests: processedGuests,
      cc_recipients: updatedBookingData.data.cc_recipients,

      // },
    };   

    // Step 5: Send the payload
    const url = `${BASE_URL}/bookings/${payload.id}`;
    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      if (response.ok) {
        setBookingData(initialData);
        dispatch(clearBooking());
      }
      if (!response.ok) {
        console.error("Error Response:", responseData);
        throw new Error(
          responseData?.detail ||
            "An error occurred while updating the booking.",
        );
      }

      setToastMessage("Booking updated successfully!");
      setToastType("success");
      setOpenToast(true);

      setTimeout(() => {
        setOpen(false);

        if (userRole === "organizer" && Array.isArray(formattedPickUpDate)) {
          navigate(ROUTE.ALL_BOOKINGS);
          return;
        }
        const navigatePath =
          userRole === "coordinator"
            ? `../${ROUTE.COORDINATOR_BOOKINGS}/${responseData.booking_id}`
            : `../${ROUTE.BOOKING}/${responseData.bid}`;
        navigate(navigatePath);
      }, 1000);
    } catch (error) {
      console.error("Error updating booking:", error);
      setToastMessage(`Error updating booking: ${error.message}`);
      setToastType("error");
      setOpenToast(true);
    }
  };

  const isGuestValid = (guest: any) => {
    return (
      guest.name &&
      guest.email &&
      guest.mobile &&
      ((bookingData.data.travel_mode == "standard" &&
        guest.destination.address) ||
        bookingData.data.travel_mode == "rental") &&
      guest.source.address
    );
  };

  const allGuestsValid =
    bookingData.data.guests &&
    bookingData.data.guests.length > 0 &&
    bookingData.data.guests.every(isGuestValid);

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
        <Stepper activeStep={activeStep} sx={{ width: "70%" }}>
          {steps.map((label) => {
            const stepProps: { completed?: boolean } = {};
            const labelProps: {
              optional?: React.ReactNode;
            } = {};

            return (
              <Step key={label} {...stepProps}>
                <StepLabel {...labelProps}>
                  <div className="hidden text-base md:block font-thin">
                    {label}
                  </div>
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
                {
                  userRole === "coordinator"
                    ? navigate(`/home/bookings`)
                    : navigate(`/home/booking/${prefilledBookingData.bid}`);
                }
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
        <BookingDateTimeForm
          onClick={handleNext}
          onDataChange={handleBookingDataChange}
          onTypeChange={handleCabDataChange}
          handleCoordinatesChange={handleCoordinatesChange}
          handleDescription={handleDescription}
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
            <FormComponent
              bookingData={bookingData}
              onDataChange={handleBookingDataChange}
              selectedIndex={selectedIndex}
              onFinish={handlePlaceBooking}
              stepper={activeStep}
              setDeletedWaypoints={setDeletedWaypoints}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingDetail;