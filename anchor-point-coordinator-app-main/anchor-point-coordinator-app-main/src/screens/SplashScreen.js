import React, {useCallback, useEffect, useState} from 'react';
import {Image, ImageBackground, StatusBar, StyleSheet,Platform,Text} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import ScreenNames from '../constants/ScreenNames';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Keys from '../constants/Keys';
import messaging from '@react-native-firebase/messaging';
import {useNavigation, useRoute} from '@react-navigation/native';

const LOGO = require('../../images/logo.png');
const ANCHOR_POINT = require('../../images/anchorpoint.png');
const BG = require('../../images/splash_bg.png');

const SplashScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [notificationHandled, setNotificationHandled] = useState(false);
  const [notify, setisNotify] = useState(false);

  const handleNotification = useCallback(
    notificationData => {
      const bookingString = notificationData?.booking;
      const bookingData = JSON.parse(bookingString);
      const bookingId = bookingData.bid;
      const status = notificationData?.status;
      setisNotify(true);
      if(bookingId&&notificationData?.notification_type=='chat'){
        navigation.navigate(ScreenNames.SCREEN_HOME);
        navigation.navigate(ScreenNames.SCREEN_CHATMESSAGE,{
          bookingDetails:bookingData,
          bookingType:"hotel"
        })
      }
      else if (bookingId&&notificationData?.type=='hotel') {
        navigation.navigate(ScreenNames.SCREEN_HOME);
        navigation.navigate(ScreenNames.SCREEN_HOTELBOOKINGREVIEW,{
          screenName:'BookingList',
          bookingDetails:{hotelBookingDetails:{...bookingData}}
        })
      }
      else{
        navigation.navigate(ScreenNames.SCREEN_HOME);
        navigation.navigate(ScreenNames.SCREEN_BOOKINGDETAILS, {
          bookingId: bookingId,
          status: status,
        });
      }
      setNotificationHandled(true);
    },
    [navigation],
  );

  useEffect(() => {
    const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
      handleNotification(remoteMessage.data);
    });
    const unsubscribeOnOpen = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log("onNotificationOpenedApp-->",remoteMessage)
    });
    const checkInitialNotification = async () => {
      const initialNotification = await messaging().getInitialNotification();
      if (initialNotification) {
        handleNotification(initialNotification.data);
      }
      setNotificationHandled(true);
    };
   
    checkInitialNotification();

    return () => {
      unsubscribeOnMessage();
      unsubscribeOnOpen();
    };
  }, []);

  const gotoScreen = async () => {
    try {
      const data = await AsyncStorage.multiGet([
        Keys.LOGGED_IN,
        Keys.NAME,
        Keys.PHONE,
      ]);
      const loggedIn = data[0][1] === 'true';
      const name = data[1][1];
      const phone = data[2][1];

      if (loggedIn) {
        if (name != null && phone != null) {
          const notificationData = route.params?.notificationData;
          const notificationRoute = notificationData
            ? ScreenNames.SCREEN_BOOKINGDETAILS
            : ScreenNames.SCREEN_BOOKING;

          if (notify === false) {
            navigation.replace(ScreenNames.SCREEN_HOME);
          }
        } else {
          navigation.replace(ScreenNames.SCREEN_ONBOARD);
        }
      } else {
        navigation.replace(ScreenNames.SCREEN_LOGIN);
      }
    } catch (error) {
      console.error('Error in gotoScreen:', error);
    }
  };

  useEffect(() => {
    if (notificationHandled) {
      Platform.OS === 'android'
        ? setTimeout(() => {
            gotoScreen();
          }, 2000)
        : gotoScreen();
    }
  }, [notificationHandled]);

  return (
    <ImageBackground style={styles.root} source={BG}>
      <StatusBar barStyle={'light-content'} />
      <Image source={LOGO} style={styles.image} />
      <SafeAreaView edges={['bottom']} style={styles.logo}>
        <Text>sfsdffdsdf</Text>
        <Image source={ANCHOR_POINT} style={{marginBottom: 20}} />
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
});

export default SplashScreen;
