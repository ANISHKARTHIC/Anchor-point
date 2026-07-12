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
  Tooltip,
} from "@mui/material";
import CardContent from "@mui/material/CardContent";
import { TextField } from "@mui/material";

import MailIcon from "@mui/icons-material/Mail";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { DesktopTimePicker } from "@mui/x-date-pickers/DesktopTimePicker";
import { renderTimeViewClock } from "@mui/x-date-pickers/timeViewRenderers";

import PeopleIcon from "@mui/icons-material/People";
import InfoIcon from "@mui/icons-material/Info";
import { useForm, Controller } from "react-hook-form";
import { isValidEmail } from "../utils/utils";
import { useSelector } from "react-redux";
import DateSelector from "../pages/MultiDateSelector";

interface BookingDateTimeProps {
  onClick: () => void;
  onDataChange: (data: any) => void;
  onTypeChange: any;
  handleCoordinatesChange: (data: any) => void;
  handleDescription: (data: any) => void;
  stepper: number;
}

const BookingDateTimeForm: React.FC<BookingDateTimeProps> = ({
  onClick,
  onDataChange,
  handleCoordinatesChange,
  handleDescription,
  onTypeChange,
  stepper,
}) => {
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm();

  const prefilledBookingData = useSelector(
    (state) => state.booking.prefilledBookingData,
  );

  const userRole = localStorage.getItem("role");

  const checkDisable = !prefilledBookingData && stepper >= 1;

  const [guestCount, setGuestCount] = useState(0);
  const [costCentres, setCostCentres] = useState([]);
  const [vendorCities, setVendorCities] = useState([])
  const [models, setModels] = useState([]);
  const [selectedCab, setSelectedCab] = useState("");
  const [selectedCostCenter, setSelectedCostCenter] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [selectedDates, setSelectedDates] = useState([]);
  const [selectedTime, setSelectedTime] = React.useState<Dayjs | null>(null);
  const [travelMode, setTravelMode] = useState("standard");
  const [choosenCity, setChoosenCity] = useState({
    id:0,
    city:"",
  })

  const onSubmit = (data: any) => {
    const emptyGuests = Array.from({ length: 1 }, () =>
      travelMode == "standard"
        ? {
          name: "",
          email: "",
          mobile: "",
          source: {
            name: "",
            latitude: 0,
            longitude: 0,
            address: "",
            landmark: "",
          },
          waypoints: [],
          destination: {
            name: "",
            latitude: 0,
            longitude: 0,
            address: "",
            landmark: "",
          },
        }
        : {
          name: "",
          email: "",
          mobile: "",
          source: {
            name: "",
            latitude: 0,
            longitude: 0,
            address: "",
            landmark: "",
          },
        },
    );

    onDataChange({
      cab_type: selectedCab.name,
      cost_centre_id: selectedCostCenter?.id,
      pick_up_date: selectedDates,
      pick_up_time: selectedTime?.format("HH:mm"),
      travel_mode: travelMode,
      guests: emptyGuests,
      po_number: data.poNumber,
      city_id: data?.city?.id,
    });
    
    handleCoordinatesChange(data.coordinatorEmail);
    handleDescription(data.description || "");
    onClick();
  };

  const handleTimeChange = (time: any) => {
    setSelectedTime(time);
    setValue("time", time);
  };

  const isFormDisabled = () => {
    return (
      selectedDates.length === 0 ||
      !selectedTime ||
      !selectedCab ||
      !selectedCostCenter ||
      stepper > 0
    );
  };

  const handleDateToggle = (date) => {
    setSelectedDates((prevSelectedDates) => {
      if (prevSelectedDates.some((d) => d.isSame(date, "day"))) {
        return prevSelectedDates.filter((d) => !d.isSame(date, "day"));
      }
      return [...prevSelectedDates, date];
    });
  };

  const handleSelectDates = (dates) => {
    // console.log("Selected dates: ", dates);
  };

  React.useEffect(() => {
    const fetchCostCenters = async () => {
      try {
        const response = await fetch(`${BASE_URL}/cost-centres`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        });
        const data = await response.json();
        setCostCentres(data.cost_centres);
      } catch (error) {
        console.error("Error fetching Cost Centers:", error);
      }
    };

    const fetchVendorCity = async () => {
      try {
        const response = await fetch(`${BASE_URL}/vendors/cities`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        });
        const data = await response.json();
        setVendorCities(data["vendor_city"]);
      } catch (error) {
        console.error("Error fetching Cost Centers:", error);
      }
    };

    const fetchModels = async () => {
      try {
        const response = await fetch(`${BASE_URL}/vehicles/models`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        });
        const data = await response.json();
        setModels(data.vehicle_models);

        if (
          prefilledBookingData?.data.cab_type &&
          data.vehicle_models?.length > 0
        ) {
          const matchingModel = data.vehicle_models.find(
            (model) => model.name === prefilledBookingData.data.cab_type,
          );

          if (matchingModel) {
            setValue("Cab-type", {
              id: matchingModel.id,
              name: matchingModel.name,
            });
            setSelectedCab({ id: matchingModel.id, name: matchingModel.name });
          }
        }
      } catch (error) {
        console.error("Error fetching Model:", error);
      }
    };

    const initializeFormValues = () => {
      console.log("prefilledBookingData",prefilledBookingData);
      
      setValue("coordinatorEmail", prefilledBookingData.coordinator_email);
      setValue("description", prefilledBookingData.description);

      if (prefilledBookingData.guests_count) {
        setValue("people", prefilledBookingData.guests_count);
        setGuestCount(prefilledBookingData.guests_count);
      }

      const prefilledDates = prefilledBookingData.data.pick_up_date.map(
        (date) => dayjs(date.$d || date),
      );

      setSelectedDates(prefilledDates);
      setValue("date", prefilledBookingData.data.pick_up_date);

      const formattedTime = prefilledBookingData.data.pick_up_time
        ? dayjs(prefilledBookingData.data.pick_up_time, "HH:mm A")
        : null;
      setSelectedTime(formattedTime);
      setValue("time", formattedTime);
      setValue("poNumber", prefilledBookingData.data.po_number);

      setValue("Cost-center", prefilledBookingData.cost_center);
      setSelectedCostCenter(prefilledBookingData.cost_center);
      setTravelMode(prefilledBookingData.data.travel_mode);

      setValue("city", prefilledBookingData.data.city)
      setChoosenCity(prefilledBookingData.data.city)
    };

    fetchCostCenters();
    fetchModels();
    fetchVendorCity()

    if (prefilledBookingData) {
      initializeFormValues();
    }
  }, [setValue, prefilledBookingData]);

  React.useEffect(() => {
    if (prefilledBookingData) {
      const descriptionValue = watch("description");
      const poNumberValue = watch("poNumber");

      onDataChange({
        cab_type: selectedCab.name,
        pick_up_date: selectedDates,
        pick_up_time: selectedTime?.format("HH:mm"),
        travel_mode: travelMode,
        po_number: poNumberValue,
        city:choosenCity,
      });

      onTypeChange({
        cost_center: selectedCostCenter,
        description: descriptionValue,
      });

      if (onClick) onClick();
    }
  }, [
    prefilledBookingData,
    selectedCab,
    selectedDates,
    selectedTime,
    selectedCostCenter,
    choosenCity,
    watch("description"),
    watch("poNumber"),
  ]); 

  return (
    <div className="flex">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card
          sx={{
            minWidth: 350,
            maxWidth: 350,
            minHeight: 550,
            maxHeight: 720,
          }}
        >
          <Box
            sx={{
              display: "flex",
              backgroundColor: "#FFFFFF",
              borderBottom: "1px solid #E2E8F0",
              justifyContent: "space-between",
              alignItems: "center",
              paddingRight: 1,
              position: "sticky",
              top: 0,
              zIndex: 1,
            }}
          >
            <CardHeader
              title={
                <div className="text-lg font-semibold text-slate-800">
                  {STRING_BOOKINGS.BOOKING_HEADER}
                </div>
              }
              sx={{
                justifyContent: "center",
                alignItems: "center",
                display: "flex",
                backgroundColor: "#FFFFFF",
              }}
            />

            {!prefilledBookingData && (
              <Button
                variant="contained"
                size="small"
                disabled={isFormDisabled()}
                type="submit"
                sx={{ 
                  padding: "6px 16px",
                  backgroundColor: "#334155",
                  textTransform: "none",
                  fontWeight: 500,
                  "&:hover": { backgroundColor: "#475569" }
                }}
              >
                Continue
              </Button>
            )}
          </Box>
          <Divider
            sx={{
              borderColor: "#E2E8F0",
              width: "100%",
            }}
          />
          <CardContent style={{ overflowY: "auto", flex: 1 }}>
            <div className="flex flex-col gap-1.5 ">
              {userRole != "coordinator" && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  <div className="text-sm font-semibold text-slate-800">
                    {STRING_BOOKINGS.COORDINATOR}{" "}
                    <span className="text-red-500">*</span>
                  </div>
                  <Controller
                    name="coordinatorEmail"
                    control={control}
                    rules={{
                      required: "Coordinator email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                        message: "Invalid email",
                      },
                      validate: (value) =>
                        isValidEmail(value) ||
                        "Enter a valid coordinator email",
                    }}
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
                              <InputAdornment position="start">
                                <MailIcon />
                              </InputAdornment>
                            ),
                          }}
                          size="small"
                          disabled={prefilledBookingData || stepper >= 1}
                          error={Boolean(errors.coordinatorEmail)}
                          helperText={
                            errors.coordinatorEmail
                              ? "Enter a valid email id"
                              : ""
                          }
                          required
                        />
                      </Box>
                    )}
                  />
                </Box>
              )}

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <div className="text-sm font-semibold text-slate-800">
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          value={travelMode}
                          checked={travelMode == "rental"}
                          disabled={stepper >= 1}
                          onChange={(e: any) =>
                            e.target.checked
                              ? setTravelMode("rental")
                              : setTravelMode("standard")
                          }
                        />
                      }
                      label={STRING_BOOKINGS.RENT_A_CAB}
                    />
                  </FormGroup>
                </div>
                <Tooltip title="On choosing rental cab, invoice will be calculated only according to the final distance and time travelled. Destination and stops are optional">
                  <InfoIcon color="primary" />
                </Tooltip>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <div className="text-sm font-semibold text-slate-800">
                  {STRING_BOOKINGS.DATE} <span className="text-red-500">*</span>
                </div>
                <Controller
                  name="date"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    prefilledBookingData
                      ? <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          value={dayjs(selectedDates)}
                          onChange={(value) => {
                            setSelectedDates([value]);
                            setValue("date",value)
                          }}
                          sx={{
                            width: "100%",
                            "& .MuiInputBase-root": {
                              borderRadius: "8px",
                              backgroundColor: "#FFFFFF",
                            }
                          }}
                          disabled={checkDisable}
                          slotProps={{ textField: { size: 'small' } }}
                        />
                      </LocalizationProvider>
                      :
                      <DateSelector
                        open={dialogOpen}
                        onOpen={() => setDialogOpen(true)}
                        onClose={() => setDialogOpen(false)}
                        selectedDates={selectedDates}
                        setSelectedDates={setSelectedDates}
                        onSelectDates={handleSelectDates}
                        handleDateToggle={handleDateToggle}
                        disabled={checkDisable}
                      />
                  )}
                />
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <div className="text-sm font-semibold text-slate-800">
                  {STRING_BOOKINGS.TIME} <span className="text-red-500">*</span>
                </div>
                <Controller
                  name="time"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DesktopTimePicker
                            disabled={checkDisable}
                            value={selectedTime}
                            ampm={false}
                            onChange={(value) => {
                              handleTimeChange(value); // Update local state
                              field.onChange(
                                value ? value.format("HH:mm") : null,
                              ); // Sync form state
                            }}
                            viewRenderers={{
                              hours: renderTimeViewClock,
                              minutes: renderTimeViewClock,
                              seconds: renderTimeViewClock,
                            }}
                            sx={{
                              width: "100%",
                              "& .MuiInputBase-root": {
                                borderRadius: "8px",
                                backgroundColor: "#FFFFFF",
                              }
                            }}
                            slotProps={{ textField: { size: 'small' } }}
                          // minTime={
                          //   selectedDates
                          //     ? // &&
                          //       // (selectedDates as dayjs.Dayjs).isSame(
                          //       //   dayjs(),
                          //       //   "day",
                          //       // )
                          //       dayjs()
                          //     : undefined
                          // }
                          />
                        </LocalizationProvider>
                      </Box>
                    </LocalizationProvider>
                  )}
                />
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <div className="text-sm font-semibold text-slate-800">
                  {STRING_BOOKINGS.CABTYPE}{" "}
                  <span className="text-red-500">*</span>
                </div>
                <Controller
                  name="Cab-type"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <Autocomplete
                      id="car-type"
                      value={selectedCab}
                      isOptionEqualToValue={(option, value) =>
                        option.id === value.id
                      }
                      getOptionLabel={(option) => option?.name || ""}
                      options={models || []}
                      disabled={checkDisable}
                      onChange={(event, value: any) => {
                        setSelectedCab(value);
                        field.onChange(value);
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
                  )}
                />
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <div className="text-sm font-semibold text-slate-800">
                  {STRING_BOOKINGS.COSTCENTER}{" "}
                  <span className="text-red-500">*</span>
                </div>
                <Controller
                  name="Cost-center"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      id="cost-center"
                      value={selectedCostCenter || null}
                      isOptionEqualToValue={(option, value) =>
                        option.id === value.id
                      }
                      getOptionLabel={(option) => option?.code}
                      options={costCentres || []}
                      disabled={checkDisable}
                      onChange={(event, value: any) => {
                        setSelectedCostCenter(value);
                        field.onChange(value);
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
                  )}
                />
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <div className="text-sm font-semibold text-slate-800">
                  {STRING_BOOKINGS.PO_NUMBER}
                  <span className="text-red-500">*</span>
                </div>
                <Controller
                  name="poNumber"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="outlined-textarea"
                      placeholder="PO Number"
                      size="small"
                      multiline
                      maxRows={3}
                      disabled={checkDisable}
                      required
                    />
                  )}
                />
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <div className="text-sm font-semibold text-slate-800">
                  {STRING_BOOKINGS.CITY}{" "}
                  <span className="text-red-500">*</span>
                </div>
                <Controller
                  name="city"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      id="city"
                      value={ choosenCity || null }
                      isOptionEqualToValue={(option, value) =>
                        option.id === value.id
                      }
                      options={vendorCities || []}
                      getOptionLabel={(option) => option?.city || ""}
                      disabled={checkDisable}
                      onChange={(event, value: any) => {
                        setChoosenCity(value);
                        field.onChange(value);
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
                  )}
                />
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <div className="text-sm font-semibold text-slate-800">
                  {STRING_BOOKINGS.DESCRIPTION}
                </div>
                <Controller
                  name="description"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="outlined-textarea"
                      placeholder="Description"
                      size="small"
                      multiline
                      maxRows={3}
                      disabled={checkDisable}
                    />
                  )}
                />
              </Box>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default BookingDateTimeForm;