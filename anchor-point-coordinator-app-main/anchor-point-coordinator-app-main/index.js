// /**
//  * @format
//  */
console.log('INDEX LOADED');
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
/**
 * @format
 */
// import { AppRegistry } from 'react-native';
// import { name as appName } from './app.json';

// let RootComponent;

// try {
//   console.log('🔵 Bootstrapping app...');
//   RootComponent = require('./App').default; // force load App.js
//   console.log('✅ App module loaded successfully');
// } catch (e) {
//   console.error('🔥 Failed to load App.js:', e);
//   // fallback UI so it doesn’t stay black
//   const { Text, View } = require('react-native');
//   RootComponent = () => (
//     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//       <Text>App failed to load. Check console logs.</Text>
//     </View>
//   );
// }

// AppRegistry.registerComponent(appName, () => RootComponent);



//import './require-logger';  // must be first line

// import { AppRegistry } from 'react-native';
// import App from './App';
// import { name as appName } from './app.json';

// AppRegistry.registerComponent(appName, () => App);