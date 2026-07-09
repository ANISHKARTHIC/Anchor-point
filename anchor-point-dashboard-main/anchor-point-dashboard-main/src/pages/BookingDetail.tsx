import * as React from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import Arrow from "../assets/arrowRight.svg?react";
import SyncIcon from "@mui/icons-material/Sync";
import { ROUTE } from "../constants/routes";
import {
  BOOKING_STATUS,
  GUEST_DETAILS_TABLE_HEADER,
  DRIVER_DETAILS_TABLE_HEADER,
  STRING_ERROR,
  BASE_URL,
  TRIP_STATUS,
  INVOICE_STATUS,
  HOTEL_BOOKING_ACTIVITY,
  CAB_BOOKING_ACTIVITY,
  HOTEL_GUEST_TABLE_HEADER,
  EDIT_STATUS,
  HOTEL_STRING,
  CAB_STRING,
} from "../constants/string";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../store/store";
import { guestsInBookingRequest } from "../store/features/guestSlice";
import { driverDetailsRequest } from "../store/features/driverSlice";
import { useEffect, useState } from "react";
import DataTable from "../components/DataTable";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
  MenuItem,
  FormControl,
  FormHelperText,
  Button,
  IconButton,
  InputLabel,
  Fab,
  Popover,
} from "@mui/material";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from "@mui/lab";
import TimelineOppositeContent, {
  timelineOppositeContentClasses,
} from "@mui/lab/TimelineOppositeContent";
import QuestionAnswerRoundedIcon from "@mui/icons-material/QuestionAnswerRounded";

import Select from "@mui/material/Select";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import { TextField } from "@mui/material";
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog";
import { formatDate } from "../utils/utils";
import Invoice from "../components/Invoice";
import MapImg from "../components/MapImg";
import ManualTripEnd from "../components/ManualTripEnd";
import Loading from "../components/Loading";
import Toast from "../components/Toast";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ConfirmBooking from "../components/ConfirmBooking";
import CopyHtml from "../components/CopyHtml";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import EditRequest from "../components/EditRequest";
import CCMail from "../components/CCMail";
import Chat from "../components/Chat";
import HotelInvoice from "../components/HotelInvoice";
import HotelVendorInvoice from "../components/HotelVendorInvoice";
import {
  DatePicker,
  DesktopTimePicker,
  LocalizationProvider,
} from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { renderTimeViewClock } from "@mui/x-date-pickers/timeViewRenderers";
import { setPrefilledBookingData } from "../store/features/bookingSlice";
import moment from "moment";
import {clearCreditNoteInvoice } from "../store/features/creditNoteSlice"
import { Box } from "@mui/system";

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

