import { Box, Button, Drawer, FormControl, FormControlLabel, IconButton, Radio, RadioGroup, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { BASE_URL } from "../constants/string";
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import EditRoundedIcon from '@mui/icons-material/EditRounded'

function DriverCharges(props:any) {

    const [newModel,setNewModel] = useState([])
    const [driverChargesModel,setDriverChargesModel] = useState("")
    const [driverCharges,setDriverCharges] = useState("")
    const [isDriverOpen,setIsDriverOpen] = useState(false)
    const [existingDriverCharges,setExistingDriverCharges] = useState([])
    const [updatedCharges,setUpdatedCharges] = useState([])
    const [isEdit,setIsEdit] = useState(false)
    const small = window.matchMedia("(max-width: 768px)").matches

    useEffect(()=>{
        const fetchDriverCharges = async(models:any)=>{

            try{
                const driverChargesResponse = await fetch(
                    `${BASE_URL}/drivers/charges?vendor_id=${props.vendorId}`,
                    {
                        method: "GET",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                            Authorization: "Bearer " + localStorage.getItem("userToken"),
                        }
                    }
                )
                const driverChargesData = await driverChargesResponse.json();
                if (!driverChargesResponse.ok) {
                    (driverChargesResponse.status != 422 && driverChargesResponse.status != 500) ? console.log("Error:",driverChargesData) : "";
                    throw new Error("Error fetching driver charges");
                }
                const charges = driverChargesData?.driver_charges
                const chargesModel = charges.map((charge:any)=>{
                    const name = models?.find((model:any)=>model.id==charge.vehicle_model_id)?.name
                    return {...charge, vehicle_model_name: name}
                })
                setExistingDriverCharges(chargesModel)
                setUpdatedCharges(charges)
                const modelIds = chargesModel.map((item:any) => item.vehicle_model_id)
                const newModels = models?.filter((item:any) => !modelIds.includes(item.id))
                setNewModel(newModels)
            } catch (error) {
                console.log(error)
            }
        }

        fetchDriverCharges(props.model)
    },[isDriverOpen,props.vendorId,isEdit])

    useEffect(()=>{
        if(!isDriverOpen){
            setDriverCharges("")
            setDriverChargesModel("")
        }
    },[isDriverOpen])

    const handleCreateDriverCharge = async()=>{
        try{
            const response = await fetch(
                `${BASE_URL}/drivers/charges`,
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + localStorage.getItem("userToken"),
                    },
                    body: JSON.stringify({
                        charge: driverCharges, 
                        vendor_id: props.vendorId, 
                        vehicle_model_id: driverChargesModel 
                    })
                }
            )
            const data = await response.json();
            if (!response.ok) {
                (response.status != 422 && response.status != 500) ? console.log("Error:",data) : "";
                throw new Error("Error creating driver charge");
            }
            setIsDriverOpen(false)
            setDriverCharges("")
            setDriverChargesModel("")
        } catch(err) {
            console.log(err);
        }
    }

    const handleChargeChange = (value:any,i:number)=>{
        const temp = updatedCharges.map((charge:any,index:any)=> (
            index==i 
            ? {...charge, charge: parseInt(value)}
            : charge
        ))
        setUpdatedCharges(temp)
    }

    const handleChargeUpdate = async() => {
        const body = updatedCharges.filter((item:any,index:number)=>item.charge!=existingDriverCharges[index].charge)
        try{
            if (body.length!=0) {
                const response = await fetch(
                    `${BASE_URL}/drivers/charges`,
                    {
                        method: "PUT",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                            Authorization: "Bearer " + localStorage.getItem("userToken"),
                        },
                        body: JSON.stringify({
                            driver_charges: body
                        })
                    }
                )
                const data = await response.json();
                if (!response.ok) {
                    (response.status != 422 && response.status != 500) ? console.log("Error:",data) : "";
                    throw new Error("Error updating driver charge");
                }
            }
            setIsEdit(false)
        } catch(err) {
            console.log(err);
        }
    }

    return(
        <div className="m-2">
            <FormControl>
                <div className="flex flex-row items-center justify-end">
                    <Button disabled={newModel.length==0} onClick={()=>setIsDriverOpen(true)}><CurrencyRupeeIcon/>{"Add"}</Button>
                </div>
                {existingDriverCharges.length!=0 
                    ? <div className="flex flex-row items-center justify-between mt-5">    
                        <Typography fontSize={18} fontStyle={"italic"}>{"Model"}</Typography>
                        <div className="flex flex-row items-center">
                        <Typography fontSize={18} fontStyle={"italic"}>{"Charges"}</Typography>
                        <IconButton onClick={()=>setIsEdit(!isEdit)}><EditRoundedIcon/></IconButton>
                        </div>
                    </div>  
                    : ""}
                 <Box
                    sx={{
                    width: !small ? 400 : 280,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    }}
                >
                {existingDriverCharges.map((charge:any,index:number)=>(
                    <div>
                    <div className="flex flex-col">
                        <div className="flex flex-row items-center justify-between mt-5">    
                            <Typography >{charge.vehicle_model_name}</Typography>
                            <div>
                            {!isEdit 
                            ? <Typography >{charge.charge}</Typography>
                            : <TextField
                                type="number"
                                variant="standard"
                                size="small" 
                                className="w-14"
                                inputProps={{style: { textAlign: 'right' }}}
                                value={updatedCharges[index].charge}
                                onChange={(e)=>handleChargeChange(e.target.value,index)}
                                ></TextField>
                            }
                            </div>
                        </div> 
                    </div>
                    </div>
                ))
                }
                </Box>
                {isEdit
                    ? <div className="flex justify-center mt-3">
                        <Button variant="contained" onClick={handleChargeUpdate}>Save</Button>
                    </div> : ""}
                <Drawer
                    anchor={"right"}
                    open={isDriverOpen}
                    onClose={()=>setIsDriverOpen(false)}
                >
                    <div className="m-6">
                        <div className="flex items-center justify-center m-5">
                            <Typography >{"Driver Charges Details"}</Typography>
                        </div>
                        <RadioGroup
                            row
                            aria-labelledby="model"
                            defaultValue="SUV"
                            name="vehicle_model"
                            onChange={(e)=>setDriverChargesModel(e.target.value)}
                        >
                            {newModel?.map((item:any,index:number)=>(
                                <FormControlLabel key={index} value={item['id']} control={<Radio />} label={item['name']} />
                            ))}
                        </RadioGroup>
                        <div className="flex flex-row items-center justify-between mt-5">
                            <Typography >{"Driver Charge"}</Typography>
                            <TextField
                                name='charge'
                                InputProps={{className:"ml-3"}} 
                                size="small"
                                variant="standard"
                                value={driverCharges}
                                type='number'
                                onChange={(e:any)=>setDriverCharges(e.target.value)}></TextField>
                        </div>
                        <div className="flex flex-row items-center justify-center mt-5">
                            <Button disabled={!(driverChargesModel && driverCharges)} onClick={handleCreateDriverCharge}>Create Driver Charge</Button>
                        </div>
                    </div>
                </Drawer>
            </FormControl>
        </div>
    )
}

export default DriverCharges
