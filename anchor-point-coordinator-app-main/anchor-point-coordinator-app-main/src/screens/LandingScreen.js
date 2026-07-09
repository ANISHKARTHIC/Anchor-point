import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Image,
  View,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Fonts from '../theme/Fonts';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import CabSelectionScreen from './CabSelectionScreen';
import CabBookingScreen from '../components/CabBookingView';
import HomeScreen from './HomeScreen';
import Colors from '../theme/Colors';
import BookingsScreen from './BookingsScreen';
import AccountsScreen from './AccountsScreen';
import TimelineSnippet from '../components/TimelineSnippet';
import ChatScreen from './ChatScreen';
import useUnreadCount from '../hooks/useUnreadCount';
import ApiRequest from '../api/ApiRequest';
import EndPoints from '../api/EndPoints';
import GuestListView from './GuestListView';
import FormScreen from './FormScreen';
import moment from 'moment';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabIcon = ({imageSource, selected, onPress}) => {
  return (
    <TouchableOpacity onPress={onPress} style={{alignItems: 'center'}}>
      <Image
        source={imageSource}
        style={{tintColor: selected ? Colors.start : null}}
      />
    </TouchableOpacity>
  );
};

export default LandingScreen = ({navigation}) => {
  const [selectedTab, setSelectedTab] = useState('Home');
  const {unReadMsgData} = useUnreadCount();
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  useEffect(() => {
    handleUnreadCount();
  }, [unReadMsgData]);

  const handleUnreadCount = () => {
    setTotalUnreadCount(
      unReadMsgData != null ? unReadMsgData.totalUnreadCount : 0,
    );
  };
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: Colors.white,
      }}
      edges={['top']}>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            height: Platform.OS === 'ios' ? 70 : 45,
          },
          tabBarLabelStyle: {
            fontFamily: Fonts.Default.Regular,
            fontSize: 12,
            fontWeight: '600',
          },
        }}>
        <Tab.Screen
          name="Home"
          component={HomeStackScreen}
          options={({route}) => ({
            header: () => (
              <CustomHeader navigation={navigation} route={route} />
            ),
            tabBarIcon: ({focused}) => (
              <TabIcon
                imageSource={require('../../images/Explore.png')}
                selected={selectedTab === 'Home'}
                onPress={() => {
                  setSelectedTab('Home');
                  navigation.navigate('Home');
                }}
              />
            ),
            tabBarLabel: 'Home',
            tabBarPress: () => setSelectedTab('Home'),
            tabBarAccessibilityLabel: 'Navigate to Home',
          })}
        />
        <Tab.Screen
          name="Bookings"
          component={BookingStackScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({focused}) => (
              <TabIcon
                imageSource={require('../../images/Calendar.png')}
                selected={selectedTab === 'Bookings'}
                onPress={() => {
                  setSelectedTab('Bookings');
                  navigation.navigate('Bookings');
                }}
              />
            ),
            tabBarLabel: 'Bookings',
            tabBarPress: () => setSelectedTab('Bookings'),
            tabBarAccessibilityLabel: 'Navigate to Bookings',
          }}
        />
        <Tab.Screen
          name="Messages"
          component={ChatStackScreen}
          options={{
            header: () => <CustomHeader navigation={navigation} />,
            tabBarIcon: ({focused}) => (
              <TabIcon
                imageSource={require('../../images/Message_icon.png')}
                selected={selectedTab === 'Messages'}
                onPress={() => {
                  setSelectedTab('Messages');
                  navigation.navigate('Messages');
                }}
              />
            ),
            tabBarBadge: totalUnreadCount > 0 ? totalUnreadCount : null,
            tabBarLabel: 'Messages',
            tabBarPress: () => setSelectedTab('Messages'),
            tabBarAccessibilityLabel: 'Navigate to Accounts',
          }}
        />
        <Tab.Screen
          name="Accounts"
          component={AccountStackScreen}
          options={{
            header: () => <CustomHeader navigation={navigation} />,
            tabBarIcon: ({focused}) => (
              <TabIcon
                imageSource={require('../../images/User.png')}
                selected={selectedTab === 'Accounts'}
                onPress={() => {
                  setSelectedTab('Accounts');
                  navigation.navigate('Accounts');
                }}
              />
            ),
            tabBarLabel: 'Accounts',
            tabBarPress: () => setSelectedTab('Accounts'),
            tabBarAccessibilityLabel: 'Navigate to Accounts',
          }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
};

function HomeStackScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="GuestListScreen"
        component={GuestListView}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CabBookingScreen"
        component={CabBookingScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="CabSelectionScreen"
        component={CabSelectionScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="FormScreen"
        component={FormScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

function BookingStackScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="BookingsScreen"
        component={BookingsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="TimelineSnippet"
        component={TimelineSnippet}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

function AccountStackScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AccountsScreen"
        component={AccountsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EditAccountInfoScreen"
        component={EditAccountInfoScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

function ChatStackScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

function CustomHeader({navigation, route}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: Colors.white,
      }}>
      <Image
        source={require('../../images/logo_colored.png')}
        style={{width: 150, height: 50, resizeMode: 'contain'}}
      />
    </View>
  );
}
