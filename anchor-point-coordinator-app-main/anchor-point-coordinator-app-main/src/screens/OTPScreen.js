import {StyleSheet, Text, TextInput, View} from 'react-native';
import {CommonActions} from '@react-navigation/native';

import GradientButton from '../components/GradientButton';
import Strings from '../constants/Strings';
import Fonts from '../theme/Fonts';
import Colors from '../theme/Colors';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useCallback, useRef, useState} from 'react';
import Clickable from '../components/Clickable';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faAngleLeft} from '@fortawesome/free-solid-svg-icons';
import ScreenNames from '../constants/ScreenNames';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Keys from '../constants/Keys';
import EndPoints from '../api/EndPoints';
import ApiRequest from '../api/ApiRequest';
import messaging from '@react-native-firebase/messaging';
import {handleFireBaseAuth} from '../utils/FirebaseUtil';
import auth from '@react-native-firebase/auth';

export default OTPScreen = ({route, navigation}) => {
  const [error, updateError] = useState(' ');

  const [loading, setLoading] = useState(false);

  const [code1, updateCode1] = useState('');
  const [code2, updateCode2] = useState('');
  const [code3, updateCode3] = useState('');
  const [code4, updateCode4] = useState('');
  const [code5, updateCode5] = useState('');
  const [code6, updateCode6] = useState('');

  const ref1 = useRef(null);
  const ref2 = useRef(null);
  const ref3 = useRef(null);
  const ref4 = useRef(null);
  const ref5 = useRef(null);
  const ref6 = useRef(null);

  const validate = useCallback(() => {
    let valid = code1 + code2 + code3 + code4 + code5 + code6;
    let pattern = /(?<!\d)\d{6}(?!\d)/g;
    return pattern.test(valid);
  }, [code1, code2, code3, code4, code5, code6]);

  const handleChange1 = useCallback(text => {
    updateCode1(text);
    updateError(' ');
    if (text.length) {
      ref2.current.focus();
    } else {
    }
  }, []);

  const handleChange2 = useCallback(text => {
    updateCode2(text);
    updateError(' ');
    if (text.length) {
      ref3.current.focus();
    } else {
      ref1.current.focus();
    }
  }, []);

  const handleChange3 = useCallback(text => {
    updateCode3(text);
    updateError(' ');
    if (text.length) {
      ref4.current.focus();
    } else {
      ref2.current.focus();
    }
  }, []);

  const handleChange4 = useCallback(text => {
    updateCode4(text);
    updateError(' ');
    if (text.length) {
      ref5.current.focus();
    } else {
      ref3.current.focus();
    }
  }, []);

  const handleChange5 = useCallback(text => {
    updateCode5(text);
    updateError(' ');
    if (text.length) {
      ref6.current.focus();
    } else {
      ref4.current.focus();
    }
  }, []);

  const handleChange6 = useCallback(text => {
    updateCode6(text);
    updateError(' ');
    if (!text.length) {
      ref5.current.focus();
    }
  }, []);

  const handleKeyPress2 = useCallback(e => {
    if (e.nativeEvent.key === 'Backspace') {
      ref1.current.focus();
    }
  }, []);
  const handleKeyPress3 = useCallback(e => {
    if (e.nativeEvent.key === 'Backspace') {
      ref2.current.focus();
    }
  }, []);
  const handleKeyPress4 = useCallback(e => {
    if (e.nativeEvent.key === 'Backspace') {
      ref3.current.focus();
    }
  }, []);
  const handleKeyPress5 = useCallback(e => {
    if (e.nativeEvent.key === 'Backspace') {
      ref4.current.focus();
    }
  }, []);

  const handleKeyPress6 = useCallback(e => {
    if (e.nativeEvent.key === 'Backspace') {
      ref5.current.focus();
    }
  }, []);

  const handleContinue = useCallback(() => {
    setLoading(true);

    const fetchData = async () => {
      try {
        const response = await ApiRequest({
          url: EndPoints.Validate,
          method: 'POST',
          data: {
            email: route?.params?.email,
            otp: code1 + code2 + code3 + code4 + code5 + code6,
          },
        });

        AsyncStorage.setItem(Keys.LOGGED_IN, 'true');
        AsyncStorage.setItem(Keys.TOKEN, response.access_token);
        AsyncStorage.setItem(Keys.ID, response.id.toString());

        if (response.name && response.mobile) {
          AsyncStorage.setItem(Keys.NAME, response.name);
          const formattedMobileNumber = response.mobile;
          console.log('formattedMobileNumber', formattedMobileNumber);

          AsyncStorage.setItem(Keys.PHONE, formattedMobileNumber);
        }

        getFCMToken();
        getFirebaseCustomToken(response);
      } catch (error) {
        updateError(error);
        setLoading(false);
      }
    };

    fetchData();
  }, [
    code1,
    code2,
    code3,
    code4,
    code5,
    code6,
    route,
    updateError,
    navigation,
  ]);
  const handleNavigation = response => {
    setLoading(false);
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name:
              response.name && response.mobile
                ? ScreenNames.SCREEN_HOME
                : ScreenNames.SCREEN_ONBOARD,
          },
          // {
          //   name:ScreenNames.SCREEN_ONBOARD
          // }
        ],
      }),
    );
  };
  const getFirebaseCustomToken = response => {
    const apiEndpoint = EndPoints.GetCustomToken;
    ApiRequest({
      url: apiEndpoint,
      method: 'POST',
    })
      .then(token => {
        console.log('firebase_access_token==>', token.firebase_access_token);
        // auth()
        // .signInWithCustomToken(token)
        // .then(user => {
        //   console.log("FireBase Auth Success",user)
        //   // resolve(user);
        // })
        // .catch(err => console.error("Error in Firebase Auth",err));
        handleFireBaseAuth(token.firebase_access_token)
          .then(() => {
            console.log('FireBase Auth Success');
          })
          .catch(err => {
            console.error('Error in Firebase Auth', err);
          });
      })
      .catch(err => {
        console.error('POST Custom Token Error', err);
      })
      .finally(() => {
        handleNavigation(response);
      });
  };
  const getFCMToken = async () => {
    try {
      let fcmToken = await messaging().getToken();
      console.log('fcmToken==>', fcmToken);
      const deviceType = Platform.OS === 'ios' ? 'ios' : 'android';
      if (fcmToken) {
        ApiRequest({
          url: EndPoints.FcmToken,
          method: 'POST',
          data: {
            fcm_token: fcmToken,
            device_type: deviceType,
          },
        })
          .then(response => {})
          .catch(error => {
            console.error('API Request Error:', error);
            updateError('An error occurred. Please try again.');
          });
      } else {
        console.error('FCM Token not available');
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <Clickable style={styles.back} onPress={navigation.goBack}>
        <FontAwesomeIcon icon={faAngleLeft} size={20} color={Colors.dark} />
      </Clickable>
      <Text style={styles.title}>{Strings.otp_verification}</Text>
      <Text style={styles.subtitle}>{Strings.otp_subtitle}</Text>
      <View style={styles.inputs}>
        <TextInput
          ref={ref1}
          maxLength={1}
          keyboardType="number-pad"
          onChangeText={handleChange1}
          cursorColor={Colors.dark}
          style={styles.input}
        />
        <TextInput
          ref={ref2}
          maxLength={1}
          keyboardType="number-pad"
          onChangeText={handleChange2}
          onKeyPress={handleKeyPress2}
          cursorColor={Colors.dark}
          style={styles.input}
        />
        <TextInput
          ref={ref3}
          maxLength={1}
          keyboardType="number-pad"
          onChangeText={handleChange3}
          onKeyPress={handleKeyPress3}
          cursorColor={Colors.dark}
          style={styles.input}
        />
        <TextInput
          ref={ref4}
          maxLength={1}
          keyboardType="number-pad"
          onChangeText={handleChange4}
          onKeyPress={handleKeyPress4}
          cursorColor={Colors.dark}
          style={styles.input}
        />
        <TextInput
          ref={ref5}
          maxLength={1}
          keyboardType="number-pad"
          onChangeText={handleChange5}
          onKeyPress={handleKeyPress5}
          cursorColor={Colors.dark}
          style={styles.input}
        />
        <TextInput
          ref={ref6}
          maxLength={1}
          keyboardType="number-pad"
          onChangeText={handleChange6}
          onKeyPress={handleKeyPress6}
          cursorColor={Colors.dark}
          style={styles.input}
        />
      </View>
      <Text style={styles.error}>{error}</Text>
      <GradientButton
        loading={loading}
        disabled={!validate()}
        label={Strings.verify}
        containerStyle={{marginVertical: 16, width: 250}}
        onClick={handleContinue}
        backgroundColors={[Colors.start, Colors.end]}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.natural_white,
  },
  error: {
    fontFamily: Fonts.Default.Regular,
    fontSize: 16,
    color: Colors.error,
    marginTop: 16,
    marginRight: 16,
    alignSelf: 'flex-end',
    lineHeight: 16,
  },
  title: {
    fontFamily: Fonts.Default.Bold,
    fontWeight: '700',
    fontSize: 24,
    color: Colors.gray700,
    marginTop: 32,
  },
  subtitle: {
    fontFamily: Fonts.Default.Regular,
    fontWeight: '600',
    fontSize: 16,
    color: Colors.gray500,
    marginVertical: 16,
    paddingHorizontal: 32,
    textAlign: 'center',
  },
  back: {
    height: 48,
    width: 48,
    alignSelf: 'flex-start',
    justifyContent: 'center',
  },
  inputs: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'space-evenly',
    marginVertical: 16,
  },
  input: {
    backgroundColor: Colors.gray100,
    height: 58,
    width: 54,
    borderRadius: 16,
    fontFamily: Fonts.Default.Bold,
    fontSize: 32,
    color: Colors.dark,
    textAlign: 'center',
  },
});
