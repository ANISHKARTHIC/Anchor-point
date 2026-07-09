import React, {useCallback, useEffect, useRef, useState} from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';
import Colors from '../theme/Colors';
import Fonts from '../theme/Fonts';
import {SafeAreaView} from 'react-native-safe-area-context';
import Strings from '../constants/Strings';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faMobileScreenButton, faUser} from '@fortawesome/free-solid-svg-icons';

import {screenWidth} from '../utils/Dimensions';
import ScreenNames from '../constants/ScreenNames';
import {CommonActions} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Keys from '../constants/Keys';
import ApiRequest from '../api/ApiRequest';
import EndPoints from '../api/EndPoints';
import PhoneNumberInput from '../components/PhoneNumberInput';

export default OnboardingScreen = ({navigation}) => {
  const [name, updateName] = useState('');
  const [phone, updatePhone] = useState('');
  const [error, updateError] = useState(' ');
  const [loading, setLoading] = useState(false);

  const [disableNext,setDisableNext] = useState(true)
  const [invalidNumberError, setinvalidNumberError] = useState(false);
  const phoneComponentRef = useRef();

  const handleNameChange = useCallback(text => {
    updateError(' ');
    updateName(text);
  }, []);

  const handlePhoneChange = useCallback(text => {
    updateError(' ');
    updatePhone(text);
  }, []);

  const handleContinue = useCallback(() => {
    setLoading(true);
    ApiRequest({
      url: EndPoints.Details,
      method: 'PUT',
      data: {
        name,
        mobile: phone,
      },
    })
      .then(() => {
        AsyncStorage.setItem(Keys.NAME, name);
        AsyncStorage.setItem(Keys.PHONE, phone);
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: ScreenNames.SCREEN_HOME}],
          }),
        );
      })
      .catch(error => {
        console.error('API Request Error:', error);
        updateError('An error occurred. Please try again.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [name, phone]);
  const handlePhoneInputError = () => {
    setinvalidNumberError(true);
    setDisableNext(true)
  };
  const handlePhoneInputValue = phoneNumber => {
    setinvalidNumberError(false);
    setDisableNext(false)
    handlePhoneChange(phoneNumber)
  };
  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.title}>{Strings.get_started}</Text>
      <Text style={styles.subtitle}>{Strings.fill_details}</Text>
      <View style={styles.editBox}>
        <FontAwesomeIcon size={18} icon={faUser} color={Colors.gray700} />
        <TextInput
          style={styles.editText}
          placeholder={Strings.full_name}
          placeholderTextColor={Colors.gray500}
          onChangeText={handleNameChange}
        />
      </View>

      <View style={styles.editBox}>
        <FontAwesomeIcon icon={faMobileScreenButton} style={{marginRight:4}} size={18} />
        <PhoneNumberInput
           ref={phoneComponentRef}
           placeholder={Strings.phone_number}
           initialCountry={'in'}
           initialValue={phone}
           type={'cab'}
           onError={handlePhoneInputError}
           handlePhoneInput={handlePhoneInputValue}
        />
        {/* <TextInput
          style={styles.editText}
          value={phone}
          placeholder={Strings.phone_number}
          placeholderTextColor={Colors.gray500}
          onChangeText={handlePhoneChange}
        /> */}
      </View>
      {invalidNumberError && (
            <Text style={styles.error}>{'Invalid Number'}</Text>
          )}
      <Text style={styles.error}>{error}</Text>
      <GradientButton
        loading={loading}
        disabled={name.length < 3 || disableNext }
        label={Strings.continue}
        containerStyle={{marginVertical: 16, width: 300}}
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
    marginTop: 80,
  },
  subtitle: {
    fontFamily: Fonts.Default.Regular,
    fontWeight: '600',
    fontSize: 16,
    color: Colors.gray500,
    marginVertical: 16,
  },
  editBox: {
    flexDirection: 'row',
    backgroundColor: Colors.gray100,
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: 16,
    height: 58,
    padding: 16,
    marginVertical: 16,
    width: screenWidth - 32,
  },
  editText: {
    fontFamily: Fonts.Default.Regular,
    flex: 1,
    fontSize: 16,
    color: Colors.dark,
    fontWeight: 'normal',
    padding: 0,
    marginLeft: 16,
  },
  mobileField: {
    backgroundColor: Colors.gray100,
    width: screenWidth - 32,
    height: 58,
    borderRadius: 16,
  },
  
});
