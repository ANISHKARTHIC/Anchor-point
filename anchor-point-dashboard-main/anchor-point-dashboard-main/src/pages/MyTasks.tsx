import RequestList from "../components/RequestList";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../store/store";
import { myRequests } from "../store/features/tasksSlice";
import { BASE_URL, STRING_BOOKINGS_LIST } from "../constants/string";
import { useLocation } from "react-router-dom";
import { ROUTE } from "../constants/routes";
import { Box, Button } from "@mui/material";
import Pagination from "@mui/material/Pagination";
import RefreshIcon from "@mui/icons-material/Refresh";
import Loading from "../components/Loading.tsx";
import Filter from "../components/Filter";
import AddIcon from "@mui/icons-material/Add";
import TaskSummary from "../containers/TaskSummary.tsx";
import { currentDate } from "../utils/utils";
import { onMessageListener } from "../firebase";

function MyTasks() {
  const countVendor = useSelector((state: any) => state.pendingVendor);

  const dispatch = useDispatch<AppDispatch>();
  const { list } = useSelector((state: any) => state.tasks);
  const { state } = useLocation();
  const [filterStatus,setFilterStatus] = useState();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [updatedBooking, setUpdatedBooking] = useState();
  const [step, setStep] = useState<number>();

  const userRole = localStorage.getItem("role");

  // TODO It is better to move these variables to a useRef and initialise in useEffect.
  // In current case, it will initiate these values on each re-render which will in turn slow down the rendering.

  const now = currentDate();
  const userID = parseInt(localStorage?.getItem("userID") as string);
  const isVendor = localStorage.getItem("isVendor");
  const bookingtype = localStorage.getItem("bookingtype");
  let url =
    isVendor == "true"
      ? bookingtype == "cab" ? `${BASE_URL}/vendors/${userID}/bookings` : `${BASE_URL}/vendors/hotel_bookings`
      : bookingtype == "cab" ? `${BASE_URL}/organizers/${userID}/bookings`  : `${BASE_URL}/organizers/hotel_bookings`;
  const futureBookingsUrl = bookingtype == "cab" ? `${url}?pickup_start_date=${encodeURIComponent(now,)}` : `${url}?check_in_date_gte=${encodeURIComponent(now,)}`;
  const [currentUrl, setCurrentUrl] = useState(
    state ? state.url : futureBookingsUrl,
  );
  const [unReadMessagesCount,setUnReadMessagesCount] = useState(state ? state.unReadMessage!=null ? state.unReadMessage : null:null) 

  const formatURL = (obj: any) => {
    let filterUrl;
    if (obj.filter && obj.startDate && obj.endDate) {

      filterUrl = bookingtype == "cab" 
        ? `${url}?status=${obj.filter}&pickup_start_date=${encodeURIComponent(obj.startDate)}&pickup_end_date=${encodeURIComponent(obj.endDate)}`
        :  `${url}?status=${obj.filter}&check_in_date_gte=${encodeURIComponent(obj.startDate)}&check_in_date_lte=${encodeURIComponent(obj.endDate)}`

      setCurrentUrl(filterUrl);

    } else if (obj.filter || (obj.startDate && obj.endDate)) {

      obj.filter
        ? (filterUrl = futureBookingsUrl + "&" + "status" + "=" + obj.filter)
        : (filterUrl = bookingtype == "cab" 
          ? `${url}?pickup_start_date=${encodeURIComponent(obj.startDate)}&pickup_end_date=${encodeURIComponent(obj.endDate)}`
          :  `${url}?check_in_date_gte=${encodeURIComponent(obj.startDate)}&check_in_date_lte=${encodeURIComponent(obj.endDate)}`);

      setCurrentUrl(filterUrl);

    } else {
      filterUrl = futureBookingsUrl;
      setCurrentUrl(filterUrl);
    }
    return dispatch(myRequests({ url: filterUrl + `&page=${page}` }));
  };
  const onClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    dispatch(myRequests({ url: currentUrl + `&page=${page}` }));
  }, [page, currentUrl]);

  useEffect(() => {
    const fetchStatus = async() => {
      const statusResponse = await fetch(`${BASE_URL}/${bookingtype == "cab" ? "bookings" : "hotel_bookings"}/status `,{
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("userToken"),
          },
        });
  
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setFilterStatus(statusData)
        }
      }
    fetchStatus()
  }, []);

  const handleUrlChange = (url: string) => {
    setCurrentUrl(url);
  };

  const handleNewRequests = () => {
    location.reload();
  };

  onMessageListener()
    .then((payload) => {
      if (isVendor == "false" && payload.data.status == "vendor_accepted") {
        setUpdatedBooking(payload.data.booking_id);
        setStep(2);
      } else if (
        (isVendor == "false" && payload.data.status == "driver_assigned") ||
        "driver_reassigned"
      ) {
        setUpdatedBooking(payload.data.booking_id);
        setStep(3);
      }
    })
    .catch((err) => console.log("failed: ", err));
  
  return (
    <>
      <div
        className={`flex flex-col items-center w-full h-screen ${
          isVendor == "true" ? "bg-yellow-50" : "bg-appBg"
        }`}
      >
        <div className="flex flex-col mt-3 w-[95%]">
          {isVendor == "true" && (
            <div className="bg-white rounded-md px-3 py-4">
              <TaskSummary handleUrlChange={handleUrlChange} />
            </div>
          )}
          <div className="font-bold text-base flex items-center flex-row m-2 justify-between">
            <div className="flex">
              <div className="mt-1.5">
                {STRING_BOOKINGS_LIST.MY_REQUESTS}{" "}
                <span className="text-tertiary">
                  ({list.total_records + countVendor.value})
                </span>
              </div>
              {!open && (
                <div className="ml-3.5">
                  <Button
                    sx={{ fontWeight: "bold", fontSize: 16 }}
                    onClick={() => setOpen(!open)}
                  >
                    <AddIcon></AddIcon>Filters
                  </Button>
                </div>
              )}
              <div className="mr-5 ml-3">
                {open && (
                  <Filter
                    filter={filterStatus}
                    filterName="status"
                    handleData={formatURL}
                    onClose={onClose}
                    navigatedFrom={ROUTE.TASKS}
                  ></Filter>
                )}
              </div>
            </div>

            {countVendor.value > 0 && (
              <div
                className="text-xs font-semibold p-2 rounded-3xl text-white bg-primary"
                onClick={handleNewRequests}
              >
                <RefreshIcon fontSize="small" className="mr-1" />
                {STRING_BOOKINGS_LIST.NEW_REQUESTS}{" "}
                <span>({JSON.stringify(countVendor.value)})</span>
              </div>
            )}
          </div>
          <div className="h-[500px] 2xl:h-full overflow-y-auto">
            {list.bookings && filterStatus ? (
              list.bookings?.map((request: any) => (
                <RequestList
                  booking={request}
                  requestType={"myRequest"}
                  navigatedFrom={ROUTE.TASKS}
                  updatedBooking={updatedBooking}
                  level={step}
                  statusApi={filterStatus}
                  unreadCountData={unReadMessagesCount}
                />
              ))
            ) : (
              <Loading times={5}></Loading>
            )}
          </div>
          <div className="md:flex md:justify-end py-4">
            <Pagination
              count={list?.total_pages}
              shape="rounded"
              onChange={(event, pageNo) => {
                setPage(pageNo);
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default MyTasks;
