import React, {useState, useRef, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  Pressable,
  Modal,
  TouchableOpacity,
} from 'react-native';
import Fonts from '../theme/Fonts';
import Colors from '../theme/Colors';
import CabBookingScreen from '../components/CabBookingView';

import {useAppContext} from '../context/AppProvider';
import usePushNotifications from '../hooks/usePushNotification';
import Toast from 'react-native-toast-message';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';

import {screenHeight, screenWidth} from '../utils/Dimensions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HotelHomeScreen from './HotelHomeScreen';
import {useCabContext} from '../context/CabDataProvider';

export default HomeScreen = ({navigation}) => {
  const scrollViewRef = useRef();
  const {mode, setMode, EULA_Agreed, setEULA_Agreed} = useAppContext();
  const [selectedNav, setSelectedNav] = useState('Cab');
  const [showEULA, setShowEULA] = useState(!EULA_Agreed);
  const [agreeEULA, setAgreeEULA] = useState(false);

  usePushNotifications(notificationData => {
    const bookingString = notificationData?.booking;
    const bookingData = JSON.parse(bookingString);
    const bookingId = bookingData.bid;
    const status = notificationData?.status;
    if (bookingId) {
      if (notificationData?.notification_type == 'chat') {
        Toast.show({
          type: 'info',
          text1: 'Message : ' + notificationData?.message,
          text2: 'For your ID : ' + bookingId,
        });
      } else {
        Toast.show({
          type: 'info',
          text1: 'Status : ' + getStatus(status, notificationData?.type),
          text2: 'For your ID : ' + bookingId,
        });
      }
    }

    // Toast.show({
    //   type: 'info',
    //   text1: 'Status : ' + status,
    //   text2: 'For your ID : ' + bookingId,
    // });
  });
  const getStatus = (status, type) => {
    if (type == 'hotel') {
      if (status === 'pending') {
        return 'Pending - Oranganiser not assigned';
      } else if (status === 'confirmed') {
        return 'Booking Confirmed';
      } else if (status === 'Declined') {
        return 'Booking Declined';
      } else if (status === 'cancelled') {
        return 'Booking Cancelled';
      } else {
        return 'Waiting for Confirmation';
      }
    } else {
      return status;
    }
  };
  const handleNavClick = nav => {
    setSelectedNav(nav);
    setMode(nav);
  };

  useEffect(() => {
    setMode('Cab');
  }, []);

  const handleModalClose = () => {
    AsyncStorage.setItem(Keys.AGREE_EULA, Keys.EULA_STATUS);
    setEULA_Agreed(true);
    setShowEULA(false);
  };

  // JSON.stringify(cabBookingDetails.booking, null, 2),

  const {cabBookingDetails, eraseAllBookingDetails} = useCabContext();

  const handleQuitEdit = () => {
    eraseAllBookingDetails();
    navigation.navigate('HomeScreen');
  };

  return (
    <View style={{flex: 1}}>
      {!cabBookingDetails.booking.bid && (
        <View style={styles.navContainer}>
          <View style={styles.navTabs}>
            <View
              style={[
                styles.navTabContainer,
                [styles.navTab, selectedNav === 'Cab' && styles.selectedNavTab],
              ]}>
              <Image
                source={require('../../images/Cab.png')}
                style={[
                  styles.image,
                  {
                    tintColor:
                      selectedNav === 'Cab'
                        ? Colors.natural_white
                        : Colors.classic_black,
                  },
                ]}
              />
              <Text
                style={[
                  selectedNav === 'Cab' && styles.selectedNavTab,
                  styles.text,
                  {
                    color:
                      selectedNav === 'Cab'
                        ? Colors.natural_white
                        : Colors.classic_black,
                  },
                ]}
                onPress={() => handleNavClick('Cab')}>
                Book a Cab
              </Text>
            </View>

            <View
              style={[
                styles.navTabContainer,
                [
                  styles.navTab,
                  selectedNav === 'Hotel' && styles.selectedNavTab,
                ],
              ]}>
              <Image
                source={require('../../images/Hotel.png')}
                style={[
                  styles.image,
                  {
                    tintColor:
                      selectedNav === 'Hotel'
                        ? Colors.natural_white
                        : Colors.classic_black,
                  },
                ]}
              />
              <Text
                style={[
                  selectedNav === 'Hotel' && styles.selectedNavTab,
                  styles.text,
                  {
                    color:
                      selectedNav === 'Hotel'
                        ? Colors.natural_white
                        : Colors.classic_black,
                  },
                ]}
                onPress={() => handleNavClick('Hotel')}>
                Book a Hotel
              </Text>
            </View>
          </View>
        </View>
      )}

      {cabBookingDetails.booking.bid && (
        <View
          style={{
            backgroundColor: Colors.natural_white,
            padding: 8,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Text
            style={
              styles.editSection
            }>{`Booking ID: ${cabBookingDetails.booking.bid}`}</Text>

          <TouchableOpacity
            style={styles.chipContainer}
            onPress={handleQuitEdit}>
            <Text style={styles.chip}>{'Quit Edit'}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.todoSection}>
        {mode ? (
          mode === 'Cab' ? (
            <CabBookingScreen
              navigation={navigation}
              scrollViewRef={scrollViewRef}
            />
          ) : mode === 'Hotel' ? (
            <View style={{flex: 1}}>
              <HotelHomeScreen
                scrollViewRef={scrollViewRef}
                navigation={navigation}
              />
            </View>
          ) : null
        ) : (
          <ShimmerPlaceholder
            style={{width: '100%', height: 20, marginBottom: 10}}
            autoRun={true}
            visible={false}
          />
        )}
      </View>

      {/* EULA Agreement Modal */}

      <Modal visible={showEULA} transparent={true}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(84, 84, 83,0.8)',
          }}>
          <View style={styles.modalRoot}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle]}>License Agreement</Text>
            </View>
            <View style={styles.modalBody}>
              <ScrollView contentContainerStyle={{flexGrow: 1}}>
                <View style={{paddingHorizontal: 10, paddingVertical: 10}}>
                  <Text
                    style={[
                      styles.agreementTitle,
                      {paddingBottom: 10},
                    ]}>{`End User License Agreement (EULA) for Anchorpoint TravelBuddy Web / Mobile Application`}</Text>
                  {/* Point 1 */}
                  <Text style={styles.agreementTitle}>{`1.Introduction`}</Text>
                  <View style={{paddingBottom: 5, paddingTop: 5}}>
                    <Text
                      style={
                        styles.agreementText
                      }>{`This End User License Agreement (“EULA”) is a legal agreement between you (“User”) and Anchorpoint (“Company”) for the use of the TravelBuddy mobile application (“App”). By downloading, installing, or using the App, you agree to be bound by the terms of this EULA.`}</Text>
                  </View>
                  {/* Point 2 */}
                  <Text style={styles.agreementTitle}>{`2.License Grant`}</Text>
                  <View style={{paddingBottom: 5, paddingTop: 5}}>
                    <Text
                      style={
                        styles.agreementText
                      }>{`Anchorpoint grants you a limited, non-exclusive, non-transferable, revocable license to use the App for personal, non-commercial purposes in accordance with this EULA.`}</Text>
                  </View>
                  {/* Point 3 */}
                  <Text
                    style={
                      styles.agreementTitle
                    }>{`3.Data Collection and Use`}</Text>
                  <View style={{paddingBottom: 5, paddingTop: 5}}>
                    <Text
                      style={
                        styles.agreementText
                      }>{`The App may collect and process the following personal information:`}</Text>
                    <Text
                      style={[
                        styles.agreementText,
                        {paddingLeft: 10},
                      ]}>{`\u2B24 Email ID`}</Text>
                    <Text
                      style={[
                        styles.agreementText,
                        {paddingLeft: 10},
                      ]}>{`\u2B24 Place of travel `}</Text>
                    <Text
                      style={[
                        styles.agreementText,
                        {paddingLeft: 10},
                      ]}>{`\u2B24 Duration of travel `}</Text>
                    <Text
                      style={[
                        styles.agreementText,
                        {paddingLeft: 10},
                      ]}>{`\u2B24 Other relevant travel details `}</Text>
                  </View>
                  {/* Point 4 */}
                  <Text
                    style={styles.agreementTitle}>{`4.GDPR Compliance `}</Text>
                  <View style={{paddingBottom: 5, paddingTop: 5}}>
                    <Text
                      style={
                        styles.agreementText
                      }>{`Anchorpoint is committed to protecting your personal data and complying with the General Data Protection Regulation (GDPR). The following principles apply:`}</Text>
                    <Text style={[styles.agreementText, {paddingLeft: 10}]}>
                      {`\u2B24`}
                      <Text
                        style={{
                          fontWeight: 'bold',
                        }}>{` Lawfulness, Fairness, and Transparency:`}</Text>
                      {` Your data will be processed lawfully, fairly, and in a transparent manner.`}
                    </Text>
                    <Text style={[styles.agreementText, {paddingLeft: 10}]}>
                      {`\u2B24`}
                      <Text
                        style={{
                          fontWeight: 'bold',
                        }}>{` Purpose Limitation:`}</Text>
                      {` Data will be collected for specified, explicit, and legitimate purposes and not further processed in a manner that is incompatible with those purposes.`}
                    </Text>
                    <Text style={[styles.agreementText, {paddingLeft: 10}]}>
                      {`\u2B24`}
                      <Text
                        style={{
                          fontWeight: 'bold',
                        }}>{` Data Minimization:`}</Text>
                      {` Data collected will be adequate, relevant, and limited to what is necessary in relation to the purposes for which they are processed.`}
                    </Text>
                    <Text style={[styles.agreementText, {paddingLeft: 10}]}>
                      {`\u2B24`}
                      <Text style={{fontWeight: 'bold'}}>{` Accuracy:`}</Text>
                      {` Data will be accurate and, where necessary, kept up to date.`}
                    </Text>
                    <Text style={[styles.agreementText, {paddingLeft: 10}]}>
                      {`\u2B24`}
                      <Text
                        style={{
                          fontWeight: 'bold',
                        }}>{` Storage Limitation:`}</Text>
                      {` Data will be kept in a form which permits identification of data subjects for no longer than is necessary for the purposes for which the personal data are processed.`}
                    </Text>
                    <Text style={[styles.agreementText, {paddingLeft: 10}]}>
                      {`\u2B24`}
                      <Text
                        style={{
                          fontWeight: 'bold',
                        }}>{` Integrity and Confidentiality:`}</Text>
                      {` Data will be processed in a manner that ensures appropriate security, including protection against unauthorized or unlawful processing and against accidental loss, destruction, or damage.`}
                    </Text>
                  </View>
                  {/* Point 5 */}
                  <Text style={styles.agreementTitle}>{`5.User Rights `}</Text>
                  <View style={{paddingBottom: 5, paddingTop: 5}}>
                    <Text
                      style={
                        styles.agreementText
                      }>{`Under GDPR, you have the following rights regarding your personal data: `}</Text>
                    <Text style={[styles.agreementText, {paddingLeft: 10}]}>
                      {`\u2B24`}
                      <Text
                        style={{
                          fontWeight: 'bold',
                        }}>{` Right to Access:`}</Text>
                      {` You can request access to your personal data. `}
                    </Text>
                    <Text style={[styles.agreementText, {paddingLeft: 10}]}>
                      {`\u2B24`}
                      <Text
                        style={{
                          fontWeight: 'bold',
                        }}>{` Right to Rectification:`}</Text>
                      {` You can request correction of inaccurate or incomplete data. `}
                    </Text>
                    <Text style={[styles.agreementText, {paddingLeft: 10}]}>
                      {`\u2B24`}
                      <Text
                        style={{
                          fontWeight: 'bold',
                        }}>{` Right to Erasure:`}</Text>
                      {` You can request deletion of your personal data.`}
                    </Text>
                    <Text style={[styles.agreementText, {paddingLeft: 10}]}>
                      {`\u2B24`}
                      <Text
                        style={{
                          fontWeight: 'bold',
                        }}>{` Right to Restrict Processing:`}</Text>
                      {` You can request restriction of processing of your personal data.`}
                    </Text>
                    <Text style={[styles.agreementText, {paddingLeft: 10}]}>
                      {`\u2B24`}
                      <Text
                        style={{
                          fontWeight: 'bold',
                        }}>{` Right to Data Portability:`}</Text>
                      {` You can request transfer of your personal data to another service provider. `}
                    </Text>
                    <Text style={[styles.agreementText, {paddingLeft: 10}]}>
                      {`\u2B24`}
                      <Text
                        style={{
                          fontWeight: 'bold',
                        }}>{` Right to Object:`}</Text>
                      {` You can object to the processing of your personal data.`}
                    </Text>
                  </View>
                  {/* Point 6 */}
                  <Text
                    style={styles.agreementTitle}>{`6.Data Security `}</Text>
                  <View style={{paddingBottom: 5, paddingTop: 5}}>
                    <Text
                      style={
                        styles.agreementText
                      }>{`Anchorpoint implements appropriate technical and organizational measures to ensure a level of security appropriate to the risk of processing personal data.`}</Text>
                  </View>
                  {/* Point 7 */}
                  <Text
                    style={
                      styles.agreementTitle
                    }>{`7.Changes to this EULA  `}</Text>
                  <View style={{paddingBottom: 5, paddingTop: 5}}>
                    <Text
                      style={
                        styles.agreementText
                      }>{`Anchorpoint reserves the right to modify this EULA at any time. Any changes will be posted within the App, and your continued use of the App constitutes acceptance of the modified terms.`}</Text>
                  </View>
                  {/* Point 8 */}
                  <Text
                    style={
                      styles.agreementTitle
                    }>{`8.Contact Information  `}</Text>
                  <View style={{paddingBottom: 5, paddingTop: 5}}>
                    <Text
                      style={
                        styles.agreementText
                      }>{`If you have any questions or concerns about this EULA or our data practices, please contact us at bookings@anchorpoint.in.`}</Text>
                  </View>
                  {/* Point 9 */}
                  <Text
                    style={styles.agreementTitle}>{`9.Governing Law  `}</Text>
                  <View style={{paddingBottom: 5, paddingTop: 5}}>
                    <Text
                      style={
                        styles.agreementText
                      }>{`This EULA shall be governed by and construed in accordance with the laws of usage country including European union, Asia-Pacific, India without regard to its conflict of law principles. `}</Text>
                  </View>
                </View>
              </ScrollView>
            </View>
            <View style={styles.modalFooter}>
              <Pressable
                onPress={() => setAgreeEULA(!agreeEULA)}
                style={{flexDirection: 'row'}}>
                <Pressable
                  onPress={() => setAgreeEULA(!agreeEULA)}
                  style={[
                    styles.checkBox,
                    {
                      backgroundColor: agreeEULA ? Colors.end : Colors.white,
                      borderWidth: 1,
                      borderColor: agreeEULA ? Colors.end : Colors.gray500,
                    },
                  ]}>
                  {agreeEULA && <View style={styles.checkTick}></View>}
                </Pressable>
                <Text style={styles.footerText}>
                  I have read and agree to the Terms & Conditions{' '}
                </Text>
              </Pressable>
              <View style={{marginTop: 12}}>
                <GradientButton
                  disabled={!agreeEULA}
                  label={'Close'}
                  containerStyle={styles.closeButton}
                  backgroundColors={[Colors.start, Colors.end]}
                  onClick={() => handleModalClose()}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontFamily: Fonts.Default.Bold,
    fontSize: 18,
    fontWeight: '600',
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    color: Colors.classic_black,
  },
  navContainer: {
    height: 60,
    backgroundColor: Colors.natural_white,
    justifyContent: 'flex-end',
  },

  navTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 10,
    backgroundColor: Colors.gray100,
    borderRadius: 50,
    width: '60%',
  },

  navTabContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: 40,
    overflow: 'hidden',
  },

  navTab: {
    fontFamily: Fonts.Default.SemiBold,
    color: Colors.classic_black,
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: Colors.gray100,
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },

  selectedNavTab: {
    backgroundColor: Colors.classic_black,
    color: Colors.natural_white,
  },

  image: {
    width: 25,
    height: 25,
  },

  text: {
    fontFamily: Fonts.Default.SemiBold,
    fontSize: 16,
    fontWeight: '700',
  },
  modalRoot: {
    height: screenHeight * 0.9,
    width: screenWidth * 0.9,
    backgroundColor: Colors.white,
    borderRadius: 15,
  },
  modalHeader: {
    paddingVertical: 10,
    paddingLeft: 5,
    borderBottomWidth: 2,
    borderBottomColor: Colors.gray500,
  },
  modalTitle: {
    fontFamily: Fonts.Default.Bold,
    fontWeight: '600',
    fontSize: 20,
    color: Colors.gray700,
    textAlign: 'center',
  },
  modalBody: {
    flex: 1,
  },
  modalFooter: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderTopColor: Colors.gray500,
    borderTopWidth: 2,
  },
  footerText: {
    fontFamily: Fonts.Default.Regular,
    fontWeight: '400',
    fontSize: 16,
    color: Colors.gray700,
    textAlign: 'justify',
    flexWrap: 'wrap',
    flex: 1,
    lineHeight: 18,
    marginLeft: 10,
  },
  checkBox: {
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.end,
    borderRadius: 6,
  },
  checkTick: {
    height: 15,
    width: 8,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#000000',
    transform: [{rotate: '40deg'}],
  },
  closeButtonButton: {
    width: 171,
    height: 67,
  },
  agreementTitle: {
    fontFamily: Fonts.Default.Bold,
    fontWeight: '600',
    fontSize: 16,
    color: Colors.gray700,
    textAlign: 'justify',
    flexWrap: 'wrap',
  },
  agreementText: {
    fontFamily: Fonts.Default.Regular,
    fontWeight: '400',
    fontSize: 12,
    color: Colors.gray700,
    textAlign: 'justify',
    flexWrap: 'wrap',
    paddingBottom: 10,
  },
  todoSection: {
    flex: 1,
    backgroundColor: Colors.natural_white,
  },
  editSection: {
    marginLeft: 10,
    fontFamily: Fonts.Default.Medium,
    fontWeight: '600',
    fontSize: 20,
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
});
