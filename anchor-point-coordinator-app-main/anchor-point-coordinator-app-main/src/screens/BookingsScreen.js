import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  RefreshControl,
  Image,
  TouchableOpacity,
} from 'react-native';

import Fonts from '../theme/Fonts';
import Colors from '../theme/Colors';
import {Card} from '../components/Card';
import ApiRequest from '../api/ApiRequest';
import EndPoints from '../api/EndPoints';
import AsyncStorage from '@react-native-async-storage/async-storage';
import usePushNotifications from '../hooks/usePushNotification';
import {SegmentedButtons} from 'react-native-paper';
import HotelCard from '../components/HotelCard';
import moment from 'moment';

export default BookingsScreen = ({navigation, route}) => {
  const {booking_type, booking_period, selected_page} = route?.params ?? {};
  const [currentPage, setCurrentPage] = useState(
    selected_page != null ? selected_page : 1,
  );
  const [refreshCurrent, refreshCurrentPage] = useState(1);

  const [moreDataAvailable, setMoreDataAvailable] = useState(true);
  const [selectedNav, setSelectedNav] = useState(
    booking_period != null ? booking_period : 'UPCOMING',
  );
  const [typeselectedNav, setTypeSelectedNav] = useState(
    booking_type != null ? booking_type : 'Cab',
  );
  const [bookingData, setBookingData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  usePushNotifications(notificationData => {
    const bookingString = notificationData?.booking;
    const bookingData = JSON.parse(bookingString);
    const updatedBookingId = bookingData.bid;

    setBookingData(prevData => {
      const updatedData = prevData.map(booking =>
        booking.id === updatedBookingId
          ? {...booking, status: notificationData.status}
          : booking,
      );

      return updatedData;
    });
  });

  const handleNavClick = nav => {
    //console.log("handleNAv",nav)
    setCurrentPage(1);
    setSelectedNav(nav);
    setMoreDataAvailable(true);
  };
  const handleTypeTabClick = type => {
    setBookingData([]);
    setCurrentPage(1);
    setSelectedNav('UPCOMING');
    setTypeSelectedNav(type);
    setMoreDataAvailable(true);
  };
  const formatDate = date => {
    const formattedDate = `${date.getDate()}-${
      date.getMonth() + 1
    }-${date.getFullYear()}`;
    const formattedTime = `${date.getHours().toString().padStart(2, '0')}:${date
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
    return {formattedDate, formattedTime};
  };

  const constructApiUrl = (
    storedId,
    currentPage,
    selectedNav,
    formattedDate,
    formattedTime,
  ) => {
    let tempApiURl =
      typeselectedNav === 'Cab'
        ? EndPoints.Bookings
        : EndPoints.GetHotelBooking;
    let apiUrl =
      typeselectedNav === 'Cab'
        ? `${tempApiURl}bookings?page=${currentPage}&booking_event_type=${selectedNav}`
        : `${tempApiURl}?page=${currentPage}&${
            selectedNav === 'UPCOMING'
              ? 'check_out_date_gte'
              : 'check_out_date_lte'
          }=${moment().format('DD-MM-YYYY')}`;

    // console.log("storedId==>",storedId)
    // if (selectedNav === 'UPCOMING') {
    //   apiUrl += `&pickup_start_date=${formattedDate} ${formattedTime}`;
    // } else if (selectedNav === 'COMPLETED') {
    //   apiUrl += `&pickup_end_date=${formattedDate} ${formattedTime}`;
    // }
    console.log('apiUrl', apiUrl);
    return apiUrl;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    refreshCurrentPage(prevPage => prevPage + 1);

    try {
      const storedId = await AsyncStorage.getItem(Keys.ID);
      // const token = await AsyncStorage.getItem(Keys.TOKEN)
      // console.log("token==>",token,storedId)
      const currentDate = new Date();
      //const {formattedDate, formattedTime} = formatDate(currentDate);
      let apiUrl = constructApiUrl(storedId, 1, selectedNav);

      const response = await ApiRequest({
        url: apiUrl,
        method: 'GET',
      });
      if (
        response.bookings &&
        Array.isArray(response.bookings) &&
        response.bookings.length > 0
      ) {
        setBookingData([...response.bookings]);
        // setBookingData(prevData => {
        //   const newData = response.bookings.filter(
        //     newItem => !prevData.some(prevItem => prevItem.id === newItem.id),
        //   );
        //   return [...newData, ...prevData];
        // });
        refreshCurrentPage(prevPage => prevPage + 1);
      } else {
        setMoreDataAvailable(false);
      }
    } catch (error) {
      console.error('Booking request error', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleEndReached = () => {
    setCurrentPage(prevPage => prevPage + 1);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!moreDataAvailable) {
        return;
      }
      setIsLoading(true);

      try {
        const storedId = await AsyncStorage.getItem(Keys.ID);
        const token = await AsyncStorage.getItem(Keys.TOKEN);
        console.log('token==>', token, storedId);
        //const {formattedDate, formattedTime} = formatDate(new Date());
        let apiUrl = constructApiUrl(storedId, currentPage, selectedNav);

        const response = await ApiRequest({
          url: apiUrl,
          method: 'GET',
        });
        // console.log('Effect=>', response);
        setBookingData(prevData => {
          if (currentPage === 1) {
            return response.bookings;
          } else {
            const newData = response.bookings.filter(
              newItem => !prevData.some(prevItem => prevItem.id === newItem.id),
            );
            return [...prevData, ...newData];
          }
        });

        if (
          !(
            response.bookings &&
            Array.isArray(response.bookings) &&
            response.bookings.length > 0
          )
        ) {
          setMoreDataAvailable(false);
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentPage, selectedNav, typeselectedNav]);

  const renderHotelView = item => {
    return <HotelCard navigation={navigation} data={item} />;
  };
  return (
    <View
      style={{
        flex: 1,
        backgroundColor:
          typeselectedNav === 'Cab' ? Colors.white : Colors.gray500,
        width: '100%',
      }}>
      <View style={styles.navContainer}>
        <View
          style={{
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Text style={styles.title}>Booking History</Text>
        </View>
        {/* Tabs */}
        <View style={styles.typenavContainer}>
          <View style={styles.navTabs}>
            <TouchableOpacity
              onPress={() => handleTypeTabClick('Cab')}
              activeOpacity={0.8}
              style={[
                styles.typenavTabContainer,
                [
                  styles.typenavTab,
                  typeselectedNav === 'Cab' && styles.typeselectedNavTab,
                ],
              ]}>
              <Image
                source={require('../../images/Cab.png')}
                style={[
                  styles.image,
                  {
                    tintColor:
                      typeselectedNav === 'Cab'
                        ? Colors.natural_white
                        : Colors.classic_black,
                  },
                ]}
              />
              <Text
                style={[
                  typeselectedNav === 'Cab' && styles.typeselectedNavTab,
                  styles.text,
                  {
                    color:
                      typeselectedNav === 'Cab'
                        ? Colors.natural_white
                        : Colors.classic_black,
                  },
                ]}
                onPress={() => handleTypeTabClick('Cab')}>
                Cab
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleTypeTabClick('Hotel')}
              activeOpacity={0.8}
              style={[
                styles.typenavTabContainer,
                [
                  styles.typenavTab,
                  typeselectedNav === 'Hotel' && styles.typeselectedNavTab,
                ],
              ]}>
              <Image
                source={require('../../images/Hotel.png')}
                style={[
                  styles.image,
                  {
                    tintColor:
                      typeselectedNav === 'Hotel'
                        ? Colors.natural_white
                        : Colors.classic_black,
                  },
                ]}
              />
              <Text
                style={[
                  typeselectedNav === 'Hotel' && styles.typeselectedNavTab,
                  styles.text,
                  {
                    color:
                      typeselectedNav === 'Hotel'
                        ? Colors.natural_white
                        : Colors.classic_black,
                  },
                ]}
                onPress={() => handleTypeTabClick('Hotel')}>
                Hotel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View
          style={{
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 10,
          }}>
          <SegmentedButtons
            density="regular"
            style={{paddingVertical: 10}}
            value={selectedNav}
            onValueChange={value => handleNavClick(value)}
            theme={{
              colors: {
                secondaryContainer: Colors.classic_black,
                onSecondaryContainer: Colors.white,
              },
            }}
            buttons={
              typeselectedNav === 'Cab'
                ? [
                    {
                      value: 'UPCOMING',
                      label: 'UPCOMING',
                      labelStyle: styles.navTab,
                      uncheckedColor: Colors.classic_black,
                    },
                    {
                      value: 'ONGOING',
                      label: 'ONGOING',
                      labelStyle: styles.navTab,
                      uncheckedColor: Colors.classic_black,
                    },
                    {
                      value: 'COMPLETED',
                      label: 'COMPLETED',
                      labelStyle: styles.navTab,
                      uncheckedColor: Colors.classic_black,
                    },
                  ]
                : [
                    {
                      value: 'UPCOMING',
                      label: 'UPCOMING',
                      labelStyle: styles.navTab,
                      uncheckedColor: Colors.classic_black,
                    },
                    {
                      value: 'COMPLETED',
                      label: 'COMPLETED',
                      labelStyle: styles.navTab,
                      uncheckedColor: Colors.classic_black,
                    },
                  ]
            }
          />
        </View>
      </View>

      <FlatList
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: typeselectedNav === 'Cab' ? 0 : 15,
          paddingTop: typeselectedNav === 'Cab' ? 0 : 5,
        }}
        //data={typeselectedNav==='Cab'?bookingData:tempbookingdata}
        data={bookingData}
        keyExtractor={item => item.id.toString()}
        ItemSeparatorComponent={
          typeselectedNav === 'Cab' ? (
            <></>
          ) : (
            <View style={{height: 15, width: '100%'}}></View>
          )
        }
        renderItem={({item}) => {
          return typeselectedNav === 'Cab' ? (
            <Card
              navigation={navigation}
              id={item.id}
              cab_type={item.cab_type}
              date={item.pickup_date}
              time={item.pickup_time}
              status={item.status}
              type={item.type}
              isLoading={isLoading}
              booking_id={item.bid}
              poNumber={item.po_number}
              setBookingData={setBookingData}
            />
          ) : (
            renderHotelView(item)
          );
        }}
        ListEmptyComponent={() =>
          !isLoading && !moreDataAvailable ? (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No bookings available</Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.1}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontFamily: Fonts.Default.Bold,
    fontSize: 22,
    fontWeight: '600',
    color: Colors.classic_black,
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
  navContainer: {
    // height: 100,
    backgroundColor: Colors.natural_white,
    paddingTop: 10,
    width: '100%',
  },
  typenavContainer: {
    height: 60,
    backgroundColor: Colors.natural_white,
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  navTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 10,
    backgroundColor: Colors.gray100,
    borderRadius: 50,
    width: '60%',
  },
  typenavTabContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: 40,
    overflow: 'hidden',
  },
  typenavTab: {
    fontFamily: Fonts.Default.SemiBold,
    color: Colors.classic_black,
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: Colors.gray100,
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },

  typeselectedNavTab: {
    backgroundColor: Colors.classic_black,
    color: Colors.natural_white,
  },
  image: {
    width: 25,
    height: 25,
  },
  navTab: {
    fontFamily: Fonts.Default.SemiBold,
    // color: Colors.classic_black,
    fontSize: 14,
    fontWeight: '600',
  },

  selectedNavTab: {
    backgroundColor: Colors.classic_black,
    color: Colors.natural_white,
  },
  // text: {
  //   fontFamily: Fonts.Default.SemiBold,
  //   fontSize: 14,
  //   fontWeight: '700',
  // },
});
