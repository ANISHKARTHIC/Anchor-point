import { Table, TableBody, TableCell, TableContainer, TableRow, Typography } from "@mui/material"

function CopyHtml(props:any) {

    return(
        <div>
            <TableContainer className="hidden" sx={{
                          width: "50%",
                          padding: "0 8px 0 8px",
                          td: { border: 1, borderColor:"black" },
                        }}>
                <Table id="tablecopy" aria-label="simple table" className="border border-black">
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={5}><Typography fontWeight={"fontWeightBold"}>Booking Information:</Typography></TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Booking ID</TableCell>
                            <TableCell colSpan={4}>{props?.state?.bid}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Billing Entity</TableCell>
                            <TableCell colSpan={4}>{props?.state?.cost_centre?.code}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>City</TableCell>
                            <TableCell colSpan={4}>{props?.state?.city}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Trip Type</TableCell>
                            <TableCell colSpan={4}>{props?.state?.trip_type}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Number of Rooms</TableCell>
                            <TableCell colSpan={4}>{props?.state?.no_of_rooms}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Number of Adults</TableCell>
                            <TableCell colSpan={4}>{props?.state?.no_of_adults}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Number of Children</TableCell>
                            <TableCell colSpan={4}>{props?.state?.no_of_children}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Check-in Date</TableCell>
                            <TableCell colSpan={4}>{props?.state?.check_in}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Check-out Date</TableCell>
                            <TableCell colSpan={4}>{props?.state?.check_out}</TableCell>
                        </TableRow>
                        {props?.state?.pickup?.flight && <TableRow>
                            <TableCell>Arrival flight details</TableCell>
                            <TableCell colSpan={4}>{`${props?.state?.pickup?.flight} ${props?.state?.pickup?.time ? props?.state?.pickup?.time : ""}`}</TableCell>
                        </TableRow>}
                        {props?.state?.drop?.flight && <TableRow>
                            <TableCell>Departure flight details</TableCell>
                            <TableCell colSpan={4}>{`${props?.state?.drop?.flight} ${props?.state?.drop?.time ? props?.state?.drop?.time : ""}`}</TableCell>
                        </TableRow>}
                        {props?.state?.room_type && <TableRow>
                            <TableCell>Room Type</TableCell>
                            <TableCell colSpan={4}>{props?.state?.room_type}</TableCell>
                        </TableRow>}
                        <TableRow>
                            <TableCell></TableCell>
                            <TableCell colSpan={4}></TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Billing Address</TableCell>
                            <TableCell colSpan={4}>Anchor point</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Company Name</TableCell>
                            <TableCell colSpan={4}>ANCHOR POINT HOSPITALITY PRIVATE LIMITED</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Billing a Shipping Address</TableCell>
                            <TableCell colSpan={4}>Plot No 19,20&21 Narayanaswamy Nagar, Solinganallur. Tamil Nadu Chennai - 600119</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>STATE</TableCell>
                            <TableCell colSpan={4}>TAMIL NADU</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>GST No</TableCell>
                            <TableCell colSpan={4}>33AAMCA9719R1ZU</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell colSpan={5} className="font-bold"><Typography fontWeight={"fontWeightBold"}>Guest Information:</Typography></TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Rank</TableCell>
                            <TableCell>Internal ID</TableCell>
                            <TableCell>Vessel Name</TableCell>
                            <TableCell>Contact No</TableCell>
                        </TableRow>
                            {props?.guests?.map((items:any)=>(
                                <TableRow>
                                    <TableCell>{items.name}</TableCell>
                                    <TableCell>{items.rank}</TableCell>
                                    <TableCell>{items.internal_id}</TableCell>
                                    <TableCell>{items.vessel_name}</TableCell>
                                    <TableCell>{items.mobile}</TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    )
}
export default CopyHtml;