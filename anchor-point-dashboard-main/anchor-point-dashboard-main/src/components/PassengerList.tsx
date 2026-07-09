import React, { useEffect, useState } from "react";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import {
  Box,
  Button,
  CardHeader,
  IconButton,
  ListItemButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { STRING_BOOKINGS } from "../constants/string";

interface PassengerListProps {
  bookingData: any;
  onDataChange: (data: any) => void;
  onSelectedIndex: (data: any) => void;
  OnDeleteGuestsData: any;
  deleteGuestsData: any;
}

const PassengerList: React.FC<PassengerListProps> = ({
  bookingData,
  onDataChange,
  onSelectedIndex,
  OnDeleteGuestsData,
  deleteGuestsData,
}) => {
  const bookingtype = localStorage.getItem("bookingtype");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const count =
    bookingtype === "hotel"
      ? bookingData.guests.length
      : bookingData.data.guests.length;

  const [guestNames, setGuestNames] = useState<string[]>([]);

  useEffect(() => {
    setGuestNames(generateGuestNames());
  }, [bookingData]);

  const handleListItemClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    index: number,
  ) => {
    onSelectedIndex(index);
    setSelectedIndex(index);
  };

  const generateGuestNames = () => {
    return Array.from({ length: count }, (_, index) => {
      const originalName =
        bookingtype === "hotel"
          ? bookingData.guests[index]?.name
          : bookingData.data.guests[index]?.name;
      return (
        originalName ||
        `Guest ${index + 1} ${
          bookingtype === "hotel" && index === 0 ? "(Primary)" : ""
        }`
      );
    });
  };

  const handleAddGuest = () => {
    const updatedBookingData = { ...bookingData };

    const newGuest = bookingtype == "hotel" ? {
      is_primary: false,
      name: "",
      email: "",
      mobile: "",
      rank: "",
      internal_id: "",
      vessel_name: ""
    } : {
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
    };

    if (bookingtype === "hotel") {
      updatedBookingData.guests = [...updatedBookingData.guests, newGuest];
    } else {
      updatedBookingData.data.guests = [
        ...updatedBookingData.data.guests,
        newGuest,
      ];
    }

    onDataChange(bookingtype === "hotel" ? { guests: updatedBookingData.guests } : { guests: updatedBookingData.data.guests });

    setGuestNames(generateGuestNames());
  };

  const handleDeleteGuest = (index: number) => {
    const updatedBookingData = { ...bookingData };

    if (bookingtype === "hotel") {
      const guest = bookingData.guests[index];

      if (bookingData.bid && guest.hotel_booking_guest_id) {
        const deletedGuest = { ...guest, delete: true };
        let position = deleteGuestsData.findIndex((item:any) => item.hotel_booking_guest_id == guest.hotel_booking_guest_id)
        position == -1 ? OnDeleteGuestsData((prevDeletedGuests) => [
          ...prevDeletedGuests,
          deletedGuest,
        ]) : "";
      }

      updatedBookingData.guests = updatedBookingData.guests.filter(
        (_: any, i: number) => i !== index,
      );
    } else {
      const guest = bookingData.data.guests[index];

      if (bookingData.bid && guest.booking_log_id) {
        const deletedGuest = { ...guest, delete: true };
        OnDeleteGuestsData((prevDeletedGuests) => [
          ...prevDeletedGuests,
          deletedGuest,
        ]);
      }

      updatedBookingData.data.guests = updatedBookingData.data.guests.filter(
        (_: any, i: number) => i !== index,
      );
    }

    console.log("updatedBookingData", updatedBookingData);

    onDataChange(bookingtype === "hotel" ? { guests: updatedBookingData.guests } : { guests: updatedBookingData.data.guests });

    const newGuestNames = Array.from(
      {
        length:
          bookingtype === "hotel"
            ? updatedBookingData.guests.length
            : updatedBookingData.data.guests.length,
      },
      (_, idx) =>
        bookingtype === "hotel"
          ? updatedBookingData.guests[idx]?.name || `Guest ${idx + 1}`
          : updatedBookingData.data.guests[idx]?.name || `Guest ${idx + 1}`,
    );

    setGuestNames(newGuestNames);

    setSelectedIndex((prevIndex) =>
      prevIndex >= newGuestNames.length ? newGuestNames.length - 1 : prevIndex,
    );
  };

  return (
    <>
      <Box
        sx={{
          minWidth: 300,
          maxWidth: 300,
          minHeight: 550,
          maxHeight: 550,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <Box
          sx={{
            display: "flex",
            backgroundColor: "lightgray",
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
              <div className="text-base font-bold">
                {STRING_BOOKINGS.PASSENGERHEADING}{" "}
              </div>
            }
            sx={{
              justifyContent: "center",
              alignItems: "center",
              display: "flex",
              backgroundColor: "lightgray",
            }}
          />

          <Button
            variant="contained"
            size="small"
            onClick={handleAddGuest}
            disabled={bookingtype == "hotel" ? (bookingData.trip_type == "Family" || bookingData?.no_of_adults <= bookingData?.guests?.length) : false}
            sx={{ padding: 1 }}
          >
            Add
          </Button>
        </Box>
        <Divider
          sx={{
            borderColor: "grey.500",
            width: "100%",
          }}
        />
        <List
          sx={{
            flex: 1,
            overflowY: "scroll",
            backgroundColor: "#fff",
          }}
        >
          {guestNames.map((name, index) => (
            <React.Fragment key={index}>
              <ListItemButton
                selected={selectedIndex === index}
                onClick={(event) => handleListItemClick(event, index)}
              >
                <ListItemAvatar>
                  <Avatar>{index + 1}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={name}
                  secondary={
                    <Box
                      component="span"
                      sx={{
                        display: "block",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "300px",
                      }}
                    >
                      {bookingtype === "hotel"
                        ? bookingData.guests[index]?.email
                        : bookingData.data.guests[index]?.email || ""}
                    </Box>
                  }
                />
                {
                  <IconButton
                    color="error"
                    onClick={(event) => {
                      event.stopPropagation(); // Prevents the ListItemButton click event
                      handleDeleteGuest(index); // Custom delete handler
                    }}
                    disabled={bookingtype === "cab" 
                      ? !(bookingData.data.guests.length >= 2)
                      : !(bookingData.guests.length >= 2)}
                  >
                    <DeleteIcon />
                  </IconButton>
                }
              </ListItemButton>
            </React.Fragment>
          ))}
        </List>
      </Box>
    </>
  );
};

export default PassengerList;
