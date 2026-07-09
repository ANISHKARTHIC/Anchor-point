import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  Button,
  MenuItem,
  Select,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import FormControl from "@mui/material/FormControl";
import CardTravelIcon from "@mui/icons-material/CardTravel";
import Toast from "./Toast";

export const BASE_URL = `${import.meta.env.VITE_BASE_SERVER_URL}/api`;

export default function TariffPlans() {

  const small = window.matchMedia("(max-width: 768px)").matches
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPlanSelected, setIsPlanSelected] = useState(false);
  const [VendorCities, setVendorCities] = useState([])
  const [tariffPlans, setTariffplans] = useState([])

  const [selectedCityId, setSelectedCityId] = useState(0)
  const [isUpdate, setIsUpdate] = useState(false)

  const [cost, setCost] = useState("");
  const [extraDistanceCost, setExtraDistanceCost] = useState("");
  const [extraHourCost, setExtraHourCost] = useState("");
  const [choosenPackage, setChoosenPackage] = useState("");
  const [choosenVehicle,setChoosenVehicle] = useState<any>();
  const [tariffPlanId, setTariffPlanId] = useState()
  const [allPackages, setAllPackages] = useState([])
  const [vehicles, setVehicles] = useState<any>()

  const [selectedCity, setSelectedCity] = useState(0)

  const [alertMsg, setAlertMsg] = useState("")
  const [alertType, setAlertType] = useState("")


  useEffect(() => {
    async function getCity() {
      let response = await fetch(`${BASE_URL}/vendors/cities`, {
        method: 'GET',
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        }
      },
      )
      const data = await response.json();
      if (!response.ok) {
        response.status != 422 && response.status != 500
          ? console.log("Error:", data)
          : "";
        throw new Error("Error deleting package");
      }
      setVendorCities(data["vendor_city"])
      setSelectedCity(data["vendor_city"][0].id)
      setSelectedCityId(data["vendor_city"][0].id)
    }
    getCity()
    getTariffPalns()
  }, [])

  useEffect(() => {
    getTariffPalns()
  }, [selectedCity])

  async function getTariffPalns() {
    if (selectedCity != 0) {
      let Tariffresponse = await fetch(`${BASE_URL}/tariff_plans?city_id=${selectedCity}`, {
        method: 'GET',
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        }
      })

      const TariffPlans = await Tariffresponse.json();
      if (!Tariffresponse.ok) {
        Tariffresponse.status != 422 && Tariffresponse.status != 500
          ? console.log("Error:", TariffPlans)
          : "";
        throw new Error("Error deleting package");
      }
      setTariffplans(TariffPlans["tariff_plans"])
    }
  }

  async function getAllPackage() {
    let response = await fetch(`${BASE_URL}/packages/`, {
      method: 'GET',
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("userToken"),
      }
    })
    const data = await response.json();
    if (!response.ok) {
      response.status != 422 && response.status != 500
        ? console.log("Error:", data)
        : "";
      throw new Error("Error deleting package");
    }
    setAllPackages(data["packages"])
  }
  const fetchVehicles = async () => {
    try {
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
        (vehicleResponse.status != 422 && vehicleResponse.status != 500) ? console.log("Error:", vehiclesData) : "";
        throw new Error("Error fetching vehicle details");
      }
      setVehicles(vehiclesData.vehicles);
    } catch (error) {

    }
  }


  function handlePlanSelect(event, index, plan) {    
    setTariffPlanId(plan.id)
    setSelectedIndex(index);
    setIsPlanSelected(true)
    getAllPackage()
    fetchVehicles()
    setIsUpdate(true)
    setCost(plan.cost)
    setExtraDistanceCost(plan.extra_distance_cost)
    setExtraHourCost(plan.extra_hour_cost)
    setChoosenPackage(plan.package)    
    setChoosenVehicle(plan.vehicle)
  }

  function handleAddPlan() {
    setIsPlanSelected(true)
  }

  async function handleCreatePlan() {
    let payload = {
      package_id: choosenPackage.id,
      vehicle_id: choosenVehicle.id,
      city_id: selectedCityId,
      cost: parseFloat(cost),
      extra_distance_cost: parseFloat(extraDistanceCost),
      extra_hour_cost: parseFloat(extraHourCost),
    }
    try {
      let response = await fetch(`${BASE_URL}/tariff_plans`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      setAlertType("success")
      setAlertMsg(data.message)
      setTimeout(() => {
        setAlertMsg("")
      }, 3000);

      if (!response.ok) {
        if (response.status == 409) {
          setAlertType("error")
          setAlertMsg(data.detail)
          setTimeout(() => {
            setAlertMsg("")
          }, 3000);
        }
        (response.status != 422 && response.status != 500) ? console.log("Error:", data) : "";
        throw new Error("Error creating plan");
      }
      setCost("");
      setExtraDistanceCost("");
      setExtraHourCost("");
      setIsPlanSelected(false);
      setIsUpdate(false);
      getTariffPalns()
      setChoosenVehicle("")
    } catch (error) {
      console.log(error)
    }
  };

  async function handleUpdatePlan() {
    let payload = {
      package_id: choosenPackage.id,
      vehicle_id:choosenVehicle.id,
      city_id: selectedCityId,
      cost: parseFloat(cost),
      extra_distance_cost: parseFloat(extraDistanceCost),
      extra_hour_cost: parseFloat(extraHourCost)
    }

    try {
      let response = await fetch(`${BASE_URL}/tariff_plans/${tariffPlanId}`, {
        method: 'PUT',
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      setAlertType("success")
      setAlertMsg(data.message)
      setTimeout(() => {
        setAlertMsg("")
      }, 3000);

      if (!response.ok) {
        if (response.status == 409) {
          setAlertType("error")
          setAlertMsg(data.detail)
          setTimeout(() => {
            setAlertMsg("")
          }, 3000);
        }
        (response.status != 422 && response.status != 500) ? console.log("Error:", data) : "";
        throw new Error("Error creating plan");
      }
      setCost("");
      setExtraDistanceCost("");
      setExtraHourCost("");
      setIsPlanSelected(false);
      setIsUpdate(false);
      getTariffPalns()
      setChoosenPackage("")
      setChoosenVehicle("")
    }
    catch (error) {
      console.log(error)
    }
  }

  function clearupdatedFeilds(){
    console.log("work");
    
   setChoosenPackage("")     
   setCost("")
   setExtraDistanceCost("")
   setExtraHourCost("")
   setChoosenVehicle("")
  }

  return (
    <div className=" flex-col flex justify-around w-full h-screen items-center bg-appBg pt-2 ">
      <div className='mb-5 items-end justify-end'>
        {alertMsg && <Toast message={alertMsg} toastType={alertType} />}
      </div>
      <div className="flex flex-col md:flex-row  justify-center items-center gap-5 m-5">
        <Box sx={{ bgcolor: "white", width: 350, height: !small ? 800 : 550, p: 3 }}>
          <Autocomplete
            options={VendorCities || []}
            getOptionLabel={(option: any) => option.city}
            onChange={(event, value) => {
              setSelectedCityId(value?.id)
              setSelectedCity(value?.id)
            }

            }
            onClick={getTariffPalns}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search City"
                variant="standard"
              />
            )}
          />
          {VendorCities && VendorCities.map((item) => (
            <ListItem
              key={item.id}
              onClick={() => {
                setSelectedCityId(item.id)
                setSelectedCity(item.id)
                setIsPlanSelected(false)
                clearupdatedFeilds()
              }}
              className={`py-2 ${item && item.id == selectedCity
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
                marginTop: 1
              }}
            >
              <div className="text-base font-medium">
                {item.city}
              </div>
            </ListItem>
          ))}
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
          <div className="m3">
            {!isPlanSelected ? (
              <FormControl>
                <div className=" flex justify-end items-center">
                  <Button color="primary" onClick={() => { handleAddPlan(), getAllPackage(), fetchVehicles()}}
                  >
                    <CardTravelIcon />
                    {"Add Plan"}
                  </Button>
                </div>
                <Box
                  sx={{
                    width: !small ? 400 : 280,
                    display: "flex",
                    justifyContent: "space-between",
                    overflowY: "auto",
                    bgcolor: "gray",
                  }}
                >
                  <List
                    sx={{
                      flex: 1,
                      backgroundColor: "#fff",
                    }}
                  >
                    {tariffPlans.length !== 0 ? tariffPlans.map((plan: any, index: number) => (
                      <React.Fragment key={index}>
                        <ListItemButton
                          key={index}
                          selected={selectedIndex === index}
                          onClick={(event) => handlePlanSelect(event, index, plan)}
                        >
                          <ListItemText
                            sx={{
                              width: "50%"
                            }}
                            primary={plan?.package.name}
                          />
                          <ListItemText
                            sx={{
                              width: "50%"
                            }}
                            secondary={"Rs." + plan.cost}
                          />
                        </ListItemButton>
                      </React.Fragment>
                    )) :
                      <h1 className="text-[1.5rem] text-gray-300 flex justify-self-center mt-20">No Tariff plans found</h1>
                    }
                  </List>
                </Box>
              </FormControl>
            ) : (
              <FormControl sx={{
                width: "100%",
              }}>
                <div className="flex items-center justify-center m-3">
                  <Typography fontSize={18}>Plan Details</Typography>
                </div>
                <div className="flex justify-between">
                  <FormControl size="small" sx={{ minWidth: 250, display: "flex", flexDirection: "column", gap: 2 }}>
                    <InputLabel id="package_label">{"Choose Package"}</InputLabel>
                    <Select
                      id="package_label"
                      value={choosenPackage.name}
                      defaultValue=""
                      label={"Choose Package"}
                    // onChange={(e: any) => setChoosenPackage(e.target.value)}
                    >
                      <MenuItem value="">{"None"}</MenuItem>
                      {allPackages.map((item, index) => (
                        <MenuItem
                          key={index}
                          value={item?.name}
                          onClick={() => setChoosenPackage(item)}
                        >
                          {item?.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
                <div className="flex justify-between mt-4">
                  <FormControl size="small" sx={{ minWidth: 250 }}>
                    <InputLabel id="vehicle_label">{"Choose Vehicle"}</InputLabel>
                    <Select
                      id="vehicle_label"
                      value={choosenVehicle?.name}
                      label={"Choose Vehicle"}
                    // onChange={handleVehicleSelect}
                    >
                      <MenuItem value="">{"None"}</MenuItem>
                      {vehicles && vehicles.map((item, index) => (
                          <MenuItem key={index} value={item.name}
                           onClick={() => setChoosenVehicle(item)}
                          >
                            {item.name}
                          </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
                <div className="flex flex-row items-center justify-between mt-5">
                  <Typography>{"Cost"}</Typography>
                  <TextField
                    name="cost"
                    InputProps={{ className: "ml-3" }}
                    size="small"
                    variant="standard"
                    defaultValue={cost}
                    type="number"
                    inputProps={{ style: { textAlign: "right" } }}
                    onChange={(e: any) => setCost(e.target.value)}
                  ></TextField>
                </div>
                <div className="flex flex-row items-center justify-between mt-5">
                  <Typography>{"Extra Kms Cost"}</Typography>
                  <TextField
                    name="extra_distance_Cost"
                    InputProps={{ className: "ml-3" }}
                    size="small"
                    variant="standard"
                    defaultValue={extraDistanceCost}
                    type="number"
                    inputProps={{ style: { textAlign: "right" } }}
                    onChange={(e: any) => setExtraDistanceCost(e.target.value)}
                  ></TextField>
                </div>
                <div className="flex flex-row items-center justify-between mt-5">
                  <Typography>{"Extra Hrs Cost"}</Typography>
                  <TextField
                    name="extra_hour_Cost"
                    InputProps={{ className: "ml-3" }}
                    size="small"
                    variant="standard"
                    defaultValue={extraHourCost}
                    type="number"
                    inputProps={{ style: { textAlign: "right" } }}
                    onChange={(e: any) => setExtraHourCost(e.target.value)}
                  ></TextField>
                </div>
                <div className="flex items-center justify-between mt-5">
                  <Button
                    variant="contained"
                    color="inherit"
                    onClick={() => {
                      setIsPlanSelected(false)
                      setChoosenPackage("")
                      setChoosenVehicle("")
                      setCost("")
                      setExtraDistanceCost("")
                      setExtraHourCost("")
                      setIsUpdate(false)
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    disabled={
                      !(
                        choosenPackage &&
                        cost &&
                        extraDistanceCost &&
                        extraHourCost
                      )
                    }
                    onClick={() =>
                      isUpdate ? handleUpdatePlan() : handleCreatePlan()
                    }
                  >
                    {isUpdate ? "Update Plan" : "Create Plan"}
                  </Button>
                </div>
              </FormControl>)
            }
          </div>
        </Box>
      </div>
    </div>
  )
}