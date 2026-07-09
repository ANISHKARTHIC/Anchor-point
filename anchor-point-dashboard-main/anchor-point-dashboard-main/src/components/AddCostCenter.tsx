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
  
  export default function AddCostCenter() {
    const [filteredOptions, setFilteredOptions] = useState([]);
    const [options, setOptions] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [editItemId, setEditItemId] = useState(null);
    const [editName, setEditName] = useState("");
    const [editGst, setEditGst] = useState("");
    const [editAddress, setEditAddress] = useState("");
    const [newcostCenter, setNewcostCenter] = useState("");
    const [newGstno, setNewGstno] = useState("");
    const [newAddress, setAddress] = useState("");
    const [costCenterexists, setcostCenterexists] = useState(false);
    const [editcostCenterexists,seteditcostCenterexists] = useState(false);
  
    const handleSearchInputChange = (event: any) => {
      const inputText = event.target.value.toLowerCase();
      setSearchTerm(inputText);
      if (inputText === "") {
        setFilteredOptions(options);
      } else {
        const filtered = filteredOptions.filter((option: any) =>
          option.code.toLowerCase().includes(inputText),
        );
        setFilteredOptions(filtered);
      }
    };
  
    const handleEditItem = (id: any, costcenter: any) => {
      setEditItemId(id);
      setEditName(costcenter.code);
      setEditGst(costcenter.gstin_no);
      setEditAddress(costcenter.address);
    };
  
    const handleEditItemCancel = () => {
      setEditItemId(null);
      setEditName("");
      setEditGst("");
      setEditAddress("");
      setFilteredOptions(filteredOptions);
    };
  
    const createcostCenter = async () => {
      try {
        const response = await fetch(`${BASE_URL}/cost-centres`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("userToken"),
          },
          body: JSON.stringify({
            code : newcostCenter,
            gstin_no : newGstno,
            address : newAddress
          })
        });
        if (response.status === 409) {
          setcostCenterexists(true);
          return;
        }
        setcostCenterexists(false);
        fetchcostCenter();
        setNewcostCenter("");
        setNewGstno("")
        setAddress("")
      } catch (error) {
        console.error("Error creating organizer data:", error);
        return null;
      }
    };
  
    const editcostCenter = async (id: any) => {
      try {
        const response = await fetch(
          `${BASE_URL}/cost-centres/${id}`,
          {
            method: "PUT",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: "Bearer " + localStorage.getItem("userToken"),
            },
            body: JSON.stringify({
                code : editName,
                gstin_no : editGst,
                address : editAddress
            })
          },
        );
        if (response.status === 409) {
          seteditcostCenterexists(true);
          return;
        }
        seteditcostCenterexists(false);

        if (response.ok) {
          const updatedOptions: any = filteredOptions.map((option: any) => {
            if (option.id === id) {
              return { ...option, 
                code : editName,
                gstin_no : editGst,
                address : editAddress
            };
            } else {
              return option;
            }
          });
  
          setFilteredOptions(updatedOptions);
  
          setEditItemId(null);
          setEditName("");
          setEditGst("");
          setEditAddress("");
        } else {
          console.error("Failed to update costCenter:", response.statusText);
        }
      } catch (error) {
        console.error("Error updating costCenter:", error);
      }
    };
  
    const fetchcostCenter = async () => {
      try {
        const response = await fetch(`${BASE_URL}/cost-centres`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("userToken"),
          },
        });
        const data = await response.json();
        setFilteredOptions(data.cost_centres);
        setOptions(data.cost_centres);
      } catch (error) {
        console.error("Error creating costCenter:", error);
      }
    };
  
    useEffect(() => {
      fetchcostCenter();
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
            <div className="text-base font-bold">{"Name"}</div>
            <TextField
              id="name"
              variant="outlined"
              sx={{ width: "100%", marginTop: 1 }}
              size="small"
              value={newcostCenter}
              onChange={(e) => setNewcostCenter(e.target.value)}
              error={costCenterexists}
              helperText={costCenterexists && "Cost Center already exists"}
              required
            />
            <div className="text-base font-bold">{"GST No"}</div>
            <TextField
              id="gstno"
              variant="outlined"
              sx={{ width: "100%", marginTop: 1 }}
              size="small"
              value={newGstno}
              onChange={(e) => setNewGstno(e.target.value)}
            />
            <div className="text-base font-bold">{"Address"}</div>
            <TextField
              id="address"
              variant="outlined"
              sx={{ width: "100%", marginTop: 1 }}
              size="small"
              value={newAddress}
              onChange={(e) => setAddress(e.target.value)}
            />
            <Button
              sx={{ width: "50%", marginLeft: "auto" }}
              disabled={!(newcostCenter.length > 2)}
              variant="contained"
              onClick={() => createcostCenter()}
            >
              Create
            </Button>
          </div>
  
          <div style={{ flex: 1, margin:12 }}>
            {/* Search bar */}
            <TextField
              label="Search Cost Center"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearchInputChange}
              sx={{ width: "100%" }}
            />
            {/* List of cost centers */}
            <List
              sx={{
                marginTop: 2,
                maxHeight: "calc(80vh - 200px)",
                overflow: "auto",
              }}
            >
              {filteredOptions?.map((costCenter: any) =>
                editItemId === costCenter?.id ? (
                  <ListItem key={costCenter?.id}>
                    <div className="flex flex-col gap-5  w-full">
                    <div className="text-base font-bold">{"Name"}</div>
                      <TextField
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        error={editcostCenterexists}
                        helperText={editcostCenterexists && "Cost Center already exists"}
                      />
                      <div className="text-base font-bold">{"GST No"}</div>
                      <TextField
                        value={editGst}
                        onChange={(e) => setEditGst(e.target.value)}
                      />
                      <div className="text-base font-bold">{"Address"}</div>
                      <TextField
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                      />
                      <div className="flex gap-10">
                        <Button
                          disabled={!(editName.length > 2)}
                          variant="contained"
                          onClick={() => editcostCenter(costCenter.id)}
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
                  <ListItem key={costCenter.id}>
                    <ListItemText primary={costCenter.code} />
  
                    <ListItemSecondaryAction sx={{ right: 0 }}>
                      <IconButton
                        aria-label="edit"
                        onClick={() => handleEditItem(costCenter.id, costCenter)}
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
  