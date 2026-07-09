import React, {useState, useRef, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import Colors from '../theme/Colors';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faClockRotateLeft} from '@fortawesome/free-solid-svg-icons';
import Fonts from '../theme/Fonts';
import {
  faCalendarCheck,
  faCircleXmark,
  faHourglassHalf,
} from '@fortawesome/free-regular-svg-icons';
import moment from 'moment';
import ScreenNames from '../constants/ScreenNames';
import {useFormData} from '../context/FormDataProvider';
import HotelStatusCategories from '../constants/HotelStatusCategories';

export default HotelCard = ({data, navigation}) => {
  const {
    status,
    bid,
    check_in,
    check_out,
    no_of_rooms,
    no_of_adults,
    no_of_children,
    trip_type,
    city,
  } = data;

  const {clearFormData} = useFormData();

  const getStatus = () => {
    let icons = null;
    let icon_colors = '';
    let statusText = '';

    if (HotelStatusCategories.AWAITING_APPROVAL.includes(status)) {
      icons = faClockRotateLeft;
      icon_colors = 'red';
      statusText = 'Pending - Organizer not assigned';
    } else if (HotelStatusCategories.CANCELLED.includes(status)) {
      icons = faCircleXmark;
      icon_colors = 'red';
      statusText = 'Cancelled';
    } else if (HotelStatusCategories.CONFIRMED.includes(status)) {
      icons = faCalendarCheck;
      icon_colors = 'orange';
      statusText = 'Booking Confirmed';
    } else if (HotelStatusCategories.INVOICE_ACTIONS.includes(status)) {
      icons = faHourglassHalf;
      icon_colors = 'orange';
      statusText = 'Waiting for Invoice Generation';
    } else if (HotelStatusCategories.COMPLETED.includes(status)) {
      icons = faCalendarCheck;
      icon_colors = 'green';
      statusText = 'Booking Completed';
    } else {
      icons = faHourglassHalf;
      icon_colors = 'red';
      statusText = 'Pending - Organizer not assigned';
    }

    return (
      <View style={{flexDirection: 'row', gap: 10, alignItems: 'center'}}>
        <FontAwesomeIcon color={icon_colors} icon={icons}></FontAwesomeIcon>
        <Text style={styles.statustext}>{statusText}</Text>
      </View>
    );
  };

  const getDatesFormat = date => {
    var tempDate = moment(date, 'DD-MM-YYYY');
    return moment(tempDate).format('DD MMM YYYY');
  };

  return (
    <View
      style={[
        styles.box,
        {
          borderRadius: 5,
          backgroundColor: '#fff',
          width: '100%',
        },
      ]}>
      <TouchableOpacity
        style={{}}
        onPress={() => {
          clearFormData();
          navigation.navigate(ScreenNames.SCREEN_HOTELBOOKINGREVIEW, {
            screenName: 'BookingList',
            bookingDetails: {hotelBookingDetails: {...data}},
            editable: true,
          });
        }}>
        <View
          style={{
            paddingLeft: 20,
            paddingBottom: 10,
            paddingTop: 10,
            paddingRight: 20,
          }}>
          <Text style={styles.bookingIdText}>{bid}</Text>
          <Text style={styles.bookingCityText}>{city}</Text>
          <View
            style={{
              paddingTop: 5,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <Text style={styles.subtitletext}>{getDatesFormat(check_in)}</Text>
            <Text style={styles.subtitletext}>{'-'}</Text>
            <Text style={styles.subtitletext}>{getDatesFormat(check_out)}</Text>
          </View>
          <View
            style={{
              paddingTop: 5,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <View>
              <Text style={styles.subTitle}>
                {no_of_rooms} {no_of_rooms > 1 ? 'Rooms' : 'Room'}
              </Text>
              <Text style={styles.subTitle}>
                {no_of_adults} {no_of_adults > 1 ? 'Adults' : 'Adult'}{' '}
                {no_of_children > 0 && (
                  <Text>
                    {','} {no_of_children}{' '}
                    {no_of_children > 1 ? 'Children' : 'Child'}
                  </Text>
                )}
              </Text>
            </View>
            <View>
              <Text style={styles.subTitle}>{trip_type}</Text>
            </View>
          </View>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <View
            style={[
              styles.circle,
              {left: -10, transform: [{rotate: '90deg'}]},
            ]}></View>
          <View style={styles.dashedline}></View>
          <View
            style={[
              styles.circle,
              {right: -10, transform: [{rotate: '-90deg'}]},
            ]}></View>
        </View>
        <View style={{paddingLeft: 20, paddingBottom: 15, paddingTop: 5}}>
          {getStatus()}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  circle: {
    width: 20,
    height: 26,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopStartRadius: 20,
    borderTopEndRadius: 20,
    backgroundColor: Colors.gray500,
  },
  dashedline: {
    flex: 1,
    width: '100%',
    borderColor: Colors.gray500,
    borderStyle: 'dashed',
    borderWidth: 1,
  },
  statustext: {
    fontFamily: Fonts.Default.SemiBold,
    fontSize: 18,
    color: Colors.classic_black,
    fontWeight: '500',
  },
  bookingIdText: {
    fontFamily: Fonts.Default.Bold,
    fontSize: 22,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  bookingCityText: {
    fontFamily: Fonts.Default.Bold,
    fontSize: 20,
    color: Colors.classic_black,
    fontWeight: 'bold',
  },
  subtitletext: {
    fontFamily: Fonts.Default.Bold,
    fontSize: 18,
    color: Colors.black,
    fontWeight: '600',
  },
  subTitle: {
    fontFamily: Fonts.Default.Regular,
    fontSize: 14,
    color: Colors.gray500,
  },
});
