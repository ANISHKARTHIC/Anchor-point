import React, {useState, useCallback, useEffect, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  Button,
  ActivityIndicator,
} from 'react-native';
import {useFormData} from '../context/FormDataProvider';
import {useAppContext} from '../context/AppProvider';
import ApiRequest from '../api/ApiRequest';
import EndPoints from '../api/EndPoints';
import {ViewComponent} from '../components/MainView';
import GradientButton from '../components/GradientButton';
import Colors from '../theme/Colors';
import Fonts from '../theme/Fonts';
import {screenHeight, screenWidth} from '../utils/Dimensions';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {
  faAngleLeft,
  faAngleRight,
  faCircleExclamation,
  faCircleXmark,
  faClockRotateLeft,
  faCross,
  faDumpster,
  faEnvelope,
  faXmark,
  faComments,
} from '@fortawesome/free-solid-svg-icons';
import {
  faCircleCheck,
  faPenToSquare,
} from '@fortawesome/free-regular-svg-icons';
import 'react-native-get-random-values';
import {v4 as uuidv4} from 'uuid';
import {text} from '@fortawesome/fontawesome-svg-core';
import ScreenNames from '../constants/ScreenNames';
import {initialHotelBookingData} from '../context/AppProvider';
import moment from 'moment';

export default HotelBookingReview = ({navigation, route}) => {
  const {screenName, bookingDetails, editable} = route?.params ?? {};
  const {hotelBookingDetails, setHotelBookingDetails} =
    screenName === 'FormScreen' ? useAppContext() : bookingDetails;
  const {state} = useFormData();

  const [hotelGuestDetails, setHotelGuestDetails] = useState([]);
  const [hotelEditReq, setHotelEditReq] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [inputHeight, setInputHeight] = useState(100);
  const [description, setDescription] = useState('');
  const [emailList, setEmailList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const vendorEmail = useRef();
  const modalType = useRef('');
  const flatListRef = useRef();
  const [errorIndex, setErrorIndex] = useState([]);
  const [loadForm, setisLoadForm] = useState(false);

  useEffect(() => {
    const getVendorEmail = async () => {
      vendorEmail.current = await AsyncStorage.getItem('EMAIL');
    };
    getVendorEmail();
    getEmailList();
  }, []);
  useEffect(() => {
    if (errorIndex.length > 0) {
      let index = errorIndex[0];
      flatListRef.current?.scrollToIndex({index, animated: true});
    }
  }, [errorIndex]);
  useEffect(() => {
    if (screenName === 'BookingList') {
      getHotelGuestList();
      getHotelEditRequest();
    }
  }, []);
  handleCloseModal = () => {
    setModalData();
    setErrorIndex([]);
    setOpenModal(false);
  };
  handleOpenModal = type => {
    modalType.current = type;
    if (type === 'EDITLIST' && hotelEditReq.length == 0) {
      return Alert.alert('This booking has no Edit request');
    }
    if (type === 'GUEST') {
      if (screenName === 'FormScreen') {
        setModalData([...state.guests]);
      } else {
        if (hotelGuestDetails.length == 0) {
          return Alert.alert('Kindly wait, retrieving guest data');
        } else {
          setModalData([...hotelGuestDetails].reverse());
        }
      }
    } else if (type === 'EDITLIST') {
      setModalData([...hotelEditReq]);
    } else if (type === 'EMAIL') {
      if (emailList.length > 0) {
        let tempList = emailList.map(item => ({id: uuidv4(), value: item}));
        navigation.navigate(ScreenNames.SCREEN_EMAILCC, {
          emailList: [...tempList],
          editable: true,
          screenName: 'BookingList',
          handleEmailList: setEmailList,
        });
        //setModalData([...tempList]);
      } else {
        //setModalData([{id: uuidv4(), value: ''}]);
        navigation.navigate(ScreenNames.SCREEN_EMAILCC, {
          emailList: [{id: uuidv4(), value: ''}],
          editable: true,
          screenName: 'BookingList',
          handleEmailList: setEmailList,
        });
      }
    } else {
      setModalData([]);
    }
    setDescription('');
    type != 'EMAIL' && setOpenModal(true);
  };
  const getEmailList = () => {
    if (
      screenName === 'FormScreen' ||
      (hotelBookingDetails?.cc_recipients != null &&
        hotelBookingDetails?.cc_recipients.length == 0)
    ) {
      setEmailList([]);
    } else if (hotelBookingDetails?.cc_recipients != null) {
      setEmailList([...hotelBookingDetails?.cc_recipients]);
    } else {
      setEmailList([]);
    }
  };
  const getHotelGuestList = () => {
    let tempReqURL = `${EndPoints.PostHotelBooking}${hotelBookingDetails?.id}/guests`;
    ApiRequest({
      url: tempReqURL,
      method: 'GET',
    })
      .then(response => {
        if (response?.hotel_booking_guests) {
          //var tempArr = new Array(20).fill({"email": "daniel.arvind@bigthinkcode.com", "id": 24, "internal_id": "001", "is_primary": true, "mobile": "+919600824918", "name": "Daniel", "rank": "001", "vessel_name": "Anchor"}).map(item=>item)
          setHotelGuestDetails([...response?.hotel_booking_guests]);
          //setHotelGuestDetails([...tempArr])
        }
      })
      .catch(err => console.error('Error in Fetch hotel guest details'));
  };
  const getHotelEditRequest = () => {
    let tempReqURL = `${EndPoints.PostHotelBooking}${hotelBookingDetails?.id}/edit`;
    ApiRequest({
      url: tempReqURL,
      method: 'GET',
    })
      .then(response => {
        console.log('getHotelEditRequest', response);
        if (response?.hotel_booking_edit_requests) {
          //var tempArr = new Array(20).fill({"booking_id": "dcf05883-e426-44d5-a75d-10b9b73365b6", "created_at": "2024-10-04T09:53:16.648059+05:30", "description": "request to change date from 4 to 10 October ", "id": 8, "metadata": [Object], "status": "requested"}).map(item=>item)
          setHotelEditReq([...response?.hotel_booking_edit_requests]);
          //setHotelEditReq([...tempArr])
        }
      })
      .catch(err => console.error('Error in Fetch hotel Edit details'));
  };
  const handleEditRequest = () => {
    handleCloseModal();
    let tempReqURL = `${EndPoints.PostHotelBooking}${hotelBookingDetails?.id}/edit`;
    let tempReqData = {
      status: 'edit_requested',
      booking_id: hotelBookingDetails?.id,
      description: description,
      metadata: {},
    };
    ApiRequest({
      url: tempReqURL,
      method: 'POST',
      data: tempReqData,
    })
      .then(response => {
        getHotelEditRequest();
        setTimeout(() => {
          Toast.show({
            type: 'success',
            position: 'top',
            text1: 'Change Request',
            text2: 'Your booking change request is sucessfully sent',
          });
        }, 500);
      })
      .catch(err => {
        console.error('Change Request Error', err);
        setTimeout(() => {
          Toast.show({
            type: 'error',
            position: 'top',
            text1: 'Change Request',
            text2: 'Unable to send change request',
          });
        }, 500);
      });
  };
  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleNext = () => {
    setisLoadForm(true);

    var tempCostCenter = {
      id: hotelBookingDetails.cost_centre[0].id,
      code: hotelBookingDetails.cost_centre[0].name,
    };
    var tempGuest = [...state.guests].map(item => ({
      ...item,
      is_primary: false,
    }));
    tempGuest[0] = {...tempGuest[0], is_primary: true};
    var tempReqData = {
      ...hotelBookingDetails,
      cc_recipients: emailList,
      coordinator_email: vendorEmail.current,
      guests: [...tempGuest],
      city: hotelBookingDetails.city[0].name,
      cost_centre: tempCostCenter,
      room_type: hotelBookingDetails?.room_type[0]?.name,
      billing_option: hotelBookingDetails?.billing_option?.[0]?.name,
    };
    let tempPickup;
    if (hotelBookingDetails?.pickup && hotelBookingDetails?.pickup.isPickup) {
      tempPickup = {...hotelBookingDetails?.pickup};
      let timeString = moment(tempPickup.time).format('HH:mm');
      tempPickup.time = timeString;
      tempReqData['pickup'] = tempPickup;
    }
    let tempDrop;
    if (hotelBookingDetails?.drop && hotelBookingDetails?.drop.isDrop) {
      tempDrop = {...hotelBookingDetails?.drop};
      let timeString = moment(tempDrop.time).format('HH:mm');
      tempDrop.time = timeString;
      tempReqData['drop'] = tempDrop;
    }

    console.log('tempReqData-----', JSON.stringify(tempReqData, null, 2));

    ApiRequest({
      url: EndPoints.PostHotelBooking,
      method: 'POST',
      data: tempReqData,
    })
      .then(response => {
        setTimeout(() => {
          Toast.show({
            type: 'success',
            position: 'top',
            text1: 'Hotel Booking',
            text2: 'Your request is sucessfully submitted',
          });
          navigation.navigate('HomeScreen');
          navigation.navigate('Bookings');
          setHotelBookingDetails({...initialHotelBookingData});
        }, 1000);
      })
      .catch(error => {
        setisLoadForm(false);
        console.error('Booking request errors', error);
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Hotel Booking Error',
          text2:
            'There was an error submitting your booking. Please try again.',
        });
      });
  };

  const getStatusView = status => {
    var {icons, icon_colors, statusText} = '';
    if (status === 'edit_requested') {
      icons = faClockRotateLeft;
      icon_colors = 'red';
      statusText = 'Requested';
    } else if (status === 'edit_acknowledged') {
      icons = faCircleCheck;
      icon_colors = 'orange';
      statusText = 'Acknowledged';
    } else if (status === 'edit_confirmed') {
      icons = faCircleCheck;
      icon_colors = 'green';
      statusText = 'Confirmed';
    } else {
      icons = faCircleExclamation;
      icon_colors = 'blue';
      statusText = 'Contact Organiser';
    }
    return (
      <View style={{flexDirection: 'row', gap: 10, alignItems: 'center'}}>
        <FontAwesomeIcon color={icon_colors} icon={icons}></FontAwesomeIcon>
        <Text style={styles.statustext}>{statusText}</Text>
      </View>
    );
  };
  const isValidEmail = email => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  const handleEmailListSave = () => {
    var findErrorIndex = modalData.reduce(
      (acc, e, index) => (isValidEmail(e.value) ? acc : [...acc, index]),
      [],
    );
    if (findErrorIndex.length > 0) {
      setErrorIndex([...findErrorIndex]);
    } else {
      let tempList = modalData
        .filter(item => (item.value ? true : false))
        .map(item => item.value);
      setErrorIndex([]);
      setEmailList([...tempList]);
      handleCloseModal();
    }
  };
  const handleDeleteEmail = id => {
    if (modalData.length == 1) {
      setModalData([{id: uuidv4(), value: ''}]);
      setErrorIndex([]);
    } else {
      let tempFilter = [...modalData].filter(item => item.id != id);
      let tempList = [...tempFilter].reduce(
        (acc, e, index) => (isValidEmail(e.value) ? acc : [...acc, index]),
        [],
      );
      setErrorIndex([...tempList]);
      setModalData([...tempFilter]);
    }
  };
  const getBookingDetailsById = () => {
    setIsLoading(true);
    let tempReqURL = `${EndPoints.GetHotelBooking}?bid=${hotelBookingDetails?.related_booking_id}`;
    ApiRequest({
      url: tempReqURL,
      method: 'GET',
    })
      .then(response => {
        if (response.bookings) {
          setTimeout(() => {
            setIsLoading(false);
            setTimeout(() => {
              navigation.push(ScreenNames.SCREEN_HOTELBOOKINGREVIEW, {
                screenName: 'BookingList',
                bookingDetails: {
                  hotelBookingDetails: {...response.bookings[0]},
                },
                editable: false,
                animation: 'slide_from_bottom',
              });
            }, 100);
          }, 1000);
        } else {
          setIsLoading(false);
          Alert.alert('Details Not Found');
        }
      })
      .catch(err => {
        setIsLoading(false);
        console.error('Error in Fetch booking details based on bid');
      });
  };
  const renderItem = ({item, index}) => {
    if (modalType.current === 'GUEST') {
      return (
        <UserCard
          name={item.name}
          email={item.email}
          phoneNumber={item.mobile}
          vesselName={item.vessel_name}
          is_primary={item.is_primary}
        />
      );
    } else if (modalType.current === 'EMAIL') {
      const {id, value} = item;
      return (
        <View
          style={[
            styles.card,
            {
              backgroundColor: '#fff',
              width: '100%',
              padding: 10,
              borderRadius: 5,
            },
          ]}>
          <View
            style={{
              width: '100%',
              borderColor: Colors.gray500,
              borderWidth: 0.5,
              padding: 10,
              borderRadius: 3,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <FontAwesomeIcon
              size={18}
              icon={faEnvelope}
              color={Colors.gray700}
            />
            <TextInput
              style={{
                flex: 1,
                marginRight: 5,
                marginLeft: 5,
                fontFamily: Fonts.Default.Regular,
                color: Colors.black,
                fontSize: 18,
              }}
              value={value}
              placeholder={'Enter Email ID'}
              autoCapitalize={'none'}
              keyboardType={'email-address'}
              onChangeText={text =>
                setModalData(
                  modalData.map(input =>
                    input.id === id ? {...input, value: text} : input,
                  ),
                )
              }
            />
            <TouchableOpacity onPress={() => handleDeleteEmail(id)} style={{}}>
              <FontAwesomeIcon
                size={16}
                icon={faCircleXmark}
                color={Colors.error}
              />
            </TouchableOpacity>
          </View>
          {errorIndex.length > 0 && errorIndex.includes(index) && (
            <View style={{alignSelf: 'flex-end'}}>
              <Text style={styles.error}>Invalid Email ID</Text>
            </View>
          )}
        </View>
      );
    } else {
      return (
        <EditReqCard
          description={item.description}
          status={item.status}
          metadata={item.metadata}
        />
      );
    }
  };
  const UserCard = ({name, email, phoneNumber, vesselName, is_primary}) => {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: '#fff',
            width: '100%',
            padding: 10,
            borderRadius: 5,
          },
        ]}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <Text style={styles.name}>{name}</Text>
          {is_primary && <FontAwesomeIcon icon={faCircleCheck} color="green" />}
        </View>
        <Text style={styles.detail}>Email: {email}</Text>
        <Text style={styles.detail}>Phone: {phoneNumber}</Text>
        <Text style={styles.detail}>Vessel: {vesselName}</Text>
      </View>
    );
  };
  const EditReqCard = ({description, status, metadata}) => {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: '#fff',
            width: '100%',
            padding: 10,
            borderRadius: 5,
          },
        ]}>
        <View>
          <Text style={styles.name}>{'Description'}</Text>
          <Text style={styles.detail}>{description}</Text>
        </View>
        <View
          style={{
            height: 1,
            backgroundColor: Colors.gray100,
            width: '100%',
            marginVertical: 5,
          }}></View>
        <View style={{paddingTop: 5}}>
          {getStatusView(status)}
          {metadata?.confirm_description && (
            <Text style={styles.detail}>{metadata.confirm_description}</Text>
          )}
        </View>
      </View>
    );
  };
  const identifyFormat = dateString => {
    if (moment(dateString, moment.ISO_8601, true).isValid()) {
      return moment(dateString).format('HH:mm');
    }
    if (moment(dateString, 'HH:mm', true).isValid()) {
      return dateString;
    }
    return '--';
  };

  return (
    <ViewComponent style={{flex: 1, paddingBottom: 15}}>
      <View
        style={{
          width: '100%',
          backgroundColor: Colors.silver_gray,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        {screenName === 'BookingList' && (
          <TouchableOpacity style={{marginLeft: 15}} onPress={handleGoBack}>
            <FontAwesomeIcon icon={faAngleLeft} size={16} color={Colors.dark} />
          </TouchableOpacity>
        )}

        <View style={{flex: 1, alignItems: 'center'}}>
          <Text
            style={[
              styles.title,
              {paddingHorizontal: 15, paddingVertical: 15},
            ]}>
            {'Booking Summary'}
          </Text>
        </View>
        {screenName === 'BookingList' && editable != null && editable && (
          <View style={{paddingRight: 15}}>
            <TouchableOpacity onPress={() => handleOpenModal('EDIT')}>
              <FontAwesomeIcon icon={faPenToSquare} size={20}></FontAwesomeIcon>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View style={{paddingHorizontal: 15, paddingTop: 5}}>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            rowGap: 10,
            columnGap: 30,
            width: '100%',
          }}>
          {screenName === 'BookingList' && (
            <View style={styles.flexBox}>
              <Text style={styles.title}>{'Confirmation No'}</Text>
              <Text style={styles.subtitle}>
                {hotelBookingDetails?.confirmation_no}
              </Text>
            </View>
          )}
          <View style={styles.flexBox}>
            <Text style={styles.title}>{'Check-In'}</Text>
            <Text style={styles.subtitle}>{hotelBookingDetails.check_in}</Text>
          </View>
          <View style={[styles.flexBox, {}]}>
            <Text style={styles.title}>{'Check-Out'}</Text>
            <Text style={[styles.subtitle]}>
              {hotelBookingDetails.check_out}
            </Text>
          </View>
          <View style={styles.flexBox}>
            <Text style={styles.title}>{'City'}</Text>
            <Text style={styles.subtitle}>
              {screenName === 'FormScreen'
                ? hotelBookingDetails.city[0].name
                : hotelBookingDetails.city}
            </Text>
          </View>
          <View style={styles.flexBox}>
            <Text style={styles.title}>{'Rooms'}</Text>
            <Text style={styles.subtitle}>
              {hotelBookingDetails.no_of_rooms}
            </Text>
          </View>
          <View style={styles.flexBox}>
            <Text style={styles.title}>{'Adults'}</Text>
            <Text style={styles.subtitle}>
              {hotelBookingDetails.no_of_adults}
            </Text>
          </View>
          <View style={styles.flexBox}>
            <Text style={styles.title}>{'Trip Type'}</Text>
            <Text style={styles.subtitle}>{hotelBookingDetails.trip_type}</Text>
          </View>
          <View style={styles.flexBox}>
            <Text style={styles.title}>{'Room Type'}</Text>
            <Text style={styles.subtitle}>
              {screenName === 'FormScreen'
                ? hotelBookingDetails?.room_type[0]?.name
                : hotelBookingDetails?.room_type}
            </Text>
          </View>
          <View style={styles.flexBox}>
            <Text style={styles.title}>{'Cost Center'}</Text>
            <Text style={[styles.subtitle]}>
              {screenName === 'FormScreen'
                ? hotelBookingDetails.cost_centre[0].name
                : hotelBookingDetails?.cost_centre?.code}
            </Text>
          </View>
          {hotelBookingDetails != null &&
            hotelBookingDetails?.pickup &&
            hotelBookingDetails?.pickup.flight && (
              <View style={styles.flexBox}>
                <Text style={styles.title}>{'Pickup'}</Text>
                <Text ellipsizeMode={'tail'} style={styles.subtitle}>
                  {'Flight:'}
                  {hotelBookingDetails.pickup.flight}
                </Text>
                <Text style={styles.subtitle}>
                  {'Time:'}
                  {identifyFormat(hotelBookingDetails.pickup.time)}
                </Text>
              </View>
            )}
          {hotelBookingDetails != null &&
            hotelBookingDetails?.drop &&
            hotelBookingDetails?.drop.flight && (
              <View style={styles.flexBox}>
                <Text style={styles.title}>{'Drop'}</Text>
                <Text ellipsizeMode={'tail'} style={styles.subtitle}>
                  {'Flight:'}
                  {hotelBookingDetails.drop.flight}
                </Text>
                <Text style={styles.subtitle}>
                  {'Time:'}
                  {identifyFormat(hotelBookingDetails.drop.time)}
                </Text>
              </View>
            )}
          {screenName === 'BookingList' &&
            hotelBookingDetails != null &&
            hotelBookingDetails?.related_booking_id && (
              <View style={{position: 'relative'}}>
                <TouchableOpacity
                  onPress={() => !isLoading && getBookingDetailsById()}
                  style={styles.flexBox}>
                  <Text style={styles.title}>{'Supporting Details'}</Text>
                  <Text style={[styles.subtitle]}>
                    {'Booking based on '}
                    <Text style={[styles.title, {fontSize: 16}]}>
                      {hotelBookingDetails.related_booking_id}
                    </Text>
                  </Text>
                </TouchableOpacity>
                {isLoading && (
                  <View
                    style={{
                      position: 'absolute',
                      zIndex: 3,
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      justifyContent: 'center',
                      alignItems: 'center',
                      flex: 1,
                      width: '100%',
                      height: '100%',
                    }}>
                    <View style={{padding: 5, backgroundColor: '#ffffff'}}>
                      <ActivityIndicator size={'small'} color={Colors.black} />
                    </View>
                  </View>
                )}
              </View>
            )}
        </View>
      </View>
      <View style={{flex: 1}}>
        <TouchableOpacity
          onPress={() => handleOpenModal('GUEST')}
          style={styles.detailBox}>
          <Text style={[styles.title, {color: Colors.classic_black}]}>
            View All Guest
          </Text>
          <FontAwesomeIcon
            icon={faAngleRight}
            color={Colors.gray500}
            size={20}
          />
        </TouchableOpacity>
        {screenName === 'BookingList' && (
          <TouchableOpacity
            onPress={() => handleOpenModal('EDITLIST')}
            style={[styles.detailBox, {paddingVertical: 5}]}>
            <Text style={[styles.title, {color: Colors.classic_black}]}>
              View Edit Request
            </Text>
            <FontAwesomeIcon
              icon={faAngleRight}
              color={Colors.gray500}
              size={20}
            />
          </TouchableOpacity>
        )}
        {screenName === 'BookingList' && (
          <TouchableOpacity
            onPress={() => handleOpenModal('EMAIL')}
            style={[styles.detailBox, {paddingVertical: 20}]}>
            <Text style={[styles.title, {color: Colors.classic_black}]}>
              View Email
            </Text>
            <FontAwesomeIcon
              icon={faAngleRight}
              color={Colors.gray500}
              size={20}
            />
          </TouchableOpacity>
        )}
        {screenName === 'FormScreen' && (
          <TouchableOpacity
            onPress={() => handleOpenModal('EMAIL')}
            style={styles.detailBox}>
            <Text style={[styles.title, {color: Colors.classic_black}]}>
              Add Email
            </Text>
            <FontAwesomeIcon
              icon={faAngleRight}
              color={Colors.gray500}
              size={20}
            />
          </TouchableOpacity>
        )}
      </View>
      {screenName === 'FormScreen' && (
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
              width: screenWidth * 0.45,
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
            //disabled={!enableEdit}
            label={'Place Request'}
            containerStyle={{
              width: screenWidth * 0.45,
              height: 67,
            }}
            backgroundColors={[Colors.start, Colors.end]}
            onClick={handleNext}
          />
        </View>
      )}
      <Modal animationType={'slide'} visible={openModal} transparent={true}>
        {modalType.current === 'EDIT' && (
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              padding: 20,
              justifyContent: 'flex-start',
              alignItems: 'center',
            }}>
            <View
              style={{
                backgroundColor: Colors.white,
                width: screenWidth * 0.85,
                marginTop: 50,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: Colors.classic_black,
                  paddingVertical: 15,
                  paddingHorizontal: 15,
                }}>
                <Text style={[styles.title, {color: Colors.white}]}>
                  {'Change Request Description'}
                </Text>
                <TouchableOpacity onPress={handleCloseModal}>
                  <FontAwesomeIcon size={20} color="white" icon={faXmark} />
                </TouchableOpacity>
              </View>
              <View style={{padding: 15}}>
                <View
                  style={{
                    minHeight: 100,
                    borderColor: Colors.gray500,
                    borderWidth: 1,
                    borderRadius: 8,
                    width: '100%',
                  }}>
                  <TextInput
                    value={description}
                    style={[styles.textInput, {height: inputHeight}]}
                    multiline={true}
                    placeholder="Description"
                    onContentSizeChange={event => {
                      const newHeight = event.nativeEvent.contentSize.height;
                      // Ensure the TextInput grows up to the maximum height of 200
                      if (newHeight < 250) {
                        setInputHeight(newHeight);
                      } else {
                        setInputHeight(250); // Once it reaches max height, set it to 200
                      }
                    }}
                    onChangeText={text => setDescription(text)}
                  />
                </View>
                <View
                  style={{
                    paddingVertical: 15,
                    justifyContent: 'center',
                    paddingLeft: 5,
                  }}>
                  <GradientButton
                    label={'Send'}
                    containerStyle={{
                      width: screenWidth * 0.75,
                      height: 40,
                      // borderColor: Colors.start,
                      // borderWidth: 1,
                    }}
                    backgroundColors={[Colors.start, Colors.end]}
                    textStyle={{color: Colors.white}}
                    onClick={description.length > 0 && handleEditRequest}
                  />
                </View>
              </View>
            </View>
          </View>
        )}
        {(modalType.current === 'GUEST' ||
          modalType.current === 'EDITLIST' ||
          modalType.current === 'EMAIL') && (
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              padding: 20,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <View
              style={{
                backgroundColor: Colors.white,
                minHeight: screenHeight * 0.1,
                maxHeight: screenHeight * 0.9,
                width: screenWidth * 0.92,
                borderRadius: 10,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: Colors.classic_black,
                  paddingVertical: 15,
                  paddingHorizontal: 15,
                  borderTopRightRadius: 10,
                  borderTopLeftRadius: 10,
                }}>
                <Text style={[styles.title, {color: Colors.white}]}>
                  {modalType.current === 'GUEST'
                    ? 'Guests Details'
                    : modalType.current === 'EMAIL'
                    ? 'Email Recipients'
                    : 'Change Request'}
                </Text>
                <TouchableOpacity onPress={handleCloseModal}>
                  <FontAwesomeIcon size={20} color="white" icon={faXmark} />
                </TouchableOpacity>
              </View>
              <View
                style={{
                  padding: 15,
                  backgroundColor: Colors.gray100,
                  borderBottomLeftRadius: 10,
                  borderBottomRightRadius: 10,
                }}>
                <FlatList
                  ref={flatListRef}
                  automaticallyAdjustKeyboardInsets
                  automaticallyAdjustContentInsets={false}
                  bounces={false}
                  showsVerticalScrollIndicator={false}
                  keyboardDismissMode="interactive"
                  contentContainerStyle={{flexGrow: 1}}
                  style={{maxHeight: screenHeight * 0.8}}
                  data={modalData}
                  renderItem={renderItem}
                  keyExtractor={item => item.email}
                  ItemSeparatorComponent={() => {
                    return (
                      <View
                        style={{
                          height: 10,
                          width: '100%',
                          backgroundColor: Colors.gray100,
                        }}></View>
                    );
                  }}
                />
                {modalType.current === 'EMAIL' && (
                  <View
                    style={{
                      paddingTop: 15,
                      justifyContent: 'space-around',
                      alignItems: 'center',
                      flexDirection: 'row',
                    }}>
                    {screenName === 'BookingList' &&
                      editable != null &&
                      editable && (
                        <GradientButton
                          //loading={loadForm}
                          label={'Add Email'}
                          containerStyle={{
                            width: screenWidth * 0.3,
                            height: 50,
                            borderColor: Colors.start,
                            borderWidth: 1,
                          }}
                          backgroundColors={[Colors.start, Colors.end]}
                          textStyle={{color: Colors.white}}
                          onClick={() => {
                            setModalData([
                              ...modalData,
                              {id: uuidv4(), value: ''},
                            ]);
                          }}
                        />
                      )}

                    <GradientButton
                      //loading={loadForm}
                      label={'Save'}
                      containerStyle={{
                        width: screenWidth * 0.3,
                        height: 50,
                        borderColor: Colors.start,
                        borderWidth: 1,
                      }}
                      backgroundColors={[Colors.start, Colors.end]}
                      textStyle={{color: Colors.white}}
                      onClick={() => handleEmailListSave()}
                    />
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
      </Modal>
      {screenName === 'BookingList' && (
        <View style={{position: 'absolute', bottom: 40, right: 20}}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate(ScreenNames.SCREEN_CHATMESSAGE, {
                bookingDetails: hotelBookingDetails,
                bookingType: 'hotel',
              })
            }>
            <FontAwesomeIcon
              color={Colors.primary}
              icon={faComments}
              size={60}></FontAwesomeIcon>
          </TouchableOpacity>
        </View>
      )}
    </ViewComponent>
  );
};

const styles = StyleSheet.create({
  flexBox: {
    width: screenWidth * 0.45 - 15,
  },
  flexBoxScroll: {
    width: screenWidth * 0.33 - 15,
  },
  title: {
    fontFamily: Fonts.Default.Bold,
    fontWeight: '700',
    fontSize: 20,
    color: Colors.start,
  },
  subtitle: {
    fontFamily: Fonts.Default.SemiBold,
    fontWeight: '600',
    fontSize: 16,
    color: Colors.gray500,
    paddingTop: 5,
  },
  lineBreak: {
    height: 2,
    backgroundColor: Colors.start,
    width: '100%',
    marginVertical: 10,
  },
  detailBox: {
    paddingVertical: 20,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  card: {
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
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    fontFamily: Fonts.Default.Regular,
    color: Colors.black,
  },
  detail: {
    fontSize: 14,
    marginBottom: 2,
    fontFamily: Fonts.Default.Regular,
    color: Colors.gray500,
  },
  textInput: {
    width: '100%',
    paddingTop: 10,
    paddingLeft: 15,
    paddingBottom: 10,
    paddingRight: 15,
    fontSize: 16,
    textAlignVertical: 'top', // Ensures text starts at the top for multiline input
    color: Colors.black,
    fontFamily: Fonts.Default.Regular,
  },
  statustext: {
    fontFamily: Fonts.Default.SemiBold,
    fontSize: 16,
    color: Colors.classic_black,
    fontWeight: '500',
  },
  error: {
    fontFamily: Fonts.Default.Regular,
    fontSize: 13,
    color: Colors.error,
    alignSelf: 'flex-end',
  },
});
