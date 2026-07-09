import React, {useCallback} from 'react';
import {StyleSheet, Text, TouchableOpacity, Image} from 'react-native';
import Colors from '../theme/Colors';

export default function ModeSelectionButton({
  label,
  icon,
  value,
  selectedButton,
  setSelectedButton,
  disabled,
}) {
  const handleButtonClick = useCallback(() => {
    if (!disabled) {
      value(label);
      setSelectedButton(label);
    }
  }, [label, value, setSelectedButton, disabled]);

  return (
    <TouchableOpacity
      onPress={handleButtonClick}
      style={[
        styles.button,
        selectedButton === label && styles.selectedButton,
        disabled && styles.disabledButton,
      ]}>
      <Image
        source={icon}
        style={{
          tintColor: selectedButton === label ? Colors.start : Colors.gray500,
        }}
      />

      <Text
        style={[
          styles.buttonText,
          selectedButton === label && styles.selectedButtonText,
          disabled && styles.disabledButtonText,
        ]}>
        {' '}
        {label}{' '}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 171,
    height: 67,
    borderRadius: 15,
    borderColor: 'gray',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  buttonText: {
    fontWeight: '600',
    fontFamily: Fonts.Default.Regular,
    color: Colors.gray500,
  },
  selectedButton: {
    borderColor: Colors.start,
    borderWidth: 1.5,
    backgroundColor: `rgba(${Colors.start},0.9)`,
  },
  selectedButtonText: {
    color: Colors.start,
    fontFamily: Fonts.Default.SemiBold,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    color: 'gray',
  },
});
