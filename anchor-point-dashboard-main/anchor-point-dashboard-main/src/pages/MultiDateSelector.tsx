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
  Typography,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";

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
        placeholder="DD-MM-YYYY (Multi-select)"
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
              <CalendarMonthIcon sx={{ color: "#64748B" }} />
            </InputAdornment>
          ),
          sx: {
            cursor: "pointer",
            backgroundColor: "#FFFFFF",
          }
        }}
        sx={{
          "& .MuiInputBase-input": {
            cursor: "pointer",
            color: "#334155",
            fontWeight: 500,
          }
        }}
      />
      <Dialog 
        open={open} 
        onClose={onClose} 
        fullWidth 
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            overflow: "hidden"
          }
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          px: 3, 
          py: 2, 
          borderBottom: '1px solid #E2E8F0',
          backgroundColor: '#F8FAFC'
        }}>
          <Typography sx={{ fontWeight: 600, color: '#0F172A', fontSize: '1.1rem' }}>
            Select Dates
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: '#64748B' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 0 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <StaticDatePicker
              displayStaticWrapperAs="desktop"
              disableFuture={false}
              value={null}
              onChange={handleDateToggle}
              sx={{
                width: '100%',
                "& .MuiPickersCalendarHeader-root": {
                  marginTop: "16px",
                  paddingLeft: "24px",
                  paddingRight: "16px"
                },
                "& .MuiPickersCalendarHeader-label": {
                  fontWeight: 600,
                  color: "#1E293B"
                },
                "& .MuiDayCalendar-header": {
                  "& .MuiDayCalendar-weekDayLabel": {
                    color: "#64748B",
                    fontWeight: 500
                  }
                }
              }}
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
                          ? "#059669" // Emerald 600
                          : "transparent",
                        color: isSelected ? "#FFFFFF" : "#334155", // Slate 700
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontWeight: isSelected ? 600 : 500,
                        transition: "all 0.2s ease",
                        "&:hover": {
                          backgroundColor: isSelected
                            ? "#047857" // Emerald 700
                            : "#F1F5F9", // Slate 100
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
          <Box sx={{ 
            p: 3, 
            pt: 1,
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
              {localSelectedDates.length} date{localSelectedDates.length !== 1 ? 's' : ''} selected
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                onClick={() => {
                  setLocalSelectedDates([]);
                  setSelectedDates([]);
                  onSelectDates([]);
                  onClose();
                }}
                sx={{
                  color: "#64748B",
                  borderColor: "#E2E8F0",
                  "&:hover": {
                    backgroundColor: "#F8FAFC",
                    borderColor: "#CBD5E1",
                  }
                }}
                variant="outlined"
                size="small"
              >
                Clear
              </Button>
              <Button 
                onClick={onClose} 
                variant="contained" 
                size="small"
                sx={{
                  backgroundColor: "#334155",
                  "&:hover": { backgroundColor: "#475569" },
                  boxShadow: "none"
                }}
              >
                Done
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default DateSelector;
