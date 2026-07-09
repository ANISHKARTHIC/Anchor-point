import { Box, Button, IconButton, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { AddCircle, Close } from "@mui/icons-material";
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import Toast from "./Toast";
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import { BASE_URL } from "../constants/string";

const HotelVendorInvoice = (props:any) => {

    const [description,setDescription] = useState("")
    const [proofs,setProofs] = useState<any>([])
    const [deletedFiles,setDeletedFiles] = useState<any>([])
    const [alertMsg,setAlertMsg] = useState("")
    const [proofError,setProofError] = useState(false)
    const [alertType,setAlertType] = useState("")
    const [loading,setLoading] = useState(false)
    const [edit,setEdit] = useState(false)
    const isVendor = localStorage.getItem("isVendor")
    const MAX_FILE_SIZE = 5 * 1000 * 1024

    const handleProofAdd = ()=>{
        proofs.length < 3 ? setProofs([...proofs,null]) : ""
    }

    const handleUpload = async() => {
        try{
            setLoading(true)
            let formdata = new FormData()
            formdata.append('booking_id',props?.bookingId)
            description ? formdata.append('description',description) : ""
            deletedFiles.length != 0 ? formdata.append('deleted_files',JSON.stringify(deletedFiles)) : ""
            if(proofs.length != 0) proofs.map((proof:any)=> proof && !proof?.url ? formdata.append('documents',proof) : null )
                
            const response = await fetch(`${BASE_URL}/hotel_bookings/vendor_invoice`, {
                method: "POST",
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("userToken"),
                  },
                body: formdata
            })
            const data = await response.json()
            if(!response.ok) {
                (response.status != 422 && response.status != 500) ? console.log("Error:",data) : "";
                throw new Error("Error uploading invoice");
            }
            setAlertType("success")
            setAlertMsg(data.message)
            setTimeout(() => {
                setAlertMsg("")
            }, 3000);
            setEdit(true)
            setLoading(false)
        } catch(error) {
            setAlertType("error")
            setAlertMsg("Error uploading invoice")
            setTimeout(() => {
                setAlertMsg("")
            }, 3000);
            setLoading(false)
            console.log(error)
        }
    }

    useEffect(()=>{
        try {
            const fetchData = async()=>{
              const dataResp = await fetch(`${BASE_URL}/hotel_bookings/${props?.bookingId}/vendor_invoice`, {
                method: "GET",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + localStorage.getItem("userToken"),
                },
              });
              const invoiceData = await dataResp.json()
              setDescription(invoiceData?.description || "")
              setProofs(invoiceData?.documents || [])
              invoiceData?.documents ? setEdit(true) : ""
            }
            fetchData()
          } catch(error) {
            console.log(error)
          }
    },[])

    return(
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
                        ? "* Upload hotel invoice documents and invoice breakdown"
                        : "* Upload invoice documents and invoice breakdown"
                    }
                </Typography>
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
                    <Typography fontSize={18}>Add Invoice Documents</Typography>
                    <IconButton
                        color="info"
                        onClick={handleProofAdd}
                        >
                    <AddCircle />
                    </IconButton>
                </div>
                <div className="flex flex-col items-center justify-between m-2">
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
                                    <Typography>Invoice {index+1}</Typography>
                                </div>
                                : <div className="flex items-center justify-between">
                                    <img className="w-20 h-10" src={proof.url ? "" :URL.createObjectURL(proof)} alt="invoice" />
                                    <Typography>{proof.name}</Typography>
                                    <IconButton onClick={()=>{
                                        const temp = [...proofs]
                                        temp.splice(index,1)
                                        setProofs(temp)
                                        edit ? setDeletedFiles([...deletedFiles,proof.name]) : ""
                                    }}><Close/></IconButton>
                                    {proof.url && <a 
                                        href={proof.url}
                                        target="_blank"
                                        download
                                    >
                                        <IconButton color="info"><DownloadRoundedIcon/></IconButton>
                                    </a>}
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
                <Button variant="contained" sx={{bgcolor:"#02ca72"}} disabled={!proofs[0] || loading} onClick={handleUpload}>{edit ? "Update Invoice" :"Upload Invoice"}</Button>
            </div>
        </Box>
        </div>
    )
}

export default HotelVendorInvoice;
