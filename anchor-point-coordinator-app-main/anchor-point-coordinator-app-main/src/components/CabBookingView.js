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
  Switch,
  Image,
  Modal,
} from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Fonts from '../theme/Fonts';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {
  faCalendar,
  faEnvelope,
  faMinus,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';

import Colors from '../theme/Colors';
import {faClock} from '@fortawesome/free-regular-svg-icons';
import GradientButton from './GradientButton';
import {useFormData} from '../context/FormDataProvider';
import {useAppContext} from '../context/AppProvider';
import Strings from '../constants/Strings';
import {screenHeight, screenWidth} from '../utils/Dimensions';
import ModeSelectionButton from './ModeSelectionButton';
import CostCenterComponenet from './CostCenterComponenet';
import {useCabContext} from '../context/CabDataProvider';
import VehicleModelComponent from './VehicleModelComponent';
import InfoIcon from '../../images/info.png';
import {Calendar, CalendarList, Agenda} from 'react-native-calendars';
import moment from 'moment';

export default CabBookingView = ({navigation, scrollViewRef}) => {
  const {cabBookingDetails, updateBookingDetails, eraseAllBookingDetails} =
    useCabContext();

  const [isShowDatePicker, setShowDatePicker] = useState(false);
  const [isShowTimePicker, setShowTimePicker] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  const [showTooltip, setShowTooltip] = useState(false);

  const handleCostCentreChange = costCentre => {
    updateBookingDetails({
      cost_centre: Array.isArray(costCentre) ? costCentre : [],
    });
  };

  const handleButtonClear = () => {
    eraseAllBookingDetails();
  };

  const hanldeErrorStatus = () => {
    console.log('cabtype==>', cabtype);
    if (!cabtype) {
      Alert.alert('Select Cab Type');
      return true;
    } else if (counter <= 0) {
      Alert.alert('Select number of People');
      return true;
    } else if (!selectedDate) {
      Alert.alert('Select Pick-up Date');
      return true;
    } else if (!selectedTime) {
      Alert.alert('Select Pick-up Time');
      return true;
    } else if (!(selectedCostCenters.length > 0)) {
      Alert.alert('Select Cost Center');
      return true;
    }
  };

  const handleContinue = () => {
    // if (cabBookingDetails.booking.guests.length > 0) {
    navigation.navigate('GuestListScreen');
    // } else {
    //   navigation.navigate('FormScreen', {});
    // }
  };

  // date section

  //

  const handleDateChangeNormal = (event, newDate) => {
    setShowDatePicker(false);
    updateBookingDetails({
      pickup_date: [moment(newDate).format('YYYY-MM-DD')],
    });
  };
  const showDatePickerNormal = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePickerNormal = () => {
    setDatePickerVisibility(false);
  };

  const handleDateConfirmNormal = date => {
    hideDatePickerNormal();
    updateBookingDetails({
      pickup_date: [moment(date).format('YYYY-MM-DD')],
    });
  };

  const renderDatePickerNormal = () => {
    const minimumDate = new Date();
    if (Platform.OS === 'android') {
      return (
        isShowDatePicker && (
          <DateTimePicker
            value={
              cabBookingDetails.booking.pickup_date[0]
                ? new Date(cabBookingDetails.booking.pickup_date[0])
                : minimumDate
            }
            mode="date"
            is24Hour={true}
            display="spinner"
            onChange={handleDateChangeNormal}
            minimumDate={minimumDate}
          />
        )
      );
    } else if (Platform.OS === 'ios') {
      return (
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          display=""
          onConfirm={handleDateConfirmNormal}
          onCancel={hideDatePickerNormal}
          onDateChange={date => {
            handleDateConfirmNormal(date);
          }}
          minimumDate={minimumDate}
        />
      );
    }
  };

  //

  // time section
  const handleTimeChange = (event, newTime) => {
    setShowTimePicker(false); // Hide the picker
    if (newTime) {
      updateBookingDetails({
        pickup_time: newTime.toTimeString().slice(0, 5), // Save time in HH:mm format
      });
    }
  };

  const renderTimePicker = () => {
    const minimumTime = new Date();
    const selectedDates = cabBookingDetails.booking.pickup_date || [];

    // Check if today's date is in the pickup_date array
    const isTodaySelected = selectedDates.includes(
      new Date().toISOString().split('T')[0],
    );

    if (isTodaySelected) {
      minimumTime.setHours(minimumTime.getHours(), minimumTime.getMinutes());
    } else {
      // Reset minimum time if today is not selected
      minimumTime.setHours(0, 0);
    }

    // Render the time picker based on platform
    if (Platform.OS === 'android') {
      return (
        isShowTimePicker && (
          <DateTimePicker
            value={minimumTime}
            mode="time"
            is24Hour={true}
            display="spinner"
            onChange={handleTimeChange}
          />
        )
      );
    } else {
      return (
        <DateTimePickerModal
          isVisible={isTimePickerVisible}
          mode="time"
          onConfirm={time => {
            handleTimeChange(null, time);
            hideTimePicker();
          }}
          onCancel={hideTimePicker}
          is24Hour={true}
        />
      );
    }
  };

  //

  const showTimePicker = () => {
    if (cabBookingDetails.booking.pickup_date) {
      setShowTimePicker(true);
    } else {
      Alert.alert('Please select a pickup date first.');
    }
  };

  const hideTimePicker = () => {
    setTimePickerVisibility(false);
  };

  const handleSelectedVehicleModelsChange = selectedItems => {
    updateBookingDetails({cab_type: selectedItems});
  };

  const toggleSwitch = () => {
    setIsEnabled(prevState => {
      const newState = !prevState;
      console.log('New isEnabled:', newState); // Log the new state here

      updateBookingDetails({travel_mode: newState}); // Pass the updated state directly
      return newState; // Return the updated state
    });
  };

  // Function to toggle the tooltip visibility
  const toggleTooltip = () => {
    setShowTooltip(!showTooltip);
  };

  const [selectedDates, setSelectedDates] = useState({});
  const [isCalendarVisible, setCalendarVisible] = useState(false);

  // Handle day press
  const onDayPress = day => {
    const pickUpDates = cabBookingDetails.booking.pickup_date || [];
    const dateIndex = pickUpDates.indexOf(day.dateString);

    if (dateIndex > -1) {
      // Deselect the date
      pickUpDates.splice(dateIndex, 1);
    } else {
      // Select the date
      pickUpDates.push(day.dateString);
    }

    // Update the booking details
    updateBookingDetails({
      pickup_date: [...pickUpDates], // Ensure a new array is passed
    });
  };

  // Mark dates for the Calendar
  const markedDates = {};
  {
    !cabBookingDetails.booking.bid &&
      (cabBookingDetails.booking.pickup_date || []).forEach(date => {
        markedDates[date] = {
          selected: true,
          marked: true,
          selectedColor: Colors.start,
        };
      });
  }
  return (
    <>
      <View
        style={{
          backgroundColor: Colors.natural_white,
          flex: 1,
        }}>
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          style={{flex: 1, backgroundColor: Colors.natural_white}}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}>
          {/* Cab Selection */}
          <View>
            <Text style={styles.datetimetext}>{'Select Car Type'}</Text>
            <VehicleModelComponent
              selectedVehicleModels={cabBookingDetails.booking.cab_type}
              onSelectedItemObjectsChange={handleSelectedVehicleModelsChange}
            />
          </View>

          {/* Rent a Cab */}
          <View style={styles.rentcab}>
            <View style={styles.row}>
              <Text style={styles.datetimetext}>{'Rent a Cab'}</Text>

              {/* Info Button */}
              <TouchableOpacity onPress={toggleTooltip}>
                <Image
                  source={InfoIcon} // Make sure the image path is correct
                  style={styles.infoImage} // Adjust the size of the image
                />
              </TouchableOpacity>

              {/* Tooltip */}
              {showTooltip && (
                <View style={styles.tooltip}>
                  <Text style={styles.tooltipText}>
                    {cabBookingDetails.booking.bid != ''
                      ? `To enable create a new booking`
                      : `Invoice will be calculated only according to the final distance and  time travelled.${'\n'} Destination and stops are optional`}
                  </Text>
                </View>
              )}
            </View>

            <Switch
              disabled={cabBookingDetails.booking.bid != ''}
              style={
                Platform.OS === 'android'
                  ? {transform: [{scaleX: 1.3}, {scaleY: 1.3}]}
                  : {}
              }
              trackColor={{false: Colors.gray500, true: Colors.start}}
              thumbColor={
                cabBookingDetails.booking.travel_mode === 'rental'
                  ? Colors.gray700
                  : Colors.gray100
              }
              ios_backgroundColor={
                cabBookingDetails.booking.travel_mode === 'rental'
                  ? Colors.end
                  : Colors.gray500
              }
              onValueChange={() => {
                updateBookingDetails({
                  travel_mode:
                    cabBookingDetails.booking.travel_mode === 'rental'
                      ? 'standard'
                      : 'rental',
                });
              }}
              value={cabBookingDetails.booking.travel_mode === 'rental'}
            />
          </View>

          {/*  */}

          {/* pick up date */}
          {cabBookingDetails.booking.bid && (
            <View>
              <Text style={styles.datetimetext}>{'Pick up Date'}</Text>

              {renderDatePickerNormal()}

              <TouchableOpacity
                onPress={
                  Platform.OS === 'android'
                    ? () => setShowDatePicker(true)
                    : showDatePickerNormal
                }
                activeOpacity={0.8}>
                <View style={styles.textInputContainer}>
                  <TextInput
                    value={cabBookingDetails.booking.pickup_date[0]}
                    placeholder="Selected Date"
                    placeholderTextColor={Colors.gray700}
                    editable={false}
                    style={styles.textInput}
                  />
                  <FontAwesomeIcon
                    icon={faCalendar}
                    size={18}
                    style={styles.icon}
                  />
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/*  */}

          {/* pick up date */}

          {!cabBookingDetails.booking.bid && (
            <View>
              <Text style={styles.datetimetext}>{'Pick up Date'}</Text>

              {/* Text Input to Open Calendar */}
              <TouchableOpacity onPress={() => setCalendarVisible(true)}>
                <View style={styles.textInputContainer}>
                  <TextInput
                    value={(cabBookingDetails.booking.pickup_date || [])
                      .map(date => moment(date).format('DD-MM-YYYY')) // Convert to dd-mm-yyyy
                      .join(', ')}
                    placeholder="Select Pickup Dates"
                    placeholderTextColor="gray"
                    editable={false}
                    style={styles.textInput}
                  />
                  <FontAwesomeIcon
                    icon={faCalendar}
                    size={18}
                    style={styles.icon}
                  />
                </View>
              </TouchableOpacity>

              {/* Calendar Modal */}
              <Modal
                visible={isCalendarVisible}
                transparent
                animationType="slide">
                <View style={styles.modalContainer}>
                  <View style={styles.calendarContainer}>
                    <Calendar
                      markingType="multi-dot"
                      markedDates={markedDates}
                      onDayPress={onDayPress}
                      minDate={new Date().toISOString().split('T')[0]}
                    />
                    <TouchableOpacity
                      onPress={() => setCalendarVisible(false)}
                      style={styles.closeButton}>
                      <Text style={styles.closeButtonText}>OK</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            </View>
          )}

          {/* pick up time */}
          <View>
            <Text style={styles.datetimetext}>{'Pick up Time'}</Text>

            <TouchableOpacity
              onPress={() =>
                Platform.OS === 'android'
                  ? showTimePicker()
                  : setTimePickerVisibility(true)
              }>
              <View style={styles.textInputContainer}>
                <TextInput
                  value={cabBookingDetails.booking.pickup_time || ''}
                  placeholder="Select Pickup Time"
                  placeholderTextColor={Colors.gray700}
                  editable={false}
                  style={styles.textInput}
                />
                <FontAwesomeIcon icon={faClock} size={18} style={styles.icon} />
              </View>
            </TouchableOpacity>
            {renderTimePicker()}
          </View>

          {/* Cost center */}
          <View>
            <Text style={styles.datetimetext}>{'Select Cost Center'}</Text>
            <CostCenterComponenet
              selectedCostCenters={
                cabBookingDetails.booking.bid
                  ? [cabBookingDetails.booking.cost_centre] || []
                  : cabBookingDetails.booking.cost_centre || []
              }
              onSelectedItemObjectsChange={handleCostCentreChange}
            />
          </View>
          <View>
            <Text style={styles.datetimetext}>{'PO Number'}</Text>
            <View style={styles.textInputContainer}>
              <TextInput
                style={[styles.textInput, {width: '100%'}]}
                placeholder="Enter PO Number"
                placeholderTextColor={Colors.gray500}
                value={cabBookingDetails.booking.po_number}
                onChangeText={text => updateBookingDetails({po_number: text})}
              />
            </View>
          </View>
        </ScrollView>

        {/* Gradient Button */}
        {!cabBookingDetails.booking.bid && (
          <View style={styles.buttonContainer}>
            <GradientButton
              label={'Clear'}
              containerStyle={styles.clearButton}
              backgroundColors={[Colors.white, Colors.white]}
              textStyle={{color: Colors.start}}
              onClick={handleButtonClear}
            />

            <GradientButton
              disabled={
                !cabBookingDetails.booking.cab_type ||
                !cabBookingDetails.booking.pickup_date ||
                cabBookingDetails.booking.pickup_date.length === 0 ||
                !cabBookingDetails.booking.pickup_time ||
                cabBookingDetails.booking.cost_centre.id === null ||
                !(cabBookingDetails.booking.po_number.length >= 2)
              }
              label={'Next'}
              containerStyle={styles.nextButton}
              backgroundColors={[Colors.start, Colors.end]}
              onClick={handleContinue}
            />
          </View>
        )}

        {cabBookingDetails.booking.bid && (
          <View style={styles.container}>
            <GradientButton
              disabled={
                !cabBookingDetails.booking.cab_type ||
                !cabBookingDetails.booking.pickup_date ||
                cabBookingDetails.booking.pickup_date.length === 0 ||
                !cabBookingDetails.booking.pickup_time ||
                !cabBookingDetails.booking.cost_centre ||
                !(cabBookingDetails.booking.po_number.length >= 2)
              }
              label={'Next'}
              containerStyle={styles.editNextButton}
              backgroundColors={[Colors.start, Colors.end]}
              onClick={handleContinue}
            />
          </View>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  title: {
    fontFamily: Fonts.Default.Regular,
    fontWeight: '600',
    fontSize: 24,
    color: Colors.gray900,
    marginTop: 15,
  },

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
  container: {
    // flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
    paddingLeft: 16,
  },
  leftSection: {
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  peopleText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: Fonts.Default.Regular,
    color: Colors.dark,
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

  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0D4CA',
    borderRadius: 12,
    padding: 2,
  },
  icon: {
    position: 'absolute',
    right: 8,
  },
  textInput: {
    height: 40,
    color: '#5d5d5d',
    fontSize: 16,
    paddingHorizontal: 8,
  },
  text: {
    fontFamily: Fonts.Default.Medium,
    fontWeight: '700',
    fontSize: 18,
    color: Colors.gray700,
  },
  datetimetext: {
    fontFamily: Fonts.Default.Medium,
    fontWeight: '700',
    fontSize: 18,
    color: Colors.gray700,
    marginTop: 12,
    marginBottom: 12,
  },
  rentcab: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 7,
    // backgroundColor: 'red',
  },
  clearButton: {
    width: 171,
    height: 67,
    borderColor: Colors.start,
    borderWidth: 1,
  },
  nextButton: {
    width: 171,
    height: 67,
  },
  editNextButton: {
    width: '90%',
    height: 67,
  },
  error: {
    fontFamily: Fonts.Default.Regular,
    fontSize: 14,
    color: Colors.error,
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  editBox: {
    flexDirection: 'row',
    backgroundColor: Colors.gray100,
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: 8,
    minHeight: 50,
    maxHeight: 50,
    padding: 16,
  },
  editText: {
    fontFamily: Fonts.Default.Regular,
    fontSize: 16,
    color: Colors.dark,
    fontWeight: 'normal',
    padding: 0,
    marginLeft: 14,
    flex: 1,
  },
  label: {
    fontFamily: Fonts.Default.Medium,
    fontWeight: '400',
    fontSize: 14,
    color: Colors.start,
  },
  modeSelection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    gap: 5,
    backgroundColor: Colors.natural_white,
    marginVertical: 15,
  },
  switchContainer: {
    width: 100, // Custom width
    height: 50, // Custom height
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    // gap: 5,
  },
  infoButton: {
    fontSize: 20,
    color: Colors.start,
    marginLeft: 10,
    borderRadius: '100',
    padding: 5,
    borderWidth: 1,
  },
  tooltip: {
    position: 'absolute',
    top: -45,
    left: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 5,
    maxWidth: 300,
    zIndex: 100,
  },
  tooltipText: {
    color: 'white',
    fontSize: 14,
  },
  infoImage: {
    width: 20,
    height: 20,
    marginLeft: 10,
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: Colors.start,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
  },
});
