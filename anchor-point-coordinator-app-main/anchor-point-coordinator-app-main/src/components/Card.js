import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import Colors from '../theme/Colors';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faAngleRight, faTaxi} from '@fortawesome/free-solid-svg-icons';
import {
  faCalendarCheck,
  faCircleCheck,
  faClock,
  faXmarkCircle,
} from '@fortawesome/free-regular-svg-icons';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import Fonts from '../theme/Fonts';
import {statusTags} from '../constants/TimelineEvents';

const getDateMonthWeekdayYear = dateString => {
  const [dayBeforeFormatting, monthBeforeFormatting, yearBeforeFormatting] =
    dateString.split('-');
  const formattedDateString = `${yearBeforeFormatting}-${monthBeforeFormatting}-${dayBeforeFormatting}`;

  const monthOptions = {month: 'long'};
  const fullMonth = new Date(formattedDateString).toLocaleDateString(
    'en-US',
    monthOptions,
  );
  const abbreviatedMonth = fullMonth.substring(0, 3);

  const weekdayOptions = {weekday: 'long'};
  const fullWeekday = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
  }).format(new Date(formattedDateString));

  const tdate = dayBeforeFormatting.padStart(2, '0');
  const year = parseInt(yearBeforeFormatting, 10);

  return {abbreviatedMonth, fullWeekday, tdate, year};
};

