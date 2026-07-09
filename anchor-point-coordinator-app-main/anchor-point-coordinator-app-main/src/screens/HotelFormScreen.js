import React, {useState, useRef, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import Fonts from '../theme/Fonts';
import Colors from '../theme/Colors';
import {screenWidth} from '../utils/Dimensions';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {
  faEnvelope,
  faIdCard,
  faStar,
  faUser,
} from '@fortawesome/free-regular-svg-icons';
import ReactNativePhoneInput from 'react-native-phone-input';
import ApiRequest from '../api/ApiRequest';
import EndPoints from '../api/EndPoints';
import {
  faAnchor,
  faMobileScreenButton,
} from '@fortawesome/free-solid-svg-icons';
import PhoneNumberInput from '../components/PhoneNumberInput';
import Strings from '../constants/Strings';
import GradientButton from '../components/GradientButton';
import {ViewComponent} from '../components/MainView';
import {useAppContext} from '../context/AppProvider';
import {useFormData} from '../context/FormDataProvider';
import ScreenNames from '../constants/ScreenNames';
import CabPhoneInput from '../components/CabPhoneInput';

import AsyncStorage from '@react-native-async-storage/async-storage';

export default HotelFormScreen = ({navigation, route}) => {
  const {hotelBookingDetails} = useAppContext();
  const {state, dispatch, clearFormData} = useFormData();
  const {no_of_adults, trip_type} = route.params;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [invalidNumberError, setinvalidNumberError] = useState(false);
  const [loadGuestDetails, setLoadGuestDetails] = useState(false);
  const [guestDetails, setGuestDetails] = useState([]);
  const [currentGuestDetails, setCurrentGuestDetails] = useState({});
  const [enableEdit, setEnableEdit] = useState(false);
  const [loadForm, setLoadForm] = useState(false);
  const scrollViewRef = useRef();
  const phoneComponentRef = useRef();

  const isValidEmail = email => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const hanldeErrorStatus = () => {
    if (!(currentGuestDetails?.name != null)) {
      Alert.alert('Enter Guest name');
      return true;
    } else if (
      !(
        currentGuestDetails?.email != null &&
        isValidEmail(currentGuestDetails?.email)
      )
    ) {
      Alert.alert('Enter Guest Email');
      return true;
    } else if (!(currentGuestDetails?.vessel_name != null)) {
      Alert.alert('Enter Vessel Name');
      return true;
    }
  };
  const handleNext = () => {
    if (hanldeErrorStatus()) {
      return;
    }
    if (currentIndex < no_of_adults - 1) {
      if (trip_type === 'family' && currentIndex === 0) {
        Alert.alert(
          'Confirm',
          'You can optionally include information of additional family members joining on this trip \n If not, please press Confirm Booking to proceed.',
          [
            {
              text: 'Confirm Booking',
              onPress: () => handleBooking(),
            },
            {text: 'Add Guest', onPress: () => handleAddGuest()},
          ],
        );
      } else {
        handleAddGuest();
      }
    } else if (currentIndex === no_of_adults - 1) {
      handleBooking();
    }
  };
  const handleBooking = () => {
    var tempGuest = [...guestDetails];
    tempGuest[0] = {...currentGuestDetails};
    setGuestDetails([...tempGuest]);
    dispatch({
      type: 'ADD_GUEST',
      payload: {
        guest: currentGuestDetails,
        counter: no_of_adults,
        index: currentIndex,
      },
    });
    setTimeout(() => {
      navigation.navigate(ScreenNames.SCREEN_HOTELBOOKINGREVIEW, {
        screenName: 'FormScreen',
      });
    }, 100);
  };
  const handleAddGuest = () => {
    setLoadForm(true);
    var tempGuest = [...guestDetails];
    tempGuest[0] = {...currentGuestDetails};
    dispatch({
      type: 'ADD_GUEST',
      payload: {
        guest: currentGuestDetails,
        counter: no_of_adults,
        index: currentIndex,
      },
    });
    setGuestDetails([...tempGuest]);
    setCurrentGuestDetails({});
    setCurrentIndex(prevData => prevData + 1);
    setEnableEdit(false);
    phoneComponentRef.current.clear();
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({y: 0, animated: true});
    }
    setLoadForm(false);
  };
  const handleGoBack = () => {
    if (currentIndex >= 1) {
      setEnableEdit(true);
      setCurrentIndex(prevData => prevData - 1);
      var tempGuest = [...guestDetails];
      setCurrentGuestDetails({...tempGuest[currentIndex - 1]});
      setTimeout(() => {
        phoneComponentRef.current.setValue();
      }, 100);
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({y: 0, animated: true});
      }
    } else {
      navigation.goBack();
    }
  };
  const handlePhoneInputError = () => {
    setinvalidNumberError(true);
    setEnableEdit(false);
  };
  const handlePhoneInputValue = phoneNumber => {
    setinvalidNumberError(false);
    handleGuestDetails(phoneNumber);
  };
  const handleGuestDetails = phoneNumber => {
    setLoadGuestDetails(true);
    ApiRequest({
      url: `${EndPoints.GuestDetails}`,
      data: {
        mobile: phoneNumber,
        booking_type: 'Hotel',
      },
      method: 'POST',
    })
      .then(response => {
        setTimeout(() => {
          var tempGuest = [...guestDetails];
          tempGuest[currentIndex] =
            Object.keys(response?.guest).length > 0
              ? response?.guest
              : {mobile: phoneNumber};
          setGuestDetails([...tempGuest]);
          setCurrentGuestDetails(
            Object.keys(response?.guest).length > 0
              ? {...response?.guest}
              : {mobile: phoneNumber},
          );
          setLoadGuestDetails(false);
          setEnableEdit(true);
        }, 500);
      })
      .catch(error => {
        setLoadGuestDetails(false);
        setEnableEdit(true);
        console.error('Fetch Guest Details Error', error);
      });
  };
  const handleInputChange = (type, value) => {
    setCurrentGuestDetails(prevData => ({...prevData, [type]: value}));
  };

  const handleMyself = async () => {
    try {
      const storedName = await AsyncStorage.getItem(Keys.NAME);
      const storedEmail = await AsyncStorage.getItem(Keys.EMAIL);
      const storedPhone = await AsyncStorage.getItem(Keys.PHONE);

      if (storedName || storedEmail || storedPhone) {
        setCurrentGuestDetails({
          name: storedName,
          email: storedEmail,
          mobile: storedPhone.trim(),
        });

        setEnableEdit(true);
      }
    } catch (error) {
      // console.error('Error fetching data from AsyncStorage', error);
    }
  };

  return (
    <ViewComponent style={{flex: 1, backgroundColor: Colors.natural_white}}>
      <View style={{flex: 1, paddingHorizontal: 15, paddingTop: 15}}>
        <Text style={styles.title}>{'Enter People Info'}</Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Text style={styles.subtitle}>
            {currentIndex == 0 ? `Primary Guest` : `Guest ${currentIndex + 1}`}
          </Text>
          <TouchableOpacity
            onPress={handleMyself}
            //   onPress={()=>phoneComponentRef.current.clear()}
          >
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
        </View>
        <View style={styles.horizontalLine} />
        <ScrollView
          automaticallyAdjustKeyboardInsets
          automaticallyAdjustContentInsets={false}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          contentContainerStyle={{flexGrow: 1}}>
          <View style={{gap: 8, marginVertical: 5}}>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
              }}>
              <Text style={styles.label}>Mobile Number</Text>
              <Text style={{color: 'red'}}>*</Text>
            </View>
            <View style={styles.editBox}>
              <FontAwesomeIcon icon={faMobileScreenButton} size={18} />
              <View style={{flexDirection: 'row', marginLeft: 14}}>
                <CabPhoneInput
                  ref={phoneComponentRef}
                  placeholder="Enter your phone number"
                  initialCountry="in"
                  initialValue={currentGuestDetails?.mobile}
                  onError={error => console.log('Error:', error)}
                  handlePhoneInput={handlePhoneInputValue}
                />
                {loadGuestDetails && (
                  <ActivityIndicator
                    color={Colors.classic_black}
                    size={'small'}
                  />
                )}
              </View>
            </View>
            {invalidNumberError && (
              <Text style={styles.error}>{'Invalid Number'}</Text>
            )}
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
              }}>
              <Text style={styles.label}>Name</Text>
              <Text style={{color: 'red'}}>*</Text>
            </View>
            <View style={styles.editBox}>
              <FontAwesomeIcon size={18} icon={faUser} color={Colors.gray700} />
              <TextInput
                editable={enableEdit}
                style={styles.editText}
                value={currentGuestDetails?.name}
                placeholder={Strings.full_name}
                placeholderTextColor={Colors.gray500}
                onChangeText={text => handleInputChange('name', text)}
              />
            </View>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
              }}>
              <Text style={styles.label}>Email</Text>
              <Text style={{color: 'red'}}>*</Text>
            </View>
            <View style={styles.editBox}>
              <FontAwesomeIcon
                size={18}
                icon={faEnvelope}
                color={Colors.gray700}
              />
              <TextInput
                editable={enableEdit}
                style={styles.editText}
                value={currentGuestDetails?.email}
                placeholder={Strings.email}
                placeholderTextColor={Colors.gray500}
                onChangeText={text => handleInputChange('email', text)}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            <Text style={styles.label}>Rank</Text>
            <View style={styles.editBox}>
              <FontAwesomeIcon size={18} icon={faStar} color={Colors.gray700} />
              <TextInput
                editable={enableEdit}
                style={styles.editText}
                value={currentGuestDetails?.rank}
                placeholder={Strings.rank}
                placeholderTextColor={Colors.gray500}
                onChangeText={text => handleInputChange('rank', text)}
              />
            </View>
            <Text style={styles.label}>Internal Id</Text>
            <View style={styles.editBox}>
              <FontAwesomeIcon
                size={18}
                icon={faIdCard}
                color={Colors.gray700}
              />
              <TextInput
                editable={enableEdit}
                style={styles.editText}
                value={currentGuestDetails?.internal_id}
                placeholder={Strings.id}
                placeholderTextColor={Colors.gray500}
                onChangeText={text => handleInputChange('internal_id', text)}
              />
            </View>
            <Text style={styles.label}>Vessel Name</Text>
            <View style={styles.editBox}>
              <FontAwesomeIcon
                size={18}
                icon={faAnchor}
                color={Colors.gray700}
              />
              <TextInput
                editable={enableEdit}
                style={styles.editText}
                value={currentGuestDetails?.vessel_name}
                placeholder={Strings.Vessel}
                placeholderTextColor={Colors.gray500}
                onChangeText={text => handleInputChange('vessel_name', text)}
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
            marginTop: 30,
          }}>
          <GradientButton
            //loading={loadForm}
            label={'Back'}
            containerStyle={{
              width: 171,
              height: 67,
              borderColor: Colors.start,
              borderWidth: 1,
            }}
            backgroundColors={[Colors.white, Colors.white]}
            textStyle={{color: Colors.start}}
            onClick={handleGoBack}
          />
          <GradientButton
            loading={loadForm}
            disabled={!enableEdit}
            label={currentIndex + 1 == no_of_adults ? 'Continue' : 'Add Guest'}
            containerStyle={{
              width: 171,
              height: 67,
            }}
            backgroundColors={[Colors.start, Colors.end]}
            onClick={handleNext}
          />
        </View>
      </View>
    </ViewComponent>
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
  horizontalLine: {
    height: 2,
    backgroundColor: Colors.start,
    marginBottom: 5,
    marginTop: 10,
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
});
