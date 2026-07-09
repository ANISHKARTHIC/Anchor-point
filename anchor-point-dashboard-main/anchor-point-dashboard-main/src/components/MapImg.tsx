import { GoogleMap, useJsApiLoader, MarkerF, DirectionsRenderer, InfoWindowF } from "@react-google-maps/api";
import {GOOGLE_MAP_API_KEY} from '../constants/string'
import { useEffect, useState } from "react";
import blue_dot from "../assets/blue-dot.png"
import red_dot from "../assets/red-dot.png"
import green_dot from "../assets/green-dot.png"
import { IconButton, Typography } from "@mui/material"
import InfoRoundedIcon from '@mui/icons-material/InfoRounded'
import CancelRoundedIcon from '@mui/icons-material/CancelRounded'

function MapImg(props: any) {
    const {isLoaded} = useJsApiLoader({
        googleMapsApiKey: GOOGLE_MAP_API_KEY
    })

    const [directionResponse, setDirectionResponse] = useState(null)
    const [activeMarker, setActiveMarker] = useState({name: "",type: ""})
    const [open, setOpen] = useState(true)

    const getRoute = async() => {
        const wayPoints = props.route?.map((item: any)=>({location:item.coordinate}))
        const directionService = new google.maps.DirectionsService()
        const results = await directionService.route({
            origin: props.route ? props.route[0]?.coordinate : 0.0,
            destination:props.route ? props.route[props.route?.length-1]?.coordinate : 0.0,
            waypoints: wayPoints,
            travelMode: google.maps.TravelMode.DRIVING,
        })
        setDirectionResponse(results);
    }
    useEffect(()=>{
        getRoute()
    },[isLoaded,props.route])

    if(!isLoaded || !props.route){
        return (<span>Map Not Loaded...</span>)
    }

    const openMap = () => {
        window.open(props.state?.navigation_url)
    }

    const handleMarkerClick = (name:string,type:string) => {
        setActiveMarker({name:name, type:type})
    }
    return (
        <div>
            <div className="relative z-0">
            <GoogleMap center={props.route ? props.route[0]?.coordinate : 0.0} zoom={10}
            mapContainerStyle={{width:450,height:350}}
            options={{
                streetViewControl:false,
                mapTypeControl:false,
                fullscreenControl:false
            }}
            onClick={openMap}
            >
                <MarkerF key={"blue"} icon={{url: blue_dot }} position={props.route? props.route[0]?.coordinate : 0.0} onClick={()=>handleMarkerClick("start","start")}>
                    {(activeMarker.name =="start" && activeMarker.type=="start") ? <InfoWindowF position={props.route? props.route[0]?.coordinate : 0.0} key={"blue"} ><div>{props.vendor? props.vendor.name : "You"}</div></InfoWindowF> : ""}
                </MarkerF>
                {props.route?.slice(1).map((loc: any,index: number)=>(
                        (props.route?.slice(1)[index].type === "pickup")
                            ? <MarkerF key={loc.name} options={{icon:green_dot}} position={loc.coordinate} onClick={()=>handleMarkerClick(loc.name,"pickup")}>
                                {(activeMarker.name==loc.name && activeMarker.type == "pickup") 
                                ? <InfoWindowF position={loc.coordinate} key={loc.name} >
                                    <div>{"Name: "}<span className="font-semibold">{loc.name}</span>
                                        <div>{"Address: "}<span className="font-semibold">{loc.address}</span></div>
                                        <div>{"Phone: "}<span className="font-semibold">{loc.mobile}</span></div>
                                    </div>
                                </InfoWindowF> : ""}
                            </MarkerF>
                            : <MarkerF key={loc.name} options={{icon:red_dot}} position={loc.coordinate} onClick={()=>handleMarkerClick(loc.name,"drop")}>
                                {(activeMarker.name==loc.name && activeMarker.type == "drop") 
                                    ? <InfoWindowF position={loc.coordinate} key={loc.name} >
                                        <div>{"Name: "}<span className="font-semibold">{loc.name}</span>
                                            <div>{"Address: "}<span className="font-semibold">{loc.address}</span></div>
                                            <div>{"Phone: "}<span className="font-semibold">{loc.mobile}</span></div>
                                        </div>
                                    </InfoWindowF> : ""}
                            </MarkerF>
                    ))}
                {directionResponse && <DirectionsRenderer directions={directionResponse} options={{suppressMarkers:true}} />}
            </GoogleMap>
            <div className=" bg-white absolute top-2 right-2 rounded">
                {!open ? <IconButton onClick={()=>setOpen(true)}><InfoRoundedIcon color="info"/></IconButton> : ""}
                {open 
                ? <div className=" w-44 h-14">
                    <div className="absolute top-0 right-0">
                        <IconButton onClick={()=>setOpen(false)}><CancelRoundedIcon/></IconButton>
                    </div>
                    <div className="mt-8 ml-2">
                        <Typography>{"Duration: "} {props.state?.total_duration}</Typography>
                        <Typography>{"Distance: "} {props.state?.total_distance}</Typography>
                    </div>
                </div> 
                :""}
            </div>
            </div>
        </div>
        
    )
}

export default MapImg
