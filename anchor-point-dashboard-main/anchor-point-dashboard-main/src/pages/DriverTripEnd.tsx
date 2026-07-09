import { Typography } from "@mui/material"

function DriverTripEnd() {
    return(
        <div className=' m-2 w-screen min-h-screen'>
            <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>
                <div className="flex items-center justify-center">
                    <Typography  className="m-2" fontSize={20}>The Trip Has Ended!</Typography>
                </div>
            </div>
        </div>
    )
}

export default DriverTripEnd
