import { Typography, Button, Drawer } from "@mui/material"
import NearMeRoundedIcon from '@mui/icons-material/NearMeRounded'
import CallRoundedIcon from '@mui/icons-material/CallRounded'
import { useState, useEffect } from "react"
import OdoReading from "../components/OdoReading"
import {formatDate} from "../utils/utils"
import { useLocation } from "react-router-dom"
import { TRIP_STATUS } from "../constants/string"

function DriverBookingDetails() {

    const [isOpen,setIsOpen] = useState(false)
    const [location, setLocation] = useState({
        latitude: 0,
        longitude: 0
    });
    const { state } = useLocation()
    const date = formatDate(state.pickup_date)

    const handleSubmit = () => {
       setIsOpen(true)
    }

    useEffect(() => {
        navigator.geolocation.getCurrentPosition((props)=> setLocation(
            {
                latitude: props.coords.latitude,
                longitude: props.coords.longitude
            }
        ))
    },[])

    return(
        <div className=' m-2 flex flex-col'>
            <div className=" w-full h-16 bg-boldGrey flex items-center justify-center">
                <Typography fontSize={24} color={"white"}>Booking Details</Typography>
            </div>
            <div>
                <Typography fontSize={32}>Welcome {state.driver_name}</Typography>
                <Typography fontSize={20} color={"grey"}>Find your trip details below</Typography>
                <div className="flex flex-row justify-between mt-2">
                    <Typography fontSize={18}>Date </Typography>
                    <Typography fontSize={16}>{date} {", "} {state.pickup_time} </Typography>
                </div>
                <div className="flex flex-row justify-between">
                    <Typography fontSize={18}>Duration </Typography>
                    <Typography fontSize={16}>{state.total_duration} </Typography>
                </div>
                <div className="flex flex-row justify-between mb-4">
                    <Typography fontSize={18}>Distance </Typography>
                    <Typography fontSize={16}>{state.total_distance}(approximate) </Typography>
                </div>
                <div className="flex flex-row justify-between m-2">
                    <Typography fontSize={24}>Guest List ({state.guests?.length})</Typography>
                    <NearMeRoundedIcon 
                        onClick={()=> window.open(state.navigation_url)} 
                        fontSize="large"
                        sx={{cursor:'pointer'}}
                    >
                    </NearMeRoundedIcon>
                </div>
                {state.guests.map((guest: any)=>(
                    <div className="flex flex-row justify-between m-4">
                        <div className="flex flex-col">
                            <Typography>{guest.name}</Typography>
                            <Typography>{guest.mobile}</Typography>
                        </div>
                        <div>
                            <CallRoundedIcon 
                                fontSize="medium"
                                onClick={()=> window.open(`tel:${guest.mobile}`)}
                                sx={{cursor:'pointer'}}
                            ></CallRoundedIcon>
                        </div>
                    </div>
                ))}
                <div className="flex justify-center m-3">
                    <Button className="w-[70%]" variant='contained' sx={{bgcolor:"#13223d"}} onClick={handleSubmit}>Start Trip</Button>
                    <Drawer
                        anchor={"bottom"}
                        open={isOpen}
                        onClose={()=>setIsOpen(false)}
                    >
                        <OdoReading location={location} data={state} status={TRIP_STATUS.STARTED}/>
                    </Drawer>
                </div>
            </div>
        </div>
    )
}
export default DriverBookingDetails
