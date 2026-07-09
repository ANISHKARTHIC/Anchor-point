import { useEffect, useState } from "react"
import { Button, Dialog, DialogTitle, TextField, Typography } from '@mui/material';
import { BASE_URL, TRIP_STATUS } from "../constants/string";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from "dayjs";

function ManualTripEnd(props:any) {

    const [tripID,setTripID] = useState<any>()
    const [startodo,setStartodo] = useState<any>(0)
    const [endodo,setEndodo] = useState<any>(0)
    const [startTime,setStartTime] = useState<any>()
    const [endTime,setEndTime] = useState<any>()
    const [totalKms,setTotalKms] = useState<any>(0)
    const [totalHrs,setTotalHrs] = useState<any>()    
    const [isComplete,setIsComplete] = useState(false)
    const [dialogOpen,setDialogOpen] = useState(false)

    const fetchData = async() => {
        try{
        const response = await fetch(`${BASE_URL}/bookings/${props?.state?.id}/trips`, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: "Bearer " + localStorage.getItem("userToken"),
            },
        });
        const bookdata = await response.json()
        if(bookdata?.id) {
            setTripID(bookdata?.id)
            setStartodo(bookdata?.starting_odo)
            setEndodo(bookdata?.ending_odo)
            setStartTime(bookdata?.starting_time ? dayjs(bookdata?.starting_time) : null)
            setEndTime(bookdata?.ending_time ? dayjs(bookdata?.ending_time) : null)
        }
        } catch(error) {
            console.log(error)
        }
    }
    useEffect(()=>{
        fetchData()
    },[])

    useEffect(()=>{
        if(startodo < endodo && startodo > 0 && endodo > 0) {
            setTotalKms((endodo - startodo).toFixed(2))
        } else {
            setTotalKms(0)
        }
    },[startodo,endodo])

    useEffect(()=>{
        if(startTime < endTime) {
            let h = Math.floor((endTime-startTime)/1000/60/60);
            let m = Math.floor(((endTime-startTime)/1000/60/60 - h)*60);
            setTotalHrs(`${h}:${m}`)
        } else {
            setTotalHrs("")
        }
    },[startTime,endTime])

    const handleTripEnd = async() => {

        const response = await fetch(`${BASE_URL}/vendors/trips`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: "Bearer " + localStorage.getItem("userToken"),
            },
            body: JSON.stringify({
                booking_id: props?.state?.id,
                starting_odo: startodo,
                ending_odo: endodo,
                starting_time: startTime.format(),
                ending_time: endTime.format(),
            })
        })
        const data = await response.json()
        if(!response.ok) {
            (response.status != 422 && response.status != 500) ? console.log("Error:",data) : "";
            throw new Error("Error ending trip manually");
        }
        setTripID(data?.trip?.id)
        setIsComplete(true)
        setDialogOpen(false)
    }

    const handleTripUpdate = async() => {
        const response = await fetch(`${BASE_URL}/vendors/trips/${tripID}`, {
            method: "PUT",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: "Bearer " + localStorage.getItem("userToken"),
            },
            body: JSON.stringify({
                booking_id: props?.state?.id,
                starting_odo: startodo,
                ending_odo: endodo,
                starting_time: startTime.format(),
                ending_time: endTime.format(),
            })
        })
        const data = await response.json()
        if(!response.ok) {
            (response.status != 422 && response.status != 500) ? console.log("Error:",data) : "";
            throw new Error("Error updating trip details");
        }
        setIsComplete(true)
        setDialogOpen(false)
    }

    return (
        <div className=" flex flex-col items-center justify-center">
             <div className='m-6'>
                <Typography  align="center" fontSize={18} color={"indianred"}>
                    {!tripID 
                        ? "*The trip has not yet ended through driver. Do you want to end it manually?"
                        : "Update trip readings if applicable."
                    }
                </Typography>
            </div>
            <div className='flex-col justify-center items-center w-1/3'>
                <div className='flex flex-row justify-between items-center mb-5'>
                    <Typography>Starting ODO Value</Typography>
                    <TextField
                        id="startodo"
                        type="number"
                        variant="standard"
                        value={startodo}
                        className="w-32"
                        inputProps={{style: { textAlign: 'right' }, min:0}}
                        onChange={(e:any) => setStartodo(parseFloat(e.target.value))}
                    />
                </div>
                <div className='flex flex-row justify-between items-center mb-5'>
                    <Typography>Ending ODO Value</Typography>
                    <TextField
                        id="endodo"
                        type="number"
                        variant="standard"
                        value={endodo}
                        className="w-32"
                        inputProps={{style: { textAlign: 'right' }, min:0}}
                        onChange={(e:any) => setEndodo(parseFloat(e.target.value))}
                        error={startodo > endodo}
                        helperText={startodo > endodo ? "Ending odo value should be greater than starting odo value" : ""}
                    />
                </div>
                <div className='flex flex-row justify-between items-center mb-5'>
                    <Typography>Trip Start Time</Typography>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DateTimePicker
                            ampm={false}
                            value={startTime}
                            minDate={dayjs(props?.state?.pickup_date,'DD-MM-YYYY')}
                            format="DD-MM-YYYY HH:mm"
                            onChange={(date:any) => setStartTime(date)}
                        />
                    </LocalizationProvider>
                </div>
                <div className='flex flex-row justify-between items-center mb-5'>
                    <Typography>Trip End Time</Typography>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DateTimePicker
                            ampm={false}
                            value={endTime}
                            format="DD-MM-YYYY HH:mm"
                            minDateTime={startTime}
                            slotProps={{
                                textField: {
                                  error: startTime > endTime,
                                  helperText: startTime > endTime ? "End time should be greater than start time" : "",
                                },
                              }}
                            onChange={(date:any) => setEndTime(date)}
                        />
                    </LocalizationProvider>
                </div>
                <div className='flex flex-row justify-end items-center gap-5 mb-5'>
                    {totalKms != 0 && <div className='flex flex-col justify-between items-center mb-5'>
                        <Typography>Total Kms</Typography>
                        <span>{totalKms}</span>
                    </div>}
                    {totalHrs && <div className='flex flex-col justify-between items-center mb-5'>
                        <Typography>Total Hrs</Typography>
                        <span>{totalHrs}</span>
                    </div>}
                </div>
                <div className='flex justify-center m-6'>
                    <Button variant="contained" sx={{bgcolor:"#02ca72"}} disabled={isComplete || !totalHrs || !totalKms} onClick={()=>setDialogOpen(true)}>{!tripID ? "End Trip" : "Update trip details"}</Button>
                    <Dialog onClose={()=>setDialogOpen(false)} open={dialogOpen}>
                        <DialogTitle>Please review the entered values before submitting</DialogTitle>
                        <div className="flex flex-col justify-center items-center">
                            <span>Total Kilometers Entered : {totalKms}</span>
                            <span>Total Hours Entered : {totalHrs}</span>
                        </div>
                        <div className="flex justify-center items-center">
                            <Button variant="contained" color="inherit" sx={{m:2}} onClick= {()=>setDialogOpen(false)}>Cancel</Button>
                            <Button variant="contained" color="success" sx={{m:2}} onClick= {!tripID ? handleTripEnd : handleTripUpdate}>Proceed</Button>
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    )
}

export default ManualTripEnd
