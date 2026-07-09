import { MuiOtpInput } from 'mui-one-time-password-input';
import Typography from "@mui/material/Typography";
import circle from "../assets/pointCircle.svg";
import { Button, Alert } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ROUTE } from '../constants/routes';
import { BASE_URL, STRING_ALERT, STRING_ERROR, TRIP_STATUS } from "../constants/string";

function DriverLogin() {

    const [otp, setOtp] = useState("");
    const [location, setLocation] = useState({
        latitude: 0,
        longitude: 0
    });
    const [error,setError] = useState("")

    const navigate = useNavigate();
    const { booking_id }= useParams();
    localStorage.setItem("bookingId",booking_id || "")
    let url = `${BASE_URL}/drivers/bookings/${booking_id}`

    useEffect(() => {
        navigator.geolocation.getCurrentPosition((props)=> setLocation(
            {
                latitude: props.coords.latitude,
                longitude: props.coords.longitude
            }
        ))
    },[otp])

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
                (response.status != 422 && response.status != 500) ? console.log("Error:",data) : "";
                throw new Error("Error fetching trip history");
            }
            (result.trip_history.findIndex((obj: any)=> obj.event == TRIP_STATUS.COMPLETED) != -1) 
                ? navigate("../"+ROUTE.DRIVER_TRIP_END, {replace:true})
                : (result.trip_history.findIndex((obj: any)=> obj.event == TRIP_STATUS.STARTED) != -1) 
                    ? navigate("../"+ROUTE.DRIVER_TRIP, {state: { ...data, trip_history: result.trip_history }, replace:true})
                    : navigate("../"+ROUTE.DRIVER_BOOKING_DETAILS, {state: data, replace:true})
        } catch (error) {
            console.log(error)
        }
    }

    const fetchData =async () => {
        if(location.latitude == 0) return alert("Location Permission is Mandatory for Providing Optimal Route.\nPlease Turn on Location Services to Allow Anchor Point to Determine Your Location by Clicking the Location Icon in the Address Bar, and then Click on Always Allow.")
        try {
            url = url + `?driver_location=${location.latitude},${location.longitude}`
            const response = await fetch(url, {
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
                throw new Error("Error fetching driver booking details");
            }
            fetchHistory(data);
        } catch (error) {
            console.log(error)
        }
    }

    const handleSubmit = async() => {
        try {
            const response = await fetch(`${BASE_URL}/drivers/login/${booking_id}?otp=${otp}`, {
                method: "POST",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                }
            });
            const data = await response.json();
            if (!response.ok) {
                if(response.status == 403) {
                    setError(data.detail)
                }
                (response.status != 422 && response.status != 500) ? console.log("Error:",data) : "";
                throw new Error("Error while login");
            }
            localStorage.setItem("userToken",data.access_token)
            fetchData()
        } catch (error) {
            console.log(error)
        }
    }


    return (
        <div className=' m-2 w-screen min-h-screen'>
            <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>
                <div className=' flex flex-col items-center'>
                <div className='mb-5 items-center justify-center'>
                    {error && <Alert severity="error">
                        <p>
                            {error} - {STRING_ALERT.CHECK}
                        </p>
                    </Alert>}
                </div>
                <div className=' mb-10 flex flex-row'>
                    
                    <Typography fontSize={40} className=' font-extrabold'>ANCHORP</Typography>
                    <img width={"40"} height={"40"} src={circle} />
                    <Typography fontSize={40}>INT</Typography>
                </div>
                <div>
                    <Typography fontSize={30}>Enter OTP</Typography>
                    <MuiOtpInput inputMode='numeric' TextFieldsProps={{
                        type: 'number',
                        inputProps: {
                            inputMode: 'numeric',
                            pattern: '[0-9]*',
                        },
                        size: 'medium',
                    }} length={5} gap={2} value={otp} onChange={(val)=> setOtp(val)}></MuiOtpInput>
                </div>
                <div className=' mt-8'>
                    <Button variant='contained' color='primary' onClick={handleSubmit}>Submit</Button>
                </div>
                </div>
            </div>
        </div>
    )
}
export default DriverLogin
