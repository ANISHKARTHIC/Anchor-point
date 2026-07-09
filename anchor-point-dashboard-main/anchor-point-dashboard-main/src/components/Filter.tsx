import {useState,useEffect} from 'react';
import dayjs from 'dayjs';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Button } from '@mui/material';
import Box from '@mui/material/Box';
import CancelIcon from '@mui/icons-material/Cancel';
import { ROUTE } from "../constants/routes";

function Filter(props: any) {
    const [filter, setFilter] = useState('');
    const [startDate, setStartDate] = useState<any>(null);
    const [endDate, setEndDate] = useState<any>(null);
    const [startMinDate, setStartMinDate] = useState<any>(null);
    const [startMaxDate, setStartMaxDate] = useState<any>(null);
    const [endMinDate, setEndMinDate] = useState<any>(null);
    const [endMaxDate, setEndMaxDate] = useState<any>(null);
    const today = dayjs(dayjs(),"DD-MM-YYYY");

    const dateFormater = (e: any) => {
        let d = e.toDate();
        let formattedDate = d.getDate()  + "-" + (d.getMonth()+1) + "-" + d.getFullYear();
        return formattedDate;
    }
    useEffect(() => {
        switch (props.navigatedFrom) {
            case ROUTE.TASKS:
                setStartMinDate(today);
              break;
            case ROUTE.PASTBOOKINGS:
                setStartMaxDate(today);
                setEndMaxDate(today);
              break;
          }
    })

    useEffect(() => {
        let startformatdate = startDate ? dateFormater(startDate) : null;
        let endformatdate = endDate ? dateFormater(endDate) : null;
        let obj = {
            filter: filter,
            startDate: startformatdate,
            endDate: endformatdate
        }
        props.handleData(obj);

    }, [filter,startDate,endDate])

    const handleFilterChange = (e: any) => {
        setFilter(e.target.value);
    };
    const handleStartDateChange = (e: any) => {
        if(e) setStartDate(e);
        setEndMinDate(e);
    };
    const handleEndDateChange = (e: any) => {
        if(e) setEndDate(e);
    };
    const clearFilter = () => {
        setStartDate(null);
        setEndDate(null);
        setFilter('');
    }
    return(
        <div className='flex flex-col md:flex-row font-bold text-xl'>
        <FormControl size='small' sx={{ width: 200 }}>
            <InputLabel id="filter_label">{props.filterName}</InputLabel>
                <Select
                    labelId="filter_label"
                    id="filter_select"
                    value={filter}
                    label={props.filterName}
                    onChange={handleFilterChange}
                    size='small'
                >
                    <MenuItem value="">
                        <em>None</em>
                    </MenuItem>
                    {Object.keys(props.filter).map((item) => (
                        <MenuItem value={item}>{props.filter[item as keyof typeof props.filter]}</MenuItem>
                    ))}
                </Select>
        </FormControl>
        <FormControl sx={{width:500}}>
            <div className='flex flex-col md:flex-row'>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Box sx={{ml:1}}>
                <DatePicker 
                    label="From Date"
                    format='DD-MM-YYYY'
                    onChange={handleStartDateChange}
                    minDate={startMinDate}
                    maxDate={startMaxDate}
                    value={startDate? dayjs(startDate,"DD-MM-YYYY"): null}
                    slotProps={{field: { clearable: true }, textField:{size: 'small'}}}/>
                </Box>
                <Box sx={{ml:1}}>
                <DatePicker 
                    label="To Date"
                    format='DD-MM-YYYY'
                    onChange={handleEndDateChange}
                    minDate={dayjs(endMinDate, "DD-MM-YYYY")}
                    maxDate={endMaxDate}
                    value={endDate? dayjs(endDate,"DD-MM-YYYY"): null}
                    slotProps={{field: { clearable: true }, textField:{size: 'small'}}}/>
                </Box>
                <div className="mt-1">
                  <Button size='small' onClick={props.onClose}><CancelIcon color="primary"></CancelIcon></Button>
                </div>
            </LocalizationProvider>
            </div>
        </FormControl>
        <FormControl sx={{ width: 80 }} >
            {(filter || endDate || startDate) && <Button onClick={clearFilter}>Clear</Button>}
        </FormControl>
        </div>
    );
}

export default Filter;
