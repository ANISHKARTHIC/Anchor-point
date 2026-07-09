import React, { useEffect, useState } from "react";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  TextField,
  InputAdornment,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

const DateSelector = ({
  open,
  onOpen,
  onClose,
  selectedDates,
  setSelectedDates,
  onSelectDates,
  handleDateToggle,
  disabled,
}) => {
  // Internal state to keep track of selected dates
  const [localSelectedDates, setLocalSelectedDates] = useState(selectedDates);

  // Synchronize the local state with the parent state (selectedDates)
  useEffect(() => {
    setLocalSelectedDates(selectedDates);
  }, [selectedDates]);

  const handleDateSelection = (date) => {
    const updatedDates = [...localSelectedDates];
    const index = updatedDates.findIndex((d) => d.isSame(date, "day"));
    if (index === -1) {
      updatedDates.push(date);
    } else {
      updatedDates.splice(index, 1); // Remove if already selected
    }

    setLocalSelectedDates(updatedDates);
    setSelectedDates(updatedDates);
    onSelectDates(updatedDates);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <TextField
        placeholder="DD-MM-YYYY"
        disabled={disabled}
        value={
          localSelectedDates && localSelectedDates.length > 0
            ? localSelectedDates
                .map((date) => date.format("DD-MM-YYYY"))
                .join(", ")
            : ""
        }
        onClick={onOpen}
        size="small"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <CalendarMonthIcon />
            </InputAdornment>
          ),
        }}
      />
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <StaticDatePicker
              disableFuture={false}
              value={null}
              onChange={handleDateToggle}
              slots={{
                actionBar: () => null,
                toolbar: () => null,
                day: ({ day, selected, ...props }) => {
                  const isSelected = localSelectedDates.some((selectedDate) =>
                    selectedDate.isSame(day, "day"),
                  );
                  return (
                    <Box
                      {...props}
                      onClick={() => handleDateSelection(day)}
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        backgroundColor: isSelected
                          ? "primary.main"
                          : "transparent",
                        color: isSelected ? "white" : "inherit",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: isSelected
                            ? "primary.dark"
                            : "primary.light",
                        },
                      }}
                    >
                      {day.date()}
                    </Box>
                  );
                },
              }}
            />
          </LocalizationProvider>
          <DialogActions>
            <Button
              onClick={() => {
                setLocalSelectedDates([]);
                setSelectedDates([]);
                onSelectDates([]);
                onClose();
              }}
              color="primary"
              variant="outlined"
            >
              Clear
            </Button>
            <Button onClick={onClose} color="primary" variant="contained">
              OK
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default DateSelector;
