import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Platform,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import ReactNativePhoneInput from 'react-native-phone-input';
import Fonts from '../theme/Fonts';
import Colors from '../theme/Colors';

export default PhoneNumberInput = forwardRef(
  (
    {
      placeholder = '',
      initialCountry = 'in',
      initialValue = null,
      handlePhoneInput,
      type = '',
      textStyle,
      onError,
    },
    ref,
  ) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const phoneInputRef = useRef();
    const testInputRef = useRef();
    useImperativeHandle(ref, () => ({
      clear() {
        setPhoneNumber('');
        phoneInputRef.current.setValue(phoneInputRef.current.getCountryCode());
      },
      setValue() {
        setPhoneNumber('');
        phoneInputRef.current.setValue(initialValue);
      },
    }));
    useEffect(() => {
      if (phoneNumber) {
        const timeoutId = setTimeout(() => {
          if (phoneInputRef.current.isValidNumber()) {
            handlePhoneInput(phoneNumber);
          } else {
            onError();
          }
        }, 1000);
        return () => {
          clearTimeout(timeoutId);
        };
      }
    }, [phoneNumber]);

    const onPhoneInputChange = (value, iso2) => {
      setPhoneNumber(value);
    };
    return (
      <ReactNativePhoneInput
        ref={phoneInputRef}
        //initialValue={initialValue}
        initialCountry={initialCountry}
        textProps={{
          ref: {testInputRef},
        }}
        style={{flex: 1}}
        onChangePhoneNumber={onPhoneInputChange}
        textStyle={styles.editText}
        cancelTextStyle={{color: Colors.error}}
        confirmTextStyle={{color: Colors.natural_white}}
        pickerBackgroundColor={Colors.gray500}
      />
    );
  },
);

const styles = StyleSheet.create({
  editText: {
    fontFamily: Fonts.Default.Regular,
    fontSize: 16,
    color: Colors.dark,
    fontWeight: 'normal',
    padding: 0,
    flex: 1,
  },
});
