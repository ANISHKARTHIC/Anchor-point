import * as React from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  Grid,
  Typography,
  Box,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionActions,
  AccordionDetails,
  Button,
  IconButton,
  Fab,
  Popover,
} from "@mui/material";
import Toast from "../components/Toast";
import Arrow from "../assets/arrowRight.svg?react";
import { ROUTE } from "../constants/routes";
import Loading from "../components/Loading";
import {
  BOOKING_STATUS,
  GUEST_DETAILS_TABLE_HEADER,
  DRIVER_DETAILS_TABLE_HEADER,
  STRING_ERROR,
  BASE_URL,
  TRIP_STATUS,
  INVOICE_STATUS,
  BOOKING_ACTIVITY,
  HOTEL_GUEST_TABLE_HEADER,
  EDIT_STATUS,
} from "../constants/string";
import DataTable from "../components/DataTable";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import CCMail from "../components/CCMail";
import EditRequest from "../components/EditRequest";
import { driverDetailsRequest } from "../store/features/driverSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../store/store";
import { timelineEvents } from "../constants/bookingstatusTags";
import { formatDate } from "../utils/utils";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineSeparator,
} from "@mui/lab";
import TimelineOppositeContent, {
  timelineOppositeContentClasses,
} from "@mui/lab/TimelineOppositeContent";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import QuestionAnswerRoundedIcon from "@mui/icons-material/QuestionAnswerRounded";
import Chat from "../components/Chat";
import moment from "moment";
import { setPrefilledBookingData } from "../store/features/bookingSlice";

const cabGrid = [
  { key: "bid", value: "Booking ID" },
  { key: "pickup_date", value: "Date" },
  { key: "pickup_time", value: "Time" },
  { key: "cab_type", value: "Cab Type" },
  { key: "po_number", value: "PO Number" },
  { key: "cost_centre", value: "Cost Center" },
];
const hotelGrid = [
  { key: "bid", value: "Booking ID" },
  { key: "check_in", value: "Check-In" },
  { key: "check_out", value: "Check-Out" },
  { key: "city", value: "City" },
  { key: "trip_type", value: "Trip Type" },
  { key: "no_of_rooms", value: "No.of Rooms" },
  { key: "no_of_adults", value: "No.of Adults" },
  { key: "room_type", value: "Room Type" },
  { key: "pickup", value: "Airport Pickup" },
  { key: "drop", value: "Airport Drop" },
  { key: "related_booking_id", value: "Related Bid" },
  { key: "cost_centre", value: "Cost Center" },
  { key: "billing_option", value: "Billing Option" },
];

const formatDateToM2 = (date) => {
  const momentObj = moment(date, "DD-MM-YYYY", true);

  return {
    $D: momentObj.date(), // Day of the month
    $H: momentObj.hours(), // Hours (always 0 for date-only input)
    $L: "en", // Language
    $M: momentObj.month(), // Month (0-11)
    $W: momentObj.isoWeekday(), // Weekday (1-7, ISO format)
    $d: momentObj.toDate(), // Date as JavaScript Date object
    $isDayjsObject: true, // Flag for compatibility
    $m: momentObj.minutes(), // Minutes (always 0 for date-only input)
    $ms: momentObj.milliseconds(), // Milliseconds
    $s: momentObj.seconds(), // Seconds (always 0 for date-only input)
    $u: undefined, // Undefined by design
    $x: {}, // Placeholder for additional data
    $y: momentObj.year(), // Year
  };
};

