import circle from "../assets/pointCircle.svg";
import tickSquare from "../assets/tickSquare.svg";
//@ts-ignore
import Apps from "../assets/apps.svg?react";
import * as React from "react";
import { styled, Theme, CSSObject } from "@mui/material/styles";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import CssBaseline from "@mui/material/CssBaseline";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { ROUTE } from "../constants/routes";
import { Link, Outlet } from "react-router-dom";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import PersonIcon from "@mui/icons-material/Person";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SettingsIcon from "@mui/icons-material/Settings";
import { useSelector } from "react-redux";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AssessmentIcon from "@mui/icons-material/Assessment";
import ReceiptIcon from "@mui/icons-material/Receipt";
import ProfileIcon from "@mui/icons-material/Person2Rounded";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import db, { firebaseApp } from "../firebase";
import { BASE_URL } from "../constants/string";
import { Badge } from "@mui/material";
import  MessageOutlined  from "@mui/icons-material/MessageOutlined";
import { getCollectionName } from "../utils/utils";

const drawerWidth = 240;
const bookingtype = localStorage.getItem("bookingtype")

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-around",
  padding: theme.spacing(0, 1.5),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open && {
    ...openedMixin(theme),
    "& .MuiDrawer-paper": openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    "& .MuiDrawer-paper": closedMixin(theme),
  }),
}));
const organiserSideMenu = [
  {
    name: "Dashboard",
    route: ROUTE.HOME,
    icon: (
      <Apps className="[&>path]:fill-[#64748B] [&>path]:stroke-[#64748B]" />
    ),
  },
  {
    name: "My Tasks",
    route: ROUTE.TASKS,
    icon: <img src={tickSquare} alt="tick-square" />,
  },
  { name: "Create Booking", route: ROUTE.BOOKINGS, icon: <PersonAddIcon /> },
  { name: "All Bookings", route: ROUTE.ALL_BOOKINGS, icon: <MenuBookIcon /> },
  {
    name: "Past Bookings",
    route: ROUTE.PASTBOOKINGS,
    icon: <HistoryRoundedIcon />,
  },
  { name: "Organizers", route: ROUTE.ORGANIZERS, icon: <PersonIcon /> },
  { name: "Vendors", route: ROUTE.VENDOR, icon: <PersonIcon /> },
  { name: "Job Report", route: ROUTE.JOB_REPORT, icon: <AssessmentIcon /> },
  {
    name: "Invoice Report",
    route: ROUTE.INVOICE_REPORT,
    icon: <ReceiptIcon />,
  },
  { name: "Tariff Plan", route: ROUTE.TARIFF_PLANS, icon: <SettingsIcon /> },
  { name: "Settings", route: ROUTE.SETTINGS, icon: <SettingsIcon /> },
];
const vendorSideMenu = [
  {
    name: "My Tasks",
    route: ROUTE.TASKS,
    icon: <img src={tickSquare} alt="tick-square" />,
  },
  { name: "All Bookings", route: ROUTE.ALL_BOOKINGS, icon: <MenuBookIcon /> },
  {
    name: "Past Bookings",
    route: ROUTE.PASTBOOKINGS,
    icon: <HistoryRoundedIcon />,
  },
];
const coordinatorSideMenu = [
  { name: "Create Booking", route: ROUTE.BOOKINGS, icon: <PersonAddIcon /> },
  // {name:"My Tasks",route:ROUTE.TASKS,icon: <img src={tickSquare} alt="tick-square" />},
  {
    name: "All Bookings",
    route: ROUTE.COORDINATOR_BOOKINGS,
    icon: <MenuBookIcon />,
  },
  { name: "My Messages", route: ROUTE.TASKS, icon: <MessageOutlined/> },
  { name: "Profile", route: ROUTE.USER_PROFILE_PAGE, icon: <ProfileIcon /> },
];
function MiniDrawer() {
  const count = useSelector((state: any) => state.pending);
  const small = window.matchMedia("(max-width: 768px)").matches;
  const [open, setOpen] = React.useState(small ? false : true);
  const [currentActiveMenu, setCurrentActiveMenu] = React.useState<number>(0);
  const isVendor = localStorage.getItem("isVendor");
  const userRole = localStorage.getItem("role");
  const userEmail = localStorage.getItem("userEmail");
  const bookingtype = localStorage.getItem("bookingtype");
  const menuList = React.useRef(
    userRole === "coordinator"
      ? coordinatorSideMenu
      : userRole === "1"
      ? organiserSideMenu
      : isVendor == "true"
      ? vendorSideMenu
      : organiserSideMenu.filter((item) =>
          item.name == "Organizers" || item.name == "Vendors" ? false : true,
        ),
  );
  //console.log("menuList==>",organiserSideMenu.filter(item=>item.name=="Organizers"||item.name=="Vendors"?false:true))
  const [unreadMsgInfo, setUnreadMsgInfo] = React.useState<any>({});
  const menuListItemProps = (value: number) => ({
    selected: currentActiveMenu === value,
    onClick: () => setCurrentActiveMenu(value),
    sx: {
      minHeight: 48,
      justifyContent: open ? "initial" : "center",
      px: 2.5,
      borderRadius: "4px",
      margin: "0px 13px 6px 13px",
    },
  });

  const handleDrawerClose = () => {
    setOpen(!open);
  };
  React.useEffect(() => {
    if(userRole != "coordinator") {
      return
    } 
    let unsubscribeUnReadCount: any;
      const usersRef = collection(db, getCollectionName("usersUnreadCounts"));
      let queryEmail =
        userRole === "coordinator" ? userEmail : "admin@gmail.com";
      let queryRole = userRole === "coordinator" ? "coordinator" : "organizer";
      const queryUserUnread = query(
        usersRef,
        where("userId", "==", queryEmail),
        where("role", "==", queryRole),
      );
      unsubscribeUnReadCount = onSnapshot(
        queryUserUnread, // Use the query here if you're filtering, or just `usersCollection` for all docs
        (snapshot) => {
          if (snapshot.empty) {
            setUnreadMsgInfo(null);
            console.log("No unread documents found");
          } else {
            const docData = snapshot.docs.map((doc) => doc.data());
            setUnreadMsgInfo(docData[0]);
            //console.log("docData", docData);
          }
        },
        (err) => {
          console.error("Getting Unread Error", err);
        },
      );
    
    return () => {
      if (unsubscribeUnReadCount) {
        unsubscribeUnReadCount();
      }
    };
  }, []);
  const getBookingIds = () => {
    return Object.keys(
      bookingtype == "cab"
        ? unreadMsgInfo["cabbookings"]?unreadMsgInfo["cabbookings"]:{}
        : unreadMsgInfo["hotelbookings"]?unreadMsgInfo["hotelbookings"]:{},
    ).toString();
  };
  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <Drawer variant="permanent" open={open} sx={{ height: "" }}>
        <DrawerHeader>
          <div className={`flex ${open ? "block" : "hidden"}`}>
            <Typography>ANCHORP</Typography>
            <img src={circle} className="w-4" />
            <Typography>INT</Typography>
          </div>
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
            onClick={handleDrawerClose}
          >
            <MenuIcon className="text-white" />
          </IconButton>
        </DrawerHeader>
        <Divider />
        <div
          className={`pt-6 pb-2 px-3 text-xs font-bold text-[#94A3B8]  mt-2 ${
            open ? "ml-6" : ""
          }`}
        >
          MENU
        </div>
        <List sx={{ marginTop: "" }}>
          {menuList.current.map((item, index) => {
            if(bookingtype == "cab"&&item.name === "My Messages"){
                 return <></>    
            }
            if(userRole === "coordinator"&&item.name === "My Messages"&&!unreadMsgInfo){
                  return <></>
            }
            return (
              <ListItem disablePadding sx={{ display: "block" }}>
                <Link
                  to={item.route}
                  state={
                    item.name === "My Messages"
                      ? {
                          url:
                            bookingtype == "cab"
                              ? ``
                              : `${BASE_URL}/hotel_bookings/?booking_ids=${getBookingIds()}`,
                          unReadMessage:
                            bookingtype == "cab"
                              ? unreadMsgInfo["cabbookings"]
                              : unreadMsgInfo["hotelbookings"],
                        }
                      : null
                  }
                >
                  <ListItemButton {...menuListItemProps(index)}>
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: open ? 3 : "auto",
                        justifyContent: "center",
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.name}
                      className="text-sm font-medium text-[#64748B]"
                      sx={{ opacity: open ? 1 : 0 }}
                    />
                  </ListItemButton>
                </Link>
                {userRole === "coordinator"&&item.name === "My Messages"&&
                      <Badge
                      badgeContent={unreadMsgInfo["totalUnreadCount"]}
                      color="primary"
                      sx={{
                        position: "absolute",
                        top: "10px",
                        right: "20px",
                      }}
                    />
                }
              </ListItem>
            );
          })}
        </List>
      </Drawer>
      <Outlet />
    </Box>
  );
}

export default MiniDrawer;
