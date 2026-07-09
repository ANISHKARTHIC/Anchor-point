import {
  Box,
  Chip,
  Drawer,
  Fab,
  ListItemButton,
  Pagination,
} from "@mui/material";
import { useEffect, useState, useRef } from "react";
import RequestList from "../components/RequestList";
import { ROUTE } from "../constants/routes";
import Loading from "../components/Loading";
import BookingPreview from "../components/BookingPreview";
import AllBookingsFilter from "../components/AllBookingsFilter";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import { BASE_URL } from "../constants/string";

function AllBookings() {
  const small = window.matchMedia("(max-width: 768px)").matches;
  const isVendor = localStorage.getItem("isVendor");
  const vendorId = localStorage.getItem("userID");
  const bookingtype = localStorage.getItem("bookingtype");
  const limit = 10;
  const [list, setList] = useState<any>({});
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState();
  const [statusApi, setStatusApi] = useState({});
  const [currentUrl, setCurrentUrl] = useState(
    isVendor == "false"
      ? bookingtype == "cab"
        ? `${BASE_URL}/all_bookings?limit=${limit}`
        : `${BASE_URL}/hotel_bookings/?limit=${limit}`
      : bookingtype == "cab"
      ? `${BASE_URL}/vendors/${vendorId}/bookings?limit=${limit}`
      : `${BASE_URL}/vendors/hotel_bookings?limit=${limit}`,
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const [currentActiveMenu, setCurrentActiveMenu] = useState<number>(0);

  const filtersRefElements = useRef({
    today: null,
    this_week: null,
    start_date: null,
    end_date: null,
    bid: null,
    coordinator: null,
    guests: null,
    travel_mode: [],
    vehicle: [],
    status: [],
    vendor: [],
    organizer: [],
  });

  const [filters, SetFilters] = useState({
    today: false,
    this_week: false,
    start_date: null,
    end_date: null,
    bid: null,
    coordinator: null,
    guests: null,
    travel_mode: [],
    type: [],
    vehicle: [],
    status: [],
    vendor: [],
    organizer: [],
  });

  const menuListItemProps = (value: number) => ({
    selected: currentActiveMenu === value,
    onClick: () => setCurrentActiveMenu(value),
    onselect: (e: any) => (e.currentTarget.style.backgroundColor = "#c9dff5"),
    sx: {
      width: "100%",
      borderRadius: "4px",
    },
  });

  const getAllBookings = async (url = currentUrl) => {
    const bookingResponse = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("userToken"),
      },
    });

    if (bookingResponse.ok) {
      const data = await bookingResponse.json();
      setList(data);
      setSelected(data.bookings[0]);
    }
  };

  useEffect(() => {
    const fetchStatus = async () => {
      const statusResponse = await fetch(
        `${BASE_URL}/${
          bookingtype == "cab" ? "bookings" : "hotel_bookings"
        }/status `,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("userToken"),
          },
        },
      );

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setStatusApi(statusData);
      }
    };
    fetchStatus();
  }, []);

  useEffect(() => {
    currentUrl ? getAllBookings(`${currentUrl}&page=${page}`) : "";
    setCurrentActiveMenu(0);
  }, [page, currentUrl]);

  return (
    <div
      className={`flex flex-col w-full ${
        isVendor == "true" ? "bg-yellow-50" : "bg-appBg"
      } h-screen`}
    >
      <div className="flex md:ml-72 h-20 border mt-5 mr-2">
        <Box
          sx={{
            overflowY: "auto",
          }}
        >
          <div className="flex flex-wrap justify-center gap-1 m-1 items-center bg-slate-200 rounded">
            <div className="m-2">Applied filters:</div>
            {filters.today && (
              <Chip
                label={"Today"}
                sx={{ bgcolor: "#F8FAFC" }}
                onDelete={() => {
                  SetFilters({ ...filters, today: false });
                }}
              ></Chip>
            )}
            {filters.this_week && (
              <Chip
                label={"This Week"}
                sx={{ bgcolor: "#F8FAFC" }}
                onDelete={() => {
                  SetFilters({ ...filters, this_week: false });
                }}
              ></Chip>
            )}
            {filters.start_date && filters.end_date && (
              <Chip
                label={"Date Range"}
                sx={{ bgcolor: "#F8FAFC" }}
                onDelete={() => {
                  SetFilters({ ...filters, start_date: null, end_date: null });
                }}
              ></Chip>
            )}
            {filters.bid && (
              <Chip
                label={filters.bid}
                sx={{ bgcolor: "#F8FAFC" }}
                onDelete={() => {
                  SetFilters({ ...filters, bid: null });
                }}
              ></Chip>
            )}
            {filters.travel_mode?.map((type) => (
              <Chip
                label={type}
                sx={{ bgcolor: "#F8FAFC" }}
                onDelete={() => {
                  const temp = filters.travel_mode;
                  const index = filters.travel_mode.indexOf(type);
                  index > -1 ? temp.splice(index, 1) : "";
                  SetFilters({ ...filters, travel_mode: temp });
                }}
              ></Chip>
            ))}
            {filters?.coordinator && (
              <Chip
                label={filters.coordinator}
                sx={{ bgcolor: "#F8FAFC" }}
                onDelete={() => {
                  SetFilters({ ...filters, coordinator: null });
                }}
              ></Chip>
            )}
            {filters?.guests && (
              <Chip
                label={filters.guests}
                sx={{ bgcolor: "#F8FAFC" }}
                onDelete={() => {
                  SetFilters({ ...filters, guests: null });
                }}
              ></Chip>
            )}
            {filters.vehicle?.map((vehicle) => (
              <Chip
                label={vehicle}
                sx={{ bgcolor: "#F8FAFC" }}
                onDelete={() => {
                  const temp = filters.vehicle;
                  const index = filters.vehicle.indexOf(vehicle);
                  index > -1 ? temp.splice(index, 1) : "";
                  SetFilters({ ...filters, vehicle: temp });
                  filtersRefElements.current.vehicle.map((element, i) =>
                    element.name == vehicle
                      ? (filtersRefElements.current.vehicle[i].checked = false)
                      : "",
                  );
                }}
              ></Chip>
            ))}
            {filters.status?.map((status) => (
              <Chip
                label={statusApi[status]}
                sx={{ bgcolor: "#F8FAFC" }}
                onDelete={() => {
                  const temp = filters.status;
                  const index = filters.status.indexOf(status);
                  index > -1 ? temp.splice(index, 1) : "";
                  SetFilters({ ...filters, status: temp });
                  filtersRefElements.current.status.map((element, i) =>
                    element.name == status
                      ? (filtersRefElements.current.status[i].checked = false)
                      : "",
                  );
                }}
              ></Chip>
            ))}
            {filters.organizer?.map((organizer) => (
              <Chip
                label={organizer.name}
                sx={{ bgcolor: "#F8FAFC" }}
                onDelete={() => {
                  const temp = filters.organizer;
                  const index = filters.organizer.indexOf(organizer);
                  index > -1 ? temp.splice(index, 1) : "";
                  SetFilters({ ...filters, organizer: temp });
                  filtersRefElements.current.organizer.map((element, i) =>
                    element.name == organizer.name
                      ? (filtersRefElements.current.organizer[i].checked =
                          false)
                      : "",
                  );
                }}
              ></Chip>
            ))}
            {filters.vendor?.map((vendor) => (
              <Chip
                label={vendor.name}
                sx={{ bgcolor: "#F8FAFC" }}
                onDelete={() => {
                  const temp = filters.vendor;
                  const index = filters.vendor.indexOf(vendor);
                  index > -1 ? temp.splice(index, 1) : "";
                  SetFilters({ ...filters, vendor: temp });
                  filtersRefElements.current.vendor.map((element, i) =>
                    element.name == vendor.name
                      ? (filtersRefElements.current.vendor[i].checked = false)
                      : "",
                  );
                }}
              ></Chip>
            ))}
          </div>
        </Box>
      </div>
      <div className="flex flex-col md:flex-row justify-end">
        {!small ? (
          <Box width={"20%"}>
            <div
              className={`flex justify-center ${
                isVendor == "true" ? "bg-yellow-50" : "bg-appBg"
              } h-[580px] 2xl:h-[100%] mt-2`}
            >
              <AllBookingsFilter
                setCurrentUrl={setCurrentUrl}
                getAllBookings={getAllBookings}
                filterRef={filtersRefElements}
                filters={filters}
                SetFilters={SetFilters}
                status={statusApi}
                setFilterOpen={setFilterOpen}
              />
            </div>
          </Box>
        ) : (
          <div>
            <Fab size="small" color="info" onClick={() => setFilterOpen(true)}>
              <FilterAltIcon />
            </Fab>
            <Drawer
              open={filterOpen}
              anchor={"left"}
              onClose={() => setFilterOpen(false)}
            >
              <div className=" flex justify-center bg-appBg h-[620px] 2xl:h-[100%] mt-4">
                <AllBookingsFilter
                  setCurrentUrl={setCurrentUrl}
                  getAllBookings={getAllBookings}
                  filterRef={filtersRefElements}
                  filters={filters}
                  SetFilters={SetFilters}
                  status={statusApi}
                  setFilterOpen={setFilterOpen}
                />
              </div>
            </Drawer>
          </div>
        )}
        <Box width={!small ? "40%" : "100%"} alignItems={"center"}>
          <div className="h-[580px] 2xl:h-[100%] mt-2 overflow-y-auto ">
            {list.bookings ? (
              list.bookings?.map((request: any, index: any) => (
                <ListItemButton {...menuListItemProps(index)}>
                  <div className="w-full">
                    <RequestList
                      booking={request}
                      requestType={"allBookings"}
                      navigatedFrom={ROUTE.ALL_BOOKINGS}
                      onSelect={setSelected}
                      statusApi={statusApi}
                    />
                  </div>
                </ListItemButton>
              ))
            ) : (
              <Loading times={5}></Loading>
            )}
          </div>
          <div className="flex justify-center">
            <Pagination
              count={list?.total_pages}
              shape="rounded"
              onChange={(event, pageNo) => {
                setPage(pageNo);
              }}
            />
          </div>
        </Box>
        <Box width={!small ? "40%" : "100%"}>
          <div className="flex bg-appBg h-[580px] 2xl:h-[100%] drop-shadow-[0_0px_10px_rgba(0,0,0,0.25)] mt-2 items-center">
            <div className="m-2 w-full">
              {list.bookings?.length != 0 ? (
                <BookingPreview selected={selected} />
              ) : (
                <span className=" font-bold text-lg">No Booking Found</span>
              )}
            </div>
          </div>
        </Box>
      </div>
    </div>
  );
}

export default AllBookings;
