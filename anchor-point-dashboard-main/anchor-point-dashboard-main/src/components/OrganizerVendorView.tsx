import React, { useState, useEffect } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import AccountCircle from "@mui/icons-material/AccountCircle";
import EmailIcon from "@mui/icons-material/Email";
import OfflinePinIcon from "@mui/icons-material/OfflinePin";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import DomainIcon from "@mui/icons-material/Domain";
import PercentIcon from "@mui/icons-material/Percent";
import PersonIcon from '@mui/icons-material/Person';
import {
  BASE_URL,
} from "../constants/string";
import {
  Autocomplete as GoogleMapsAutocomplete,
} from "@react-google-maps/api";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Backdrop,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogTitle,
  FormControlLabel,
  Switch,
  Tooltip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import VendorDetails from "./VendorDetails";
import DriverCharges from "./DriverCharges";
import PhoneWithCountryCode from "./PhoneWithCountryCode";
import HotelPackages from "./HotelPackages";
import Toast from "./Toast";
import Garage from "./Garage";

interface OrganizerVendorViewProps {
  users: any[];
  setUsers: (user: any) => void;
  selectedUser: any;
  onUserClick: (user: any) => void;
  fetchUserById: (userId: any) => Promise<any>;
  updateUser: (userId: any, userData: any) => Promise<void>;
  isOrganizer: boolean;
  createUser: (data: any) => Promise<any>;
  alertType: any;
  alertMsg: any;
}

interface City {
  id: number;
  city: string;
}

