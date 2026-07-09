import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import SvgUri from 'react-native-svg-uri';

function MessageContainer({icon, title, subtitle, date, time}) {
  return (
    <View style={styles.maincontainer}>
      <View style={styles.root}>
        <SvgUri
          width="60"
          height="60"
          source={icon}
          style={{paddingLeft: 15}}
        />
      </View>
      <View style={styles.details}>
        <Text style={styles.title}>{title}</Text>
        <Text numberOfLines={2} style={styles.subtitle}>
          {subtitle}
        </Text>
        <View style={{flexDirection: 'row', gap: 9}}>
          <Text style={styles.date}>{date}</Text>
          <Text style={styles.date}>{'|'}</Text>
          <Text style={styles.date}>{time}</Text>
        </View>
      </View>
    </View>
  );
}

export default MessageContainer;

const styles = StyleSheet.create({
  root: {
    alignContent: 'center',
    justifyContent: 'center',
    width: '25%',
  },
  maincontainer: {
    flexDirection: 'row',
    marginTop: 10,
    width: '95%',
    minHeight: 95,
    gap: 20,
    borderColor: '#F5F5F5',
    borderWidth: 1,
  },
  details: {
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    flexWrap: 'wrap',
    width: '70%',
  },
  title: {
    fontFamily: Fonts.Default.SemiBold,
    fontWeight: '600',
    fontSize: 19,
    color: Colors.gray500,
  },
  subtitle: {
    fontFamily: Fonts.Default.regular,
    fontSize: 15,
    color: Colors.gray500,
    width: '100%',
  },
  date: {
    fontFamily: Fonts.Default.Medium,
    fontWeight: '600',
    fontSize: 15,
    color: Colors.gray500,
  },
});
