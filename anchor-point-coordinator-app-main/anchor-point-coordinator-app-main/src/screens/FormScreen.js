import React, {useState, useRef, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

import GradientButton from '../components/GradientButton';
import Fonts from '../theme/Fonts';
import {
  faAnchor,
  faArrowLeft,
  faCalendar,
  faClock,
  faIdCard,
  faLocationCrosshairs,
  faLocationDot,
  faMobileScreenButton,
  faPlane,
  faPlusCircle,
  faStar,
  faStop,
  faXmark,
  faLandmark,
} from '@fortawesome/free-solid-svg-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../theme/Colors';
import {TouchableWithoutFeedback} from 'react-native-gesture-handler';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faEnvelope, faSave, faUser} from '@fortawesome/free-regular-svg-icons';
import {screenWidth} from '../utils/Dimensions';

import moment from 'moment';
import {useCabContext} from '../context/CabDataProvider';
import PhoneNumberInput from '../components/PhoneNumberInput';
import EndPoints from '../api/EndPoints';
import {ActivityIndicator} from 'react-native-paper';
import CabPhoneInput from '../components/CabPhoneInput';

const LabelWithAsterisk = ({label, aestrick, errorMessage}) => (
  <View style={{flexDirection: 'row'}}>
    <Text style={styles.label}>{label}</Text>
    {aestrick && <Text style={{color: 'red'}}>*</Text>}
    {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
  </View>
);

const Icon = ({icon}) => {
  return <FontAwesomeIcon size={18} icon={icon} color={Colors.gray700} />;
};

export default FormScreen = ({navigation, route}) => {
  const {
    addGuest,
    updateGuest,
    cabBookingDetails,
    setDeletedWaypoints,
    addDeletedWaypoints,
  } = useCabContext();
  const scrollViewRef = useRef();

  const {guestData, index} = route.params || {};
  console.log('guestData===>', guestData);
  const defaultFormState = {
    id: '',
    name: '',
    email: '',
    alternate_email: '',
    mobile: '',
    alternate_mobile: '',
    rank: '',
    vessel_name: '',
    internal_id: '',
    date_of_duty: '',
    start_time: '',
    flight_details: '',
    source: {
      name: '',
      address: '',
      landmark: '',
      latitude: 0,
      longitude: 0,
      title: '',
    },
    destination: {
      name: '',
      address: '',
      landmark: '',
      latitude: 0,
      longitude: 0,
      title: '',
    },
    waypoints: [],
  };

  const [formState, setFormState] = useState(defaultFormState);

  useEffect(() => {
    if (!guestData) {
      setFormState(defaultFormState);
    } else if (guestData) {
      setFormState(guestData);
    }
  }, [guestData]);

  const [isShowDatePicker, setShowDatePicker] = useState(false);
  const [isShowTimePicker, setShowTimePicker] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);

  const boxWidth =
    formState.waypoints.length >= 1 ? screenWidth - 75 : screenWidth - 75;

  const handleInputChange = (key, value) => {
    setFormState(prevState => ({
      ...prevState,
      [key]: value,
    }));
  };

  const handleChangeForm = (key, location) => {
    setFormState(prevState => ({
      ...prevState,
      [key]: {
        ...location,
        name: location.doorNumber || '',
        address: location.address || '',
        landmark: location.landmark || '',
        latitude: location.latitude,
        longitude: location.longitude,
      },
    }));
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (event.type === 'set' && selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const formattedTime = `${hours}:${minutes}`; // HH:mm format
      handleInputChange('start_time', formattedTime); // Update form state
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      handleInputChange('date_of_duty', formattedDate); // Update form state
    }
  };

  const handleDateConfirm = date => {
    const selectedDate = new Date(date);
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();

    const formattedMonth = String(month).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');

    const formattedDate = `${year}-${formattedMonth}-${formattedDay}`;

    handleInputChange('date_of_duty', formattedDate);
    hideDatePicker();
  };

  const handleTimeConfirm = time => {
    const selectedTime = new Date(time);
    const hours = selectedTime.getHours();
    const minutes = selectedTime.getMinutes();

    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');

    const formattedTime = `${formattedHours}:${formattedMinutes}`;

    handleInputChange('start_time', formattedTime);
    hideTimePicker();
  };

  const renderDatePicker = () => {
    if (Platform.OS === 'android') {
      const minimumDate = new Date();
      return (
        isShowDatePicker && (
          <DateTimePicker
            value={
              formState.date_of_duty
                ? new Date(formState.date_of_duty)
                : minimumDate
            }
            mode="date"
            is24Hour={true}
            display="spinner"
            onChange={handleDateChange}
          />
        )
      );
    } else if (Platform.OS === 'ios') {
      return (
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleDateConfirm}
          onCancel={hideDatePicker}
        />
      );
    }
  };

  const renderTimePicker = () => {
    if (Platform.OS === 'android') {
      const minimumDate = new Date();
      return (
        isShowTimePicker && (
          <DateTimePicker
            value={
              formState.start_time
                ? new Date(`1970-01-01T${formState.start_time}Z`)
                : minimumDate
            }
            mode="time"
            is24Hour={true}
            display="spinner"
            onChange={handleTimeChange}
          />
        )
      );
    } else if (Platform.OS === 'ios') {
      return (
        <DateTimePickerModal
          value={
            formState.start_time
              ? new Date(`1970-01-01T${formState.start_time}Z`)
              : new Date()
          }
          isVisible={isTimePickerVisible}
          mode="time"
          onConfirm={handleTimeConfirm}
          onCancel={hideTimePicker}
        />
      );
    }
  };

  const handleSelectLocation = () => {
    navigation.navigate('MapComponent', {
      setLocation: location => {
        const tempLocation = {...formState.source, ...location};
        handleChangeForm('source', tempLocation);
      },
      initialLocation: formState.source,
      isLandmark: false,
    });
  };

  const handleSelectDestinationLocation = () => {
    navigation.navigate('MapComponent', {
      setLocation: location => {
        const tempLocation = {...formState.destination, ...location};
        handleChangeForm('destination', location);
      },
      initialLocation: formState.destination,
      isLandmark: false,
    });
  };

  const handleWaypoints = index => {
    navigation.navigate('MapComponent', {
      setLocation: location => {
        handleUpdateWaypoints(index, location);
      },
      initialLocation: formState.waypoints[index],
      isLandmark: true,
    });
  };

  const handleUpdateWaypoints = (index, location) => {
    const updatedWaypoints = [...formState.waypoints];
    updatedWaypoints[index] = {
      ...updatedWaypoints[index],
      address: location.address,
      // name: location.doorNumber,
      // landmark: location.landmark,
      name: '',
      landmark: '',
      latitude: location.latitude,
      longitude: location.longitude,
    };

    setFormState(prevState => ({
      ...prevState,
      waypoints: updatedWaypoints,
    }));
  };

  const handleAddStop = () => {
    if (formState.waypoints.length < 5) {
      const newStop = {
        // name: '',
        // landmark: '',
        address: '',
        latitude: 0,
        longitude: 0,
      };
      setFormState(prevState => ({
        ...prevState,
        waypoints: [...prevState.waypoints, newStop], // Add new stop to waypoints
      }));
    }
  };

  const handleEditStop = (index, updatedStop) => {
    const updatedWaypoints = [...formState.waypoints];
    updatedWaypoints[index] = updatedStop;

    setFormState(prevState => ({
      ...prevState,
      waypoints: updatedWaypoints,
    }));
  };

  const handleRemoveStop = index => {
    //
    const removedWaypoint = formState.waypoints[index];

    // if (removedWaypoint.waypoint_id && removedWaypoint.location_id) {
    //   setDeletedWaypoints(prevDeleted => {
    //     const bookingLogId = formState.booking_log_id;
    //     const updatedDeleted = {...prevDeleted};

    //     if (bookingLogId) {
    //       if (updatedDeleted[bookingLogId]) {
    //         updatedDeleted[bookingLogId].push({
    //           ...removedWaypoint,
    //           delete: true,
    //         });
    //       } else {
    //         updatedDeleted[bookingLogId] = [{...removedWaypoint, delete: true}];
    //       }
    //     }

    //     return updatedDeleted;
    //   });
    // }

    if (removedWaypoint.waypoint_id && removedWaypoint.location_id) {
      const bookingLogId = formState.booking_log_id;

      if (bookingLogId) {
        console.log(
          'Calling addDeletedWaypoints with',
          bookingLogId,
          removedWaypoint,
        );
        addDeletedWaypoints(bookingLogId, [{...removedWaypoint, delete: true}]);
      }
    }

    //
    const updatedWaypoints = formState.waypoints.filter((_, i) => i !== index);

    setFormState(prevState => ({
      ...prevState,
      waypoints: updatedWaypoints, // Update the waypoints array after removal
    }));
  };

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const showTimePicker = () => {
    setTimePickerVisibility(true);
  };

  const hideTimePicker = () => {
    setTimePickerVisibility(false);
  };
  const handleSave = () => {
    const validationErrors = validateForm(formState);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      scrollViewRef.current?.scrollTo({y: 0, animated: true});
      setTimeout(() => setErrors({}), 2500);
      return;
    }

    if (formState.id === '') {
      delete formState.id;
    }

    if (Object.keys(validationErrors).length === 0) {
      if (guestData && typeof index === 'number') {
        updateGuest(index, formState);
      } else {
        addGuest(formState);
      }
      navigation.navigate('GuestListScreen');
    }

    setFormState(defaultFormState);
  };

  const handleBack = () => {
    setFormState(defaultFormState);

    if (cabBookingDetails.booking.guests.length === 0) {
      navigation.navigate('HomeScreen');
    } else if (cabBookingDetails.booking.guests.length > 0) {
      navigation.navigate('GuestListScreen');
    }
  };

  const [errors, setErrors] = useState({});

  const handleFillData = async () => {
    try {
      // Retrieve stored data from AsyncStorage
      const storedName = await AsyncStorage.getItem(Keys.NAME);
      const storedEmail = await AsyncStorage.getItem(Keys.EMAIL);
      const storedPhone = await AsyncStorage.getItem(Keys.PHONE);
      const storedId = await AsyncStorage.getItem(Keys.ID);

      if (storedName || storedEmail || storedPhone) {
        // Update only the fields that have data in AsyncStorage
        if (storedName !== null) handleInputChange('name', storedName);
        if (storedEmail !== null) handleInputChange('email', storedEmail);
        if (storedPhone !== null) handleInputChange('mobile', storedPhone);
        if (storedId !== null) {
          const numericId = parseInt(storedId, 10); // Convert to integer
          if (!isNaN(numericId)) {
            handleInputChange('id', numericId);
          }
        }
      }
    } catch (error) {
      // console.error('Error fetching data from AsyncStorage', error);
    }
  };

  const phoneComponentRef = useRef();

  const [loadGuestDetails, setLoadGuestDetails] = useState(false);

  const handlePhoneInputError = () => {
    // setinvalidNumberError(true);
    // setEnableEdit(false);
  };

  const validateForm = formData => {
    const errors = {};

    // name validation
    if (!formData.name || formData.name.length < 3) {
      errors.name = 'Name should be at least 3 characters long.';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      errors.email = 'Invalid email address.';
    }

    if (
      formData?.alternate_email &&
      !emailRegex.test(formData.alternate_email)
    ) {
      errors.alternate_email = 'Invalid email address.';
    }

    // Mobile number validation
    const mobileRegex = /^(\+91)?[0-9]{10}$/;
    if (!formData.mobile || !mobileRegex.test(formData.mobile)) {
      errors.mobile = 'Must be +91 followed by 10 digits.';
    }

    //Pickup type validation
    if (!formData.source || !formData.source.title) {
      errors.source_type = 'Source Type is required.';
    }

    // Source and destination validation
    if (!formData.source || !formData.source.address) {
      errors.source = 'Source is required.';
    }
    if (travelMode === 'standard') {
      if (!formData.destination || !formData.destination.address) {
        errors.destination = 'Destination is required.';
      }

      if (!formData.destination || !formData.destination.title) {
        errors.dest_type = 'Destination type is required.';
      }

      // Waypoints validation
      formData.waypoints.forEach((waypoint, index) => {
        if (!waypoint.address) {
          errors.waypoints = `Waypoint is missing.`;
        }
      });
    }

    setErrors(errors);

    if (Object.keys(errors).length > 0) {
      setTimeout(() => setErrors({}), 2500);
    }

    return errors;
  };

  const handlePhoneInputValue = (phoneNumber, key) => {
    const mobileRegex = /^\+?[0-9]{10,13}$/; // Adjust regex to allow country codes
    if (!mobileRegex.test(phoneNumber)) {
      setErrors({
        [key]: 'Invalid mobile number',
      });
    } else {
      setErrors({});
      handleInputChange(key, phoneNumber); // Update the form state
    }

    if (phoneNumber.length >= 13) {
      handleGuestDetails(phoneNumber);
    }
  };

  const handleGuestDetails = phoneNumber => {
    ApiRequest({
      url: `${EndPoints.GuestDetails}`,
      data: {
        mobile: phoneNumber,
        booking_type: 'Cab',
      },
      method: 'POST',
    })
      .then(response => {
        if (Object.keys(response?.guest || {}).length > 0) {
          const {email, internal_id, name, rank, vessel_name, id} =
            response.guest;
          handleInputChange('id', id);
          handleInputChange('name', name);
          handleInputChange('email', email);
          handleInputChange('internal_id', internal_id);
          handleInputChange('rank', rank);
          handleInputChange('vessel_name', vessel_name);
        } else {
          console.log('No guest details found');
        }
      })
      .catch(error => {
        console.error('Fetch Guest Details Error', error);
      });
  };

  let travelMode = cabBookingDetails.booking.travel_mode;

  // console.log('formState', JSON.stringify(formState, null, 2));

  return (
    <GestureHandlerRootView
      style={{
        flex: 1,
        backgroundColor: Colors.natural_white,
        // paddingTop: 10,
        paddingBottom: 10,
      }}>
      <View style={{marginHorizontal: 20}}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}>
            <TouchableOpacity onPress={handleBack}>
              <FontAwesomeIcon
                icon={faArrowLeft}
                size={20}
                color={Colors.black}
              />
            </TouchableOpacity>
            <Text style={styles.title}>{'Add Guest Info'}</Text>
          </View>

          {!formState.booking_log_id && (
            <TouchableOpacity onPress={handleFillData}>
              <View
                style={{
                  flexDirection: 'row',
                  borderRadius: 20,
                  borderWidth: 2,
                  padding: 5,
                  gap: 5,
                }}>
                <FontAwesomeIcon icon={faUser} />
                <Text
                  style={{
                    fontFamily: Fonts.Default.Regular,
                    fontWeight: '500',
                    fontSize: 12,
                    color: '#000',
                  }}>
                  For Myself
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.horizontalLine} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={{flexGrow: 1, marginHorizontal: 20}}>
        <View style={{gap: 8, justifyContent: 'center'}}>
          {/* name */}
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <LabelWithAsterisk
              label={'Name'}
              aestrick={true}
              errorMessage={errors.name}
            />
          </View>

          <View style={styles.editBox}>
            <Icon icon={faUser} />

            <TextInput
              style={[styles.editText, errors.name && styles.errorInput]}
              value={formState.name}
              placeholder={Strings.full_name}
              placeholderTextColor={Colors.gray500}
              onChangeText={name => {
                if (name.length <= 25) {
                  handleInputChange('name', name);
                }
              }}
            />
          </View>

          {/* email */}
          <LabelWithAsterisk
            label={'Email'}
            aestrick={true}
            errorMessage={errors.email}
          />
          <View style={styles.editBox}>
            <Icon icon={faEnvelope} />
            <TextInput
              style={styles.editText}
              value={formState.email}
              placeholder={Strings.email}
              placeholderTextColor={Colors.gray500}
              onChangeText={email => {
                handleInputChange('email', email);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          <LabelWithAsterisk
            label={'Alternate Email'}
            aestrick={false}
            errorMessage={errors.alternate_email}
          />
          <View style={styles.editBox}>
            <Icon icon={faEnvelope} />
            <TextInput
              style={styles.editText}
              value={formState.alternate_email}
              placeholder={Strings.email}
              placeholderTextColor={Colors.gray500}
              onChangeText={email => {
                handleInputChange('alternate_email', email);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* phone No */}
          <LabelWithAsterisk
            label={'Phone No'}
            aestrick={true}
            errorMessage={errors.mobile}
          />

          <View style={styles.editBox}>
            <CabPhoneInput
              ref={phoneComponentRef}
              placeholder="Enter your phone number"
              initialCountry="in"
              initialValue={formState.mobile}
              handlePhoneInput={num => handlePhoneInputValue(num, 'mobile')}
              onError={error => console.log('Error:', error)}
              disabled={!!formState.booking_log_id}
            />
            {loadGuestDetails && (
              <View style={{marginLeft: 10}}>
                <ActivityIndicator
                  color={Colors.classic_black}
                  size={'small'}
                />
              </View>
            )}
          </View>

          {/* Secondary phone No */}
          <LabelWithAsterisk
            label={'Alternate Phone No'}
            aestrick={false}
            errorMessage={errors.alternate_mobile}
          />

          <View style={styles.editBox}>
            <CabPhoneInput
              ref={phoneComponentRef}
              placeholder="Enter your phone number"
              initialCountry="in"
              initialValue={formState.alternate_mobile}
              handlePhoneInput={num =>
                handlePhoneInputValue(num, 'alternate_mobile')
              }
              onError={error => console.log('Error:', error)}
              //disabled={!!formState.booking_log_id}
            />
            {loadGuestDetails && (
              <View style={{marginLeft: 10}}>
                <ActivityIndicator
                  color={Colors.classic_black}
                  size={'small'}
                />
              </View>
            )}
          </View>

          {/* Source */}

          <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
            <View>
              <LabelWithAsterisk
                label={'Source Address Type'}
                aestrick={true}
                errorMessage={errors.source_type}
              />
              <View style={styles.editBox}>
                <Icon icon={faLandmark} />
                <TextInput
                  style={styles.editText}
                  value={formState.source.title}
                  placeholder={'Like Home, Office, Shop, Airport, Station'}
                  placeholderTextColor={Colors.gray500}
                  onChangeText={source_type => {
                    setFormState(prevState => ({
                      ...prevState,
                      source: {...prevState.source, title: source_type},
                    }));
                  }}
                />
              </View>
              <LabelWithAsterisk
                label={'Select Source'}
                aestrick={true}
                errorMessage={errors.source || errors.waypoints}
              />

              <TouchableOpacity
                onPress={handleSelectLocation}
                activeOpacity={0.7}>
                <View
                  style={[
                    styles.editBox,
                    {width: boxWidth, marginVertical: 5},
                  ]}>
                  <Icon icon={faLocationCrosshairs} />
                  <TextInput
                    placeholder="Pick up type"
                    value={formState.source.address || ''}
                    editable={false}
                    style={styles.editText}
                    placeholderTextColor={Colors.gray500}
                  />
                </View>
              </TouchableOpacity>

              {travelMode === 'standard' && (
                <View>
                  {formState.waypoints.map((stop, index) => (
                    <View
                      key={index}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                      }}>
                      <Text style={styles.label}>{index + 1}</Text>

                      <TouchableWithoutFeedback
                        onPress={() => handleWaypoints(index)}>
                        <View
                          style={[
                            styles.editBox,
                            {
                              width: screenWidth - 95,
                              marginVertical: 5,
                              justifyContent: 'space-between',
                            },
                          ]}>
                          <TextInput
                            value={stop.address}
                            onChangeText={text =>
                              handleEditStop(index, {...stop, address: text})
                            }
                            style={styles.editText}
                            placeholder="Add Stop"
                            editable={false}
                            placeholderTextColor={Colors.gray500}
                          />

                          <View
                            style={{
                              backgroundColor: Colors.start,
                              borderRadius: 50,
                              padding: 3,
                            }}>
                            <TouchableWithoutFeedback
                              onPress={() => handleRemoveStop(index)}>
                              <FontAwesomeIcon
                                icon={faXmark}
                                size={16}
                                color={Colors.natural_white}
                              />
                            </TouchableWithoutFeedback>
                          </View>
                        </View>
                      </TouchableWithoutFeedback>
                    </View>
                  ))}
                </View>
              )}

              {travelMode === 'standard' && (
                <>
                  <LabelWithAsterisk
                    label={'Destination Address Type'}
                    aestrick={true}
                    errorMessage={errors.dest_type}
                  />
                  <View style={styles.editBox}>
                    <Icon icon={faLandmark} />
                    <TextInput
                      style={styles.editText}
                      value={formState.destination.title}
                      placeholder={'Like Home, Office, Shop, Airport, Station'}
                      placeholderTextColor={Colors.gray500}
                      onChangeText={dest_type => {
                        setFormState(prevState => ({
                          ...prevState,
                          destination: {
                            ...prevState.destination,
                            title: dest_type,
                          },
                        }));
                      }}
                    />
                  </View>
                  <LabelWithAsterisk
                    label={'Select Destination'}
                    aestrick={true}
                    errorMessage={errors.destination || errors.waypoints}
                  />
                </>
              )}

              {travelMode === 'standard' && (
                <TouchableWithoutFeedback
                  onPress={handleSelectDestinationLocation}>
                  <View
                    style={[
                      styles.editBox,
                      {width: boxWidth, marginVertical: 5},
                    ]}>
                    <Icon icon={faLocationDot} />
                    <TextInput
                      placeholder="Where to"
                      value={formState.destination.address || ''}
                      editable={false}
                      style={styles.editText}
                      placeholderTextColor={Colors.gray500}
                    />
                  </View>
                </TouchableWithoutFeedback>
              )}
            </View>

            {/* Add new stop button */}
            {travelMode === 'standard' && (
              <TouchableWithoutFeedback onPress={handleAddStop}>
                {formState.waypoints.length < 5 && (
                  <View
                    style={{
                      borderRadius: 50,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                    }}>
                    <FontAwesomeIcon
                      icon={faPlusCircle}
                      size={24}
                      color={Colors.gray700}
                    />
                  </View>
                )}
              </TouchableWithoutFeedback>
            )}
          </View>

          {/* rank */}
          <LabelWithAsterisk label={'Rank'} aestrick={false} />
          <View style={styles.editBox}>
            <Icon icon={faStar} />
            <TextInput
              style={styles.editText}
              value={formState.rank}
              placeholder={Strings.rank}
              placeholderTextColor={Colors.gray500}
              onChangeText={rank => {
                handleInputChange('rank', rank);
              }}
            />
          </View>

          {/* internalId  */}
          <LabelWithAsterisk label={'Internal id'} aestrick={false} />
          <View style={styles.editBox}>
            <Icon icon={faIdCard} />
            <TextInput
              style={styles.editText}
              value={formState.internal_id}
              placeholder={Strings.id}
              placeholderTextColor={Colors.gray500}
              onChangeText={internal_id => {
                handleInputChange('internal_id', internal_id);
              }}
            />
          </View>

          {/* vessel name */}
          <LabelWithAsterisk label={'Vessel Name'} aestrick={false} />
          <View style={styles.editBox}>
            <Icon icon={faAnchor} />
            <TextInput
              style={styles.editText}
              value={formState.vessel_name}
              placeholder={Strings.Vessel}
              placeholderTextColor={Colors.gray500}
              onChangeText={vessel => {
                handleInputChange('vessel_name', vessel);
              }}
            />
          </View>

          {/* date of duty */}
          <View>
            {renderDatePicker()}

            <TouchableOpacity
              onPress={
                Platform.OS === 'android'
                  ? () => setShowDatePicker(true)
                  : showDatePicker
              }
              activeOpacity={0.8}>
              <LabelWithAsterisk label={'Date of Duty'} aestrick={false} />

              <View style={[styles.editBox, {marginTop: 5}]}>
                <Icon icon={faCalendar} />
                <TextInput
                  value={
                    formState.date_of_duty
                    // ? moment(formState.date).format('YYYY-MM-DD')
                    // : ''
                  }
                  placeholder="Selected Date"
                  placeholderTextColor={Colors.gray500}
                  editable={false}
                  style={styles.editText}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* start time */}
          <View>
            {renderTimePicker(formState.date_of_duty)}

            <TouchableOpacity
              onPress={
                Platform.OS === 'android'
                  ? () => setShowTimePicker(true)
                  : showTimePicker
              }
              activeOpacity={0.8}>
              <LabelWithAsterisk label={'Start Time'} aestrick={false} />

              <View style={[styles.editBox, {marginTop: 5}]}>
                <Icon icon={faClock} />
                <TextInput
                  value={
                    formState.start_time
                      ? moment(formState.start_time, 'HH:mm').format('LT')
                      : ''
                  }
                  placeholder="Select Time"
                  placeholderTextColor={Colors.gray500}
                  editable={false}
                  style={styles.editText}
                />
              </View>
            </TouchableOpacity>
          </View>

          <LabelWithAsterisk label={'Flight Details'} aestrick={false} />
          <View style={styles.editBox}>
            <Icon icon={faPlane} />
            <TextInput
              style={styles.editText}
              value={formState.flight_details}
              placeholder={Strings.Flight}
              placeholderTextColor={Colors.gray500}
              onChangeText={flight => {
                handleInputChange('flight_details', flight);
              }}
            />
          </View>
        </View>
      </ScrollView>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'flex-end',
          gap: 5,
          marginTop: 5,
          backgroundColor: Colors.white,
        }}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <FontAwesomeIcon icon={faSave} size={25} color={Colors.primary} />
          <Text style={styles.label}>{'Save'}</Text>
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  title: {
    fontFamily: Fonts.Default.Bold,
    fontWeight: '700',
    fontSize: 24,
    color: Colors.start,
  },
  subtitle: {
    fontFamily: Fonts.Default.SemiBold,
    fontWeight: '700',
    fontSize: 17,
    color: Colors.gray500,
    marginVertical: 10,
  },
  label: {
    fontFamily: Fonts.Default.Medium,
    fontWeight: '600',
    fontSize: 14,
    color: Colors.start,
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
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0D4CA',
    borderRadius: 12,
    padding: 2,
  },
  textInputdisabledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0D4CA',
    borderRadius: 12,
    padding: 2,
    backgroundColor: '#EEEEEE',
  },
  textInput: {
    height: 40,
    color: '#5d5d5d',
    fontSize: 16,
    paddingHorizontal: 8,
  },
  horizontalLine: {
    height: 2,
    backgroundColor: Colors.start,
    marginVertical: 5,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  selectedValuesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectedValueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    padding: 8,
    borderRadius: 5,
    marginRight: 8,
    marginBottom: 8,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  closeIcon: {
    marginLeft: 5,
    color: 'red',
  },
  costcentreinputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D0D4CA',
    borderRadius: 12,
    padding: 2,
  },
  locationinputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0D4CA',
    borderRadius: 12,
    padding: 2,
  },
  mobileField: {
    backgroundColor: Colors.gray100,
    width: screenWidth - 40,
    borderRadius: 10,
    borderColor: Colors.gray100,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 50,
    maxHeight: 50,
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
    width: screenWidth - 32,
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

  error: {
    fontFamily: Fonts.Default.Regular,
    fontSize: 13,
    color: Colors.error,
    alignSelf: 'flex-end',
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  saveButton: {
    backgroundColor: Colors.natural_white,
    width: 90,
    height: 50,
    borderRadius: 30,
    borderColor: Colors.primary,
    borderWidth: 2,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  errorInput: {
    borderColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    marginLeft: 3,
  },
});
