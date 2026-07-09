import React, {useState, useEffect, useRef} from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {ViewComponent} from '../components/MainView';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {
  faAngleLeft,
  faChevronCircleRight,
  faArrowDown,
} from '@fortawesome/free-solid-svg-icons';
import Colors from '../theme/Colors';
import Fonts from '../theme/Fonts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useUnreadCount from '../hooks/useUnreadCount';
import firestore from '@react-native-firebase/firestore';
import moment from 'moment';
import {Card} from 'react-native-paper';
import EndPoints from '../api/EndPoints';
import config from '../api/config.json';

const PAGE_SIZE = 10;

export default ChatMessage = ({navigation, route}) => {
  const collectionName =
    config.url === 'https://travelbuddy.anchorpoint.in'
      ? 'bookings'
      : 'bookings_dev';
  const unReadCollectionName = config.url === 'https://travelbuddy.anchorpoint.in'
  ? 'usersUnreadCounts'
  : 'usersUnreadCounts_dev';
  const {bookingDetails, bookingType} = route?.params;
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [newMessageNotification, setNewMessageNotification] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [bookingMsgData, setBookingMsgData] = useState(null);

  const flatListRef = useRef(null);
  const isAtBottom = useRef(true);
  const currentUser = useRef({});

  useEffect(() => {
    const getUserDetails = async () => {
      const userEmail = await AsyncStorage.getItem(Keys.EMAIL);
      const userName = await AsyncStorage.getItem(Keys.NAME);
      currentUser.current = {email: userEmail, name: userName};
      updateUnreadCount();
    };
    getUserDetails();
  }, []);

  useEffect(() => {
    const unsubsrcibeBookings = firestore()
      .collection(collectionName)
      .doc(bookingDetails.id)
      .onSnapshot(
        doc => {
          if (doc.exists) {
            console.log('snapshot', doc.data());
            let docData = doc.data();
            setBookingMsgData({...docData});
          } else {
            setBookingMsgData(null);
          }
        },
        err => {
          console.log('Getting BookingMsgData Error', err);
        },
      );
    return () => unsubsrcibeBookings();
  }, []);
  useEffect(() => {
    const unsubsrcibeMsg = firestore()
      .collection(collectionName + `/${bookingDetails.id}/messages`)
      .orderBy('createdDate', 'desc')
      .limit(1)
      .onSnapshot(
        snapshot => {
          if (snapshot.empty) {
            setMessages([]);
          } else {
            const newMessages = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            }));
            if (newMessages.length > 0 && !isAtBottom.current) {
              if (newMessages[0].userId == currentUser.current.email) {
                setNewMessageNotification(true);
              }
              //const groupedMessages = getGroupedMessages([...messages, ...newMessages])
              setMessages(prevMsg => [...newMessages, ...prevMsg]);
            } else if (newMessages.length > 0 && isAtBottom.current) {
              //const groupedMessages = getGroupedMessages([...messages, ...newMessages])
              setMessages(prevMsg => [...newMessages, ...prevMsg]);
            }
          }
        },
        err => {
          console.log('Getting New Chat Message Error', err);
        },
      );
    return () => unsubsrcibeMsg();
  }, []);
  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async (isPaginating = false) => {
    setIsLoading(true);
    const messagesRef = firestore().collection(
      collectionName + `/${bookingDetails.id}/messages`,
    );

    let query = messagesRef.orderBy('createdDate', 'desc').limit(PAGE_SIZE);

    if (isPaginating && lastVisible) {
      query = messagesRef
        .orderBy('createdDate', 'desc')
        .startAfter(lastVisible)
        .limit(PAGE_SIZE);
    }

    const snapshot = await query.get();

    if (!snapshot.empty) {
      const fetchedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(prev =>
        isPaginating ? [...prev, ...fetchedMessages] : fetchedMessages,
      );
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
    } else {
      setHasMore(false);
    }
    // if (firstFetch.current) {
    //   setTimeout(() => {
    //     scrollToBottom(true);
    //     firstFetch.current = false;
    //   }, 100);
    // }
    setIsLoading(false);
  };
  const getGroupedMessages = msgArray => {
    let groupMessages = Object.entries(
      msgArray.reduce((acc, item) => {
        const timestampInMilliseconds =
          item.createdDate.seconds * 1000 +
          Math.floor(item.createdDate.nanoseconds / 1e6);
        const formattedDate = moment(timestampInMilliseconds).format(
          'YYYY-MM-DD HH:mm:ss',
        );
        let groupKey = moment(formattedDate).format('DD-MM-YYYY');
        if (!acc[groupKey]) {
          acc[groupKey] = [];
        }
        acc[groupKey].push({...item, formattedDate: formattedDate});
        return acc;
      }, {}),
    ).map(([k, v]) => ({title: k, data: v}));
    console.log('groupMessages==>', groupMessages);
    return groupMessages;
  };
  const updateUnreadCount = async (onMsgSend = false) => {
    let querySnapShot;
    if (onMsgSend) {
      querySnapShot = await firestore()
        .collection(unReadCollectionName)
        .where('userId', '==', 'admin@gmail.com')
        .where('role', '==', 'organizer')
        .get();
    } else {
      querySnapShot = await firestore()
        .collection(unReadCollectionName)
        .where('userId', '==', currentUser.current.email)
        .where('role', '==', 'coordinator')
        .get();
    }
    if (!querySnapShot.empty) {
      const document = querySnapShot.docs[0];
      const documentId = document.id;
      const documentData = document.data();
      let tempData = {...documentData};
      tempData['updatedDate'] = new Date();
      if (bookingType == 'hotel') {
        tempData['hotelbookings'] = {
          ...documentData['hotelbookings'],
          [bookingDetails.id]: onMsgSend
            ? documentData['hotelbookings'][bookingDetails.id] != null
              ? documentData['hotelbookings'][bookingDetails.id] + 1
              : 1
            : 0,
        };
        tempData['totalUnreadCount'] = onMsgSend
          ? documentData['totalUnreadCount'] + 1
          : documentData['hotelbookings'][bookingDetails.id] != null
          ? documentData['totalUnreadCount'] -
            documentData['hotelbookings'][bookingDetails.id]
          : documentData['totalUnreadCount'];
      } else {
        documentData['cabbookings'] = {
          ...documentData['cabbookings'],
          [bookingDetails.id]: onMsgSend
            ? documentData['cabbookings'][bookingDetails.id] != null
              ? documentData['cabbookings'][bookingDetails.id] + 1
              : 1
            : 0,
        };
        tempData['totalUnreadCount'] = onMsgSend
          ? documentData['totalUnreadCount'] + 1
          : documentData['cabbookings'][bookingDetails.id] != null
          ? documentData['totalUnreadCount'] -
            documentData['cabbookings'][bookingDetails.id]
          : documentData['totalUnreadCount'];
      }
      await firestore()
        .collection(unReadCollectionName)
        .doc(documentId)
        .update(tempData);
    } else {
      if (onMsgSend) {
        var unreadCountData = {
          cabbookings: {},
          hotelbookings: {},
          role: 'organizer',
          totalUnreadCount: 1,
          userId: 'admin@gmail.com',
          createdDate: new Date(),
        };
        if (bookingType == 'hotel') {
          unreadCountData['hotelbookings'] = {[bookingDetails.id]: 1};
        } else {
          unreadCountData['cabbookings'] = {[bookingDetails.id]: 1};
        }
        await firestore().collection(unReadCollectionName).add(unreadCountData);
      } else {
        console.log('unread collection empty');
      }
    }
  };
  const handleScroll = ({nativeEvent}) => {
    const {contentOffset, layoutMeasurement, contentSize} = nativeEvent;
    isAtBottom.current =
      contentSize.height - contentOffset.y - layoutMeasurement.height <= 0;
    console.log('isAtBottom.current', isAtBottom.current);
    if (!isAtBottom.current) {
      setNewMessageNotification(false);
    }
  };
  const handleLoadMore = () => {
    isAtBottom.current = false;
    if (hasMore && !isLoading) {
      fetchMessages(true);
    }
  };
  const scrollToBottom = () => {
    // flatListRef.current?.scrollToLocation({
    //   animated: true,
    //   sectionIndex: messages.length - 1,
    //   itemIndex: messages[messages.length - 1].data.length - 1,
    // })
    flatListRef.current.scrollToOffset({offset: 0, animated: true});
    setNewMessageNotification(false);
  };
  const sendMessage = async () => {
    if (inputText.trim() === '') return;
    const messageData = {
      createdDate: new Date(),
      message: inputText,
      readStatus: false,
      type: 'text',
      userId: currentUser.current.email,
    };
    const bookingsMsg = {
      bookingType: bookingType,
      createdDate: new Date(),
      updatedDate: new Date(),
      users: {
        [currentUser.current.email]: {
          name: currentUser.current.name,
          role: 'coordinator',
        },
      },
    };

    const bookingsRef = firestore()
      .collection(collectionName)
      .doc(bookingDetails.id);

    const messagesRef = firestore().collection(
      collectionName + `/${bookingDetails.id}/messages`,
    );

    try {
      const querySnapshot = await bookingsRef.get();
      if (querySnapshot.exists) {
        const docuData = querySnapshot.data();
        let tempUsers = {
          ...docuData?.users,
          [currentUser.current.email]: {
            name: currentUser.current.name,
            role: 'coordinator',
          },
        };
        let tempBookingsMsg = {
          ...docuData,
          updatedDate: new Date(),
          users: {...tempUsers},
        };
        await bookingsRef.update(tempBookingsMsg);
        await messagesRef.add(messageData);
      } else {
        delete bookingsMsg['updatedDate'];
        await bookingsRef.set(bookingsMsg);
        await messagesRef.add(messageData);
      }
    } catch (err) {
      console.error('Send Message Error', err);
    } finally {
      updateUnreadCount(true);
      var tempText = inputText
      setInputText("");
      sendNotification(tempText);
    }
  };
  const sendNotification = text => {
    let tempReqURL = `${EndPoints.SendNotification}`;
    let tempReqData = {
      booking_id: bookingDetails.id,
      booking_type: bookingType,
      message: text,
      notification_type: 'chat',
      recipient: {
        email: bookingDetails.organizer.email,
        role: 'organizer',
      },
    };
    ApiRequest({
      url: tempReqURL,
      method: 'POST',
      data: tempReqData,
    })
      .then(res => {
        console.log('Notification Res', res);
      })
      .catch(err => {
        console.error('Notification failed to send', err);
      });
  };
  const getFormattedDate = currDate => {
    const formattedDate = moment(currDate.toDate()).format(
      'YYYY-MM-DD HH:mm:ss',
    );
    return `${moment(moment(formattedDate, 'YYYY-MM-DD')).calendar(null, {
      sameDay: '[Today]',
      lastDay: '[Yesterday]',
      lastWeek: 'dddd',
      sameElse: 'MMMM D, YYYY',
    })} ${moment(formattedDate).format('h:mm A')}`;
  };
  const renderMessageView = (item, index, incoming) => {
    return (
      <View
        style={[
          styles.box,
          {
            borderRadius: 5,
            backgroundColor: '#fff',
            maxWidth: '80%',
          },
        ]}>
        <View
          style={{
            padding: 10,
            backgroundColor: incoming ? '#fff' : '#e7e2e3',
            borderRadius: 5,
          }}>
          <Text style={{color: 'black', fontWeight: '400', fontSize: 18}}>
            {item.message}
          </Text>
          <View style={{alignItems: 'flex-end'}}>
            <Text style={{color: Colors.gray500, fontSize: 12}}>
              {getFormattedDate(item.createdDate)}
            </Text>
          </View>
        </View>
      </View>
    );
  };
  const renderMessage = ({item, index}) => {
    let incoming = item.userId != currentUser.current.email ? true : false;
    return (
      <View
        style={{
          flexDirection: incoming ? 'row' : 'row-reverse',
          alignItems: 'flex-end',
          marginVertical: 8,
        }}>
        {renderMessageView(item, index, incoming)}
      </View>
    );
  };
  return (
    <KeyboardAvoidingView
      style={styles.maincontainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ViewComponent style={{flex: 1, paddingBottom: 15}}>
        <View
          style={{
            width: '100%',
            backgroundColor: Colors.silver_gray,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <TouchableOpacity
            style={{
              marginLeft: 5,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => {
              navigation.goBack();
            }}>
            <FontAwesomeIcon icon={faAngleLeft} size={16} color={Colors.dark} />
          </TouchableOpacity>
          <View style={{flex: 1, alignItems: 'center'}}>
            <Text
              style={[
                styles.title,
                {paddingHorizontal: 15, paddingVertical: 15},
              ]}>
              {'Chat Messages'}
            </Text>
          </View>
        </View>
        <View style={styles.maincontainer}>
          {/* <SectionList
              ref={flatListRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{paddingBottom: 30, paddingHorizontal: 20,flexGrow:1}}
              // keyExtractor={(item, index) => item.id.toString()}
              sections={messages}
              inverted={true}
              windowSize={10}
              removeClippedSubviews={true}
              onEndReachedThreshold={0.2}
              onEndReached={()=>fetchMessages(true)}
              keyExtractor={(item, index) => item + index}
              stickySectionHeadersEnabled={false}
              renderItem={({item}) => (
                <View>
                  <Text style={{color:"black",fontSize:16}}>{item.message}</Text>
                </View>
              )}
              renderSectionFooter={({section: {title}}) => (
                <Text style={{color:"black",fontSize:20}}>{title}</Text>
              )}      
              ListEmptyComponent={()=>{
                return(
                  <View style={{flex:1,justifyContent:'center',alignItems:'center',transform: [{scaleY: -1}]}}>
                        <Text style={styles.emptytext}>No Conversations Yet</Text>
                  </View>
                )
              }}    
              ListFooterComponent={
                isLoading ? (
                  <ActivityIndicator size="small" color="#0000ff" />
                ) :  null
              }
          /> */}
          <FlatList
            ref={flatListRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 30,
              paddingHorizontal: 20,
              flexGrow: 1,
            }}
            keyExtractor={(item, index) => item.id.toString()}
            data={messages}
            inverted={true}
            windowSize={10}
            removeClippedSubviews={true}
            onEndReachedThreshold={0.2}
            onEndReached={handleLoadMore}
            onScroll={handleScroll}
            renderItem={renderMessage}
            bounces={false}
            ListEmptyComponent={() => {
              return (
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    transform: [{scaleY: -1}],
                  }}>
                  <Text style={styles.emptytext}>No Conversations Yet</Text>
                </View>
              );
            }}
            // renderItem={({item}) => (
            //   <View>
            //     <Text style={{color:"black",fontSize:16}}>{item.message}</Text>
            //   </View>
            // )}
            ListFooterComponent={
              isLoading ? (
                <ActivityIndicator size="small" color="#0000ff" />
              ) : null
            }
          />
          {newMessageNotification && (
            <TouchableOpacity
              onPress={() => scrollToBottom()}
              style={{
                position: 'absolute',
                width: 40,
                height: 40,
                backgroundColor: Colors.primary,
                borderRadius: 40,
                justifyContent: 'center',
                alignItems: 'center',
                bottom: 10,
                right: 10,
              }}>
              <FontAwesomeIcon icon={faArrowDown} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.bottomContainer}>
          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                scrollEnabled={true}
                multiline={true}
                placeholder={'Message'}
                onChangeText={txt => {
                  setInputText(txt);
                }}
                value={inputText}
              />
              {inputText.length > 0 ? (
                <TouchableOpacity onPress={sendMessage} activeOpacity={0.8}>
                  <FontAwesomeIcon
                    icon={faChevronCircleRight}
                    size={25}
                    color={Colors.primary}
                  />
                  {/* <Image style={{marginTop: 4}} source={ICON_SEND} /> */}
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      </ViewComponent>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  maincontainer: {
    flex: 1,
    backgroundColor: Colors.gray100,
  },
  title: {
    fontFamily: Fonts.Default.Bold,
    fontWeight: '700',
    fontSize: 20,
    color: Colors.start,
  },
  emptytext: {
    fontFamily: Fonts.Default.SemiBold,
    fontWeight: '700',
    fontSize: 20,
    color: Colors.start,
  },
  bottomContainer: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputWrapper: {
    flex: 1,
    marginHorizontal: 16,
    padding: 4,
    paddingTop: 0,
    backgroundColor: 'white',
    borderRadius: 20,
  },
  inputContainer: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: 15,
  },
  input: {
    flex: 1,
    alignSelf: 'stretch',
    marginHorizontal: 12,
    fontSize: 16,
    //lineHeight: 20,
    color: 'black',
    padding: 0,
  },
  box: {
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
});
