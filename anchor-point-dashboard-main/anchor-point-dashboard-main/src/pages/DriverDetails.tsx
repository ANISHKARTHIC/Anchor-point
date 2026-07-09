import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../store/store";
import { driverDetailsRequest } from "../store/features/driverSlice";
import { useLocation, useNavigate } from "react-router-dom";
import { TextField, Button, InputAdornment, Backdrop, Typography, CircularProgress} from '@mui/material';
import Arrow from "../assets/arrowRight.svg?react";
import {BOOKING_STATUS, STRING_ERROR, BASE_URL} from '../constants/string.ts';
import { ROUTE } from "../constants/routes.ts";
import PhoneWithCountryCode from "../components/PhoneWithCountryCode.tsx";

function DriverDetails() {

    const { state } = useLocation()
    const [driver_name, setDriverName] = useState("");
    const [primary_number, setPrimaryNumber] = useState("");
    const [secondary_number, setSecondaryNumber] = useState("");
    const [cab_number, setCabNumber] = useState("");
    const [priError, setPriError] = useState(false);
    const [secError, setSecError] = useState(false);
    const [progress, setProgress] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { driver } = useSelector((state: any) => state.driver);
    const pattern = new RegExp(/^\d{1,10}$/);
    // const cab_pattern = new RegExp(/^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/)

    useEffect(() => {
        const bookingId = state.id;
        dispatch(driverDetailsRequest({bookingId}));
        setDriverName(driver?.name);
        setPrimaryNumber(driver?.primary_mobile);
        setSecondaryNumber(driver?.secondary_mobile);
        setCabNumber(driver?.vehicle_no);
    }, []);

    const assignDriver = async() => {
        try{
            setProgress(true)
            let body = {
                name: driver_name.trim().replace(/\s+/g, ' '),
                vehicle_no: cab_number.trim(),
                primary_mobile: primary_number?.replaceAll(/\s/g,''),
                action:"assign"
            }
            const response = await fetch(
                `${BASE_URL}/vendors/bookings/${state.id}/drivers`,
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + localStorage.getItem("userToken"),
                    },
                    body: JSON.stringify(secondary_number
                        ? {...body, 
                            secondary_mobile: secondary_number?.replaceAll(/\s/g,''),} 
                        : body)
                }
            )
            const data = await response.json();
            if (!response.ok) {
                (response.status != 422 && response.status != 500) ? console.log("Error:",data) : "";
                throw new Error("Error adding driver details");
            }
            data ? setProgress(false) : "";
              navigate(`../${ROUTE.BOOKING}/${state?.bid}`,{state: {...state, status:BOOKING_STATUS.DRIVER_ASSIGNED},});
            return data;
        } catch(err) {
            console.log(err);
        }
    }

    const reAssignDriver = async() => {
        try{
            setProgress(true)
            let body = {
                name: driver_name.trim().replace(/\s+/g, ' '),
                vehicle_no: cab_number.trim(),
                primary_mobile: primary_number?.replaceAll(/\s/g,''),
                previous_driver_id: driver.id,
                previous_driver_name: driver.name,
                action:"reassign"
            }
            const response = await fetch(
                `${BASE_URL}/vendors/bookings/${state.id}/drivers`,
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + localStorage.getItem("userToken"),
                    },
                    body: JSON.stringify(secondary_number
                        ? {...body, 
                            secondary_mobile: secondary_number?.replaceAll(/\s/g,''),} 
                        : body)
                }
            )
            const data = await response.json();
            if (!response.ok) {
                (response.status != 422 && response.status != 500) ? console.log("Error:",data) : "";
                throw new Error("Error updating driver details");
            }
            data ? setProgress(false) : ""
              navigate(`../${ROUTE.BOOKING}/${state?.bid}`,{state: {...state, status:BOOKING_STATUS.DRIVER_REASSIGNED}});
            return data;
        } catch(err) {
            setProgress(false)
            console.log(err);
        }
    }

    const handleEdit = async() => {

        if(primary_number?.replaceAll(/\s/g,'') == secondary_number?.replaceAll(/\s/g,'')) { 
            alert("Please provide valid phone number. eg.9876543210. Note that Primary and Secondary number must not be the same.")
            return
        }

        if(state.status == BOOKING_STATUS.VENDOR_ACCEPTED) {
            assignDriver();
        } else if(state.status == BOOKING_STATUS.DRIVER_ASSIGNED || state.status == BOOKING_STATUS.DRIVER_REASSIGNED) {
            reAssignDriver();
        } else {

        }
    }

    const handleCabNo = (e : any) => { 
        setCabNumber(e.target.value)
    }

    return(
        <div className="flex h-screen w-full bg-yellow-50">
            <div className="flex h-full mx-6 my-3 bg-white rounded-xl w-full">
                <div className="flex flex-col mx-7 my-5 w-full">
                    <div className="flex items-center">
                        <Arrow
                            className="[&>path]:stroke-black rotate-180 mr-3"
                            onClick={ () => {
                                navigate(`../${ROUTE.BOOKING}/${state?.bid}`,{state: state, replace:true});
                            }}
                        />
                        <span className="font-normal font-semibold text-base">
                            { `Request from ${state.coordinator?.name} on ${state.pickup_date}`}
                        </span>
                    </div>
                    <div className="m-4 py-5 px-5">
                        <div className="flex items-center">
                            <span className="mb-2 font-semibold text-base">Driver Details</span>
                        </div>
                        <div className="flex flex-row gap-5">
                            <TextField
                                id="driver_name"
                                label="Driver Name"
                                variant="standard"
                                InputProps={{className:"mr-3"}}
                                value={driver_name}
                                onChange={(e)=>setDriverName(e.target.value)}
                            />
                            <div className="flex flex-col">
                                <Typography variant="body2" color={"gray"}>Primary Number</Typography>
                                <PhoneWithCountryCode
                                    phone={primary_number}
                                    setPhone={setPrimaryNumber}
                                    numberError={priError}
                                    setNumberError={setPriError}
                                    isfetchGuest={false}
                                    fetchGuestDetailsByPhone={()=>{}}
                                    isform={false}
                                    setValue={()=>{}}
                                    isDisabled={true}
                                />
                            </div>
                            <div className="flex flex-col">
                                <Typography variant="body2" color={"gray"}>Secondary Number</Typography>
                                <PhoneWithCountryCode
                                    phone={secondary_number}
                                    setPhone={setSecondaryNumber}
                                    numberError={secError}
                                    setNumberError={setSecError}
                                    isfetchGuest={false}
                                    fetchGuestDetailsByPhone={()=>{}}
                                    isform={false}
                                    isDisabled={true}
                                    setValue={()=>{}}
                                />
                            </div>
                        </div>
                        <div className="flex items-center mt-6">
                            <span className="mb-2 font-semibold text-base">Cab Details</span>
                        </div>
                        <div>
                            <TextField
                                id="cab_no"
                                label="Cab number"
                                variant="standard"
                                InputProps={{className:"mr-3"}}
                                value={cab_number}
                                onChange={handleCabNo}
                            />
                        </div>
                        <div className=" mt-9 grid justify-items-center">
                            <div className="ml-6">
                            <Button variant="contained" color="secondary" disabled={!(driver_name && primary_number && cab_number)} sx={{m:2}} onClick= {handleEdit}>Update</Button>
                            </div>
                        </div>
                        <div>
                            <Backdrop
                                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                                open={progress?true:false}
                            >
                                <div className="flex flex-col justify-center items-center">
                                    <Typography>Please wait</Typography>
                                    <CircularProgress color="inherit" />
                                </div>
                            </Backdrop>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default DriverDetails;
