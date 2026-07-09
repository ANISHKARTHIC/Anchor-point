import React, {useState, useEffect} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Timeline from 'react-native-timeline-flatlist';

import Colors from '../theme/Colors';
import Fonts from '../theme/Fonts';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faAngleRight} from '@fortawesome/free-solid-svg-icons';
import ApiRequest from '../api/ApiRequest';
import EndPoints from '../api/EndPoints';

const TimelineSnippet = ({id, navigation}) => {
  const [timelineData, setTimelineData] = useState([]);

  const fetchTimelineData = () => {
    const apiEndpoint = `${EndPoints.PostBookings}${id}/history`;

    ApiRequest({
      url: apiEndpoint,
      method: 'GET',
    })
      .then(response => {
        const fetchedTimelineData = response?.booking_history || [];

        const currentStatus =
          fetchedTimelineData[fetchedTimelineData.length - 1]?.event;

        const updatedTimelineData = [
          {
            title: <Text style={{color: '#000'}}>Request Initiated </Text>,
            circleColor: '#000',
            lineColor:
              statusCategories.CANCELLED.includes(currentStatus) ||
              statusCategories.COMPLETED.includes(currentStatus)
                ? '#000'
                : '#D0D4CA',
          },
        ];

        if (statusCategories.CANCELLED.includes(currentStatus)) {
          updatedTimelineData.push({
            title: (
              <Text
                style={{
                  color: statusCategories.CANCELLED.includes(currentStatus)
                    ? '#000'
                    : 'red',
                }}>
                Cancelled{' '}
              </Text>
            ),
            circleColor: statusCategories.CANCELLED.includes(currentStatus)
              ? '#000'
              : '#D0D4CA',
            lineColor: statusCategories.CANCELLED.includes(currentStatus)
              ? '#000'
              : '#D0D4CA',
          });
        } else {
          updatedTimelineData.push({
            title: (
              <Text
                style={{
                  color: statusCategories.COMPLETED.includes(currentStatus)
                    ? '#000'
                    : '#D0D4CA',
                }}>
                Completed{' '}
              </Text>
            ),
            circleColor: statusCategories.COMPLETED.includes(currentStatus)
              ? '#000'
              : '#D0D4CA',
            lineColor: statusCategories.COMPLETED.includes(currentStatus)
              ? '#000'
              : '#D0D4CA',
          });
        }

        setTimelineData(updatedTimelineData);
      })
      .catch(error => {
        console.error('Booking details request error', error);
      });
  };

  const onEventPress = () => {
    navigation.navigate('EventTimeline', {id, navigation});
  };

  useEffect(() => {
    fetchTimelineData();
  }, []);

  return (
    <View style={styles.container}>
      {timelineData.length > 0 && (
        <Timeline
          style={styles.list}
          data={timelineData.map(item => ({
            ...item,
            titleStyle: styles.title,
            descriptionStyle: styles.description,
          }))}
          circleSize={12}
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
        />
      )}
      <View style={styles.seeAllUpdates}>
        <Text
          style={{
            fontFamily: Fonts.Default.SemiBold,
            fontWeight: 600,
            fontSize: 14,
            color: 'gray',
          }}>
          See All Updates
        </Text>
        <FontAwesomeIcon icon={faAngleRight} size={12} color={Colors.dark} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
    fontWeight: 400,
    fontSize: 16,
    marginTop: -14,
    marginBottom: 20,
    color: 'gray',
  },
  description: {
    fontFamily: Fonts.Default.Medium,
    fontWeight: 200,
    fontSize: 14,
    color: 'gray',
  },
  seeAllUpdates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 20,
  },
});

export default TimelineSnippet;
