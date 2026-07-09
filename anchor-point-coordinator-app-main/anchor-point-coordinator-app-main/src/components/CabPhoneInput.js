import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import ReactNativePhoneInput from 'react-native-phone-input';
import {StyleSheet} from 'react-native';
import Fonts from '../theme/Fonts';
import Colors from '../theme/Colors';

const PhoneNumberInput = forwardRef(
  (
    {
      placeholder = '',
      initialCountry = 'in',
      initialValue = '',
      handlePhoneInput,
      disabled,
      onError,
    },
    ref,
  ) => {
    const [phoneNumber, setPhoneNumber] = useState(initialValue); // Initialize with initialValue
    const phoneInputRef = useRef();

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      clear() {
        setPhoneNumber(''); // Clear state
        phoneInputRef.current?.setValue(
          phoneInputRef.current?.getCountryCode(),
        ); // Reset to country code
      },
      setValue(value) {
        setPhoneNumber(value); // Update state
        phoneInputRef.current?.setValue(value); // Set input value
      },
    }));

    // Handle phone number change (no validation during typing)
    const handlePhoneChange = value => {
      console.log('Phone number entered:', value); // Debug log for the new input value

      // Update the state to reflect the current input
      setPhoneNumber(value);

      // Notify the parent with the current value (phone number)
      handlePhoneInput?.(value);
    };

    // Sync initial value to input field on mount
    useEffect(() => {
      if (initialValue) {
        setPhoneNumber(initialValue); // Update state
        phoneInputRef.current?.setValue(initialValue); // Set input value
      }
    }, [initialValue]);

    return (
      <ReactNativePhoneInput
        ref={phoneInputRef}
        initialCountry={initialCountry}
        disabled={disabled}
        value={phoneNumber} // Controlled component value
        textProps={{
          placeholder,
        }}
        style={{flex: 1}}
        onChangePhoneNumber={handlePhoneChange} // Update state on change
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

export default PhoneNumberInput;
