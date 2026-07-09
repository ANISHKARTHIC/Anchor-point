import { useEffect, useState } from "react"
import { Box, Button, FormControl, IconButton, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import { BASE_URL } from "../constants/string";
import Toast from "./Toast";
import { AddCircle, Close } from "@mui/icons-material";
import AddRoundedIcon from '@mui/icons-material/AddRounded';

function ConfirmBooking(props:any) {

    const [selectedVendor,setSelectedVendor] = useState()
    const [proofs,setProofs] = useState<any>([])
    const [vendors,setVendors] = useState([])
    const [code,setCode] = useState()  
    const [description,setDescription] = useState()  
    const isVendor = localStorage.getItem("isVendor")
    const userID = localStorage.getItem("userID")
    const userName = localStorage.getItem("userName")
    const [alertMsg,setAlertMsg] = useState("")
    const [proofError,setProofError] = useState(false)
    const [alertType,setAlertType] = useState("")
    const MAX_FILE_SIZE = 5 * 1000 * 1024

    useEffect(()=>{
        const fetchVendors = async() => {
            try{
                const response = await fetch(`${BASE_URL}/vendors/?vendor_type=hotel&city=${props?.state?.city}`, {
                    method: "GET",
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("userToken"),
                    },
                })
                const data = await response.json()
                if(!response.ok) {
                    (response.status != 422 && response.status != 500) ? console.log("Error:",data) : "";
                    throw new Error("Error fetching vendors");
                }
                setVendors(data.vendors)
            } catch(error:any) {
                console.log(error)
            }
        }
        isVendor == "false" ? fetchVendors() : ""
    },[])

    const handleCode = (e: any) => {
        setCode(e.target.value)
    }

    const handleProofAdd = ()=>{
        proofs.length < 1 ? setProofs([...proofs,null]) : ""
    }

    const handleConfirm = async() => {
        try{
        const vendorInfo = vendors.find((item:any)=> item.id == selectedVendor)
        const metadata = isVendor == "false" ? { 
            vendor_id: vendorInfo?.id, 
            vendor_name: vendorInfo?.name, 
            confirmation_no: code, 
            description: description,
            organizer_id: userID,
            organizer_name: userName,
            role: "organizer",
        } : { 
            vendor_id: localStorage.getItem("userID"), 
            vendor_name: localStorage.getItem("userName"), 
            confirmation_no: code, 
            description: description,
            role: "vendor",
        } 

        let formdata = new FormData()
        formdata.append('status',"confirmed")
        formdata.append('booking_id',props?.state?.id)
        formdata.append('metadata',JSON.stringify(metadata))
        if(proofs.length != 0) proofs.map((proof:any)=> proof ? formdata.append('confirmation_attachment',proof) : null )

        const response = await fetch(`${BASE_URL}/hotel_bookings/confirm`, {
            method: "POST",
            headers: {
                Authorization: "Bearer " + localStorage.getItem("userToken"),
              },
            body: formdata
        })
        const data = await response.json()
        setAlertType("success")
        setAlertMsg(data.message)
        setTimeout(() => {
            setAlertMsg("")
        }, 3000);
        if(!response.ok) {
            (response.status != 422 && response.status != 500) ? console.log("Error:",data) : "";
            throw new Error("Error confirming request");
        }
        props.setIsComplete(true)
    } catch(error) {
        setAlertType("error")
        setAlertMsg("Error confirming request")
        setTimeout(() => {
            setAlertMsg("")
        }, 3000);
        console.log(error)
    }
    }

    return (
        <div className=" flex flex-col items-center justify-center">
            <div className='mb-5 items-end justify-end'>
                {alertMsg && <Toast message={alertMsg} toastType={alertType} />}
            </div>
            <Box
                width={500}
            >
             <div className='m-6'>
                <Typography  align="center" fontSize={18} color={"indianred"}>
                    {isVendor == "false" 
                        ? "* Please enter the details only after receiving confirmation from the Hotel"
                        : "* Please enter the details for confirmation"
                    }
                </Typography>
            </div>
            <div className='flex-col justify-center items-center'>
                {isVendor == "false" ? <div className='flex flex-row justify-between items-center mb-5'>
                    <Typography>Hotel</Typography>
                    <FormControl size="small" sx={{ minWidth: 250 }}>
                        <InputLabel id="package_label">{"Select Hotel"}</InputLabel>
                        <Select
                        id="package_label"
                        value={selectedVendor}
                        label={"Select Hotel"}
                        onChange={(e: any) => setSelectedVendor(e.target.value)}
                        >
                        <MenuItem value="">{"None"}</MenuItem>
                        {vendors.map((item:any, index:number) => (
                            <MenuItem key={index} value={item["id"]}>
                            {item["name"]}
                            </MenuItem>
                        ))}
                        </Select>
                    </FormControl>
                </div> : ""}
                <div className='flex flex-row justify-between items-center mb-5'>
                    <Typography>Confirmation code</Typography>
                    <TextField
                        id="code"
                        value={code}
                        sx={{ minWidth: 250 }}
                        inputProps={{style: { textAlign: 'right' }, min:0}}
                        onChange={handleCode}
                    />
                </div>
                <div className='flex flex-row justify-between items-center mb-5'>
                    <Typography>Description</Typography>
                    <TextField 
                        multiline 
                        maxRows={Infinity} 
                        rows={4}  
                        className="w-80"
                        label="Description (optional)"
                        value={description}
                        onChange={(e:any)=>setDescription(e.target.value)}
                    />
                </div>
                <div>
                    <div className="flex flex-row justify-center items-center m-5">
                        <Typography fontSize={18}>Add Supporting Documents (Optional) </Typography>
                        <IconButton
                            color="info"
                            onClick={handleProofAdd}
                            >
                        <AddCircle />
                        </IconButton>
                    </div>
                    <div className="flex flex-col items-center justify-between  m-2">
                        {proofs &&
                            proofs.map((proof:any,index:number) => (
                                <div className="m-4 w-80 h-10">
                                {
                                    !proof
                                    ? <div className="flex justify-center items-center flex-row">
                                        <input 
                                            accept="image/*,application/pdf"
                                            id="icon-button-photo"
                                            onChange={(e:any)=>{
                                                if (e.target.files && e.target.files[0]) {
                                                    if (e.target.files[0].size > MAX_FILE_SIZE) {
                                                      setProofError(true)
                                                      return false;
                                                    }
                                                    const temp = [...proofs]
                                                    temp[index] = e.target.files[0]
                                                    setProofs(temp)
                                                    setProofError(false)
                                                }
                                            }}
                                            type="file"
                                            style={{ display: 'none', }}
                                            capture
                                        />
                                        <label htmlFor="icon-button-photo">
                                            <IconButton component="span">
                                                <AddRoundedIcon fontSize="large"/>
                                            </IconButton>
                                        </label>
                                        <Typography>Proof {index+1}</Typography>
                                    </div>
                                    : <div className="flex justify-between">
                                        <img className="w-20 h-10" src={URL.createObjectURL(proof)} alt="proof" />
                                        <Typography>{proof.name}</Typography>
                                        <IconButton onClick={()=>{
                                            const temp = [...proofs]
                                            temp.splice(index,1)
                                            setProofs(temp)
                                        }}><Close/></IconButton>
                                    </div>
                                }
                                </div>
                            ))
                        }
                    </div>
                </div>
                {proofError && <div className="flex justify-center items-center m-5">
                    <Typography color={"indianred"}>*Maximum file size of 5 MB is allowed</Typography>
                </div>}
                <div className='flex justify-center m-6'>
                    <Button variant="contained" sx={{bgcolor:"#02ca72"}} disabled={props.isComplete || (isVendor == "false" && !selectedVendor) || !code} onClick={handleConfirm}>Confirm the booking</Button>
                </div>
            </div>
            </Box>
        </div>
    )
}

export default ConfirmBooking
