import React, {useState, useEffect} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Timeline from 'react-native-timeline-flatlist';
import Colors from '../theme/Colors';
import Fonts from '../theme/Fonts';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faAngleLeft} from '@fortawesome/free-solid-svg-icons';
import {SafeAreaView} from 'react-native-safe-area-context';
import EndPoints from '../api/EndPoints';
import ApiRequest from '../api/ApiRequest';
import {timelineEvents} from '../constants/TimelineEvents';

const EventTimeline = ({navigation, route}) => {
  const [data, setData] = useState([]);

  const onEventPress = data => {
    // Handle event press if needed
  };

  const formatDate = date => {
    const options = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    };

    return date.toLocaleString('en-US', options);
  };

  const getEventText = item => {
    switch (item.event) {
      case 'pending':
        return 'Your request has been initiated.';
      case 'pending_approval':
        return 'Awaiting approval from Manager.';
      case 'organizer_assigned':
        return 'Organizer has been assigned.';
      case 'vendor_requested':
        return 'Vendor has been requested.';
      case 'vendor_accepted':
        return 'Vendor Accepted your request';
      case 'vendor_assign_revoked':
        return 'Vendor Revoked your request';
      case 'driver_assigned':
        return 'Driver has been assigned';
      case 'driver_reassigned':
        return 'Your Driver has been reassigned';
      case 'invoice_created':
        return 'Invoice has been genrated';
      case 'invoice_rejected':
        return 'Your Invoice is Rejected';
      case 'invoice_approved':
        return 'Invoice has been approved';
      case 'invoice_created_by_organizer':
        return 'Invoice has been generated';
      case 'invoice_created_by_super_organizer':
        return 'Invoice has been updated by the Admin';
      case 'cancelled':
        return 'Booking has been cancelled';
      default:
        return '';
    }
  };

  const getStatusCategory = event => {
    for (const category in timelineEvents) {
      if (timelineEvents[category].includes(event)) {
        return category;
      }
    }
    return 'Unknown';
  };

  const fetchTimelineData = () => {
    const {id} = route.params;
    const apiEndpoint = `${EndPoints.PostBookings}${id}/history`;

    ApiRequest({
      url: apiEndpoint,
      method: 'GET',
    })
      .then(response => {
        const timelineData = response?.booking_history || [];
        const organizedDescriptions = {};

        timelineData.forEach(item => {
          const createdAtDate = new Date(item.created_at);
          const eventText = getEventText(item);
          const statusCategory = getStatusCategory(item.event);

          if (!organizedDescriptions[statusCategory]) {
            organizedDescriptions[statusCategory] = [];
          }

          organizedDescriptions[statusCategory].push({
            time: formatDate(createdAtDate),
            text: eventText,
            hasDescription: true,
            status: item.event,
          });
        });

        const updatedTimelineData = [];

        for (const category in timelineEvents) {
          const categoryEvents = organizedDescriptions[category] || [];

          const hasDescription = categoryEvents.some(
            event => event.hasDescription,
          );

          const circleColor = hasDescription ? '#000' : '#D0D4CA';
          const lineColor = hasDescription ? '#000' : '#D0D4CA';

          if (category === 'Cancelled' && categoryEvents.length > 0) {
            updatedTimelineData.push({
              title: category,
              description: categoryEvents,
              circleColor: circleColor,
              lineColor: lineColor,
            });
          } else if (category !== 'Cancelled') {
            updatedTimelineData.push({
              title: category,
              description: categoryEvents,
              circleColor: circleColor,
              lineColor: lineColor,
            });
          }
        }

        setData(updatedTimelineData);
      })
      .catch(error => {
        console.error('Booking details request error', error);
      });
  };

  const renderDetail = rowData => {
    const {title, description} = rowData;
    let titleStyle, descriptionStyle;

    if (title === 'Request Initiated') {
      titleStyle = {color: '#000'};
      descriptionStyle = {color: Colors.silver_gray};
    } else if (title === 'Vendor Accepted') {
      titleStyle = {color: '#000'};
      descriptionStyle = {color: Colors.silver_gray};
    } else if (title === 'Driver Assigned') {
      titleStyle = {color: '#000'};
      descriptionStyle = {color: Colors.silver_gray};
    } else if (title === 'Trip Completed') {
      titleStyle = {color: '#000'};
      descriptionStyle = {color: Colors.silver_gray};
    } else if (title === 'Cancelled') {
      titleStyle = {color: '#000'};
      descriptionStyle = {color: Colors.silver_gray};
    } else {
      titleStyle = {color: 'gray'};
      descriptionStyle = {color: Colors.silver_gray};
    }

    return (
      <View>
        <Text style={[styles.title, titleStyle]}>{title} </Text>
        <Text style={styles.description}>
          {description
            ? description.map((desc, index) => (
                <Text key={index}>
                  <Text style={{color: Colors.gray700}}>{desc.text}</Text>
                  {'\n '}
                  <Text style={{color: Colors.gray500}}>{desc.time}</Text>
                  {index !== description.length - 1 && '\n\n'}
                </Text>
              ))
            : 'No description available'}
        </Text>
      </View>
    );
  };

  useEffect(() => {
    fetchTimelineData();
  }, []);

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: Colors.white}}>
      <View style={styles.root}>
        <Clickable onPress={() => navigation.goBack()}>
          <FontAwesomeIcon icon={faAngleLeft} size={16} color={Colors.dark} />
        </Clickable>
        <Text
          style={{
            fontSize: 18,
            fontFamily: Fonts.Default.Medium,
            fontWeight: '600',
            color: Colors.gray700,
          }}>
          Ride Request Tracker
        </Text>
      </View>

      <View style={styles.container}>
        <Timeline
          style={styles.list}
          data={data.map(item => ({
            ...item,
            titleStyle: styles.title,
            descriptionStyle: styles.description,
          }))}
          circleSize={12}
          circleColor="#000"
          lineColor="#000"
          showTime={false}
          descriptionStyle={{color: 'gray', marginVertical: 0}}
          innerCircle={'icon'}
          onEventPress={onEventPress}
          separator={false}
          detailContainerStyle={{
            paddingRight: 10,
            margin: 0,
            padding: 0,
          }}
          columnFormat="single-column-left"
          renderDetail={renderDetail}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginHorizontal: 10,
  },
  container: {
    flex: 1,
    marginVertical: 10,
  },
  list: {
    flex: 1,
    marginTop: 20,
  },
  title: {
    fontFamily: Fonts.Default.Medium,
    fontSize: 16,
    marginTop: -14,
    marginBottom: 20,
  },
  description: {
    fontFamily: Fonts.Default.Medium,
    fontSize: 14,
    marginBottom: 20,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  seeAllUpdates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 20,
  },
  seeAllUpdatesText: {
    fontFamily: Fonts.Default.SemiBold,
    fontSize: 14,
  },
});

export default EventTimeline;
