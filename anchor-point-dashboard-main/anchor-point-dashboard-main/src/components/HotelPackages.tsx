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
  Dialog,
  DialogTitle,
} from "@mui/material";
import CardTravelIcon from "@mui/icons-material/CardTravel";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteIcon from "@mui/icons-material/Delete";

function HotelPackages(props: any) {
  const small = window.matchMedia("(max-width: 768px)").matches;
  const [mealPlan, setMealPlan] = useState([]);
  const [roomType, setRoomType] = useState([]);
  const [existingPackages, setExistingPackages] = useState<any>([]);

  const [mealPlanName, setMealPlanName] = useState("");

  const [roomTypeName, setRoomTypeName] = useState("");

  const [single, setSingle] = useState("");
  const [double, setDouble] = useState("");
  const [inclusions, setInclusions] = useState("");

  const [isMealPlanOpen, setIsMealPlanOpen] = useState(false);
  const [isRoomTypeOpen, setIsRoomTypeOpen] = useState(false);
  const [isPackageSelected, setIsPackageSelected] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);

  const [choosenMealPlan, setChoosenMealPlan] = useState("");
  const [choosenRoomType, setChoosenRoomType] = useState("");

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [packageId, setPackageId] = useState();
  const [isEdit, setIsEdit] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

  const fetchMealPlanData = async () => {
    try {
      const MealPlanResponse = await fetch(
        `${BASE_URL}/hotel_bookings/meal_plans`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("userToken"),
          },
        },
      );
      const mealPlanData = await MealPlanResponse.json();
      if (!MealPlanResponse.ok) {
        MealPlanResponse.status != 422 && MealPlanResponse.status != 500
          ? console.log("Error:", mealPlanData)
          : "";
        throw new Error("Error fetching package details");
      }
      setMealPlan(mealPlanData.meal_plan);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchRoomType = async () => {
    try {
      const roomTypeResponse = await fetch(
        `${BASE_URL}/hotel_bookings/room_categories`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("userToken"),
          },
        },
      );
      const roomTypeData = await roomTypeResponse.json();
      if (!roomTypeResponse.ok) {
        roomTypeResponse.status != 422 && roomTypeResponse.status != 500
          ? console.log("Error:", roomTypeData)
          : "";
        throw new Error("Error fetching room type details");
      }
      setRoomType(roomTypeData.room_category);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    const fetchPackageData = async () => {
      try {
        const packagesResponse = await fetch(
          `${BASE_URL}/hotel_bookings/pricing?vendor_id=${props.vendorId}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: "Bearer " + localStorage.getItem("userToken"),
            },
          },
        );
        const packagesData = await packagesResponse.json();
        setExistingPackages(packagesData.hotel_pricing);
      } catch (error) {
        console.log(error);
      }
    };
    props.vendorId ? fetchPackageData() : "";
  }, [isUpdate, props.vendorId]);

  useEffect(() => {
    setMealPlan(props.mealPlan);
    setRoomType(props.roomType);
  }, [props.mealPlan, props.roomType]);

  useEffect(() => {
    if (!isRoomTypeOpen) {
      setRoomTypeName("");
    }
  }, [isRoomTypeOpen]);

  const handleRoomTypeSelect = (e: any) => {
    setChoosenRoomType(e.target.value);
  };

  const handleCreateMealPlan = async () => {
    try {
      const response = await fetch(`${BASE_URL}/hotel_bookings/meal_plans`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
        body: JSON.stringify({
          name: mealPlanName,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status == 409) {
          alert(data.detail);
        }
        response.status != 422 && response.status != 500
          ? console.log("Error:", data)
          : "";
        throw new Error("Error creating room type");
      }
      setIsMealPlanOpen(false);
      fetchMealPlanData();
      setMealPlanName("");
    } catch (err) {
      console.log(err);
    }
  };

  const handleMealPlanEdit = () => {
    setIsMealPlanOpen(true);
    setIsEdit(true);
    let selected = mealPlan.find((item: any) => item.id == choosenMealPlan);
    setMealPlanName(selected?.name);
  };

  const handleUpdateMealPlan = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/hotel_bookings/meal_plans/${choosenMealPlan}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("userToken"),
          },
          body: JSON.stringify({
            name: mealPlanName,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        if (response.status == 409) {
          alert(data.detail);
        }
        response.status != 422 && response.status != 500
          ? console.log("Error:", data)
          : "";
        throw new Error("Error updating meal plan");
      }
      setIsMealPlanOpen(false);
      fetchMealPlanData();
      setMealPlanName("");
      setIsEdit(false);
    } catch (err) {
      console.log(err);
    }
  };

  const handleCreateRoomType = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/hotel_bookings/room_categories`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("userToken"),
          },
          body: JSON.stringify({
            name: roomTypeName,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        response.status != 422 && response.status != 500
          ? console.log("Error:", data)
          : "";
        throw new Error("Error creating room type");
      }
      setIsRoomTypeOpen(false);
      fetchRoomType();
      setRoomTypeName("");
    } catch (err) {
      console.log(err);
    }
  };

  const handleRoomTypeEdit = () => {
    setIsRoomTypeOpen(true);
    setIsEdit(true);
    let selected = roomType.find((item: any) => item.id == choosenRoomType);
    setRoomTypeName(selected?.name);
  };

  const handleUpdateRoomType = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/hotel_bookings/room_categories/${choosenRoomType}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("userToken"),
          },
          body: JSON.stringify({
            name: roomTypeName,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        response.status != 422 && response.status != 500
          ? console.log("Error:", data)
          : "";
        throw new Error("Error updating room type");
      }
      setIsRoomTypeOpen(false);
      setIsEdit(false);
      fetchRoomType();
      setRoomTypeName("");
    } catch (err) {
      console.log(err);
    }
  };

  const handleCreatePackage = async () => {
    try {
      const response = await fetch(`${BASE_URL}/hotel_bookings/pricing`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
        body: JSON.stringify({
          meal_plan_id: choosenMealPlan,
          room_category_id: choosenRoomType,
          vendor_id: props.vendorId,
          single_room_rate: parseFloat(single),
          double_room_rate: double ? parseFloat(double) : null,
          inclusions: inclusions,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status == 409) {
          alert(data.detail);
        }
        response.status != 422 && response.status != 500
          ? console.log("Error:", data)
          : "";
        throw new Error("Error creating package");
      }
      setSingle("");
      setDouble("");
      setInclusions("");
      setChoosenRoomType("");
      setChoosenMealPlan("");
      setIsPackageSelected(false);
      setIsUpdate(true);
    } catch (err) {
      console.log(err);
    }
  };

  const handleUpdatePackage = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/hotel_bookings/pricing/${packageId}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("userToken"),
          },
          body: JSON.stringify({
            meal_plan_id: choosenMealPlan,
            room_category_id: choosenRoomType,
            vendor_id: props.vendorId,
            single_room_rate: parseFloat(single),
            double_room_rate: double ? parseFloat(double) : null,
            inclusions: inclusions,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        if (response.status == 409) {
          alert(data.detail);
        }
        response.status != 422 && response.status != 500
          ? console.log("Error:", data)
          : "";
        throw new Error("Error Updating package");
      }
      setSingle("");
      setDouble("");
      setInclusions("");
      setChoosenRoomType("");
      setChoosenMealPlan("");
      setIsUpdate(false);
      setIsPackageSelected(false);
    } catch (err) {
      console.log(err);
    }
  };

  const handlePlanDelete = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/hotel_bookings/pricing/${packageId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: "Bearer " + localStorage.getItem("userToken"),
          },
        },
      );
      const data = await response.json();
      if (!response.ok) {
        response.status != 422 && response.status != 500
          ? console.log("Error:", data)
          : "";
        throw new Error("Error deleting package");
      }
      setSingle("");
      setDouble("");
      setInclusions("");
      setChoosenRoomType("");
      setChoosenMealPlan("");
      setIsUpdate(false);
      setIsPackageSelected(false);
    } catch (err) {
      console.log(err);
    }
  };

  const handlePackageSelect = (e: any, index: number) => {
    setSelectedIndex(index);
    const selectedPackage = existingPackages[index];
    setSingle(selectedPackage.single_room_rate);
    setDouble(selectedPackage.double_room_rate);
    setInclusions(selectedPackage.inclusions);
    setChoosenRoomType(selectedPackage.room_category?.id);
    setChoosenMealPlan(selectedPackage.meal_plan?.id);
    setPackageId(selectedPackage.id);
    setIsPackageSelected(true);
    setIsUpdate(true);
  };

  const handleAddPackage = () => {
    setSingle("");
    setDouble("");
    setInclusions("");
    setChoosenRoomType("");
    setChoosenMealPlan("");
    setIsUpdate(false);
    setIsPackageSelected(true);
    setIsUpdate(false);
  };

  return (
    <div className="m3">
      {!isPackageSelected ? (
        <FormControl>
          <div className=" flex justify-end items-center">
            <Button color="primary" onClick={handleAddPackage}>
              <CardTravelIcon />
              {"Add Package"}
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
              {existingPackages?.map((item: any, index: number) => (
                <React.Fragment key={index}>
                  <ListItemButton
                    key={index}
                    selected={selectedIndex === index}
                    onClick={(event) => handlePackageSelect(event, index)}
                  >
                    <ListItemText
                      primary={item.room_category?.name}
                      secondary={item.meal_plan.name}
                    />
                    <ListItemText
                      primary={"Single Rs." + item.single_room_rate}
                      secondary={
                        item.double_room_rate
                          ? "Double Rs." + item.double_room_rate
                          : ""
                      }
                    />
                  </ListItemButton>
                </React.Fragment>
              ))}
            </List>
          </Box>
        </FormControl>
      ) : (
        <FormControl>
          <div className="flex items-center justify-center m-3">
            <Typography fontSize={18}>Package Details</Typography>
            <div className="absolute flex justify-end right-2">
              <IconButton
                color="error"
                disabled={!isUpdate}
                onClick={() => setDeleteDialog(true)}
              >
                <DeleteIcon />
              </IconButton>
            </div>
            <Dialog onClose={() => setDeleteDialog(false)} open={deleteDialog}>
              <DialogTitle>Are you sure to delete the package?</DialogTitle>
              <div className="flex flex-row justify-center">
                <Button
                  variant="contained"
                  color="inherit"
                  sx={{ m: 2 }}
                  onClick={() => setDeleteDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  sx={{ m: 2 }}
                  onClick={handlePlanDelete}
                >
                  Proceed
                </Button>
              </div>
            </Dialog>
          </div>
          <div className="flex items-center justify-end mt-5">
            <Button color="secondary" onClick={() => setIsMealPlanOpen(true)}>
              Add Meal Plan
            </Button>
          </div>
          <div className="flex justify-between">
            <FormControl size="small" sx={{ minWidth: 250 }}>
              <InputLabel id="meal_label">{"Choose Meal Plan"}</InputLabel>
              <Select
                id="meal_label"
                value={choosenMealPlan}
                label={"Choose Meal Plan"}
                onChange={(e: any) => setChoosenMealPlan(e.target.value)}
              >
                <MenuItem value="">{"None"}</MenuItem>
                {mealPlan?.map((item, index) => (
                  <MenuItem key={index} value={item["id"]}>
                    {item["name"]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <div>
              <IconButton
                onClick={handleMealPlanEdit}
                disabled={!choosenMealPlan}
              >
                <EditRoundedIcon />
              </IconButton>
            </div>
          </div>
          <Drawer
            anchor={"right"}
            open={isMealPlanOpen}
            onClose={() => {
              setMealPlanName("");
              setIsMealPlanOpen(false);
              setIsEdit(false);
            }}
          >
            <div className="items-center m-6">
              <div className="flex items-center justify-center mt-5">
                <Typography>{"Meal Plan Details"}</Typography>
              </div>
              <div className="flex flex-row items-center justify-between mt-5">
                <Typography>{"Meal Plan Name"}</Typography>
                <TextField
                  InputProps={{ className: "ml-3" }}
                  size="small"
                  variant="standard"
                  value={mealPlanName}
                  onChange={(e: any) => setMealPlanName(e.target.value)}
                ></TextField>
              </div>
              <div className="flex items-center justify-center mt-5">
                <Button
                  color="primary"
                  disabled={!mealPlanName}
                  onClick={() =>
                    isEdit ? handleUpdateMealPlan() : handleCreateMealPlan()
                  }
                >
                  {isEdit ? "Update Meal Plan" : "Create Meal Plan"}
                </Button>
              </div>
            </div>
          </Drawer>
          <div className="flex items-center justify-end mt-5">
            <Button color="secondary" onClick={() => setIsRoomTypeOpen(true)}>
              Add Room Type
            </Button>
          </div>
          <div className="flex justify-between">
            <FormControl size="small" sx={{ minWidth: 250 }}>
              <InputLabel id="roomType_label">{"Choose Room Type"}</InputLabel>
              <Select
                id="roomType_label"
                value={choosenRoomType}
                label={"Choose Room Type"}
                onChange={handleRoomTypeSelect}
              >
                <MenuItem value="">{"None"}</MenuItem>
                {roomType?.map((item, index) => (
                  <MenuItem key={index} value={item["id"]}>
                    {item["name"]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <div>
              <IconButton
                onClick={handleRoomTypeEdit}
                disabled={!choosenRoomType}
              >
                <EditRoundedIcon />
              </IconButton>
            </div>
          </div>
          <Drawer
            anchor={"right"}
            open={isRoomTypeOpen}
            onClose={() => {
              setRoomTypeName("");
              setIsRoomTypeOpen(false);
              setIsEdit(false);
            }}
          >
            <div className="m-6">
              <div className="flex items-center justify-center m-5">
                <Typography>{"Room Type Details"}</Typography>
              </div>
              <div className="flex flex-row items-center justify-between mt-5">
                <Typography>{"Room Type Name"}</Typography>
                <TextField
                  name="name"
                  InputProps={{ className: "ml-3" }}
                  size="small"
                  variant="standard"
                  value={roomTypeName}
                  onChange={(e: any) => setRoomTypeName(e.target.value)}
                ></TextField>
              </div>
              <div className="flex items-center justify-center mt-5">
                <Button
                  color="primary"
                  disabled={!roomTypeName}
                  onClick={() =>
                    isEdit ? handleUpdateRoomType() : handleCreateRoomType()
                  }
                >
                  {isEdit ? "Update Room Type" : "Create Room Type"}
                </Button>
              </div>
            </div>
          </Drawer>
          <div className="flex flex-row items-center justify-between mt-5">
            <Typography>{"Single Room Cost"}</Typography>
            <TextField
              name="single"
              InputProps={{ className: "ml-3" }}
              size="small"
              variant="standard"
              value={single}
              type="number"
              inputProps={{ style: { textAlign: "right" } }}
              onChange={(e: any) => setSingle(e.target.value)}
            ></TextField>
          </div>
          <div className="flex flex-row items-center justify-between mt-5">
            <Typography>{"Double Room Cost"}</Typography>
            <TextField
              name="double"
              InputProps={{ className: "ml-3" }}
              size="small"
              variant="standard"
              value={double}
              type="number"
              inputProps={{ style: { textAlign: "right" } }}
              onChange={(e: any) => setDouble(e.target.value)}
            ></TextField>
          </div>
          <div className="flex flex-row items-center justify-between mt-5">
            <Typography>{"Inclusions"}</Typography>
            <TextField
              name="inclusions"
              InputProps={{ className: "ml-3" }}
              size="small"
              variant="standard"
              value={inclusions}
              inputProps={{ style: { textAlign: "right" } }}
              onChange={(e: any) => setInclusions(e.target.value)}
            ></TextField>
          </div>
          <div className="flex items-center justify-between mt-5">
            <Button
              variant="contained"
              color="inherit"
              onClick={() => setIsPackageSelected(false)}
            >
              Back
            </Button>
            <Button
              variant="contained"
              color="success"
              disabled={
                !(
                  choosenMealPlan &&
                  choosenRoomType &&
                  single &&
                  double &&
                  inclusions
                )
              }
              onClick={() =>
                isUpdate ? handleUpdatePackage() : handleCreatePackage()
              }
            >
              {isUpdate ? "Update Package" : "Create Package"}
            </Button>
          </div>
        </FormControl>
      )}
    </div>
  );
}

export default HotelPackages;
