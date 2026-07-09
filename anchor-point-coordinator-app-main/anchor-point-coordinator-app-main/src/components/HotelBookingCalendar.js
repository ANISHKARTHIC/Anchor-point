import React, { useEffect, useState } from 'react';
import { Calendar,CalendarList } from 'react-native-calendars';
import { View, Text, Button, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import moment from 'moment';
import Fonts from '../theme/Fonts';
import Colors from '../theme/Colors';
import GradientButton from './GradientButton';

const HotelBookingCalendar = ({handleBookingDate,closeModal,bookingDates}) => {
  const [markedDates, setMarkedDates] = useState({});
  const [range, setRange] = useState({ start:bookingDates!=null?bookingDates.start:null, end: bookingDates!=null?bookingDates.end:null });

  useEffect(()=>{
     if(bookingDates!=null){
      const startDate = moment(bookingDates.start);
      const endDate = moment(bookingDates.end);
      handlePeriodMark(startDate,endDate)
     }
  },[])
  const handlePeriodMark=(startDate,endDate)=>{
    let period = {};
    let currDate = moment(range.start);
    
    while (currDate.isSameOrBefore(endDate)) {
      const dateKey = currDate.format('YYYY-MM-DD');

      period[dateKey] = {
        color: (currDate.isSame(startDate)||currDate.isSame(endDate))?'#234A98':'#80aaff',
        textColor: 'white',
        startingDay: currDate.isSame(startDate),
        endingDay: currDate.isSame(endDate),
      };
      
      currDate = currDate.add(1, 'day');
    }
    setMarkedDates(period);
    setRange({ ...range, end: endDate.format('YYYY-MM-DD')});
  }
  const handleDayPress = (day) => {
    const { dateString } = day;

    // If no start date or end date has been selected
    if (!range.start || (range.start && range.end)) {
      setRange({ start: dateString, end: null });
      setMarkedDates({
        [dateString]: { startingDay: true, color: '#234A98', textColor: 'white' },
      });
    } else if (range.start && !range.end) {
      // If only start date is selected, and now selecting the end date
      const startDate = moment(range.start);
      const endDate = moment(dateString);
      // Ensure end date is after start date
      if (endDate.isAfter(startDate)) {
           handlePeriodMark(startDate,endDate)
      } else {
          setRange({ start: dateString, end: null });
      setMarkedDates({
        [dateString]: { startingDay: true, color: '#234A98', textColor: 'white' },
      });
      }
    }
  };
  
  const resetSelection = () => {
    setRange({ start: null, end: null });
    setMarkedDates({});
  };
  const getNights = () =>{
    var a = moment(range.start,"YYYY-MM-DD");
    var b = moment(range.end,"YYYY-MM-DD");
    var days =  b.diff(a, 'days') 
    return days
  }
  return (
    <View style={{ flex: 1,}}>
      <View style={{flexDirection:'row',justifyContent:'space-between',paddingRight:20,marginBottom: 25,paddingLeft:20}}>
      <Text style={styles.title}>Select Your Stay Dates</Text>
        <TouchableOpacity style={{height:20,width:20,}} onPress={()=>closeModal()}>
            <Text style={styles.title}>X</Text>
        </TouchableOpacity>
      </View>
      <View style={{marginBottom:15,flexDirection:'row',paddingHorizontal:20,justifyContent:'space-between',alignItems:'center'}}>
              <View>
                    <Text style={styles.title}>Check - In</Text>
                    <Text style={styles.subTitle}>{range.start?range.start:'-- --'}</Text>
               </View>
               {range.start && range.end && 
                     <View style={{borderRadius:3,backgroundColor:Colors.classic_black,paddingHorizontal:15,paddingVertical:5}}>
                          <Text style={[styles.subTitle,{color:Colors.white}]}>{getNights()} nights</Text>
                     </View>
               }
               <View>
               <Text style={styles.title}>Check - Out</Text>
               <Text style={styles.subTitle}>{range.end?range.end:'-- --'}</Text>
               </View>
      </View>
       <View style={{flex:1}}>
      <CalendarList
        theme={{
          monthTextColor:Colors.classic_black,
          textMonthFontFamily:Fonts.Default.Bold,
          textMonthFontWeight:'bold'
        }}
        minDate={Date.now()}
              pastScrollRange={0}
              futureScrollRange={12}
        markingType={'period'}
        markedDates={markedDates}
        onDayPress={handleDayPress}
      />
      </View>
      <View style={{marginVertical:15,paddingHorizontal:20}}>
      <GradientButton
                  disabled={!(range.start && range.end )}
                  label={'Confirm Dates'}
                  backgroundColors={[Colors.start, Colors.end]}
                  onClick={()=>handleBookingDate(range)}
                />
      </View>
      {/* <View style={{height:200}}>
      {range.start && range.end ? (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 16 }}>
            Check-in: {range.start} | Check-out: {range.end}
          </Text>
          <Button title="Confirm Dates" onPress={() => handleBookingDate(range) } />
          <Button title="Reset Selection" onPress={resetSelection} color="red" />
        </View>
      ) : (
        range.start && (
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 16 }}>Check-in: {range.start}</Text>
          </View>
        )
      )}
      </View> */}
    </View>
  );
};

export default HotelBookingCalendar;

const styles = StyleSheet.create({
  title : {
    fontFamily:Fonts.Default.Bold,
    fontWeight:'bold',
    fontSize:18,
    color:Colors.classic_black
  },
  subTitle: {
    fontFamily: Fonts.Default.Light,
    fontSize: 14,
    color: Colors.gray500,
  },
})