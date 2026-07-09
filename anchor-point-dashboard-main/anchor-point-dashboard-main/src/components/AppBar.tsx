import circle from "../assets/pointCircle.svg";
import SideBar from "./TempSidebar";
import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  Box,
  AppBar as MUIAppBar,
  Typography,
  Toolbar,
  IconButton,
  InputBase,
  Stack,
  Switch,
} from "@mui/material";
import Button from "@mui/material/Button";
import { styled, alpha } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import MiniDrawer from "./FixedSidebar";
import { ROUTE } from "../constants/routes";
import { BASE_URL } from "../constants/string";
import { handleFireBaseSignout } from "../firebase";


const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderWidth: "0.5px",
  borderColor: "#64748B",
  borderRadius: "10px",
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    marginLeft: theme.spacing(1),
    width: "auto",
  },
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "#64748B",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create("width"),
    width: "100%",
    [theme.breakpoints.up("sm")]: {
      width: "12ch",
      "&:focus": {
        width: "20ch",
      },
    },
  },
}));

type Anchor = "top" | "left" | "bottom" | "right";

function AppBar() {
  const [state, setState] = useState({
    top: false,
    left: false,
    bottom: false,
    right: false,
  });

  const [smallScreen, setSmallScreen] = useState(false);
  const [isActive,setIsActive] = useState(localStorage.getItem("bookingtype") == "cab")
  const navigate = useNavigate();
  const isVendor = localStorage.getItem("isVendor")

  const MaterialUISwitch = styled(Switch)(({ theme }) => ({
    width: 62,
    height: 34,
    padding: 7,
    '& .MuiSwitch-switchBase': {
      margin: 1,
      padding: 0,
      transform: 'translateX(6px)',
      '&.Mui-checked': {
        color: '#fff',
        transform: 'translateX(22px)',
        '& .MuiSwitch-thumb:before': {
          backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
            '#fff',
          )}" d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5H15V3H9v2H6.5c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>')`,
        },
        '& + .MuiSwitch-track': {
          opacity: 1,
          backgroundColor: '#aab4be',
          ...theme.applyStyles('dark', {
            backgroundColor: '#8796A5',
          }),
        },
      },
    },
    '& .MuiSwitch-thumb': {
      backgroundColor: '#001e3c',
      width: 32,
      height: 32,
      '&::before': {
        content: "''",
        position: 'absolute',
        width: '100%',
        height: '100%',
        left: 0,
        top: 0,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
          '#fff',
        )}" d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/></svg>')`,
      },
      ...theme.applyStyles('dark', {
        backgroundColor: '#003892',
      }),
    },
    '& .MuiSwitch-track': {
      opacity: 1,
      backgroundColor: '#aab4be',
      borderRadius: 20 / 2,
      ...theme.applyStyles('dark', {
        backgroundColor: '#8796A5',
      }),
    },
  }));

  const toggleDrawer =
    (anchor: Anchor, open: boolean) =>
    (event: React.KeyboardEvent | React.MouseEvent) => {
      if (
        event.type === "keydown" &&
        ((event as React.KeyboardEvent).key === "Tab" ||
          (event as React.KeyboardEvent).key === "Shift")
      ) {
        return;
      }

      setState({ ...state, [anchor]: open });
    };

  useEffect(() => {
    setSmallScreen(window.matchMedia("(max-width: 768px)").matches);
    const handleResize = () => {
      setSmallScreen(window.matchMedia("(max-width: 768px)").matches);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleLogout = async() => {
    const url = isVendor=="true" ? `${BASE_URL}/vendors/logout` :`${BASE_URL}/organizers/logout`
    try{
      const response = await fetch(url, {
      method: "POST",
      headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
      }
    })
    const data = await response.json()
    if(!response.ok) {
        (response.status != 422 && response.status != 500) ? console.log("Error:",data) : "";
        throw new Error("Error logging out");
    }
    handleFireBaseSignout().then(()=>{
      localStorage.clear()
      navigate(ROUTE.LOGIN)
    }).catch((err)=>{
       console.error("Firebase Signout Err",err)
    })
    } catch(error) {
        console.log(error)
    }
  }

  return (
    <Box>
      <MUIAppBar sx={{ bgcolor: "white" }} position="sticky">
        <Toolbar className="w-full flex justify-between lg:px-8 lg:py-4">
          <div className="flex items-center ">
            <IconButton
              size="small"
              edge="start"
              aria-label="menu"
              sx={{
                bgcolor: "#4EC7E6",
                "&:hover": {
                  bgcolor: "#4EC7E6",
                },
              }}
              className="rounded-sm"
              onClick={smallScreen ? toggleDrawer("left", true) : () => {}}
            >
              <MenuIcon className="text-white" />
            </IconButton>
            <div className="flex text-black ml-4">
              <Typography>ANCHORP</Typography>
              <img src={circle} className="w-4" />
              <Typography>INT</Typography>
            </div>
          </div>

          <div className="flex items-center ml-3">
            {/* <Search className="">
              <SearchIconWrapper>
                <SearchIcon className="text-[#64748B]" />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Search…"
                inputProps={{ "aria-label": "search" }}
              />
            </Search>
            <Stack direction="row" spacing={2} className="ml-3 md:ml-7">
              <IconButton
                size="small"
                aria-label="notification"
                sx={{ bgcolor: "#4EC7E6" }}
              >
                <NotificationsNoneOutlinedIcon className="text-white" />
              </IconButton>
              <AccountCircleIcon
                sx={{ color: "#64748B", width: 36, height: 36 }}
              />
            </Stack> */}
            {isVendor == "false" && <div className=" text-black">
            <span>{isActive? "Cab" : "Hotel"}</span>
            <MaterialUISwitch sx={{ m: 1 }} defaultChecked checked={isActive} onChange={(e:any)=>{
              if(e.target.checked) {
                setIsActive(true)
                localStorage.setItem("bookingtype","cab")
                navigate(0)
              } else {
                setIsActive(false)
                localStorage.setItem("bookingtype","hotel")
                navigate(0)
              }
            }} />
            </div>}
            <div>
              <Button
                variant="outlined"
                sx={{ marginLeft: "8px" }}
                onClick={handleLogout}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </Toolbar>
      </MUIAppBar>
      <MiniDrawer />
    </Box>
  );
}

export default AppBar;
