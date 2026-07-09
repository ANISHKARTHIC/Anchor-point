import * as React from "react";
import { useState, useEffect} from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import {
  Autocomplete,
  Chip,
  FormControlLabel,
  FormGroup,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import dayjs from "dayjs";
import { DemoContainer, DemoItem } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers";
import { BASE_URL } from "../constants/string";
import FilterListIcon from '@mui/icons-material/FilterList';

export default function ReportFilter(props:any) {

  const limit = 10
  const [formats, setFormats] = useState([])
  const [expandedItems, setExpandedItems] = useState<string[]>([])  
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [status, setStatus] = useState({})
  const [costCenter,setCostCenter] = useState([])
  const [bid,SetBid] = useState([])
  const [selectedBid,setSelectedBid] = useState("")
  const bookingtype = localStorage.getItem("bookingtype");
  
  let url = props.reportType == "Invoice" 
    ? bookingtype == "cab" ? `${BASE_URL}/invoices/reports?limit=${limit}` : `${BASE_URL}/hotel_bookings/invoices/reports?limit=${limit}`
    : bookingtype == "cab" ? `${BASE_URL}/bookings/reports?limit=${limit}` : `${BASE_URL}/hotel_bookings/reports?limit=${limit}`;
  let downloadurl = props.reportType == "Invoice" 
    ? bookingtype == "cab" ? `${BASE_URL}/invoices/reports/download?` : `${BASE_URL}/hotel_bookings/invoices/reports/download?`
    : bookingtype == "cab" ? `${BASE_URL}/bookings/reports/download?` : `${BASE_URL}/hotel_bookings/reports/download?`

  const dateFormater = (e: any) => {
    let d = e.toDate();
    let formattedDate = d.getDate()  + "-" + (d.getMonth()+1) + "-" + d.getFullYear();
    return formattedDate;
}

  const handleFormat = (
    event: React.MouseEvent<HTMLElement>,
    newFormats: string[],
  ) => {
    setFormats(newFormats);
    props.SetFilters({...props.filters,type: newFormats})
  };

  const handleExpandedItemsChange = (
    event: React.SyntheticEvent,
    itemIds: string[],
  ) => {
    setExpandedItems(itemIds);
  };

  const handleExpandClick = () => {
    setExpandedItems((oldExpanded) =>
      oldExpanded.length === 0
        ? [
            "date",
            "bid",
            "bookingtype",
            "cabtype",
            "status",
            "costCenter"
          ]
        : [],
    );
  };

  const handleStatusChange = (event: any) => {
    const name = event.target.name;
    let temp = props.filters.status
    if(event.target.checked) {
      temp =  [...props.filters.status,name] 
    } else {
      const index = props.filters.status.indexOf(name) 
      index > -1 ? temp.splice(index,1) : ""
    }
    props.SetFilters({
      ...props.filters,
      status: temp
    });
  };

  const handleCostcenterChange = (event: any) => {
    const name = event.target.name;
    let temp = props.filters.costCenter
    if(event.target.checked) {
      temp =  [...props.filters.costCenter,name] 
    } else {
      const index = props.filters.costCenter.indexOf(name) 
      index > -1 ? temp.splice(index,1) : ""
    }
    props.SetFilters({
      ...props.filters,
      costCenter: temp
    });
  };


  const handleClearAll = () => { 
    props.SetFilters({
      today: false,
      this_week: false,
      start_date: null,
      end_date: null,
      bid:null,
      type: [],
      status: [],
      costCenter: [],
    })
    setStartDate(null)
    setEndDate(null)
    setFormats([])
    SetBid([])
    setSelectedBid("")
    for (let i = 0; i < props.filterRef?.current?.status?.length; i++) {
      props.filterRef.current.status[i].checked = false
    }
    for (let i = 0; i < props.filterRef?.current?.costCenter?.length; i++) {
        props.filterRef.current.costCenter[i].checked = false
    }
    props.setSort({
        invoice_date : 0,
        gross_taxable_amount: 0,
        gross_non_taxable_amount : 0,
        invoice_amount : 0,
        booking_date : 0 
    })
  }

  const fetchBid = async(bookingid:string) => {
    const response = await fetch(bookingtype=="cab" ? `${BASE_URL}/bookings/bid?bid=${bookingid}` : `${BASE_URL}/hotel_bookings/bid?bid=${bookingid}`,{
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("userToken"),
      },
    });
    if(response.ok) {
      const data = await response.json();
      SetBid(data.bid)
    }
  }

  useEffect(()=>{

    let filteredUrl = url
    let filtereDownloaddUrl = downloadurl
    // Date Filter
    if(props.filters.today) {
      filteredUrl = filteredUrl+"&today=true"
      filtereDownloaddUrl = filtereDownloaddUrl+"today=true&"
      setStartDate(null)
      setEndDate(null)
      props.SetFilters({...props.filters, start_date:null, end_date: null})
    } else if(props.filters.this_week) {
      filteredUrl = filteredUrl+"&this_week=true"
      filtereDownloaddUrl = filtereDownloaddUrl+"this_week=true&"
      setStartDate(null)
      setEndDate(null)
      props.SetFilters({...props.filters, start_date:null, end_date: null})
    } else if(props.filters.start_date && props.filters.end_date){
      if(dayjs(props.filters.start_date).isBefore(dayjs(props.filters.end_date))) {
        props.reportType == "Invoice" 
          ? bookingtype == "cab" 
            ? filteredUrl = filteredUrl + "&invoice_start_date=" + dateFormater(props.filters.start_date) + "&invoice_end_date=" + dateFormater(props.filters.end_date)
            : filteredUrl = filteredUrl + "&check_in_date_gte=" + dateFormater(props.filters.start_date) + "&check_in_date_lte=" + dateFormater(props.filters.end_date)
          : bookingtype == "cab" 
            ? filteredUrl = filteredUrl + "&pickup_start_date=" + dateFormater(props.filters.start_date) + "&pickup_end_date=" + dateFormater(props.filters.end_date)
            : filteredUrl = filteredUrl + "&check_in_date_gte=" + dateFormater(props.filters.start_date) + "&check_in_date_lte=" + dateFormater(props.filters.end_date)
        props.reportType == "Invoice" 
          ? bookingtype == "cab" 
            ? filtereDownloaddUrl = filtereDownloaddUrl + "invoice_start_date=" + dateFormater(props.filters.start_date) + "&invoice_end_date=" + dateFormater(props.filters.end_date) + "&"
            : filtereDownloaddUrl = filtereDownloaddUrl + "check_in_date_gte=" + dateFormater(props.filters.start_date) + "&check_in_date_lte=" + dateFormater(props.filters.end_date) + "&"
          : bookingtype == "cab" 
            ? filtereDownloaddUrl = filtereDownloaddUrl + "pickup_start_date=" + dateFormater(props.filters.start_date) + "&pickup_end_date=" + dateFormater(props.filters.end_date) + "&"
            : filtereDownloaddUrl = filtereDownloaddUrl + "check_in_date_gte=" + dateFormater(props.filters.start_date) + "&check_in_date_lte=" + dateFormater(props.filters.end_date) + "&"
      }
      if(dayjs(props.filters.start_date).isSame(dayjs(props.filters.end_date))) {
        props.reportType == "Invoice" 
          ? filteredUrl = filteredUrl + "&invoice_date=" + dateFormater(props.filters.start_date)
          : filteredUrl = filteredUrl + "&pickup_date=" + dateFormater(props.filters.start_date)
        props.reportType == "Invoice" 
          ? filtereDownloaddUrl = filtereDownloaddUrl + "invoice_date=" + dateFormater(props.filters.start_date)+"&"
          : filtereDownloaddUrl = filtereDownloaddUrl + "pickup_date=" + dateFormater(props.filters.start_date)+"&"
      }
    }
    //Booking ID
    props.filters.bid? filteredUrl = filteredUrl + "&bid=" + props.filters.bid : ""
    props.filters.bid? filtereDownloaddUrl = filtereDownloaddUrl + "bid=" + props.filters.bid +"&" : ""
    // Booking Type
    props.filters.type?.map((type:any)=>{
      filteredUrl = filteredUrl + "&trip_type=" + type
      filtereDownloaddUrl = filtereDownloaddUrl + "trip_type=" + type +"&"
    })
    // Status
    props.filters.status?.map((status:any)=>{
      filteredUrl = `${filteredUrl}${bookingtype == "cab" ? "&trip_status=" : "&status="}${status}`
      filtereDownloaddUrl = `${filtereDownloaddUrl}${bookingtype == "cab" ? "trip_status=" : "status="}${status}&`
    })
    // Cost Center
    props.filters.costCenter?.map((costCenter:any)=>{
        filteredUrl = filteredUrl + "&cost_centre=" + costCenter
        filtereDownloaddUrl = filtereDownloaddUrl + "cost_centre=" + costCenter +"&"
      })
    //Sort
    let sorting = ""
    props.sort.invoice_date == 1 
        ? sorting = sorting + "&sort=invoice_date" 
        : props.sort.invoice_date == 2 
            ? sorting = sorting + "&sort=invoice_date:desc" 
            : ""
    props.sort.gross_non_taxable_amount == 1 
        ? sorting = sorting + "&sort=gross_non_taxable_amount" 
        : props.sort.gross_non_taxable_amount == 2
            ? sorting = sorting + "&sort=gross_non_taxable_amount:desc" 
            : ""
    props.sort.gross_taxable_amount == 1 
        ? sorting = sorting + "&sort=gross_taxable_amount" 
        : props.sort.gross_taxable_amount == 2
            ? sorting = sorting + "&sort=gross_taxable_amount:desc" 
            : ""
    props.sort.invoice_amount == 1 
        ? sorting = sorting + "&sort=invoice_amount" 
        : props.sort.invoice_amount == 2 
            ? sorting = sorting + "&sort=invoice_amount:desc" 
            : ""
    props.sort.booking_date == 1 
        ? sorting = sorting + "&sort=booking_date" 
        : props.sort.booking_date == 2 
            ? sorting = sorting + "&sort=booking_date:desc" 
            : ""
    props.sort.check_in == 1 
        ? sorting = sorting + "&sort=check_in" 
        : props.sort.check_in == 2 
            ? sorting = sorting + "&sort=check_in:desc" 
            : ""
    props.sort.check_out == 1 
        ? sorting = sorting + "&sort=check_out" 
        : props.sort.check_out == 2 
            ? sorting = sorting + "&sort=check_out:desc" 
            : ""
    filteredUrl = filteredUrl + sorting
    filtereDownloaddUrl = filtereDownloaddUrl + sorting
    props.setCurrentUrl(filteredUrl)
    props.setCurrentDownloadUrl(filtereDownloaddUrl)
  },[
      props.filters.today,
      props.filters.this_week,
      props.filters.start_date,
      props.filters.end_date,
      props.filters.type,
      props.filters.bid,
      JSON.stringify(props.filters.status),
      JSON.stringify(props.filters.costCenter),
      JSON.stringify(props.sort),
    ]
  )

  useEffect(()=>{
    const fetchData = async()=> {
        try{
            const response = await fetch(`${BASE_URL}/cost-centres`, {
                method: "GET",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + localStorage.getItem("userToken"),
                },
            });
            const data = await response.json();
            setCostCenter(data.cost_centres);
        } catch(error) {
            console.log(error)
        }
    }
    fetchData()

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
        setStatus(statusData)
      }
    }
    fetchStatus()
  },[])

  return (
    <Box sx={{ flexGrow: 1, maxWidth: 250, height:580 }}>
      <div className="flex flex-row justify-between items-center">
        <div>
          <Button onClick={handleExpandClick}>
          <FilterListIcon/>{expandedItems.length === 0 ? "Expand All" : "Collapse All"}
          </Button>
        </div>
        <div>
            <Button size="small" onClick={handleClearAll}>
              {"Clear All"}
            </Button> 
        </div>
      </div>
      <Box sx={{ minHeight: 200, maxHeight: 570, overflowY: "auto" }}>
        <SimpleTreeView
          expandedItems={expandedItems}
          onExpandedItemsChange={handleExpandedItemsChange}
        >
          <TreeItem
            itemId="date"
            label={<Typography sx={{fontWeight: 'bold',}}>&nbsp; {bookingtype == "cab" ? "Pickup date" : "Check-in Date"}</Typography>}
            sx={{
              backgroundColor: "#ffffff",
              "&:hover": {
                backgroundColor: "#F8FAFC",
              },
              "&.Mui-selected": {
                backgroundColor: "#c0c0c0",
              },
            }}
          >
            <div className="flex mt-2 justify-evenly">
              <Chip 
                label="Today" 
                variant={props.filters.today? "filled" : "outlined"} 
                disabled={props.filters.this_week} 
                clickable 
                ref={(element) => { props.filterRef.current.today = element}}
                onClick={(e:any)=>{props.SetFilters({...props.filters, today : !props.filters.today})}} />
              <Chip 
                label="This Week" 
                variant={props.filters.this_week? "filled" : "outlined"} 
                disabled={props.filters.today} 
                clickable 
                ref={(element) => { props.filterRef.current.this_week = element}}
                onClick={(e:any)=>{props.SetFilters({...props.filters, this_week : !props.filters.this_week})}} />
            </div>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DemoContainer
                components={["DatePicker", "DatePicker"]}
              >
                <div className="flex flex-col">
                <div>
                <DemoItem
                  label="Start Date"
                  component="DatePicker"
                >
                  <DatePicker
                    format='DD-MM-YYYY'
                    value={startDate}
                    disabled={props.filters.this_week || props.filters.today}
                    onChange={(newValue:any) => {
                      setStartDate(newValue)
                      props.SetFilters({...props.filters, start_date : newValue})
                    }}
                    slotProps={{field: { clearable: true }, textField:{size: 'small'}}}
                  />
                </DemoItem>
                </div>
                <div>
                <DemoItem
                  label="End Date"
                  component="DatePicker"
                >
                  <DatePicker
                    format='DD-MM-YYYY'
                    value={endDate}
                    disabled={props.filters.this_week || props.filters.today}
                    minDate={dayjs(startDate, "DD-MM-YYYY")}
                    onChange={(newValue:any) => {
                      setEndDate(newValue)
                      props.SetFilters({...props.filters, end_date : newValue})
                    }}
                    slotProps={{field: { clearable: true }, textField:{size: 'small'}}}
                  />
                </DemoItem>
                </div>
            </div>
              </DemoContainer>
            </LocalizationProvider>
          </TreeItem>
          {bookingtype == "hotel" && <TreeItem
            itemId="bookingtype"
            label={<Typography sx={{fontWeight: 'bold',}}> &nbsp; Trip Type</Typography>}
            sx={{
              backgroundColor: "#ffffff",
              "&:hover": {
                backgroundColor: "#F8FAFC",
              },
              "&.Mui-selected": {
                backgroundColor: "#c0c0c0",
              },
            }}
          >
            <ToggleButtonGroup
              value={formats}
              onChange={handleFormat}
              aria-label="booking type"
              sx={{ marginY: 1, marginX: 2 }}
            >
              <Tooltip title="Official Trip" placement="left">
                <ToggleButton value="Official" aria-label="Cab">
                  <BusinessCenterIcon />
                </ToggleButton>
              </Tooltip>
              <Tooltip title="Family Trip" placement="right">
                <ToggleButton value="Family" aria-label="Hotel">
                  <FamilyRestroomIcon />
                </ToggleButton>
              </Tooltip>
            </ToggleButtonGroup>
          </TreeItem>}
          <TreeItem
            itemId="bid"
            label={<Typography sx={{fontWeight: 'bold',}}> &nbsp; Booking ID</Typography>}
            sx={{
              backgroundColor: "#ffffff",
              "&:hover": {
                backgroundColor: "#F8FAFC",
              },
              "&.Mui-selected": {
                backgroundColor: "#c0c0c0",
              },
            }}
          >
            <Autocomplete
              options={bid || []}
              getOptionLabel={(option: any) => option}
              className="flex justify-center items-center w-44"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={"Search Booking ID"}
                  variant="standard"
                  value={selectedBid}
                  placeholder="eg.BID1"
                  onChange={(e:any)=>{ 
                    e.target.value?.length > 3 
                    ? fetchBid(e.target.value) 
                    : ""
                    setSelectedBid(e.target.value)
                  }}
                />
              )}
              onChange={(event, newValue) => {
                if (newValue === null) {
                  SetBid([]);
                } else {
                  props.SetFilters({...props.filters, bid: newValue}) 
                }
              }}
            />
          </TreeItem>
          <TreeItem
            itemId="costCenter"
            label={<Typography sx={{fontWeight: 'bold',}}>&nbsp; Cost Center</Typography>}
            sx={{
              backgroundColor: "#ffffff",
              "&:hover": {
                backgroundColor: "#F8FAFC",
              },
              "&.Mui-selected": {
                backgroundColor: "#c0c0c0",
              },
            }}
          >
            <FormGroup sx={{ marginY: 1, marginX: 2 }}>
              {
                costCenter?.map((item:any,index:number) => (
                  <FormControlLabel 
                    control={<input className="mr-2" checked={props.filters?.costCenter?.find((costCenter:any)=>costCenter==item.code)? true : false} type="checkbox" ref={(element) => { props.filterRef.current.costCenter[index] = element}} />} 
                    label={item.code} 
                    name={item.code}
                    onChange={handleCostcenterChange} />
                ))
              }
            </FormGroup>
          </TreeItem>
          {props.reportType == "Job" && <TreeItem
            itemId="status"
            label={<Typography sx={{fontWeight: 'bold',}}>&nbsp; Status</Typography>}
            sx={{
              backgroundColor: "#ffffff",
              "&:hover": {
                backgroundColor: "#F8FAFC",
              },
              "&.Mui-selected": {
                backgroundColor: "#c0c0c0",
              },
            }}
          >
            <FormGroup sx={{ marginY: 1, marginX: 2 }}>
              {
                Object.keys(status).map((item:any,index:number) => (
                  <FormControlLabel 
                    control={<input className="mr-2" checked={props.filters?.status?.find((status:any)=>status==item)? true : false} type="checkbox" ref={(element) => { props.filterRef.current.status[index] = element}} />} 
                    label={status[item]} 
                    name={item}
                    onChange={handleStatusChange} />
                ))
              }
            </FormGroup>
          </TreeItem>}
        </SimpleTreeView>
      </Box>
    </Box>
  );
}

