import { Backdrop, Box, Button, Chip, CircularProgress, Drawer, Fab, IconButton, Pagination, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material"
import Loading from "../components/Loading";
import { useEffect, useRef, useState } from "react";
import { BASE_URL } from "../constants/string";
import ReportFilter from "../components/ReportFilter";
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import { ROUTE } from "../constants/routes";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import FilterAltIcon from '@mui/icons-material/FilterAlt';

function Report(props: {type : string}) {

    const small = window.matchMedia("(max-width: 768px)").matches
    const bookingtype = localStorage.getItem("bookingtype");
    const [page,setPage] = useState(1)
    const limit = 10
    const [list,setList] = useState<any>({})
    const [statusApi,setStatusApi] = useState({})
    const [sort,setSort] = useState({
        invoice_date : 0,
        gross_taxable_amount : 0,
        gross_non_taxable_amount : 0,
        invoice_amount : 0,
        booking_date : 0,
        check_in : 0,
        check_out : 0,
    })
    const [progress,setProgress] = useState(0)
    const [currentUrl,setCurrentUrl] = useState("")
    const [currentDownloadUrl,setCurrentDownloadUrl] = useState("")
    const [filterOpen,setFilterOpen] = useState(false)

    const filtersRefElements = useRef({
      today: null,
      this_week: null,
      start_date: null,
      end_date: null,
      bid: null,
      type: [],
      status: [],
      costCenter: [],
    })

    const [filters,SetFilters] = useState({
      today: false,
      this_week: false,
      start_date: null,
      end_date: null,
      bid: null,
      type: [],
      status: [],
      costCenter: [],
    })

    const getAllBookings = async(url=currentUrl) => {
        try{
            const bookingResponse = await fetch(url,{
                method: "GET",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + localStorage.getItem("userToken"),
                },
              });
              
            if(bookingResponse.ok) {
                const data = await bookingResponse.json()
                setList(data)
            }
        } catch(error) {
          console.error("Error fetching data:", error);
        }
    }
    function progressFunc(loaded:any, total:any) {
      let val = Math.round(loaded/total*100);
      setProgress(val)
    }

    const handleExcelDownload = async() => {
        try{
            let today = new Date();
            let date=today.getDate() + "_"+ (today.getMonth()+1) +"_"+today.getFullYear();
            setProgress(1)
            const response = await fetch(currentDownloadUrl,{
                method: "GET",
                headers: {
                  Authorization: "Bearer " + localStorage.getItem("userToken"),
                },
              });
              if(response.ok) {
                const contentLength = response.headers.get('content-length');
                const total = parseInt(contentLength, 10);
                let loaded = 0;
                const res = new Response(new ReadableStream({
                  async start(controller) {
                    const reader = response.body?.getReader();
                    for (;;) {
                      const {done, value} = await reader?.read();
                      if (done) { 
                        setProgress(0)
                        break;
                      }
                      loaded += value.byteLength;
                      progressFunc(loaded, total)
                      controller.enqueue(value);
                    }
                    controller.close();
                  },
                }));
                const newblob = await res.blob();
                const url = window.URL.createObjectURL(newblob);
                const tempLink = document.createElement("a");
                tempLink.href = url;
                tempLink.setAttribute(
                    "download",
                    props.type == "Invoice" ? `InvoiceReport${date}.xls` : `JobReport${date}.xls`
                );
                document.body.appendChild(tempLink);
                tempLink.click();
                document.body.removeChild(tempLink);
                window.URL.revokeObjectURL(url);
              }
        } catch(error) {
          setProgress(0)
          console.error("Error downloading Excel:", error);
        }
    }

    const fetchBookingData = (id:any) => {
      window.open(`..${ROUTE.HOME}/${ROUTE.BOOKING}/${id}`)
    };

    const handleSorting = (option:string) => {
        if(option == "invoice_date"){
            sort.invoice_date == 0 
                ? setSort({...sort,invoice_date:sort.invoice_date+1}) 
                : sort.invoice_date == 1 
                    ? setSort({...sort,invoice_date:sort.invoice_date+1}) 
                    : sort.invoice_date == 2 
                        ? setSort({...sort,invoice_date:sort.invoice_date-1}) 
                        : ""
        }
        if(option == "gross_taxable_amount"){
            sort.gross_taxable_amount == 0 
                ? setSort({...sort,gross_taxable_amount:sort.gross_taxable_amount+1}) 
                : sort.gross_taxable_amount == 1 
                    ? setSort({...sort,gross_taxable_amount:sort.gross_taxable_amount+1}) 
                    : sort.gross_taxable_amount == 2 
                        ? setSort({...sort,gross_taxable_amount:sort.gross_taxable_amount-1}) 
                        : ""
        }
        if(option == "gross_non_taxable_amount"){
          sort.gross_non_taxable_amount == 0 
              ? setSort({...sort,gross_non_taxable_amount:sort.gross_non_taxable_amount+1}) 
              : sort.gross_non_taxable_amount == 1 
                  ? setSort({...sort,gross_non_taxable_amount:sort.gross_non_taxable_amount+1}) 
                  : sort.gross_non_taxable_amount == 2 
                      ? setSort({...sort,gross_non_taxable_amount:sort.gross_non_taxable_amount-1}) 
                      : ""
      }
        if(option == "invoice_amount"){
            sort.invoice_amount == 0 
                ? setSort({...sort,invoice_amount:sort.invoice_amount+1}) 
                : sort.invoice_amount == 1 
                    ? setSort({...sort,invoice_amount:sort.invoice_amount+1}) 
                    : sort.invoice_amount == 2 
                        ? setSort({...sort,invoice_amount:sort.invoice_amount-1}) 
                        : ""
        }
        if(option == "booking_date"){
          sort.booking_date == 0 
              ? setSort({...sort,booking_date:sort.booking_date+1}) 
              : sort.booking_date == 1 
                  ? setSort({...sort,booking_date:sort.booking_date+1}) 
                  : sort.booking_date == 2 
                      ? setSort({...sort,booking_date:sort.booking_date-1}) 
                      : ""
      }
      if(option == "check_in"){
        sort.check_in == 0 
            ? setSort({...sort,check_in:sort.check_in+1}) 
            : sort.check_in == 1 
                ? setSort({...sort,check_in:sort.check_in+1}) 
                : sort.check_in == 2 
                    ? setSort({...sort,check_in:sort.check_in-1}) 
                    : ""
      }
      if(option == "check_out"){
        sort.check_out == 0 
            ? setSort({...sort,check_out:sort.check_out+1}) 
            : sort.check_out == 1 
                ? setSort({...sort,check_out:sort.check_out+1}) 
                : sort.check_out == 2 
                    ? setSort({...sort,check_out:sort.check_out-1}) 
                    : ""
      }
    }

    useEffect(()=>{
      const fetchStatus = async() => {
          const statusResponse = await fetch(`${BASE_URL}/${bookingtype == "cab" ? "bookings" : "hotel_bookings"}/status `,{
              method: "GET",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: "Bearer " + localStorage.getItem("userToken"),
              },
            });
      
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              setStatusApi(statusData)
            }
      }
      fetchStatus()
    },[])

    useEffect(()=>{
      setCurrentUrl(
        props.type == "Invoice" 
        ? bookingtype == "cab" ? `${BASE_URL}/invoices/reports?limit=${limit}` : `${BASE_URL}/hotel_bookings/invoices/reports?limit=${limit}`
        : bookingtype == "cab" ? `${BASE_URL}/bookings/reports?limit=${limit}` : `${BASE_URL}/hotel_bookings/reports?limit=${limit}`)
      setCurrentDownloadUrl(
        props.type == "Invoice" 
          ? bookingtype == "cab" ? `${BASE_URL}/invoices/reports/download?` : `${BASE_URL}/hotel_bookings/invoices/reports/download?`
          : bookingtype == "cab" ? `${BASE_URL}/bookings/reports/download?` : `${BASE_URL}/hotel_bookings/reports/download?`)
    },[props.type])
  
    useEffect(()=>{
        currentUrl ? getAllBookings(`${currentUrl}&page=${page}`) : ""
      },[page,currentUrl])

    return(
        <div className="flex flex-col w-full bg-appBg h-screen">
          <div className="flex ml-72 h-32 2xl:h-40 mt-1">
            <Box
              sx={{
                overflowY: "auto",
              }}
            >
            <div className="flex flex-wrap justify-center gap-1 m-1 items-center bg-slate-300 rounded">
              <div className="m-2">
                Applied filters:
              </div>
            {(filters.today) && <Chip label={"Today"} sx={{bgcolor:"#F8FAFC"}} onDelete={()=>{SetFilters({...filters, today : false})}}></Chip>}
              {(filters.this_week)&& <Chip label={"This Week"} sx={{bgcolor:"#F8FAFC"}} onDelete={()=>{SetFilters({...filters, this_week : false})}}></Chip>}   
              {(filters.start_date && filters.end_date) && <Chip label={"Date Range"} sx={{bgcolor:"#F8FAFC"}} onDelete={()=>{SetFilters({...filters, start_date : null, end_date : null})}}></Chip>}
              {filters.type?.map((type)=>(
                <Chip label={type} sx={{bgcolor:"#F8FAFC"}} onDelete={()=>{
                  const temp = filters.type
                  const index = filters.type.indexOf(type) 
                  index > -1 ? temp.splice(index,1) : ""
                  SetFilters({...filters, type: temp})
                }}></Chip>
              ))}
              {(filters.bid) && <Chip label={filters.bid} sx={{bgcolor:"#F8FAFC"}} onDelete={()=>{SetFilters({...filters, bid : null})}}></Chip> }
              {filters.status?.map((status)=>(
                <Chip label={statusApi[status]} sx={{bgcolor:"#F8FAFC"}} onDelete={()=>{
                  const temp = filters.status
                  const index = filters.status.indexOf(status) 
                  index > -1 ? temp.splice(index,1) : ""
                  SetFilters({...filters, status: temp})
                  filtersRefElements.current.status.map((element, i)=> 
                    element.name == status ? filtersRefElements.current.status[i].checked = false : "")
                }}></Chip>
              ))}
              {filters.costCenter?.map((costCenter)=>(
                <Chip label={costCenter} sx={{bgcolor:"#F8FAFC"}} onDelete={()=>{
                  const temp = filters.costCenter
                  const index = filters.costCenter.indexOf(costCenter) 
                  index > -1 ? temp.splice(index,1) : ""
                  SetFilters({...filters, costCenter: temp})
                  filtersRefElements.current.costCenter.map((element, i)=> 
                    element.name == costCenter ? filtersRefElements.current.costCenter[i].checked = false : "")
                }}></Chip>
              ))}
            <div className="absolute right-2 top-28 underline">
                <Button color="info" onClick={handleExcelDownload}>Download Excel<DownloadRoundedIcon/></Button>
            </div>
            </div>
            </Box>
          </div>
          <div className="flex flex-row justify-end">
            {!small ? <Box
              width={"20%"}
              >
                <div className=" flex justify-center bg-appBg h-[620px] 2xl:h-[100%] mt-4">
                  <ReportFilter
                    setCurrentDownloadUrl={setCurrentDownloadUrl}
                    setCurrentUrl={setCurrentUrl} 
                    getAllBookings={getAllBookings} 
                    filterRef={filtersRefElements} 
                    filters={filters} 
                    SetFilters={SetFilters}
                    sort={sort}
                    setSort={setSort}
                    reportType={props.type}
                  />
                </div>
            </Box> : <div className="flex justify-start">
              <Fab size="small" color="info" onClick={()=>setFilterOpen(true)}><FilterAltIcon/></Fab>
              <Drawer 
                open={filterOpen}
                anchor={"left"}
                onClose={()=>setFilterOpen(false)}
                >
                <div className=" flex justify-center bg-appBg h-[620px] 2xl:h-[100%] mt-4">
                  <ReportFilter
                    setCurrentDownloadUrl={setCurrentDownloadUrl}
                    setCurrentUrl={setCurrentUrl} 
                    getAllBookings={getAllBookings} 
                    filterRef={filtersRefElements} 
                    filters={filters} 
                    SetFilters={SetFilters}
                    sort={sort}
                    setSort={setSort}
                    reportType={props.type}
                  />
                </div>
              </Drawer>
              </div>}
            <Box
                width={"80%"}
                alignItems={"center"}
                >
                <div className="h-[570px] 2xl:h-[900px] w-full md:w-[80%] mt-2 overflow-y-auto overflow-x-auto">
                <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 650, overflowY : "scroll" }} size="small" >
                        <TableHead>
                            {props.type == "Invoice" ?<TableRow>
                                {list.headers?.map((header:string)=>
                                    header == "Invoice Date" ? <TableCell sx={{fontWeight: 'bold'}}>
                                        <div className="flex flex-row">
                                            {header}
                                            <IconButton onClick={()=>handleSorting("invoice_date")}>{(sort.invoice_date == 1)? <ArrowDownwardIcon/> :<ArrowUpwardIcon/>}</IconButton>
                                        </div>
                                    </TableCell> 
                                    : header == "Gross Amount (Taxable Amount)"
                                    ? <TableCell sx={{fontWeight: 'bold'}}>
                                        <div className="flex flex-row">
                                            {header}
                                            <IconButton onClick={()=>handleSorting("gross_taxable_amount")}>{(sort.gross_taxable_amount == 1)? <ArrowDownwardIcon/> :<ArrowUpwardIcon/>}</IconButton>
                                        </div>
                                    </TableCell>
                                    : header == "Gross Amount (Non-Taxable Amount)"
                                    ? <TableCell sx={{fontWeight: 'bold'}}>
                                        <div className="flex flex-row">
                                            {header}
                                            <IconButton onClick={()=>handleSorting("gross_non_taxable_amount")}>{(sort.gross_non_taxable_amount == 1)? <ArrowDownwardIcon/> :<ArrowUpwardIcon/>}</IconButton>
                                        </div>
                                    </TableCell>
                                    : header == "Total Invoice Amount"
                                    ? <TableCell sx={{fontWeight: 'bold'}}>
                                        <div className="flex flex-row">
                                            {header}
                                            <IconButton onClick={()=>handleSorting("invoice_amount")}>{(sort.invoice_amount == 1)? <ArrowDownwardIcon/> :<ArrowUpwardIcon/>}</IconButton>
                                        </div>
                                    </TableCell>
                                    : <TableCell sx={{fontWeight: 'bold'}}>{header}</TableCell>
                                )}
                            </TableRow> : ""}
                            {props.type == "Job" ?<TableRow>
                                {list.headers?.map((header:string)=>
                                    header == "Booked Date" ? <TableCell sx={{fontWeight: 'bold'}}>
                                        <div className="flex flex-row">
                                            {header}
                                            <IconButton onClick={()=>handleSorting("booking_date")}>{(sort.booking_date == 1)? <ArrowDownwardIcon/> :<ArrowUpwardIcon/>}</IconButton>
                                        </div>
                                    </TableCell>
                                    : header == "Check In" ? <TableCell sx={{fontWeight: 'bold'}}>
                                        <div className="flex flex-row">
                                            {header}
                                            <IconButton onClick={()=>handleSorting("check_in")}>{(sort.check_in == 1)? <ArrowDownwardIcon/> :<ArrowUpwardIcon/>}</IconButton>
                                        </div>
                                    </TableCell> 
                                    : header == "Check Out" ? <TableCell sx={{fontWeight: 'bold'}}>
                                        <div className="flex flex-row">
                                            {header}
                                            <IconButton onClick={()=>handleSorting("check_out")}>{(sort.check_out == 1)? <ArrowDownwardIcon/> :<ArrowUpwardIcon/>}</IconButton>
                                        </div>
                                    </TableCell>
                                    : <TableCell sx={{fontWeight: 'bold'}}>{header}</TableCell>
                                )}
                            </TableRow> : ""}
                        </TableHead>
                        {props.type == "Invoice" ? <TableBody>
                            {list.invoice_reports? (
                                list.invoice_reports?.map((request: any) => (
                                    <>
                                    <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        {
                                          list.headers?.map((header:any) => (
                                            header == "Booking ID" 
                                              ? <TableCell><a className="underline hover:cursor-pointer" onClick={()=>fetchBookingData(request[header])}>{request[header]}</a></TableCell>  
                                              : <TableCell>{request[header]}</TableCell>
                                            
                                          ))
                                        }
                                    </TableRow>
                                </>
                            ))
                            ) : (
                                <Loading times={5}></Loading>
                            )}
                        </TableBody> : ""}
                        {props.type == "Job" ? <TableBody>
                            {list.job_reports? (
                                list.job_reports?.map((request: any) => (
                                    <>
                                    <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        {
                                          list.headers?.map((header:any) => (
                                            header == "Booking ID"  
                                              ? <TableCell><a className="underline hover:cursor-pointer" onClick={()=>fetchBookingData(request[header])}>{request[header]}</a></TableCell>  
                                              : <TableCell>{request[header]}</TableCell>
                                            
                                          ))
                                        }
                                    </TableRow>
                                </>
                            ))
                            ) : (
                                <Loading times={5}></Loading>
                            )}
                        </TableBody> : ""}
                    </Table>
                    </TableContainer>
                </div>
                <div className="flex justify-center">
                    <Pagination
                        count={list?.total_pages}
                        shape="rounded"
                        onChange={(event, pageNo) => {
                            setPage(pageNo);
                        }}
                    />
                </div>
                <div>
                  <Backdrop
                    sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                    open={progress?true:false}
                  >
                    <div className="flex flex-col justify-center items-center">
                      <Typography>{progress > 1 ? `Download in Progress.${progress}%` : "Please wait"}</Typography>
                      <CircularProgress color="inherit" />
                    </div>

                  </Backdrop>
                </div>
            </Box>
          </div>
        </div>
    )
}

export default Report
