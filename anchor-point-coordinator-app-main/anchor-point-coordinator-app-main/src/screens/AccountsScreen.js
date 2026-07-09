import React, {useState, useEffect} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Linking} from 'react-native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../theme/Colors';
import GradientButton from '../components/GradientButton';
import Keys from '../constants/Keys';
import {faEdit, faUser} from '@fortawesome/free-regular-svg-icons';
import {faSquarePhone,faEnvelope} from '@fortawesome/free-solid-svg-icons'
import Fonts from '../theme/Fonts';
import ScreenNames from '../constants/ScreenNames';
import {CommonActions} from '@react-navigation/native';
import { useAppContext } from '../context/AppProvider';
import { handleFireBaseSignout } from '../utils/FirebaseUtil';

export default AccountsScreen = ({navigation}) => {
  const {EULA_Agreed,setEULA_Agreed} = useAppContext();
  const [userData, setUserData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    token: '',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const name = await AsyncStorage.getItem('NAME');
        const email = await AsyncStorage.getItem('EMAIL');
        const phone = await AsyncStorage.getItem('PHONE');
        const token = await AsyncStorage.getItem('TOKEN');

        const storedId = await AsyncStorage.getItem(Keys.ID);

        setUserData({
          id: storedId,
          name,
          email,
          phone,
          token,
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    clearAll()
    handleFireBaseSignout().then(()=>{
      console.log("FireBase Signout Success")
    })
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{name: ScreenNames.SCREEN_LOGIN}],
      }),
    );
  };
  const clearAll = async () => {
    try {
      await AsyncStorage.clear()
      setEULA_Agreed(false)
    } catch(e) {
      console.error("AsyncStorage Clear Error")
    }
  }
  const onEdit = () => {
    navigation.navigate('EditAccountInfoScreen', {navigation});
  };

  return (
    <>
      <View style={styles.root}>
        <View>
          <Text
            style={[
              styles.driverdetails,
              {
                fontFamily: Fonts.Default.SemiBold,
                fontSize: 30,
                fontWeight: 700,
              },
            ]}>
            Account Info
          </Text>
        </View>

        <View style={styles.driverInfo}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 20,
              flexWrap: 'wrap',
            }}>
            <View style={styles.userIcon}>
              <FontAwesomeIcon icon={faUser} size={30} color={'#D0D4CA'} />
            </View>
            <View>
              <Text
                style={[
                  styles.driverdetails,
                  {fontSize: 22, fontWeight: '600'},
                ]}>
                {userData.name}
              </Text>
            </View>
          </View>
          <View>
            <TouchableOpacity onPress={onEdit}>
              <FontAwesomeIcon icon={faEdit} size={20} color={'#000'} />
            </TouchableOpacity>
          </View>
        </View>

        <View>
          <Text
            style={[
              styles.driverdetails,
              {
                fontFamily: Fonts.Default.Bold,
                fontSize: 24,
                fontWeight: 500,
              },
            ]}>
            Basic Info
          </Text>
        </View>

        <View style={styles.userInfoContainer}>
          <View style={styles.userSubContainer}>
            <Text style={styles.infoHeading}>Your Email</Text>
            <Text style={styles.infoValue}>{userData.email}</Text>
          </View>
          <View style={styles.userSubContainer}>
            <Text style={styles.infoHeading}>Phone number</Text>
            <Text style={styles.infoValue}>{userData.phone}</Text>
          </View>
        </View>
      </View>
      <View style={{width:"100%",paddingBottom:15,backgroundColor:"white",paddingHorizontal:10}}>
      <View style={[ styles.box,{minHeight:50,width:'100%',borderRadius:5,backgroundColor:'#f2f2f2',padding:10}]}>
          <Text style={styles.driverdetails}>Contact Us</Text>
          <View style={{paddingTop:10}}>
          <TouchableOpacity onPress={()=>{
            Linking.openURL(`tel:${9003163335}`)
          }}>
            <View style={{flexDirection:'row',gap:10,alignItems:'center'}}>
                 <FontAwesomeIcon icon={faSquarePhone} size={20} color={'#000'} />
                 <Text style={[styles.infoHeading,{fontSize:16}]}>+919003163335</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={{paddingTop:10}} onPress={()=>{
            Linking.openURL('mailto:bookings@anchorpoint.in')
          }}>
            <View style={{flexDirection:'row',gap:10,alignItems:'center'}}>
                 <FontAwesomeIcon icon={faEnvelope} size={20} color={'#000'} />
                 <Text style={[styles.infoHeading,{fontSize:16}]}>bookings@anchorpoint.in</Text>
            </View>
          </TouchableOpacity>
          </View>
      </View>
      </View>
      <View
        style={{
          backgroundColor: Colors.white,
          alignItems: 'center',
          paddingBottom: 20,
        }}>
        <GradientButton
          label={'Log Out'}
          containerStyle={{
            width: 350,
          }}
          onClick={handleLogout}
          backgroundColors={[Colors.start, Colors.end]}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    gap: 20,
  },
  back: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  userInfoContainer: {
    gap: 15,
  },
  userSubContainer: {
    gap: 3,
  },
  infoHeading: {
    fontFamily: Fonts.Default.Semi,
    color: Colors.gray700,
    fontWeight: '500',
    fontSize: 18,
  },
  infoValue: {
    fontFamily: Fonts.Default.Medium,
    color: Colors.gray500,
    fontWeight: '500',
    fontSize: 18,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userIcon: {
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#D0D4CA',
    padding: 20,
  },
  driverdetails: {
    fontFamily: Fonts.Default.Medium,
    color: Colors.gray700,
    fontWeight: '600',
    fontSize: 16,
  },
  box: {
    ...Platform.select({
      ios: {
      shadowColor: "#000",
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
});
