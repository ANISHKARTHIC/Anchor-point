import {useEffect} from 'react';
import messaging from '@react-native-firebase/messaging';
import Toast from 'react-native-toast-message';

const useNotificationHandler = () => {
  useEffect(() => {
    const handleNotification = notificationData => {
      const bookingString = notificationData?.booking;
      const status = notificationData?.status;
      const bookingData = JSON.parse(bookingString);
      const bookingId = bookingData.bid;
      console.log("notificationData===>",notificationData)
      if (bookingId) {
        if(notificationData?.notification_type=="chat"){
          Toast.show({
            type: 'Message Received',
            text1: 'Message : ' + notificationData?.message,
            text2: 'For your ID : ' + bookingId,
          });
        }
        else{
          Toast.show({
            type: 'info',
            text1: 'Status : ' + getStatus(status,notificationData?.type),
            text2: 'For your ID : ' + bookingId,
          });
        }
        
      }
    };
    
    const handleTokenRefresh = newToken => {};

    const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
      handleNotification(remoteMessage.data);
    });

    const unsubscribeOnTokenRefresh = messaging().onTokenRefresh(newToken => {
      handleTokenRefresh(newToken);
    });
    const getStatus=(status,type)=>{
      if(type=='hotel'){
          if(status==="pending"){
            return "Pending - Oranganiser not assigned"
          }else if(status==='confirmed'){
            return "Booking Confirmed"
          }else if(status==='Declined'){
            return "Booking Declined"
          }else if(status==='cancelled'){
            return "Booking Cancelled"
          }else{
            return "Waiting for Confirmation"
          }
      }
      else{
        return status
      }
        
    }
    const checkInitialNotification = async () => {
      const initialNotification = await messaging().getInitialNotification();
      if (initialNotification) {
        handleNotification(initialNotification.data);
      }
    };

    checkInitialNotification();

    return () => {
      unsubscribeOnMessage();
      unsubscribeOnTokenRefresh();
    };
  }, []);
};

export default useNotificationHandler;
