import React, {useState, useCallback, useRef, useEffect} from 'react';
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
  Pressable,
  Modal,
} from 'react-native';
import {Card, Checkbox, Switch} from 'react-native-paper';
import Colors from '../theme/Colors';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import {map_key} from '../api/config.json';
import CostCenterComponenet from '../components/CostCenterComponenet';
import {useAppContext} from '../context/AppProvider';
import {faL, faPlane} from '@fortawesome/free-solid-svg-icons';
import Fonts from '../theme/Fonts';
import HotelBookingCalendar from '../components/HotelBookingCalendar';
import {screenHeight, screenWidth} from '../utils/Dimensions';
import GradientButton from '../components/GradientButton';
import CounterUI from '../components/CounterUI';
import moment from 'moment';
import {initialHotelBookingData} from '../context/AppProvider';
import {useFormData} from '../context/FormDataProvider';
import ScreenNames from '../constants/ScreenNames';
import Strings from '../constants/Strings';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faClock} from '@fortawesome/free-regular-svg-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import SimpleDropDown from '../components/SimpleDropDown';

export default HotelHomeScreen = props => {
  const {hotelBookingDetails, setHotelBookingDetails} = useAppContext();
  const {
    city,
    trip_type,
    no_of_adults,
    no_of_children,
    no_of_rooms,
    room_type,
    check_in,
    check_out,
    cost_centre,
    pickup,
    billing_option,
    drop,
  } = hotelBookingDetails;

  const [autocompleteValue, setAutocompleteValue] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const modalViewType = useRef('');
  const flightTimeType = useRef('');
  const [bookingDates, setBookingDates] = useState(
    check_in && check_out ? {start: check_in, end: check_out} : null,
  );
  const [roomDetails, setRoomDetails] = useState({
    city,
    no_of_rooms,
    no_of_adults,
    no_of_children,
    room_type,
    trip_type,
    cost_centre,
    billing_option,
    pickup,
    drop,
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const handlePlaceSelect = (data, details = null) => {
    if (details) {
      const {location} = details.geometry;
      setSelectedLocation({
        latitude: location.lat,
        longitude: location.lng,
        address: details.formatted_address,
        //doorNumber: doorNumber,
        //landmark: landmark,
      });
    }
  };
  const openModal = type => {
    modalViewType.current = type;
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    modalViewType.current = '';
  };
  const handleBookingDate = dates => {
    // console.log('SelectedDates', dates);
    setBookingDates(dates);
    closeModal();
  };
  const getNights = () => {
    var a = moment(bookingDates.start, 'YYYY-MM-DD');
    var b = moment(bookingDates.end, 'YYYY-MM-DD');
    var days = b.diff(a, 'days');
    return days > 1 ? `${days} nights` : `${days} night`;
  };
  const handleSelectCostCenters = selectedItems => {
    setRoomDetails(prevData => ({...prevData, cost_centre: selectedItems}));
    // setCostCenter(selectedItems[0].id);
  };
  const handleSelectedRoomType = selectedItems => {
    setRoomDetails(prevData => ({...prevData, room_type: selectedItems}));
  };
  const handleSelectBillingOption = selectedItems => {
    setRoomDetails(prevData => ({...prevData, billing_option: selectedItems}));
  };
  const handleVendorCity = selectedItems => {
    setRoomDetails(prevData => ({...prevData, city: selectedItems}));
  };
  const handleButtonClear = () => {
    setHotelBookingDetails({...initialHotelBookingData});
    setRoomDetails({...initialHotelBookingData});
    setBookingDates(null);
  };

  const hanldeErrorStatus = () => {
    if (!(roomDetails.city.length > 0)) {
      Alert.alert('Select City');
      return true;
    } else if (!(bookingDates != null)) {
      Alert.alert('Select Your Stay Dates');
      return true;
    } else if (!(roomDetails?.cost_centre.length > 0)) {
      Alert.alert('Select Cost Center');
      return true;
    }
  };

  const handleContinue = () => {
    if (hanldeErrorStatus()) {
      return;
    }
    var tempBookingData = {
      ...roomDetails,
      check_in: bookingDates?.start,
      check_out: bookingDates?.end,
    };
    setHotelBookingDetails({...tempBookingData});
    // console.log("tempBookingData",tempBookingData)
    setTimeout(() => {
      props.navigation.navigate(ScreenNames.SCREEN_HOTELFORM, {
        ...tempBookingData,
      });
    }, 100);
  };
  const handleIncrement = type => {
    if (type === 'no_of_rooms' && roomDetails[type] < 10) {
      setRoomDetails(prevData => ({
        ...prevData,
        [type]: prevData[type] + 1,
      }));
    } else if (type === 'no_of_adults' && roomDetails[type] < 20) {
      setRoomDetails(prevData => ({
        ...prevData,
        [type]: prevData[type] + 1,
      }));
    } else if (type === 'no_of_children' && roomDetails[type] < 10) {
      setRoomDetails(prevData => ({
        ...prevData,
        [type]: prevData[type] + 1,
      }));
    }
  };
  const handleDecrement = type => {
    if (
      (type === 'no_of_rooms' || type === 'no_of_adults') &&
      roomDetails[type] > 1
    ) {
      setRoomDetails(prevData => ({
        ...prevData,
        [type]: prevData[type] - 1,
      }));
    } else if (type === 'no_of_children' && roomDetails[type] > 0) {
      setRoomDetails(prevData => ({
        ...prevData,
        [type]: prevData[type] - 1,
      }));
    }
  };
  const openTimePicker = () => {
    setShowTimePicker(true);
  };

  const hideTimePicker = () => {
    setShowTimePicker(false);
  };

  const handleConfirm = time => {
    console.log('Time', time);
    const key = flightTimeType.current;
    setRoomDetails(prevData => ({
      ...prevData,
      [key]: {...prevData[key], time: time},
    }));
    hideTimePicker();
  };

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
      }}>
      <View
        style={[
          styles.box,
          {
            borderRadius: 5,
            backgroundColor: '#fff',
            padding: 10,
            width: '100%',
            flex: 1,
          },
        ]}>
        <ScrollView
          containerStyle={{flexGrow: 1}}
          showsVerticalScrollIndicator={false}>
          <View style={{width: '100%', marginBottom: 5, marginTop: 5}}>
            <Text style={styles.title}>Select City</Text>
            <View style={{paddingVertical: 10}}>
              <CostCenterComponenet
                selectedCostCenters={roomDetails.city}
                onSelectedItemObjectsChange={handleVendorCity}
                bookingType={'city'}
                containerWidth={screenWidth * 0.85}
              />
            </View>
          </View>
          <View style={{width: '100%', flex: 1}}>
            <View style={[styles.sectionView]}>
              <TouchableOpacity
                onPress={() => openModal('calendar')}
                activeOpacity={0.8}>
                <View style={{width: '100%'}}>
                  {bookingDates != null ? (
                    <View>
                      <Text style={styles.title}>
                        {moment(bookingDates.start).format('DD MMM YY')}
                        {' - '}
                        {moment(bookingDates.end).format('DD MMM YY')}
                      </Text>
                      <Text style={styles.subTitle}>{getNights()}</Text>
                    </View>
                  ) : (
                    <View>
                      <Text style={styles.title}>Select Dates</Text>
                      <Text style={styles.subTitle}>Check-in / Check-out</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/*  */}

            {/* <View style={[styles.sectionView]}>
              <TouchableOpacity
                onPress={() => openModal('calendar')}
                activeOpacity={0.8}>
                <View style={{width: '100%'}}>
                  {bookingDates != null ? (
                    <View>
                      <Text style={styles.title}>
                        {moment(bookingDates.start).format('DD MMM YY')}
                        {' - '}
                        {moment(bookingDates.end).format('DD MMM YY')}
                      </Text>
                      <Text style={styles.subTitle}>{getNights()}</Text>
                    </View>
                  ) : (
                    <View>
                      <Text style={styles.title}>Select Time</Text>
                      <Text style={styles.subTitle}>Check-in / Check-out</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View> */}
            {/*  */}

            <View style={[styles.sectionView]}>
              <TouchableOpacity
                onPress={() => openModal('room')}
                activeOpacity={0.8}>
                <View style={{width: '100%', flexDirection: 'row'}}>
                  <View style={{flex: 1}}>
                    <Text style={styles.title}>
                      {roomDetails.no_of_rooms}{' '}
                      {roomDetails.no_of_rooms > 1 ? 'Rooms' : 'Room'}
                    </Text>
                    <Text style={styles.subTitle}>
                      {roomDetails.no_of_adults}{' '}
                      {roomDetails.no_of_adults > 1 ? 'Adults' : 'Adult'}{' '}
                      {roomDetails.no_of_children > 0 && (
                        <Text>
                          {','} {roomDetails.no_of_children}{' '}
                          {roomDetails.no_of_children > 1
                            ? 'Children'
                            : 'Child'}
                        </Text>
                      )}
                    </Text>
                  </View>
                  <View style={{paddingRight: 10}}>
                    <Text style={styles.title}>Trip Type</Text>
                    <Text style={styles.subTitle}>
                      {roomDetails.trip_type.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
            <View style={[styles.sectionView]}>
              <Text style={styles.title}>Cost Center</Text>
              <View style={{paddingVertical: 10}}>
                <CostCenterComponenet
                  selectedCostCenters={roomDetails.cost_centre}
                  onSelectedItemObjectsChange={handleSelectCostCenters}
                  bookingType={'hotel'}
                  containerWidth={screenWidth * 0.85}
                />
              </View>
            </View>
            <View style={[styles.sectionView]}>
              <Text style={styles.title}>Room Type</Text>
              <View style={{paddingVertical: 10}}>
                <CostCenterComponenet
                  selectedCostCenters={roomDetails.room_type}
                  onSelectedItemObjectsChange={handleSelectedRoomType}
                  bookingType={'room'}
                  containerWidth={screenWidth * 0.85}
                />
              </View>
            </View>

            <View style={[styles.sectionView]}>
              <Text style={styles.title}>Billing Option</Text>
              <View style={{paddingVertical: 10}}>
                <SimpleDropDown
                  selectedCostCenters={roomDetails.billing_option}
                  onSelectedItemObjectsChange={handleSelectBillingOption}
                  bookingType={'billing'}
                  containerWidth={screenWidth * 0.85}
                />
              </View>
            </View>
            <View style={[styles.sectionView]}>
              <TouchableOpacity
                onPress={() => openModal('flight')}
                activeOpacity={0.8}>
                <Text style={styles.title}>Flight Details</Text>
                {!(roomDetails.pickup.isPickup || roomDetails.drop.isDrop) && (
                  <Text style={styles.subTitle}>{'Pickup / Drop'}</Text>
                )}
                {(roomDetails.pickup.isPickup || roomDetails.drop.isDrop) && (
                  <View style={{paddingTop: 5, flexDirection: 'row'}}>
                    {roomDetails.pickup.isPickup && (
                      <View style={{flex: 1}}>
                        <Text style={[styles.title, {fontSize: 14}]}>
                          {'Pick-up:'}
                        </Text>
                        <Text style={styles.subTitle}>
                          {roomDetails.pickup.flight}
                        </Text>
                        <Text style={styles.subTitle}>
                          {moment(roomDetails.pickup.time).format('hh:mm A')}
                        </Text>
                      </View>
                    )}
                    {roomDetails.drop.isDrop && (
                      <View style={{flex: 1}}>
                        <Text style={[styles.title, {fontSize: 14}]}>
                          {'Drop:'}
                        </Text>
                        <Text style={styles.subTitle}>
                          {roomDetails.drop.flight}
                        </Text>
                        <Text style={styles.subTitle}>
                          {moment(roomDetails.drop.time).format('hh:mm A')}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
                alignItems: 'flex-end',
                gap: 2,
                backgroundColor: Colors.natural_white,
                marginVertical: 15,
              }}>
              <GradientButton
                label={'Clear'}
                containerStyle={styles.clearButton}
                backgroundColors={[Colors.white, Colors.white]}
                textStyle={{color: Colors.start}}
                onClick={() => handleButtonClear()}
              />
              <GradientButton
                //loading={isLoading}
                label={'Next'}
                containerStyle={styles.nextButton}
                backgroundColors={[Colors.start, Colors.end]}
                onClick={handleContinue}
              />
            </View>
          </View>
        </ScrollView>
      </View>
      <Modal visible={showModal} transparent={true} animationType={'slide'}>
        <View style={{flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)'}}>
          {modalViewType.current === 'flight' && (
            <View
              style={{
                flex: 1,
                paddingTop: screenHeight * 0.1,
                backgroundColor: '#ffffff',
                paddingBottom: screenHeight * 0.05,
              }}>
              <View
                style={{
                  flex: 1,
                  paddingHorizontal: 10,
                  paddingVertical: 10,
                  backgroundColor: Colors.gray100,
                }}>
                <Checkbox.Item
                  position={'trailing'}
                  style={{paddingVertical: 0, paddingHorizontal: 0}}
                  labelStyle={styles.switchTitle}
                  mode={'android'}
                  color={Colors.primary}
                  uncheckedColor={Colors.gray500}
                  label="Airport Pickup"
                  status={roomDetails.pickup.isPickup ? 'checked' : 'unchecked'}
                  onPress={() => {
                    setRoomDetails(prevData => ({
                      ...prevData,
                      pickup: {
                        ...prevData.pickup,
                        isPickup: !prevData.pickup.isPickup,
                      },
                    }));
                  }}
                />
                {roomDetails.pickup.isPickup && (
                  <View style={{paddingTop: 10}}>
                    <Text style={[styles.label, {paddingBottom: 10}]}>
                      Flight Details
                    </Text>
                    <View style={styles.editBox}>
                      <FontAwesomeIcon
                        size={18}
                        icon={faPlane}
                        color={Colors.gray700}
                      />
                      <TextInput
                        style={styles.editText}
                        value={roomDetails.pickup.flight}
                        placeholder={Strings.Flight}
                        placeholderTextColor={Colors.gray500}
                        onChangeText={text => {
                          setRoomDetails(prevData => ({
                            ...prevData,
                            pickup: {...prevData.pickup, flight: text},
                          }));
                        }}
                      />
                    </View>
                    <Text
                      style={[
                        styles.label,
                        {paddingBottom: 10, paddingTop: 10},
                      ]}>
                      Flight Time
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        flightTimeType.current = 'pickup';
                        openTimePicker();
                      }}
                      style={styles.editBox}>
                      <FontAwesomeIcon
                        size={18}
                        icon={faClock}
                        color={Colors.gray700}
                      />
                      {/* <Text style={styles.editText}>{roomDetails.pickup.time.length>0?roomDetails.pickup.time:"Select Time"}</Text> */}
                      <TextInput
                        editable={false}
                        style={styles.editText}
                        value={
                          roomDetails.pickup.time
                            ? moment(roomDetails.pickup.time).format('hh:mm A')
                            : ''
                        }
                        placeholder={'Flight Time'}
                        placeholderTextColor={Colors.gray500}
                      />
                    </TouchableOpacity>
                  </View>
                )}
                <Checkbox.Item
                  position={'trailing'}
                  style={{paddingVertical: 0, paddingHorizontal: 0}}
                  labelStyle={styles.switchTitle}
                  mode={'android'}
                  color={Colors.primary}
                  uncheckedColor={Colors.gray500}
                  label="Airport Drop"
                  status={roomDetails.drop.isDrop ? 'checked' : 'unchecked'}
                  onPress={() => {
                    setRoomDetails(prevData => ({
                      ...prevData,
                      drop: {...prevData.drop, isDrop: !prevData.drop.isDrop},
                    }));
                  }}
                />
                {roomDetails.drop.isDrop && (
                  <View style={{paddingTop: 10}}>
                    <Text style={[styles.label, {paddingBottom: 10}]}>
                      Flight Details
                    </Text>
                    <View style={styles.editBox}>
                      <FontAwesomeIcon
                        size={18}
                        icon={faPlane}
                        color={Colors.gray700}
                      />
                      <TextInput
                        style={styles.editText}
                        value={roomDetails.drop.flight}
                        placeholder={Strings.Flight}
                        placeholderTextColor={Colors.gray500}
                        onChangeText={text => {
                          setRoomDetails(prevData => ({
                            ...prevData,
                            drop: {...prevData.drop, flight: text},
                          }));
                        }}
                      />
                    </View>
                    <Text
                      style={[
                        styles.label,
                        {paddingBottom: 10, paddingTop: 10},
                      ]}>
                      Flight Time
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        flightTimeType.current = 'drop';
                        openTimePicker();
                      }}
                      style={styles.editBox}>
                      <FontAwesomeIcon
                        size={18}
                        icon={faClock}
                        color={Colors.gray700}
                      />
                      <TextInput
                        editable={false}
                        style={styles.editText}
                        value={
                          roomDetails.drop.time
                            ? moment(roomDetails.drop.time).format('hh:mm A')
                            : ''
                        }
                        placeholder={'Flight Time'}
                        placeholderTextColor={Colors.gray500}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <View style={{marginVertical: 15, paddingHorizontal: 15}}>
                <GradientButton
                  label={'DONE'}
                  backgroundColors={[Colors.start, Colors.end]}
                  onClick={() => {
                    if (
                      roomDetails.pickup.isPickup &&
                      !(roomDetails.pickup.flight && roomDetails.pickup.time)
                    ) {
                      Alert.alert('Kindly Enter Pickup Details');
                    } else if (
                      roomDetails.drop.isDrop &&
                      !(roomDetails.drop.flight && roomDetails.drop.time)
                    ) {
                      Alert.alert('Kindly Enter Drop Details');
                    } else {
                      closeModal();
                    }
                  }}
                />
              </View>
            </View>
          )}
          {modalViewType.current === 'calendar' && (
            <View
              style={{
                flex: 1,
                paddingTop: screenHeight * 0.1,
                backgroundColor: '#ffffff',
                paddingBottom: screenHeight * 0.05,
              }}>
              <HotelBookingCalendar
                bookingDates={bookingDates}
                handleBookingDate={handleBookingDate}
                closeModal={closeModal}
              />
            </View>
          )}
          {modalViewType.current === 'room' && (
            <View style={{flex: 1}}>
              <View style={{flex: 1}}></View>
              <View
                style={{
                  height: screenHeight * 0.6,
                  backgroundColor: '#ffff',
                  width: 'auto',
                  borderTopLeftRadius: 15,
                  borderTopRightRadius: 15,
                  paddingHorizontal: 15,
                  paddingTop: 20,
                  paddingBottom: 5,
                }}>
                <View style={{flex: 1}}>
                  <Text style={styles.title}>Select Room and Guest</Text>
                  <CounterUI
                    title={'Rooms'}
                    counterValue={roomDetails.no_of_rooms}
                    handleIncrement={handleIncrement}
                    handleDecrement={handleDecrement}
                    counterType={'no_of_rooms'}
                  />
                  <CounterUI
                    title={'Adults'}
                    counterValue={roomDetails.no_of_adults}
                    handleIncrement={handleIncrement}
                    handleDecrement={handleDecrement}
                    counterType={'no_of_adults'}
                  />
                  <View
                    style={{
                      marginTop: 30,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                    <View style={{flex: 1}}>
                      <Checkbox.Item
                        position={'trailing'}
                        style={{paddingVertical: 0, paddingHorizontal: 0}}
                        labelStyle={styles.switchTitle}
                        mode={'android'}
                        color={Colors.primary}
                        uncheckedColor={Colors.gray500}
                        label="Family Trip"
                        status={
                          roomDetails.trip_type === 'family'
                            ? 'checked'
                            : 'unchecked'
                        }
                        onPress={() => {
                          setRoomDetails(prevData => ({
                            ...prevData,
                            trip_type:
                              prevData.trip_type === 'family'
                                ? 'official'
                                : 'family',
                          }));
                        }}
                      />
                    </View>
                  </View>
                  {roomDetails.trip_type === 'family' && (
                    <CounterUI
                      title={'Children'}
                      subTitle={'Age 0-12 years'}
                      counterValue={roomDetails.no_of_children}
                      handleIncrement={handleIncrement}
                      handleDecrement={handleDecrement}
                      counterType={'no_of_children'}
                    />
                  )}
                </View>
                <View style={{marginVertical: 15, paddingHorizontal: 15}}>
                  <GradientButton
                    label={'DONE'}
                    backgroundColors={[Colors.start, Colors.end]}
                    onClick={() => closeModal()}
                  />
                </View>
              </View>
            </View>
          )}
        </View>
        {showTimePicker && (
          <DateTimePickerModal
            isVisible={showTimePicker}
            mode="time"
            date={new Date()}
            onConfirm={handleConfirm}
            onCancel={hideTimePicker}
            themeVariant={'light'}
            is24Hour={true}
          />
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  switchTitle: {
    fontFamily: Fonts.Default.Medium,
    fontWeight: '700',
    fontSize: 18,
    color: Colors.gray700,
  },
  title: {
    fontFamily: Fonts.Default.Bold,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.classic_black,
  },
  subTitle: {
    fontFamily: Fonts.Default.Regular,
    fontSize: 14,
    color: Colors.gray500,
  },
  sectionView: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: Colors.silver_gray,
    paddingVertical: 15,
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
  editBox: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
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
  label: {
    fontFamily: Fonts.Default.Medium,
    fontWeight: '600',
    fontSize: 14,
    color: Colors.start,
  },
});
