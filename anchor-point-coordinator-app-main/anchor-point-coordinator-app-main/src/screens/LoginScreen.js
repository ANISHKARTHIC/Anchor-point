import {StyleSheet, Text, TextInput, View} from 'react-native';
import GradientButton from '../components/GradientButton';
import Strings from '../constants/Strings';
import Fonts from '../theme/Fonts';
import Colors from '../theme/Colors';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useCallback, useState} from 'react';
import {validateEmail} from '../utils/Validation';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faEnvelope} from '@fortawesome/free-regular-svg-icons';
import ScreenNames from '../constants/ScreenNames';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiRequest from '../api/ApiRequest';
import EndPoints from '../api/EndPoints';
import Keys from '../constants/Keys';
import config from '../api/config.json'

export default LoginScreen = ({navigation}) => {
  const [email, updateEmail] = useState('');
  const [error, updateError] = useState(' ');
  const [loading, setLoading] = useState(false);

  const handleTextChange = useCallback(text => {
    updateEmail(text);
    updateError(' ');
  }, []);

  const handleContinue = useCallback(() => {
    setLoading(true);
    // console.log("endpoinr",EndPoints.Login)
    ApiRequest({
      url: EndPoints.Login,
      method: 'POST',
      data: {
        email,
      },
    })
      .then(data => {
        AsyncStorage.setItem(Keys.EMAIL, email);
        navigation.navigate(ScreenNames.SCREEN_OTP, {
          email,
        });
      })
      .catch(e => {
        if (typeof e == 'string') {
          updateError(e);
        } else {
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [email]);

  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.title}>{Strings.welcome}</Text>
      <Text style={styles.subtitle}>{Strings.enter_email}</Text>
      {/* <Text style={styles.subtitle}>{config.url}</Text> */}
      <View style={styles.editBox}>
        <FontAwesomeIcon size={18} icon={faEnvelope} color={Colors.gray700} />
        <TextInput
          style={styles.editText}
          placeholder={Strings.email}
          placeholderTextColor={Colors.gray500}
          onChangeText={handleTextChange}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>
      <Text style={styles.error}>{error}</Text>
      <GradientButton
        loading={loading}
        disabled={!validateEmail(email)}
        label={Strings.continue}
        containerStyle={{marginVertical: 16, width: 300, height: 70}}
        backgroundColors={[Colors.start, Colors.end]}
        textStyle={{color: Colors.white}}
        onClick={handleContinue}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.natural_white,
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
    backgroundColor: Colors.gray100,
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: 16,
    height: 58,
    padding: 16,
    marginVertical: 16,
  },
  editText: {
    flex: 1,
    fontFamily: Fonts.Default.Regular,
    fontSize: 16,
    color: Colors.dark,
    padding: 0,
    marginLeft: 16,
  },
});
