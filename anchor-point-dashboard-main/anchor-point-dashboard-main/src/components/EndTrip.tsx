import Signature from "./Signature"
import { useEffect, useState } from "react"
import { Button } from "@mui/material"
import { BASE_URL, STRING_ERROR } from "../constants/string";

function EndTrip(props: any) {

    const [sig, setSig] = useState<any>()
    const [location, setLocation] = useState({
        latitude: 0,
        longitude: 0
    });
    const bookingId = localStorage.getItem("bookingId");

    useEffect(() => {
        navigator.geolocation.getCurrentPosition((props)=> setLocation(
            {
                latitude: props.coords.latitude,
                longitude: props.coords.longitude
            }
        ))
    },[])

    const SignatureToImage = (signature: any) => {
        signature.target.toBlob((blob: any)=> {
            setSig(blob)
        },'image/png')
    }

    const handleSubmit = async () => {
        if(!sig) return alert("Please enter guest signature")
        let guest = props.guests?.find((obj: any) => obj.booking_log_id == props.id)
        let formdata = new FormData()
        formdata.append('booking_log_id',guest.booking_log_id)
        formdata.append('guest_name',guest.name)
        formdata.append('booking_id',bookingId)
        formdata.append('location',`${location.latitude},${location.longitude}`)
        formdata.append('status',"dropped")
        formdata.append('signature_image',sig)
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
                throw new Error("Error ending trip");
            }
            props.onEnd(props.id)
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div className="flex flex-col">
            <span>Signature of the Guest:</span>
            <Signature SignatureToImage={SignatureToImage}/>
            <Button variant="contained" sx={{bgcolor:"green"}} onClick={handleSubmit}>Submit</Button>
        </div>
    )

}

export default EndTrip
