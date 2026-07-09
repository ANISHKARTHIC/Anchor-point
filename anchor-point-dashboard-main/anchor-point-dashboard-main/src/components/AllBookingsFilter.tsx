import * as React from "react";
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import {
  Autocomplete,
  Chip,
  FormControlLabel,
  FormGroup,
  List,
  ListItem,
  TextField,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { DemoContainer, DemoItem } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers";
import { BASE_URL } from "../constants/string";
import FilterListIcon from "@mui/icons-material/FilterList";
import TaxiAlertIcon from "@mui/icons-material/TaxiAlert";
import LocalTaxiIcon from "@mui/icons-material/LocalTaxi";

export default function AllBookingsFilter(props: any) {
  const limit = 10;
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [vehicle, setVehicle] = useState([]);
  const [status, setStatus] = useState({});
  const [bid, SetBid] = useState([]);
  const [formats, setFormats] = useState([]);
  const [selectedBid, setSelectedBid] = useState("");
  const [organizers, setOrganizers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [filteredUsersOrg, setFilteredUsersOrg] = useState([]);
  const [filteredUsersVen, setFilteredUsersVen] = useState([]);

  const [coordinatorName, setCoordinatorName] = useState([]);
  const [selectedCoordinator, setSelectedCoordinator] = useState("");
  const [guestName, setGuestName] = useState([]);
  const [selectedGuests, setSelectedGuests] = useState("");

  const isVendor = localStorage.getItem("isVendor");
  const vendorId = localStorage.getItem("userID");
  const bookingtype = localStorage.getItem("bookingtype");
  let url =
    isVendor == "false"
      ? bookingtype == "cab"
        ? `${BASE_URL}/all_bookings?limit=${limit}`
        : `${BASE_URL}/hotel_bookings/?limit=${limit}`
      : bookingtype == "cab"
      ? `${BASE_URL}/vendors/${vendorId}/bookings?limit=${limit}`
      : `${BASE_URL}/vendors/hotel_bookings?limit=${limit}`;

  const dateFormater = (e: any) => {
    let d = e.toDate();
    let formattedDate =
      d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear();
    return formattedDate;
  };

  const handleFormat = (
    event: React.MouseEvent<HTMLElement>,
    newFormats: string[],
  ) => {
    setFormats(newFormats);
    props.SetFilters({ ...props.filters, travel_mode: newFormats });
  };

  const handleExpandedItemsChange = (
    event: React.SyntheticEvent,
    itemIds: string[],
  ) => {
    setExpandedItems(itemIds);
  };

  const handleExpandClick = () => {
    setExpandedItems((oldExpanded) =>
      oldExpanded.length === 0
        ? [
            "date",
            "bid",
            "bookingtype",
            "cabtype",
            "status",
            "vendor",
            "organizer",
          ]
        : [],
    );
  };

  const handleVehicleChange = (event: any) => {
    const name = event.target.name;
    let temp = props.filters.vehicle;
    if (event.target.checked) {
      temp = [...props.filters.vehicle, name];
    } else {
      const index = props.filters.vehicle.indexOf(name);
      index > -1 ? temp.splice(index, 1) : "";
    }
    props.SetFilters({
      ...props.filters,
      vehicle: temp,
    });
  };

  const handleStatusChange = (event: any) => {
    const name = event.target.name;
    let temp = props.filters.status;
    if (event.target.checked) {
      temp = [...props.filters.status, name];
    } else {
      const index = props.filters.status.indexOf(name);
      index > -1 ? temp.splice(index, 1) : "";
    }
    props.SetFilters({
      ...props.filters,
      status: temp,
    });
  };

  const handleUserSelect = (e: any, user: any, type: any) => {
    if (type == "vendors") {
      let temp = props.filters.vendor;
      if (e.target.checked) {
        temp = [...props.filters.vendor, user];
      } else {
        const index = props.filters.vendor.indexOf(user);
        index > -1 ? temp.splice(index, 1) : "";
      }
      props.SetFilters({ ...props.filters, vendor: temp });
    }
    if (type == "organizers") {
      let temp = props.filters.organizer;
      if (e.target.checked) {
        temp = [...props.filters.organizer, user];
      } else {
        const index = props.filters.organizer.indexOf(user);
        index > -1 ? temp.splice(index, 1) : "";
      }
      props.SetFilters({ ...props.filters, organizer: temp });
    }
  };

  const handleSearchClick = (user: any, type: any) => {
    filterUsers(user, type);
  };

  const handleSearchClear = (type: any) => {
    if (type == "vendors") setFilteredUsersVen(vendors);
    if (type == "organizers") setFilteredUsersOrg(organizers);
  };

  const filterUsers = (searchValue: any, type: any) => {
    if (type == "vendors") {
      const filteredList = vendors.filter(
        (user: any) => user.name?.includes(searchValue.name),
      );
      setFilteredUsersVen(filteredList);
    }
    if (type == "organizers") {
      const filteredList = organizers.filter(
        (user: any) => user.name?.includes(searchValue.name),
      );
      setFilteredUsersOrg(filteredList);
    }
  };

  const handleClearAll = () => {
    props.SetFilters({
      today: false,
      this_week: false,
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
    setStartDate(null);
    setEndDate(null);
    SetBid([]);
    setSelectedBid("");
    setCoordinatorName([]);
    setSelectedCoordinator("");
    setGuestName([]);
    setSelectedGuests("");
    for (let i = 0; i < props.filterRef?.current?.vehicle?.length; i++) {
      props.filterRef.current.vehicle[i].checked = false;
    }
    for (let i = 0; i < props.filterRef?.current?.status?.length; i++) {
      props.filterRef.current.status[i].checked = false;
    }
    for (let i = 0; i < props.filterRef?.current?.organizer?.length; i++) {
      props.filterRef.current.organizer[i].checked = false;
    }
    for (let i = 0; i < props.filterRef?.current?.vendor?.length; i++) {
      props.filterRef.current.vendor[i].checked = false;
    }
  };

  const fetchBid = async (bookingid: string) => {
    const response = await fetch(
      bookingtype == "cab"
        ? `${BASE_URL}/bookings/bid?bid=${bookingid}`
        : `${BASE_URL}/hotel_bookings/bid?bid=${bookingid}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
      },
    );
    if (response.ok) {
      const data = await response.json();
      SetBid(data.bid);
    }
  };

  const fetchCoordinator = async (name: string) => {
    const response = await fetch(
      `${BASE_URL}/coordinators/search?name=${name}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
      },
    );
    if (response.ok) {
      const data = await response.json();
      setCoordinatorName(data);
    }
  };

  const fetchGuests = async (name: string) => {
    const response = await fetch(`${BASE_URL}/guests/search?name=${name}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("userToken"),
      },
    });
    if (response.ok) {
      const data = await response.json();
      setGuestName(data);
    }
  };

  useEffect(() => {
    let filteredUrl = url;
    // Date Filter
    if (props.filters.today) {
      filteredUrl = filteredUrl + "&today=true";
      setStartDate(null);
      setEndDate(null);
      props.SetFilters({ ...props.filters, start_date: null, end_date: null });
    } else if (props.filters.this_week) {
      filteredUrl = filteredUrl + "&this_week=true";
      setStartDate(null);
      setEndDate(null);
      props.SetFilters({ ...props.filters, start_date: null, end_date: null });
    } else if (props.filters.start_date && props.filters.end_date) {
      if (
        dayjs(props.filters.start_date).isBefore(dayjs(props.filters.end_date))
      ) {
        let start =
          bookingtype == "cab" ? "&pickup_start_date=" : "&check_in_date_gte=";
        let end =
          bookingtype == "cab" ? "&pickup_end_date=" : "&check_in_date_lte=";
        filteredUrl =
          filteredUrl +
          start +
          dateFormater(props.filters.start_date) +
          end +
          dateFormater(props.filters.end_date);
      }
      if (
        dayjs(props.filters.start_date).isSame(dayjs(props.filters.end_date))
      ) {
        let date = bookingtype == "cab" ? "&pickup_date=" : "&check_in_date=";
        filteredUrl =
          filteredUrl + date + dateFormater(props.filters.start_date);
      }
    }
    //Booking ID
    props.filters.bid
      ? (filteredUrl = filteredUrl + "&bid=" + props.filters.bid)
      : "";

    // Trip Type
    props.filters.travel_mode?.map((type: any) => {
      filteredUrl = filteredUrl + "&travel_mode=" + type;
    });

    // Cab Type
    props.filters.vehicle?.map(
      (vehicle: any) => (filteredUrl = filteredUrl + "&cab_type=" + vehicle),
    );
    // Status
    props.filters.status?.map(
      (status: any) => (filteredUrl = filteredUrl + "&status=" + status),
    );
    // Organizer
    props.filters.organizer?.map(
      (organizer: any) =>
        (filteredUrl = filteredUrl + "&organizer=" + organizer.name),
    );
    // Vendor
    props.filters.vendor?.map(
      (vendor: any) => (filteredUrl = filteredUrl + "&vendor=" + vendor.name),
    );
    // Coordinator
    if (props.filters.coordinator) {
      filteredUrl += `&coordinator=${props.filters.coordinator}`;
    }
    // Guests
    if (props.filters.guests) {
      filteredUrl += `&guest=${props.filters.guests}`;
    }

    props.setCurrentUrl(filteredUrl);
  }, [
    props.filters.today,
    props.filters.this_week,
    props.filters.start_date,
    props.filters.end_date,
    props.filters.bid,
    props.filters.coordinator,
    props.filters.guests,
    JSON.stringify(props.filters.travel_mode),
    JSON.stringify(props.filters.vehicle),
    JSON.stringify(props.filters.status),
    JSON.stringify(props.filters.organizer),
    JSON.stringify(props.filters.vendor),
  ]);

  useEffect(() => {
    const fetchData = async () => {
      const modelResponse = await fetch(`${BASE_URL}/vehicles/models `, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
      });

      if (modelResponse.ok) {
        const models = await modelResponse.json();
        setVehicle(models.vehicle_models);
      }

      const orgResponse = await fetch(`${BASE_URL}/organizers/`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
      });

      if (orgResponse.ok) {
        const organizers = await orgResponse.json();
        setOrganizers(organizers.organizers);
        setFilteredUsersOrg(organizers.organizers);
      }

      if (isVendor == "false") {
        const venResponse = await fetch(`${BASE_URL}/vendors/ `, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("userToken"),
          },
        });

        if (venResponse.ok) {
          const vendors = await venResponse.json();
          setVendors(vendors.vendors);
          setFilteredUsersVen(vendors.vendors);
        }
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setStatus(props.status);
  }, [props.status]);

  return (
    <Box sx={{ flexGrow: 1, maxWidth: 250, height: 580 }}>
      <div className="flex flex-row justify-between items-center">
        <div>
          <Button onClick={handleExpandClick}>
            <FilterListIcon />
            {expandedItems.length === 0 ? "Expand All" : "Collapse All"}
          </Button>
        </div>
        <div>
          <Button size="small" onClick={handleClearAll}>
            {"Clear All"}
          </Button>
        </div>
      </div>
      <Box sx={{ minHeight: 200, maxHeight: 570, overflowY: "auto" }}>
        <SimpleTreeView
          expandedItems={expandedItems}
          onExpandedItemsChange={handleExpandedItemsChange}
        >
          <TreeItem
            itemId="date"
            label={
              <Typography sx={{ fontWeight: "bold" }}>
                &nbsp; {bookingtype == "cab" ? "Pickup date" : "Check-in date"}
              </Typography>
            }
            sx={{
              backgroundColor: "#ffffff",
              "&:hover": {
                backgroundColor: "#F8FAFC",
              },
              "&.Mui-selected": {
                backgroundColor: "#c0c0c0",
              },
            }}
          >
            <div className="flex mt-2 justify-evenly">
              <Chip
                label="Today"
                variant={props.filters.today ? "filled" : "outlined"}
                disabled={props.filters.this_week}
                clickable
                ref={(element) => {
                  props.filterRef.current.today = element;
                }}
                onClick={(e: any) => {
                  props.SetFilters({
                    ...props.filters,
                    today: !props.filters.today,
                  });
                }}
              />
              <Chip
                label="This Week"
                variant={props.filters.this_week ? "filled" : "outlined"}
                disabled={props.filters.today}
                clickable
                ref={(element) => {
                  props.filterRef.current.this_week = element;
                }}
                onClick={(e: any) => {
                  props.SetFilters({
                    ...props.filters,
                    this_week: !props.filters.this_week,
                  });
                }}
              />
            </div>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DemoContainer components={["DatePicker", "DatePicker"]}>
                <div className="flex flex-col">
                  <div>
                    <DemoItem label="Start Date" component="DatePicker">
                      <DatePicker
                        format="DD-MM-YYYY"
                        value={startDate}
                        disabled={
                          props.filters.this_week || props.filters.today
                        }
                        onChange={(newValue: any) => {
                          setStartDate(newValue);
                          props.SetFilters({
                            ...props.filters,
                            start_date: newValue,
                          });
                        }}
                        slotProps={{
                          field: { clearable: true },
                          textField: { size: "small" },
                        }}
                      />
                    </DemoItem>
                  </div>
                  <div>
                    <DemoItem label="End Date" component="DatePicker">
                      <DatePicker
                        format="DD-MM-YYYY"
                        value={endDate}
                        disabled={
                          props.filters.this_week || props.filters.today
                        }
                        minDate={dayjs(startDate, "DD-MM-YYYY")}
                        onChange={(newValue: any) => {
                          setEndDate(newValue);
                          props.SetFilters({
                            ...props.filters,
                            end_date: newValue,
                          });
                        }}
                        slotProps={{
                          field: { clearable: true },
                          textField: { size: "small" },
                        }}
                      />
                    </DemoItem>
                  </div>
                </div>
              </DemoContainer>
            </LocalizationProvider>
          </TreeItem>
          <TreeItem
            itemId="bid"
            label={
              <Typography sx={{ fontWeight: "bold" }}>
                &nbsp; Booking ID
              </Typography>
            }
            sx={{
              backgroundColor: "#ffffff",
              "&:hover": {
                backgroundColor: "#F8FAFC",
              },
              "&.Mui-selected": {
                backgroundColor: "#c0c0c0",
              },
            }}
          >
            <Autocomplete
              options={bid || []}
              getOptionLabel={(option: any) => option}
              className="flex justify-center items-center w-44"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={"Search Booking ID"}
                  variant="standard"
                  value={selectedBid}
                  placeholder="eg.BID1"
                  onChange={(e: any) => {
                    e.target.value?.length > 3 ? fetchBid(e.target.value) : "";
                    setSelectedBid(e.target.value);
                  }}
                />
              )}
              onChange={(event, newValue) => {
                if (newValue === null) {
                  SetBid([]);
                } else {
                  props.SetFilters({ ...props.filters, bid: newValue });
                }
              }}
            />
          </TreeItem>

          {bookingtype == "cab" && (
            <TreeItem
              itemId="bookingtype"
              label={
                <Typography sx={{ fontWeight: "bold" }}>
                  {" "}
                  &nbsp; Trip Type
                </Typography>
              }
              sx={{
                backgroundColor: "#ffffff",
                "&:hover": {
                  backgroundColor: "#F8FAFC",
                },
                "&.Mui-selected": {
                  backgroundColor: "#c0c0c0",
                },
              }}
            >
              <ToggleButtonGroup
                value={formats}
                onChange={handleFormat}
                aria-label="booking type"
                sx={{ marginY: 1, marginX: 2 }}
              >
                <Tooltip title="Standard Cab" placement="left">
                  <ToggleButton value="standard" aria-label="Standard">
                    <LocalTaxiIcon />
                  </ToggleButton>
                </Tooltip>
                <Tooltip title="Rental Cab" placement="right">
                  <ToggleButton value="rental" aria-label="Rental">
                    <TaxiAlertIcon />
                  </ToggleButton>
                </Tooltip>
              </ToggleButtonGroup>
            </TreeItem>
          )}

          {bookingtype === "cab" && (
            <TreeItem
              itemId="coordinator_name"
              label={
                <Typography sx={{ fontWeight: "bold" }}>
                  &nbsp; Coordinator{" "}
                </Typography>
              }
              sx={{
                backgroundColor: "#ffffff",
                "&:hover": {
                  backgroundColor: "#F8FAFC",
                },
                "&.Mui-selected": {
                  backgroundColor: "#c0c0c0",
                },
              }}
            >
              <Autocomplete
                options={coordinatorName?.coordinators || []}
                getOptionLabel={(option: any) =>
                  typeof option === "string" ? option : option.name
                }
                className="flex justify-center items-center w-44"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={"Coordinator Name"}
                    variant="standard"
                    value={selectedCoordinator}
                    placeholder="Coordinator Name"
                    onChange={(e: any) => {
                      const value = e.target.value;
                      if (value?.length > 1) {
                        fetchCoordinator(value);
                      }
                      setSelectedCoordinator(value);
                    }}
                  />
                )}
                onChange={(event, newValue) => {
                  props.SetFilters({
                    ...props.filters,
                    coordinator: newValue.name,
                  });
                }}
              />
            </TreeItem>
          )}

          {bookingtype === "cab" && (
            <TreeItem
              itemId="guest_name"
              label={
                <Typography sx={{ fontWeight: "bold" }}>
                  &nbsp; Guests{" "}
                </Typography>
              }
              sx={{
                backgroundColor: "#ffffff",
                "&:hover": {
                  backgroundColor: "#F8FAFC",
                },
                "&.Mui-selected": {
                  backgroundColor: "#c0c0c0",
                },
              }}
            >
              <Autocomplete
                options={guestName?.guests || []}
                getOptionLabel={(option: any) =>
                  typeof option === "string" ? option : option.name
                }
                className="flex justify-center items-center w-44"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={"Guests"}
                    variant="standard"
                    value={selectedGuests}
                    placeholder="Guests"
                    onChange={(e: any) => {
                      const value = e.target.value;
                      if (value?.length > 1) {
                        fetchGuests(value);
                      }
                      setGuestName(value);
                    }}
                  />
                )}
                onChange={(event, newValue) => {
                  props.SetFilters({
                    ...props.filters,
                    guests: newValue.name,
                  });
                }}
              />
            </TreeItem>
          )}

          {bookingtype == "cab" && (
            <TreeItem
              itemId="cabtype"
              label={
                <Typography sx={{ fontWeight: "bold" }}>
                  &nbsp; Cab Type
                </Typography>
              }
              sx={{
                backgroundColor: "#ffffff",
                "&:hover": {
                  backgroundColor: "#F8FAFC",
                },
                "&.Mui-selected": {
                  backgroundColor: "#c0c0c0",
                },
              }}
            >
              <FormGroup sx={{ marginY: 1, marginX: 2 }}>
                {vehicle.map((cab: any, index: number) => (
                  <FormControlLabel
                    control={
                      <input
                        className="mr-2"
                        checked={
                          props.filters?.vehicle?.find(
                            (item: any) => item == cab.name,
                          )
                            ? true
                            : false
                        }
                        type="checkbox"
                        ref={(element) => {
                          props.filterRef.current.vehicle[index] = element;
                        }}
                      />
                    }
                    onChange={handleVehicleChange}
                    label={cab.name}
                    name={cab.name}
                  />
                ))}
              </FormGroup>
            </TreeItem>
          )}
          <TreeItem
            itemId="status"
            label={
              <Typography sx={{ fontWeight: "bold" }}>&nbsp; Status</Typography>
            }
            sx={{
              backgroundColor: "#ffffff",
              "&:hover": {
                backgroundColor: "#F8FAFC",
              },
              "&.Mui-selected": {
                backgroundColor: "#c0c0c0",
              },
            }}
          >
            <FormGroup sx={{ marginY: 1, marginX: 2 }}>
              {Object.keys(status).map((item: any, index: number) => (
                <FormControlLabel
                  control={
                    <input
                      className="mr-2"
                      checked={
                        props.filters?.status?.find(
                          (status: any) => status == item,
                        )
                          ? true
                          : false
                      }
                      type="checkbox"
                      ref={(element) => {
                        props.filterRef.current.status[index] = element;
                      }}
                    />
                  }
                  label={status[item]}
                  name={item}
                  onChange={handleStatusChange}
                />
              ))}
            </FormGroup>
          </TreeItem>
          <TreeItem
            itemId="organizer"
            label={
              <Typography sx={{ fontWeight: "bold" }}>
                &nbsp; Organizer
              </Typography>
            }
            sx={{
              backgroundColor: "#ffffff",
              "&:hover": {
                backgroundColor: "#F8FAFC",
              },
              "&.Mui-selected": {
                backgroundColor: "#c0c0c0",
              },
            }}
          >
            <Autocomplete
              options={organizers || []}
              getOptionLabel={(option: any) => option.name}
              className="flex justify-center items-center w-44"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={"Search Organizers"}
                  variant="standard"
                  onChange={(value: any) => filterUsers(value, "organizers")}
                />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(event, newValue) => {
                if (newValue === null) {
                  handleSearchClear("organizers");
                } else {
                  handleSearchClick(newValue, "organizers");
                }
              }}
            />
            <List style={{ height: 220, overflowY: "auto" }}>
              {filteredUsersOrg.map((organizer: any, index: number) => (
                <ListItem
                  key={organizer.id}
                  className={`${
                    props.filters.organizer &&
                    props.filters.organizer.id === organizer.id
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
                  <FormControlLabel
                    control={
                      <input
                        className="mr-2"
                        checked={
                          props.filters?.organizer?.find(
                            (item: any) => item.name == organizer.name,
                          )
                            ? true
                            : false
                        }
                        type="checkbox"
                        ref={(element) => {
                          props.filterRef.current.organizer[index] = element;
                        }}
                      />
                    }
                    label={organizer.name}
                    name={organizer.name}
                    onClick={(e: any) =>
                      handleUserSelect(e, organizer, "organizers")
                    }
                  />
                </ListItem>
              ))}
            </List>
          </TreeItem>
          {isVendor == "false" && (
            <TreeItem
              itemId="vendor"
              label={
                <Typography sx={{ fontWeight: "bold" }}>
                  &nbsp; Vendor
                </Typography>
              }
              sx={{
                backgroundColor: "#ffffff",
                "&:hover": {
                  backgroundColor: "#F8FAFC",
                },
                "&.Mui-selected": {
                  backgroundColor: "#c0c0c0",
                },
              }}
            >
              <Autocomplete
                options={vendors || []}
                getOptionLabel={(option: any) => option.name}
                className="flex justify-center items-center w-44"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={"Search Vendors"}
                    variant="standard"
                    onChange={(value: any) => filterUsers(value, "vendors")}
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(event, newValue) => {
                  if (newValue === null) {
                    handleSearchClear("vendors");
                  } else {
                    handleSearchClick(newValue, "vendors");
                  }
                }}
              />
              <List style={{ height: 220, overflowY: "auto" }}>
                {filteredUsersVen.map((vendor: any, index: number) => (
                  <ListItem
                    key={vendor.id}
                    className={`${
                      props.filters.vendor &&
                      props.filters.vendor.id === vendor.id
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
                    <FormControlLabel
                      control={
                        <input
                          className="mr-2"
                          checked={
                            props.filters?.vendor?.find(
                              (item: any) => item.name == vendor.name,
                            )
                              ? true
                              : false
                          }
                          type="checkbox"
                          ref={(element) => {
                            props.filterRef.current.vendor[index] = element;
                          }}
                        />
                      }
                      label={vendor.name}
                      name={vendor.name}
                      onClick={(e: any) =>
                        handleUserSelect(e, vendor, "vendors")
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </TreeItem>
          )}
        </SimpleTreeView>
      </Box>
    </Box>
  );
}
