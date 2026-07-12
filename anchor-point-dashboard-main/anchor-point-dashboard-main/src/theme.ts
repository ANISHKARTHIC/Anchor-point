import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#334155",    // slate-700
      light: "#475569",   // slate-600
      dark: "#1E293B",    // slate-800
    },
    secondary: {
      main: "#059669",    // emerald-600
      light: "#10B981",   // emerald-500
      dark: "#047857",    // emerald-700
    },
    background: {
      default: "#F8FAFC", // slate-50
      paper: "#FFFFFF",
    },
    text: {
      primary: "#0F172A",   // slate-900
      secondary: "#475569", // slate-600
    },
    divider: "#E2E8F0",    // slate-200
    error: {
      main: "#DC2626",
    },
    success: {
      main: "#059669",
    },
  },
  typography: {
    fontFamily: '"DM Sans", sans-serif',
    h1: { fontWeight: 600, letterSpacing: "-0.025em" },
    h2: { fontWeight: 600, letterSpacing: "-0.025em" },
    h3: { fontWeight: 600, letterSpacing: "-0.015em" },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500, color: "#475569" },
    subtitle2: { fontWeight: 500, color: "#64748B" },
    body1: { color: "#334155" },
    body2: { color: "#475569", fontSize: "0.875rem" },
    button: {
      textTransform: "none" as const,
      fontWeight: 500,
      letterSpacing: "0.01em",
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          borderRadius: "8px",
          padding: "8px 20px",
          fontWeight: 500,
          "&:hover": {
            boxShadow: "none",
          },
        },
        contained: {
          "&:hover": {
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          },
        },
        outlined: {
          borderColor: "#E2E8F0",
          color: "#334155",
          "&:hover": {
            borderColor: "#CBD5E1",
            backgroundColor: "#F8FAFC",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          border: "1px solid #E2E8F0",
          borderRadius: "12px",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          borderBottom: "1px solid #E2E8F0",
          backgroundColor: "#FFFFFF",
          color: "#0F172A",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        elevation1: {
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          border: "1px solid #E2E8F0",
        },
        elevation2: {
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          border: "1px solid #E2E8F0",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "8px",
            "& fieldset": {
              borderColor: "#E2E8F0",
            },
            "&:hover fieldset": {
              borderColor: "#CBD5E1",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#334155",
              borderWidth: "1.5px",
            },
          },
          "& .MuiInputLabel-root": {
            color: "#64748B",
            "&.Mui-focused": {
              color: "#334155",
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          "& fieldset": {
            borderColor: "#E2E8F0",
          },
          "&:hover fieldset": {
            borderColor: "#CBD5E1",
          },
          "&.Mui-focused fieldset": {
            borderColor: "#334155",
            borderWidth: "1.5px",
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: "#CBD5E1",
          "&.Mui-checked": {
            color: "#334155",
          },
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          color: "#CBD5E1",
          "&.Mui-checked": {
            color: "#334155",
          },
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          color: "#E2E8F0",
          "&.Mui-active": {
            color: "#334155",
          },
          "&.Mui-completed": {
            color: "#059669",
          },
        },
      },
    },
    MuiStepConnector: {
      styleOverrides: {
        line: {
          borderColor: "#E2E8F0",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: "1px solid #E2E8F0",
          backgroundColor: "#FFFFFF",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          "&.Mui-selected": {
            backgroundColor: "#F1F5F9",
            borderLeft: "3px solid #059669",
            "&:hover": {
              backgroundColor: "#F1F5F9",
            },
          },
          "&:hover": {
            backgroundColor: "#F8FAFC",
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "#E2E8F0",
        },
      },
    },
    MuiPagination: {
      styleOverrides: {
        root: {
          "& .MuiPaginationItem-root": {
            borderRadius: "8px",
            "&.Mui-selected": {
              backgroundColor: "#334155",
              color: "#FFFFFF",
              "&:hover": {
                backgroundColor: "#475569",
              },
            },
          },
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          border: "1px solid #E2E8F0",
          borderRadius: "12px !important",
          "&:before": {
            display: "none",
          },
          "&.Mui-expanded": {
            margin: "8px 0",
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          "&.Mui-expanded": {
            minHeight: "48px",
          },
        },
        content: {
          "&.Mui-expanded": {
            margin: "12px 0",
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          "& .MuiSwitch-switchBase.Mui-checked": {
            color: "#334155",
          },
          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
            backgroundColor: "#475569",
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: "12px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
        },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          "& .MuiSnackbarContent-root": {
            borderRadius: "8px",
            backgroundColor: "#334155",
          },
        },
      },
    },
  },
});

export default theme;
