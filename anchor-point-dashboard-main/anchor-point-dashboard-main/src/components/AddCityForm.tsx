import {
  Button,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import EditIcon from "@mui/icons-material/Edit";
import { BASE_URL } from "../constants/string";

export default function AddCityForm() {
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [options, setOptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editItemId, setEditItemId] = useState(null);
  const [editItemText, setEditItemText] = useState("");
  const [newCity, setNewCity] = useState("");
  const [cityexists, setCityexists] = useState(false);
  const [editCityexists,setEditCityexists] = useState(false);

  const handleSearchInputChange = (event: any) => {
    const inputText = event.target.value.toLowerCase();
    setSearchTerm(inputText);
    if (inputText === "") {
      setFilteredOptions(options);
    } else {
      const filtered = filteredOptions.filter((option: any) =>
        option.city.toLowerCase().includes(inputText),
      );
      setFilteredOptions(filtered);
    }
  };

  const handleEditItem = (id: any, initialText: any) => {
    setEditItemId(id);
    setEditItemText(initialText);
  };

  const handleEditItemCancel = () => {
    setEditItemId(null);
    setEditItemText("");
    setFilteredOptions(filteredOptions);
  };

  const createCity = async (data: any) => {
    try {
      const response = await fetch(`${BASE_URL}/vendors/cities?city=${data}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
      });
      if (response.status === 409) {
        setCityexists(true);
        return;
      }
      setCityexists(false);
      fetchCity();
      setNewCity("");
    } catch (error) {
      console.error("Error creating organizer data:", error);
      return null;
    }
  };

  const editCity = async (id: any, initialText: any) => {
    try {
      const response = await fetch(
        `${BASE_URL}/vendors/cities/${id}?city=${initialText}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("userToken"),
          },
        },
      );
      if (response.status === 409) {
        setEditCityexists(true);
        return;
      }
      setEditCityexists(false);
      if (response.ok) {
        const updatedOptions: any = filteredOptions.map((option: any) => {
          if (option.id === id) {
            return { ...option, city: initialText };
          } else {
            return option;
          }
        });

        setFilteredOptions(updatedOptions);

        setEditItemId(null);
        setEditItemText("");
      } else {
        console.error("Failed to update city:", response.statusText);
      }
    } catch (error) {
      console.error("Error updating city:", error);
    }
  };

  const fetchCity = async () => {
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
      setFilteredOptions(data.vendor_city);
      setOptions(data.vendor_city);
    } catch (error) {
      console.error("Error fetching city:", error);
    }
  };

  useEffect(() => {
    fetchCity();
  }, []);

  return (
      <div className="w-full justify-center bg-white">
        <div className="flex flex-col md:flex-row w-full">
        <div
          style={{
            flex: 1,
            margin: 10,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            height: "50vh",
            gap: 10,
          }}
        >
          <div className="text-base font-bold">{"Enter a City"}</div>
          <TextField
            id="input-with-sx"
            variant="outlined"
            sx={{ width: "100%", marginTop: 1 }}
            size="small"
            value={newCity}
            onChange={(e) => setNewCity(e.target.value)}
            error={cityexists}
            helperText={cityexists && "City already exists"}
            required
          />
          <Button
            sx={{ width: "50%", marginLeft: "auto" }}
            disabled={!(newCity.length > 2)}
            variant="contained"
            onClick={() => createCity(newCity)}
          >
            Create
          </Button>
        </div>

        <div style={{ flex: 1, margin:12 }}>
          {/* Search bar */}
          <TextField
            label="Search City"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchInputChange}
            sx={{ width: "100%" }}
          />
          {/* List of cities */}
          <List
            sx={{
              marginTop: 2,
              maxHeight: "calc(80vh - 200px)",
              overflow: "auto",
            }}
          >
            {filteredOptions?.map((item: any) =>
              editItemId === item?.id ? (
                <ListItem key={item?.id}>
                  <div className="flex flex-col gap-5  w-full">
                    <TextField
                      value={editItemText}
                      onChange={(e) => setEditItemText(e.target.value)}
                      error={editCityexists}
                      helperText={editCityexists && "City already exists"}
                    />
                    <div className="flex gap-10">
                      <Button
                        disabled={!(editItemText.length > 2)}
                        variant="contained"
                        onClick={() => editCity(item.id, editItemText)}
                      >
                        OK
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleEditItemCancel}
                      >
                        Back
                      </Button>
                    </div>
                  </div>
                </ListItem>
              ) : (
                <ListItem key={item.id}>
                  <ListItemText primary={item.city} />

                  <ListItemSecondaryAction sx={{ right: 0 }}>
                    <IconButton
                      aria-label="edit"
                      onClick={() => handleEditItem(item.id, item.city)}
                    >
                      <EditIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ),
            )}
          </List>
        </div>
        </div>
        </div>
  );
}
