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
  InputAdornment,
  TextField,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DesktopTimePicker } from "@mui/x-date-pickers/DesktopTimePicker";
import { renderTimeViewClock } from "@mui/x-date-pickers/timeViewRenderers";
import { BASE_URL, STRING_BOOKINGS } from "../constants/string";
import { useForm, Controller } from "react-hook-form";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { Autocomplete as GoogleMapsAutocomplete } from "@react-google-maps/api";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { AddCircle, Close } from "@mui/icons-material";
import PhoneWithCountryCode from "./PhoneWithCountryCode";
import AlternateMobile from './AlternateMobile';
import { useSelector } from "react-redux";
import moment from "moment";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;
const small = window.matchMedia("(max-width: 768px)").matches;

interface FormComponentProps {
  selectedIndex: any;
  bookingData: any;
  stepper: number;
  onDataChange: (data: any) => void;
  onFinish: () => void;
  setDeletedWaypoints: any;
}

const FormComponent: React.FC<FormComponentProps> = ({
  selectedIndex,
  bookingData,
  onDataChange,
  onFinish,
  setDeletedWaypoints,
}) => {
  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm();

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

  const selectedGuest = bookingData.data.guests[selectedIndex];
  const WAYPOINT_LIMIT = 5;

  const prefilledBookingData = useSelector(
    (state) => state.booking.prefilledBookingData,
  );

  const [autocompleteSrc, setAutocompleteSrc] = useState<any>(null);
  const [autocompleteDest, setAutocompleteDest] = useState<any>(null);
  const [autocompleteWay, setAutocompleteWay] = useState<any>([]);

  const [selectedDate, setSelectedDate] = useState<any>(null);
  const [selectedTime, setSelectedTime] = useState<any>(null);

  const [sourceError, setSourceError] = useState(false);
  const [destinationError, setDestinationError] = useState(false);

  const [phone, setPhone] = useState<any>();
  const [alternatePhone, setAlternatePhone] = useState<any>();
  const [numberError, setNumberError] = useState<any>();
  const [alternateNumberError, setAlternateNumberError] = useState<any>();
  const [isDisabled, setIsDisabled] = useState(true);
  const [progress, setProgress] = useState(0);
  const [buffer, setBuffer] = useState(false);

  const [guests, setGuests] = useState(() => {
    return (
      bookingData?.data?.guests || [
        bookingData.data.travel_mode == "standard"
          ? {
            name: "",
            email: "",
            alternate_email: "",
            mobile: "",
            alternate_mobile: "",
            source: {
              name: "",
              latitude: "",
              longitude: "",
              address: "",
              landmark: "",
              title: "",
            },
            waypoints: [],
            destination: {
              name: "",
              latitude: "",
              longitude: "",
              address: "",
              landmark: "",
              title: "",
            },
            rank: "",
            internal_id: "",
            vessel_name: "",
            date_of_duty: "",
            start_time: "",
            flight_details: "",
          }
          : {
            name: "",
            email: "",
            alternate_email: "",
            mobile: "",
            alternate_mobile: "",
            source: {
              name: "",
              latitude: "",
              longitude: "",
              address: "",
              landmark: "",
              title: ""
            },
            rank: "",
            internal_id: "",
            vessel_name: "",
            date_of_duty: "",
            start_time: "",
            flight_details: "",
          },
      ]
    );
  });

  const processWaypoints = (data: any, selectedIndex: number, guest: any) => {
    const waypoints: any[] = [];
    let i = 0;

    while (data?.[`waypoint-address-${selectedIndex}-${i}`]) {
      const existingWaypoint = guest?.waypoints?.[i] || {};

      const waypoint: any = {
        address:
          data[`waypoint-address-${selectedIndex}-${i}`] ||
          existingWaypoint.address ||
          "",
        latitude:
          data[`waypoint${i}_latitude`] || existingWaypoint.latitude || 0,
        longitude:
          data[`waypoint${i}_longitude`] || existingWaypoint.longitude || 0,
        name: "",
        landmark: "",
        waypoint_id:
          existingWaypoint.waypoint_id ||
          data[`waypoint${i}_waypoint_id`] ||
          null,
        location_id:
          existingWaypoint.location_id ||
          data[`waypoint${i}_location_id`] ||
          null,
        title: existingWaypoint?.title ||
          data[`waypoint${i}_title`] ||
          null,
      };

      waypoints.push(waypoint);
      i++;

      // Safety condition to prevent infinite loops
      if (i > 1000) {
        console.error("Exceeded waypoint processing limit.");
        break;
      }
    }

    return waypoints;
  };

  const processSource = (data: any, guest: any) => {
    const source = {
      name: data.source_doorNo || "",
      latitude:
        data.source_latitude !== undefined
          ? data.source_latitude
          : guest.source?.latitude || 0,
      longitude:
        data.source_longitude !== undefined
          ? data.source_longitude
          : guest.source?.longitude || 0,
      address: data.source || guest.source?.address || "",
      landmark: data.source_landmark || "",
      title: data.pick_address || "",
    };

    if (
      guest.source?.latitude === source.latitude &&
      guest.source?.longitude === source.longitude
    ) {
      source.location_id =
        guest.source?.location_id || data.source_location_id || "";
    } else {
      delete source.location_id;
    }

    return source;
  };

  const processDestination = (data: any, guest: any) => {
    const destination = {
      name: data.destination_doorNo || "",
      latitude:
        data.destination_latitude !== undefined
          ? data.destination_latitude
          : guest.destination?.latitude || 0,
      longitude:
        data.destination_longitude !== undefined
          ? data.destination_longitude
          : guest.destination?.longitude || 0,
      address: data.destination || guest.destination?.address || "",
      landmark: data.destination_landmark || "",
      title: data.drop_address || "",
    };

    if (
      guest.destination?.latitude === destination.latitude &&
      guest.destination?.longitude === destination.longitude
    ) {
      destination.location_id =
        guest.destination?.location_id || data.destination_location_id || "";
    } else {
      delete destination.location_id;
    }

    return destination;
  };

  const onSubmit = (data: any) => {

    const updatedGuests = guests.map((guest, index) => {
      if (index === selectedIndex) {
        const waypoints = guest?.waypoints?.length ? processWaypoints(data, selectedIndex, guest) : [];
        const source = processSource(data, guest);
        const destination = processDestination(data, guest);

        let obj =
          bookingData.data.travel_mode == "standard"
            ? {
              name: data.name.trim(),
              email: data.email,
              alternate_email: data?.alternate_email,
              mobile: data.mobile,
              alternate_mobile: data?.alternate_mobile,
              // address_title: data.address,
              source,
              waypoints,
              destination,
              rank: data.rank,
              internal_id: data.internal_id,
              vessel_name: data.vessel_name,
              date_of_duty: data.date_of_duty,
              start_time: data.start_time,
              flight_details: data.flight_details,
            }
            : {
              name: data.name.trim(),
              email: data.email,
              alternate_email: data?.alternate_email,
              mobile: data.mobile,
              alternate_mobile: data?.alternate_mobile,
              source,
              rank: data.rank,
              internal_id: data.internal_id,
              vessel_name: data.vessel_name,
              date_of_duty: data.date_of_duty,
              start_time: data.start_time,
              flight_details: data.flight_details,
            };

        const updatedGuest = {
          ...guest,
          ...obj,
        };

        // if (data.id) {
        //   updatedGuest.id = data.id;
        // }

        return updatedGuest;
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
        guest.mobile != "" &&
        guest.source.address != "" &&
        guest.source.latitude != 0 &&
        guest.source.longitude != 0 &&
        ((bookingData.data.travel_mode == "standard" &&
          guest.destination.address != "") ||
          bookingData.data.travel_mode == "rental") &&
        ((bookingData.data.travel_mode == "standard" &&
          guest.destination.latitude != 0) ||
          bookingData.data.travel_mode == "rental") &&
        ((bookingData.data.travel_mode == "standard" &&
          guest.destination.longitude != 0) ||
          bookingData.data.travel_mode == "rental")
      );
    });

    mapGuest.findIndex((item: any) => item == false) == -1 ? onFinish() : "";
  };

  const handlePlaceChanged = (waypointIndex: number, selectedPlace: any) => {
    if (selectedPlace) {
      setValue(
        `waypoint-address-${selectedIndex}-${waypointIndex}`,
        selectedPlace.formatted_address,
      );
      setValue(
        `waypoint${waypointIndex}_latitude`,
        selectedPlace.geometry?.location.lat() || 0,
      );
      setValue(
        `waypoint${waypointIndex}_longitude`,
        selectedPlace.geometry?.location.lng() || 0,
      );

      setTimeout(() => {
        console.log("Updated Form Values:", getValues());
      }, 2000);
    }
  };

  const handleAddWaypoint = () => {
    // Clone the guests data to avoid direct mutation
    const updatedGuests = [...guests];

    // Get the selected guest (clone to avoid mutation)
    const selectedGuest = { ...updatedGuests[selectedIndex] };

    if (selectedGuest) {
      // Clone the waypoints array to ensure immutability
      const updatedWaypoints = [...(selectedGuest.waypoints || [])];

      // Create a new empty waypoint object
      const newWaypoint = {
        name: "",
        address: "",
        landmark: "",
        latitude: 0,
        longitude: 0,
      };

      // Append the new waypoint to the cloned array
      updatedWaypoints.push(newWaypoint);

      // Update the selected guest with the modified waypoints
      updatedGuests[selectedIndex] = {
        ...selectedGuest,
        waypoints: updatedWaypoints,
      };

      // Update the guests state
      setGuests(updatedGuests);
    }
  };

  const handleRemoveWaypoint = (guestData: any, waypointIndex: number) => {
    const updatedGuests = [...guests];

    const selectedGuest = { ...updatedGuests[selectedIndex] };

    if (!selectedGuest || !selectedGuest.waypoints) return;

    const deletedWaypoint = selectedGuest.waypoints[waypointIndex];
    const { booking_log_id } = guestData;

    if (booking_log_id && deletedWaypoint?.waypoint_id) {
      setDeletedWaypoints((prevDeleted: any) => {
        const updatedDeleted = { ...prevDeleted };

        if (updatedDeleted[booking_log_id]) {
          updatedDeleted[booking_log_id].push({
            ...deletedWaypoint,
            delete: true,
          });
        } else {
          updatedDeleted[booking_log_id] = [
            { ...deletedWaypoint, delete: true },
          ];
        }

        return updatedDeleted;
      });
    }

    // Reset form values for the waypoint being removed
    setValue(`waypoint${waypointIndex}_latitude`, 0);
    setValue(`waypoint${waypointIndex}_longitude`, 0);
    setValue(`waypoint-address-${selectedIndex}-${waypointIndex}`, "");

    // Remove the waypoint by filtering it out
    const updatedWaypoints = selectedGuest.waypoints.filter(
      (_, index) => index !== waypointIndex,
    );

    // Update the selected guest with the new waypoints
    updatedGuests[selectedIndex] = {
      ...selectedGuest,
      waypoints: updatedWaypoints,
    };

    // Update the guests state
    setGuests(updatedGuests);

    // Optionally log changes for debugging
    console.log("Updated guests:", updatedGuests);
  };

  const fetchGuestDetailsByPhone = async (phone: any) => {
    setBuffer(true);
    var tt = setInterval(function () {
      setProgress((prev: any) => (prev >= 100 ? 0 : prev + 10));
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
          mobile: phone.replaceAll(/\s/g, ""),
          booking_type: "Cab",
        }),
      });
      const data = await response.json();
      const guest = data.guest;
      if (guest) {
        setValue("name", guest.name || "");
        setValue("email", guest.email || "");
        setValue("alternate_email", guest.alternate_email || "")
        setValue("alternate_mobile", guest.alternate_mobile || "")
        setValue("rank", guest.rank || "");
        setValue("internal_id", guest.internal_id || "");
        setValue("vessel_name", guest.vessel_name || "");
        // setValue("id", guest.id);
      }
      setIsDisabled(false);
      clearInterval(tt);
      setBuffer(false);
    } catch (error) {
      console.error("Error fetching guest details:", error);
      setIsDisabled(false);
      clearInterval(tt);
      setBuffer(false);
    }
  };

  useEffect(() => {
    if (bookingData?.data?.guests) {
      setGuests(bookingData.data.guests);
    }
  }, [bookingData]);

  useEffect(() => {
    if (selectedIndex >= 0 && selectedIndex < bookingData.data.guests.length) {
      const selectedGuest = bookingData.data.guests[selectedIndex];

      if (selectedGuest) {
        setValue("name", selectedGuest.name || "");
        setValue("email", selectedGuest.email || "");
        setValue("mobile", selectedGuest.mobile || "");
        setValue("alternate_email", selectedGuest.alternate_email || "");
        setValue("alternate_mobile", selectedGuest.alternate_mobile || "");
        setValue("rank", selectedGuest.rank || "");
        setValue("internal_id", selectedGuest.internal_id || "");
        setValue("vessel_name", selectedGuest.vessel_name || "");
        setValue("flight_details", selectedGuest.flight_details || "");

        const formattedDate = selectedGuest.date_of_duty
          ? dayjs(selectedGuest.date_of_duty).format("YYYY-MM-DD")
          : "";

        setSelectedDate(formattedDate);
        setValue("date_of_duty", formattedDate || "");

        const formattedTime = selectedGuest.start_time
          ? dayjs(selectedGuest.start_time, "HH:mm").format("HH:mm")
          : "";
        setSelectedTime(formattedTime);
        setValue("start_time", formattedTime || "");

        setValue("source", selectedGuest.source.address || "");
        setValue("pick_address", selectedGuest.source.title || "")
        setValue("source_doorNo", selectedGuest.source.name || "");
        setValue("source_landmark", selectedGuest.source.landmark || "");

        if (bookingData.data.travel_mode == "standard") {
          setValue("destination", selectedGuest.destination.address || "");
          setValue("drop_address", selectedGuest.destination.title || "")
          setValue("destination_doorNo", selectedGuest.destination.name || "");
          setValue(
            "destination_landmark",
            selectedGuest.destination.landmark || "",
          );

          selectedGuest.waypoints?.forEach((waypoint: any, index: number) => {
            setValue(
              `waypoint-address-${selectedIndex}-${index}`,
              waypoint.address || "",
            );
            setValue(`waypoint${index}_latitude`, waypoint.latitude || 0);
            setValue(`waypoint${index}_longitude`, waypoint.longitude || 0);
          });
        }
      }
    }
  }, [selectedIndex, bookingData.data.guests, setValue]);

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
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
              <Button
                variant="contained"
                disabled={
                  !prefilledBookingData
                    ? sourceError || destinationError || isDisabled
                    : false
                }
                type="submit"
              >
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
                    {"Mobile number "}
                    <span className="text-red-500">*</span>
                  </div>
                  <Controller
                    name="mobile"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <PhoneWithCountryCode
                          {...field}
                          phone={getValues("mobile")}
                          setPhone={setPhone}
                          numberError={numberError}
                          setNumberError={setNumberError}
                          isfetchGuest={true}
                          fetchGuestDetailsByPhone={fetchGuestDetailsByPhone}
                          isform={true}
                          setValue={setValue}
                          isDisabled={prefilledBookingData && selectedGuest?.booking_log_id ? false : true}
                        />
                        {buffer && (
                          <CircularProgress
                            color="inherit"
                            size={"30px"}
                            variant="determinate"
                            value={progress}
                          />
                        )}
                      </Box>
                    )}
                  />
                </Box>
                <Box sx={styles.flex2}>
                  <div className="text-sm font-bold">
                    {"Alternate Mobile"}
                  </div>
                  <Controller
                    name="alternate_mobile"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <AlternateMobile
                          {...field}
                          alternateMobile={getValues("alternate_mobile")}
                          setAlternatePhone={setAlternatePhone}
                          alternateNumberError={alternateNumberError}
                          setAlternateNumberError={setAlternateNumberError}
                          isfetchGuest={true}
                          // fetchGuestDetailsByPhone={fetchGuestDetailsByPhone}
                          isform={true}
                          setValue={setValue}
                          isDisabled={prefilledBookingData && selectedGuest?.booking_log_id ? false : true}
                        />
                        {/* {buffer && (
                          <CircularProgress
                            color="inherit"
                            size={"30px"}
                            variant="determinate"
                            value={progress}
                          />
                        )} */}
                      </Box>
                    )}
                  />
                </Box>
              </Box>
              <Box sx={[styles.flex2, { width: "100%" }]}>
                <div className="text-sm font-bold">
                  {"Name "}
                  <span className="text-red-500">*</span>
                </div>
                <Controller
                  name={"name"}
                  control={control}
                  defaultValue={getValues("name") || ""}
                  rules={{
                    minLength: 3,
                  }}
                  render={({ field }) => (
                    <Box sx={[styles.flex]}>
                      <TextField
                        {...field}
                        id={`name-${selectedIndex}`}
                        variant="outlined"
                        sx={{ width: "100%" }}
                        // disabled={isDisabled}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start"></InputAdornment>
                          ),
                        }}
                        size="small"
                        error={Boolean(errors.name)}
                        helperText={
                          errors.name
                            ? "Enter a valid name (Atleast 3 char)"
                            : ""
                        }
                        required
                      />
                    </Box>
                  )}
                />
              </Box>
              <Box sx={[styles.flex, { gap: 5, }]}>
                <Box sx={styles.flex2}>
                  <div className="text-sm font-bold">
                    {"Email "}
                    <span className="text-red-500">*</span>
                  </div>
                  <Controller
                    name="email"
                    control={control}
                    defaultValue=""
                    rules={{
                      required: "Passenger email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                        message: "Invalid email",
                      },
                    }}
                    render={({ field }) => (
                      <Box sx={styles.flex}>
                        <TextField
                          {...field}
                          id="input-with-sx"
                          variant="outlined"
                          sx={{ width: "100%" }}
                          // disabled={isDisabled}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start"></InputAdornment>
                            ),
                          }}
                          size="small"
                          error={Boolean(errors.email)}
                          helperText={
                            errors.email ? "Enter a valid email id" : ""
                          }
                          required
                        />
                      </Box>
                    )}
                  />
                </Box>
                <Box sx={styles.flex2}>
                  <div className="text-sm font-bold">
                    {"Alternate Email "}
                  </div>
                  <Controller
                    name="alternate_email"
                    control={control}
                    defaultValue=""
                    rules={{
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                        message: "Invalid email",
                      },
                    }}
                    render={({ field }) => (
                      <Box sx={styles.flex}>
                        <TextField
                          {...field}
                          id="input-with-sx"
                          variant="outlined"
                          sx={{ width: "100%" }}
                          size="small"
                          error={Boolean(errors.alternateEmail)}
                          helperText={
                            errors.alternateEmail ? "Enter a valid email id" : ""
                          }
                        />
                      </Box>
                    )}
                  />
                </Box>
              </Box>
              <Box sx={[styles.flex2, { width: "100%" }]}>
                <div className="text-sm font-bold">
                  {"Address Title "}
                  <span className="text-red-500">*</span>
                </div>
                <Controller
                  name={"pick_address"}
                  control={control}
                  defaultValue={getValues("pick_address") || ""}
                  rules={{
                    minLength: 3,
                  }}
                  render={({ field }) => (
                    <Box sx={[styles.flex]}>
                      <TextField
                        {...field}
                        id={`name-${selectedIndex}`}
                        variant="outlined"
                        sx={{ width: "100%" }}
                        // disabled={isDisabled}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start"></InputAdornment>
                          ),
                        }}
                        size="small"
                        error={Boolean(errors.pick_address)}
                        helperText={
                          errors.pick_address
                            ? "Enter a valid name (Atleast 3 char)"
                            : ""
                        }
                        required
                      />
                    </Box>
                  )}
                />
              </Box>
              <Box>
                <Box sx={[styles.flex2, { width: "100%" }]}>
                  <div className="text-sm font-bold ">
                    {"Pick up "}
                    <span className="text-red-500">*</span>
                  </div>
                  <Controller
                    name="source"
                    control={control}
                    defaultValue=""
                    rules={{
                      onChange(event) {
                        getValues("source_latitude") == 0 ||
                          getValues("source_longitude") == 0 ||
                          getValues("source") == ""
                          ? setSourceError(true)
                          : "";
                      },
                    }}
                    render={({ field }) => (
                      <Box sx={[styles.flex2, { width: "100%" }]}>
                        <GoogleMapsAutocomplete
                          onLoad={(ac: any) => setAutocompleteSrc(ac)}
                          onPlaceChanged={() => {
                            const selectedPlace = autocompleteSrc?.getPlace();
                            if (selectedPlace) {
                              setValue(
                                "source",
                                selectedPlace.formatted_address,
                              );
                              setValue(
                                "source_latitude",
                                selectedPlace.geometry.location.lat(),
                              );
                              setValue(
                                "source_longitude",
                                selectedPlace.geometry.location.lng(),
                              );
                              setSourceError(false);
                            }
                          }}
                          options={{
                            componentRestrictions: { country: "IN" },
                          }}
                        >
                          <TextField
                            {...field}
                            id="address-with-icon-textfield-src"
                            type="text"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start"></InputAdornment>
                              ),
                            }}
                            variant="outlined"
                            // disabled={isDisabled}
                            size="small"
                            sx={{ width: "100%" }}
                            required
                            error={sourceError}
                            helperText={
                              sourceError
                                ? "Please select a suitable place from the list"
                                : ""
                            }
                          />
                        </GoogleMapsAutocomplete>
                      </Box>
                    )}
                  />
                  <Box sx={styles.Box2}>
                    <Box>
                      <Controller
                        name="source_doorNo"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <Box sx={styles.flex}>
                            <TextField
                              {...field}
                              id="input-with-sx"
                              variant="filled"
                              label="Door No"
                              sx={{ width: "100%" }}
                              // disabled={isDisabled}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start"></InputAdornment>
                                ),
                              }}
                              size="small"
                            />
                          </Box>
                        )}
                      />
                    </Box>
                    <Box>
                      <Controller
                        name="source_landmark"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <Box sx={styles.flex}>
                            <TextField
                              {...field}
                              id="input-with-sx"
                              variant="filled"
                              label="LandMark"
                              // disabled={isDisabled}
                              sx={{ width: "100%" }}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start"></InputAdornment>
                                ),
                              }}
                              size="small"
                            />
                          </Box>
                        )}
                      />
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Render waypoints */}

              {/* Add Waypoint Button */}
              {bookingData.data.travel_mode == "standard" &&
                guests[selectedIndex]?.waypoints?.length <=
                WAYPOINT_LIMIT - 1 && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginTop: 2,
                    }}
                  >
                    <Button
                      startIcon={<AddCircle />}
                      onClick={handleAddWaypoint}
                      variant="contained"
                      size="small"
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      Add Stops
                    </Button>
                  </Box>
                )}

              {bookingData.data.travel_mode == "standard"
                ? guests[selectedIndex]?.waypoints?.map(
                  (waypoint, waypointIndex) => (
                    <Box key={waypointIndex} sx={{ marginBottom: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        <Controller
                          name={`waypoint-address-${selectedIndex}-${waypointIndex}`}
                          control={control}
                          defaultValue={waypoint.address || ""}
                          render={({ field }) => (
                            <>
                              <div className="text-sm font-bold">
                                Stop {waypointIndex + 1}
                              </div>
                              <Box sx={styles.flex3}>
                                <GoogleMapsAutocomplete
                                  onLoad={(ac) => {
                                    setAutocompleteWay((prev) => {
                                      const updateAutocomplete = [...prev];
                                      updateAutocomplete[waypointIndex] = ac;
                                      return updateAutocomplete;
                                    });
                                  }}
                                  options={{
                                    componentRestrictions: { country: "IN" },
                                  }}
                                  onPlaceChanged={() => {
                                    const ac = autocompleteWay[waypointIndex];
                                    if (ac) {
                                      const selectedPlace = ac.getPlace();
                                      if (
                                        selectedPlace &&
                                        selectedPlace.formatted_address
                                      ) {
                                        handlePlaceChanged(
                                          waypointIndex,
                                          selectedPlace,
                                        );
                                      } else {
                                        console.warn(
                                          `Selected place is undefined for waypoint ${waypointIndex}`,
                                        );
                                      }
                                    }
                                  }}
                                >
                                  <TextField
                                    {...field}
                                    id={`waypoint-address-${selectedIndex}-${waypointIndex}`}
                                    InputProps={{
                                      startAdornment: (
                                        <InputAdornment position="start" />
                                      ),
                                    }}
                                    variant="outlined"
                                    size="small"
                                    sx={{ width: "210%" }}
                                    type="text"
                                    fullWidth
                                    required
                                  />
                                </GoogleMapsAutocomplete>
                                <Close
                                  onClick={() =>
                                    handleRemoveWaypoint(
                                      selectedGuest,
                                      waypointIndex,
                                    )
                                  }
                                  sx={{
                                    cursor: "pointer",
                                    alignSelf: "center",
                                    marginLeft: 1,
                                  }}
                                />
                              </Box>
                            </>
                          )}
                        />
                      </Box>
                    </Box>
                  ),
                )
                : ""}
              {bookingData.data.travel_mode == "standard" &&
                <Box sx={[styles.flex2, { width: "100%" }]}>
                  <div className="text-sm font-bold">
                    {"Address Title "}
                    <span className="text-red-500">*</span>
                  </div>
                  <Controller
                    name={"drop_address"}
                    control={control}
                    defaultValue={getValues("drop_address") || ""}
                    rules={{
                      minLength: 3,
                    }}
                    render={({ field }) => (
                      <Box sx={[styles.flex]}>
                        <TextField
                          {...field}
                          id={`name-${selectedIndex}`}
                          variant="outlined"
                          sx={{ width: "100%" }}
                          // disabled={isDisabled}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start"></InputAdornment>
                            ),
                          }}
                          size="small"
                          error={Boolean(errors.drop_address)}
                          helperText={
                            errors.drop_address
                              ? "Enter a valid name (Atleast 3 char)"
                              : ""
                          }
                          required
                        />
                      </Box>
                    )}
                  />
                </Box>
              }
              {bookingData.data.travel_mode == "standard" && (
                <Box>
                  <Box sx={[styles.flex2, { width: "100%" }]}>
                    <div className="text-sm font-bold ">
                      {"Drop"}
                      <span className="text-red-500">*</span>
                    </div>
                    <Controller
                      name="destination"
                      control={control}
                      defaultValue=""
                      rules={{
                        onChange(event) {
                          getValues("destination_latitude") == 0 ||
                            getValues("destination_longitude") == 0 ||
                            getValues("destination") == ""
                            ? setDestinationError(true)
                            : "";
                        },
                      }}
                      render={({ field }) => (
                        <Box sx={[styles.flex2, { width: "100%" }]}>
                          <GoogleMapsAutocomplete
                            onLoad={(ac: any) => setAutocompleteDest(ac)}
                            options={{
                              componentRestrictions: { country: "IN" },
                            }}
                            onPlaceChanged={() => {
                              const selectedDestination =
                                autocompleteDest?.getPlace();
                              if (selectedDestination) {
                                setValue(
                                  "destination",
                                  selectedDestination.formatted_address,
                                );
                                setValue(
                                  "destination_latitude",
                                  selectedDestination.geometry.location.lat(),
                                );
                                setValue(
                                  "destination_longitude",
                                  selectedDestination.geometry.location.lng(),
                                );
                                setDestinationError(false);
                              }
                            }}
                          >
                            <TextField
                              {...field}
                              id="address-with-icon-textfield-dest"
                              type="text"
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start"></InputAdornment>
                                ),
                              }}
                              variant="outlined"
                              // disabled={isDisabled}
                              size="small"
                              sx={{ width: "100%" }}
                              required
                              error={destinationError}
                              helperText={
                                destinationError
                                  ? "Please select a suitable place from the list"
                                  : ""
                              }
                            />
                          </GoogleMapsAutocomplete>
                        </Box>
                      )}
                    />
                    <Box sx={styles.Box2}>
                      <Box>
                        <Controller
                          name="destination_doorNo"
                          control={control}
                          defaultValue=""
                          render={({ field }) => (
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                              }}
                            >
                              <TextField
                                {...field}
                                id="input-with-sx"
                                variant="filled"
                                label="Door No"
                                // disabled={isDisabled}
                                sx={{ width: "100%" }}
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start"></InputAdornment>
                                  ),
                                }}
                                size="small"
                              />
                            </Box>
                          )}
                        />
                      </Box>
                      <Box>
                        <Controller
                          name="destination_landmark"
                          control={control}
                          defaultValue=""
                          render={({ field }) => (
                            <Box sx={styles.flex}>
                              <TextField
                                {...field}
                                id="input-with-sx"
                                variant="filled"
                                label="LandMark"
                                // disabled={isDisabled}
                                sx={{ width: "100%" }}
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start"></InputAdornment>
                                  ),
                                }}
                                size="small"
                              />
                            </Box>
                          )}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}

              <Box sx={[styles.flex, { gap: 5 }]}>
                <Box sx={styles.flex2}>
                  <div className="text-sm font-bold ">{"Rank"}</div>
                  <Controller
                    name="rank"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <Box sx={styles.flex}>
                        <TextField
                          {...field}
                          id="input-with-sx"
                          variant="outlined"
                          sx={{ width: "100%" }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start"></InputAdornment>
                            ),
                          }}
                          size="small"
                        />
                      </Box>
                    )}
                  />
                </Box>

                <Box sx={styles.flex2}>
                  <div className="text-sm font-bold ">{"Internal ID"}</div>
                  <Controller
                    name="internal_id"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <TextField
                          {...field}
                          id="input-with-sx"
                          variant="outlined"
                          sx={{ width: "100%" }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start"></InputAdornment>
                            ),
                          }}
                          size="small"
                        />
                      </Box>
                    )}
                  />
                </Box>
              </Box>

              <Box sx={[styles.flex, { gap: 5 }]}>
                <Box sx={styles.flex2}>
                  <div className="text-sm font-bold">{"Vessel Name"}</div>
                  <Controller
                    name="vessel_name"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <Box sx={styles.flex}>
                        <TextField
                          {...field}
                          defaultValue=""
                          id="input-with-sx"
                          variant="outlined"
                          sx={{ width: "100%" }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start"></InputAdornment>
                            ),
                          }}
                          size="small"
                        />
                      </Box>
                    )}
                  />
                </Box>

                <Box sx={styles.flex2}>
                  <div className="text-sm font-bold ">{"Flight Details"}</div>
                  <Controller
                    name="flight_details"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <Box sx={styles.flex}>
                        <TextField
                          {...field}
                          defaultValue=""
                          id="input-with-sx"
                          variant="outlined"
                          sx={{ width: "100%" }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start"></InputAdornment>
                            ),
                          }}
                          size="small"
                        />
                      </Box>
                    )}
                  />
                </Box>
              </Box>

              <Box sx={[styles.flex, { gap: 5 }]}>
                <Box sx={styles.flex2}>
                  <div className="font-bold text-sm">{"Date Of Duty"}</div>
                  <Controller
                    name="date_of_duty"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          {...field}
                          value={
                            selectedDate
                              ? dayjs(selectedDate, "YYYY-MM-DD")
                              : null
                          }
                          onChange={(value: any) => {
                            if (value) {
                              // Format the selected date for submission and display
                              const formattedForSubmission =
                                dayjs(value).format("YYYY-MM-DD");

                              setSelectedDate(formattedForSubmission); // Save the original format
                              setValue("date_of_duty", formattedForSubmission); // Update the form value
                            }
                          }}
                          format="DD-MM-YYYY" // Display format in UI
                          sx={{
                            "& .css-nxo287-MuiInputBase-input-MuiOutlinedInput-input":
                            {
                              padding: "10px",
                            },
                          }}
                        />
                      </LocalizationProvider>
                    )}
                  />
                </Box>

                <Box sx={styles.flex2}>
                  <div className="font-bold text-sm">{"Start Time"}</div>
                  <Controller
                    name="start_time"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Box sx={styles.flex}>
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DesktopTimePicker
                              {...field}
                              value={
                                selectedTime
                                  ? dayjs(selectedTime, "HH:mm")
                                  : null
                              }
                              ampm={false}
                              onChange={(value: any) => {
                                // const formattedTime = moment(
                                //   value,
                                //   "hh:mm A",
                                // ).format("HH:mm");
                                const formattedTime = dayjs(
                                  value,
                                  "hh:mm A",
                                ).format("HH:mm");

                                setSelectedTime(formattedTime);
                                setValue("start_time", formattedTime);
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
                              }}
                            />
                          </LocalizationProvider>
                        </Box>
                      </LocalizationProvider>
                    )}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </Card>
      </form>
    </>
  );
};

export default FormComponent;