export const Card = ({
  navigation,
  cab_type,
  date,
  id,
  status,
  type,
  time,
  isLoading,
  booking_id,
  setBookingData,
  poNumber,
}) => {
  const CabTypes = {
    HATCHBACK: 'Hatchback',
    SUV: 'SUV',
    SEDAN: 'Sedan',
    TEMPOTRAVELLER: 'Tempo Traveller',
  };

  const cabTypeToPngMap = {
    [CabTypes.HATCHBACK]: require('../../images/Hatchback.png'),
    [CabTypes.SUV]: require('../../images/SUV.png'),
    [CabTypes.SEDAN]: require('../../images/Sedan.png'),
    [CabTypes.TEMPOTRAVELLER]: require('../../images/TempoTraveller.png'),
  };

  const {abbreviatedMonth, fullWeekday, tdate, year} =
    getDateMonthWeekdayYear(date);

  const handleCardPress = () => {
    navigation.navigate('BookingDetailsScreen', {
      bookingId: id,
      cab_type: cab_type,
      time: time,
      date: date,
      status: status,
      isLoading: isLoading,

      setBookingData: setBookingData,
    });
  };

  return (
    <>
      {isLoading ? (
        <ShimmerPlaceholder
          style={styles.cardshimmer}
          autoRun={true}
          visible={!isLoading}
          widthShimmer={0.5}
          shimmerOpacity={0.5}
        />
      ) : (
        <>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.cardSection}
              onPress={handleCardPress}>
              <View style={{flexDirection: 'row', gap: 20}}>
                <View
                  style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 1,
                  }}>
                  <View>
                    <Text style={styles.dateMonth}>{tdate}</Text>
                    <Text style={[styles.dateMonth, {fontSize: 14}]}>
                      {abbreviatedMonth.toUpperCase()}
                    </Text>
                  </View>

                  <View style={{alignItems: 'center'}}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        padding: 10,
                        borderColor: '#000',
                        borderRadius: 50,
                        borderWidth: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                      <Image
                        source={
                          cabTypeToPngMap[
                            cab_type ? cab_type : CabTypes.SEDAN
                          ] || cabTypeToPngMap[CabTypes.SEDAN]
                        }
                        style={{
                          width: 25,
                          height: 25,
                        }}
                      />
                    </View>
                    <View
                      style={{
                        borderTopColor: Colors.classic_black,
                        backgroundColor: 'transparent',
                        borderRightColor: 'transparent',
                        borderLeftColor: 'transparent',
                        borderStyle: 'solid',
                        borderBottomWidth: 0,
                        borderTopWidth: 3,
                        borderRightWidth: 4,
                        borderLeftWidth: 4,
                      }}
                    />
                  </View>
                </View>

                <View style={[styles.cardHeader]}>
                  <View>
                    <View>
                      <Text style={[styles.cardType]}>
                        {'Booking ID : '}
                        <Text style={{textAlign: 'justify', fontWeight: '700'}}>
                          {booking_id + ''}
                        </Text>
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.cardType]}>
                        {'PO Number : '}
                        <Text style={{textAlign: 'justify', fontWeight: '700'}}>
                          {poNumber + ''}
                        </Text>
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                      <Text style={styles.cardType}>
                        {fullWeekday.toUpperCase()} {year}
                      </Text>
                      <Text style={styles.cardType}>AT</Text>
                      <Text style={styles.cardType}>{time}</Text>
                    </View>
                  </View>

                  <View style={styles.statusContainer}>
                    <FontAwesomeIcon
                      icon={
                        (statusTags.PENDING.includes(status) && faClock) ||
                        (statusTags.CONFIRMED.includes(status) &&
                          faCircleCheck) ||
                        (statusTags.INPROGRESS.includes(status) &&
                          faCircleCheck) ||
                        (statusTags.DRIVER.includes(status) && faTaxi) ||
                        (statusTags.COMPLETED.includes(status) &&
                          faCalendarCheck) ||
                        (statusTags.CANCELLED.includes(status) && faXmarkCircle)
                      }
                      size={14}
                    />
                    <Text style={styles.status}>
                      {(statusTags.PENDING.includes(status) && 'PENDING') ||
                        (statusTags.CONFIRMED.includes(status) &&
                          'CONFIRMED') ||
                        (statusTags.INPROGRESS.includes(status) &&
                          'IN PROGRESS') ||
                        (statusTags.DRIVER.includes(status) &&
                          'DRIVER ASSIGNED') ||
                        (statusTags.COMPLETED.includes(status) &&
                          'COMPLETED') ||
                        (statusTags.CANCELLED.includes(status) && 'CANCELLED')}
                    </Text>
                  </View>

                  <View style={styles.cabTypeContainer}>
                    <Text style={styles.cabType}>TYPE</Text>
                    <Text
                      style={[
                        styles.cabType,
                        {
                          fontSize: 10,
                          fontFamily: Fonts.Default.SemiBold,
                          fontWeight: '700',
                        },
                      ]}>
                      {cab_type.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCardPress}
              style={styles.cardFooter}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <FontAwesomeIcon
                  icon={faAngleRight}
                  color={Colors.gray500}
                  size={20}
                />
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.horizontalLine} />
        </>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    backgroundColor: 'white',
    padding: 16,
    elevation: 2,
    width: '100%',
  },
  cardshimmer: {
    padding: 55,
    marginVertical: 8,
    width: '100%',
    backgroundColor: '#D8D9DA',
  },
  cardSection: {
    flex: 0.9,
  },
  cardFooter: {
    alignItems: 'flex-end',
    flex: 0.1,
  },

  dateMonth: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: Fonts.Default.SemiBold,
    color: Colors.classic_black,
  },
  cardHeader: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 5,
  },
  cardType: {
    fontFamily: Fonts.Default.SemiBold,
    fontWeight: '400',
    fontSize: 16,
    marginBottom: 4,
    color: '#000',
  },
  cardDate: {
    fontFamily: Fonts.Default.Medium,
    fontWeight: '600',
    fontSize: 16,
    color: Colors.end,
  },
  cardStatus: {
    fontFamily: Fonts.Default.Medium,
    fontWeight: '700',
    fontSize: 15,
    borderRadius: 8,
    paddingTop: 4,
    color: '#FF4B91',
  },
  cardDelete: {
    marginLeft: 10,
  },
  cardIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 50,
    borderWidth: 2,
    padding: 5,
    borderColor: Colors.start,
  },
  horizontalLine: {
    height: 1,
    width: '80%',
    backgroundColor: Colors.gray100,
    alignSelf: 'center',
  },
  cabTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: 2,
    padding: 5,
    gap: 10,
  },
  cabType: {
    fontSize: 12,
    color: Colors.classic_black,
    fontFamily: Fonts.Default.SemiBold,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: 2,
    padding: 5,
    gap: 10,
  },
  status: {
    fontSize: 12,
    color: Colors.classic_black,
    fontFamily: Fonts.Default.SemiBold,
    fontWeight: '700',
  },
});
