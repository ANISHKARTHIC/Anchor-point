import React, {useState, useCallback, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';

import GradientButton from '../components/GradientButton';
import Fonts from '../theme/Fonts';
import Colors from '../theme/Colors';
import ModeSelectionButton from '../components/ModeSelectionButton';
import {screenWidth} from '../utils/Dimensions';
import {useFormData} from '../context/FormDataProvider';
import {useAppContext} from '../context/AppProvider';
import ApiRequest from '../api/ApiRequest';
import EndPoints from '../api/EndPoints';

import Toast from 'react-native-toast-message';
import {faArrowLeft, faMessage} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import moment from 'moment';
import {useCabContext} from '../context/CabDataProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default CabSelectionScreen = ({navigation}) => {
  const {
    cabBookingDetails,
    eraseAllBookingDetails,
    deletedGuestsData,
    deletedWaypoints,
  } = useCabContext();

  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [, settodoText] = useState('');

  const [description, setDescription] = useState('');
  const [coordinatorEmail, setCoordinatorEmail] = useState(null);

  const [wordCount, setWordCount] = useState(0);
  const maxLetters = 150;

  const handleTextChange = text => {
    if (text.length <= maxLetters) {
      setDescription(text);
      setWordCount(text.length);
    }
  };

  const handleValueChange = text => {
    settodoText(text);
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleQuitEdit = () => {
    eraseAllBookingDetails();
    navigation.navigate('HomeScreen');
  };

  const handleSubmit = useCallback(() => {
    setBookingSuccess(true);

    const processPickupDate = () => {
      if (Array.isArray(cabBookingDetails.booking.pickup_date)) {
        return cabBookingDetails.booking.pickup_date.length === 1
          ? cabBookingDetails.booking.pickup_date[0]
          : cabBookingDetails.booking.pickup_date;
      }
      return cabBookingDetails.booking.pickup_date;
    };

    const requestData = {
      type: cabBookingDetails.booking.type,
      data: {
        po_number: cabBookingDetails.booking.po_number,
        cost_centre_id: cabBookingDetails.booking.cost_centre[0].id,
        cab_type: cabBookingDetails.booking.cab_type.name,
        pick_up_date: processPickupDate(),
        pick_up_time: moment(
          cabBookingDetails.booking.pickup_time,
          'HH:mm',
        ).format('HH:mm'),
        travel_mode: cabBookingDetails.booking.travel_mode,
        guests: cabBookingDetails.booking.guests.map(guest => {
          const baseGuestData = {
            name: guest.name,
            email: guest.email,
            mobile: guest.mobile,
            source: {
              name: guest.source.name,
              latitude: guest.source.latitude,
              longitude: guest.source.longitude,
              address: guest.source.address,
              landmark: guest.source.landmark,
              title: guest.source.title,
            },
            rank: guest.rank || '',
            internal_id: guest.internal_id || '',
            vessel_name: guest.vessel_name || '',
            date_of_duty: guest.date_of_duty || '',
            start_time: guest.start_time || '',
            flight_details: guest.flight_details || '',
          };

          if (cabBookingDetails.booking.travel_mode === 'standard') {
            return {
              ...baseGuestData,
              destination: {
                name: guest.destination.name,
                latitude: guest.destination.latitude,
                longitude: guest.destination.longitude,
                address: guest.destination.address,
                landmark: guest.destination.landmark,
                title: guest.destination.title,
              },
              waypoints:
                guest?.waypoints?.map(waypoint => ({
                  name: waypoint.name,
                  latitude: waypoint.latitude,
                  longitude: waypoint.longitude,
                  address: waypoint.address,
                  landmark: waypoint.landmark,
                })) || [],
            };
          }

          return baseGuestData;
        }),
      },
      description: description || '',
    };

    console.log('requestData----', JSON.stringify(requestData, null, 2));

    ApiRequest({
      url: EndPoints.PostBookings,
      method: 'POST',
      data: requestData,
    })
      .then(response => {
        const pickupDate = processPickupDate();

        if (Array.isArray(pickupDate) && pickupDate.length > 1) {
          setTimeout(() => {
            eraseAllBookingDetails();
            navigation.navigate('HomeScreen');
            navigation.navigate('Bookings');
          }, 1000);
        } else {
          setTimeout(() => {
            eraseAllBookingDetails();
            navigation.navigate('HomeScreen');
            navigation.navigate('BookingDetailsScreen', {
              bookingId: response.booking_id,
              cab_type: cabBookingDetails.booking.cab_type,
              time: moment(
                cabBookingDetails.booking.pickup_time,
                'HH:mm',
              ).format('HH:mm'),
              date: moment(pickupDate).format('YYYY-MM-DD'),
              status: cabBookingDetails.booking.status,
              type: 'Cab',
              isLoading: true,
            });
          }, 1000);
        }
      })
      .catch(error => {
        console.error('Booking request errors', error);
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Booking Error',
          text2:
            'There was an error submitting your booking. Please try again.',
        });
      });
  }, [cabBookingDetails, description, eraseAllBookingDetails, navigation]);

  const handleEditSubmit = useCallback(() => {
    setBookingSuccess(true);

    // process pickup_date
    const processPickupDate = () => {
      if (Array.isArray(cabBookingDetails.booking.pickup_date)) {
        return cabBookingDetails.booking.pickup_date.length === 1
          ? cabBookingDetails.booking.pickup_date[0]
          : cabBookingDetails.booking.pickup_date;
      }
      return cabBookingDetails.booking.pickup_date;
    };

    // Create a copy of updatedBookingData to manipulate
    const updatedBookingData = {...cabBookingDetails};

    // Update the guests with the new date_of_duty and start_time format
    updatedBookingData.booking.guests = updatedBookingData.booking.guests.map(
      guest => {
        const updatedGuest = {...guest};

        updatedGuest.date_of_duty = moment(
          updatedGuest.date_of_duty,
          'DD-MM-YYYY',
        ).isValid()
          ? moment(updatedGuest.date_of_duty, 'DD-MM-YYYY').format('YYYY-MM-DD')
          : '';

        updatedGuest.start_time = moment(
          updatedGuest.start_time,
          'hh:mm A',
        ).isValid()
          ? moment(updatedGuest.start_time, 'hh:mm A').format('HH:mm')
          : '';

        return updatedGuest;
      },
    );

    // Process deleted waypoints if any
    if (deletedWaypoints && Object.keys(deletedWaypoints).length > 0) {
      console.log('Processing Deleted Waypoints...');
      for (const bookingLogId in deletedWaypoints) {
        const waypointsForBooking = deletedWaypoints[bookingLogId];

        const bookingIndex = updatedBookingData.booking.guests.findIndex(
          guest => guest.booking_log_id === parseInt(bookingLogId, 10),
        );

        if (bookingIndex !== -1) {
          const booking = updatedBookingData.booking.guests[bookingIndex];
          booking.waypoints = [
            ...(booking.waypoints || []),
            ...waypointsForBooking,
          ];
        }
      }
    }

    // Add deleted guests if any
    if (deletedGuestsData.length > 0) {
      updatedBookingData.booking.guests = [
        ...updatedBookingData.booking.guests,
        ...deletedGuestsData,
      ];
    }

    // Special condition to remove 'destination' and 'waypoints' for all guests if travel_mode is 'rental'
    if (updatedBookingData.booking.travel_mode === 'rental') {
      updatedBookingData.booking.guests = updatedBookingData.booking.guests.map(
        guest => {
          const {destination, waypoints, ...remainingGuest} = guest;
          return remainingGuest;
        },
      );
    }

    // Prepare the final requestData
    const requestData = {
      id: updatedBookingData.booking.id,
      coordinator_email: coordinatorEmail,
      description: description || '',
      bid: updatedBookingData.booking.bid,
      travel_mode: updatedBookingData.booking.travel_mode,
      cost_centre: {
        code: updatedBookingData.booking.cost_centre.name,
        address: updatedBookingData.booking.cost_centre.address,
        gstin_no: updatedBookingData.booking.cost_centre.gstin_no,
        id: updatedBookingData.booking.cost_centre.id,
      },
      cab_type: updatedBookingData.booking.cab_type.name,
      pick_up_date: processPickupDate(),
      pick_up_time: moment(
        updatedBookingData.booking.pickup_time,
        'HH:mm',
      ).format('HH:mm'),
      guests: updatedBookingData.booking.guests,
      po_number: updatedBookingData.booking.po_number,
    };

    console.log('requestData', JSON.stringify(requestData, null, 2));

    // Send the API request
    ApiRequest({
      url: EndPoints.PostBookings + requestData.id,
      method: 'PUT',
      data: requestData,
    })
      .then(response => {
        const pickupDate = processPickupDate();

        if (Array.isArray(pickupDate) && pickupDate.length > 1) {
          // Navigate to HomeScreen and BookingScreen
          setTimeout(() => {
            eraseAllBookingDetails();
            navigation.navigate('HomeScreen');
            navigation.navigate('Bookings');
          }, 1000);
        } else {
          // Single date scenario - Navigate to HomeScreen and BookingDetailsScreen
          setTimeout(() => {
            eraseAllBookingDetails();
            navigation.navigate('HomeScreen');
            navigation.navigate('BookingDetailsScreen', {
              bookingId: response.booking_id,
              cab_type: cabBookingDetails.booking.cab_type,
              time: moment(
                cabBookingDetails.booking.pickup_time,
                'HH:mm',
              ).format('HH:mm'),
              date: moment(pickupDate).format('YYYY-MM-DD'),
              status: cabBookingDetails.booking.status,
              type: 'Cab',
              isLoading: true,
            });
          }, 1000);
        }
      })
      .catch(error => {
        console.error('Booking request errors', error);
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Booking Error',
          text2:
            'There was an error submitting your booking. Please try again.',
        });
      });
  }, [
    cabBookingDetails,
    coordinatorEmail,
    description,
    deletedWaypoints,
    deletedGuestsData,
  ]);

  useEffect(() => {
    const fetchCoordinatorEmail = async () => {
      try {
        const email = await AsyncStorage.getItem(Keys.EMAIL);
        setCoordinatorEmail(email);
      } catch (error) {
        console.error(
          'Error fetching coordinatorEmail from AsyncStorage',
          error,
        );
      }
    };

    fetchCoordinatorEmail();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.natural_white,
        paddingVertical: 10,
        paddingHorizontal: 10,
      }}>
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <FontAwesomeIcon icon={faArrowLeft} size={20} color={Colors.black} />
          <Text style={styles.mainTitle}>{'Confirm Booking'}</Text>
        </TouchableOpacity>

        {cabBookingDetails.booking.bid && (
          <TouchableOpacity
            style={styles.chipContainer}
            onPress={handleQuitEdit}>
            <Text style={styles.chip}>{'Quit Edit'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        <View
          style={{
            marginHorizontal: 20,
            justifyContent: 'space-between',
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignContent: 'flex-start',
            }}>
            <View style={{width: 150}}>
              <Text style={styles.title}>{'Request Type'}</Text>
              <Text style={styles.subtitle}>
                {cabBookingDetails.booking.cab_type.name}
              </Text>
            </View>
            <View style={{width: 150}}>
              <Text style={styles.title}>{'Date'}</Text>

              {cabBookingDetails.booking.pickup_date.length > 1 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipScrollContainer}>
                  {cabBookingDetails.booking.pickup_date.map((date, index) => (
                    <TouchableOpacity key={index} style={styles.dateChip}>
                      <Text style={styles.dateChipText}>
                        {moment(date).format('MMM Do YYYY')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.subtitle}>
                  {moment(cabBookingDetails.booking.pickup_date[0]).format(
                    'MMM Do YYYY',
                  ) || 'null'}
                </Text>
              )}
              {/* <Text style={styles.subtitle}>
                {moment(cabBookingDetails.booking.pickup_date[0]).format(
                  'MMM Do YYYY',
                ) || 'null'}
              </Text> */}
            </View>
          </View>
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <View style={{width: 150}}>
              <Text style={styles.title}>{'Time'}</Text>
              <Text style={styles.subtitle}>
                {cabBookingDetails.booking.pickup_time || 'null'}
              </Text>
            </View>
            <View style={{width: 150}}>
              <Text style={styles.title}>{'People Added'}</Text>
              <Text style={styles.subtitle}>
                {cabBookingDetails.booking.guests.length}
              </Text>
            </View>
          </View>

          <View style={styles.horizontalLine} />

          <View style={{marginTop: 30}}>
            <Text style={styles.label}>Description</Text>
            <View style={styles.editBox}>
              <FontAwesomeIcon icon={faMessage} size={18} />
              <TextInput
                style={styles.editText}
                multiline
                numberOfLines={2}
                placeholder="Enter your description here..."
                placeholderTextColor={Colors.gray500}
                value={description}
                onChangeText={handleTextChange}
              />
            </View>
            {wordCount === maxLetters && (
              <Text style={styles.errorText}>
                Maximum limit reached (150 letters).
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      <View
        style={{
          marginHorizontal: 20,
          marginVertical: 10,
          flexDirection: 'row',
          justifyContent: 'flex-end',
          gap: 5,
        }}>
        <GradientButton
          label={
            cabBookingDetails.booking.bid
              ? `Edit Booking ${cabBookingDetails.booking.bid}`
              : 'Place Request'
          }
          loading={bookingSuccess}
          disabled={bookingSuccess}
          containerStyle={{
            width: '90%',
            height: 67,
          }}
          backgroundColors={[Colors.start, Colors.end]}
          onClick={
            cabBookingDetails.booking.bid ? handleEditSubmit : handleSubmit
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: Fonts.Default.Medium,
    fontWeight: '700',
    fontSize: 19,
    color: Colors.start,
  },
  title: {
    fontFamily: Fonts.Default.Bold,
    fontWeight: '500',
    fontSize: 18,
    color: Colors.start,
    marginTop: 10,
  },
  subtitle: {
    fontFamily: Fonts.Default.SemiBold,
    fontWeight: '600',
    fontSize: 16,
    color: Colors.gray500,
    marginVertical: 10,
  },
  button: {
    width: 175,
    height: 70,
    borderRadius: 15,
    borderColor: 'gray',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  todoSection: {
    marginTop: 40,
    flex: 1,
  },
  todoText: {
    fontSize: 18,
  },
  modeSelection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
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
    backgroundColor: '#D0D4CA',
  },
  textInput: {
    flex: 1,
    paddingRight: 30,
  },
  icon: {
    position: 'absolute',
    right: 8,
  },
  horizontalLine: {
    height: 2,
    backgroundColor: Colors.end,
    marginTop: 20,
  },
  successAnimationContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  editBox: {
    flexDirection: 'row',
    backgroundColor: Colors.gray100,
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: 8,
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
    fontSize: 16,
    color: Colors.start,
    marginBottom: 10,
  },
  errorText: {
    color: Colors.error,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  mainTitle: {
    marginLeft: 10,
    fontFamily: Fonts.Default.SemiBold,
    fontWeight: '700',
    fontSize: 22,
    color: Colors.start,
  },

  chip: {
    fontFamily: Fonts.Default.Bold,
    fontWeight: '700',
    fontSize: 13,
    color: Colors.natural_white,
    padding: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    backgroundColor: Colors.error,
  },

  chipScrollContainer: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 5,
  },
  dateChip: {
    backgroundColor: Colors.silver_gray,
    borderRadius: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateChipText: {
    fontSize: 14,
    color: Colors.dark,
    fontFamily: Fonts.Default.SemiBold,
    fontWeight: '600',
  },
});
