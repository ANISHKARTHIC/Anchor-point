import {useEffect} from 'react';
import messaging from '@react-native-firebase/messaging';

const usePushNotifications = (handleNotification, handleTokenRefresh) => {
  useEffect(() => {
    const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
      handleNotification(remoteMessage.data);
    });

    const unsubscribeOnTokenRefresh = messaging().onTokenRefresh(newToken => {
      handleTokenRefresh(newToken);
    });

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
  }, [handleNotification, handleTokenRefresh]);
};

export default usePushNotifications;
