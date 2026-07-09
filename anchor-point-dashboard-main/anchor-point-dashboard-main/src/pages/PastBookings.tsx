import RequestList from "../components/RequestList";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../store/store";
import { myRequests } from "../store/features/tasksSlice";
import { BASE_URL, STRING_BOOKINGS_LIST } from "../constants/string";
import { ROUTE } from "../constants/routes";
import { Box, Button } from "@mui/material";
import Pagination from "@mui/material/Pagination";
import Loading from "../components/Loading.tsx";
import Filter from "../components/Filter";
import AddIcon from "@mui/icons-material/Add";
import { currentDate } from "../utils/utils"

function PastBookings() {
  const dispatch = useDispatch<AppDispatch>();
  const { list } = useSelector((state: any) => state.tasks);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [filterStatus,setFilterStatus] = useState()

  const now = currentDate(true);
  const userID = parseInt(localStorage?.getItem("userID") as string);
  const isVendor = localStorage.getItem("isVendor");
  const bookingtype = localStorage.getItem("bookingtype");
  let url =
    isVendor == "true"
      ? bookingtype == "cab" ?  `${BASE_URL}/vendors/${userID}/bookings?page=${page}` : `${BASE_URL}/vendors/hotel_bookings?page=${page}`
      : bookingtype == "cab" ? `${BASE_URL}/organizers/${userID}/bookings?page=${page}` : `${BASE_URL}/organizers/hotel_bookings?page=${page}`;
    const pastBookingsUrl = bookingtype == "cab" ? `${url}&pickup_end_date=${encodeURIComponent(now)}` : `${url}&check_in_date_lte=${encodeURIComponent(now)}`

  const formatURL = (obj: any) => {
    let filterUrl;
    if (obj.filter && obj.startDate && obj.endDate) {
      filterUrl = bookingtype == "cab" 
        ? `${url}&status=${obj.filter}&pickup_start_date=${encodeURIComponent(obj.startDate)}&pickup_end_date=${encodeURIComponent(obj.endDate)}`
        :  `${url}&status=${obj.filter}&check_in_date_gte=${encodeURIComponent(obj.startDate)}&check_in_date_lte=${encodeURIComponent(obj.endDate)}`
    } else if (obj.filter || (obj.startDate && obj.endDate)) {
      obj.filter
        ? (filterUrl = pastBookingsUrl + "&" + "status" + "=" + obj.filter)
        : (filterUrl = bookingtype == "cab" 
          ? `${url}&pickup_start_date=${encodeURIComponent(obj.startDate)}&pickup_end_date=${encodeURIComponent(obj.endDate)}`
          : `${url}&check_in_date_gte=${encodeURIComponent(obj.startDate)}&check_in_date_lte=${encodeURIComponent(obj.endDate)}`);
    } else {
      filterUrl = pastBookingsUrl;
    }
    return dispatch(myRequests({ url: filterUrl }));
  };
  const onClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    dispatch(myRequests({ url: pastBookingsUrl }));
  }, [page]);

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
  },[])

  return (
    <>
      <div className={`flex flex-col items-center h-screen w-full ${isVendor=='true' ? 'bg-yellow-50': 'bg-appBg'}`}>
        <div className="w-4/5 ">
          <div className="font-bold text-base flex items-center flex-row m-2 mt-10">
            <div className="mt-1">
              {STRING_BOOKINGS_LIST.MY_REQUESTS}{" "}
              <span className="text-tertiary">({list.total_records})</span>
            </div>
            {!open && (
              <div className="ml-5">
                <Button
                  sx={{ fontWeight: "bold", fontSize: 16 }}
                  onClick={() => setOpen(!open)}
                >
                  <AddIcon></AddIcon>Filters
                </Button>
              </div>
            )}
            <div className="mr-5 ml-2">
              {open && (
                <Filter
                  filter={filterStatus}
                  filterName="status"
                  handleData={formatURL}
                  onClose={onClose}
                  navigatedFrom={ROUTE.PASTBOOKINGS}
                ></Filter>
              )}
            </div>
          </div>
          <div className="h-[500px] 2xl:h-full overflow-y-auto">
            {list.bookings && filterStatus ? (
              list.bookings?.map((request: any) => (
                <RequestList
                  booking={request}
                  requestType={"myRequest"}
                  navigatedFrom={ROUTE.PASTBOOKINGS}
                  statusApi={filterStatus}
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

export default PastBookings;
