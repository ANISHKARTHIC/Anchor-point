import React from "react";
import circle from "../assets/pointCircle.svg";
import favIcon from "../assets/favicon.ico.svg";
import settings from "../assets/settings.svg";
// @ts-ignore
import Apps from "../assets/apps.svg?react";
import { Link } from "react-router-dom";
import tickSquare from "../assets/tickSquare.svg";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { Typography } from "@mui/material";
import { ROUTE } from "../constants/routes";
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';

type Anchor = "top" | "left" | "bottom" | "right";

function SideBar({ state, setState, toggleDrawer }: any) {
  const [currentActiveMenu, setCurrentActiveMenu] = React.useState<number>(0)

  const menuListItemProps = (value: number) => ({
    selected: currentActiveMenu === value,
    onClick: () => setCurrentActiveMenu(value),
    sx: {
      minHeight: 48,
      justifyContent: "center",
      px: 2.5,
      borderRadius: "4px",
      margin: "0px 13px 6px 13px",
    },
  });
  const isVendor = localStorage.getItem("isVendor");
  const list = (anchor: Anchor) => (
    <Box
      sx={{
        width: anchor === "top" || anchor === "bottom" ? "auto" : 250,
        padding: "0px 20px",
        position: "relative",
        height: "100vh",
      }}
      role="presentation"
      onClick={toggleDrawer(anchor, false)}
      onKeyDown={toggleDrawer(anchor, false)}
    >
      <div className="flex items-center text-black ml-4 py-[13px] md:py-[17px]">
        <img src={favIcon} alt="anchor-logo" width="15px" className="mx-2" />
        <div className="mt-[5px]   flex">
          <Typography>ANCHORP</Typography>
          <img src={circle} className="w-4" />
          <Typography>INT</Typography>
        </div>
      </div>
      <Divider />
      <div className="pt-6 pb-2 px-3 text-xs font-bold text-boldGrey">MENU</div>
      <nav aria-label="main menu list" className="position-relative h-">
        <List>
          {isVendor=="false"
          ?<ListItem disablePadding sx={{ ml: -1, mb: 0.5 }}>
            <ListItemButton
              {...menuListItemProps(0)}
              href={ROUTE.HOME}
            >
              <ListItemIcon>
                <Apps className="[&>path]:fill-tertiary [&>path]:stroke-tertiary" />
              </ListItemIcon>
              <ListItemText
                primary="Dashboard"
                className="text-sm font-medium text-tertiary"
                sx={{ ml: -2 }}
              />
            </ListItemButton>
          </ListItem>
          :<></>}
          <ListItem disablePadding sx={{ ml: -1, mb: 0.5 }}>
            <Link to={ROUTE.TASKS}>
              <ListItemButton
                {...menuListItemProps(1)}
              >
                <ListItemIcon>
                  <img src={tickSquare} alt="tick-square" />
                </ListItemIcon>
                <ListItemText
                  primary="My Tasks"
                  className="text-sm font-medium text-[#64748B]"
                  sx={{ ml: -2 }}
                />
              </ListItemButton>
            </Link>
          </ListItem>
          <ListItem>
            <ListItemButton {...menuListItemProps(2)} href={ROUTE.PASTBOOKINGS}>
              <ListItemIcon>
              <HistoryRoundedIcon/>
              </ListItemIcon>
              <ListItemText
                primary="Past Bookings"
                className="text-sm font-medium text-[#64748B]"
                sx={{ ml: -2 }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </nav>
      <nav className="absolute bottom-0">
        <List>
          <ListItem disablePadding sx={{ ml: -1, mb: 0.5 }}>
            <ListItemButton sx={{ borderRadius: "12px" }}>
              <ListItemIcon>
                <img src={settings} alt="settings" />
              </ListItemIcon>
              <ListItemText
                primary="Settings"
                className="text-sm font-medium text-tertiary"
                sx={{ ml: -2 }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </nav>
    </Box>
  );

  return (
    <div>
      {(["left"] as const).map((anchor) => (
        <React.Fragment key={anchor}>
          <Drawer
            anchor={anchor}
            open={state[anchor]}
            onClose={toggleDrawer(anchor, false)}
          >
            {list(anchor)}
          </Drawer>
        </React.Fragment>
      ))}
    </div>
  );
}

export default SideBar;
