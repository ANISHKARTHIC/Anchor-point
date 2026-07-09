import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { environment } from '../constants/string';
dayjs.extend(duration);


/*
 * Input: 20-12-2023 (dd-mm-yyyy)
 * Output: Dec 20, 2023
 */
export const formatDate = (date: string) => {
    const reConstructedDateString = date.split('-').reverse().join("-")
    const newDate = new Date(reConstructedDateString).toLocaleString('en-US', {
        year: 'numeric', 
        month: 'short', 
        day: '2-digit',
    })
    const month = newDate.slice(0,3)
    const outputDate = newDate.substring(3,newDate.length)
    return outputDate.replace(/,/g, ` ${month}`)
}

/*
 * Input: "27-11-2023", "06:30 PM"
 * Output: [true/false,true/false] (within 24hrs, within 6hrs)
 */
export const isToday = (date: string, time: string) => {
    let newDate = dayjs(date,"DD-MM-YYYY");
    date = (newDate.get('month')+1) + "-" + (newDate.get('date')) + "-" + (newDate.get('year'));
    let givenDate = new Date(`${date} ${time}`);
    let today = new Date();
    let oneDay = dayjs.duration(1,"d");
    let sixHrs = dayjs.duration(6,"h");
    let arr = [];
    (givenDate>today && ((givenDate.getTime() - today.getTime()) < oneDay.asMilliseconds()))
        ? arr[0] = true
        : arr[0] = false;
    (givenDate>today && ((givenDate.getTime() - today.getTime()) < sixHrs.asMilliseconds()))
        ? arr[1] = true
        :arr[1] = false;
    return arr;
}

/*
 * Input: "27-11-2023"
 * Output: true/false (is within a day)
 */
export const is24hrs = (date: string) => {
    let newDate = dayjs(date,"DD-MM-YYYY");
    date = (newDate.get('month')+1) + "-" + (newDate.get('date')) + "-" + (newDate.get('year'));
    let givenDate = new Date(date);
    let today = new Date();
    let oneDay = dayjs.duration(1,"d");
    return (givenDate>today && ((givenDate.getTime() - today.getTime()) < oneDay.asMilliseconds()))
        ? true
        : false;
}
/**
 * 
 * Adds n hours to the date object
 * 
 * @param date
 * @type Date object 
 * @returns 
 */
export const addHoursToCurrentDate = (date: Date, hours: number) => {
    date.setTime(date.getTime() + (hours * 60 * 60 * 1000) )

    return date
}

export const currentDate = (prev=false) => {
    const now = new Date()
    var prev_date = new Date()
    prev_date.setDate(prev_date.getDate() - 1)
    let formattedDate = prev 
        ? prev_date.getDate()  + "-" + (prev_date.getMonth()+1) + "-" + prev_date.getFullYear() 
        : now.getDate()  + "-" + (now.getMonth()+1) + "-" + now.getFullYear();
    return formattedDate;
}

export const getCurrentAnd24HrsTimeStamp = () => {
    let dateObj = new Date();
      /** dd-mm-yyyy hh:MM:ss */
      const timestampToday = `${dateObj
        .toLocaleDateString("en-GB")
        .replace(/\//g, "-")} ${dateObj.toLocaleTimeString("en-GB")}`;

      dateObj = addHoursToCurrentDate(dateObj, 24);
      const timestampAfter24Hours = `${dateObj
        .toLocaleDateString("en-GB")
        .replace(/\//g, "-")} ${dateObj.toLocaleTimeString("en-GB")}`;
    return [timestampToday, timestampAfter24Hours];
}

export const getCurrAndTomoDate = () => {
    const d = new Date()
    let today = (d.getDate()) + "-" + (d.getMonth()+1) + "-" + (d.getFullYear());
    d.setDate(d.getDate() + 1)
    let tomorrow = (d.getDate()) + "-" + (d.getMonth()+1) + "-" + (d.getFullYear());
    return [today, tomorrow]
}

export const validateDomain = (email:any, companyName="anchorpoint")=>{ 
    let match = email.match(/^\w+@(\w+).\w+$/);  
    return match!==null &&  match[1]===companyName;
}

export const isValidEmail = (email: any) => {
    return (
      /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(email)
    );
  };

export const getCollectionName=(name:string)=>{
    if(environment=="dev"){
        return `${name}_${environment}`
    }
    return name
}