const OrganizerVendorView: React.FC<OrganizerVendorViewProps> = ({
  users,
  setUsers,
  selectedUser,
  onUserClick,
  fetchUserById,
  updateUser,
  isOrganizer,
  createUser,
  alertMsg,
  alertType,
}) => {
  const MAX_MOBILE_LENGTH = 13;
  const small = window.matchMedia("(max-width: 768px)").matches

  const [isSuperOrganizer, setIsSuperOrganizer] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<any>([]);
  const [isEditing, setEditing] = useState(false);
  const [editedName, setEditedName] = useState(selectedUser?.name || "");
  const [editedEmail, setEditedEmail] = useState(selectedUser?.email || "");
  const [editedTax, setEditedTax] = useState(selectedUser?.tax || "");
  const [cityOptions, setCityOptions] = useState<any>([]);
  const [model,setModel] = useState([]);
  const [vehicles,setVehicles] = useState([]);
  const [roomType,setRoomType] = useState([]);
  const [packages, setPackages] = useState([]);
  const [isThirdParty,setIsThirdParty] = useState(selectedUser?.is_third_party || false);

  const bookingtype = localStorage.getItem("bookingtype");

  const [primaryMobile, setPrimaryMobile] = useState(
    selectedUser?.primary_mobile || "",
  );
  const [secondaryMobile, setSecondaryMobile] = useState(
    selectedUser?.secondary_mobile || "",
  );
  const [priErr,setPriError] = useState(false)
  const [secErr,setSecError] = useState(false)
  const [address, setAddress] = useState(selectedUser?.address || "");
  const [coordinate, setCoordinate] = useState("");
  const [autocomplete, setAutocomplete] = useState<any>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [expanded, setExpanded] = useState<string | false>(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [isActive, setIsActive] = useState(selectedUser?.is_active);
  const [isDelete,setIsDelete] = useState(false);
  const [progress,setProgress] = useState(false);
  const [mealPlan, setMealPlan] = useState([]);
  const userID = localStorage.getItem("userID")

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
      setExpanded(newExpanded ? panel : false);
    };

  const handleAddress = (place: any) => {
    if (place && place.geometry && place.geometry.location) {
      const coordinates = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };

      setCoordinate(`${coordinates.lat},${coordinates.lng}`);
    }
  };

  const fetchUserDetails = async (userId: any) => {
    try {
      const fetchedUserDetails = await fetchUserById(userId);

      if (fetchedUserDetails) {
        setEditedName(fetchedUserDetails.name);
        setEditedEmail(fetchedUserDetails.email);
        setCoordinate(fetchedUserDetails.coordinates);
        setSelectedCity({
          id: fetchedUserDetails.city_id,
          city: fetchedUserDetails.city,
        });
        setPrimaryMobile(fetchedUserDetails.primary_mobile);
        setSecondaryMobile(fetchedUserDetails.secondary_mobile);
        setAddress(fetchedUserDetails.address);
        setEditedTax(fetchedUserDetails.tax);
        setIsSuperOrganizer(fetchedUserDetails.role === 1);
        setIsThirdParty(fetchedUserDetails.is_third_party === true )
        setIsActive(fetchedUserDetails.is_active);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const handleUserClick = async (user: any) => {
    try {
      window.scroll({
        top: document.body.offsetHeight,
        left: 0, 
        behavior: 'smooth',
      });
      await fetchUserDetails(user.id);
      onUserClick(user);
    } catch (error) {
      console.error("Error handling user click:", error);
    }
  };

  const handleEditClick = async () => {
    if (selectedUser) {
      try {
        fetchUserDetails(selectedUser.id);
        setEditing(true);
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    }
  };

  const handleCreateClick = () => {
    setEditing(true);
    onUserClick({ create: "new" });
    setIsNewUser(true);
    setEditedName("");
    setEditedEmail("");
    setPrimaryMobile("");
    setSecondaryMobile("");
    setAddress("");
    setCoordinate("");
    setEditedTax("");
    setIsSuperOrganizer(false);
    setIsActive(true)
    setIsThirdParty(false)
  };

  const handleCreateUserClick = async () => {
    if(!isOrganizer && ((primaryMobile.trim() != "" && secondaryMobile.trim() != "") && primaryMobile == secondaryMobile)) return alert("Primary and Secondary number must not be the same.")
    setProgress(true)

    const resp = await createUser({
      name: editedName.trim(),
      ...(isOrganizer
        ? {
            email: editedEmail,
            role: isSuperOrganizer ? 1 : 0,
          }
        : {
            email: editedEmail,
            address: address,
            coordinates: coordinate,
            city_id: selectedCity?.id || 1,
            primary_mobile: primaryMobile.replaceAll(/\s/g,''),
            secondary_mobile: secondaryMobile.replaceAll(/\s/g,''),
            tax: parseInt(editedTax),
            is_third_party: isThirdParty,
            vendor_type: bookingtype,
          }),
    });
    if(resp) 
      {
         handleBackClick() 
      }
    setProgress(false)
  };

  const handleBackClick = () => {
    setEditing(false);
    setIsNewUser(false);
    setFilteredUsers(users);
    handleUserClick(users[0]);
    setProgress(false)
  };

  const handleSaveClick = async (val=true) => {
    try {
      if(!isOrganizer && ((primaryMobile.trim() != "" && secondaryMobile.trim() != "") && primaryMobile == secondaryMobile)) return alert("Primary and Secondary number must not be the same.")
      if (selectedUser) {
        setProgress(true)
        await updateUser(selectedUser.id, {
          name: editedName.trim(),
          ...(isOrganizer
            ? {
                role: isSuperOrganizer ? 1 : 0,
                is_verified: true,
                is_active: val,
              }
            : {
                ...(address
                  ? {
                      address,
                      coordinates: coordinate,
                      city_id: selectedCity?.id || 1,
                      primary_mobile: primaryMobile.replaceAll(/\s/g,''),
                      secondary_mobile: secondaryMobile.replaceAll(/\s/g,''),
                      tax: editedTax,
                      is_active: val,
                      is_verified: true,
                      is_third_party: isThirdParty,
                      vendor_type: bookingtype,
                    }
                  : {
                      city_id: cityOptions,
                      is_active: val,
                      is_verified: true,
                      primary_mobile: primaryMobile.replaceAll(/\s/g,''),
                      secondary_mobile: secondaryMobile.replaceAll(/\s/g,''),
                      tax: editedTax,
                      is_third_party: isThirdParty,
                      vendor_type: bookingtype,
                    }),
              }),
        });
        const updatedUser = await fetchUserById(selectedUser.id);

        if (updatedUser) {
          setFilteredUsers((prevUsers: any) =>
            prevUsers.map((user: any) =>
              user.id === selectedUser.id ? updatedUser : user,
            ),
          );
          setUsers((prevUsers: any) =>
            prevUsers.map((user: any) =>
              user.id === selectedUser.id ? updatedUser : user,
            ),
          );
          setIsActive(val)
          setIsDelete(false)
          onUserClick(updatedUser);
          setProgress(false)
        }
      }
    } catch (error) {
      console.error("Error updating user data:", error);
      setProgress(false)
    }

    setEditing(false);
  };

  const handleSearchClick = (user: any) => {
    window.scroll({
      top: document.body.offsetHeight,
      left: 0, 
      behavior: 'smooth',
    });
    onUserClick(user);
    filterUsers(user);
  };

  const handleSearchClear = () => {
    setFilteredUsers(users);
  };

  const handleSearchChange = (newValue: any) => {
    filterUsers(newValue);
  };

  const filterUsers = (searchValue: any) => {
    const filteredList = users.filter((user: any) =>
      user.name.includes(searchValue.name),
    );
    setFilteredUsers(filteredList);
  };

  const handleEmailChange = (e: any) => {
    const email = e.target.value;
    setEditedEmail(email);
  };

  const handleCityChange = (event: any, value: any) => {
    setSelectedCity(value);
  };

  useEffect(() => {
    setFilteredUsers(users);
    if (!selectedUser && Array.isArray(users) && users.length > 0) {
      handleUserClick(users[0]);
    } else {
      handleUserClick(selectedUser);
    }
  }, [users]);

  useEffect(() => {
    if(!isOrganizer) {
      fetchCityOptions()
      if(bookingtype == "cab") {
        fetchModels()
        fetchVehicles()
        fetchPackageData()
      } else {
        fetchMealPlanData()
        fetchRoomType()
      }
      
    };
  }, []);

  const fetchMealPlanData = async () => {
    try {
      const MealPlanResponse = await fetch(`${BASE_URL}/hotel_bookings/meal_plans`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
      });
      const mealPlanData = await MealPlanResponse.json();
      if (!MealPlanResponse.ok) {
        (MealPlanResponse.status != 422 && MealPlanResponse.status != 500) ? console.log("Error:",mealPlanData) : "";
        throw new Error("Error fetching package details");
      }
      setMealPlan(mealPlanData.meal_plan);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchRoomType = async () => {
    try{
      const roomTypeResponse = await fetch(`${BASE_URL}/hotel_bookings/room_categories`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
      });
      const roomTypeData = await roomTypeResponse.json();
      if (!roomTypeResponse.ok) {
        (roomTypeResponse.status != 422 && roomTypeResponse.status != 500) ? console.log("Error:",roomTypeData) : "";
        throw new Error("Error fetching room type details");
      }
      setRoomType(roomTypeData.room_category);
    } catch(error) {
        console.log(error);
    }
  }

  const fetchPackageData = async () => {
    try {
      const packageResponse = await fetch(`${BASE_URL}/packages/`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
      });
      const packagesData = await packageResponse.json();
      if (!packageResponse.ok) {
        (packageResponse.status != 422 && packageResponse.status != 500) ? console.log("Error:",packagesData) : "";
        throw new Error("Error fetching package details");
      }
      setPackages(packagesData.packages);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchVehicles = async() => {
    const vehicleResponse = await fetch(`${BASE_URL}/vehicles/`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("userToken"),
      },
    });
    const vehiclesData = await vehicleResponse.json();
    if (!vehicleResponse.ok) {
      (vehicleResponse.status != 422 && vehicleResponse.status != 500) ? console.log("Error:",vehiclesData) : "";
      throw new Error("Error fetching vehicle details");
    }
    setVehicles(vehiclesData.vehicles);
  }

  const fetchModels = async() => {
    try{
      const models = await fetch(`${BASE_URL}/vehicles/models`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
      });
      const vehicleModelData = await models.json();
      if (!models.ok) {
        (models.status != 422 && models.status != 500) ? console.log("Error:",vehicleModelData) : "";
        throw new Error("Error fetching vehicle models");
      }
      setModel(vehicleModelData.vehicle_models);
    } catch(error) {
      console.log(error)
    }
  }

  const fetchCityOptions = async () => {
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
      console.error("Error fetching city options:", error);
    }
  };
  
  return (
    <div className=" flex-col flex justify-around w-full h-screen items-center bg-appBg pt-2 ">
      <div className='mb-5 items-end justify-end'>
          {alertMsg && <Toast message={alertMsg} toastType={alertType} />}
      </div>
      <div className="flex flex-col md:flex-row  justify-center items-center gap-5 m-5">
        <Box sx={{ bgcolor: "white", width: 350, height: !small ? 800 : 550 , p: 3 }}>
          <Autocomplete
            options={users || []}
            getOptionLabel={(option: any) => option.name}
            renderInput={(params) => (
              <TextField
                {...params}
                label={isOrganizer ? "Search Organizers" : "Search Vendors"}
                variant="standard"
                onChange={handleSearchChange}
              />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onChange={(event, newValue) => {
              if (newValue === null) {
                handleSearchClear();
              } else {
                handleSearchClick(newValue);
              }
            }}
            sx={{ p: 1 }}
          />
          {!isEditing && (
            <div className=" bottom-0 flex justify-end">
              <Button onClick={handleCreateClick}>
                <PersonAddIcon />
                User
              </Button>
            </div>
          )}
          {!isEditing && (
            <List style={{ height: 380, overflowY: "auto" }}>
              {Array.isArray(filteredUsers) && filteredUsers.length > 0
                ? filteredUsers.map((organizer: any) => (
                    <ListItem
                      key={organizer.id}
                      onClick={() => handleUserClick(organizer)}
                      className={`py-2 ${
                        selectedUser && selectedUser.id === organizer.id
                          ? "selected"
                          : ""
                      }`}
                      sx={{
                        "&:hover": {
                          backgroundColor: "#F0F4F8",
                        },
                        "&.selected": {
                          backgroundColor: "#D6E4F0",
                        },
                      }}
                    >
                      <div className="text-base font-medium">
                        {organizer.name}
                      </div>
                    </ListItem>
                  ))
                : users.map((organizer: any) => (
                    <ListItem
                      key={organizer.id}
                      onClick={() => handleUserClick(organizer)}
                      className={`py-2 ${
                        selectedUser && selectedUser.id === organizer.id
                          ? "selected"
                          : ""
                      }`}
                      sx={{
                        "&:hover": {
                          backgroundColor: "#F0F4F8",
                        },
                        "&.selected": {
                          backgroundColor: "#d2e6f9",
                        },
                      }}
                    >
                      {organizer.name}
                    </ListItem>
                  ))}
            </List>
          )}
        </Box>

        <Box
          sx={{
            maxWidth: !small ? 500 : 350,
            minWidth: !small ? 450 : 200,
            height: !small ? 800 : 550,
            p: 3,
            bgcolor: "white",
            position: "relative",
            overflowY: "scroll",
          }}
        >
          {selectedUser && (
            <div className="py-5">
              <Typography variant="h6">
                {isEditing ? (
                  <TextField
                    id="name-with-icon-textfield"
                    label="Name"
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AccountCircle />
                        </InputAdornment>
                      ),
                    }}
                    variant="standard"
                    sx={{ marginBottom: 2, width: "85%" }}
                  />
                ) : (
                  <Typography variant="h6" style={{ marginBottom: 5 }}>
                    {selectedUser.name}
                    {selectedUser.role === 1 && (
                      <Tooltip title="Super Organizer" placement="right" arrow>
                        <OfflinePinIcon
                          sx={{ marginX: 1, borderRadius: "50%" }}
                        />
                      </Tooltip>
                    )}
                  </Typography>
                )}
              </Typography>

              <div className="flex align-center mb-2 ">
                {isEditing ? (
                  <TextField
                    id="email-with-icon-textfield"
                    label="Email"
                    type="email"
                    value={editedEmail}
                    onChange={handleEmailChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon />
                        </InputAdornment>
                      ),
                    }}
                    variant="standard"
                    sx={{ marginBottom: 2, width: "85%" }}
                    disabled={!isNewUser}
                  />
                ) : (
                  <>
                    <EmailIcon
                      sx={{
                        marginRight: 1,
                        fontSize: 18,
                      }}
                    />
                    <Typography>{selectedUser.email}</Typography>
                  </>
                )}
              </div>

              {isOrganizer && (
                <div className="flex align-center mb-2">
                  {isEditing && (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isSuperOrganizer}
                          onChange={(e) =>
                            setIsSuperOrganizer(e.target.checked)
                          }
                        />
                      }
                      label="Super Organizer"
                    />
                  )}
                </div>
              )}

              {/*  */}
              {!isOrganizer && (
                <div className="flex align-center mb-2">
                  {isEditing ? (
                    <Autocomplete
                      id="city"
                      sx={{ width: "88%" }}
                      options={cityOptions}
                      getOptionLabel={(option: any) => option.city}
                      onChange={handleCityChange}
                      value={selectedCity}
                      freeSolo={false}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="standard"
                          size="small"
                          required
                          label="City"
                          sx={{ marginBottom: 2 }}
                        />
                      )}
                    />
                  ) : (
                    // />
                    <>
                      <DomainIcon
                        sx={{
                          marginRight: 1,
                          fontSize: 18,
                        }}
                      />
                      <Typography>{selectedUser.city}</Typography>
                    </>
                  )}
                </div>
              )}

              {/*  */}
              {!isOrganizer && (
                <div className="flex align-center mb-2">
                  {isEditing ? (
                      <GoogleMapsAutocomplete
                        onLoad={(ac: any) => setAutocomplete(ac)}
                        options={{
                          componentRestrictions: { country: "IN" },
                        }}
                        onPlaceChanged={() => {
                          const selectedPlace = autocomplete?.getPlace();
                          if (selectedPlace) {
                            setAddress(selectedPlace.formatted_address);
                            handleAddress(selectedPlace);
                          }
                        }}
                      >
                        <TextField
                          id="address-with-icon-textfield"
                          label="Address"
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <DomainIcon />
                              </InputAdornment>
                            ),
                          }}
                          variant="standard"
                          error={(address && coordinate=="")}
                          helperText={
                            address && coordinate==""
                              ? "Please select a suitable place from the list"
                              : ""
                          }
                          sx={{ marginBottom: 2, width: "200%" }}
                        />
                      </GoogleMapsAutocomplete>
                  ) : (
                    <>
                      <DomainIcon
                        sx={{
                          marginRight: 1,
                          fontSize: 18,
                        }}
                      />
                      <Typography>{selectedUser.address}</Typography>
                    </>
                  )}
                </div>
              )}

              {!isOrganizer && (
                <div className="flex align-center mb-2 ">
                  {isEditing ? (
                    <TextField
                      id="Tax-with-icon-textfield"
                      label="Tax"
                      type="text"
                      value={editedTax}
                      onChange={(e) => setEditedTax(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PercentIcon />
                          </InputAdornment>
                        ),
                      }}
                      variant="standard"
                      sx={{ marginBottom: 2, width: "85%" }}
                    />
                  ) : (
                    <>
                      <PercentIcon
                        sx={{
                          marginRight: 1,
                          fontSize: 18,
                        }}
                      />
                      <Typography>{selectedUser.tax}</Typography>
                    </>
                  )}
                </div>
              )}

              {!isOrganizer && (
                <div className="flex align-center mb-2">
                  {isEditing ? (
                    <div className="flex flex-col">
                      <Typography variant="body2" color={"gray"}>Primary Number</Typography>
                      <PhoneWithCountryCode
                        phone={primaryMobile}
                        setPhone={setPrimaryMobile}
                        numberError={priErr}
                        setNumberError={setPriError}
                        isfetchGuest={false}
                        fetchGuestDetailsByPhone={()=>{}}
                        isform={false}
                        setValue={()=>{}}
                        isDisabled={true}
                      />
                    </div>
                  ) : (
                    <>
                      <PhoneAndroidIcon sx={{ marginRight: 1, fontSize: 18 }} />
                      <Typography>{selectedUser.primary_mobile}</Typography>
                    </>
                  )}
                </div>
              )}
              {!isOrganizer && (
                <div className="flex align-center mb-2">
                  {isEditing ? (
                    <div className="flex flex-col">
                    <Typography variant="body2" color={"gray"}>Secondary Number</Typography>
                    <PhoneWithCountryCode
                      phone={secondaryMobile}
                      setPhone={setSecondaryMobile}
                      numberError={secErr}
                      setNumberError={setSecError}
                      isfetchGuest={false}
                      fetchGuestDetailsByPhone={()=>{}}
                      isform={false}
                      setValue={()=>{}}
                      isDisabled={true}
                    />
                  </div>
                  ) : (
                    <>
                      <PhoneAndroidIcon sx={{ marginRight: 1, fontSize: 18 }} />
                      <Typography>{selectedUser.secondary_mobile}</Typography>
                    </>
                  )}
                </div>
              )}

              {(!isOrganizer && bookingtype == "hotel") && (
                <div className="flex align-center mb-4">
                  {isEditing ? (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isThirdParty}
                          onChange={(e) =>
                            setIsThirdParty(e.target.checked)
                          }
                        />
                      }
                      label="Is this a third-party hotel?"
                    />
                  ) : <>
                  <PersonIcon
                    sx={{
                      marginRight: 1,
                      fontSize: 18,
                    }}
                  />
                  <Typography>{selectedUser.is_third_party ? "Third party" :"Preferred"}</Typography>
                </>}
                </div>
              )}

              {!isOrganizer && !isEditing && bookingtype == "cab" && (
                <div className="flex align-center mb-2 ">
                  <Accordion
                    elevation={0}
                    disableGutters={true}
                    square
                    sx={{
                      boxShadow: "none",
                    }}
                    expanded={expanded === "Garage"}
                    onChange={handleChange("Garage")}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        flexDirection: "row-reverse",
                        borderBottom:
                          expanded === "Garage"
                            ? "1px solid #0000001f"
                            : 0,
                      }}
                    >
                      <Typography color={"ActiveCaption"} fontSize={18}>
                        Garage
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Garage vendorId={selectedUser.id}/>
                    </AccordionDetails>
                  </Accordion>
                </div>
              )}
              {!isOrganizer && !isEditing && bookingtype == "cab" && (
                <div className="flex align-center mb-2 ">
                  <Accordion
                    elevation={0}
                    disableGutters={true}
                    square
                    sx={{
                      boxShadow: "none",
                    }}
                    expanded={expanded === "Drivers Charge"}
                    onChange={handleChange("Drivers Charge")}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        flexDirection: "row-reverse",
                        borderBottom:
                          expanded === "Drivers Charge"
                            ? "1px solid #0000001f"
                            : 0,
                      }}
                    >
                      <Typography color={"ActiveCaption"} fontSize={18}>
                        Drivers Charge
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <DriverCharges vendorId={selectedUser.id} model={model}/>
                    </AccordionDetails>
                  </Accordion>
                </div>
              )}
              {!isOrganizer && !isEditing && bookingtype == "cab" && (
                <div className="flex align-center mb-2 ">
                  <Accordion
                    elevation={0}
                    disableGutters={true}
                    square
                    sx={{
                      boxShadow: "none",
                    }}
                    expanded={expanded === "Plans"}
                    onChange={handleChange("Plans")}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        flexDirection: "row-reverse",
                        borderBottom:
                          expanded === "Plans" ? "1px solid #0000001f" : 0,
                      }}
                    >
                      <Typography color={"ActiveCaption"} fontSize={18}>
                        Plans
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <VendorDetails vendorId={selectedUser.id} model={model} vehicles={vehicles} packages={packages}/>
                    </AccordionDetails>
                  </Accordion>
                </div>
              )}
              {!isOrganizer && !isEditing && bookingtype == "hotel" && (
                <div className="flex align-center mb-2 ">
                  <Accordion
                    elevation={0}
                    disableGutters={true}
                    square
                    sx={{
                      boxShadow: "none",
                    }}
                    expanded={expanded === "Plans"}
                    onChange={handleChange("Plans")}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        flexDirection: "row-reverse",
                        borderBottom:
                          expanded === "Plans" ? "1px solid #0000001f" : 0,
                      }}
                    >
                      <Typography color={"ActiveCaption"} fontSize={18}>
                        Packages
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <HotelPackages vendorId={selectedUser.id} roomType={roomType} mealPlan={mealPlan}/>
                    </AccordionDetails>
                  </Accordion>
                </div>
              )}
              <div className="absolute top-0 right-0 m-4">
                {isEditing ? (
                  isNewUser ? (
                    <div>
                      <Button onClick={handleBackClick}>Back</Button>
                      <Button
                        variant="contained"
                        onClick={handleCreateUserClick}
                        disabled={
                          (!isOrganizer &&
                            (!editedName ||
                              !editedEmail ||
                              !address ||
                              !coordinate ||
                              !selectedCity ||
                              !primaryMobile ||
                              !editedTax)) ||
                          (isOrganizer && (!editedName || !editedEmail))
                        }
                      >
                        Create
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Button onClick={handleBackClick}>Back</Button>

                      <Button
                        variant="contained"
                        onClick={()=>handleSaveClick()}
                        disabled={
                          (!isOrganizer &&
                            (!editedName ||
                              !address ||
                              !selectedCity ||
                              !primaryMobile ||
                              !editedTax)) ||
                          (isOrganizer && !editedName)
                        }
                      >
                        Save
                      </Button>
                    </div>
                  )
                ) : (
                  <div className="flex flex-row">
                    {((selectedUser.id != userID && isOrganizer) || !isOrganizer) && <div>
                      <span>{isActive? "User Active" : "User Inactive"}</span>
                      <Switch checked={isActive} onChange={(e:any)=>{
                        e.target.checked ? handleSaveClick(true) : setIsDelete(true)
                      }}></Switch>
                      <Dialog onClose={()=>setIsDelete(false)} open={isDelete}>
                        <DialogTitle>Are you sure you want to make the user inactive?</DialogTitle>
                        <div  className=" flex flex-col justify-center items-center">
                          <Typography>Note: An inactive user won't be able to login, assign booking </Typography>
                          <Typography>or perform any operations</Typography>
                        </div>
                        <div className="flex flex-row justify-center">
                            <Button variant="contained" color="inherit" sx={{m:2}} onClick= {()=>setIsDelete(false)}>No, Cancel</Button>
                            <Button variant="contained" color="success" sx={{m:2}} onClick= {()=>handleSaveClick(false)}>Yes, Proceed</Button>
                        </div>
                      </Dialog>
                    </div>}
                    <Button variant="contained" onClick={handleEditClick}>
                      Edit
                    </Button>
                  </div>
                )}
              </div>
              <div>
                  <Backdrop
                    sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                    open={progress?true:false}
                  >
                    <div className="flex flex-col justify-center items-center">
                      <Typography>Please wait</Typography>
                      <CircularProgress color="inherit" />
                    </div>

                  </Backdrop>
                </div>
            </div>
          )}
        </Box>
      </div>
    </div>
  );
};

export default OrganizerVendorView;
