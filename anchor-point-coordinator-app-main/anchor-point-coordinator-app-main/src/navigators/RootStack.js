import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import ScreenNames from '../constants/ScreenNames';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import OTPScreen from '../screens/OTPScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import CabSelectionScreen from '../screens/CabSelectionScreen';
import LandingScreen from '../screens/LandingScreen';
import FormScreen from '../screens/FormScreen';
import {ModalStackScreen} from '../screens/ModalStackScreen';
import MapComponent from '../screens/MapComponent';
import BookingsScreen from '../screens/BookingsScreen';
import BookingDetailsScreen from '../screens/BookingDetailsScreen';
import TimelineSnippet from '../components/TimelineSnippet';
import EventTimeline from '../screens/EventTimeline';
import EditAccountInfoScreen from '../screens/EditAccountInfoScreen';
import HotelFormScreen from '../screens/HotelFormScreen';
import HotelBookingReview from '../screens/HotelBookingReview';
import EmailCC from '../screens/EmailCC';
import ChatMessage from '../screens/ChatMessage';
import GuestListView from '../screens/GuestListView';
// import AccountsScreen from '../screens/AccountsScreen';

const Stack = createNativeStackNavigator();

export default RootStack = () => {
  return (
    <Stack.Navigator
      // initialRouteName={ScreenNames.SCREEN_SPLASH}
      // screenOptions={({ route }) => ({
      //   // Use the passed animationType prop to customize animations
      //   cardStyleInterpolator:
      //     route.params?.animationType === 'slide'
      //       ? CardStyleInterpolators.forHorizontalIOS
      //       : CardStyleInterpolators.forFadeFromBottomAndroid,
      //   gestureEnabled: false
      // })}
      screenOptions={{
        gestureEnabled: false,
      }}>
      <Stack.Screen
        name={ScreenNames.SCREEN_SPLASH}
        component={SplashScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenNames.SCREEN_LOGIN}
        component={LoginScreen}
        options={{
          animation: 'fade',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenNames.SCREEN_OTP}
        component={OTPScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenNames.SCREEN_ONBOARD}
        component={OnboardingScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenNames.SCREEN_HOME}
        component={LandingScreen}
        options={{
          headerShown: false,
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name={ScreenNames.SCREEN_GUESTS_LIST}
        component={GuestListView}
        options={{
          headerShown: false,
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name={ScreenNames.SCREEN_DETAILS}
        component={FormScreen}
        options={{
          headerShown: false,
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name={ScreenNames.SCREEN_HOTELFORM}
        component={HotelFormScreen}
        options={{
          headerShown: false,
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name={ScreenNames.SCREEN_HOTELBOOKINGREVIEW}
        component={HotelBookingReview}
        //  options={{
        //    headerShown: false,
        //    animation: 'fade',
        //  }}
        options={({route}) => ({
          //animation: route.params?.animation || '',
          headerShown: false,
        })}
      />
      <Stack.Screen
        name={ScreenNames.SCREEN_EMAILCC}
        component={EmailCC}
        options={{
          headerShown: false,
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name={ScreenNames.SCREEN_CHATMESSAGE}
        component={ChatMessage}
        options={{
          headerShown: false,
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name={ScreenNames.SCREEN_CAB}
        component={CabSelectionScreen}
        options={{
          headerShown: false,
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name={ScreenNames.SCREEN_MAP}
        component={MapComponent}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={ScreenNames.SCREEN_BOOKING}
        component={BookingsScreen}
        options={{
          headerShown: false,
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name={ScreenNames.SCREEN_BOOKINGDETAILS}
        component={BookingDetailsScreen}
        options={{
          headerShown: false,
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name="TimelineSnippet"
        component={TimelineSnippet}
        options={{
          headerShown: false,
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name="EventTimeline"
        component={EventTimeline}
        options={{
          headerShown: false,
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name="EditAccountInfoScreen"
        component={EditAccountInfoScreen}
        options={{
          headerShown: false,
          animation: 'fade',
        }}
      />
    </Stack.Navigator>
  );
};
