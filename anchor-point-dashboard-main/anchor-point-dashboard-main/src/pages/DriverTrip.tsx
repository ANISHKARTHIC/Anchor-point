import { useLocation } from "react-router-dom";
import { Typography, Button, Drawer } from "@mui/material"
import HailRoundedIcon from '@mui/icons-material/HailRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import { useEffect, useState } from "react";
import EndTrip from "../components/EndTrip";
import MapImg from "../components/MapImg";
import OdoReading from "../components/OdoReading"
import { BASE_URL, STRING_ERROR, TRIP_STATUS } from "../constants/string";

function DriverTrip() {
    const { state } = useLocation()
    const [guestDroped, setGuestDropped] = useState(
        state.trip_history
            ? state.guests.map(({booking_log_id}:any)=>(
                {[booking_log_id]: (state.trip_history.findIndex((obj: any)=> obj.metadata.booking_log_id == booking_log_id && obj.event=="dropped") != -1) ? true: false}))
            : state.guests.map(({booking_log_id}:any)=>({[booking_log_id]: false}))
        )
    const [guestPicked, setGuestPicked] = useState(
        state.trip_history
            ? state.guests.map(({booking_log_id}:any)=>(
                {[booking_log_id]: (state.trip_history.findIndex((obj: any)=> obj.metadata.booking_log_id == booking_log_id && obj.event=="picked") != -1) ? true: false}))
            : state.guests.map(({booking_log_id}:any)=>({[booking_log_id]: false}))
        )
    const [endTrip, setEndTrip] = useState(false)
    const [isOpen,setIsOpen] = useState(false)
    const [isOdoOpen,setIsOdoOpen] = useState(false)
    const [location, setLocation] = useState({
        latitude: 0,
        longitude: 0
    });
    const [currDropped,setCurDropped] = useState();

    const bookingId = localStorage.getItem("bookingId");

    const createMapRoute = ()=>{
        let arr = state.optimal_route.map((obj:any)=>(
            {
                ...obj,
                coordinate: { 
                    lat:parseFloat(obj.coordinate.split(',')[0]),
                    lng:parseFloat(obj.coordinate.split(',')[1])
                }
            }))
        
        return arr
    }
    let mapRouteCoord = createMapRoute()

    useEffect(()=>{
        setEndTrip(guestDroped.map((guest: any)=>(Object.values(guest)[0])).every(Boolean))
    },[guestDroped])

    useEffect(()=>{
        navigator.geolocation.getCurrentPosition((props)=> setLocation(
            {
                latitude: props.coords.latitude,
                longitude: props.coords.longitude
            }
        ))
    },[guestPicked])

    const sendPickupDetails = async (id: any) => {
        let guest = state.guests.find((obj: any) => obj.booking_log_id == id)
        let formdata = new FormData()
        formdata.append('booking_log_id',guest.booking_log_id)
        formdata.append('guest_name',guest.name)
        formdata.append('booking_id',bookingId)
        formdata.append('location',`${location.latitude},${location.longitude}`)
        formdata.append('status',"picked")
        try {
            const response = await fetch(`${BASE_URL}/drivers/trips/status`, {
                method: "POST",
                headers: {
                  Authorization: "Bearer " + localStorage.getItem("userToken"),
                },
                body: formdata
            });
            const data = await response.json();
            if (!response.ok) {
                (response.status != 422 && response.status != 500) ? console.log("Error:",data) : "";
                throw new Error("Error adding pickup details");
            }
            let gp = guestPicked.map((guest: any,index: number)=>(
                (Object.keys(guestPicked[index])==id)? {[id]: true}: guest
            ))
            setGuestPicked(gp)
        } catch (error) {
            console.log(error)
        }
    }
    

    const handleDrop = (e: any) => {
        setCurDropped(e.target.id)
        setIsOpen(true);
    }

    const handlePick = (e: any) => {
        sendPickupDetails(e.target.id)
    }

    const onEnd = (id:any) =>{
        let gd = guestDroped.map((guest: any,index: number)=>(
            (Object.keys(guestDroped[index])==id)? {[id]: true}: guest
        ))
        setGuestDropped(gd)
        setIsOpen(false)
    }

    return(
        <div className=" flex flex-col">
            <div className="flex items-center justify-center mb-1 ">
                <MapImg route={mapRouteCoord} state={state}></MapImg>
            </div>
            {state.guests.map((guest: any, index: number)=>(
                    <div className="flex flex-row justify-between m-3">
                        <div className="flex flex-col">
                            <Typography>{guest.name}</Typography>
                            <Typography>{guest.mobile}</Typography>
                        </div>
                        <div>
                            {!(Object.keys(guestPicked[index])[0]==guest.booking_log_id && Object.values(guestPicked[index])[0] )
                                ? <Button 
                                    id={guest.booking_log_id} 
                                    variant="contained" 
                                    sx={{bgcolor:'#81eb6a'}} 
                                    onClick={handlePick}>
                                        <HailRoundedIcon/>Picked
                                    </Button>
                                : <div>
                                    <Button 
                                        id={guest.booking_log_id} 
                                        disabled={(Object.values(guestDroped[index])[0])? true: false} 
                                        variant="contained" 
                                        sx={{bgcolor:'#ed6464'}} 
                                        onClick={handleDrop} >
                                            <TaskAltRoundedIcon/>Dropped
                                    </Button>
                                    <Drawer
                                        anchor={"bottom"}
                                        open={isOpen}
                                        onClose={()=>setIsOpen(false)}
                                    >
                                        <EndTrip id={currDropped} onEnd={onEnd} guests={state.guests} />
                                    </Drawer>
                                </div>
                            }
                        </div>
                    </div>
                ))}
            <div className="flex justify-center items-center mt-5">
                {endTrip 
                && <Button 
                    variant="contained" 
                    sx={{bgcolor:"green"}} 
                    onClick={()=>setIsOdoOpen(true)}>
                        End Trip
                    </Button>
                    }
                <Drawer
                    anchor={"bottom"}
                    open={isOdoOpen}
                    onClose={()=>setIsOdoOpen(false)}
                >
                    <OdoReading location={location} status={TRIP_STATUS.COMPLETED} />
                </Drawer>
            </div>
        </div>
    )
}

export default DriverTrip
