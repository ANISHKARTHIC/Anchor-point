import { useState, useEffect } from "react";
import React from "react";
import CustomCard from "../components/Card";
import cabRequest from "../assets/cabRequest.svg";
import awaiting from "../assets/Awaiting.svg";
import declined from "../assets/Declined.svg";
import assigned from "../assets/Assigned.svg";
import {
  BOOKING_STATUS,
  BASE_URL,
  STRING_HOME,
} from "../constants/string";
import { getCollectionName, getCurrAndTomoDate, getCurrentAnd24HrsTimeStamp } from "../utils/utils";
import { useNavigate } from "react-router-dom";
import { ROUTE } from "../constants/routes";
import RefreshIcon from '@mui/icons-material/Refresh';
import { IconButton } from "@mui/material";
import { collection, onSnapshot, query, where } from "firebase/firestore";

import db, { firebaseApp } from "../firebase";

function TaskSummary(props: any) {
  const bookingtype = localStorage.getItem("bookingtype");
  const [taskSummary, setTaskSummary] = useState<any>();
  const isVendor = localStorage.getItem("isVendor");
  const userRole = localStorage.getItem("role")
  const userEmail = localStorage.getItem("userEmail")
  const userID = parseInt(localStorage?.getItem("userID") as string);
  const navigate = useNavigate();
  const [today,tomorrow] = getCurrAndTomoDate()
  let url =
    isVendor == "true"
      ? bookingtype == "cab" ? `${BASE_URL}/vendors/${userID}/bookings` : `${BASE_URL}/vendors/hotel_bookings`
      : bookingtype == "cab" ? `${BASE_URL}/organizers/bookings` : `${BASE_URL}/hotel_bookings/`;
  let [timestampToday, timestampAfter24Hours] = getCurrentAnd24HrsTimeStamp();

  const [unreadMsgInfo, setUnreadMsgInfo] = useState<any>({});

  const getTaskSummary = async () => {
    [timestampToday, timestampAfter24Hours] = getCurrentAnd24HrsTimeStamp();
    try {
      const response = await fetch(
        bookingtype == "cab" ? `${BASE_URL}/bookings/${isVendor ==="true" ? "summary": "insights"}?`+
          `trip_from_timestamp=${encodeURIComponent(timestampToday)}&` +
          `trip_to_timestamp=${encodeURIComponent(timestampAfter24Hours)}&` +
          `role=${isVendor === "true" ? "vendor" : "organizer"}`
          : `${BASE_URL}/hotel_bookings/summary`,
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
        (response.status != 422 && response.status != 500) ? console.log("Error:",data) : "";
        throw new Error("Error fetching task summary");
      }     
      
      setTaskSummary(data);

      return;
    } catch (error) {
      console.log("Error:", error);
    }
  };

  useEffect(() => {
    getTaskSummary();
  }, []);
  useEffect(()=>{
    let unsubscribeUnReadCount:any
    if(isVendor!="true"&&userRole!="coordinator"&&bookingtype != "cab"){

      const usersRef = collection(db, getCollectionName("usersUnreadCounts"));
      let queryEmail = userRole==="coordinator"?userEmail:"admin@gmail.com"
      let queryRole = userRole==="coordinator"?"coordinator":"organizer"
      const queryUserUnread = query(
        usersRef,
        where("userId", "==", queryEmail),
        where("role", "==", queryRole),
      );
      unsubscribeUnReadCount = onSnapshot(
        queryUserUnread, // Use the query here if you're filtering, or just `usersCollection` for all docs
        (snapshot) => {
          if (snapshot.empty) {
            setUnreadMsgInfo(null);
            console.log("No unread documents found");
          } else {
            const docData = snapshot.docs.map((doc) => doc.data());
            setUnreadMsgInfo(docData[0]);
            //console.log("docData", docData);
          }
        },
        (err) => {
          console.log("Getting Unread Error", err);
        },
      );
    }
    return ()=>{
      if(unsubscribeUnReadCount){
        unsubscribeUnReadCount()
      }
    }
  },[])  
  const getTaskSummaryInfo = (eventType: string) => {
    const bookingEvents = taskSummary?.events || [];   
        
    const filteredEvent = bookingEvents.find(
      (bookingEvent: any) => bookingEvent.event === eventType,
    );     

    return filteredEvent ? filteredEvent?.event_bookings_count : 0;
  };

  const getTotalTasksAssigned = () => {
    const bookingEvents = taskSummary?.events || [];

    return bookingEvents
      .map((bookingEvent: any) => {
        return bookingEvent?.event_bookings_count;
      })
      .reduce((eventCountSum: number, eventCount: number) => {
        return eventCountSum + eventCount;
      }, 0);
  };
  const getBookingIds=()=>{
    return Object.keys(bookingtype=="cab"?unreadMsgInfo["cabbookings"]:unreadMsgInfo["hotelbookings"]).toString()
    // ${encodeURIComponent(JSON.stringify(Object.keys(bookingtype=="cab"?unreadMsgInfo["cabbookings"]:unreadMsgInfo["hotelbookings"])))}
  }
  return (
    <div>
      <div className="flex justify-between mb-4">
        <div className="text-base font-bold">{STRING_HOME.TASK_SUMMARY}<IconButton sx={{color: "black"}} onClick={()=>getTaskSummary()}><RefreshIcon/></IconButton></div>
        <div className="flex">
          <div className="hidden font-light italic text-sm md:block md:mr-5">
            {""}
          </div>
        </div>
      </div>
      <div className="flex w-full items-center">
        {isVendor == "true" ? (
          <div className="flex flex-wrap lg:flex-nowrap w-full items-center">
            <CustomCard
              cardIcon={cabRequest}
              cardEvent={bookingtype == "cab" ? "Trips in 24 hours" : "Tomorrow Check-in"}
              cardEventCount={taskSummary?.trips_scheduled_today || taskSummary?.tomorrow_check_ins || 0}
              handleUrlChange={() =>
                props?.handleUrlChange(
                  bookingtype == "cab" ? `${url}?pickup_start_datetime=${encodeURIComponent(
                    timestampToday,
                  )}&pickup_end_datetime=${encodeURIComponent(
                    timestampAfter24Hours,
                  )}` : `${url}?check_in_date_gte=${encodeURIComponent(today)}&check_in_date_lte=${encodeURIComponent(tomorrow)}`,
                )
              }
            />
            <CustomCard
              cardIcon={assigned}
              cardEvent={bookingtype == "cab" ? "Driver Assigned" : "Invoice - Yet to raise"}
              cardEventCount={
                bookingtype == "cab" 
                  ? getTaskSummaryInfo(BOOKING_STATUS.DRIVER_ASSIGNED) + getTaskSummaryInfo(BOOKING_STATUS.DRIVER_REASSIGNED)
                  : taskSummary?.pending_invoices
              }
              handleUrlChange={() =>
                props?.handleUrlChange(
                  bookingtype == "cab" ? `${url}?status=${BOOKING_STATUS.DRIVER_ASSIGNED}&pickup_start_datetime=${encodeURIComponent(
                    timestampToday,
                  )}&pickup_end_datetime=${encodeURIComponent(
                    timestampAfter24Hours,
                  )}` : `${url}?status=${BOOKING_STATUS.CONFIRMED}&check_out_date_lte=${encodeURIComponent(today)}`,
                )
              }
            />
            <CustomCard
              cardIcon={awaiting}
              cardEvent={bookingtype == "cab" ? "Accepted Bookings" : "Pending Confirmations"}
              cardEventCount={bookingtype == "cab" ? getTaskSummaryInfo(BOOKING_STATUS.VENDOR_ACCEPTED,) : taskSummary?.pending_booking_confirmations}
              handleUrlChange={() =>
                props?.handleUrlChange(
                  bookingtype == "cab" ? `${url}?status=${BOOKING_STATUS.VENDOR_ACCEPTED}&pickup_start_datetime=${encodeURIComponent(
                    timestampToday,
                  )}&pickup_end_datetime=${encodeURIComponent(
                    timestampAfter24Hours,
                  )}` : `${url}?status=${BOOKING_STATUS.VENDOR_ACCEPTED}&status=${BOOKING_STATUS.VENDOR_REQUESTED}&check_in_date_gte=${encodeURIComponent(today)}&vendor_booking_status=requested&vendor_booking_status=owned`,
                )
              }
            />
            {bookingtype == "cab" && <CustomCard
              cardIcon={cabRequest}
              cardEvent={"Total Booking Requests"}
              cardEventCount={taskSummary?.total_bookings_assigned || 0}
              handleUrlChange={() =>
                props?.handleUrlChange(
                  `${url}?pickup_start_datetime=${encodeURIComponent(
                    timestampToday,
                  )}`,
                )
              }
            />}
          </div>
        ) : (
          <div className="flex flex-wrap lg:flex-nowrap w-full items-center">
            <CustomCard
              cardIcon={cabRequest}
              cardEvent={bookingtype == "cab" ? "Pending Organizer Action" : "Tomorrow Check-in"}
              cardEventCount={bookingtype == "cab" ? getTaskSummaryInfo(
                BOOKING_STATUS.PENDING,
              ) :  taskSummary?.trips_scheduled_today || taskSummary?.tomorrow_check_ins || 0}
              handleUrlChange={() =>
                navigate(ROUTE.TASKS, {
                  state: {
                    url: `${url}?status=pending&status=vendor_declined&status=vendor_assign_revoked`,
                  },
                })
              }
            />
            {bookingtype == "cab" ? <CustomCard
              cardIcon={declined}
              cardEvent={"Pending Vendor Action"}
              cardEventCount={getTaskSummaryInfo(
                BOOKING_STATUS.VENDOR_REQUESTED,
              )}
              handleUrlChange={() =>
                navigate(ROUTE.TASKS, {
                  state: {
                    url: `${url}?status=vendor_requested`
                  },
                })
              }
            /> : ""}
            <CustomCard
              cardIcon={awaiting}
              cardEvent={bookingtype == "cab" ? "Pending Driver Assignment" : "Pending Confirmations"}
              cardEventCount={bookingtype == "cab" ? getTaskSummaryInfo(
                BOOKING_STATUS.VENDOR_ACCEPTED,
              ) : taskSummary?.pending_booking_confirmations}
              handleUrlChange={() =>
                navigate(ROUTE.TASKS, {
                  state: {
                    url: bookingtype == "cab" ? `${url}?status=vendor_accepted` : `${url}?status=${BOOKING_STATUS.PENDING}&status=${BOOKING_STATUS.ORGANIZER_ASSIGNED}&status=${BOOKING_STATUS.VENDOR_REQUESTED}&status=${BOOKING_STATUS.VENDOR_ACCEPTED}&status=${BOOKING_STATUS.VENDOR_DECLINED}&status=${BOOKING_STATUS.VENDOR_REVOKED}&check_in_date_gte=${encodeURIComponent(today)}`,
                  },
                })
              }
            />
            <CustomCard
              cardIcon={cabRequest}
              cardEvent={bookingtype == "cab" ? "Pending Vendor Invoice Approval" : "Pending Edit Requests"}
              cardEventCount={bookingtype == "cab" ? getTaskSummaryInfo(
                BOOKING_STATUS.INVOICE_CREATED,
              ) : taskSummary?.edit_requests}
              handleUrlChange={() =>
                navigate(ROUTE.TASKS, {
                  state: {
                    url: bookingtype == "cab" ? `${url}?status=invoice_created` : `${BASE_URL}/hotel_bookings/edit?`,
                  },
                })
              }
            />
            <CustomCard
              cardIcon={cabRequest}
              cardEvent={bookingtype == "cab" ? "Pending Client Invoice" : "Pending Edit Requests"}
              cardEventCount={bookingtype == "cab" ? getTaskSummaryInfo(
                BOOKING_STATUS.INVOICE_APPROVED,
              ) : taskSummary?.edit_requests}
              handleUrlChange={() =>
                navigate(ROUTE.TASKS, {
                  state: {
                    url: bookingtype == "cab" ? `${url}?status=invoice_approved` : `${BASE_URL}/hotel_bookings/edit?`,
                  },
                })
              }
            />
            { bookingtype != "cab" && unreadMsgInfo!=null && isVendor!="true" &&
                <CustomCard
                cardIcon={cabRequest}
                cardEvent={"Unread Messages"}
                cardEventCount={unreadMsgInfo?.totalUnreadCount>0?unreadMsgInfo?.totalUnreadCount:0}
                handleUrlChange={() =>{
                  if(unreadMsgInfo?.totalUnreadCount>0){
                    navigate(ROUTE.TASKS, {
                      state: {
                        url: bookingtype == "cab" ? ``: `${BASE_URL}/hotel_bookings/?booking_ids=${encodeURIComponent(getBookingIds())}`,
                        unReadMessage:bookingtype=="cab"?unreadMsgInfo["cabbookings"]:unreadMsgInfo["hotelbookings"]
                      },
                    })
                  }
                }
                }
              />
            }
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskSummary;
