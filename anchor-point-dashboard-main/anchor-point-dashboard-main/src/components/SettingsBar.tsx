import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';

export default function SettingsBar(props:any) {
  return (
    <div className="m-5">
      <Box
        sx={{
          width: 300,
          height: "auto",
          maxWidth: 360,
          bgcolor: "white",
          borderWidth: 1,
          paddingBottom: 5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "lightgray",
            padding: 2,
          }}
        >
          <div className="text-base font-bold">{"Settings"}</div>
        </Box>
        <Box sx={{ overflowY: "auto", maxHeight: 450 }}>
          <List>
            <ListItem
              disablePadding
              secondaryAction={
                <IconButton aria-label="comment">
                  <LocationCityIcon />
                </IconButton>
              }
            >
              <ListItemButton onClick={()=>props.setSettingToBeDisplayed(0)}>
                <ListItemText primary={"City"} />
              </ListItemButton>
            </ListItem>
            <ListItem
              disablePadding
              secondaryAction={
                <IconButton aria-label="comment">
                  <LocalTaxiIcon />
                </IconButton>
              }
            >
              <ListItemButton onClick={()=>props.setSettingToBeDisplayed(1)}>
                <ListItemText primary={"Vehicle Model"} />
              </ListItemButton>
            </ListItem>
            <ListItem
              disablePadding
              secondaryAction={
                <IconButton aria-label="comment">
                  <CorporateFareIcon />
                </IconButton>
              }
            >
              <ListItemButton onClick={()=>props.setSettingToBeDisplayed(2)}>
                <ListItemText primary={"Cost Center"} />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Box>
    </div>
  );
}
