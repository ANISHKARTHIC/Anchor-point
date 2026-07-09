import {
  Button,
  Card,
  CardActions,
  CardContent,
  Dialog,
  DialogTitle,
  Drawer,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { BASE_URL } from "../constants/string";
import {
  editRequestStatusColor,
  editRequestStatusTags,
} from "../constants/bookingstatusTags";

function EditRequest(props: any) {
  const [description, setDescription] = useState("");
  const [isConfirm, setIsConfirm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(false);
  const userRole: String | null = localStorage.getItem("role");

  const handleCreateRequest = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/hotel_bookings/${props.booking_id}/edit`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("userToken"),
          },
          body: JSON.stringify({
            status: "edit_requested",
            description: description,
            booking_id: props.booking_id,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        response.status != 422 && response.status != 500
          ? console.log("Error:", data)
          : "";
        throw new Error("Error creating edit request");
      }
      props.setIsEditCreate(false);
      setDescription("");
      props.setAlertType("success");
      props.setAlertMsg(data.message);
      props.fetchEditRequests();
      setTimeout(() => {
        props.setAlertMsg("");
      }, 3000);
    } catch (error) {
      console.log(error);
      props.setAlertType("error");
      props.setAlertMsg("Error creating edit request");
      setTimeout(() => {
        props.setAlertMsg("");
      }, 3000);
    }
  };

  const handleStatusChange = async (id: any, prevStatus: any) => {
    if (prevStatus == "edit_requested") {
      try {
        const response = await fetch(
          `${BASE_URL}/hotel_bookings/${props.booking_id}/edit`,
          {
            method: "PUT",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: "Bearer " + localStorage.getItem("userToken"),
            },
            body: JSON.stringify({
              request_id: id,
              status: "edit_acknowledged",
              metadata: {
                organizer_id: localStorage.getItem("userID"),
                organizer_name: localStorage.getItem("userName"),
              },
            }),
          },
        );
        const data = await response.json();
        if (!response.ok) {
          response.status != 422 && response.status != 500
            ? console.log("Error:", data)
            : "";
          throw new Error("Error updating edit request");
        }
        props.setAlertType("success");
        props.setAlertMsg(data.message);
        props.fetchEditRequests();
        setTimeout(() => {
          props.setAlertMsg("");
        }, 3000);
      } catch (error) {
        console.log(error);
        props.setAlertType("error");
        props.setAlertMsg("Error updating edit request");
        setTimeout(() => {
          props.setAlertMsg("");
        }, 3000);
      }
    } else {
      setIsConfirm(true);
      setSelectedRequest(id);
    }
  };

  const handleConfirmation = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/hotel_bookings/${props.booking_id}/edit`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("userToken"),
          },
          body: JSON.stringify({
            request_id: selectedRequest,
            status: "edit_confirmed",
            metadata: {
              confirm_description: description,
              organizer_id: localStorage.getItem("userID"),
              organizer_name: localStorage.getItem("userName"),
            },
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        response.status != 422 && response.status != 500
          ? console.log("Error:", data)
          : "";
        throw new Error("Error updating edit request");
      }
      props.setAlertType("success");
      props.setAlertMsg(data.message);
      props.fetchEditRequests();
      setTimeout(() => {
        props.setAlertMsg("");
      }, 3000);
    } catch (error) {
      console.log(error);
      props.setAlertType("error");
      props.setAlertMsg("Error updating edit request");
      setTimeout(() => {
        props.setAlertMsg("");
      }, 3000);
    }
    setDescription("");
    setIsConfirm(false);
  };

  return (
    <div>
      {props.create && (
        <div>
          <Drawer
            anchor={"right"}
            open={props.isEditCreate}
            onClose={() => {
              props.setIsEditCreate(false);
            }}
          >
            <div className="flex flex-col gap-5 justify-center items-center m-5 ">
              <Typography>Create Change Request</Typography>
              <TextField
                multiline
                maxRows={Infinity}
                rows={20}
                className="w-80"
                placeholder="Detailed description of the change request"
                value={description}
                onChange={(e: any) => setDescription(e.target.value)}
              ></TextField>
              <Button onClick={handleCreateRequest}>
                Submit change request
              </Button>
            </div>
          </Drawer>
        </div>
      )}
      {!props.create && (
        <div className="flex flex-col flex-wrap justify-center gap-5 mt-5 md:flex-row">
          {props.reqList.map((req: any) => (
            <Card
              data-resizable
              sx={{
                textAlign: "center",
                alignItems: "center",
                width: 343,
                maxHeight: 300,
                // to make the card resizable
                overflow: "auto",
                resize: "both",
              }}
            >
              <CardContent>
                <div className="flex justify-start">{"Req Id: " + req.id}</div>
                <Typography gutterBottom variant="h5" component="div">
                  Request on{" "}
                  {new Date(req?.created_at)
                    .toLocaleString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                    })
                    .replace(/-/g, " ")}
                </Typography>
                <Typography variant="h6" sx={{ color: "text.secondary" }}>
                  {req.description}
                </Typography>
                {userRole === "coordinator" && (
                  <Typography
                    sx={{ color: editRequestStatusColor(req.status) }}
                    variant={'h6'}
                  >
                    {editRequestStatusTags(req.status)}
                  </Typography>
                )}
              </CardContent>
              { userRole != "coordinator"  &&
                    (req.status != "edit_confirmed" ? (
                        <CardActions>
                          <Button
                            disabled={props.isBookingCancelled}
                            onClick={() => handleStatusChange(req.id, req.status)}
                          >
                            {req.status == "edit_requested" ? "Acknowledge" : "Confirm"}
                          </Button>
                        </CardActions>
                      ) : (
                        "Confirmation Sent!"
                      ))
              }
            </Card>
          ))}
          {
            <div>
              <Dialog onClose={() => setIsConfirm(false)} open={isConfirm}>
                <div className="flex flex-col justify-center items-center m-5">
                  <DialogTitle variant="h5">Confirm edit request</DialogTitle>
                  <TextField
                    multiline
                    maxRows={4}
                    rows={10}
                    className="w-80"
                    placeholder="Confirmation description"
                    value={description}
                    onChange={(e: any) => setDescription(e.target.value)}
                  ></TextField>
                  <div className="flex flex-row justify-center">
                    <Button
                      variant="contained"
                      color="inherit"
                      sx={{ m: 2 }}
                      onClick={() => setIsConfirm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      sx={{ m: 2 }}
                      onClick={handleConfirmation}
                    >
                      Proceed
                    </Button>
                  </div>
                </div>
              </Dialog>
            </div>
          }
        </div>
      )}
    </div>
  );
}

export default EditRequest;
