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
  
  export default function AddModelForm() {
    const [filteredOptions, setFilteredOptions] = useState([]);
    const [options, setOptions] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [editItemId, setEditItemId] = useState(null);
    const [editItemText, setEditItemText] = useState("");
    const [newModel, setNewModel] = useState("");
    const [modelexists, setModelexists] = useState(false);
    const [editModelexists,setEditModelexists] = useState(false);
  
    const handleSearchInputChange = (event: any) => {
      const inputText = event.target.value.toLowerCase();
      setSearchTerm(inputText);
      if (inputText === "") {
        setFilteredOptions(options);
      } else {
        const filtered = filteredOptions.filter((option: any) =>
          option.name.toLowerCase().includes(inputText),
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
  
    const createModel = async (data: any) => {
      try {
        const response = await fetch(`${BASE_URL}/vehicles/models?vehicle_model=${data}`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("userToken"),
          },
        });
        if (response.status === 409) {
          setModelexists(true);
          return;
        }
        setModelexists(false);
        fetchModel();
        setNewModel("");
      } catch (error) {
        console.error("Error creating organizer data:", error);
        return null;
      }
    };
  
    const editModel = async (id: any, initialText: any) => {
      try {
        const response = await fetch(
          `${BASE_URL}/vehicles/models/${id}?vehicle_model=${initialText}`,
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
          setEditModelexists(true);
          return;
        }
        setEditModelexists(false);
        if (response.ok) {
          const updatedOptions: any = filteredOptions.map((option: any) => {
            if (option.id === id) {
              return { ...option, name: initialText };
            } else {
              return option;
            }
          });
  
          setFilteredOptions(updatedOptions);
  
          setEditItemId(null);
          setEditItemText("");
        } else {
          console.error("Failed to update Model:", response.statusText);
        }
      } catch (error) {
        console.error("Error updating Model:", error);
      }
    };
  
    const fetchModel = async () => {
      try {
        const response = await fetch(`${BASE_URL}/vehicles/models`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("userToken"),
          },
        });
        const data = await response.json();
        setFilteredOptions(data.vehicle_models);
        setOptions(data.vehicle_models);
      } catch (error) {
        console.error("Error creating Model:", error);
      }
    };
  
    useEffect(() => {
      fetchModel();
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
            <div className="text-base font-bold">{"Enter a Vehicle Model"}</div>
            <TextField
              id="input-with-sx"
              variant="outlined"
              sx={{ width: "100%", marginTop: 1 }}
              size="small"
              value={newModel}
              onChange={(e) => setNewModel(e.target.value)}
              error={modelexists}
              helperText={modelexists && "Model already exists"}
              required
            />
            <Button
              sx={{ width: "50%", marginLeft: "auto" }}
              disabled={!(newModel.length > 2)}
              variant="contained"
              onClick={() => createModel(newModel)}
            >
              Create
            </Button>
          </div>
  
          <div style={{ flex: 1, margin:12 }}>
            {/* Search bar */}
            <TextField
              label="Search Vehicle Model"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearchInputChange}
              sx={{ width: "100%" }}
            />
            {/* List of Models */}
            <List
              sx={{
                marginTop: 2,
                maxHeight: "calc(80vh - 200px)",
                overflow: "auto",
              }}
            >
              {filteredOptions?.map((opt: any) =>
                editItemId === opt?.id ? (
                  <ListItem key={opt?.id}>
                    <div className="flex flex-col gap-5  w-full">
                      <TextField
                        value={editItemText}
                        onChange={(e) => setEditItemText(e.target.value)}
                        error={editModelexists}
                        helperText={editModelexists && "City already exists"}
                      />
                      <div className="flex gap-10">
                        <Button
                          disabled={!(editItemText.length > 2)}
                          variant="contained"
                          onClick={() => editModel(opt.id, editItemText)}
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
                  <ListItem key={opt.id}>
                    <ListItemText primary={opt.name} />
  
                    <ListItemSecondaryAction sx={{ right: 0 }}>
                      <IconButton
                        aria-label="edit"
                        onClick={() => handleEditItem(opt.id, opt.name)}
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
  