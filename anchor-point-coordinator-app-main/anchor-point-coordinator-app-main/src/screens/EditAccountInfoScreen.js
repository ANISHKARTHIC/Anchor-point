import React, {useState, useEffect, useCallback} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {
  faAngleLeft,
  faMailBulk,
  faPhone,
} from '@fortawesome/free-solid-svg-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../theme/Colors';
import GradientButton from '../components/GradientButton';
import Keys from '../constants/Keys';
import {faUser} from '@fortawesome/free-regular-svg-icons';
import Fonts from '../theme/Fonts';
import {screenWidth} from '../utils/Dimensions';
import EndPoints from '../api/EndPoints';

export default EditAccountInfoScreen = ({navigation}) => {
  const [name, updateName] = useState('');
  const [phone, updatePhone] = useState('');
  const [email, updateEmail] = useState('');

  const [loading, setLoading] = useState(false);

  const handleNameChange = text => {
    updateName(text);
  };

  const handlePhoneChange = text => {
    updatePhone(text);
  };

  const handleContinue = useCallback(() => {
    setLoading(true);
    ApiRequest({
      url: EndPoints.Details,
      method: 'PUT',
      data: {
        data: {
          name: name,
          mobile: phone,
        },
      },
    })
      .then(() => {
        AsyncStorage.setItem(Keys.NAME, name);
        AsyncStorage.setItem(Keys.PHONE, phone);
        navigation.reset({
          index: 0,
          routes: [{name: 'AccountsScreen'}],
        });
      })
      .catch(error => {
        console.error('API Request Error:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [name, phone]);

  const goBack = () => {
    navigation.goBack();
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const name = await AsyncStorage.getItem('NAME');
        const email = await AsyncStorage.getItem('EMAIL');
        const phone = await AsyncStorage.getItem('PHONE');

        updateName(name);
        updatePhone(phone);
        updateEmail(email);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  return (
    <View
      style={{flex: 1, paddingHorizontal: 10, backgroundColor: Colors.white}}>
      <SafeAreaView>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <TouchableOpacity onPress={goBack}>
            <FontAwesomeIcon icon={faAngleLeft} size={20} />
          </TouchableOpacity>

          <View
            style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
            <Text
              style={[
                styles.driverdetails,
                {
                  fontFamily: Fonts.Default.SemiBold,
                  fontSize: 26,
                  fontWeight: 700,
                },
              ]}>
              Edit Profile
            </Text>
          </View>
        </View>

        <View style={styles.editBox}>
          <FontAwesomeIcon size={18} icon={faUser} color={Colors.gray700} />
          <TextInput
            style={styles.editText}
            value={name}
            placeholderTextColor={Colors.gray500}
            onChangeText={handleNameChange}
            editable={!loading}
          />
        </View>

        <View style={styles.editBox}>
          <FontAwesomeIcon size={18} icon={faPhone} color={Colors.gray700} />
          <TextInput
            style={styles.editText}
            value={phone}
            placeholderTextColor={Colors.gray500}
            onChangeText={handlePhoneChange}
            editable={!loading}
          />
        </View>

        <View style={styles.editBox}>
          <FontAwesomeIcon size={18} icon={faMailBulk} color={Colors.gray700} />
          <TextInput
            style={[styles.editText, {color: '#D0D4CA'}]}
            value={email}
            placeholderTextColor={Colors.gray500}
            editable={false}
          />
        </View>
      </SafeAreaView>

      <View style={{alignItems: 'center', marginTop: 16}}>
        <GradientButton
          label={'Save'}
          disabled={name.length < 3 || phone.length !== 10}
          containerStyle={{width: 250}}
          backgroundColors={[Colors.start, Colors.end]}
          onClick={handleContinue}
        />
      </View>
    </View>
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

  root: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
  },
  error: {
    fontFamily: Fonts.Default.Regular,
    fontSize: 16,
    color: Colors.error,
    marginTop: 16,
    marginRight: 16,
    alignSelf: 'flex-end',
    lineHeight: 16,
  },
  title: {
    fontFamily: Fonts.Default.Bold,
    fontWeight: '700',
    fontSize: 24,
    color: Colors.gray700,
    marginTop: 80,
  },
  subtitle: {
    fontFamily: Fonts.Default.Regular,
    fontWeight: '600',
    fontSize: 16,
    color: Colors.gray500,
    marginVertical: 16,
  },
  editBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    height: 58,
    padding: 16,
    marginVertical: 16,
    width: screenWidth - 32,
  },
  editText: {
    fontFamily: Fonts.Default.Regular,
    flex: 1,
    fontSize: 16,
    color: Colors.dark,
    fontWeight: 'normal',
    padding: 0,
    marginLeft: 16,
    borderColor: Colors.start,
    borderBottomWidth: 1,
  },
  mobileField: {
    backgroundColor: Colors.gray100,
    width: screenWidth - 32,
    height: 58,
    borderRadius: 16,
  },
});
