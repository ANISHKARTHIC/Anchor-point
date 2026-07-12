import * as React from "react";
import { BASE_URL, STRING_BOOKINGS } from "../constants/string";
import { useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  InputAdornment,
  Box,
  Divider,
  Autocomplete,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import CardContent from "@mui/material/CardContent";
import { TextField } from "@mui/material";
import customParseFormat from "dayjs/plugin/customParseFormat";
import MailIcon from "@mui/icons-material/Mail";
import { DatePicker, DesktopTimePicker, LocalizationProvider, renderTimeViewClock } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import PeopleIcon from "@mui/icons-material/People";
import BedIcon from '@mui/icons-material/Bed';
import CCMail from "./CCMail";
import { isValidEmail } from "../utils/utils";
import { useSelector } from "react-redux";

interface BookingDateTimeProps {
  bookingData: any,
  onClick: () => void;
  onDataChange: (data: any) => void;
  stepper: number;
}

const BookingDateTimeForm: React.FC<BookingDateTimeProps> = ({
  bookingData,
  onClick,
  onDataChange,
  stepper,
}) => {

  const [guestCount, setGuestCount] = useState(0);
  const [kidsCount, setKidsCount] = useState(0);
  const [roomCount, setRoomCount] = useState(0);
  const [costCentres,setCostCentres] = useState([]);
  const [cityOptions,setCityOptions] = useState([]);
  const [selectedTripType, setSelectedTripType] = useState("Official");
  const [selectedCity, setSelectedCity] = useState<any>();
  const [selectedRoomType, setSelectedRoomType] = useState<any>();
  const [selectedCostCenter, setSelectedCostCenter] = useState<any>(null);
  const [selectedPaidBy, setSelectedPaidBy] = useState<any>(null);
  const [selectedCheckinDate, setSelectedCheckinDate] = useState<any>(null);
  const [selectedCheckoutDate, setSelectedCheckoutDate] = useState<any>(null);
  const [description, setDescription] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [coordinatorError,setCoordinatorError] = useState(false)
  const [emailIds,setEmailIds] = useState([]);
  const [pickup, setPickup] = useState({
    isPickup: false,
    flight: "",
    time: null
  });
  const [drop, setDrop] = useState({
    isDrop: false,
    flight: "",
    time: null
  });
  const roomtype = [
    {id:1, name: "Standard"},
    {id:2, name: "Deluxe"},
    {id:3, name: "Double room"},
    {id:4, name: "Suite"},
  ]
  const paidBy = [
    {id:1, name: "Company", value: "Company"},
    {id:2, name: "Guest", value: "Guest"},
    {id:3, name: "Shared", value: "Shared"},
  ]
  const [bid,SetBid] = useState([])
  const [selectedBid,setSelectedBid] = useState("")
  const coordinatorMail = localStorage.getItem("userEmail")
  const [coordinatorEmail,setCoordinatorEmail] = useState(coordinatorMail!=null?coordinatorMail:"")

  const prefilledBookingData = useSelector(
    (state) => state.booking.prefilledBookingData,
  );
  const checkDisable = !prefilledBookingData && stepper >= 1;

  const handleBookinginfoSubmit = () => {
    const emptyGuests = Array.from({ length: selectedTripType == "Official" ? guestCount : 1}, (value,index) => ({
      is_primary: false, 
      name: "",
      email: "",
      mobile: "",
    }));

    let obj = {
      coordinator_email : coordinatorEmail,
      trip_type: selectedTripType,
      cost_centre: {
        id : selectedCostCenter?.id,
        code : selectedCostCenter?.code,
      },
      city: selectedCity.city,
      no_of_adults: guestCount,
      no_of_children: kidsCount,
      no_of_rooms: roomCount,
      check_in: selectedCheckinDate?.format("YYYY-MM-DD"),
      check_out: selectedCheckoutDate?.format("YYYY-MM-DD"),
      room_type:selectedRoomType?.name,
      guests: emptyGuests,
      description: description,
      cc_recipients: emailIds,
      po_number: poNumber,
      related_booking_id: selectedBid ? selectedBid : "",
      billing_option: selectedPaidBy.value,
    }
    pickup.isPickup ? obj = {...obj, pickup: {flight : pickup.flight, time : pickup.time?.format("HH:MM")}} : ""
    drop.isDrop ? obj = {...obj, drop: {flight : drop.flight, time : drop.time?.format("HH:MM")}} : ""

    onDataChange(obj);

    onClick();
  };

  const handleCheckinChange = (date: any) => {
    setSelectedCheckinDate(date);
    setSelectedCheckoutDate(null)
  };

  const handleCheckoutChange = (date: any) => {
    setSelectedCheckoutDate(date);
  };

  const handleCountChange = (value: any) => {
    setGuestCount(value);
  };

  const isFormDisabled = () => {
    return (
      (pickup.isPickup && (pickup.flight == "")) ||
      (drop.isDrop && (drop.flight == "")) ||
      !selectedCheckinDate ||
      !selectedCheckoutDate ||
      !selectedPaidBy ||
      guestCount <= 0 ||
      roomCount <= 0 ||
      !selectedCity ||
      !selectedCostCenter ||
      !coordinatorEmail ||
      coordinatorError ||
      stepper > 0
    );
  };

  React.useEffect(() => {
    const fetchCostCenters = async () => {
      try {
        const response = await fetch(`${BASE_URL}/cost-centres`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("userToken"),
          },
        });
        const data = await response.json();
        setCostCentres(data.cost_centres);
      } catch (error) {
        console.error("Error fetching Cost Centers:", error);
      }
    };

    const fetchCities = async () => {
        try {
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
        } catch (error) {
        console.error("Error fetching cities:", error);
      }
    }

    fetchCostCenters();
    fetchCities()

  }, []);

  React.useEffect(()=>{
    if (prefilledBookingData?.bid) {
      dayjs.extend(customParseFormat);
      setSelectedCheckinDate(prefilledBookingData?.check_in ? dayjs(prefilledBookingData?.check_in, 'DD-MM-YYYY') : null)
      setSelectedCheckoutDate(prefilledBookingData?.check_out ? dayjs(prefilledBookingData?.check_out, 'DD-MM-YYYY') : null)

      setSelectedCostCenter(prefilledBookingData?.cost_centre || {})
      setSelectedTripType(prefilledBookingData?.trip_type || "")
      setGuestCount(prefilledBookingData?.no_of_adults|| 0)
      setKidsCount(prefilledBookingData?.no_of_children || 0)
      setRoomCount(prefilledBookingData?.no_of_rooms || 0)
      setPoNumber(prefilledBookingData?.po_number || "")

      let room = roomtype.find((item:any)=>item.name == prefilledBookingData?.room_type)
      setSelectedRoomType(room || {})

      let billing = paidBy.find((item:any)=>item.value == prefilledBookingData?.billing_option)
      setSelectedPaidBy(billing || {})

      let city = cityOptions.find((item:any)=>item.city == prefilledBookingData?.city)
      setSelectedCity(city || {})

      prefilledBookingData?.pickup?.flight ? setPickup(
        {flight : prefilledBookingData?.pickup?.flight,
         time : prefilledBookingData?.pickup?.time ? dayjs(prefilledBookingData?.pickup?.time, 'HH:mm') : null,
         isPickup : true}) : ""
         prefilledBookingData?.drop?.flight ? setDrop(
        {flight: prefilledBookingData?.drop?.flight,
          time : prefilledBookingData?.drop?.time ? dayjs(prefilledBookingData?.drop?.time, 'HH:mm') : null,
         isDrop : true}) : ""

      setSelectedBid(prefilledBookingData?.related_booking_id || "")
      setDescription(prefilledBookingData?.description || "")
      setCoordinatorEmail(prefilledBookingData?.coordinator_email)
      setEmailIds(prefilledBookingData?.cc_recipients || [])
      
    }
  },[JSON.stringify(cityOptions),costCentres])

  React.useEffect(() => {
    if (prefilledBookingData) {
      let obj = {
        coordinator_email : coordinatorEmail,
        trip_type: selectedTripType,
        cost_centre: {
          id : selectedCostCenter?.id,
          code : selectedCostCenter?.code,
        },
        city: selectedCity?.city,
        no_of_adults: guestCount,
        no_of_children: kidsCount,
        no_of_rooms: roomCount,
        check_in: selectedCheckinDate?.format("YYYY-MM-DD"),
        check_out: selectedCheckoutDate?.format("YYYY-MM-DD"),
        room_type:selectedRoomType?.name,
        guests: prefilledBookingData?.guests,
        description: description,
        cc_recipients: emailIds,
        po_number: poNumber,
        related_booking_id: selectedBid,
        billing_option: selectedPaidBy?.value,
      }
      pickup.isPickup ? obj = {...obj, pickup: {flight : pickup.flight, time : pickup.time?.format("HH:MM")}} : obj = {...obj, pickup: {}}
      drop.isDrop ? obj = {...obj, drop: {flight : drop.flight, time : drop.time?.format("HH:MM")}} : obj = {...obj, drop: {}}

      onDataChange({
        ...obj
      });

      if (onClick) onClick();
    }
  }, [
    prefilledBookingData,
    coordinatorEmail,
    selectedTripType,
    selectedCostCenter,
    selectedCity,
    guestCount,
    kidsCount,
    roomCount,
    selectedCheckinDate,
    selectedCheckoutDate,
    selectedRoomType,
    selectedBid,
    description,
    JSON.stringify(emailIds),
    bid,
    selectedPaidBy,
    JSON.stringify(pickup),
    JSON.stringify(drop)
  ]);

  const fetchBid = async(bookingid:string) => {
    const response = await fetch(`${BASE_URL}/hotel_bookings/bid?bid=${bookingid}`,{
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("userToken"),
      },
    });
    if(response.ok) {
      const data = await response.json();
      SetBid(data.bid)
    }
  }

  return (
    <div className="flex">
        <Card
          sx={{
            minWidth: 350,
            maxWidth: 350,
            minHeight: 550,
            maxHeight: 650,
            overflowY: "scroll",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
            border: "1px solid #E2E8F0",
            borderRadius: "12px"
          }}
        >
          <Box
            sx={{
              display: "flex",
              backgroundColor: "#F8FAFC",
              justifyContent: "space-between",
              alignItems: "center",
              paddingRight: 1,
              position: "sticky",
              top: 0,
              zIndex: 1,
              borderBottom: "1px solid #E2E8F0"
            }}
          >
            <CardHeader
              title={
                <div className="text-base font-bold text-slate-800">
                  {STRING_BOOKINGS.HOTEL_HEADER}
                </div>
              }
              sx={{
                justifyContent: "center",
                alignItems: "center",
                display: "flex",
              }}
            />

            <Button
              variant="contained"
              size="small"
              disabled={isFormDisabled()}
              type="submit"
              sx={{ 
                padding: '6px 16px', 
                backgroundColor: "#334155", 
                textTransform: "none", 
                boxShadow: "none",
                borderRadius: "6px",
                '&:hover': {
                  backgroundColor: "#475569",
                  boxShadow: "none"
                }
              }}
              onClick={handleBookinginfoSubmit}
            >
              Continue
            </Button>
          </Box>
          <Divider
            sx={{
              borderColor: "grey.500",
              width: "100%",
            }}
          />
          <CardContent style={{ overflowY: "auto", flex: 1 }}>
            <div className="flex flex-col gap-1.5 ">
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <div className="text-sm font-bold ">
                  {STRING_BOOKINGS.COORDINATOR}{" "}
                  <span className="text-red-500">*</span>
                </div>
                <Box
                    sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    }}
                >
                    <TextField
                    id="coordinator-email"
                    variant="outlined"
                    sx={{ width: "100%" }}
                    value={coordinatorEmail}
                    onChange={(e)=> {
                        setCoordinatorEmail(e.target.value)
                        isValidEmail(e.target.value)
                        ? setCoordinatorError(false)
                        : setCoordinatorError(true)
                    }}
                    InputProps={{
                        startAdornment: (
                        <InputAdornment position="start">
                            <MailIcon />
                        </InputAdornment>
                        ),
                    }}
                    size="small"
                    error={coordinatorError}
                    helperText={coordinatorError 
                        ? "Enter a valid email id"
                        : ""}
                    disabled={checkDisable}
                    required
                    />
                </Box>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "row", gap: 1 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <div className="font-bold text-sm">
                  {STRING_BOOKINGS.CHECKIN} <span className="text-red-500">*</span>
                </div>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        value={selectedCheckinDate}
                        onChange={(value) => {
                          handleCheckinChange(value);
                        }}
                        format="DD-MM-YYYY"
                        minDate={!prefilledBookingData ? dayjs() : null}
                        sx={{
                          "& .css-nxo287-MuiInputBase-input-MuiOutlinedInput-input":
                            {
                              padding: "10px",
                            },
                        }}
                        disabled={checkDisable}
                      />
                    </LocalizationProvider>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <div className="font-bold text-sm">
                  {STRING_BOOKINGS.CHECKOUT} <span className="text-red-500">*</span>
                </div>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        value={selectedCheckoutDate}
                        onChange={(value) => {
                          handleCheckoutChange(value);
                        }}
                        minDate={selectedCheckinDate}
                        format="DD-MM-YYYY"
                        sx={{
                          "& .css-nxo287-MuiInputBase-input-MuiOutlinedInput-input":
                            {
                              padding: "10px",
                            },
                        }}
                        disabled={checkDisable}
                      />
                    </LocalizationProvider>
              </Box>
              </Box>

              <Box
                sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                }}
                >
                <div className="font-bold text-sm">
                  {STRING_BOOKINGS.ROOMNO}{" "}
                  <span className="text-red-500">*</span>
                </div>
                <TextField
                id="room-no"
                size="small"
                type="number"
                value={roomCount}
                InputLabelProps={{
                    shrink: true,
                }}
                sx={{ width: "100px" }}
                onChange={(e) => setRoomCount(e.target.value)}
                InputProps={{
                    startAdornment: (
                    <InputAdornment position="start">
                        <BedIcon />
                    </InputAdornment>
                    ),
                    inputProps: { min: 0, max: 10 } 
                }}
                disabled={checkDisable}
                required
                />
            </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <div className="font-bold text-sm">
                  <FormGroup>
                    <FormControlLabel control={<Checkbox value={selectedTripType} checked={selectedTripType == "Family"} disabled={checkDisable} onChange={(e:any)=>
                        e.target.checked ? setSelectedTripType("Family") : setSelectedTripType("Official")
                    } />} label={STRING_BOOKINGS.TRIPTYPE} />
                    </FormGroup>
                </div>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div className="font-bold text-sm">
                  {STRING_BOOKINGS.PEOPLE}{" "}
                  <span className="text-red-500">*</span>
                </div>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <TextField
                        id="guest-count"
                        size="small"
                        type="number"
                        value={guestCount}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        sx={{ width: "100px" }}
                        onChange={(e) => handleCountChange(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PeopleIcon />
                            </InputAdornment>
                          ),
                          inputProps: { min: 1, max: 30 } 
                        }}
                        disabled={checkDisable}
                        required
                      />
                    </Box>
                    {selectedTripType == "Family" && <Box
                        sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        }}
                    >
                        <div className="font-bold text-sm">
                        {STRING_BOOKINGS.KIDS}{" "}
                        <span className="text-red-500">*</span>
                        </div>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <TextField
                        id="kids-count"
                        size="small"
                        type="number"
                        value={kidsCount}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        sx={{ width: "100px" }}
                        onChange={(e) => setKidsCount(Number(e.target.value))}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PeopleIcon />
                            </InputAdornment>
                          ),
                          inputProps: { min: 0, max: 10 } 
                        }}
                        disabled={checkDisable}
                        required
                      />
                    </Box>
              </Box>}
              </Box>

              {(selectedCity || !prefilledBookingData) && <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <div className="font-bold text-sm">
                  {STRING_BOOKINGS.CITY}{" "}
                  <span className="text-red-500">*</span>
                </div>
                    <Autocomplete
                      id="city"
                      value={selectedCity}
                      isOptionEqualToValue={(option:any, value:any) => option.id === value.id}
                      getOptionLabel={(option:any) => option?.city}
                      options={cityOptions || []}
                      disabled={checkDisable}
                      onChange={(event, value: any) => {
                        value ? setSelectedCity(value) : "";
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="outlined"
                          size="small"
                          required
                        />
                      )}
                    />
              </Box>}

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <div className="font-bold text-sm">
                  {STRING_BOOKINGS.COSTCENTER}{" "}
                  <span className="text-red-500">*</span>
                </div>
                    <Autocomplete
                      id="cost-center"
                      value={selectedCostCenter}
                      isOptionEqualToValue={(option:any, value:any) => option.id === value.id}
                      getOptionLabel={(option:any) => option?.code}
                      options={costCentres || []}
                      disabled={checkDisable}
                      onChange={(event, value: any) => {
                        setSelectedCostCenter(value);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="outlined"
                          size="small"
                          required
                        />
                      )}
                    />
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <div className="font-bold text-sm">
                  {STRING_BOOKINGS.BILLING_OPTION}{" "}
                  <span className="text-red-500">*</span>
                </div>
                    <Autocomplete
                      id="cost-center"
                      value={selectedPaidBy}
                      isOptionEqualToValue={(option:any, value:any) => option.id === value.id}
                      getOptionLabel={(option:any) => option?.name}
                      options={paidBy || []}
                      disabled={checkDisable}
                      onChange={(event, value: any) => {
                        setSelectedPaidBy(value);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="outlined"
                          size="small"
                          required
                        />
                      )}
                    />
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <FormGroup>
                  <FormControlLabel control={<Checkbox value={pickup.isPickup} checked={pickup.isPickup == true} disabled={checkDisable} onChange={(e:any)=>
                      e.target.checked ? setPickup({...pickup, isPickup:true}) : setPickup({...pickup, isPickup:false})
                  } />} label={STRING_BOOKINGS.PICKUP} />
                </FormGroup>
                {
                  pickup.isPickup && <div className="flex flex-row gap-1">
                    <div>
                    <div className="font-bold text-sm">
                      {STRING_BOOKINGS.FLIGHT_DETAILS}{" "}
                      <span className="text-red-500">*</span>
                    </div>
                    <TextField
                      variant="outlined"
                      size="small"
                      value={pickup.flight}
                      disabled={checkDisable}
                      onChange={(e:any)=> setPickup({...pickup,flight:e.target.value})}
                    />
                    </div>
                    <div>
                    <div className="font-bold text-sm">
                      {STRING_BOOKINGS.FLIGHT_TIME}{" "}
                    </div>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DesktopTimePicker
                        value={pickup.time || null}
                        ampm={false}
                        onChange={(value: any) => {
                          setPickup({...pickup, time: value});
                        }}
                        className="w-28"
                        disabled={checkDisable}
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
                        }}
                      />
                    </LocalizationProvider>
                    </div>
                  </div>
                }
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <FormGroup>
                  <FormControlLabel control={<Checkbox value={drop.isDrop} checked={drop.isDrop == true} disabled={checkDisable} onChange={(e:any)=>
                      e.target.checked ? setDrop({...drop, isDrop:true}) : setDrop({...drop, isDrop:false})
                  } />} label={STRING_BOOKINGS.DROP} />
                </FormGroup>
                {
                  drop.isDrop && <div className="flex flex-row gap-1">
                    <div>
                    <div className="font-bold text-sm">
                      {STRING_BOOKINGS.FLIGHT_DETAILS}{" "}
                      <span className="text-red-500">*</span>
                    </div>
                    <TextField
                      variant="outlined"
                      size="small"
                      value={drop.flight}
                      disabled={checkDisable}
                      onChange={(e:any)=> setDrop({...drop,flight:e.target.value})}
                    />
                    </div>
                    <div>
                    <div className="font-bold text-sm">
                      {STRING_BOOKINGS.FLIGHT_TIME}{" "}
                    </div>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DesktopTimePicker
                        value={drop.time || null}
                        ampm={false}
                        onChange={(value: any) => {
                          setDrop({...drop, time: value});
                        }}
                        className="w-28"
                        disabled={checkDisable}
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
                        }}
                      />
                    </LocalizationProvider>
                    </div>
                  </div>
                }
              </Box>
              {(selectedRoomType || !prefilledBookingData) && <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <div className="font-bold text-sm">
                  {STRING_BOOKINGS.ROOMTYPE}{" "}
                </div>
                    <Autocomplete
                      id="room-type"
                      value={selectedRoomType}
                      isOptionEqualToValue={(option:any, value:any) => option.id === value.id}
                      getOptionLabel={(option:any) => option?.name || ""}
                      options={roomtype || []}
                      disabled={checkDisable}
                      onChange={(event, value: any) => {
                        value ? setSelectedRoomType(value) : ""
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="outlined"
                          size="small"
                          required
                        />
                      )}
                    />
              </Box>}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <div className="font-bold text-sm">
                  {STRING_BOOKINGS.RELATED_BID}{" (If any)"}
                </div>
                  <Autocomplete
                  options={bid || []}
                  getOptionLabel={(option: any) => option}
                  value={selectedBid}
                  className="flex justify-center items-center"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={"Search Booking ID"}
                      size="small"
                      placeholder="eg.BID1"
                      disabled={checkDisable}
                      onChange={(e:any)=>{ 
                        e.target.value?.length > 3 
                        ? fetchBid(e.target.value) 
                        : ""
                      }}
                    />
                  )}
                  onChange={(event, newValue) => {
                    if (newValue === null) {
                      SetBid([]);
                      setSelectedBid(newValue)
                    } else {
                      setSelectedBid(newValue)
                    }
                  }}
                />
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <div className="font-bold text-sm">
                  {STRING_BOOKINGS.DESCRIPTION}
                </div>
                    <TextField
                      id="description"
                      placeholder="Description"
                      value={description}
                      size="small"
                      multiline
                      maxRows={3}
                      disabled={checkDisable}
                      onChange={(e:any)=>{
                        setDescription(e.target.value)
                      }}
                    />
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <div className="font-bold text-sm">
                  PO Number
                </div>
                <TextField
                  id="po-number"
                  placeholder="PO Number"
                  value={poNumber}
                  size="small"
                  multiline
                  maxRows={3}
                  disabled={checkDisable}
                  onChange={(e:any)=>{
                    setPoNumber(e.target.value)
                  }}
                />
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <div className="font-bold text-sm">
                  {STRING_BOOKINGS.CC_EmailIds}
                </div>
                <CCMail
                  disabled={checkDisable}
                  emailIds={emailIds}
                  setEmailIds={setEmailIds}
                />
              </Box>
            </div>
          </CardContent>
        </Card>
    </div>
  );
};

export default BookingDateTimeForm;