function BookingDetail() {
  const isVendor = localStorage.getItem("isVendor");
  const userID = localStorage.getItem("userID");
  const isSuperOrganizer = localStorage.getItem("role");
  const userName = localStorage.getItem("userName");
  const userEmail = localStorage.getItem("userEmail");
  const [selectedCityId, setSelectedCityId] = useState("");
  const dispatch = useDispatch<AppDispatch>();
  const [state, setState] = useState<any>();
  const { bid } = useParams();
  const loc = useLocation();
  const { guests } = useSelector((state: any) => state.guests);
  const [bookingData, setBookingData] = useState(state);

  const { driver } = useSelector((state: any) => state.driver);
  const creditNote = useSelector((state: any) => state.creditNote.creditNoteInvoice);

  const [expanded, setExpanded] = useState<string | false>(false);
  const [selectedPlan, setSelectedPlan] = useState<"" | number>("");
  const [selectedVendor, setSelectedVendor] = useState<"" | number>("");
  const [selectedVehicle, setSelectedVehicle] = useState<"" | number>("");
  const [goToVendorSelection, setGoToVendorSelection] =
    useState<boolean>(false);
  const [isRevokeVendor, setRevokeVendor] = useState<boolean>(false);
  const [bookingHistory, setBookingHistory] = useState<any>([]);
  const [vendors, setVendors] = useState<any>([]);
  const [disableAssignButton, setDisableAssignButton] =
    useState<boolean>(false);

  const [selectedHotelVendor, setSelectedHotelVendor] = useState<any>();
  const [edit, setEdit] = useState(false);
  const [disable, setDisable] = useState(false);
  const [open, setOpen] = useState(false);
  const [comments, setComments] = React.useState("");
  const [isStay, setIsStay] = useState(false);

  const [disableVendorButton, setDisableVendorButton] = useState(false);
  const [status, setStatus] = useState(state?.status);
  const [tripHistory, setTripHistory] = useState<any>([]);
  const [invoiceHistory, setInvoiceHistory] = useState<any>([]);
  const [editHistory, setEditHistory] = useState<any>([]);
  const [invoice, setInvoice] = useState<any>([]);
  const [optimalRoute, setOptimalRoute] = useState({
    optimal_route: [],
    vendor: {},
  });
  const [planDetail, setPlanDetail] = useState<any>();
  const [plan, setPlan] = useState<any>();
  const [cityOptions, setCityOptions] = useState<any>([]);

  const [vendorPackage, setvendorPackage] = useState<any>();
  const [isManual, setIsManual] = useState(false);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [isBookingCancelled, setIsBookingCancelled] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [alertType, setAlertType] = useState("");
  const [costEdit, setCostEdit] = useState(false);
  const [ccEdit, setCcEdit] = useState(false);
  const [emailIds, setEmailIds] = useState([]);
  const [selectedCostcenter, setSelectedCostcenter] = useState(
    state?.cost_centre?.code,
  );
  const [costCenter, setCostCenter] = useState([]);
  const [activity, setActivity] = useState([]);
  const [addedVendors, setAddedHotels] = useState<any>([]);
  const [editReqList, setEditReqList] = useState<any>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditCreate, setIsEditCreate] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [hotelInvoiceData, setHotelInvoiceData] = useState<any>();
  const bookingtype = localStorage.getItem("bookingtype");
  const [models, setModels] = useState([]);
  const [selectedCab, setSelectedCab] = useState<any>();
  const [selectedDate, setSelectedDate] = useState<any>();
  const [selectedTime, setSelectedTime] = useState<any>();
  const [trip, setTrip] = useState<any>();
  const [selectedGarage, setSelectedGarage] = useState<any>();
  const [assignedVendor, setAssignedVendor] = useState<any>([]);
  const [tripStarted,setTripStarted] = useState<boolean>(true)

  dayjs.extend(customParseFormat);

  useEffect(() => {
    try {
      const fetchstate = async () => {
        const bookingdetailResp = await fetch(
          isVendor == "false"
            ? bookingtype == "hotel"
              ? `${BASE_URL}/hotel_bookings/?bid=${bid}`
              : `${BASE_URL}/all_bookings?bid=${bid}`
            : bookingtype == "hotel"
              ? `${BASE_URL}/hotel_bookings/?bid=${bid}`
              : `${BASE_URL}/vendors/${userID}/bookings?bid=${bid}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: "Bearer " + localStorage.getItem("userToken"),
            },
          },
        );
        const bookdata = await bookingdetailResp.json();
        setState({ ...loc.state, ...bookdata.bookings[0] });
        setStatus(bookdata.bookings[0].status);
      };
      fetchstate();
    } catch (error) {
      console.log(error);
    }
  }, [userID]);

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
      setExpanded(newExpanded ? panel : false);
    };

  const handleBack = () => {
    setIsStay(false);
    setGoToVendorSelection(false);
  };

  async function handleVendorAssignList(){
    let response = await fetch(`${BASE_URL}/bookings/${state?.id}/vendors`,{
      method:'GET',
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("userToken"),
      },
    })

    let data = await response.json()

    if(response.ok){
      setAssignedVendor(data.vendor_bookings)
    }
  }

  useEffect(()=>{
    if(state?.id){
      handleVendorAssignList()
    }
  },[state]) 


  const handleAssignVendor = () => {
    setIsStay(true);
    setGoToVendorSelection(true);
    // fetchOptimalRoute(vendors[0]?.coordinates, vendors[0]);
  };

  const handleCopyToClipboard = () => {
    var urlField = document.getElementById("tablecopy");
    const spreadSheetRow = new Blob([urlField?.outerHTML as BlobPart], {
      type: "text/html",
    });
    navigator.clipboard.write([
      new ClipboardItem({ "text/html": spreadSheetRow }),
    ]);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  const renderButtonState = (history: any) => {
    const latestActivity = history[history.length - 1];
    const buttonState =
      latestActivity?.event !== BOOKING_STATUS.PENDING &&
      latestActivity?.event !== BOOKING_STATUS.ORGANIZER_ASSIGNED &&
      latestActivity?.event !== BOOKING_STATUS.VENDOR_DECLINED &&
      latestActivity?.event !== BOOKING_STATUS.VENDOR_REQUESTED;
    setDisableVendorButton(buttonState);
  };

  const renderMenuItem = (
    vendorInfo: Array<any>,
    menuItemValueKey: string,
    menuItemLabelKey: string,
  ) => {
    return vendorInfo?.map((vendor: any, index: number) => {
      return (
        <MenuItem key={index} value={vendor[menuItemValueKey]}>
          {vendor[menuItemLabelKey]}
        </MenuItem>
      );
    });
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

  const renderEditTimeLine = () => {
    return editHistory.map((history: any) => {
      switch (history.status) {
        case EDIT_STATUS.EDIT_REQUESTED:
          return renderTimeLineItem(
            history.created_at,
            `Req Id:${history.edit_request?.id} New change request created`,
          );
        case EDIT_STATUS.EDIT_ACKNOWLEDGED:
          return renderTimeLineItem(
            history.created_at,
            `Req Id:${history.edit_request?.id} The change request has been acknowledged by organizer ${history.metadata?.organizer_name}.`,
          );
        case EDIT_STATUS.EDIT_CONFIRMED:
          return renderTimeLineItem(
            history.created_at,
            `Req Id:${history.edit_request
              ?.id} The change request has been confirmed by organizer ${history
                .metadata?.organizer_name}. ${history.metadata?.confirm_description
                  ? "Comment: " + history.metadata?.confirm_description
                  : ""
            }`,
          );
      }
    });
  };

  const renderCabActivityLog = () => {
    return activity.map((activity: any) => {
      switch (activity.event) {
        case CAB_BOOKING_ACTIVITY.COST_CENTRE_CHANGE:
        case CAB_BOOKING_ACTIVITY.CAB_TYPE_CHANGE:
        case CAB_BOOKING_ACTIVITY.DESCRIPTION_CHANGE:
        case CAB_BOOKING_ACTIVITY.PO_NUMBER_CHANGE:
        case CAB_BOOKING_ACTIVITY.PICKUP_DATE_CHANGE:
        case CAB_BOOKING_ACTIVITY.PICKUP_TIME_CHANGE:
          let fieldname = Object.keys(activity.metadata)
            .filter((item: string) => item.startsWith("cur_"))[0]
            ?.substring(4);

          return renderTimeLineItem(
            activity.created_at,
            `${CAB_STRING[fieldname]} has been changed by ${activity.metadata?.organizer_name ||
              activity.metadata?.coordinator_name
              ? activity.metadata?.organizer_name ||
              activity.metadata?.coordinator_name
              : ""
            } from ${activity.metadata ? activity.metadata["prev_" + fieldname] : ""
            } to ${activity.metadata ? activity.metadata["cur_" + fieldname] : ""
            }`,
          );
        case CAB_BOOKING_ACTIVITY.GUEST_ADD_CHANGE:
          return renderTimeLineItem(
            activity.created_at,
            `New guest ${activity.metadata?.guest_name ? activity.metadata?.guest_name : ""
            } has been added by ${activity.metadata?.organizer_name ||
              activity.metadata?.coordinator_name
              ? activity.metadata?.organizer_name ||
              activity.metadata?.coordinator_name
              : ""
            }`,
          );
        case CAB_BOOKING_ACTIVITY.GUEST_DELETE_CHANGE:
          return renderTimeLineItem(
            activity.created_at,
            `Guest ${activity.metadata?.guest_name ? activity.metadata?.guest_name : ""
            } has been removed by ${activity.metadata?.organizer_name ||
              activity.metadata?.coordinator_name
              ? activity.metadata?.organizer_name ||
              activity.metadata?.coordinator_name
              : ""
            }`,
          );
        case CAB_BOOKING_ACTIVITY.GUEST_EDIT_CHANGE:
          let field = Object.keys(activity.metadata)
            .filter((item: string) => item.startsWith("cur_"))[0]
            ?.substring(4);
          console.log("field",field)

          return field == "is_primary"
            ? ""
            : renderTimeLineItem(
              activity.created_at,
              `Guest details of ${activity.metadata?.guest_name
                ? activity.metadata?.guest_name
                : ""
              } has been edited by ${activity.metadata?.organizer_name ||
                activity.metadata?.coordinator_name
                ? activity.metadata?.organizer_name ||
                activity.metadata?.coordinator_name
                : ""
              } as ${CAB_STRING[field]} -> ${activity.metadata["prev_" + field]
              } to ${activity.metadata["cur_" + field]} `,
            );
        case CAB_BOOKING_ACTIVITY.GUEST_PICKUP_CHANGE:
        case CAB_BOOKING_ACTIVITY.GUEST_DROP_CHANGE:
          let fieldstr = Object.keys(activity.metadata)
            .filter((item: string) => item.startsWith("cur_"))[0]
            ?.substring(4);

          return renderTimeLineItem(
            activity.created_at,
            `${CAB_STRING[fieldstr]} details of ${activity.metadata?.guest_name ? activity.metadata?.guest_name : ""
            } has been changed by ${activity.metadata?.organizer_name ||
              activity.metadata?.coordinator_name
              ? activity.metadata?.organizer_name ||
              activity.metadata?.coordinator_name
              : ""
            } from ${activity.metadata
              ? `Door no: ${activity.metadata["prev_" + fieldstr]?.doorno
                ? activity.metadata["prev_" + fieldstr]?.doorno
                : ""
              } ` +
              ` Address: ${activity.metadata["prev_" + fieldstr]?.address
                ? activity.metadata["prev_" + fieldstr]?.address
                : ""
              } ` +
              ` Landmark: ${activity.metadata["prev_" + fieldstr]?.landmark
                ? activity.metadata["prev_" + fieldstr]?.landmark
                : ""
              }`
              : ""
            } to ${activity.metadata
              ? `Door no: ${activity.metadata["cur_" + fieldstr]?.doorno
                ? activity.metadata["cur_" + fieldstr]?.doorno
                : ""
              } ` +
              ` Address: ${activity.metadata["cur_" + fieldstr]?.address
                ? activity.metadata["cur_" + fieldstr]?.address
                : ""
              } ` +
              ` Landmark: ${activity.metadata["cur_" + fieldstr]?.landmark
                ? activity.metadata["cur_" + fieldstr]?.landmark
                : ""
              }`
              : ""
            }`,
          );
        case CAB_BOOKING_ACTIVITY.GUEST_STOP_ADDED_CHANGE:
        case CAB_BOOKING_ACTIVITY.GUEST_STOP_REMOVED_CHANGE:
          return renderTimeLineItem(
            activity.created_at,
            `Stop details of ${activity.metadata?.guest_name ? activity.metadata?.guest_name : ""
            } has been ${activity.event == "guest_stop_added_change" ? "added" : "deleted"
            } by ${activity.metadata?.organizer_name ||
              activity.metadata?.coordinator_name
              ? activity.metadata?.organizer_name ||
              activity.metadata?.coordinator_name
              : ""
            } ${activity.metadata
              ? ` Address: ${activity.metadata?.address ? activity.metadata?.address : ""
              } `
              : ""
            }`,
          );
      }
    });
  };

  const renderHotelActivityLog = () => {
    return activity.map((activity: any) => {
      switch (activity.event) {
        case HOTEL_BOOKING_ACTIVITY.GUEST_ADD_CHANGE:
          return renderTimeLineItem(
            activity.created_at,
            `New guest ${activity.metadata?.guest_name ? activity.metadata?.guest_name : ""
            } has been added by ${activity.metadata?.organizer_name
              ? activity.metadata?.organizer_name
              : ""
            }`,
          );
        case HOTEL_BOOKING_ACTIVITY.GUEST_DELETE_CHANGE:
          return renderTimeLineItem(
            activity.created_at,
            `Guest ${activity.metadata?.guest_name ? activity.metadata?.guest_name : ""
            } has been deleted by ${activity.metadata?.organizer_name
              ? activity.metadata?.organizer_name
              : ""
            }`,
          );
        case HOTEL_BOOKING_ACTIVITY.GUEST_EDIT_CHANGE:
          let field = Object.keys(activity.metadata)
            .filter((item: string) => item.startsWith("cur_"))[0]
            ?.substring(4);

          return field == "is_primary"
            ? ""
            : renderTimeLineItem(
              activity.created_at,
              `Guest details of ${activity.metadata?.guest_name
                ? activity.metadata?.guest_name
                : ""
              } has been edited by ${activity.metadata?.organizer_name
                ? activity.metadata?.organizer_name
                : ""
              } as ${HOTEL_GUEST_TABLE_HEADER[field]} -> ${activity.metadata["prev_" + field]
              } to ${activity.metadata["cur_" + field]} `,
            );
        case HOTEL_BOOKING_ACTIVITY.COST_CENTRE_CHANGE:
        case HOTEL_BOOKING_ACTIVITY.CHECK_IN_CHANGE:
        case HOTEL_BOOKING_ACTIVITY.NO_OF_ROOMS_CHANGE:
        case HOTEL_BOOKING_ACTIVITY.CHECK_OUT_CHANGE:
        case HOTEL_BOOKING_ACTIVITY.DESCRIPTION_CHANGE:
        case HOTEL_BOOKING_ACTIVITY.BILLING_OPTION_CHANGE:
        case HOTEL_BOOKING_ACTIVITY.CC_RECIPIENTS_CHANGE:
        case HOTEL_BOOKING_ACTIVITY.CITY_CHANGE:
        case HOTEL_BOOKING_ACTIVITY.NO_OF_ADULTS_CHANGE:
        case HOTEL_BOOKING_ACTIVITY.NO_OF_CHILDREN_CHANGE:
        case HOTEL_BOOKING_ACTIVITY.RELATED_BOOKING_ID_CHANGE:
        case HOTEL_BOOKING_ACTIVITY.ROOM_TYPE_CHANGE:
        case HOTEL_BOOKING_ACTIVITY.TRIP_TYPE_CHANGE:
          let fieldname = Object.keys(activity.metadata)
            .filter((item: string) => item.startsWith("cur_"))[0]
            ?.substring(4);

          return renderTimeLineItem(
            activity.created_at,
            `${HOTEL_STRING[fieldname]} has been changed by ${activity.metadata?.organizer_name
              ? activity.metadata?.organizer_name
              : ""
            } from ${activity.metadata ? activity.metadata["prev_" + fieldname] : ""
            } to ${activity.metadata ? activity.metadata["cur_" + fieldname] : ""
            }`,
          );

        case HOTEL_BOOKING_ACTIVITY.PICKUP_CHANGE:
        case HOTEL_BOOKING_ACTIVITY.DROP_CHANGE:
          let fieldstr = Object.keys(activity.metadata)
            .filter((item: string) => item.startsWith("cur_"))[0]
            ?.substring(4);

          return renderTimeLineItem(
            activity.created_at,
            `Airport ${HOTEL_STRING[fieldstr]} details has been changed by ${activity.metadata?.organizer_name
              ? activity.metadata?.organizer_name
              : ""
            } from ${activity.metadata
              ? `Flight: ${activity.metadata["prev_" + fieldstr]?.flight
                ? activity.metadata["prev_" + fieldstr]?.flight
                : ""
              } ` +
              ` Time: ${activity.metadata["prev_" + fieldstr]?.time
                ? activity.metadata["prev_" + fieldstr]?.time
                : ""
              }`
              : ""
            } to ${activity.metadata
              ? `Flight: ${activity.metadata["cur_" + fieldstr]?.flight
                ? activity.metadata["cur_" + fieldstr]?.flight
                : ""
              } ` +
              ` Time: ${activity.metadata["cur_" + fieldstr]?.time
                ? activity.metadata["cur_" + fieldstr]?.time
                : ""
              }`
              : ""
            }`,
          );
      }
    });
  };

  const renderInvoiceTimeLine = () => {
    return invoiceHistory.map((history: any) => {
      switch (history.event) {
        case INVOICE_STATUS.INVOICE_CREATED:
          return renderTimeLineItem(
            history.created_at,
            `Invoice has been created by the vendor`,
          );
        case INVOICE_STATUS.INVOICE_APPROVED:
          return renderTimeLineItem(
            history.created_at,
            `Invoice has been approved by the organizer`,
            true,
            true,
          );
        case INVOICE_STATUS.INVOICE_REJECTED:
          return renderTimeLineItem(
            history.created_at,
            `Invoice has been rejected by the organizer. ${history.metadata?.comment
              ? "Comment: " + history.metadata?.comment
              : ""
            }`,
          );
      }
    });
  };

  const renderTripTimeLine = () => {
    return tripHistory?.map((history: any) => {
      switch (history.event) {
        case TRIP_STATUS.STARTED:
          return renderTimeLineItem(history.created_at, `The Trip has Started`);
        case TRIP_STATUS.PICKED:
          return renderTimeLineItem(
            history.created_at,
            `Picked up ${history.metadata.guest_name}`,
          );
        case TRIP_STATUS.DROPPED:
          return renderTimeLineItem(
            history.created_at,
            `Dropped ${history.metadata.guest_name}`,
          );
        case TRIP_STATUS.COMPLETED:
          return renderTimeLineItem(
            history.created_at,
            `The Trip has Completed`,
          );
      }
    });
  };

  const renderTimeLine = () => {
    return bookingHistory?.map((history: any) => {
      switch (history.event) {
        case BOOKING_STATUS.PENDING:
          return renderTimeLineItem(
            history.created_at,
            `New booking received from ${history.metadata.coordinator_name
            } for the date ${state ? formatDate(state?.pickup_date || state?.check_in) : ""
            }`,
          );

        case BOOKING_STATUS.ORGANIZER_ASSIGNED:
          return renderTimeLineItem(
            history.created_at,
            `${history.metadata.organizer_name} has been assigned for this booking request`,
          );

        case BOOKING_STATUS.VENDOR_REQUESTED:
          return bookingtype == "cab"
            ? renderTimeLineItem(
              history.created_at,
              `${history.metadata.organizer_name} has requested vendor ${history.metadata.vendor_name} for the package ${history.metadata.plan_name}`,
            )
            : renderTimeLineItem(
              history.created_at,
              `${history.metadata.organizer_name} has added Hotel ${history.metadata.vendor_name}`,
            );

        case BOOKING_STATUS.VENDOR_ACCEPTED:
          return renderTimeLineItem(
            history.created_at,
            `The booking request has been accepted by ${bookingtype == "cab" ? "vendor" : "hotel"
            } ${history.metadata.vendor_name}`,
          );

        case BOOKING_STATUS.VENDOR_REVOKED:
          return renderTimeLineItem(
            history.created_at,
            `The booking request has been revoked by organizer ${history.metadata.organizer_name}`,
          );

        case BOOKING_STATUS.VENDOR_DECLINED:
          return renderTimeLineItem(
            history.created_at,
            `${bookingtype == "cab" ? "Vendor" : "Hotel"} ${history.metadata.vendor_name
            } has declined the booking request`,
          );

        case BOOKING_STATUS.DRIVER_ASSIGNED:
          return renderTimeLineItem(
            history.created_at,
            `Driver ${history.metadata.driver_name} has been assigned for this booking`,
          );

        case BOOKING_STATUS.DRIVER_REASSIGNED:
          return renderTimeLineItem(
            history.created_at,
            `Driver details has been updated by vendor for this booking`,
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
            history?.metadata?.document_urls?.length != 0 ? true : false,
            history?.metadata?.document_urls?.length != 0
              ? history?.metadata?.document_urls[0]
              : "",
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

  const handlePlanSelect = (event: any) => {
    event.preventDefault();
    setSelectedPlan(event.target.value);
    setSelectedVehicle("");
  };

  const handleCitySelect = async (event: any) => {
    const cityId = event.target.value as string;
    setSelectedCityId(cityId);

    // if (cityId && vendors?.length > 0) {
    //   const selectedVendor = vendors[0];
    //   const optimalRoute = await fetchOptimalRoute(
    //     selectedVendor.coordinates,
    //     selectedVendor,
    //   );
    //   setOptimalRoute(optimalRoute);
    // }
  };

  const handleVendorSelect = async (event: any) => {
    event.preventDefault();
    const selectedVendorId = event.target.value;
    setSelectedVendor(selectedVendorId);
    setSelectedPlan("");
    setSelectedVehicle("");
    setSelectedGarage("")
  };

  const handleGarageSelect = async (event: any) => {
    event.preventDefault();
    setSelectedGarage(event.target.value);
    setSelectedVehicle("");
    setAlertMsg("");

    const selectedVendorData = vendors?.find(
      (vendor: any) => vendor.id === selectedVendor,
    );

    const selectedGarageData = selectedVendorData.garage_locations?.find(
      (garage: any) => garage.id === event.target.value,
    );

    if (selectedVendorData && state?.travel_mode == "standard") {
      const optimalRoute = await fetchOptimalRoute(
        `${selectedGarageData.latitude},${selectedGarageData.longitude}`,
        selectedVendorData,
      );
      setOptimalRoute(optimalRoute);
    }
  };

  const handleVehicleSelect = (event: any) => {
    event.preventDefault();
    setSelectedVehicle(event.target.value);
  };

  const handleSendRequest = async () => {
    setIsStay(false);
    const vendorInfo =
      bookingtype == "cab"
        ? vendors?.find((vendor: any) => vendor?.id === selectedVendor)
        : vendors?.find((vendor: any) => vendor?.id === selectedHotelVendor);

    const planInfo =
      bookingtype == "cab"
        ? vendorInfo?.plans?.find((plan: any) => plan.plan_id === selectedPlan)
        : "";
    const vehicleInfo =
      bookingtype == "cab"
        ? planInfo?.vehicles?.find(
          (vehicle: any) => vehicle.id === selectedVehicle,
        )
        : "";
    const selectedGarageData =
      bookingtype == "cab"
        ? vendorInfo.garage_locations?.find((garage: any) => garage.id === selectedGarage)
        : "";
    const latestActivity = bookingHistory[bookingHistory.length - 1];
    const bookingEvents = [];

    try {
      if (latestActivity?.event === BOOKING_STATUS.PENDING && state) {
        const response = await fetch(
          `${BASE_URL}/${bookingtype == "cab" ? "organizers/bookings" : "hotel_bookings"
          }/status`,
          {
            method: "PUT",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: "Bearer " + localStorage.getItem("userToken"),
            },
            body: JSON.stringify({
              status: BOOKING_STATUS.ORGANIZER_ASSIGNED,
              booking_id: state.id,
              metadata: {
                organizer_id: localStorage.getItem("userID"),
                organizer_name: localStorage.getItem("userName"),
              },
            }),
          },
        );
        const data = await response.json();
        if (!response.ok) {
          response.status != 422 && response.status != 500
            ? console.log("Error:", data)
            : "";
          throw new Error("Error updating booking status");
        }

        bookingEvents.push({
          event: BOOKING_STATUS.ORGANIZER_ASSIGNED,
          booking_id: state.id,
          metadata: {
            organizer_id: localStorage.getItem("userID"),
            organizer_name: localStorage.getItem("userName"),
          },
          created_at: new Date().toISOString(),
        });
      }
      const response = await fetch(
        `${BASE_URL}/${bookingtype == "cab" ? "organizers/bookings" : "hotel_bookings"
        }/status`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("userToken"),
          },
          body: JSON.stringify(
            bookingtype == "cab"
              ? {
                status: BOOKING_STATUS.VENDOR_REQUESTED,
                booking_id: state.id,
                metadata: {
                  organizer_id: localStorage.getItem("userID"),
                  organizer_name: localStorage.getItem("userName"),
                  vendor_id: vendorInfo.id,
                  vendor_name: vendorInfo.name,
                  plan_id: planInfo.plan_id,
                  package_id: planInfo.id,
                  plan_name: planInfo.name,
                  vehicle_id: vehicleInfo.id,
                  vehicle_name: vehicleInfo.name,
                  garage_location: `${selectedGarageData.latitude},${selectedGarageData.longitude}`,
                  garage_location_id: selectedGarage,
                },
              }
              : {
                status: BOOKING_STATUS.VENDOR_REQUESTED,
                booking_id: state.id,
                metadata: {
                  organizer_id: localStorage.getItem("userID"),
                  organizer_name: localStorage.getItem("userName"),
                  vendor_id: vendorInfo.id,
                  vendor_name: vendorInfo.name,
                  vendor_email: vendorInfo.email,
                },
              },
          ),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        response.status != 422 && response.status != 500
          ? console.log("Error:", data)
          : "";
        throw new Error("Error updating booking status");
      }
      bookingtype == "cab"
        ? bookingEvents.push({
          event: BOOKING_STATUS.VENDOR_REQUESTED,
          booking_id: state.id,
          metadata: {
            organizer_id: localStorage.getItem("userID"),
            organizer_name: localStorage.getItem("userName"),
            vendor_id: vendorInfo.id,
            vendor_name: vendorInfo.name,
            plan_id: planInfo.id,
            plan_name: planInfo.name,
            vehicle_id: vehicleInfo.id,
            vehicle_name: vehicleInfo.name,
            garage_location: `${selectedGarageData.latitude},${selectedGarageData.longitude}`,
            garage_location_id: selectedGarage,
          },
          created_at: new Date().toISOString(),
        })
        : bookingEvents.push({
          event: BOOKING_STATUS.VENDOR_REQUESTED,
          booking_id: state.id,
          metadata: {
            organizer_id: localStorage.getItem("userID"),
            organizer_name: localStorage.getItem("userName"),
            vendor_id: vendorInfo.id,
            vendor_name: vendorInfo.name,
            vendor_email: vendorInfo.email,
          },
          created_at: new Date().toISOString(),
        });
      bookingtype == "hotel"
        ? addedVendors.push({
          vendor: {
            id: vendorInfo.id,
            name: vendorInfo.name,
            is_third_party: vendorInfo.is_third_party,
          },
          created_at: new Date().toISOString(),
        })
        : "";
      renderButtonState([...bookingHistory, ...bookingEvents]);
      setBookingHistory([...bookingHistory, ...bookingEvents]);
      setSelectedVendor("");
      setSelectedHotelVendor("");
      setAlertType("success");
      setAlertMsg(
        bookingtype == "cab"
          ? "Request Sent to Vendor"
          : "Hotel added for the booking",
      );
      setTimeout(() => {
        setAlertMsg("");
      }, 3000);

      return data;
    } catch (error) {
      setAlertType("error");
      setAlertMsg("Request not Sent to Vendor");
      setTimeout(() => {
        setAlertMsg("");
      }, 3000);
      console.log("Error:", error);
    }
  };

  const handleAccept = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/${bookingtype == "cab" ? "vendors/bookings" : "hotel_bookings"
        }/status`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("userToken"),
          },
          body: JSON.stringify({
            status: BOOKING_STATUS.VENDOR_ACCEPTED,
            booking_id: state.id,
            metadata:
              bookingtype == "cab"
                ? {
                  plan_id: state.plan_id,
                  vendor_id: localStorage.getItem("userID"),
                  vendor_name: localStorage.getItem("userName"),
                }
                : {
                  vendor_id: localStorage.getItem("userID"),
                  vendor_name: localStorage.getItem("userName"),
                },
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        response.status != 422 && response.status != 500
          ? console.log("Error:", data)
          : "";
        throw new Error("Error accepting booking");
      }
      setEdit(true);
      setStatus(BOOKING_STATUS.VENDOR_ACCEPTED);
      setGoToVendorSelection(false);

      return data;
    } catch (err) {
      console.log(err);
    }
  };
  const handleDecline = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/${bookingtype == "cab" ? "vendors/bookings" : "hotel_bookings"
        }/status`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("userToken"),
          },
          body: JSON.stringify({
            status: BOOKING_STATUS.VENDOR_DECLINED,
            booking_id: state.id,
            metadata:
              bookingtype == "cab"
                ? {
                  plan_id: state.plan_id,
                  vendor_id: localStorage.getItem("userID"),
                  vendor_name: localStorage.getItem("userName"),
                  reason: comments,
                }
                : {
                  vendor_id: localStorage.getItem("userID"),
                  vendor_name: localStorage.getItem("userName"),
                },
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        response.status != 422 && response.status != 500
          ? console.log("Error:", data)
          : "";
        throw new Error("Error declining booking");
      }
      setDisable(true);
      setOpen(false);
      return data;
    } catch (err) {
      console.log(err);
    }
  };
  const handleEdit = () => {
    navigate("../" + ROUTE.DRIVER_DETAILS, {
      state: { ...state, status: status },
    });
  };

  const handleRevokeVendor = async (vendor_info) => {
    const bookingEvents = [];
    const response = await fetch(
      `${BASE_URL}/${bookingtype == "cab" ? "organizers/bookings" : "hotel_bookings"
      }/status`,
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
        body: JSON.stringify({
          status: BOOKING_STATUS.VENDOR_REVOKED,
          booking_id: state.id,
          metadata:
            bookingtype == "cab"
              ? {
                organizer_id: localStorage.getItem("userID"),
                organizer_name: localStorage.getItem("userName"),
                vendor_id: vendor_info.id,
                vendor_name: vendor_info.name,
              }
              : {
                organizer_id: localStorage.getItem("userID"),
                organizer_name: localStorage.getItem("userName"),
                vendor_id: state?.vendor?.id,
                vendor_name: state?.vendor?.name,
              },
        }),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      response.status != 422 && response.status != 500
        ? console.log("Error:", data)
        : "";
      throw new Error("Error revoking vendor");
    }
    bookingtype == "cab"
      ? bookingEvents.push({
        event: BOOKING_STATUS.VENDOR_REVOKED,
        booking_id: state.id,
        metadata: {
          organizer_id: localStorage.getItem("userID"),
          organizer_name: localStorage.getItem("userName"),
          vendor_id: planDetail[0].vendor_id,
          vendor_name: planDetail[0].vendor_name,
        },
      })
      : bookingEvents.push({
        event: BOOKING_STATUS.VENDOR_REVOKED,
        booking_id: state.id,
        metadata: {
          organizer_id: localStorage.getItem("userID"),
          organizer_name: localStorage.getItem("userName"),
          vendor_id: state?.vendor?.id,
          vendor_name: state?.vendor?.name,
        },
      });

    renderTimeLine;
    renderCurrentStatusTimeLineItem;

    renderButtonState([...bookingHistory, ...bookingEvents]);
    setBookingHistory([...bookingHistory, ...bookingEvents]);
    setRevokeVendor(true);
    setState({ ...state, confirmation_no: null });

    return data;
  };

  const navigate = useNavigate();

  const fetchActivity = async () => {
    const activityResponse = await fetch(
      `${BASE_URL}/bookings/${state.id}/activity_log?booking_type=${bookingtype}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
      },
    );
    const activityData = await activityResponse.json();
    setActivity(activityData.booking_activity_log);
    console.log("activityData",activityData)
  };

  useEffect(() => {
    if (state) {
      state.status == BOOKING_STATUS.VENDOR_REQUESTED
        ? setEdit(false)
        : setEdit(true);
      state.status == BOOKING_STATUS.VENDOR_DECLINED
        ? setDisable(true)
        : setDisable(false);

      dispatch(guestsInBookingRequest({ bookingId: state.id }));

      bookingtype == "cab"
        ? dispatch(driverDetailsRequest({ bookingId: state.id }))
        : "";
    }
    async function fetchData() {
      try {
        if (isVendor == "true" && bookingtype == "cab") {
          const plan_id = state?.plan_id;
          {
            const planDetails = await fetch(`${BASE_URL}/plans/${plan_id}`, {
              method: "GET",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: "Bearer " + localStorage.getItem("userToken"),
              },
            });
            const planDetailData = await planDetails.json();
            const plan = planDetailData.plan;
            setPlan(plan);
            const temp = {
              cost: plan.cost,
              package_name: plan.package.name,
              vehicle_name: plan.vehicle.name,
            };
            setvendorPackage([temp]);
          }
        }
        const invoiceHis = await fetch(
          `${BASE_URL}/invoices/history/${state.id}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: "Bearer " + localStorage.getItem("userToken"),
            },
          },
        );

        const invoiceHistoryData = await invoiceHis.json();
        setInvoiceHistory(invoiceHistoryData.booking_history);

        if (isVendor == "false" && bookingtype == "cab") {
          const response = await fetch(
            `${BASE_URL}/bookings/${state?.id}/trips`,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: "Bearer " + localStorage.getItem("userToken"),
              },
            },
          );
          const data = await response.json();
          setTrip(data);

          if(response.status != 404){
            setTripStarted(false)
          }
        }
        if (isVendor == "false") {
          const response = await fetch(`${BASE_URL}/vendors/cities`, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: "Bearer " + localStorage.getItem("userToken"),
            },
          });
          const data = await response.json();
          setCityOptions(data.vendor_city);
        }

        if (bookingtype == "hotel" && isVendor == "false") {
          const invoiceData = await fetch(
            `${BASE_URL}/hotel_bookings/${state?.id}/invoices`,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: "Bearer " + localStorage.getItem("userToken"),
              },
            },
          );
          const data = await invoiceData.json();
          setHotelInvoiceData(data.invoice);
        }

        if (isVendor === "false") {
          const requestOptions = {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: "Bearer " + localStorage.getItem("userToken"),
            },
          };

          let apiUrl = `${BASE_URL}/plans/vendors?cab_type=${state.cab_type}`;

          if (goToVendorSelection && isStay) {
            apiUrl = `${BASE_URL}/plans/vendors?city_id=${selectedCityId}&cab_type=${state.cab_type}`;
          }

          if (bookingtype == "hotel") {
            apiUrl = `${BASE_URL}/vendors/?vendor_type=hotel&city=${state?.city}`;
          }

          const plansResponse = await fetch(apiUrl, requestOptions);
          if (!plansResponse.ok) {
            setDisableAssignButton(true);
          }
          const plansData = await plansResponse.json();
          setVendors(plansData?.vendors);
        }

        if (bookingtype == "hotel" && isVendor == "false") {
          const response = await fetch(
            `${BASE_URL}/vendors/hotel_bookings/${state.id}/request`,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: "Bearer " + localStorage.getItem("userToken"),
              },
            },
          );
          const data = await response.json();
          setAddedHotels(data.bookings);
        }

        if (bookingtype == "hotel" && isVendor == "false") {
          fetchEditRequests();
        }

        if (bookingtype == "hotel" && isVendor == "false") {
          const response = await fetch(
            `${BASE_URL}/hotel_bookings/${state.id}/edit/history`,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: "Bearer " + localStorage.getItem("userToken"),
              },
            },
          );
          const data = await response.json();
          setEditHistory(data.hotel_booking_edit_request_history);
        }

        if (isVendor == "false") {
          const response = await fetch(`${BASE_URL}/cost-centres`, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: "Bearer " + localStorage.getItem("userToken"),
            },
          });
          const data = await response.json();
          setCostCenter(data.cost_centres);

          fetchActivity();
        }

        if (isVendor == "false") {
          try {
            const response = await fetch(`${BASE_URL}/vehicles/models`, {
              method: "GET",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: "Bearer " + localStorage.getItem("userToken"),
              },
            });
            const data = await response.json();
            setModels(data.vehicle_models);
          } catch (error) {
            console.error("Error fetching Model:", error);
          }
        }

        const bookingHistoryResponse = await fetch(
          `${BASE_URL}/${bookingtype == "hotel" ? "hotel_bookings" : "bookings"
          }/${state.id}/history`,
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
        renderButtonState(dataHistory);
        setIsBookingCancelled(
          dataHistory?.find(
            (item: any) => item.event == BOOKING_STATUS.CANCELLED,
          )
            ? true
            : false,
        );

        let tripStatusData = [];
        if (bookingtype == "cab") {
          const tripStatus = await fetch(
            `${BASE_URL}/drivers/trips/history?booking_id=${state.id}`,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: "Bearer " + localStorage.getItem("userToken"),
              },
            },
          );

          tripStatusData = await tripStatus.json();
          setTripHistory(tripStatusData?.trip_history);
          manualEntryCondition(tripStatusData?.trip_history);
        }

        if (
          (tripStatusData?.trip_history?.slice(-1)[0]?.event ==
            TRIP_STATUS.COMPLETED ||
            bookingHistoryData?.booking_history?.find(
              (item: any) => item.event == BOOKING_STATUS.CANCELLED,
            )
            ? true
            : false) &&
          !(
            state?.travel_mode == "rental" &&
            (state.status == BOOKING_STATUS.DRIVER_ASSIGNED ||
              state.status == BOOKING_STATUS.DRIVER_REASSIGNED)
          )
        ) {
          const invoiceData = await fetch(
            `${BASE_URL}/invoices/summary/${state.id}`,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: "Bearer " + localStorage.getItem("userToken"),
              },
            },
          );

          const data = await invoiceData.json();
          setInvoice(data);
        }

        if (
          state?.travel_mode == "rental" &&
          (state.status == BOOKING_STATUS.DRIVER_ASSIGNED ||
            state.status == BOOKING_STATUS.DRIVER_REASSIGNED) &&
          (tripStatusData?.trip_history?.slice(-1)[0]?.event ==
            TRIP_STATUS.COMPLETED ||
            bookingHistoryData?.booking_history?.find(
              (item: any) => item.event == BOOKING_STATUS.CANCELLED,
            )
            ? true
            : false)
        ) {
          setInvoice({ message: "Invoice summary not found" });
        }

        if (
          isVendor == "false" &&
          bookingtype == "cab" &&
          !(state.status == BOOKING_STATUS.PENDING)
        ) {
          const planDetails = await fetch(
            `${BASE_URL}/bookings/${state.id}/plans`,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: "Bearer " + localStorage.getItem("userToken"),
              },
            },
          );
          const planDetailData = await planDetails.json();
          const temp = {
            vendor_id: planDetailData.vendor?.id,
            vendor_name: planDetailData.vendor?.name,
            primary_mobile: planDetailData.vendor?.primary_mobile,
            email: planDetailData.vendor?.email,
            package_name: planDetailData.plan?.name,
            package_cost: planDetailData.cost,
            vehicle_name: planDetailData.vehicle?.name,
            address: planDetailData.vendor?.address,
            coordinates: planDetailData.vendor?.coordinates,
          };
          setPlanDetail([temp]);
        }
      } catch (err: any) {
        if (typeof err === "object" && err.message.includes("No Plans"))
          setDisableVendorButton(true);
        console.log("Error: ", err);
      }
    }

    state?.id ? fetchData() : "";
    setEmailIds(state?.cc_recipients);
    setSelectedCostcenter(state?.cost_centre?.code);
    setSelectedCab(state?.cab_type);
    setSelectedDate(state?.pickup_date);
    setSelectedTime(state?.pickup_time);
  }, [state, selectedCityId]);

  const fetchEditRequests = async () => {
    const response = await fetch(
      `${BASE_URL}/hotel_bookings/${state.id}/edit`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
      },
    );
    const data = await response.json();
    setEditReqList(data.hotel_booking_edit_requests);
  };

  const fetchOptimalRoute = async (loc: any, vendor = null) => {
    if (loc) {
      const optimalRouteResponse = await fetch(
        `${BASE_URL}/bookings/${state.id}/optimal-route?location=${loc}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("userToken"),
          },
        },
      );
      const optimalRouteData = await optimalRouteResponse.json();

      // Transform data as needed
      const transformedData = {
        ...optimalRouteData,
        optimal_route: optimalRouteData.optimal_route?.map((obj: any) => ({
          ...obj,
          coordinate: {
            lat: parseFloat(obj.coordinate?.split(",")[0]),
            lng: parseFloat(obj.coordinate?.split(",")[1]),
          },
        })),
        vendor,
      };

      return transformedData;
    }
  };

  const handleSave = async () => {
    try {
      const cid = costCenter.find(
        (item: any) => item.code == selectedCostcenter,
      );
      let body = {};
      body =
        selectedCostcenter != state?.cost_centre?.code
          ? {
            ...body,
            cost_centre: {
              id: cid?.id,
              code: cid?.code,
            },
          }
          : body;
      body =
        selectedCab != state?.cab_type
          ? { ...body, cab_type: selectedCab }
          : body;
      body =
        selectedTime != state?.pickup_time
          ? {
            ...body,
            pickup_time: dayjs(selectedTime, "hh:mm A").format("HH:mm"),
          }
          : body;
      body =
        selectedDate != state?.pickup_date
          ? {
            ...body,
            pickup_date: dayjs(selectedDate, "DD-MM-YYYY").format(
              "YYYY-MM-DD",
            ),
          }
          : body;
      if (Object.keys(body)?.length) {
        const response = await fetch(`${BASE_URL}/bookings/${state?.id}`, {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("userToken"),
          },
          body: JSON.stringify(body),
        });

        const data = await response.json();
        if (!response.ok) {
          response.status != 422 && response.status != 500
            ? console.log("Error:", data)
            : "";
          throw new Error("Error saving details");
        }
        setCostEdit(false);
        setState({
          ...state,
          cost_centre: {
            id: cid?.id,
            code: cid?.code,
            gstin_no: cid?.gstin_no,
          },
          pickup_date: selectedDate,
          pickup_time: selectedTime,
          cab_type: selectedCab,
        });
        fetchActivity();
        setAlertType("success");
        setAlertMsg(data.message);
        setTimeout(() => {
          setAlertMsg("");
        }, 3000);
      }
    } catch (error) {
      console.log(error);
      setAlertType("error");
      setAlertMsg("Error saving details");
      setTimeout(() => {
        setAlertMsg("");
      }, 3000);
    }
  };

  const handleCancelBooking = async () => {
    const response = await fetch(
      `${BASE_URL}/${bookingtype == "cab" ? "organizers/bookings" : "hotel_bookings"
      }/status`,
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
        body: JSON.stringify({
          status: BOOKING_STATUS.CANCELLED,
          booking_id: state.id,
          metadata: {
            organizer_id: localStorage.getItem("userID"),
            organizer_name: localStorage.getItem("userName"),
            comment: comments,
          },
        }),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      response.status != 422 && response.status != 500
        ? console.log("Error:", data)
        : "";
      throw new Error("Error cancelling booking");
    }
    setCancelOpen(false);
    setIsBookingCancelled(true);
  };

  const handleCcSave = async () => {
    try {
      const response = await fetch(`${BASE_URL}/hotel_bookings/${state?.id}`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
        body: JSON.stringify({
          cc_recipients: emailIds,
        }),
      });

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

  const handleEditBooking = () => {
    const transformedGuests =
      bookingtype == "cab"
        ? guests.map((guest: any) => {
          state.travel_mode == "rental"
            ? (guest = Object.fromEntries(
              Object.entries(guest).filter(
                ([key, value]) =>
                  key !== "destination" && key !== "waypoints",
              ),
            ))
            : "";
          return {
            ...guest,
            date_of_duty: guest.date_of_duty
              ? moment(guest.date_of_duty, "DD-MM-YYYY").format("YYYY-MM-DD")
              : "",
            start_time: guest.start_time
              ? moment(guest.start_time, "HH:mm A").format("HH:mm")
              : "",
          };
        })
        : guests;

    const editedBookingData =
      bookingtype == "cab"
        ? {
          type: bookingtype,
          id: state.id,
          bid: state.bid,
          data: {
            cab_type: state?.cab_type,
            pick_up_date: [formatDateToM2(state?.pickup_date)],
            pick_up_time: state?.pickup_time,
            travel_mode: state?.travel_mode,
            guests: transformedGuests,
            po_number: state?.po_number,
            city: state?.booking_city,
          },

          coordinator_email: state?.coordinator.email,
          cost_center: state?.cost_centre,
          description: state?.description,
          travel_mode: state?.travel_mode,
        }
        : {
          type: bookingtype,
          id: state.id,
          bid: state.bid,
          city: state.city,
          trip_type: state.trip_type,
          no_of_rooms: state.no_of_rooms,
          room_type: state?.room_type,
          no_of_adults: state.no_of_adults,
          no_of_children: state.no_of_children,
          check_in: state.check_in,
          check_out: state.check_out,
          pickup: state?.pickup,
          drop: state?.drop,
          guests: transformedGuests,
          related_booking_id: state?.related_booking_id,
          billing_option: state?.billing_option,
          coordinator_email: state?.coordinator.email,
          cost_centre: state?.cost_centre,
          description: state?.description,
          cc_recipients: state?.cc_recipients,
        };

    dispatch(setPrefilledBookingData(editedBookingData));

    navigate("/home/new_booking");
  };

  useEffect(() => {
    if (isVendor == "true" && state?.travel_mode == "standard") {
      const vendorAddress = vendors?.find(
        (vendor: any) => vendor.id == selectedVendor,
      );
      fetchOptimalRoute(state?.garage_location || vendorAddress?.coordinates, vendorAddress);
    }
  }, [vendors, selectedVendor]);

  useEffect(() => {
    isVendor == "true" && planDetail && state?.travel_mode == "standard"
      ? fetchOptimalRoute(state?.garage_location || planDetail[0].coordinates)
      : "";
  }, [planDetail]);

  const manualEntryCondition = (history: any) => {
    const pickupTimestamp = new Date(
      formatDate(state?.pickup_date || state?.check_in) +
      " " +
      state?.pickup_time,
    );
    const pickupTimestamp1hr = new Date(
      pickupTimestamp.setHours(pickupTimestamp.getHours() + 1),
    );
    pickupTimestamp1hr < new Date() && state?.vendor?.id == userID
      ? setIsManual(true)
      : setIsManual(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          bookingtype == "cab"
            ? `${BASE_URL}/organizers/bookings/${state?.id}`
            : `${BASE_URL}/hotel_bookings/?bid=${state?.bid}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: "Bearer " + localStorage.getItem("userToken"),
            },
          },
        );

        const data = await response.json();
        if (!response.ok) {
          response.status != 422 && response.status != 500
            ? console.log("Error:", data)
            : "";
          throw new Error("Failed to fetch booking data");
        }

        bookingtype == "cab"
          ? setBookingData(data.booking)
          : setBookingData(data.bookings);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    state?.id ? fetchData() : "";
  }, [state, isRevokeVendor]);

  useEffect(() => {
    const fetchOptimalRouteAndSet = async () => {
      if (
        planDetail &&
        planDetail.length > 0 &&
        isVendor == "false" &&
        state?.travel_mode == "standard"
      ) {
        const vendorDetails = planDetail[0];
        const optimalRouteData = await fetchOptimalRoute(
          state?.garage_location || vendorDetails.coordinates,
          vendorDetails.vendor_id,
        );
        setOptimalRoute(optimalRouteData);
      }
    };

    fetchOptimalRouteAndSet();
  }, [planDetail]);

  useEffect(() => {
    const fetchOptimalRouteAndSet = async () => {
      if (
        plan?.vendor &&
        isVendor == "true" &&
        state?.travel_mode == "standard"
      ) {
        const vendorDetails = plan?.vendor;
        const optimalRouteData = await fetchOptimalRoute(
          state?.garage_location || vendorDetails.coordinates,
          vendorDetails.id,
        );
        setOptimalRoute(optimalRouteData);
      }
    };

    fetchOptimalRouteAndSet();
  }, [plan?.vendor]);

  useEffect(()=>{
    checkCreditNote()
  },[state])

  async function checkCreditNote(){
    if(state?.id){
      const response = await fetch(`${BASE_URL}/invoices/${state?.id}`, {
        method: 'GET',
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        }
      })
      if(response.status == 404){
        dispatch(clearCreditNoteInvoice())
      }
    }
  }

  return (
    <div className="flex h-[calc(100vh-64px)] justify-around w-5/6 md:w-full bg-appBg">
      <div className="mb-5 items-end justify-end">
        {alertMsg && <Toast message={alertMsg} toastType={alertType} />}
      </div>
      {state?.bid ? (
        <div className="flex h-full mx-6 my-3 bg-white rounded-xl w-full">
          <div className="flex flex-col mx-7 my-5 w-full">
            {state?.travel_mode == "rental" ? (
              <div className="flex justify-center">
                <span className="font-semibold text-xl">
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
                    state.navigatedFrom
                      ? navigate("../" + state.navigatedFrom)
                      : "";
                  }}
                />
                <span className="font-semibold text-base">
                  {`Request from ${state?.coordinator?.name} on ${state
                    ? formatDate(state?.pickup_date || state?.check_in)
                    : ""
                    }`}
                </span>
                {isVendor == "false" &&
                  bookingtype == "hotel" &&
                  !isBookingCancelled && (
                    <Button
                      disabled={isBookingCancelled}
                      onClick={() => setIsEditCreate(true)}
                    >
                      <EditIcon />
                    </Button>
                  )}
                <EditRequest
                  isEditCreate={isEditCreate}
                  setIsEditCreate={setIsEditCreate}
                  booking_id={state.id}
                  setAlertMsg={setAlertMsg}
                  setAlertType={setAlertType}
                  fetchEditRequests={fetchEditRequests}
                  isBookingCancelled={isBookingCancelled}
                  create={true}
                />
                {/* {isVendor == "false" && bookingtype == "cab" && (
                  <Button
                    onClick={() => {
                      setCostEdit(!costEdit);
                      costEdit ? handleSave() : "";
                    }}
                  >
                    {!costEdit ? <EditIcon /> : "Save"}
                  </Button>
                )} */}
              </div>

              <div className="flex gap-5">
                {isVendor == "false" && !isBookingCancelled && (
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={handleEditBooking}
                  >
                    Edit Booking
                  </Button>
                )}

                {isVendor == "false" && !isBookingCancelled && (
                  <>
                    <Button
                      variant="outlined"
                      size="large"
                      color="error"
                      onClick={() => setCancelOpen(true)}
                    >
                      Cancel Booking
                    </Button>
                    <Dialog
                      onClose={() => setCancelOpen(false)}
                      open={cancelOpen}
                    >
                      <DialogTitle>
                        Do you wish to cancel the booking? If yes, then please
                        state the reason for cancellation.
                      </DialogTitle>
                      <TextField
                        id="reason"
                        label="Reason for cancellation"
                        InputProps={{ className: "m-3" }}
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                      />
                      <div className="flex flex-row justify-center">
                        <Button
                          variant="contained"
                          color="inherit"
                          sx={{ m: 2 }}
                          onClick={() => setCancelOpen(false)}
                        >
                          Back
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          sx={{ m: 2 }}
                          onClick={handleCancelBooking}
                          disabled={!comments}
                        >
                          Proceed
                        </Button>
                      </div>
                    </Dialog>
                  </>
                )}
              </div>

              {isBookingCancelled && (
                <div>
                  <span className="text-lg font-bold">
                    This booking has been cancelled
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-row justify-between">
              <div>
                <CopyHtml id={"tablecopy"} state={state} guests={guests} />
                {bookingtype == "hotel" && isVendor == "false" && (
                  <div className="flex justify-start items-center">
                    <IconButton onClick={handleCopyToClipboard}>
                      <ContentCopyIcon color="primary" />
                    </IconButton>
                    {copied ? (
                      <Typography>Copied!</Typography>
                    ) : (
                      <Typography color={"blue"}>Copy to clipboard</Typography>
                    )}
                  </div>
                )}
              </div>
              {state?.confirmation_no && (
                <div className="flex justify-end">
                  <span className="text-lg font-bold">
                    This booking has been confirmed ({state?.confirmation_no})
                  </span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 my-10 px-2 gap-3 justify-between content-between">
              <div className="flex flex-col">
                <span className="font-normal text-lg">{"Booking ID"}</span>
                <span className="text-sm font-normal">{state?.bid}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-normal text-lg">
                  {bookingtype == "cab" ? "No. of People" : "No. of Adults"}
                </span>
                <span className="text-sm font-normal">
                  {bookingtype == "cab" ? guests.length : state.no_of_adults}
                </span>
              </div>
              {state.trip_type == "Family" && bookingtype == "hotel" && (
                <div className="flex flex-col">
                  <span className="font-normal text-lg">{"No. of Kids"}</span>
                  <span className="text-sm font-normal">
                    {state.no_of_children}
                  </span>
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-normal text-lg">
                  {bookingtype == "cab" ? "Date" : "Check-in"}
                </span>
                <span className="text-sm font-normal">
                  {state && bookingtype == "hotel"
                    ? formatDate(state?.check_in)
                    : ""}
                  {!costEdit ? (
                    selectedDate
                  ) : (
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        value={dayjs(selectedDate, "DD-MM-YYYY")}
                        onChange={(value) => {
                          setSelectedDate(value?.format("DD-MM-YYYY"));
                        }}
                        format="DD-MM-YYYY"
                        sx={{
                          "& .css-nxo287-MuiInputBase-input-MuiOutlinedInput-input":
                          {
                            padding: "10px",
                          },
                          width: 150,
                          maxWidth: 150,
                        }}
                      />
                    </LocalizationProvider>
                  )}
                </span>
              </div>
              {bookingtype == "hotel" && (
                <div className="flex flex-col">
                  <span className="font-normal text-lg">{"Check-out"}</span>
                  <span className="text-sm font-normal">
                    {state ? formatDate(state?.check_out) : ""}
                  </span>
                </div>
              )}
              {bookingtype == "cab" && (
                <div className="flex flex-col">
                  <span className="font-normal text-lg">{"Time"}</span>
                  <span className="text-sm font-normal">
                    {/* {state?.pickup_time} */}
                    {!costEdit ? (
                      selectedTime
                    ) : (
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DesktopTimePicker
                          value={dayjs(selectedTime, "hh:mm A")}
                          ampm={false}
                          onChange={(value) => {
                            setSelectedTime(value?.format("hh:mm A"));
                          }}
                          viewRenderers={{
                            hours: renderTimeViewClock,
                            minutes: renderTimeViewClock,
                            seconds: renderTimeViewClock,
                          }}
                          sx={{
                            "& .css-nxo287-MuiInputBase-input-MuiOutlinedInput-input":
                            {
                              padding: "10px",
                            },
                            width: 150,
                            maxWidth: 150,
                          }}
                        />
                      </LocalizationProvider>
                    )}
                  </span>
                </div>
              )}
              {bookingtype == "cab" && (
                <div className="flex flex-col">
                  <span className="font-normal text-lg">{"Car Type"}</span>
                  <span className="text-sm font-normal">
                    {/* {state?.cab_type} */}
                    {!costEdit ? (
                      selectedCab
                    ) : (
                      <Select
                        label={"Select car type"}
                        id="car-type"
                        value={selectedCab}
                        size="small"
                        sx={{ width: 150, maxWidth: 150 }}
                        onChange={(e: any) => setSelectedCab(e.target.value)}
                      >
                        {models?.map((model: any) => (
                          <MenuItem key={model.id} value={model.name}>
                            {model.name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  </span>
                </div>
              )}
              {bookingtype == "hotel" && (
                <div className="flex flex-col">
                  <span className="font-normal text-lg">{"City"}</span>
                  <span className="text-sm font-normal">{state?.city}</span>
                </div>
              )}
              {bookingtype == "hotel" && (
                <div className="flex flex-col">
                  <span className="font-normal text-lg">{"Trip Type"}</span>
                  <span className="text-sm font-normal">
                    {state?.trip_type}
                  </span>
                </div>
              )}
              {bookingtype == "hotel" && (
                <div className="flex flex-col">
                  <span className="font-normal text-lg">
                    {"Billing Option"}
                  </span>
                  <span className="text-sm font-normal">
                    {state?.billing_option}
                  </span>
                </div>
              )}
              {bookingtype == "hotel" && state.room_type ? (
                <div className="flex flex-col">
                  <span className="font-normal text-lg">{"Room Type"}</span>
                  <span className="text-sm font-normal">
                    {state?.room_type}
                  </span>
                </div>
              ) : (
                ""
              )}
              {bookingtype == "hotel" && (
                <div className="flex flex-col">
                  <span className="font-normal text-lg">{"No. of Rooms"}</span>
                  <span className="text-sm font-normal">
                    {state?.no_of_rooms}
                  </span>
                </div>
              )}
              {bookingtype == "hotel" && state?.related_booking_id ? (
                <div className="flex flex-col">
                  <span className="font-normal text-lg">{"Related Bid"}</span>
                  <span className="text-sm font-normal text-cyan-700">
                    <a
                      className="underline hover:cursor-pointer"
                      onClick={() =>
                        window.open(
                          `../${ROUTE.BOOKING}/${state?.related_booking_id}`,
                        )
                      }
                    >
                      {state?.related_booking_id}
                    </a>
                  </span>
                </div>
              ) : (
                ""
              )}
              {state?.cost_centre?.code && isVendor == "false" ? (
                <div className="flex flex-col">
                  <div className="flex flex-row items-center">
                    <span className="font-normal text-lg">{"Cost Center"}</span>
                  </div>
                  <span className="text-sm font-normal">
                    {!costEdit ? (
                      selectedCostcenter
                    ) : (
                      <Select
                        label={"Select new cost center"}
                        id="select-costcenter"
                        value={selectedCostcenter}
                        size="small"
                        sx={{ width: 150, maxWidth: 150 }}
                        onChange={(e: any) =>
                          setSelectedCostcenter(e.target.value)
                        }
                      >
                        {costCenter?.map((cost: any) => (
                          <MenuItem key={cost.id} value={cost.code}>
                            {cost.code}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  </span>
                </div>
              ) : (
                ""
              )}
              {bookingtype == "hotel" && state?.pickup?.flight ? (
                <div className="flex flex-col">
                  <span className="font-normal text-lg">
                    {"Airport Pickup"}
                  </span>
                  <span className="text-sm font-normal">
                    {state?.pickup?.flight}
                  </span>
                  <span className="text-sm font-normal">
                    {state?.pickup?.time ? "Time : " + state?.pickup?.time : ""}
                  </span>
                </div>
              ) : (
                ""
              )}
              {bookingtype == "hotel" && state?.drop?.flight ? (
                <div className="flex flex-col">
                  <span className="font-normal text-lg">{"Airport Drop"}</span>
                  <span className="text-sm font-normal">
                    {state?.drop?.flight}
                  </span>
                  <span className="text-sm font-normal">
                    {state?.drop?.time ? "Time : " + state?.drop?.time : ""}
                  </span>
                </div>
              ) : (
                ""
              )}
              {state?.po_number && (
                <div className="flex flex-col">
                  <span className="font-normal text-lg">{"PO Number"}</span>
                  <span className="text-sm font-normal">{state?.po_number}</span>
                </div>
              )}
              {state?.organizer?.name ? (
                <div className="flex flex-col">
                  <span className="font-normal text-lg">
                    {"Organizer Assigned"}
                  </span>
                  <span className="text-sm font-normal">
                    {state?.organizer?.name}
                  </span>
                </div>
              ) : (
                ""
              )}
              {state?.booking_city?.city ? (
                <div className="flex flex-col">
                  <span className="font-normal text-lg">
                    {"City"}
                  </span>
                  <span className="text-sm font-normal">
                    {state?.booking_city?.city}
                  </span>
                </div>
              ) : (
                ""
              )}
            </div>
            <div className="flex flex-row justify-between px-2 max-h-52 ">
              {isVendor == "false" && state?.description ? (
                <div className="flex flex-col mb-5 max-h-52 w-2/4">
                  <span className="font-normal text-lg">{"Description"}</span>
                  <span className="text-sm font-normal overflow-y-scroll">
                    {state?.description}
                  </span>
                </div>
              ) : (
                ""
              )}
              {isVendor == "false" &&
                bookingtype == "hotel" &&
                !isBookingCancelled ? (
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
              ) : (
                ""
              )}
            </div>
            {trip?.starting_odo ? (
              <div className="grid grid-cols-4 my-10 px-2 justify-between content-between">
                <div className="flex flex-col">
                  <span className="font-normal text-lg">{"Starting Odo"}</span>
                  <span className="text-sm font-normal">
                    {trip?.starting_odo}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-normal text-lg">{"Ending Odo"}</span>
                  <span className="text-sm font-normal">
                    {trip?.ending_odo}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-normal text-lg">{"Starting Time"}</span>
                  <span className="text-sm font-normal">
                    {trip?.starting_time
                      ? new Date(trip?.starting_time)?.toLocaleString()
                      : ""}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-normal text-lg">{"Ending Time"}</span>
                  <span className="text-sm font-normal">
                    {trip?.ending_time
                      ? new Date(trip?.ending_time)?.toLocaleString()
                      : ""}
                  </span>
                </div>
              </div>
            ) : (
              ""
            )}
            {/* People details */}
            {isVendor == "false" ? (
              <div className="flex flex-col h-full justify-between">
                {!goToVendorSelection ? (
                  <div>
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
                            expanded === "guest-details"
                              ? "1px solid #0000001f"
                              : 0,
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
                          tableData={guests}
                          isPaginated={true}
                        />
                      </AccordionDetails>
                    </Accordion>
                    {!(
                      bookingData?.status == BOOKING_STATUS.ORGANIZER_ASSIGNED
                    ) &&
                      !(bookingData?.status == BOOKING_STATUS.PENDING) &&
                      bookingData?.vendor_id != null &&
                      planDetail ? (
                      <Accordion
                        elevation={0}
                        disableGutters={true}
                        square
                        sx={{
                          boxShadow: "none",
                        }}
                        expanded={expanded === "plan-details"}
                        onChange={handleChange("plan-details")}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          sx={{
                            flexDirection: "row-reverse",
                            borderBottom:
                              expanded === "plan-details"
                                ? "1px solid #0000001f"
                                : 0,
                          }}
                        >
                          <Typography>
                            {" "}
                            {"Vendor & Package Details"}{" "}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <div
                            className={`flex w-full py-5 px-2 flex-col md:flex-row ${state?.travel_mode == "standard"
                              ? "justify-between"
                              : "justify-center"
                              }`}
                          >
                            {state?.travel_mode == "standard" ? (
                              <div className="ml-10">
                                {optimalRoute?.optimal_route?.length > 0 && (
                                  <MapImg
                                    key={optimalRoute?.vendor}
                                    route={optimalRoute?.optimal_route}
                                    state={optimalRoute ? optimalRoute : ""}
                                    vendor={optimalRoute?.vendor}
                                  />
                                )}
                              </div>
                            ) : (
                              ""
                            )}
                            <div className="flex flex-col max-h-fit w-80 mr-10 mt-8">
                              <div className="flex flex-row items-center">
                                <span className="font-normal text-lg mr-4">
                                  {"Vendor Name : "}
                                </span>
                                <span className="text-lg font-normal">
                                  {planDetail ? planDetail[0].vendor_name : ""}
                                </span>
                              </div>
                              {planDetail
                                ? planDetail[0].primary_mobile && (
                                  <div className="flex flex-row items-center mt-5">
                                    <span className="font-normal text-lg mr-4">
                                      {"Mobile : "}
                                    </span>
                                    <span className="text-lg font-normal">
                                      {planDetail
                                        ? planDetail[0].primary_mobile
                                        : ""}
                                    </span>
                                  </div>
                                )
                                : ""}
                              {planDetail
                                ? planDetail[0].email && (
                                  <div className="flex flex-row items-center mt-5">
                                    <span className="font-normal text-lg mr-4">
                                      {"Email : "}
                                    </span>
                                    <span className="text-lg font-normal">
                                      {planDetail ? planDetail[0].email : ""}
                                    </span>
                                  </div>
                                )
                                : ""}
                              <div className="flex flex-row items-center mt-5">
                                <span className="font-normal text-lg mr-4">
                                  {"Package : "}
                                </span>
                                <span className="text-lg font-normal">
                                  {planDetail ? planDetail[0].package_name : ""}
                                </span>
                              </div>
                              <div className="flex flex-row items-center mt-5">
                                <span className="font-normal text-lg mr-4">
                                  {"Vehicle : "}
                                </span>
                                <span className="text-lg font-normal">
                                  {planDetail ? planDetail[0].vehicle_name : ""}
                                </span>
                              </div>
                              <div className="flex flex-row items-center mt-5">
                                <span className="font-normal text-lg mr-4">
                                  {"Package Cost : "}
                                </span>
                                <span className="text-lg font-normal">
                                  {"Rs."}
                                  {planDetail ? planDetail[0].package_cost : ""}
                                </span>
                              </div>
                            </div>
                          </div>
                        </AccordionDetails>
                      </Accordion>
                    ) : (
                      ""
                    )}

                    {/* {"vendor request"} */}
                    {tripStarted && 
                    <Accordion
                    elevation={0}
                    disableGutters={true}
                    sx={{
                      boxShadow: "none",
                      }}
                      expanded={expanded === "vendor-revoke"}
                      onChange={handleChange("vendor-revoke")}
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
                        <Typography> {"Vendor Booking Requests"} </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {assignedVendor && assignedVendor.length != 0 ?
                          assignedVendor.map((item)=>(
                            <Box className="w-full h-[40px] flex justify-between items-center bg-gray-300 pl-4 mt-2 odd:bg-gray-200 even:bg-gray-100">
                              <p>{item?.vendor?.name}</p>
                              <Button
                                color="error"
                                onClick={() => {
                                  handleRevokeVendor(item?.vendor);
                                }}
                                startIcon={<SyncIcon />}
                                disableElevation
                              >
                                {"Revoke"}
                              </Button>
                            </Box>
                          ))
                          :
                          <p className="w-full text-gray-400 text-center">No vendor assigned for this booking</p>
                        }
                      </AccordionDetails>
                    </Accordion>}
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
                    {activity && activity.length != 0 && (
                      <Accordion
                        elevation={0}
                        disableGutters={true}
                        sx={{
                          boxShadow: "none",
                        }}
                        expanded={expanded === "activity-log"}
                        onChange={handleChange("activity-log")}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          sx={{
                            flexDirection: "row-reverse",
                            borderBottom:
                              expanded === "activity-log"
                                ? "1px solid #0000001f"
                                : 0,
                          }}
                        >
                          <Typography> {"Booking Activity Log"} </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Timeline
                            sx={{
                              [`& .${timelineOppositeContentClasses.root}`]: {
                                flex: 0.25,
                              },
                            }}
                          >
                            {bookingtype == "hotel"
                              ? renderHotelActivityLog()
                              : renderCabActivityLog()}
                          </Timeline>
                        </AccordionDetails>
                      </Accordion>
                    )}
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
                    {bookingtype == "hotel" &&
                      !isBookingCancelled &&
                      state.confirmation_no == null &&
                      !isComplete ? (
                      <Accordion
                        elevation={0}
                        disableGutters={true}
                        square
                        sx={{
                          boxShadow: "none",
                        }}
                        expanded={expanded === "confirm-booking"}
                        onChange={handleChange("confirm-booking")}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          sx={{
                            flexDirection: "row-reverse",
                            borderBottom:
                              expanded === "confirm-booking"
                                ? "1px solid #0000001f"
                                : 0,
                          }}
                        >
                          <Typography> {"Confirm booking"} </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <ConfirmBooking
                            isComplete={isComplete}
                            setIsComplete={setIsComplete}
                            state={state}
                          />
                        </AccordionDetails>
                      </Accordion>
                    ) : (
                      ""
                    )}
                    {editReqList?.length != 0 && (
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
                            booking_id={state.id}
                            setAlertMsg={setAlertMsg}
                            setAlertType={setAlertType}
                            fetchEditRequests={fetchEditRequests}
                            isBookingCancelled={isBookingCancelled}
                          />
                        </AccordionDetails>
                      </Accordion>
                    )}
                    {editHistory.length != 0 ? (
                      <Accordion
                        elevation={0}
                        disableGutters={true}
                        sx={{
                          boxShadow: "none",
                        }}
                        expanded={expanded === "edit-timeline"}
                        onChange={handleChange("edit-timeline")}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          sx={{
                            flexDirection: "row-reverse",
                            borderBottom:
                              expanded === "edit-timeline"
                                ? "1px solid #0000001f"
                                : 0,
                          }}
                        >
                          <Typography> {"Edit Timeline"} </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Timeline
                            sx={{
                              [`& .${timelineOppositeContentClasses.root}`]: {
                                flex: 0.25,
                              },
                            }}
                          >
                            {renderEditTimeLine()}
                          </Timeline>
                        </AccordionDetails>
                      </Accordion>
                    ) : (
                      ""
                    )}

                    {bookingtype == "hotel" &&
                      (state?.status == BOOKING_STATUS.CONFIRMED ||
                        state?.status == BOOKING_STATUS.CANCELLED ||
                        state?.status == BOOKING_STATUS.INVOICE_CREATED ||
                        state?.status ==
                        BOOKING_STATUS.INVOICE_CREATED_BY_ORGANIZER ||
                        state?.status ==
                        BOOKING_STATUS.INVOICE_CREATED_BY_SUPER_ORGANIZER) && (
                        <Accordion
                          elevation={0}
                          disableGutters={true}
                          square
                          sx={{
                            boxShadow: "none",
                          }}
                          expanded={expanded === "hotel-invoice"}
                          onChange={handleChange("hotel-invoice")}
                        >
                          <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            sx={{
                              flexDirection: "row-reverse",
                              borderBottom:
                                expanded === "hotel-invoice"
                                  ? "1px solid #0000001f"
                                  : 0,
                            }}
                          >
                            <Typography> {"Hotel Invoice"} </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <HotelVendorInvoice bookingId={state?.id} />
                          </AccordionDetails>
                        </Accordion>
                      )}

                    {bookingtype == "hotel" &&
                      (state?.status == BOOKING_STATUS.INVOICE_CREATED ||
                        state?.status == BOOKING_STATUS.CANCELLED ||
                        state?.status ==
                        BOOKING_STATUS.INVOICE_CREATED_BY_ORGANIZER ||
                        state?.status ==
                        BOOKING_STATUS.INVOICE_CREATED_BY_SUPER_ORGANIZER) && (
                        <Accordion
                          elevation={0}
                          disableGutters={true}
                          square
                          sx={{
                            boxShadow: "none",
                          }}
                          expanded={expanded === "hotel-client-invoice"}
                          onChange={handleChange("hotel-client-invoice")}
                        >
                          <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            sx={{
                              flexDirection: "row-reverse",
                              borderBottom:
                                expanded === "hotel-client-invoice"
                                  ? "1px solid #0000001f"
                                  : 0,
                            }}
                          >
                            <Typography> {"Invoice to Client"} </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <HotelInvoice
                              bookingId={state?.id}
                              vendorId={state?.vendor?.id}
                              invoiceData={hotelInvoiceData}
                            />
                          </AccordionDetails>
                        </Accordion>
                      )}
                    {tripHistory?.find(
                      (item: any) =>
                        item.event == TRIP_STATUS.COMPLETED && invoice.length != 0,
                    ) ||
                      (isBookingCancelled && state.vendor) ? (
                      <Accordion
                        elevation={0}
                        disableGutters={true}
                        square
                        sx={{
                          boxShadow: "none",
                        }}
                        expanded={expanded === "invoice"}
                        onChange={handleChange("invoice")}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          sx={{
                            flexDirection: "row-reverse",
                            borderBottom:
                              expanded === "invoice" ? "1px solid #0000001f" : 0,
                          }}
                        >
                          <Typography> {"Create Vendor Invoice"} </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Invoice
                            data={invoice}
                            state={{
                              ...state,
                              isBookingCancelled: isBookingCancelled,
                            }}
                            setAlertMsg={setAlertMsg}
                            setAlertType={setAlertType}
                            isVendor={true}
                          />
                        </AccordionDetails>
                      </Accordion>
                    ) : ""}
                    {invoiceHistory.length != 0 ? (
                      <Accordion
                        elevation={0}
                        disableGutters={true}
                        square
                        sx={{
                          boxShadow: "none",
                        }}
                        expanded={expanded === "organizer-invoice"}
                        onChange={handleChange("organizer-invoice")}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          sx={{
                            flexDirection: "row-reverse",
                            borderBottom:
                              expanded === "organizer-invoice"
                                ? "1px solid #0000001f"
                                : 0,
                          }}
                        >
                          <Typography> {"Vendor Invoice Request"} </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Invoice
                            data={invoice}
                            state={{
                              ...state,
                              isBookingCancelled: isBookingCancelled,
                            }}
                            toVendor={true}
                          />
                        </AccordionDetails>
                      </Accordion>
                    ) : (
                      ""
                    )}
                    {invoiceHistory?.find(
                      (item: any) =>
                        item.event == INVOICE_STATUS.INVOICE_APPROVED,
                    ) ? (
                      <Accordion
                        elevation={0}
                        disableGutters={true}
                        square
                        sx={{
                          boxShadow: "none",
                        }}
                        expanded={expanded === "organizer-invoice-client"}
                        onChange={handleChange("organizer-invoice-client")}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          sx={{
                            flexDirection: "row-reverse",
                            borderBottom:
                              expanded === "organizer-invoice-client"
                                ? "1px solid #0000001f"
                                : 0,
                          }}
                        >
                          <Typography> {"Invoice to Client"} </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Invoice
                            data={invoice}
                            state={{
                              ...state,
                              isBookingCancelled: isBookingCancelled,
                            }}
                            toClient={true}
                            setAlertMsg={setAlertMsg}
                            setAlertType={setAlertType}
                          />
                        </AccordionDetails>
                      </Accordion>
                    ) : (
                      ""
                    )}
                    {creditNote && creditNote.length != 0 ?
                      <Accordion
                        elevation={0}
                        disableGutters={true}
                        square
                        sx={{
                          boxShadow: "none",
                        }}
                        expanded={expanded === "organizer-credit-note"}
                        onChange={handleChange("organizer-credit-note")}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          sx={{
                            flexDirection: "row-reverse",
                            borderBottom:
                              expanded === "organizer-invoice-client"
                                ? "1px solid #0000001f"
                                : 0,
                          }}
                        >
                          <Typography> {"Credit Note"} </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Invoice
                            data={invoice}
                            state={{
                              ...state,
                              isBookingCancelled: isBookingCancelled,
                            }}
                            creditNoteData={creditNote}
                            toCreditNote={true}
                          />
                        </AccordionDetails>
                      </Accordion>
                      : ""}
                    {tripHistory?.find(
                      (item: any) => item.event == TRIP_STATUS.COMPLETED,
                    ) ? (
                      <Accordion
                        elevation={0}
                        disableGutters={true}
                        square
                        sx={{
                          boxShadow: "none",
                        }}
                        expanded={expanded === "organizer-trip_timeline"}
                        onChange={handleChange("organizer-trip_timeline")}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          sx={{
                            flexDirection: "row-reverse",
                            borderBottom:
                              expanded === "organizer-trip_timeline"
                                ? "1px solid #0000001f"
                                : 0,
                          }}
                        >
                          <Typography> {"Trip Timeline"} </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Timeline
                            sx={{
                              [`& .${timelineOppositeContentClasses.root}`]: {
                                flex: 0.25,
                              },
                            }}
                          >
                            {renderTripTimeLine()}
                            {renderInvoiceTimeLine()}
                          </Timeline>
                        </AccordionDetails>
                      </Accordion>
                    ) : (
                      ""
                    )}
                  </div>
                ) : bookingtype == "cab" ? (
                  <div className="flex flex-col md:flex-row w-full md:py-5 md:px-2 md:justify-between">
                    <div className="md:ml-10">
                      {optimalRoute?.optimal_route?.length > 0 ? (
                        <MapImg
                          key={optimalRoute?.vendor}
                          route={optimalRoute?.optimal_route}
                          state={optimalRoute ? optimalRoute : ""}
                          vendor={optimalRoute?.vendor}
                        />
                      ) : (
                        <div
                          className="md:ml-10"
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: "#f5f5f5",
                            padding: "10px",
                            height: 350,
                            width: 400,
                          }}
                        >
                          {state?.travel_mode == "rental"
                            ? "Map view is not available for Rental cabs"
                            : vendors?.length > 0
                              ? "Select city and vendor name to view the map"
                              : "No Vendor found in this city"}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col max-h-fit w-72 mr-10">
                      <FormControl
                        sx={{ m: 1, width: "100%", maxWidth: 300 }}
                        size="small"
                      >
                        <FormHelperText>{"Choose City"}</FormHelperText>
                        <Select
                          labelId="select-vendor-City"
                          id="select-vendor-city"
                          value={selectedCityId}
                          sx={{ marginTop: 1 }}
                          onChange={handleCitySelect}
                        >
                          {/* <MenuItem value="">
                            <em>None</em>
                          </MenuItem> */}
                          {cityOptions?.map((city: any) => (
                            <MenuItem key={city.id} value={city.id}>
                              {city.city}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl
                        sx={{ m: 1, width: "100%", maxWidth: 300 }}
                        size="small"
                      >
                        <FormHelperText>{"Choose Vendor"}</FormHelperText>
                        <Select
                          disabled={!cityOptions}
                          labelId="select-vendor-label"
                          id="select-vendor"
                          value={selectedVendor}
                          sx={{ marginTop: 1 }}
                          onChange={handleVendorSelect}
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {renderMenuItem(vendors, "id", "name")}
                        </Select>
                      </FormControl>
                      <FormControl
                        sx={{ m: 1, width: "100%", maxWidth: 300 }}
                        size="small"
                      >
                        <FormHelperText>{"Choose Garage"}</FormHelperText>
                        <Select
                          disabled={!cityOptions}
                          labelId="select-garage-label"
                          id="select-garage"
                          value={selectedGarage}
                          sx={{ marginTop: 1 }}
                          onChange={handleGarageSelect}
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {renderMenuItem(
                            vendors?.find(
                              (vendor: any) => vendor.id === selectedVendor,
                            )?.garage_locations || [],
                            "id",
                            "title",
                          )}
                        </Select>
                      </FormControl>
                      <FormControl
                        sx={{ m: 1, width: "100%", maxWidth: 300 }}
                        size="small"
                      >
                        <FormHelperText>{"Choose Package"}</FormHelperText>
                        <Select
                          disabled={!cityOptions}
                          labelId="select-plan-label"
                          id="select-plan"
                          value={selectedPlan}
                          sx={{ marginTop: 1 }}
                          onChange={handlePlanSelect}
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {renderMenuItem(
                            vendors?.find(
                              (vendor: any) => vendor.id === selectedVendor,
                            )?.plans || [],
                            "plan_id",
                            "name",
                          )}
                        </Select>
                      </FormControl>
                      <FormControl
                        sx={{ m: 1, width: "100%", maxWidth: 300 }}
                        size="small"
                      >
                        <FormHelperText>{"Choose Vehicle"}</FormHelperText>
                        <Select
                          disabled={!cityOptions}
                          labelId="select-vehicle-label"
                          id="select-vehicle"
                          value={selectedVehicle}
                          sx={{ marginTop: 1 }}
                          onChange={handleVehicleSelect}
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {renderMenuItem(
                            vendors
                              ?.find(
                                (vendor: any) => vendor.id === selectedVendor,
                              )
                              ?.plans.find(
                                (plan: any) => plan.plan_id === selectedPlan,
                              )?.vehicles || [],
                            "id",
                            "name",
                          )}
                        </Select>
                      </FormControl>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row w-full md:py-5 md:px-2 md:justify-between">
                    <div className="flex justify-center items-center gap-10 h-96">
                      {addedVendors.length != 0 ? (
                        <div className="flex flex-col justify-center m-4 gap-10">
                          <Typography>
                            List of eligible Hotels added for this booking
                          </Typography>
                          <div>
                            <Typography
                              fontStyle={"italic"}
                              fontWeight={"fontWeightBold"}
                            >
                              Preferred Hotels
                            </Typography>
                            {addedVendors?.map((item: any) =>
                              !item?.vendor?.is_third_party ? (
                                <Typography>{item?.vendor?.name}</Typography>
                              ) : (
                                ""
                              ),
                            )}
                          </div>
                          <div>
                            <Typography
                              fontStyle={"italic"}
                              fontWeight={"fontWeightBold"}
                            >
                              Third-party Hotels
                            </Typography>
                            {addedVendors?.map((item: any) =>
                              item?.vendor?.is_third_party ? (
                                <Typography>{item?.vendor?.name}</Typography>
                              ) : (
                                ""
                              ),
                            )}
                          </div>
                        </div>
                      ) : (
                        <Typography>Hotels yet to be added</Typography>
                      )}
                    </div>
                    <div className="flex flex-col justify-center items-center gap-20">
                      <Typography>
                        Select all hotels eligible for this booking (Request
                        will be sent to Preferred hotels only)
                      </Typography>
                      <FormControl size="small" sx={{ minWidth: 250 }}>
                        <InputLabel id="package_label">
                          {"Select Hotel"}
                        </InputLabel>
                        <Select
                          id="package_label"
                          className="mb-4"
                          value={selectedHotelVendor}
                          label={"Select Hotel"}
                          onChange={(e: any) =>
                            setSelectedHotelVendor(e.target.value)
                          }
                        >
                          <MenuItem value="">{"None"}</MenuItem>
                          {vendors.map((item: any, index: number) => {
                            const selected = addedVendors?.find(
                              (vendor: any) => item.id == vendor?.vendor?.id,
                            );
                            return (
                              <MenuItem
                                key={index}
                                value={item["id"]}
                                disabled={selected ? true : false}
                              >
                                {item["name"]}
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </FormControl>
                    </div>
                  </div>
                )}
                <div
                  className={`${bookingtype == "hotel" ? "flex justify-between" : ""
                    }`}
                >
                  {isVendor == "false" &&
                    bookingtype == "hotel" &&
                    bookingData &&
                    bookingData[0]?.status != "pending" && (
                      <div className={`px-2 pb-5`}>
                        <Fab
                          size="large"
                          color="secondary"
                          onClick={(
                            event: React.MouseEvent<HTMLButtonElement>,
                          ) => setAnchorEl(event.currentTarget)}
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
                              //overflowY: 'auto'
                            }}
                            className="m-3"
                          >
                            <Chat
                              bookingId={state.id}
                              bookingType={bookingtype}
                              bookingData={bookingData[0]}
                              currentUser={{
                                role: "organizer",
                                name: userName,
                                email: userEmail,
                              }}
                            />
                          </div>
                        </Popover>
                      </div>
                    )}
                  {bookingData?.vendor_id == null &&
                    state?.vendor?.id == null &&
                    !isBookingCancelled && (
                      <div
                        className={`flex px-2 pb-5 w-full ${goToVendorSelection
                          ? "justify-between"
                          : "justify-end"
                          }`}
                      >
                        {goToVendorSelection ? (
                          <Button variant="outlined" onClick={handleBack}>
                            {"Back"}
                          </Button>
                        ) : disableAssignButton ? (
                          <Typography
                            className="absolute bottom-10 left-72"
                            fontSize={18}
                            color={"indianred"}
                          >
                            ** Inorder to assign a vendor, please
                            {isSuperOrganizer == "0"
                              ? " contact Admin to"
                              : ""}{" "}
                            create vendor and plan details
                          </Typography>
                        ) : null}
                        {!goToVendorSelection ? (
                          <Button
                            variant="contained"
                            disableElevation
                            disabled={disableAssignButton || isComplete}
                            onClick={() => {
                              handleAssignVendor();
                            }}
                          >
                            {bookingtype == "cab"
                              ? "Assign Vendor"
                              : "Select eligible Hotels"}
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            disableElevation
                            disabled={
                              bookingtype == "cab"
                                ? !(
                                  cityOptions &&
                                  selectedVendor &&
                                  selectedGarage &&
                                  selectedPlan &&
                                  selectedVehicle
                                )
                                : !selectedHotelVendor
                            }
                            onClick={() => {
                              handleSendRequest();
                            }}
                          >
                            {bookingtype == "cab"
                              ? "Send Request"
                              : "Add hotel"}
                          </Button>
                        )}
                      </div>
                      // {/* </div> */}
                    )}

                  {/* {(bookingData?.vendor_id != null || state?.vendor != null) &&
                    !isBookingCancelled && (
                      <div
                        className={`flex px-2 pb-5 
                  justify-end`}
                      >
                        <Button
                          variant="contained"
                          color="error"
                          disabled={
                            tripHistory.length > 0 ||
                            isRevokeVendor ||
                            hotelInvoiceData?.id
                          }
                          startIcon={<SyncIcon />}
                          disableElevation
                          onClick={() => {
                            // handleRevokeVendor();
                          }}
                        >
                          {"Revoke Vendor"}
                        </Button>
                      </div>
                    )} */}
                </div>
              </div>
            ) : (
              <div>
                {driver?.name ? (
                  <div className="grid grid-cols-4 my-10 px-2 justify-between content-between">
                    <div className="flex flex-col">
                      <span className="font-normal text-lg">
                        {"Driver Name"}
                      </span>
                      <span className="text-sm font-normal">
                        {driver?.name}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-normal text-lg">
                        {"Driver Primary Number"}
                      </span>
                      <span className="text-sm font-normal">
                        {driver?.primary_mobile}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-normal text-lg">
                        {"Driver Secondary Number"}
                      </span>
                      <span className="text-sm font-normal">
                        {driver?.secondary_mobile}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-normal text-lg">
                        {"Cab Number"}
                      </span>
                      <span className="text-sm font-normal">
                        {driver?.vehicle_no}
                      </span>
                    </div>
                  </div>
                ) : (
                  ""
                )}

                {vendorPackage ? (
                  <Accordion
                    elevation={0}
                    disableGutters={true}
                    sx={{
                      boxShadow: "none",
                    }}
                    expanded={expanded === "package-details"}
                    onChange={handleChange("package-details")}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        flexDirection: "row-reverse",
                        borderBottom:
                          expanded === "package-details"
                            ? "1px solid #0000001f"
                            : 0,
                      }}
                    >
                      <Typography> {"Package Details"} </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <div
                        className={`flex w-full py-5 px-2 flex-col md:flex-row ${state?.travel_mode == "standard"
                          ? "justify-between"
                          : "justify-center"
                          }`}
                      >
                        {state?.travel_mode == "standard" ? (
                          <div className="ml-10">
                            {optimalRoute?.optimal_route?.length > 0 && (
                              <MapImg
                                key={optimalRoute?.vendor}
                                route={optimalRoute?.optimal_route}
                                state={optimalRoute ? optimalRoute : ""}
                                vendor={optimalRoute?.vendor}
                              />
                            )}
                          </div>
                        ) : (
                          ""
                        )}
                        <div className="flex flex-col max-h-fit w-72 mr-10 mt-32">
                          <div className="flex flex-row items-center">
                            <span className="font-normal text-lg mr-4">
                              {"Package : "}
                            </span>
                            <span className="text-lg font-normal">
                              {vendorPackage
                                ? vendorPackage[0].package_name
                                : ""}
                            </span>
                          </div>
                          <div className="flex flex-row items-center mt-5">
                            <span className="font-normal text-lg mr-4">
                              {"Vehicle : "}
                            </span>
                            <span className="text-lg font-normal">
                              {vendorPackage
                                ? vendorPackage[0].vehicle_name
                                : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    </AccordionDetails>
                  </Accordion>
                ) : (
                  ""
                )}
                {bookingtype == "hotel" &&
                  !isBookingCancelled &&
                  !isComplete &&
                  bookingHistory.find(
                    (item: any, index: number) =>
                      item.event == BOOKING_STATUS.VENDOR_ACCEPTED &&
                      index == bookingHistory.length - 1,
                  ) ? (
                  <Accordion
                    elevation={0}
                    disableGutters={true}
                    square
                    sx={{
                      boxShadow: "none",
                    }}
                    expanded={expanded === "confirm-booking"}
                    onChange={handleChange("confirm-booking")}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        flexDirection: "row-reverse",
                        borderBottom:
                          expanded === "confirm-booking"
                            ? "1px solid #0000001f"
                            : 0,
                      }}
                    >
                      <Typography> {"Confirm booking"} </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <ConfirmBooking
                        isComplete={isComplete}
                        setIsComplete={setIsComplete}
                        state={state}
                      />
                    </AccordionDetails>
                  </Accordion>
                ) : (
                  ""
                )}
                {bookingtype == "hotel" &&
                  (state?.status == BOOKING_STATUS.CONFIRMED ||
                    state?.status == BOOKING_STATUS.CANCELLED ||
                    state?.status == BOOKING_STATUS.INVOICE_CREATED ||
                    state?.status ==
                    BOOKING_STATUS.INVOICE_CREATED_BY_ORGANIZER ||
                    state?.status ==
                    BOOKING_STATUS.INVOICE_CREATED_BY_SUPER_ORGANIZER) && (
                    <Accordion
                      elevation={0}
                      disableGutters={true}
                      square
                      sx={{
                        boxShadow: "none",
                      }}
                      expanded={expanded === "hotel-invoice"}
                      onChange={handleChange("hotel-invoice")}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          flexDirection: "row-reverse",
                          borderBottom:
                            expanded === "hotel-invoice"
                              ? "1px solid #0000001f"
                              : 0,
                        }}
                      >
                        <Typography> {"Invoice"} </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <HotelVendorInvoice bookingId={state?.id} />
                      </AccordionDetails>
                    </Accordion>
                  )}
                {guests && <Accordion
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
                        expanded === "guest-details"
                          ? "1px solid #0000001f"
                          : 0,
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
                      tableData={guests}
                      isPaginated={true}
                    />
                  </AccordionDetails>
                </Accordion>}

                {tripHistory?.find(
                  (item: any) =>
                    item.event == TRIP_STATUS.COMPLETED && invoice.length != 0,
                ) ||
                  (isBookingCancelled && state.vendor) ? (
                  <Accordion
                    elevation={0}
                    disableGutters={true}
                    square
                    sx={{
                      boxShadow: "none",
                    }}
                    expanded={expanded === "invoice"}
                    onChange={handleChange("invoice")}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        flexDirection: "row-reverse",
                        borderBottom:
                          expanded === "invoice" ? "1px solid #0000001f" : 0,
                      }}
                    >
                      <Typography> {"Invoice"} </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Invoice
                        data={invoice}
                        state={{
                          ...state,
                          isBookingCancelled: isBookingCancelled,
                        }}
                        setAlertMsg={setAlertMsg}
                        setAlertType={setAlertType}
                      />
                    </AccordionDetails>
                  </Accordion>
                ) : (
                  ""
                )}
                {tripHistory?.find(
                  (item: any) => item.event == TRIP_STATUS.COMPLETED,
                ) ? (
                  <Accordion
                    elevation={0}
                    disableGutters={true}
                    square
                    sx={{
                      boxShadow: "none",
                    }}
                    expanded={expanded === "trip_timeline"}
                    onChange={handleChange("trip_timeline")}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        flexDirection: "row-reverse",
                        borderBottom:
                          expanded === "trip_timeline"
                            ? "1px solid #0000001f"
                            : 0,
                      }}
                    >
                      <Typography> {"Trip Timeline"} </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Timeline
                        sx={{
                          [`& .${timelineOppositeContentClasses.root}`]: {
                            flex: 0.25,
                          },
                        }}
                      >
                        {renderTripTimeLine()}
                        {renderInvoiceTimeLine()}
                      </Timeline>
                    </AccordionDetails>
                  </Accordion>
                ) : (
                  ""
                )}
                {isManual &&
                  (state.status == BOOKING_STATUS.DRIVER_ASSIGNED ||
                    state.status == BOOKING_STATUS.DRIVER_REASSIGNED ||
                    state.status == BOOKING_STATUS.INVOICE_CREATED ||
                    state.status == BOOKING_STATUS.INVOICE_REJECTED) ? (
                  <ManualTripEnd state={state} />
                ) : (
                  ""
                )}
                {!isBookingCancelled && (
                  <div className=" grid justify-items-center">
                    <div className="mr-6">
                      {!edit && (
                        <Button
                          variant="contained"
                          color="success"
                          sx={{
                            m: 2,
                            bgcolor: "#02ca72",
                            display: disable ? "none" : "",
                          }}
                          onClick={handleAccept}
                        >
                          Accept
                        </Button>
                      )}
                      {!edit && (
                        <Button
                          variant="contained"
                          color="error"
                          disabled={disable}
                          sx={{ m: 2, bgcolor: "#e2302d" }}
                          onClick={() => setOpen(true)}
                        >
                          Decline
                        </Button>
                      )}
                      <Dialog onClose={() => setOpen(false)} open={open}>
                        <DialogTitle>Enter reason for declining</DialogTitle>
                        <TextField
                          id="reason"
                          label="Comments"
                          InputProps={{ className: "m-3" }}
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                        />
                        <Button
                          variant="contained"
                          color="error"
                          sx={{ m: 2 }}
                          onClick={handleDecline}
                        >
                          Decline
                        </Button>
                      </Dialog>
                      {!(
                        isManual &&
                        (state.status == BOOKING_STATUS.DRIVER_ASSIGNED ||
                          state.status == BOOKING_STATUS.DRIVER_REASSIGNED)
                      ) &&
                        edit &&
                        tripHistory.length == 0 &&
                        bookingtype == "cab" && (
                          <Button
                            variant="contained"
                            color="primary"
                            sx={{ m: 2 }}
                            onClick={handleEdit}
                          >
                            {status == BOOKING_STATUS.VENDOR_ACCEPTED
                              ? "Add Driver Details"
                              : "Edit Driver Details"}
                          </Button>
                        )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <Loading times={5} />
      )}
    </div>
  );
}

export default BookingDetail;
