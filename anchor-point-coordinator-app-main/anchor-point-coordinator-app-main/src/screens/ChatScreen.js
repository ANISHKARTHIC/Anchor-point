import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Image,
  View,
  TouchableOpacity,
  Platform,
  Text,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import useUnreadCount from '../hooks/useUnreadCount';
import Colors from '../theme/Colors';
import {Badge, SegmentedButtons} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Keys from '../constants/Keys';
import EndPoints from '../api/EndPoints';
import ApiRequest from '../api/ApiRequest';
import HotelCard from '../components/HotelCard';
import { Card } from '../components/Card';

const ChatScreen = ({navigation}) => {
  const {unReadMsgData, loadingCount} = useUnreadCount();
  const [bookingType, setBookingType] = useState('hotel');
  const [bookingsData, setBookingsData] = useState([]);
  useEffect(() => {
    if (unReadMsgData) {
      getBookingsData();
    }
  }, [bookingType, unReadMsgData]);

  const getSortedCount = obj => {
    return Object.entries(obj)
      .sort(([, a], [, b]) => b - a)
      .reduce((r, [k, v]) => ({...r, [k]: v}), {});
  };

  const getBookingIds = () => {
    return Object.keys(
      bookingType == 'cab'
        ? getSortedCount(unReadMsgData['cabbookings'])
        : getSortedCount(unReadMsgData['hotelbookings']),
    ).toString();
  };


  const getBookingsData = async () => {
    try {
      if (bookingType === 'cab') {
        setBookingsData([]);
        return;
      }
      let apiUrl =
        bookingType == 'cab'
          ? ``
          : `${EndPoints.PostHotelBooking}?booking_ids=${encodeURIComponent(
              getBookingIds(),
            )}`;

      console.log("getBookingIds",getBookingIds(),"\napiUrl==>",apiUrl)
      const response = await ApiRequest({
        url: apiUrl,
        method: 'GET',
      });
      if (
        response.bookings &&
        Array.isArray(response.bookings) &&
        response.bookings.length > 0
      ) {
        setBookingsData([...response.bookings]);
      }
      else{
        setBookingsData([])
      }
    } catch (err) {
      console.log('Get Chat Booking Data Error', err);
    }
  };

  const sumUnreadCount = obj => {
    return Object.values(obj).reduce((acc, value) => acc + value, 0);
  };

  const getLabel = type => {
    if (type == 'cab') {
      if (Object.keys(unReadMsgData?.cabbookings).length > 0) {
        let total = sumUnreadCount(unReadMsgData?.cabbookings);
        return total > 0 ? `CAB ${total}` : `CAB`;
      }
      return `CAB`;
    } else {
      if (Object.keys(unReadMsgData?.hotelbookings).length > 0) {
        let total = sumUnreadCount(unReadMsgData?.hotelbookings);
        return total > 0 ? `HOTEL ${total}` : `HOTEL`;
      }
      return `HOTEL`;
    }
  };

  if (loadingCount) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: Colors.natural_white,
        }}>
        <ActivityIndicator size={'large'} color={Colors.classic_black} />
      </View>
    );
  }
  if (!unReadMsgData) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: Colors.natural_white,
        }}>
        <Text
          style={{
            color: Colors.classic_black,
            fontSize: 20,
            fontWeight: '600',
          }}>
          No Converstions Yet
        </Text>
      </View>
    );
  }
  const renderBadge=({id})=>{
     if(bookingType==="cab"){
      return <></>
     }
     else{
      return unReadMsgData["hotelbookings"][id]>0?<Badge size={30} style={styles.badge}>{unReadMsgData["hotelbookings"][id]}</Badge>:<></>
     }
  }
  const renderHotelView=(item)=>{
    return(
      <View style={{position:'relative'}}>
        
      <HotelCard navigation={navigation} data={item}/>
       {
        renderBadge(item)
       }
      </View>
    )
}
  return (
    <View style={{flex: 1}}>
      <View
        style={{
          width: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 10,
        }}>
        <View style={{width: '70%'}}>
          <SegmentedButtons
            density="regular"
            style={{paddingTop: 20, paddingBottom: 20}}
            value={bookingType}
            onValueChange={value => setBookingType(value)}
            theme={{
              colors: {
                secondaryContainer: Colors.classic_black,
                onSecondaryContainer: Colors.white,
              },
            }}
            buttons={[
              {
                value: 'cab',
                label: getLabel('cab'),
                icon: ({size, color}) => (
                  <Image
                    source={require('../../images/Cab.png')}
                    style={{width: size, height: size, tintColor: color}}
                  />
                ),
                labelStyle: styles.navTab,
                uncheckedColor: Colors.classic_black,
              },
              {
                value: 'hotel',
                label: getLabel('hotel'),
                icon: ({size, color}) => (
                  <Image
                    source={require('../../images/Hotel.png')}
                    style={{width: size, height: size, tintColor: color}}
                  />
                ),
                labelStyle: styles.navTab,
                uncheckedColor: Colors.classic_black,
              },
            ]}
          />
        </View>
      </View>
      <View style={{flex: 1, backgroundColor: bookingType==='cab'?Colors.white:Colors.gray500}}>
      <FlatList
        contentContainerStyle={{flexGrow: 1,paddingHorizontal:bookingType==='cab'?0:15,paddingTop:bookingType==='cab'?0:5}}
        //data={typeselectedNav==='Cab'?bookingData:tempbookingdata}
        data={bookingsData}
        keyExtractor={item => item.id.toString()}
        ItemSeparatorComponent={bookingType==='cab'?<></>:<View style={{height:15,width:'100%'}}></View>}
        renderItem={({item}) => {
          return(
            bookingType==='cab'?
            <></>:renderHotelView(item)
        )}}
        ListEmptyComponent={() =>
         
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No Conversations Yet</Text>
            </View>
          
        }
        // refreshControl={
        //   <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        // }
        // onEndReached={handleEndReached}
        onEndReachedThreshold={0.1}
      />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 10,
    backgroundColor: Colors.gray100,
    borderRadius: 50,
    width: '60%',
  },
  navTab: {
    fontFamily: Fonts.Default.SemiBold,
    // color: Colors.classic_black,
    fontSize: 14,
    fontWeight: '600',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    textAlign: 'center',
    color: Colors.classic_black,
  },
  badge:{
    position:'absolute',
    top:3,
    right:10,
    backgroundColor:Colors.primary,
    color:Colors.white
  }
});

export default ChatScreen;
