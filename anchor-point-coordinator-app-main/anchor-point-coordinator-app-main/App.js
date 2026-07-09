import React,{useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import RootStack from './src/navigators/RootStack';
import {CabDataProvider} from './src/context/CabDataProvider';
import {FormDataProvider} from './src/context/FormDataProvider';
import {AppProvider} from './src/context/AppProvider';
import Toast from 'react-native-toast-message';
import {requestNotificationPermission} from './src/permissions/NotificationPermission';
import {View} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
const App = () => {

  //requestNotificationPermission();

  // return (
  //   <GestureHandlerRootView style={{flex:1,backgroundColor:'blue'}}>
  //   <View style={{flex: 1, backgroundColor: 'red', width: 100, height: 100}} />
  //   </GestureHandlerRootView>
  // );

  return (
    <AppProvider>
      <CabDataProvider>
        <FormDataProvider>
          <NavigationContainer navigationInChildEnabled>
            <RootStack />
          </NavigationContainer>
          <Toast/>
        </FormDataProvider>
      </CabDataProvider>
    </AppProvider>
  );
};

export default App;
