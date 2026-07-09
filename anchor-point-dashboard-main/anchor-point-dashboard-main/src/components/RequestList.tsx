import {
  STRING_BOOKINGS_LIST,
  STRING_ERROR,
  BOOKING_STATUS,
  BASE_URL,
  PRIORITY_STATUS,
  TRIP_STATUS,
} from "../constants/string";
import { useState, useEffect, useMemo } from "react";
import Tooltip from "@mui/material/Tooltip";
import LoadingButton from "@mui/lab/LoadingButton";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import IconButton from "@mui/material/IconButton";
import { formatDate, is24hrs } from "../utils/utils";
import { useNavigate } from "react-router-dom";
import { ROUTE } from "../constants/routes";
import { isToday } from "../utils/utils";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { Badge } from "@mui/material";

function RequestList({
  booking,
  requestType,
  navigatedFrom,
  updatedBooking,
  level,
  onSelect,
  statusApi,
  unreadCountData,
}: any) {
  const [assigned, setAssigned] = useState();
  const [step, setStep] = useState(0);
  const [tripHistory, setTripHistory] = useState<any>([]);
  const navigate = useNavigate();
  const [isPriorityDate, isSixHrs] = isToday(
    booking.pickup_date,
    booking.pickup_time,
  );
  const is24hr = is24hrs(booking.check_in)
  let isPriorityStatus = false;
  let text = "";
  const bookingtype = localStorage.getItem("bookingtype");
  const userRole = localStorage.getItem("role")
  if (PRIORITY_STATUS[booking.status]) {
    isPriorityStatus = true;
    text = `${STRING_BOOKINGS_LIST.TEXT_TOOLTIP} ${
      PRIORITY_STATUS[booking.status]
    }`;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tripStatus = await fetch(
          `${BASE_URL}/drivers/trips/history?booking_id=${booking.id}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: "Bearer " + localStorage.getItem("userToken"),
            },
          },
        );
        const tripStatusData = await tripStatus.json();
        setTripHistory(tripStatusData?.trip_history);
      } catch (error) {
        console.log(error);
      }
    };
    (navigatedFrom == ROUTE.PASTBOOKINGS && bookingtype == "cab") ? fetchData() : "";
  }, [booking]);

  const assignTask = async (request: any) => {
    try {
      const response = await fetch(`${BASE_URL}/${bookingtype == "cab" ? "organizers/bookings" : "hotel_bookings"}/status`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
        body: JSON.stringify({
          status: BOOKING_STATUS.ORGANIZER_ASSIGNED,
          booking_id: booking.id,
          metadata: {
            organizer_id: localStorage.getItem("userID"),
            organizer_name: localStorage.getItem("userName"),
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        (response.status != 422 && response.status != 500) ? console.log("Error:",data) : "";
        throw new Error("Error assigning task");
      }
      bookingtype == "cab" ? setAssigned(data.booking_id) : setAssigned(data.hotel_booking_id);
    } catch (error) {
      console.log("Error:", error);
    }
  };

  const handleNavigateTo = (metadata: any) => {
    // TODO improve routing
    switch (navigatedFrom) {
      case ROUTE.HOME:
        navigate(`../${ROUTE.BOOKING}/${booking.bid}`, {
          state: { navigatedFrom: navigatedFrom },
        });
        break;
      case ROUTE.TASKS:
        return(userRole!="coordinator"?
          navigate(`../${ROUTE.BOOKING}/${booking.bid}`, {
            state: { navigatedFrom: navigatedFrom },
          }): navigate(`../${ROUTE.COORDINATOR_BOOKINGS}/${booking.bid}`))
        break;
      case ROUTE.PASTBOOKINGS:
        navigate(`../${ROUTE.BOOKING}/${booking.bid}`, {
          state: { navigatedFrom: navigatedFrom },
        });
        break;
      case ROUTE.ALL_BOOKINGS:
        onSelect(booking)
        window.scroll({
          top: document.body.offsetHeight,
          left: 0, 
          behavior: 'smooth',
        });
        break;
    }
  };

  const stage = useMemo(() => {
    if (navigatedFrom == ROUTE.PASTBOOKINGS) {
      const status = tripHistory?.slice(-1)[0]?.event;
      switch (status) {
        case TRIP_STATUS.COMPLETED:
          return 3;
        case TRIP_STATUS.PICKED:
        case TRIP_STATUS.DROPPED:
        case TRIP_STATUS.NOSHOW:
          return 2;
        case TRIP_STATUS.STARTED:
          return 1;
        default:
          return 0;
      }
    } else {
      switch (booking.status) {
        case BOOKING_STATUS.CONFIRMED:
        case BOOKING_STATUS.DRIVER_ASSIGNED:
        case BOOKING_STATUS.DRIVER_REASSIGNED:
        case BOOKING_STATUS.INVOICE_CREATED:
        case BOOKING_STATUS.INVOICE_APPROVED:
        case BOOKING_STATUS.INVOICE_REJECTED:
        case BOOKING_STATUS.INVOICE_CREATED_BY_ORGANIZER:
        case BOOKING_STATUS.INVOICE_CREATED_BY_SUPER_ORGANIZER:
          return 3;
        case BOOKING_STATUS.VENDOR_ACCEPTED:
          return 2;
        case BOOKING_STATUS.VENDOR_REQUESTED:
          return 1;
        default:
          return 0;
      }
    }
  }, [booking, tripHistory]);

  useEffect(() => {
    setStep(stage);
  }, [stage]);

  useEffect(() => {
    if (updatedBooking === booking.id) {
      setStep(level);
    }
  }, [updatedBooking]);

  const isVendor = localStorage.getItem("isVendor");

  return (
    <>
      <div
        className="flex justify-between border bg-white p-3 rounded-md mb-2 md:p-3"
        onClick={
          !(booking.status == BOOKING_STATUS.VENDOR_REASSIGNED) && !(navigatedFrom == ROUTE.HOME)
            ? handleNavigateTo
            : () => {}
        }
        style={{
          backgroundColor: booking?.travel_mode == "rental" ? "#faf6ac" : "white",
          transition: "background-color 0.3s ease",
          position:'relative'
        }}
        onMouseEnter={(e) => {
          !(
            booking.status == BOOKING_STATUS.PENDING ||
            booking.status == BOOKING_STATUS.VENDOR_REASSIGNED
          )
            ? (e.currentTarget.style.backgroundColor = "#c9dff5")
            : ""
          e.currentTarget.style.cursor = "pointer"
        }
        }
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = booking?.travel_mode == "rental" ? "#faf6ac" : "white")}
      >
        <div className="flex flex-row items-center">
          {navigatedFrom == ROUTE.ALL_BOOKINGS ? (
            <div className="text-sm font-semibold md:flex items-center">
              <p className="hidden md:block">
               <span className="text-lg">{booking.bid}</span>{" - "}
               {bookingtype} {" request - "} {booking.coordinator?.name}{" -"}
              </p>
              <p>&nbsp;{formatDate(booking.pickup_date || booking.check_in)}</p>
            </div>
          ) :
          !(booking.pendingInvoice) ? (
            <div className="text-sm font-semibold md:flex md:mt-1.5  ">
              <p className="hidden md:block mb-2">
                {booking.bid}{" - "}
                {STRING_BOOKINGS_LIST.REQUEST} {booking.coordinator?.name}{" "}
                {STRING_BOOKINGS_LIST.FOR}
              </p>
              <p className="mb-2 md:mb-0 md:ml-1">
                {bookingtype} {STRING_BOOKINGS_LIST.ON}
              </p>
              <p className="md:ml-1">{formatDate(booking.pickup_date || booking.check_in)}</p>
            </div>
          ) : (
            <div className="text-sm font-semibold md:flex md:mt-1.5  ">
              <p className="hidden md:block mb-2">
                {booking.bid}{" - "}
                {booking.vendor?.name}
                {STRING_BOOKINGS_LIST.NEW_INVOICE}
              </p>
              <p className="mb-2 md:mb-0 md:ml-1">
                {bookingtype} {STRING_BOOKINGS_LIST.ON}
              </p>
              <p className="md:ml-1">{formatDate(booking.pickup_date || booking.check_in)}</p>
            </div>
          )}
          {(isPriorityDate || is24hr) && isPriorityStatus ? (
            <Tooltip placement="right-end" title={text}>
              {isSixHrs ? (
                <WarningAmberRoundedIcon className="md:ml-2" color="error" />
              ) : (
                <WarningAmberRoundedIcon className="md:ml-2" color="warning" />
              )}
            </Tooltip>
          ) : (
            ""
          )}
        </div>
        <div className={`flex items-center`}>
          {/* {requestType === "myRequest" && (
            <div
              className={`flex justify-between ${
                isVendor === "true" ? "w-12" : "w-16"
              }`}
            >
              {/* TODO remove duplication of Of this stepper component by moving into a separate component 
              {!(booking.status == BOOKING_STATUS.VENDOR_REASSIGNED) && (
                <Tooltip
                  title={`${
                    navigatedFrom == ROUTE.PASTBOOKINGS
                      ? "Trip Started"
                      : "Vendor Requested"
                  }`}
                  placement="top"
                  className={`${
                    navigatedFrom == ROUTE.PASTBOOKINGS
                      ? "block"
                      : isVendor === "true"
                      ? "hidden"
                      : "block"
                  }`}
                >
                  <div
                    className={`w-3 h-3 ${
                      step === 0 ? "bg-[#ababab]" : "bg-orange-500"
                    }  rounded-2xl`}
                  ></div>
                </Tooltip>
              )}

              {booking.status == BOOKING_STATUS.VENDOR_REASSIGNED &&
                isVendor === "true" && (
                  <Tooltip
                    title={"Booking Reassigned"}
                    placement="top"
                    className={`${
                      navigatedFrom == ROUTE.PASTBOOKINGS ? "block" : "block"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 bg-orange-500
                      rounded-2xl`}
                    ></div>
                  </Tooltip>
                )}

              {!(booking.status == BOOKING_STATUS.VENDOR_REASSIGNED) && (
                <Tooltip
                  title={`${
                    navigatedFrom == ROUTE.PASTBOOKINGS
                      ? "Trip in Progress"
                      : isVendor === "true"
                      ? "Request Accepted"
                      : "Vendor Accepted"
                  }`}
                  placement="top"
                >
                  <div
                    className={`w-3 h-3 ${
                      step === 0 || step === 1
                        ? "bg-[#ababab]"
                        : "bg-yellow-300"
                    }  rounded-2xl`}
                  ></div>
                </Tooltip>
              )}

              {!(booking.status == BOOKING_STATUS.VENDOR_REASSIGNED) && (
                <Tooltip
                  title={
                    navigatedFrom == ROUTE.PASTBOOKINGS
                      ? "Trip Completed"
                      : "Driver Assigned"
                  }
                  placement="top"
                >
                  <div
                    className={`w-3 h-3 ${
                      step === 3 ? "bg-green-500" : "bg-[#ababab]"
                    }  rounded-2xl`}
                  ></div>
                </Tooltip>
              )}
            </div>
          )} */}
          {(navigatedFrom != ROUTE.HOME) && <span className="italic text-sky-800">{
              isVendor == "true" 
              ? booking?.status == "invoice_created_by_organizer" || booking?.status == "invoice_created_by_super_organizer" 
                ? statusApi["invoice_approved"] 
                : booking?.status == "vendor_assign_revoked" 
                  ? statusApi["vendor_reassigned"] 
                  : booking?.status 
                    ? statusApi[booking.status] 
                    : ""
              : booking?.status 
                ? statusApi[booking.status] 
                : ""}</span>}
          {requestType === "newRequest" && (
            <LoadingButton
              variant="contained"
              className=""
              size="small"
              sx={{
                backgroundColor: `${
                  assigned === booking.id ? "#3cb043" : "#4EC7E6"
                }`,
                borderRadius: "6px",
              }}
              onClick={() => assignTask(booking.id)}
              disableElevation
            >
              <span className="text-xs">
                {assigned === booking.id
                  ? "Assigned"
                  : STRING_BOOKINGS_LIST.LABEL_ASSIGN_ME}
              </span>
            </LoadingButton>
          )}
          {(!(booking.status == BOOKING_STATUS.VENDOR_REASSIGNED) && navigatedFrom != ROUTE.ALL_BOOKINGS) && (
            <div className="md:mx-2">
              <IconButton aria-label="view details" onClick={handleNavigateTo}>
                <ChevronRightIcon className="text-secondary" />
              </IconButton>
            </div>
          )}
        </div>
        { unreadCountData != null && 
           <Badge 
           badgeContent={unreadCountData[booking.id]}
           color="primary"
           sx={{
             position: "absolute",
             top: "10px",
             right: "20px",
           }}/>
        }
      </div>
    </>
  );
}

export default RequestList;
