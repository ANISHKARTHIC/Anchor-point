import {PermissionsAndroid, Platform, Linking, Alert} from 'react-native';
import messaging from '@react-native-firebase/messaging';

export const requestNotificationPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      const permissionType = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
      const result = await PermissionsAndroid.request(permissionType);

      if (result === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      } else if (result === PermissionsAndroid.RESULTS.DENIED) {
        return false;
      } else if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        // showNotificationSettingsPrompt();
        return false;
      } else if (result === PermissionsAndroid.RESULTS.BLOCKED) {
        showNotificationSettingsPrompt();
        return false;
      } else {
        console.log('Unknown result:', result);
        return false;
      }
    } else {
      requestIOSUserPermission();
    }
  } catch (error) {
    console.warn('Error checking platform:', error);
  }
};
export const requestIOSUserPermission = async () => {
  const authorizationStatus = await messaging().requestPermission();
  if (authorizationStatus) {
    return true;
  } else {
    showNotificationSettingsPrompt();
    return false;
  }
};
export const showNotificationSettingsPrompt = () => {
  Alert.alert(
    'Enable Notifications',
    'To receive important updates, please enable notifications for this app.',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Open Settings',
        onPress: () => openNotificationSettings(),
      },
    ],
  );
};

const openNotificationSettings = () => {
  Linking.openSettings();
};
