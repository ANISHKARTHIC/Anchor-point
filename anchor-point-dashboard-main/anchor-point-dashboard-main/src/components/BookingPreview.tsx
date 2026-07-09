import { Button } from "@mui/material"
import MenuBookIcon from '@mui/icons-material/MenuBook';
import DriveEtaIcon from '@mui/icons-material/DriveEta';
import PersonIcon from '@mui/icons-material/Person';
import InventoryIcon from '@mui/icons-material/Inventory';
import TimelineIcon from '@mui/icons-material/Timeline';
import { useEffect, useState } from "react";
import { TimelineConnector, TimelineContent, TimelineDot, TimelineItem, TimelineOppositeContent, TimelineSeparator } from "@mui/lab";
import { BASE_URL, BOOKING_STATUS } from "../constants/string";
import { formatDate } from "../utils/utils";
import { useNavigate } from "react-router-dom";
import { ROUTE } from "../constants/routes";


function BookingPreview({selected}:any) {

    const [booking,setBooking] = useState<any>({})
    const [bookingHistory,setBookingHistory] = useState([])
    const navigate = useNavigate()
    const isVendor = localStorage.getItem("isVendor")
    const bookingtype = localStorage.getItem("bookingtype")

    useEffect(()=>{
        setBooking(selected)
        const fetchData = async()=>{
            const bookingHistoryResponse = await fetch(
              `${BASE_URL}/${bookingtype == "cab" ? "bookings" : "hotel_bookings"}/${selected?.id}/history`,
              {
                method: "GET",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + localStorage.getItem("userToken"),
                },
              },
            );
            if(bookingHistoryResponse.ok) {
                const bookingHistoryData = await bookingHistoryResponse.json();
                setBookingHistory( bookingtype == "cab" ? bookingHistoryData?.booking_history : bookingHistoryData?.hotel_booking_history);
            } else {
              setBookingHistory([])
            }
        }
        isVendor == "false" && selected?.id ? fetchData() : ""
    },[selected?.id])


    const renderTimeLineItem = (
        eventTime: string,
        eventStatement: string,
        renderTime = true,
        isUpcomingAction = false,
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
            </TimelineContent>
            </TimelineItem>
        );
    };
    
    const renderTimeLine = () => {
        return bookingHistory.map((history: any) => {
          switch (history.event) {
            case BOOKING_STATUS.PENDING:
              return renderTimeLineItem(
                history.created_at,
                `New booking received from ${
                  history.metadata.coordinator_name
                } for the date ${bookingtype == "cab" ? booking?.pickup_date : booking?.check_in}`,
              );
    
            case BOOKING_STATUS.ORGANIZER_ASSIGNED:
              return renderTimeLineItem(
                history.created_at,
                `${history.metadata.organizer_name} has been assigned for this booking request`,
              );
    
            case BOOKING_STATUS.VENDOR_REQUESTED:
              return renderTimeLineItem(
                history.created_at,
                `${history.metadata.organizer_name} has requested vendor ${history.metadata.vendor_name} ${bookingtype == "cab" ? "for the package " : ""}${bookingtype == "cab" ? history.metadata.plan_name : ""}`,
              );
    
            case BOOKING_STATUS.VENDOR_ACCEPTED:
              return renderTimeLineItem(
                history.created_at,
                `The booking request has been accepted by vendor ${history.metadata.vendor_name}`,
              );
    
            case BOOKING_STATUS.VENDOR_REVOKED:
              return renderTimeLineItem(
                history.created_at,
                `The booking request has been revoked by organizer ${history.metadata.organizer_name}`,
              );
    
            case BOOKING_STATUS.VENDOR_DECLINED:
              return renderTimeLineItem(
                history.created_at,
                `Vendor ${history.metadata.vendor_name} has been declined the booking request`,
              );
            case BOOKING_STATUS.CONFIRMED:
              return renderTimeLineItem(
                history.created_at,
                `The booking has been confirmed. Confirmation no:${history.metadata?.confirmation_no}`,
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
                `The booking has been cancelled`,
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

    return(
      <div>
        {(selected?.status != BOOKING_STATUS.VENDOR_REASSIGNED && isVendor == "true") || (isVendor == "false") 
          ? <div className="flex-col h-[580px] 2xl:h-[80%] items-center justify-between overflow-y-auto">
            <div className="flex flex-col items-end justify-end underline text-blue-400"> 
                <Button color="info" size="small" onClick={()=>window.open(`..${ROUTE.HOME}/${ROUTE.BOOKING}/${selected.bid}`)}>View detailed info</Button>
            </div>
            <div className=" w-full ">
            {booking? <div className=" bg-white">
                <div className="m-2 font-bold text-sky-800">
                    <span><MenuBookIcon/> Booking</span>
                </div>
                <div className="flex flex-wrap  my-3 mx-4 justify-around">
                    <div className="flex flex-col">
                        <span className="italic font-semibold">BID</span>
                        <span>{booking?.bid}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="italic font-semibold">{bookingtype == "cab" ? "PickupDate" : "Check-in Date"}</span>
                        {bookingtype == "cab" 
                          ? <span>{booking?.pickup_date? formatDate(booking?.pickup_date) : ""}</span>
                          : <span>{booking?.check_in}</span>}
                    </div>
                    <div className="flex flex-col">
                        <span className="italic font-semibold">{bookingtype == "cab" ? "PickupTime" : "Check-out Date"}</span>
                        {bookingtype == "cab" 
                          ? <span>{booking?.pickup_time}</span>
                          : <span>{booking?.check_out}</span>}
                    </div>
                    {bookingtype == "cab" && <div className="flex flex-col">
                        <span className="italic font-semibold">CarType</span>
                        <span>{booking?.cab_type}</span>
                    </div>}
                    {bookingtype == "hotel" && <div className="flex flex-col">
                        <span className="italic font-semibold">No of Adults</span>
                        <span>{booking?.no_of_adults}</span>
                    </div>}
                    {bookingtype == "hotel" && <div className="flex flex-col">
                        <span className="italic font-semibold">No of Rooms</span>
                        <span>{booking?.no_of_rooms}</span>
                    </div>}
                </div>
                <div className="flex flex-wrap  my-3 mx-4 justify-around">
                  {(booking?.coordinator?.name && isVendor == "false")? <div className="flex flex-col">
                      <span className="italic font-semibold">Requested by</span>
                      <span>{booking?.coordinator?.name}</span>
                  </div> : ""}
                  {booking?.organizer?.name? <div className="flex flex-col">
                      <span className="italic font-semibold">Organizer Assigned</span>
                      <span>{booking?.organizer?.name}</span>
                  </div> : ""}
                  {booking?.po_number ? <div className="flex flex-col">
                      <span className="italic font-semibold">PO Number</span>
                      <span>{booking?.po_number}</span>
                  </div> : ""}
                </div>
            </div>: ""}
            {booking?.plan? <div className=" bg-white">
                <div className=" m-2 font-bold text-sky-800">
                    <span><InventoryIcon/> Plan</span>
                </div>
                <div className="flex flex-wrap  my-3 mx-4 justify-around">
                    <div className="flex flex-col">
                        <span className="italic font-semibold">Package Name</span>
                        <span>{booking?.plan?.package?.name}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="italic font-semibold">Vehicle Name</span>
                        <span>{booking?.plan?.vehicle?.name}</span>
                    </div>
                </div>
            </div> : ""}
            {(booking?.vendor && isVendor == "false")? <div className=" bg-white">
                <div className=" m-2 font-bold text-sky-800">
                    <span><PersonIcon/> Vendor</span>
                </div>
                <div className="flex flex-wrap  my-3 mx-4 justify-around">
                    <div className="flex flex-col">
                        <span className="italic font-semibold">Name</span>
                        <span>{booking?.vendor?.name}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="italic font-semibold">Mobile</span>
                        <span>{booking?.vendor?.primary_mobile}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="italic font-semibold">Email</span>
                        <span>{booking?.vendor?.email}</span>
                    </div>
                </div>
            </div> : ""}
            {booking?.driver? <div className=" bg-white">
                <div className=" m-2 font-bold text-sky-800">
                    <span><DriveEtaIcon/> Driver</span>
                </div>
                <div className="flex flex-wrap  my-3 mx-4 justify-around">
                    <div className="flex flex-col">
                        <span className="italic font-semibold">Name</span>
                        <span>{booking?.driver?.name}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="italic font-semibold">Mobile</span>
                        <span>{booking?.driver?.primary_mobile}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="italic font-semibold">Vehicle No</span>
                        <span>{booking?.driver?.vehicle_no}</span>
                    </div>
                </div>
            </div> : ""}
            {(bookingHistory?.length != 0 && isVendor == "false")? <div className=" bg-white mb-2">
                <div className=" m-2 font-bold text-sky-800">
                    <span><TimelineIcon/> Booking Timeline</span>
                </div>
                {renderTimeLine()}
                    {bookingHistory.length
                        ? renderCurrentStatusTimeLineItem()
                        : null}
            </div> : ""}
            </div>
        </div> : <div>
          <span className=" font-bold text-lg">{selected?.meta_data?.message}</span>
        </div>}
    </div>
  )
}

export default BookingPreview