const CoordinatorBookingDetails = () => {
  const navigate = useNavigate();
  const { bid } = useParams();
  const isVendor = localStorage.getItem("isVendor");

  const userName = localStorage.getItem("userName");
  const userEmail = localStorage.getItem("userEmail");
  const [bookingData, setBookingData] = useState<any>();
  const [guestDetails, setGuestDetails] = useState<any>();
  const [expanded, setExpanded] = useState<string | false>(false);
  const bookingtype = localStorage.getItem("bookingtype");
  const gridData = useRef(bookingtype === "cab" ? cabGrid : hotelGrid);
  const [alertMsg, setAlertMsg] = useState("");
  const [alertType, setAlertType] = useState("");
  const [ccEdit, setCcEdit] = useState(false);
  const [emailIds, setEmailIds] = useState([]);
  const [editReqList, setEditReqList] = useState<any>([]);
  const [isEditCreate, setIsEditCreate] = useState(false);
  const [bookingHistory, setBookingHistory] = useState<any>([]);
  const [isBookingCancelled, setIsBookingCancelled] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const { driver } = useSelector((state: any) => state.driver);

  useEffect(() => {
    fetchBookingDetails();
  }, []);

  useEffect(() => {
    if (bookingHistory.length > 0) {
      const hasCancelled = bookingHistory?.some(
        (item: any) => item.event === "VENDOR_REQUESTED",
      );
      setIsBookingCancelled(hasCancelled);
    }
  }, [bookingHistory]);

  const fetchBookingDetails = async () => {
    try {
      var tempUrl =
        bookingtype == "cab"
          ? `${BASE_URL}/coordinators/bookings/${bid}`
          : `${BASE_URL}/coordinators/hotel_bookings?bid=${bid}`;
      const bookingData = await fetch(tempUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
      });
      const tempData = await bookingData.json();
      setBookingData(tempData?.booking || tempData?.bookings[0]);
      let tempBid = tempData?.booking?.id || tempData?.bookings[0]?.id;
      bookingtype === "hotel" &&
        setEmailIds(tempData?.bookings[0]?.cc_recipients);
      fetchGuestDetails(tempBid);
    } catch (err) {
      console.error("Error while fetching booking details", err);
    }
  };

  const fetchGuestDetails = async (id) => {
    try {
      var tempUrl =
        bookingtype == "cab"
          ? `${BASE_URL}/coordinators/bookings/${id}/guests`
          : `${BASE_URL}/hotel_bookings/${id}/guests`;
      const guestData = await fetch(tempUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
      });
      const tempData = await guestData.json();
      console.log(
        "tempData",
        tempData?.guests || tempData?.hotel_booking_guests,
      );
      setGuestDetails(tempData?.guests || tempData?.hotel_booking_guests);
      bookingtype == "cab"
        ? dispatch(driverDetailsRequest({ bookingId: id }))
        : "";
      fetchBookingHistory(id);
      if (bookingtype == "hotel") {
        fetchEditRequests(id);
      }
    } catch (err) {
      console.error("Error while fetching Guest details", err);
    }
  };

  const fetchEditRequests = async (id) => {
    const response = await fetch(`${BASE_URL}/hotel_bookings/${id}/edit`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("userToken"),
      },
    });
    const data = await response.json();
    setEditReqList(data.hotel_booking_edit_requests);
  };

  const fetchBookingHistory = async (id: any) => {
    try {
      const bookingHistoryResponse = await fetch(
        `${BASE_URL}/${
          bookingtype == "hotel" ? "hotel_bookings" : "bookings"
        }/${id}/history`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("userToken"),
          },
        },
      );
      const bookingHistoryData = await bookingHistoryResponse.json();
      let dataHistory =
        bookingHistoryData?.hotel_booking_history ||
        bookingHistoryData?.booking_history;
      setBookingHistory(dataHistory);
    } catch (err) {
      console.error("Error fetching Booking History", err);
    }
  };

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
      setExpanded(newExpanded ? panel : false);
    };

  const handleCcSave = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/hotel_bookings/${bookingData?.id}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("userToken"),
          },
          body: JSON.stringify({
            cc_recipients: emailIds,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        response.status != 422 && response.status != 500
          ? console.log("Error:", data)
          : "";
        throw new Error("Error editing cc recipients");
      }
      setAlertType("success");
      setAlertMsg(data.message);
      setTimeout(() => {
        setAlertMsg("");
      }, 3000);
    } catch (error) {
      console.log(error);
      setAlertType("error");
      setAlertMsg("Error updating cc recipients");
      setTimeout(() => {
        setAlertMsg("");
      }, 3000);
    }
  };

  const renderTimeLine = () => {
    return bookingHistory?.map((history: any) => {
      switch (history.event) {
        case BOOKING_STATUS.PENDING:
          return renderTimeLineItem(
            history.created_at,
            `Your request has been initiated.`,
          );

        case BOOKING_STATUS.ORGANIZER_ASSIGNED:
          return renderTimeLineItem(
            history.created_at,
            `Organizer has been assigned.`,
          );

        case BOOKING_STATUS.VENDOR_REQUESTED:
          return renderTimeLineItem(
            history.created_at,
            `Vendor has been requested.`,
          );

        case BOOKING_STATUS.VENDOR_ACCEPTED:
          return renderTimeLineItem(
            history.created_at,
            `Vendor Accepted your request`,
          );

        case BOOKING_STATUS.VENDOR_REVOKED:
          return renderTimeLineItem(
            history.created_at,
            `Vendor Revoked your request`,
          );

        case BOOKING_STATUS.VENDOR_DECLINED:
          return renderTimeLineItem(
            history.created_at,
            `Vendor has declined the booking request`,
          );

        case BOOKING_STATUS.DRIVER_ASSIGNED:
          return renderTimeLineItem(
            history.created_at,
            `Driver has been assigned`,
          );

        case BOOKING_STATUS.DRIVER_REASSIGNED:
          return renderTimeLineItem(
            history.created_at,
            `Your Driver has been reassigned`,
          );
        case BOOKING_STATUS.CANCELLED:
          return renderTimeLineItem(
            history.created_at,
            `The booking has been cancelled. Comment : ${history.metadata.comment}`,
          );
        case BOOKING_STATUS.CONFIRMED:
          return renderTimeLineItem(
            history.created_at,
            `The booking has been Confirmed with Hotel ${history.metadata.vendor_name}. Confirmation no : ${history.metadata.confirmation_no}`,
            true,
            false,
            // history?.metadata?.document_urls?.length != 0 ? true : false,
            // history?.metadata?.document_urls?.length != 0 ? history?.metadata?.document_urls[0] : "",
          );
      }
    });
  };

  const renderCurrentStatusTimeLineItem = () => {
    const latestActivity = bookingHistory[bookingHistory.length - 1];

    switch (true) {
      case [
        BOOKING_STATUS.PENDING,
        BOOKING_STATUS.ORGANIZER_ASSIGNED,
        BOOKING_STATUS.VENDOR_DECLINED,
        BOOKING_STATUS.VENDOR_REVOKED,
      ].includes(latestActivity.event):
        return renderTimeLineItem(
          "TBD",
          `Awaiting action from Organizer`,
          false,
          true,
        );

      case [
        BOOKING_STATUS.VENDOR_REQUESTED,
        BOOKING_STATUS.VENDOR_ACCEPTED,
      ].includes(latestActivity.event):
        return renderTimeLineItem(
          "TBD",
          `Awaiting action from Vendor`,
          false,
          true,
        );
    }
  };

  const renderTimeLineItem = (
    eventTime: string,
    eventStatement: string,
    renderTime = true,
    isUpcomingAction = false,
    enableDownload = false,
    url = "",
  ) => {
    return (
      <TimelineItem>
        <TimelineOppositeContent
          color="text.secondary"
          sx={
            isUpcomingAction ? { textAlign: "center", fontStyle: "italic" } : {}
          }
        >
          {renderTime
            ? new Date(eventTime)
                .toLocaleString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                  year: "numeric",
                  month: "short",
                  day: "2-digit",
                })
                .replace(/-/g, " ")
            : eventTime}
        </TimelineOppositeContent>
        <TimelineSeparator>
          <TimelineDot
            sx={{ backgroundColor: isUpcomingAction ? "orange" : "#1976d2" }}
          />
          {!isUpcomingAction && <TimelineConnector />}
        </TimelineSeparator>
        <TimelineContent
          sx={{ fontStyle: isUpcomingAction ? "italic" : "normal" }}
        >
          {eventStatement}
          {enableDownload && (
            <a href={url} download target="_blank">
              <IconButton color="info">
                <DownloadRoundedIcon />
              </IconButton>
            </a>
          )}
        </TimelineContent>
      </TimelineItem>
    );
  };

  const handleEditBooking = () => {
    const transformedGuests = guestDetails.map((guest: any) => {
      return {
        ...guest,
        date_of_duty: guest.date_of_duty
          ? moment(guest.date_of_duty, "DD-MM-YYYY").format("YYYY-MM-DD")
          : "",
        start_time: guest.start_time
          ? moment(guest.start_time, "HH:mm A").format("HH:mm")
          : "",
      };
    });
    const userEmail = localStorage.getItem("userEmail");

    const editedBookingData = {
      type: bookingtype,
      id: bookingData.id,
      bid: bookingData.bid,
      data: {
        cab_type: bookingData?.cab_type,
        pick_up_time: bookingData?.pickup_time,
        pick_up_date: [formatDateToM2(bookingData?.pickup_date)],
        guests: transformedGuests,
        travel_mode: bookingData.travel_mode,
        po_number: bookingData?.po_number,
      },
      travel_mode: bookingData.travel_mode,
      coordinator_email: userEmail,
      cost_center: bookingData?.cost_centre,
      description: bookingData?.description,
    };

    dispatch(setPrefilledBookingData(editedBookingData));

    navigate("/home/new_booking");
  };
  return (
    <div className="flex h-[calc(100vh-64px)] justify-around w-5/6 md:w-full bg-appBg">
      <div className="mb-5 items-end justify-end">
        {alertMsg && <Toast message={alertMsg} toastType={alertType} />}
      </div>
      <div className="flex h-full mx-6 my-3 bg-white rounded-xl w-full">
        {bookingData ? (
          <div className="flex flex-col mx-7 my-5 w-full">
            {bookingData?.travel_mode == "rental" ? (
              <div className="flex justify-center">
                <span className="font-semibold text-lg">
                  Rental Cab Booking
                </span>
              </div>
            ) : (
              ""
            )}
            <div className="flex flex-row justify-between">
              <div className="flex items-center">
                <Arrow
                  className="[&>path]:stroke-black rotate-180 mr-3"
                  onClick={() => {
                    navigate(-1);
                  }}
                />
                <span className="font-semibold text-base">{`Go Back`}</span>

                {bookingtype == "hotel" && (
                  <Button onClick={() => setIsEditCreate(true)}>
                    <EditIcon />
                  </Button>
                )}
                <EditRequest
                  isEditCreate={isEditCreate}
                  setIsEditCreate={setIsEditCreate}
                  booking_id={bookingData.id}
                  setAlertMsg={setAlertMsg}
                  setAlertType={setAlertType}
                  fetchEditRequests={fetchEditRequests}
                  //isBookingCancelled={isBookingCancelled}
                  create={true}
                />
              </div>

              {isVendor == "false" && !isBookingCancelled && bookingtype == "cab" && (bookingData.status == BOOKING_STATUS.PENDING || bookingData.status == BOOKING_STATUS.ORGANIZER_ASSIGNED) && (
                // && !(bookingData.travel_mode == "rental")
                <div>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={handleEditBooking}
                  >
                    Edit Booking
                  </Button>
                </div>
              )}
              {isBookingCancelled && (
                <div>
                  <span className="text-lg font-bold">
                    This booking has been cancelled
                  </span>
                </div>
              )}
            </div>
            <div className="mt-3">
              <Box sx={{ padding: 2 }}>
                <Grid container spacing={2}>
                  {gridData.current.map((item, index) =>
                    ((item.key == "pickup" || item.key == "drop") &&
                      bookingData[item.key]["flight"]) ||
                    (item.key != "pickup" &&
                      item.key != "drop" &&
                      bookingData[item.key]) ? (
                      <Grid item xs={12} sm={4} md={2} key={index}>
                        <Box
                          onClick={() => {
                            //item.key==="related_booking_id"&&navigate(`../${ROUTE.COORDINATOR_BOOKINGS}/${bookingData.bid}`);
                          }}
                          sx={{
                            textAlign: "center",
                            border: "1px solid #e0e0e0",
                            padding: 1,
                            borderRadius: 2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            "&:hover": {
                              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)", // Hover effect
                            },
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            {item.value}
                          </Typography>
                          <Typography
                            noWrap={false}
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              width: "100%",
                            }}
                            variant="body1"
                            fontWeight="bold"
                          >
                            {item.key === "cost_centre"
                              ? bookingData[item.key]["code"]
                              : item.key == "pickup" || item.key == "drop"
                              ? bookingData[item.key]["flight"]
                              : bookingData[item.key]}
                          </Typography>
                        </Box>
                      </Grid>
                    ) : null,
                  )}
                </Grid>
              </Box>
            </div>
            {bookingtype != "cab" && (
              <div className="mt-3">
                <div className="flex flex-col mb-5 max-h-52 w-1/4">
                  <div>
                    <span className="font-normal text-lg">
                      {"CC Recipients"}
                    </span>
                    {/* <Button
                      onClick={() => {
                        setCcEdit(!ccEdit);
                        ccEdit ? handleCcSave() : "";
                      }}
                    >
                      {!ccEdit ? <EditIcon /> : "Save"}
                    </Button> */}
                  </div>
                  <div className="flex flex-col overflow-y-scroll ">
                    {!ccEdit ? (
                      emailIds?.map((item: any) => (
                        <span className="text-sm font-normal">{item}</span>
                      ))
                    ) : (
                      <CCMail
                        emailIds={emailIds}
                        setEmailIds={setEmailIds}
                        disabled={false}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="mt-3">
              <Accordion
                elevation={0}
                disableGutters={true}
                square
                sx={{
                  boxShadow: "none",
                }}
                expanded={expanded === "guest-details"}
                onChange={handleChange("guest-details")}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    flexDirection: "row-reverse",
                    borderBottom:
                      expanded === "guest-details" ? "1px solid #0000001f" : 0,
                  }}
                >
                  <Typography> {"People Details"} </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <DataTable
                    containerStyles={{
                      width: "100%",
                      padding: "0 8px 0 8px",
                      td: { border: 0 },
                    }}
                    headerStyles={{
                      "th:first-child": {
                        borderTopLeftRadius: 6,
                        borderBottomLeftRadius: 6,
                      },
                      "th:last-child": {
                        borderTopRightRadius: 6,
                        borderBottomRightRadius: 6,
                      },
                      backgroundColor: "#F8FAFC",
                    }}
                    headers={
                      bookingtype == "cab"
                        ? GUEST_DETAILS_TABLE_HEADER
                        : HOTEL_GUEST_TABLE_HEADER
                    }
                    tableData={guestDetails}
                    coordinator={true}
                    isPaginated={true}
                  />
                </AccordionDetails>
              </Accordion>
              {/* Booking Timeline */}
              <div>
                <Accordion
                  elevation={0}
                  disableGutters={true}
                  sx={{
                    boxShadow: "none",
                  }}
                  expanded={expanded === "booking-timeline"}
                  onChange={handleChange("booking-timeline")}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      flexDirection: "row-reverse",
                      borderBottom:
                        expanded === "booking-timeline"
                          ? "1px solid #0000001f"
                          : 0,
                    }}
                  >
                    <Typography> {"Booking Timeline"} </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Timeline
                      sx={{
                        [`& .${timelineOppositeContentClasses.root}`]: {
                          flex: 0.25,
                        },
                      }}
                    >
                      {renderTimeLine()}
                      {bookingHistory?.length
                        ? renderCurrentStatusTimeLineItem()
                        : null}
                    </Timeline>
                  </AccordionDetails>
                </Accordion>
              </div>
              {/* Edit Request */}
            </div>
            {editReqList?.length != 0 && (
              <div className="mt-3">
                <Accordion
                  elevation={0}
                  disableGutters={true}
                  square
                  sx={{
                    boxShadow: "none",
                  }}
                  expanded={expanded === "edit-requests"}
                  onChange={handleChange("edit-requests")}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      flexDirection: "row-reverse",
                      borderBottom:
                        expanded === "edit-requests"
                          ? "1px solid #0000001f"
                          : 0,
                    }}
                  >
                    <Typography> {"Edit requests"} </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <EditRequest
                      create={false}
                      reqList={editReqList}
                      booking_id={bookingData.id}
                      setAlertMsg={setAlertMsg}
                      setAlertType={setAlertType}
                      fetchEditRequests={fetchEditRequests}
                      //isBookingCancelled={isBookingCancelled}
                    />
                  </AccordionDetails>
                </Accordion>
              </div>
            )}
            {/* driver Accordion */}
            <div>
              {!(bookingData?.vendor_id === null) &&
              driver &&
              Object.keys(driver).length ? (
                <Accordion
                  elevation={0}
                  disableGutters={true}
                  sx={{
                    boxShadow: "none",
                  }}
                  expanded={expanded === "driver-details"}
                  onChange={handleChange("driver-details")}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      flexDirection: "row-reverse",
                      borderBottom:
                        expanded === "driver-details"
                          ? "1px solid #0000001f"
                          : 0,
                    }}
                  >
                    <Typography> {"Driver Details"} </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <DataTable
                      containerStyles={{
                        width: "100%",
                        padding: "0 8px 0 8px",
                        td: { border: 0 },
                      }}
                      headerStyles={{
                        "th:first-child": {
                          borderTopLeftRadius: 6,
                          borderBottomLeftRadius: 6,
                        },
                        "th:last-child": {
                          borderTopRightRadius: 6,
                          borderBottomRightRadius: 6,
                        },
                        backgroundColor: "#F8FAFC",
                      }}
                      headers={DRIVER_DETAILS_TABLE_HEADER}
                      tableData={[driver]}
                      isPaginated={false}
                    />
                  </AccordionDetails>
                </Accordion>
              ) : (
                ""
              )}
            </div>
            <div>
              {bookingtype == "hotel" && (
                <div className={`px-2 pb-5 absolute bottom-2`}>
                  <Fab
                    size="large"
                    color="secondary"
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
                      setAnchorEl(event.currentTarget)
                    }
                  >
                    <QuestionAnswerRoundedIcon />
                  </Fab>
                  <Popover
                    id="popover"
                    open={Boolean(anchorEl)}
                    anchorEl={anchorEl}
                    onClose={() => setAnchorEl(null)}
                    anchorOrigin={{
                      vertical: "top",
                      horizontal: "right",
                    }}
                    transformOrigin={{
                      vertical: "bottom",
                      horizontal: "left",
                    }}
                  >
                    <div
                      style={{
                        width: "400px",
                        height: "600px",
                        overflowY: "auto",
                      }}
                      className="m-3"
                    >
                      <Chat
                        bookingId={bookingData.id}
                        bookingType={bookingtype}
                        bookingData={bookingData}
                        currentUser={{
                          role: "coordinator",
                          email: userEmail,
                          name: userName,
                        }}
                      />
                    </div>
                  </Popover>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Loading times={5} />
        )}
      </div>
    </div>
  );
};

export default CoordinatorBookingDetails;
