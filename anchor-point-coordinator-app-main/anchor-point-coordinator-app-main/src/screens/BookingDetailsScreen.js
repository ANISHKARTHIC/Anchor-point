import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import ApiRequest from '../api/ApiRequest';
import EndPoints from '../api/EndPoints';
import Colors from '../theme/Colors';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {
  faUser,
  faMapMarker,
  faAngleLeft,
  faLocationCrosshairs,
  faCaretUp,
  faCaretDown,
  faStop,
  faTaxi,
  faCheck,
  faExclamation,
  faXmarkCircle,
  faX,
  faXmarkSquare,
  faUserXmark,
} from '@fortawesome/free-solid-svg-icons';
import {
  faCircleCheck,
  faEdit,
  faHourglassHalf,
} from '@fortawesome/free-regular-svg-icons';
import {SafeAreaView} from 'react-native-safe-area-context';
import Fonts from '../theme/Fonts';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import Collapsible from 'react-native-collapsible';
import TimelineSnippet from '../components/TimelineSnippet';
import RNFetchBlob from 'react-native-blob-util';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import usePushNotifications from '../hooks/usePushNotification';
import statusCategories from '../constants/StatusEvents';
import GradientButton from '../components/GradientButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Modal from 'react-native-modal';
import {screenWidth} from '../utils/Dimensions';
import {useCabContext} from '../context/CabDataProvider';
import moment from 'moment';

