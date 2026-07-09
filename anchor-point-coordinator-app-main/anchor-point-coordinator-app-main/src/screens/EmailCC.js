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
import {ViewComponent} from '../components/MainView';
import {FAB} from 'react-native-paper';
import GradientButton from '../components/GradientButton';
import Colors from '../theme/Colors';
import {screenWidth} from '../utils/Dimensions';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faEnvelope, faFloppyDisk} from '@fortawesome/free-regular-svg-icons';
import {faAngleLeft, faCircleXmark} from '@fortawesome/free-solid-svg-icons';
import {v4 as uuidv4} from 'uuid';
import ScreenNames from '../constants/ScreenNames';
import Fonts from '../theme/Fonts';

export default EmailCC = ({navigation, route}) => {
  const {editable, emailList, screenName} = route?.params;
  const [emailData, setEmailData] = useState(emailList);
  const [errorIndex, setErrorIndex] = useState([]);
  const flatListRef = useRef();
  const handleNavigation = data => {
    navigation.goBack()
    route?.params?.handleEmailList(data)
    // navigation.navigate(ScreenNames.SCREEN_HOTELBOOKINGREVIEW, {
    //   emailIDList: data,
    // });
  };
  const isValidEmail = email => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  const handleEmailListSave = () => {
    var findErrorIndex = emailData.reduce(
      (acc, e, index) =>
        e.value.length == 0
          ? acc
          : isValidEmail(e.value)
          ? acc
          : [...acc, index],
      [],
    );
    if (findErrorIndex.length > 0) {
      setErrorIndex([...findErrorIndex]);
    } else {
      let tempList = emailData
        .filter(item => (item.value ? true : false))
        .map(item => item.value);
      setErrorIndex([]);
      handleNavigation(tempList);
    }
  };
  const handleDeleteEmail = id => {
    if (emailData.length == 1) {
      setEmailData([{id: uuidv4(), value: ''}]);
      setErrorIndex([]);
    } else {
      let tempFilter = [...emailData].filter(item => item.id != id);
      let tempList = [...tempFilter].reduce(
        (acc, e, index) => (isValidEmail(e.value) ? acc : [...acc, index]),
        [],
      );
      setErrorIndex([...tempList]);
      setEmailData([...tempFilter]);
    }
  };
  const renderItem = ({item, index}) => {
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
          <FontAwesomeIcon size={18} icon={faEnvelope} color={Colors.gray700} />
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
              setEmailData(
                emailData.map(input =>
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
        <TouchableOpacity
          style={{marginLeft: 15}}
          onPress={() => navigation.goBack()}>
          <FontAwesomeIcon icon={faAngleLeft} size={16} color={Colors.dark} />
        </TouchableOpacity>
        <View style={{flex: 1, alignItems: 'center'}}>
          <Text
            style={[
              styles.title,
              {paddingHorizontal: 15, paddingVertical: 15},
            ]}>
            {'Email Recipients'}
          </Text>
        </View>
        <View style={{paddingRight: 15}}>
          <TouchableOpacity onPress={handleEmailListSave}>
            <FontAwesomeIcon
            //   color="white"
              icon={faFloppyDisk}
              size={25}></FontAwesomeIcon>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{flex: 1,padding:10}}>
        <FlatList
          //ref={flatListRef}
          automaticallyAdjustKeyboardInsets
          automaticallyAdjustContentInsets={false}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          contentContainerStyle={{flexGrow: 1}}
          data={emailData}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
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
        { editable != null && editable && (
          <FAB
            icon="plus"
            style={styles.fab}
            mode={'elevated'}
            theme={{colors:{
                primaryContainer:Colors.end
            }}}
            onPress={() =>
              setEmailData([...emailData, {id: uuidv4(), value: ''}])
            }
          />
        )}
      </View>
    </ViewComponent>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  title: {
    fontFamily: Fonts.Default.Bold,
    fontWeight: '700',
    fontSize: 20,
    color: Colors.start,
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
  error: {
    fontFamily: Fonts.Default.Regular,
    fontSize: 13,
    color: Colors.error,
    alignSelf: 'flex-end',
  },
});
