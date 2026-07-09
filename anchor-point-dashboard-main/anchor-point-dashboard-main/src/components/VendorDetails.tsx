import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import { BASE_URL } from "../constants/string.ts";
import React, { useEffect, useState } from "react";
import {
  Button,
  TextField,
  Typography,
  Drawer,
  MenuItem,
  Select,
  InputLabel,
  List,
  ListItemButton,
  ListItemText,
  Box,
  IconButton,
} from "@mui/material";
import CardTravelIcon from "@mui/icons-material/CardTravel";
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteIcon from "@mui/icons-material/Delete";

function VendorDetails(props: any) {
  const small = window.matchMedia("(max-width: 768px)").matches
  const [packages, setPackages] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [model, setModel] = useState([]);
  const [existingPlans, setExistingPlans] = useState<any>([]);

  const [packageName, setPackageName] = useState("");
  const [kms, setKms] = useState("");
  const [hrs, setHrs] = useState("");
  const [description, setDescription] = useState("");

  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleName, setVehicleName] = useState("");

  const [cost, setCost] = useState("");
  const [extraDistanceCost, setExtraDistanceCost] = useState("");
  const [extraHourCost, setExtraHourCost] = useState("");

  const [isPackageOpen, setIsPackageOpen] = useState(false);
  const [isVehicleOpen, setIsVehicleOpen] = useState(false);
  const [isPlanSelected, setIsPlanSelected] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);

  const [choosenPackage, setChoosenPackage] = useState("");
  const [choosenVehicle, setChoosenVehicle] = useState("");

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [planId, setPlanId] = useState();
  const [isEdit, setIsEdit] = useState(false);

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

  const fetchVehicles = async () => {
    try{
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
    } catch(error) {

    }
  }
  useEffect(() => {
    const fetchPlanData = async () => {
      try {
        const plansResponse = await fetch(
          `${BASE_URL}/plans/?vendor_id=${props.vendorId}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: "Bearer " + localStorage.getItem("userToken"),
            },
          },
        );
        const plansData = await plansResponse.json();
        setExistingPlans(plansData.plans);
      } catch (error) {
        console.log(error);
      }
    };
    props.vendorId ? fetchPlanData() : "";
  }, [isUpdate, props.vendorId]);

  useEffect(()=>{
    setPackages(props.packages)
    setVehicles(props.vehicles)
    setModel(props.model)
  },[props.packages,props.vehicles,props.model])

  useEffect(()=>{
    if(!isVehicleOpen) {
      setVehicleModel("")
      setVehicleName("")
    }
  },[isVehicleOpen])

  const handleVehicleSelect = (e: any) => {
    setChoosenVehicle(e.target.value);
  };

  const handleCreatePackage = async () => {
    try {
      const response = await fetch(`${BASE_URL}/packages/`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
        body: JSON.stringify({
          name: packageName,
          distance_kms: kms,
          interval_hrs: hrs,
          description: description,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if(response.status == 409) { 
          alert(data.detail)
        }
        (response.status != 422 && response.status != 500) ? console.log("Error:",data) : "";
        throw new Error("Error creating package");
      }
      setIsPackageOpen(false);
      fetchPackageData()
      setPackageName("")
      setKms("")
      setHrs("")
      setDescription("")
    } catch (err) {
      console.log(err);
    }
  };

  const handlePackageEdit = () => {
    setIsPackageOpen(true)
    setIsEdit(true)
    let selected = packages.find((item:any)=>item.id == choosenPackage)
    setPackageName(selected?.name)
    setKms(selected?.distance_kms)
    setHrs(selected?.interval_hrs)
    setDescription(selected?.description)
  }

  const handleUpdatePackage = async() => {
    try {
      const response = await fetch(`${BASE_URL}/packages/${choosenPackage}`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
        body: JSON.stringify({
          name: packageName,
          distance_kms: kms,
          interval_hrs: hrs,
          description: description,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if(response.status == 409) { 
          alert(data.detail)
        }
        (response.status != 422 && response.status != 500) ? console.log("Error:",data) : "";
        throw new Error("Error updating package");
      }
      setIsPackageOpen(false);
      fetchPackageData()
      setPackageName("")
      setKms("")
      setHrs("")
      setDescription("")
      setIsEdit(false)
    } catch (err) {
      console.log(err);
    }
  }

  const handleCreateVehicle = async () => {
    try {
      const response = await fetch(`${BASE_URL}/vehicles/`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
        body: JSON.stringify({
          name: vehicleName,
          vehicle_model_id: vehicleModel,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        (response.status != 422 && response.status != 500) ? console.log("Error:",data) : "";
        throw new Error("Error creating vehicle");
      }
      setIsVehicleOpen(false);
      fetchVehicles()
      setVehicleModel("")
      setVehicleName("")
    } catch (err) {
      console.log(err);
    }
  };

  const handleVehicleEdit = () => {
    setIsVehicleOpen(true)
    setIsEdit(true)
    let selected = vehicles.find((item:any)=>item.id == choosenVehicle)
    setVehicleModel(selected?.vehicle_model_id)
    setVehicleName(selected?.name)

  }

  const handleUpdateVehicle = async() => {
    try {
      const response = await fetch(`${BASE_URL}/vehicles/${choosenVehicle}`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
        body: JSON.stringify({
          name: vehicleName,
          vehicle_model_id: vehicleModel,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        (response.status != 422 && response.status != 500) ? console.log("Error:",data) : "";
        throw new Error("Error updating vehicle");
      }
      setIsVehicleOpen(false);
      setIsEdit(false)
      fetchVehicles()
      setVehicleModel("")
      setVehicleName("")
    } catch (err) {
      console.log(err);
    }
  }

  const handleCreatePlan = async () => {
    try {
      const response = await fetch(`${BASE_URL}/plans/`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
        body: JSON.stringify({
          package_id: choosenPackage,
          vehicle_id: choosenVehicle,
          vendor_id: props.vendorId,
          cost: parseFloat(cost),
          extra_distance_cost: parseFloat(extraDistanceCost),
          extra_hour_cost: parseFloat(extraHourCost),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if(response.status == 409) { 
          alert(data.detail)
        }
        (response.status != 422 && response.status != 500) ? console.log("Error:",data) : "";
        throw new Error("Error creating plan");
      }
      setCost("");
      setExtraDistanceCost("");
      setExtraHourCost("");
      setChoosenVehicle("");
      setChoosenPackage("");
      setIsPlanSelected(false);
      setIsUpdate(true);
    } catch (err) {
      console.log(err);
    }
  };

  const handleUpdatePlan = async () => {
    try {
      const response = await fetch(`${BASE_URL}/plans/${planId}`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
        body: JSON.stringify({
          package_id: choosenPackage,
          vehicle_id: choosenVehicle,
          vendor_id: props.vendorId,
          cost: parseFloat(cost),
          extra_distance_cost: parseFloat(extraDistanceCost),
          extra_hour_cost: parseFloat(extraHourCost),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        (response.status != 422 && response.status != 500) ? console.log("Error:",data) : "";
        throw new Error("Error Updating plan");
      }
      setCost("");
      setExtraDistanceCost("");
      setExtraHourCost("");
      setChoosenVehicle("");
      setChoosenPackage("");
      setIsUpdate(false);
      setIsPlanSelected(false);
    } catch (err) {
      console.log(err);
    }
  };

  const handlePlanSelect = (e: any, index: number) => {
    setSelectedIndex(index);
    const selectedPlan = existingPlans[index];
    setCost(selectedPlan.cost);
    setExtraDistanceCost(selectedPlan.extra_distance_cost);
    setExtraHourCost(selectedPlan.extra_hour_cost);
    setChoosenVehicle(selectedPlan.vehicle?.id);
    setChoosenPackage(selectedPlan.package?.id);
    setPlanId(selectedPlan.id);
    setIsPlanSelected(true);
    setIsUpdate(true);
  };

  const handleAddPlan = () => {
    setCost("");
    setExtraDistanceCost("");
    setExtraHourCost("");
    setChoosenVehicle("");
    setChoosenPackage("");
    setIsUpdate(false);
    setIsPlanSelected(false);
    setIsPlanSelected(true);
    setIsUpdate(false);
  };

  return (
    <div className="m3">
      {!isPlanSelected ? (
        <FormControl>
          <div className=" flex justify-end items-center">
            <Button color="primary" onClick={handleAddPlan}>
              <CardTravelIcon />
              {"Add Plan"}
            </Button>
          </div>
          <Box
            sx={{
              width: !small ? 400 : 280,
              display: "flex",
              flexDirection: "column",
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
              {existingPlans?.map((plan: any, index: number) => (
                <React.Fragment key={index}>
                  <ListItemButton
                    key={index}
                    selected={selectedIndex === index}
                    onClick={(event) => handlePlanSelect(event, index)}
                  >
                    <ListItemText
                      primary={plan.package?.name}
                      secondary={"Rs." + plan.cost}
                    />
                    <ListItemText primary={plan.vehicle.model} />
                  </ListItemButton>
                </React.Fragment>
              ))}
            </List>
          </Box>
        </FormControl>
      ) : (
        <FormControl>
          <div className="flex items-center justify-center m-3">
            <Typography fontSize={18}>Plan Details</Typography>
          </div>
          <div className="flex items-center justify-end mt-5">
            <Button color="secondary" onClick={() => setIsPackageOpen(true)}>
              Add Package
            </Button>
          </div>
          <div className="flex justify-between">
          <FormControl size="small" sx={{ minWidth: 250 }}>
            <InputLabel id="package_label">{"Choose Package"}</InputLabel>
            <Select
              id="package_label"
              value={choosenPackage}
              label={"Choose Package"}
              onChange={(e: any) => setChoosenPackage(e.target.value)}
            >
              <MenuItem value="">{"None"}</MenuItem>
              {packages.map((item, index) => (
                <MenuItem key={index} value={item["id"]}>
                  {item["name"]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <div>
            <IconButton onClick={handlePackageEdit} disabled={!choosenPackage}><EditRoundedIcon/></IconButton>
          </div>
          </div>
          <Drawer
            anchor={"right"}
            open={isPackageOpen}
            onClose={() => {
              setPackageName("")
              setHrs("")
              setKms("")
              setDescription("")
              setIsPackageOpen(false)
              setIsEdit(false)
            }}
          >
            <div className="items-center m-6">
              <div className="flex items-center justify-center mt-5">
                <Typography>{"Package Details"}</Typography>
              </div>
              <div className="flex flex-row items-center justify-between mt-5">
                <Typography>{"Package Name"}</Typography>
                <TextField
                  InputProps={{ className: "ml-3" }}
                  size="small"
                  variant="standard"
                  value={packageName}
                  onChange={(e: any) => setPackageName(e.target.value)}
                ></TextField>
              </div>
              <div className="flex flex-row items-center justify-between mt-5">
                <Typography>{"Distance Included"}</Typography>
                <TextField
                  InputProps={{ className: "ml-3" }}
                  size="small"
                  variant="standard"
                  value={kms}
                  type="number"
                  onChange={(e: any) => setKms(e.target.value)}
                ></TextField>
              </div>
              <div className="flex flex-row items-center justify-between mt-5">
                <Typography>{"Hours Included"}</Typography>
                <TextField
                  InputProps={{ className: "ml-3" }}
                  size="small"
                  variant="standard"
                  value={hrs}
                  type="number"
                  onChange={(e: any) => setHrs(e.target.value)}
                ></TextField>
              </div>
              <div className="flex flex-row items-center justify-between mt-5">
                <Typography>{"Description"}</Typography>
                <TextField
                  InputProps={{ className: "ml-3" }}
                  size="small"
                  variant="standard"
                  value={description}
                  onChange={(e: any) => setDescription(e.target.value)}
                ></TextField>
              </div>
              <div className="flex items-center justify-center mt-5">
                <Button
                  color="primary"
                  disabled={!(packageName && kms && hrs && description)}
                  onClick={() => isEdit ? handleUpdatePackage() : handleCreatePackage()}
                >
                  {isEdit ? "Update Package" : "Create Package"}
                </Button>
              </div>
            </div>
          </Drawer>
          <div className="flex items-center justify-end mt-5">
            <Button color="secondary" onClick={() => setIsVehicleOpen(true)}>
              Add Vehicle
            </Button>
          </div>
          <div className="flex justify-between">
          <FormControl size="small" sx={{ minWidth: 250 }}>
            <InputLabel id="vehicle_label">{"Choose Vehicle"}</InputLabel>
            <Select
              id="vehicle_label"
              value={choosenVehicle}
              label={"Choose Vehicle"}
              onChange={handleVehicleSelect}
            >
              <MenuItem value="">{"None"}</MenuItem>
              {vehicles.map((item, index) => (
                <MenuItem key={index} value={item["id"]}>
                  {item["name"]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <div>
            <IconButton onClick={handleVehicleEdit} disabled={!choosenVehicle}><EditRoundedIcon/></IconButton>
          </div>
          </div>
          <Drawer
            anchor={"right"}
            open={isVehicleOpen}
            onClose={() => {
              setVehicleModel("")
              setVehicleName("")
              setIsVehicleOpen(false)
              setIsEdit(false)
            }}
          >
            <div className="m-6">
              <div className="flex items-center justify-center m-5">
                <Typography>{"Vehicle Details"}</Typography>
              </div>
              <RadioGroup
                row
                aria-labelledby="model"
                name="model"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
              >
                {model.map((item, index) => (
                  <FormControlLabel
                    key={index}
                    value={item["id"]}
                    control={<Radio />}
                    label={item["name"]}
                  />
                ))}
              </RadioGroup>
              <div className="flex flex-row items-center justify-between mt-5">
                <Typography>{"Vehicle Name"}</Typography>
                <TextField
                  name="name"
                  InputProps={{ className: "ml-3" }}
                  size="small"
                  variant="standard"
                  value={vehicleName}
                  onChange={(e: any) => setVehicleName(e.target.value)}
                ></TextField>
              </div>
              <div className="flex items-center justify-center mt-5">
                <Button
                  color="primary"
                  disabled={!(vehicleModel && vehicleName)}
                  onClick={() => isEdit ? handleUpdateVehicle() : handleCreateVehicle()}
                >
                  {isEdit ? "Update Vehicle" : "Create Vehicle"}
                </Button>
              </div>
            </div>
          </Drawer>
          <div className="flex flex-row items-center justify-between mt-5">
            <Typography>{"Cost"}</Typography>
            <TextField
              name="cost"
              InputProps={{ className: "ml-3" }}
              size="small"
              variant="standard"
              value={cost}
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
              value={extraDistanceCost}
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
              value={extraHourCost}
              type="number"
              inputProps={{ style: { textAlign: "right" } }}
              onChange={(e: any) => setExtraHourCost(e.target.value)}
            ></TextField>
          </div>
          <div className="flex items-center justify-between mt-5">
            <Button
              variant="contained"
              color="inherit"
              onClick={() => setIsPlanSelected(false)}
            >
              Back
            </Button>
            <Button
              variant="contained"
              color="success"
              disabled={
                !(
                  choosenPackage &&
                  choosenVehicle &&
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
        </FormControl>
      )}
    </div>
  );
}

export default VendorDetails;
