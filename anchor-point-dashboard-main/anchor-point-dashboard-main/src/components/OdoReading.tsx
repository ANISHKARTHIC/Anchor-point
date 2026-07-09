import { Typography, Button, TextField, IconButton } from "@mui/material"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom";
import { ROUTE } from '../constants/routes';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { BASE_URL, STRING_ERROR, TRIP_STATUS } from "../constants/string";

function OdoReading(props: any) {

    const [odoValue, setOdoValue] = useState<any>()
    const [odoImage, setOdoImage] = useState<any>()
    const [location, setLocation] = useState(props.location || {
        latitude: 0,
        longitude: 0
    });
    const [disabled,setDisabled] = useState(true);
    const navigate = useNavigate();
    const booking_id = localStorage.getItem("bookingId")
    let url = `${BASE_URL}/drivers/bookings/${booking_id}`

    useEffect(()=>{
        if(location.latitude != 0 && odoValue) setDisabled(false)
    },[odoValue,location])

    const fetchHistory = async (data: any) => {
        try {
            const response = await fetch(`${BASE_URL}/drivers/trips/history?booking_id=${booking_id}`, {
                method: "GET",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + localStorage.getItem("userToken"),
                }
            });
            const result = await response.json();
            if (!response.ok) {
                (response.status != 422 && response.status != 500) ? console.log("Error:",result) : "";
                throw new Error("Error fetching trip history");
            }
            navigate("../"+ROUTE.DRIVER_TRIP, {state: {...data, trip_history: result.trip_history }, replace:true});
        } catch (error) {
            console.log(error)
        }
    }

    const fetchData = async () => {
        try {
            const response = await fetch(url+`?driver_location=${location.latitude},${location.longitude}`, {
                method: "GET",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + localStorage.getItem("userToken"),
                }
            });
            const data = await response.json();
            if (!response.ok) {
                (response.status != 422 && response.status != 500) ? console.log("Error:",data) : "";
                throw new Error("Error fetching driver booking detail");
            }
            fetchHistory(data)
        } catch (error) {
            console.log(error)
        }
    }

    const submitOdoValues = async() => {

        let formdata = new FormData()
        odoImage ? formdata.append('odo_reading_image',odoImage) : ""
        formdata.append('booking_id',String(booking_id))
        formdata.append('odo_reading',odoValue)
        formdata.append('location',`${location.latitude},${location.longitude}`)
        props.status == TRIP_STATUS.COMPLETED ? formdata.append('status',TRIP_STATUS.COMPLETED) : formdata.append('status', TRIP_STATUS.STARTED)

        try {
            const response = await fetch(`${BASE_URL}/drivers/trips`, {
                method: "POST",
                headers: {
                  Authorization: "Bearer " + localStorage.getItem("userToken"),
                },
                body: formdata
            });
            const data = await response.json();
            if (!response.ok) {
                if(response.status == 400) {
                    alert(data.detail)
                }
                (response.status != 422 && response.status != 500) ? console.log("Error:",data) : "";
                throw new Error("Error submitting odometer values");
            }
            props.status == TRIP_STATUS.STARTED ? fetchData() : navigate("../"+ROUTE.DRIVER_TRIP_END, {replace:true});
        } catch (error) {
            console.log(error)
        }
    }

    const handleSubmit = () => {
        if(location.latitude === 0 || !odoValue) return alert("Please enter all the details")
        submitOdoValues()   
    }
    const addOdoImage = (e: any) => {
        setOdoImage(e.target.files[0])
    }

    const getLocation = () => {
        navigator.geolocation.getCurrentPosition((props)=> setLocation(
            {
                latitude: props.coords.latitude,
                longitude: props.coords.longitude
            }
        ))
    }

    return(
        <div className=' m-2 flex flex-col'>
            <Typography className="m-2" fontSize={30}>{props.status == TRIP_STATUS.COMPLETED? "End The Trip" : "Start The Trip"}</Typography>
            <Typography className="m-2" fontSize={20}>Enter Odometer details</Typography>
            <div className="flex justify-center">
                <div className="m-4 outline-dashed w-60 h-32">
                    {
                        !odoImage
                            ? <div className="flex items-center flex-col m-2">
                                <input 
                                    accept="image/*"
                                    id="icon-button-photo"
                                    onChange={addOdoImage}
                                    type="file"
                                    style={{ display: 'none', }}
                                    capture
                                />
                                <label htmlFor="icon-button-photo">
                                    <IconButton size="large" component="span">
                                        <AddRoundedIcon fontSize="large"/>
                                    </IconButton>
                                </label>
                                <Typography>Capture Odometer</Typography>
                            </div>
                            : <div className="flex justify-center">
                                <img className="w-60 h-32" src={URL.createObjectURL(odoImage)} alt="odo meter" />
                            </div>
                    }
                </div>
            </div>
            <TextField 
                type="number" 
                value={odoValue}
                label="Enter the current odometer reading"
                onChange={((e)=>setOdoValue(e.target.value))}
                ></TextField>
            {(location.latitude==0)
            ? <div className="mt-1">
                <Typography fontSize={20}>Add Location</Typography>
                <div className="flex justify-center">
                    <div className="m-4 outline-dashed w-60 h-32">
                        <div className="flex items-center flex-col m-2">
                            <IconButton onClick={getLocation} size="large" component="span">
                                <AddRoundedIcon fontSize="large"/>
                            </IconButton>
                            <Typography>Add Current Location</Typography>
                        </div>
                    </div>
                </div>
            </div>
            : <></>}
            <div className="flex justify-center mt-1">
                <Button 
                    className="w-[70%]" 
                    variant='contained' 
                    sx={{bgcolor:"#13223d"}} 
                    disabled={disabled}
                    onClick={handleSubmit}>{props.status == TRIP_STATUS.COMPLETED? "End Trip" : "Start Trip"}
                </Button>
            </div>
            
        </div>
    )

}

export default OdoReading
