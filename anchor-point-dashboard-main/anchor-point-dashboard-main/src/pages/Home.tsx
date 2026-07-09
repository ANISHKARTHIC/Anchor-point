/* eslint-disable @typescript-eslint/no-explicit-any */
import { requestPermission } from "../firebase";
//@ts-ignore
import Arrow from "../assets/arrowRight.svg?react";
import Pagination from "@mui/material/Pagination";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useState, useEffect } from "react";
import TaskSummary from "../containers/TaskSummary";
import RequestList from "../components/RequestList";
import {
  STRING_BOOKINGS_LIST,
  NEW_BOOKINGS_PAGINATION_LIMIT,
  BASE_URL,
  BOOKING_STATUS,
} from "../constants/string";
import { useNavigate } from "react-router-dom";
import { ROUTE } from "../constants/routes";
import { useSelector } from "react-redux";

function Home() {
  const count = useSelector((state: any) => state.pending);

  const [page, setPage] = useState(1);
  const [requests, setRequests] = useState<any>();
  const [totalPages, setTotalPages] = useState();
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [isTokenFound, setTokenFound] = useState(false);
  const [pendingInvoices, setPendingInvoices] = useState<any>([]);
  const bookingtype = localStorage.getItem("bookingtype");

  const navigate = useNavigate();

  const getBookings = async () => {
    try {
      const response = await fetch(
        bookingtype == "cab"
        ? `${BASE_URL}/organizers/bookings?status=pending&limit=${NEW_BOOKINGS_PAGINATION_LIMIT}&page=${page}`
        : `${BASE_URL}/hotel_bookings/?status=pending&limit=${NEW_BOOKINGS_PAGINATION_LIMIT}&page=${page}`,
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
        throw new Error("Error fetching pending bookings");
      }
      setRequests(data?.bookings);
      setTotalPages(data?.total_pages);
      setTotalRecords(data?.total_records);
      return data;
    } catch (error) {
      console.log("Error:", error);
    }
  };

  useEffect(() => {
    localStorage.getItem("isVendor") == "true" ? navigate(ROUTE.TASKS) : "";
    getBookings();
  }, [page]);

  useEffect(() => {

    requestPermission(setTokenFound);

    const getPendingInvoices = async () => {
      try {
        const user_id = localStorage.getItem("userID");
        const response = await fetch(
          `${BASE_URL}/organizers/${user_id}/invoice/invoice_created`,
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
          throw new Error("Error fetching pending invoices");
        }
        setPendingInvoices(data.invoices);
      } catch (error) {
        console.log("Error:", error);
      }
    };
    bookingtype == "cab" ? getPendingInvoices() : "";
  }, []);

  const handleNewRequests = () => {
    location.reload();
  };

  return (
    <>
      <div className="h-[calc(100vh-64px)] flex-col justify-around w-full bg-appBg pt-2 lg:pt-0">
        <div className="flex flex-col bg-white rounded-md px-3 pt-4 pb-6  mb-8 m-6">
          <TaskSummary />
        </div>
        <div className="flex w-full justify-around">
          <div className="w-[55%] ">
            <div className="flex justify-between items-center mb-3">
              <div className="font-bold text-base">
                {STRING_BOOKINGS_LIST.OPEN_REQUESTS}{" "}
                <span className="text-tertiary">
                  ({totalRecords + count.value})
                </span>
              </div>
              {count.value > 0 && (
                <div
                  className="text-xs font-semibold p-2 rounded-3xl text-white bg-primary"
                  onClick={handleNewRequests}
                >
                  <RefreshIcon fontSize="small" className="mr-1" />
                  {STRING_BOOKINGS_LIST.NEW_REQUESTS}{" "}
                  <span>({JSON.stringify(count.value)})</span>
                </div>
              )}
            </div>

            <div className="">
              <div className="h-80 overflow-y-scroll p-2">
                {requests?.map((request: any) => (
                  <RequestList
                    booking={request}
                    requests={requests}
                    setRequests={setRequests}
                    requestType={"newRequest"}
                    navigatedFrom={ROUTE.HOME}
                  />
                ))}
              </div>
              <div className="md:flex md:justify-end py-4">
                <Pagination
                  count={totalPages}
                  shape="rounded"
                  sx={{ color: "#21539E" }}
                  onChange={(event, pageNo) => {
                    setPage(pageNo);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="m-2 overflow-y-auto">
            {pendingInvoices.length != 0 ? (
              <div>
                <div className="font-bold text-base mb-3 ">
                  {"Pending Invoices"}
                </div>
                {pendingInvoices?.map((request: any) => (
                  <RequestList
                    booking={{
                      ...request.booking,
                      pendingInvoice: true,
                      vendor: request.vendor,
                    }}
                    requestType={"invoiceRequest"}
                    navigatedFrom={ROUTE.HOME}
                  />
                ))}
              </div>
            ) : (
              ""
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