const BookingDetailsScreen = ({navigation, route}) => {
  const [bookingDetails, setBookingDetails] = useState(null);
  const [bookingDetailsbyID, setbookingDetailsbyID] = useState(null);
  const [driverDetails, setDriverDetails] = useState(null);
  const {bookingId, status, setBookingData} = route.params;
  const [isAccordionOpen, setAccordionOpen] = useState(false);
  const [statusValue, setStatus] = useState(status);
  const [isModalVisible, setisModalVisible] = useState(false);
  const bookingDate = bookingDetailsbyID?.booking.pickup_date;
  const booking_id = bookingDetailsbyID?.booking.bid;
  const poNumber = bookingDetailsbyID?.booking?.po_number ?? '-';

  usePushNotifications(notificationData => {
    const bookingString = notificationData?.booking;
    const bookingData = JSON.parse(bookingString);
    const updatedBookingId = bookingData.bid;
    if (updatedBookingId === bookingId) {
      setStatus(notificationData.status);
    }
  }, bookingId);

  useEffect(() => {
    const {bookingId} = route.params;

    ApiRequest({
      url: `${EndPoints.GuestBookings}/${bookingId}`,
      method: 'GET',
    }).then(response => {
      setbookingDetailsbyID(response);
    });

    ApiRequest({
      url: `${EndPoints.GuestBookings}/${bookingId}/guests`,
      method: 'GET',
    })
      .then(response => {
        setBookingDetails(response);
      })
      .catch(error => {
        console.error('Booking details request error', error);
      });

    if (
      statusValue === 'driver_assigned' ||
      statusValue === 'driver_reassigned' ||
      statusValue === 'invoice_rejected' ||
      statusValue === 'invoice_created'
    ) {
      ApiRequest({
        url: `/api/vendors/bookings/${bookingId}/drivers`,
        method: 'GET',
      })
        .then(response => {
          setDriverDetails(response);
        })
        .catch(error => {
          console.error('Driver details request error', error);
        });
    }
  }, [route.params]);

  const handlePdf = async () => {
    try {
      const {config} = RNFetchBlob;
      const {bookingId} = route.params;

      const apiEndpoint = `${EndPoints.Invoices}/${bookingId}`;
      const s3Response = await ApiRequest({
        url: apiEndpoint,
        method: 'GET',
      });

      const pdfUrlResponse = s3Response.s3_invoice_url;
      const url = pdfUrlResponse;

      const fileName = 'Anchor_Point_Invoice.pdf';
      const downloadsDir =
        Platform.OS === 'ios'
          ? RNFS.DocumentDirectoryPath
          : RNFS.DownloadDirectoryPath;

      let filePath = `${downloadsDir}/${fileName}`;
      let fileExists = await RNFS.exists(filePath);

      let counter = 1;
      const currentDate = new Date()
        .toLocaleString('en-US', {
          hour: 'numeric',
          minute: 'numeric',
          hour12: false,
          year: '2-digit',
          month: '2-digit',
          day: '2-digit',
        })
        .replace(/[:\/]/g, '-');

      while (fileExists) {
        const suffix =
          counter === 1 ? ` (${currentDate})` : ` (${counter} ${currentDate})`;
        filePath = `${downloadsDir}/${fileName.replace(
          /(\.pdf)$/i,
          `${suffix}$1`,
        )}`;
        fileExists = await RNFS.exists(filePath);
        counter += 1;
      }

      const response = await config({
        fileCache: true,
        path: filePath,
      }).fetch('GET', url);

      if (Platform.OS === 'ios') {
        const options = {
          type: 'application/pdf',
          url: `file://${filePath}`,
        };
        Share.open(options)
          .then(res => console.log(res))
          .catch(err => console.error(err));
      } else {
        const canOpen = await RNFetchBlob.android.actionViewIntent(
          filePath,
          'application/pdf',
        );
      }
    } catch (error) {
      console.error('PDF handling error:', error);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const toggleAccordion = () => {
    setAccordionOpen(!isAccordionOpen);
  };

  const formatDate = dateString => {
    if (!dateString) {
      return 'Invalid Date';
    }

    const [day, month, year] = dateString.split('-').map(Number);

    if (!day || !month || !year || isNaN(new Date(year, month - 1, day))) {
      return 'Invalid Date Format';
    }

    const options = {day: 'numeric', month: 'short'};
    const formattedDate = new Date(year, month - 1, day);
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const formattedDateString = formatter.format(formattedDate);
    return formattedDateString;
  };

  const formattedDate = formatDate(bookingDate);

  const onCancelBooking = useCallback(async () => {
    setisModalVisible(false);

    try {
      const coordinatorId = await AsyncStorage.getItem('ID');
      const coordinatorName = await AsyncStorage.getItem('NAME');

      const requestData = {
        status: 'cancelled',
        booking_id: bookingId,
        metadata: {
          coordinator_id: coordinatorId,
          coordinator_name: coordinatorName,
        },
      };

      const response = await ApiRequest({
        url: EndPoints.UpdateBookingStatus,
        method: 'PUT',
        data: requestData,
      });

      if (response) {
        setBookingData(prevBookingData => {
          return prevBookingData.map(booking => {
            if (booking.id === response.booking_id) {
              return {
                ...booking,
                status: 'cancelled',
              };
            }
            return booking;
          });
        });

        navigation.navigate('BookingsScreen');
      }
    } catch (error) {
      console.error('Booking request errors', error);
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Booking cancellation Error',
        text2: 'Please try again after some time',
      });
    }
  }, [bookingId]);

  const {
    eraseAllBookingDetails,
    updateBookingDetails,
    addGuest,
    cabBookingDetails,
  } = useCabContext();

  const [selectedItems, setSelectedItems] = useState(null);

  const fetchVehicleModels = () => {
    ApiRequest({
      url: EndPoints.VechicleModel,
      method: 'GET',
    })
      .then(response => {
        const vehicleModels = response.vehicle_models || [];
        const formattedItems = vehicleModels.map(model => ({
          id: model.id,
          name: model.name,
        }));
        setSelectedItems(formattedItems);
      })
      .catch(error => {
        console.error('Vehicle models request error:', error);
      });
  };

  const onEditBooking = () => {
    eraseAllBookingDetails();

    const booking = bookingDetailsbyID?.booking;
    const guests = bookingDetails?.guests;
    const selectedCabType = selectedItems?.find(
      item => item.name === booking.cab_type,
    );

    // console.log('guests', JSON.stringify(guests, null, 2));

    updateBookingDetails({
      bid: booking.bid,
      id: booking.id,
      po_number: booking.po_number,
      cab_type: selectedCabType,
      travel_mode: booking.travel_mode,
      cost_centre: {
        name: booking.cost_centre.code,
        address: booking.cost_centre.address,
        gstin_no: booking.cost_centre.gstin_no,
        id: booking.cost_centre.id,
      },
      pickup_date: [
        moment(booking.pickup_date, 'DD-MM-YYYY').format('YYYY-MM-DD'),
      ],
      pickup_time: booking.pickup_time,
      status: booking.status,
      type: booking.type,
    });

    guests &&
      guests.forEach(guest => {
        addGuest({
          booking_log_id: guest.booking_log_id,
          id: guest.id,
          name: guest.name,
          email: guest.email,
          mobile: guest.mobile,
          rank: guest.rank,
          internal_id: guest.internal_id,
          vessel_name: guest.vessel_name,
          flight_details: guest.flight_details,
          date_of_duty: guest.date_of_duty,
          start_time: guest.start_time,
          source: guest.source,
          destination: guest.destination,
          waypoints: guest.waypoints,
        });
      });

    navigation.navigate('HomeScreen');
  };

  useEffect(() => {
    fetchVehicleModels();
  }, []);

  // console.log('selectedItems', selectedItems);

  return (
    <>
      {isModalVisible === true && (
        <Modal isVisible={isModalVisible}>
          <View
            style={{
              backgroundColor: Colors.natural_white,
              height: 150,
              borderRadius: 10,
              paddingVertical: 25,
              display: 'flex',
              alignItems: 'center',
            }}>
            <View>
              <Text style={[styles.label, {fontSize: 18, textAlign: 'center'}]}>
                Are you sure you want to Cancel
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 15,
                }}>
                <GradientButton
                  label={'Go Back'}
                  containerStyle={{width: 140, height: 50}}
                  backgroundColors={[Colors.start, Colors.end]}
                  onClick={() => setisModalVisible(false)}
                />
                <GradientButton
                  label={'Cancel'}
                  disabled={!isModalVisible}
                  containerStyle={{width: 140, height: 50}}
                  backgroundColors={[Colors.start, Colors.end]}
                  onClick={onCancelBooking}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      <SafeAreaView style={{flex: 1, backgroundColor: Colors.white}}>
        <View style={styles.root}>
          <Clickable onPress={handleGoBack}>
            <FontAwesomeIcon icon={faAngleLeft} size={16} color={Colors.dark} />
          </Clickable>
          <Text style={styles.title}>Ride details</Text>
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          {/* pending stage 1 */}
          {statusCategories.AWAITING_APPROVAL.includes(statusValue) && (
            <>
              <View style={styles.driverInfo}>
                <View style={{flex: 1}}>
                  <Text
                    style={[
                      styles.driverdetails,
                      {
                        fontFamily: Fonts.Default.Bold,
                        fontSize: 28,
                        fontWeight: '600',
                      },
                    ]}>
                    {'Request is under process'}
                  </Text>
                </View>

                <View style={styles.userIcon}>
                  <FontAwesomeIcon
                    icon={faExclamation}
                    size={40}
                    color={'#D0D4CA'}
                  />
                </View>
              </View>
            </>
          )}

          {/* No Driver assigned */}
          {statusCategories.PENDING_DRIVER_ASSIGNMENT.includes(statusValue) && (
            <>
              <View style={styles.driverInfo}>
                <View style={{flex: 1}}>
                  <Text
                    style={[
                      styles.driverdetails,
                      {
                        fontFamily: Fonts.Default.Bold,
                        fontSize: 28,
                        fontWeight: '600',
                      },
                    ]}>
                    Pending driver assignment
                  </Text>
                </View>

                <View style={styles.userIcon}>
                  <FontAwesomeIcon
                    icon={
                      statusCategories.AWAITING_APPROVAL.includes(statusValue)
                        ? faHourglassHalf
                        : faTaxi
                    }
                    size={40}
                    color={'#D0D4CA'}
                  />
                </View>
              </View>
            </>
          )}

          {/* driver details if driver assigned */}
          {statusCategories.DRIVER_ASSIGNED.includes(statusValue) &&
            driverDetails && (
              <>
                <View style={styles.driverInfo}>
                  <View>
                    <Text
                      style={[
                        styles.driverdetails,
                        {
                          fontFamily: Fonts.Default.Bold,
                          fontSize: 28,
                          fontWeight: '600',
                        },
                      ]}>
                      Cab ride with
                    </Text>
                    <Text
                      style={[
                        styles.driverdetails,
                        {fontSize: 28, fontWeight: '800'},
                      ]}>
                      {driverDetails.driver.name.length > 10
                        ? `${driverDetails.driver.name.substring(0, 10)}...`
                        : driverDetails.driver.name.toUpperCase()}
                    </Text>
                    <Text
                      style={[
                        styles.driverdetails,
                        {fontSize: 26, fontWeight: '600'},
                      ]}>
                      {driverDetails.driver.vehicle_no.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userIcon}>
                    <FontAwesomeIcon
                      icon={faUser}
                      size={40}
                      color={'#D0D4CA'}
                    />
                  </View>
                </View>
              </>
            )}

          {/* invoice generated */}
          {(statusCategories.INVOICE_ACTIONS.includes(statusValue) ||
            statusCategories.COMPLETED.includes(statusValue)) && (
            <>
              <View style={styles.driverInfo}>
                <View style={{flex: 1}}>
                  <Text
                    style={[
                      styles.driverdetails,
                      {
                        fontFamily: Fonts.Default.Bold,
                        fontSize: 28,
                        fontWeight: '600',
                      },
                    ]}>
                    Your Trip has been completed
                  </Text>
                </View>

                <View style={styles.userIcon}>
                  <FontAwesomeIcon icon={faCheck} size={40} color={'#D0D4CA'} />
                </View>
              </View>
            </>
          )}

          {/* Cancelled */}
          {statusCategories.CANCELLED.includes(statusValue) && (
            <>
              <View style={styles.driverInfo}>
                <View style={{flex: 1}}>
                  <Text
                    style={[
                      styles.driverdetails,
                      {
                        fontFamily: Fonts.Default.Bold,
                        fontSize: 28,
                        fontWeight: '600',
                      },
                    ]}>
                    Booking has been Cancelled
                  </Text>
                </View>

                <View style={styles.userIcon}>
                  <FontAwesomeIcon
                    icon={faXmarkCircle}
                    size={40}
                    color={'#D0D4CA'}
                  />
                </View>
              </View>
            </>
          )}

          {/* id info */}
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 5,
              marginRight: 5,
            }}>
            <View style={{gap: 5}}>
              <Text style={styles.value}>{'Booking ID: ' + booking_id}</Text>
              <Text style={styles.value}>{'PO Number: ' + poNumber}</Text>
              <Text style={styles.value}>
                {formattedDate}
                {''} {bookingDetailsbyID?.booking.pickup_time}
              </Text>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={onEditBooking}>
              <FontAwesomeIcon icon={faEdit} size={20} color={Colors.gray500} />
              <Text style={styles.label}>{'Edit booking'}</Text>
            </TouchableOpacity>
          </View>

          {/* invoice download button */}
          {statusCategories.COMPLETED.includes(statusValue) && (
            <>
              <TouchableOpacity onPress={handlePdf}>
                <View
                  style={{
                    flexDirection: 'row',
                    backgroundColor: Colors.gray100,
                    borderRadius: 25,
                    width: 190,
                    padding: 12,
                    gap: 10,
                    alignItems: 'center',
                    margin: 10,
                  }}>
                  <FontAwesomeIcon icon={faCircleCheck} size={18} />
                  <Text
                    style={{
                      fontSize: 16,
                      color: '#000',
                      fontFamily: Fonts.Default.Medium,
                      fontWeight: '600',
                    }}>
                    Download Invoice
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.horizontalLine} />
          <TimelineSnippet navigation={navigation} id={bookingId} />
          <View style={styles.horizontalLine} />

          {/* Guest details */}
          <View style={{backgroundColor: Colors.natural_white, maxHeight: 400}}>
            <TouchableOpacity
              onPress={toggleAccordion}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 18,
                paddingVertical: 10,
              }}>
              <View
                style={{flexDirection: 'row', gap: 20, alignItems: 'center'}}>
                <FontAwesomeIcon icon={faUser} size={20} />
                <Text
                  onPress={toggleAccordion}
                  style={{
                    color: Colors.gray700,
                    fontFamily: Fonts.Default.Regular,
                    fontWeight: '700',
                    fontSize: 20,
                  }}>
                  Guests
                </Text>
              </View>

              <View>
                <FontAwesomeIcon
                  icon={isAccordionOpen ? faCaretUp : faCaretDown}
                  size={20}
                />
              </View>
            </TouchableOpacity>

            <Collapsible collapsed={!isAccordionOpen}>
              <ScrollView
                style={{maxHeight: 300}}
                contentContainerStyle={{paddingBottom: 20}}>
                {bookingDetails ? (
                  bookingDetails.guests.map((guest, index) => (
                    <View key={guest.id} style={styles.guestCard}>
                      <View
                        style={{
                          flexDirection: 'row',
                          gap: 20,
                          marginHorizontal: 5,
                        }}></View>

                      <View style={styles.cardHeader}>
                        <FontAwesomeIcon icon={faStop} size={15} />
                        <Text style={styles.locationInfo}>
                          <Text
                            style={{
                              fontSize: 18,
                            }}>{`${guest.name.toUpperCase()}`}</Text>{' '}
                          - {`${guest.mobile}`}
                        </Text>
                      </View>
                      <View style={styles.cardHeader}>
                        <FontAwesomeIcon
                          icon={faLocationCrosshairs}
                          size={15}
                        />
                        <Text numberOfLines={4} style={styles.locationInfo}>
                          {guest.source.address}
                        </Text>
                      </View>
                      <View style={styles.cardHeader}>
                        <FontAwesomeIcon icon={faMapMarker} size={15} />
                        <Text numberOfLines={4} style={styles.locationInfo}>
                          {guest.destination.address}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <ShimmerPlaceholder
                    style={styles.cardshimmer}
                    autoRun={true}
                    visible={true}
                  />
                )}
              </ScrollView>
            </Collapsible>
          </View>
        </ScrollView>

        {(statusCategories.AWAITING_APPROVAL.includes(statusValue) ||
          statusCategories.DRIVER_ASSIGNED.includes(statusValue) ||
          (statusCategories.PENDING_DRIVER_ASSIGNMENT.includes(statusValue) &&
            !isModalVisible)) && (
          <>
            <View style={[styles.root, {marginBottom: 10}]}>
              <GradientButton
                label={'Cancel Booking'}
                containerStyle={{width: screenWidth - 40}}
                backgroundColors={[Colors.error, Colors.error]}
                onClick={() => setisModalVisible(true)}
              />
            </View>
          </>
        )}
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.Default.Medium,
    fontWeight: '600',
    color: Colors.gray700,
  },
  container: {
    // padding: 16,
  },
  card: {
    marginVertical: 8,
    backgroundColor: Colors.white,
    borderRadius: 0,
  },
  userIcon: {
    borderRadius: 50,
    borderWidth: 2,
    borderColor: Colors.gray100,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  guestCard: {
    borderRadius: 8,
    marginVertical: 4,
    padding: 16,
    alignSelf: 'stretch',
    marginHorizontal: 10,
    borderColor: Colors.gray100,
    borderWidth: 1,
  },
  bookingDetailsContent: {
    paddingTop: Platform.OS === 'ios' ? 200 : 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    backgroundColor: Colors.natural_white,
    gap: 20,
  },
  driverInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    width: '100%',
  },
  bookingDetailsRow: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  label: {
    fontSize: 15,
    fontFamily: Fonts.Default.Regular,
    fontWeight: '500',
    color: Colors.gray700,
  },
  value: {
    color: Colors.gray700,
    fontFamily: Fonts.Default.Medium,
    fontWeight: '600',
    fontSize: 16,
  },
  GuestDetails: {
    fontFamily: Fonts.Default.Medium,
    color: Colors.gray700,
    fontWeight: '600',
    fontSize: 16,
  },
  cardshimmer: {
    marginVertical: 8,
    width: '100%',
    backgroundColor: '#D0D4CA',
  },
  ellipsisAnimation: {
    color: Colors.start,
    fontFamily: Fonts.Default.Bold,
    fontWeight: 'bold',
    flex: 1,
    fontSize: 14,
  },
  bookingDetailsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  horizontalLine: {
    height: 1,
    width: '80%',
    backgroundColor: Colors.gray100,
    alignSelf: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingBottom: 20,
  },
  driverdetails: {
    fontFamily: Fonts.Default.Medium,
    color: Colors.gray700,
    fontWeight: '600',
    fontSize: 16,
  },
  locationInfo: {
    color: Colors.gray700,
    fontFamily: Fonts.Default.Medium,
    fontWeight: '600',
    fontSize: 16,
  },
  status: {
    flexDirection: 'row',
    backgroundColor: Colors.gray100,
    borderRadius: 25,
    width: 200,
    padding: 12,
    gap: 10,
    alignItems: 'center',
    margin: 10,
  },
  editButton: {
    backgroundColor: Colors.natural_white,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BookingDetailsScreen;
