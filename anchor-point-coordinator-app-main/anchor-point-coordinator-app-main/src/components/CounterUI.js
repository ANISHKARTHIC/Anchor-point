import React, {useState, useCallback} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Platform,
  Button,
  ScrollView,
  Alert,
} from 'react-native';
import Fonts from '../theme/Fonts';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {
  faCalendar,
  faEnvelope,
  faMinus,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import Colors from '../theme/Colors';
import GradientButton from './GradientButton';

const CounterUI = ({title,counterValue,counterType,handleDecrement,handleIncrement,subTitle}) => {
  
  return (
    <View style={[styles.container]}>
      <View style={styles.leftSection}>
        <Text style={[styles.text]}>{title}</Text>
        {subTitle!=null&&
            <Text style={styles.subTitle}>{subTitle}</Text>
        }
      </View>
      <View style={styles.rightSection}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.updateCounterButton}
          onPress={()=>handleDecrement(counterType)}>
          <FontAwesomeIcon size={14} icon={faMinus} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.counterText}>{counterValue}</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.updateCounterButton}
          onPress={()=>handleIncrement(counterType)}>
          <FontAwesomeIcon size={14} icon={faPlus} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 30,
      },
    leftSection: {
        flex: 1,
      },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
      },
    text: {
        fontFamily: Fonts.Default.Medium,
        fontWeight: '700',
        fontSize: 18,
        color: Colors.gray700,
      },
    subTitle: {
        fontFamily: Fonts.Default.Regular,
        fontWeight: '400',
        fontSize: 14,
        color: Colors.gray700,
      },
    updateCounterButton: {
        width: 25,
        height: 25,
        borderRadius: 15,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
      },
    counterText: {
        fontSize: 28,
        width: 60,
        textAlign: 'center',
        color: '#000',
      },
})


export default CounterUI;
