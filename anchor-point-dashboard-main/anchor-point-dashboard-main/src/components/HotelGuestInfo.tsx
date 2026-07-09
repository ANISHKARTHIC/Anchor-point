import React, { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardHeader,
  CircularProgress,
  Divider,
  TextField,
} from "@mui/material";
import {
  BASE_URL,
  STRING_BOOKINGS,
} from "../constants/string";
import PhoneWithCountryCode from "./PhoneWithCountryCode";
import { isValidEmail } from "../utils/utils";
import { useSelector } from "react-redux";

const small = window.matchMedia("(max-width: 768px)").matches

interface FormComponentProps {
  selectedIndex: any;
  bookingData: any;
  stepper: number;
  onDataChange: (data: any) => void;
  onFinish: () => void;
}

const FormComponent: React.FC<FormComponentProps> = ({
  selectedIndex,
  bookingData,
  onDataChange,
  onFinish,
}) => {

  const styles = {
    card: {
      minHeight: 550,
      maxHeight: 550,
      maxWidth: 600,
    },

    topHeading: {
      display: "flex",
      alignItems: "center",
      width: "100%",
      backgroundColor: "lightgray",
    },

    Box1: {
      maxHeight: 450,
      overflowY: "scroll",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    },
    Box2: {
      display: "flex",
      flexDirection: !small ? "row" : "column",
      gap: 10,
    },
    flex: {
      display: "flex",
      justifyContent: "space-between",
      flexDirection: !small ? "row" : "column",
      gap: 2,
    },
    flex2: {
      display: "flex",
      flexDirection: "column",
      gap: 1,
      width: !small ? "50%" : "100%",
    },
    flex3: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
  };

  const selectedGuest = bookingData.guests[selectedIndex];
  // const [id,setId] = useState();
  const [name,setName] = useState();
  const [email,setEmail] = useState();
  const [phone,setPhone] = useState<any>();
  const [vessel_name,setVessel_name] = useState();
  const [rank,setRank] = useState();
  const [internal_id,setInternal_id] = useState();

  const [nameError,setNameError] = useState<any>();
  const [emailError,setEmailError] = useState<any>();
  const [numberError,setNumberError] = useState<any>();
  const prefilledBookingData = useSelector(
    (state) => state.booking.prefilledBookingData,
  );
  const [isDisabled,setIsDisabled] = useState(!prefilledBookingData ? true : false);
  const [progress,setProgress] = useState(0)
  const [buffer,setBuffer] = useState(false)

  const [guests, setGuests] = useState(() => {
    const initialGuests = Array.from(
      { length: bookingData.guests.length },
      (_, index) => {
        const existingGuest = bookingData.guests[index];
        return existingGuest
          ? { ...existingGuest }
          : {
              name: "",
              email: "",
              mobile: " ",
              rank: "",
              internal_id: "",
              vessel_name: "",
            };
      },
    );
    return initialGuests;
  });

  const onSubmit = () => {
    const updatedGuests = bookingData.guests.map((guest, index) => {
      if (index === selectedIndex) {
        return {
          ...guest,
          name: name,
          email: email,
          mobile: phone,
          rank: rank,
          internal_id: internal_id,
          vessel_name: vessel_name,
        };
      } else {
        return guest;
      }
    });
    setGuests(updatedGuests);

    onDataChange({
      guests: updatedGuests,
    });

    checkFinish(updatedGuests);
  };

  const checkFinish = (guests: any) => {
    const mapGuest = guests.map((guest: any) => {
      return (
        guest.name != "" &&
        guest.email != "" &&
        guest.mobile != ""
      );
    });

    mapGuest.findIndex((item: any) => item == false) == -1 ? onFinish() : "";
  };


  useEffect(() => {
    if (selectedIndex >= 0 && selectedIndex < bookingData.guests.length) {
      const selectedGuest = bookingData.guests[selectedIndex];
      // setId(selectedGuest.id || "")
      setName(selectedGuest.name)
      setEmail(selectedGuest.email)
      setPhone(selectedGuest.mobile)
      setInternal_id(selectedGuest?.internal_id || "")
      setRank(selectedGuest?.rank || "")
      setVessel_name(selectedGuest?.vessel_name || "")
    }
  }, [selectedIndex, bookingData.guests]);

  const fetchGuestDetailsByPhone = async(phone:any) => {
    setBuffer(true)
    var tt = setInterval( function() { 
      setProgress((prev:any)=>prev >=100 ? 0 : prev +10) 
    }, 1000);
    
    try {
      const response = await fetch(`${BASE_URL}/guests`, {
          method: "POST",
          headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
          },
          body: JSON.stringify({
            mobile : phone.replaceAll(/\s/g,''),
            booking_type: "Hotel",
          })
      });
      const data = await response.json();
      const guest = data.guest
      if(guest) {
        // setId(guest.id || "")
        setName(guest.name || "")
        setEmail(guest.email || "")
        setInternal_id(guest?.internal_id || "")
        setRank(guest?.rank || "")
        setVessel_name(guest?.vessel_name || "")
      }
      setIsDisabled(false)
      clearInterval(tt)
      setBuffer(false)
  } catch (error) {
      console.error("Error fetching guest details:", error);
      setIsDisabled(false)
      clearInterval(tt)
      setBuffer(false)
    }
  }

  return (
    <>
        <Card sx={styles.card}>
          <Box sx={[styles.topHeading, { paddingLeft: 2 }]}>
            <Avatar
              sx={{ bgcolor: "#21539E", height: 28, width: 30 }}
              sizes="small"
              variant="rounded"
            >
              {selectedIndex + 1}
            </Avatar>

            <CardHeader
              title={
                <div className="text-base font-bold">
                  {STRING_BOOKINGS.FORMHEADING}
                </div>
              }
              sx={[styles.topHeading, { width: "100%" }]}
            />

            <CardActions sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button variant="contained" type="submit" disabled={!name || !email || !phone ||!rank} onClick={()=>onSubmit()}>
                {"Save"}
              </Button>
            </CardActions>
          </Box>
          <Divider
            sx={{
              borderColor: "grey.500",
              width: "100%",
            }}
          />
          <Box sx={styles.Box1}>
            <Box sx={[styles.flex, { padding: 2, flexDirection: "column" }]}>
            <Box sx={[styles.flex, { gap: 5 }]}>
                <Box sx={styles.flex2}>
                  <div className="text-sm font-bold">
                    {"Mobile number"}
                    <span className="text-red-500">*</span>
                  </div>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                  <PhoneWithCountryCode
                    phone={phone}
                    setPhone={setPhone}
                    numberError={numberError}
                    setNumberError={setNumberError}
                    isDisabled={prefilledBookingData && selectedGuest?.hotel_booking_guest_id ? false : true}
                    isfetchGuest={true}
                    fetchGuestDetailsByPhone={fetchGuestDetailsByPhone}
                    isform={false}
                    setValue={()=>{}}
                  />
                  {buffer && <CircularProgress color="inherit" size={"30px"} variant="determinate" value={progress} />}
                  </Box>
                </Box>
            </Box>
              <Box sx={[styles.flex, { gap: 5 }]}>
                <Box sx={[styles.flex2]}>
                  <div className="text-sm font-bold">
                    {"Name"}
                    <span className="text-red-500">*</span>
                  </div>
                      <Box sx={[styles.flex]}>
                        <TextField
                          id={`name-${selectedIndex}`}
                          value={name}
                          variant="outlined"
                          sx={{ width: "100%" }}
                          disabled={isDisabled}
                          size="small"
                          error={nameError}
                          helperText={
                            nameError
                              ? "Enter a valid name (Atleast 3 char)"
                              : ""
                          }
                          required
                          onChange={(e:any)=> {
                            setName(e.target.value)
                            e.target.value.length <= 3 ? setNameError(true) : setNameError(false)
                          }}
                        />
                      </Box>
                </Box>

                <Box sx={styles.flex2}>
                  <div className="text-sm font-bold">
                    {"Email "}
                    <span className="text-red-500">*</span>
                  </div>
                    <Box sx={styles.flex}>
                      <TextField
                        id="input-with-sx"
                        variant="outlined"
                        value={email}
                        sx={{ width: "100%" }}
                        disabled={isDisabled}
                        onChange={(e:any)=>{
                          isValidEmail(e.target.value) ? setEmailError(false) : setEmailError(true)
                          setEmail(e.target.value)
                        }}
                        size="small"
                        error={emailError}
                        helperText={
                          emailError ? "Enter a valid email id" : ""
                        }
                        required
                      />
                    </Box>
                </Box>
              </Box>

              <Box sx={[styles.flex, { gap: 5 }]}>
                <Box sx={styles.flex2}>
                  <div className="text-sm font-bold ">
                    {"Rank"}
                    <span className="text-red-500">*</span>
                  </div>
                    <Box sx={styles.flex}>
                      <TextField
                        id="input-with-sx"
                        value={rank}
                        variant="outlined"
                        sx={{ width: "100%" }}
                        disabled={isDisabled}
                        onChange={(e:any)=>setRank(e.target.value)}
                        size="small"
                      />
                    </Box>
                </Box>

                <Box sx={styles.flex2}>
                  <div className="text-sm font-bold ">{"Internal ID"}</div>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      <TextField
                        id="input-with-sx"
                        variant="outlined"
                        value={internal_id}
                        disabled={isDisabled}
                        sx={{ width: "100%" }}
                        onChange={(e:any)=>setInternal_id(e.target.value)}
                        size="small"
                      />
                    </Box>
                </Box>
              </Box>

              <Box sx={[styles.flex, { gap: 5 }]}>
                <Box sx={styles.flex2}>
                  <div className="text-sm font-bold ">{"Vessel Name"}</div>
                    <Box sx={styles.flex}>
                      <TextField
                        id="input-with-sx"
                        variant="outlined"
                        value={vessel_name}
                        sx={{ width: "100%" }}
                        disabled={isDisabled}
                        onChange={(e:any)=>setVessel_name(e.target.value)}
                        size="small"
                      />
                    </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Card>
    </>
  );
};

export default FormComponent;
