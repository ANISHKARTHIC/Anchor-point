import {
  Box,
  ButtonBase,
  Card,
  CardContent,
  Chip,
  Divider,
  Drawer,
  Fab,
  ListItemButton,
  Pagination,
  Typography,
} from "@mui/material";
import { useEffect, useState, useRef } from "react";
import Loading from "../components/Loading";
import { BASE_URL } from "../constants/string";
import { currentDate } from "../utils/utils";
import moment from "moment";
import { cabStatusColor, cabStatusTags, hotelStatusColor, hotelStatusIcons, hotelStatusTags } from "../constants/bookingstatusTags";
import { Hotel as RoomIcon, People as GuestsIcon, LocationCity as CityIcon,RoomPreferencesRounded as PrefernceIcon } from '@mui/icons-material';
import { useNavigate } from "react-router-dom";
import { ROUTE } from "../constants/routes";


const hotelFilter = [
  { key: "UPCOMING", value: "Upcoming" },
  { key: "COMPLETED", value: "Completed" },
];
const cabFilter = [
  { key: "UPCOMING", value: "Upcoming" },
  { key: "ONGOING", value: "Ongoing" },
  { key: "COMPLETED", value: "Completed" },
];

const CoordinatorBookings = () => {
  const bookingtype = localStorage.getItem("bookingtype");
  const [selectedFilter, setSelectedFilter] = useState(
    bookingtype === "cab" ? cabFilter[0].key : hotelFilter[0].key,
  );
  const [bookingData, setBookingData] = useState({});
  const [page, setPage] = useState(1);
  const [emptyData,setEmptyData] = useState(false)
  const navigate = useNavigate();

  useEffect(() => {
    getAllBookings();
  }, [selectedFilter, page]);

  const getAllBookings = async () => {
    setEmptyData(false)
    let tempApiURl =
      bookingtype === "cab"
        ? `${BASE_URL}/coordinators/`
        : `${BASE_URL}/coordinators/hotel_bookings`;
    let apiUrl =
      bookingtype === "cab"
        ? `${tempApiURl}bookings?page=${page}&booking_event_type=${selectedFilter}`
        : `${tempApiURl}?page=${page}&${
            selectedFilter === "UPCOMING"
              ? "check_out_date_gte"
              : "check_out_date_lte"
          }=${currentDate()}`;
    try {
      const bookingResponse = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
      });

      if (bookingResponse.ok) {
        const data = await bookingResponse.json();
        console.log("bookingResponse", data);
        if(data?.bookings.length==0){
            setEmptyData(true)
        }
        setBookingData(data);
      }
    } catch (err) {
      console.error("Error in Getting Coordinator bookings", err);
      setBookingData({})
    }
  };

  const handleSelect = (option) => {
    setSelectedFilter(option);
  };
  const handleNavigation=(bid:String)=>{
    // navigate(-1)
     navigate(`../${ROUTE.COORDINATOR_BOOKINGS}/${bid}`);
    //window.open(`..${ROUTE.HOME}/${ROUTE.COORDINATOR_BOOKINGS_DETAILS}/${bid}`)
  }
  const handleStatus = (status: string) => {
    switch (true) {
      case cabStatusTags.PENDING.includes(status):
        return "PENDING";
      case cabStatusTags.INPROGRESS.includes(status):
        return "IN-PROGRESS";
      case cabStatusTags.CONFIRMED.includes(status):
        return "CONFIRMED";
      case cabStatusTags.DRIVER.includes(status):
        return "DRIVER ASSIGNED";
      case cabStatusTags.COMPLETED.includes(status):
        return "COMPLETED";
      case cabStatusTags.CANCELLED.includes(status):
        return "CANCELLED";
      default:
         return "PENDING"
    }
  };
  const CabCard = ({ data }: any) => {
    var { bid, cab_type, pickup_date, pickup_time, status,id } = data;
    return (
      <ButtonBase onClick={()=>handleNavigation(id)} sx={{ width: 800, display: 'block', textAlign: 'inherit' }}  key={data.id}>
        <Card
          sx={{
            display: "flex",
            alignItems: "center",
            borderRadius: "8px",
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
            marginBottom: "16px",
            maxWidth: 800,
            "&:hover": {
              boxShadow: "0px 6px 20px rgba(0, 0, 0, 0.15)",
            },
            padding: 1,
          }}
        >
          {/* Left Section: Date and Time with background */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: cabStatusColor[handleStatus(status)],
              color:"black" ,
              minWidth: 150,
              minHeight: 100,
              borderRadius: 2,
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              {moment(pickup_date, "DD-MM-YYYY").format("Do MMM")}
            </Typography>
            <Typography variant="body2">
              {moment(pickup_time, "hh:mm A").format("HH:mm")}
            </Typography>
          </Box>

          {/* Divider for Left */}
          {/* <Divider orientation="vertical" flexItem sx={{ mx: 1 }} /> */}

          {/* Middle Section: Booking ID and Car Type */}
          <CardContent sx={{ flex: 1, ml:1 }}>
            <Box
              sx={{
                display: "flex",
                mb: 1,
              }}
            >
              {/* <BookingIcon sx={{ mr: 1, color: 'text.secondary' }} /> */}
              <Typography sx={{fontWeight:'bold',fontFamily:'font-bold'}} variant="h6" color={"black"}>
                Booking ID: {bid}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                // alignItems: 'center',
                // justifyContent: 'center',
              }}
            >
              {/* <CarIcon sx={{ mr: 1, color: 'text.secondary' }} /> */}
              <Typography variant="body2" color={"black"}>
                {cab_type}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                // alignItems: 'center',
                // justifyContent: 'center',
              }}
            >
              {/* <CarIcon sx={{ mr: 1, color: 'text.secondary' }} /> */}
              <Typography color={"black"}>
                {data.travel_mode}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                minWidth: 100,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: cabStatusColor[handleStatus(status)],
                  fontWeight: "bold",
                }}
              >
                {handleStatus(status)}
              </Typography>
            </Box>
          </CardContent>

          {/* Divider for Right */}
          {/* <Divider orientation="vertical" flexItem sx={{ mx: 1 }} /> */}

          {/* Right Section: Status */}
        </Card>
      </ButtonBase>
    );
  };
  const HotelCard = ({data}:any) => {
    const { bid,id,city,status,check_in,check_out,room_type,trip_type,no_of_rooms,no_of_guests} = data
    return (
      <ButtonBase onClick={()=>handleNavigation(bid)} sx={{ width: 800, display: 'block', textAlign: 'inherit' }}  key={data.id}>
          <Card
      sx={{
        maxWidth: 800,
        borderRadius: '8px',
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
        marginBottom: '16px',
        transition: '0.3s',
        '&:hover': {
          boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.15)',
        },
      }}
    >
      {/* Top Section: Booking ID */}
      <Box
        sx={{
          backgroundColor: `${hotelStatusColor(status)}33`, 
          padding: '8px',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
          // textAlign: 'center',
        }}
      >
        <Typography variant="subtitle2" sx={{ color: 'black', fontWeight: 'bold' }}>
          Booking ID: {bid}
        </Typography>
      </Box>

      {/* Middle Section: City and Dates */}
      <CardContent sx={{ textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
          <CityIcon sx={{ mr: 1, color: 'text.secondary' }} />
          <Typography variant="h6" color="text.secondary">
            {city}
          </Typography>
        </Box>
        <Divider sx={{ my: 1 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-around', }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Check-in</Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{moment(check_in,"DD-MM-YYYY").format('DD MMM YYYY')}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Check-out</Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{moment(check_out,"DD-MM-YYYY").format('DD MMM YYYY')}</Typography>
          </Box>
        </Box>
      </CardContent>

      {/* Room and Guest Info Section */}
      <CardContent
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          borderTop: '1px solid #e0e0e0',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <RoomIcon sx={{ mr: 0.5, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {no_of_rooms}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PrefernceIcon sx={{ mr: 0.5, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
             {room_type}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <GuestsIcon sx={{ mr: 0.5, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {no_of_guests}
          </Typography>
        </Box>
      </CardContent>

      {/* Bottom Section: Status */}
      <Divider sx={{ my: 1 }} />
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px',
          backgroundColor: "#ffffff", // Light background color for status
          borderBottomLeftRadius: '8px',
          borderBottomRightRadius: '8px',
        }}
      >
        {hotelStatusIcons(status)}
        <Typography
          variant="body2"
          sx={{
            color: hotelStatusColor(status),
            fontWeight: 'bold',
          }}
        >
          {hotelStatusTags(status)}
        </Typography>
      </Box>
    </Card>
      </ButtonBase>
    );
  };
  return (
    <div className={`flex flex-col w-full bg-appBg h-screen pt-5 pl-5`}>
      <div>
        <Typography variant={"h4"}>Bookings</Typography>
      </div>
      <div className="inline pt-5">
        <Box
          sx={{
            display: "inline-flex",
            borderRadius: "10px", // Border radius for rounded corners
            // overflow: 'hidden',            // Ensures rounded corners
            backgroundColor: "#f0f0f0", // Background for the group
            padding: "7px", // Adds padding around the chips
            gap: 1,
          }}
        >
          {(bookingtype == "cab" ? cabFilter : hotelFilter).map((option) => (
            <Chip
              key={option.key}
              label={option.value}
              onClick={() => handleSelect(option.key)}
              sx={{
                borderRadius: "8px", // Border radius for each chip
                padding: "8px 16px", // Optional padding for chip content
                margin: "2px", // Adds small spacing between chips
                backgroundColor:
                  selectedFilter === option.key ? "#1976d2" : "#e0e0e0", // Change color based on selection
                color: selectedFilter === option.key ? "#fff" : "#000",
                cursor: "pointer",
                "&:hover": {
                  backgroundColor:
                    selectedFilter === option.key ? "#1565c0" : "#cfcfcf",
                },
              }}
            />
          ))}
        </Box>
      </div>
      <div className="h-[500px] 2xl:h-full overflow-y-auto mt-3">
        
        { emptyData ? 
          <Typography sx={{flex:1,}} align="center"> Currently No Bookings Available</Typography>:
          (
            Object.keys(bookingData).length > 0 ? (
              bookingtype === "cab" ? (
                bookingData?.bookings.map((item: any) => <CabCard data={item} />)
              ) : 
                (
                  bookingData?.bookings.map((item: any) => <HotelCard data={item} />)
                )
              
            ) : (
              <Loading times={5}></Loading>
            )
          )
        }
      </div>
      {Object.keys(bookingData).length > 0 && (
        <div className="md:flex md:justify-end py-4">
          <Pagination
            count={bookingData?.total_pages}
            shape="rounded"
            onChange={(event, pageNo) => {
              setPage(pageNo);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default CoordinatorBookings;
