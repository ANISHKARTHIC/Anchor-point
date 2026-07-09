import React, {useEffect, useState, useMemo} from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  View,
} from 'react-native';
import Colors from '../theme/Colors';
import Fonts from '../theme/Fonts';
import ShimmerView from './ShimmerView';
import LinearGradient from 'react-native-linear-gradient';

export default GradientButton = props => {
  let {label, onClick, containerStyle, textStyle, disabled} = props;

  const [isDisabled, setIsDisabled] = useState(disabled ? disabled : true);
  const [isLoading, setIsLoading] = useState(
    props.loading ? props.loading : false,
  );

  useEffect(() => {
    setIsLoading(props.loading);
  }, [props.loading]);

  useEffect(() => {
    setIsDisabled(props.disabled);
  }, [props.disabled]);

  let extractedStyle = useMemo(() => {
    if (!containerStyle) {
      return {};
    }
    let style = JSON.parse(JSON.stringify(containerStyle));
    delete style.margin;
    delete style.marginTop;
    delete style.marginBottom;
    delete style.marginLeft;
    delete style.marginRight;
    delete style.marginVertical;
    delete style.marginHorizontal;
    return style;
  }, [containerStyle]);

  return (
    <ShimmerView
      animating={isLoading}
      style={[styles.buttonDimensions, containerStyle]}>
      <TouchableOpacity
        activeOpacity={isLoading ? 1 : isDisabled ? 0.3 : 0.8}
        disabled={isDisabled || isLoading}
        onPress={() => {
          if (onClick && !isLoading && !isDisabled) {
            onClick();
          }
        }}>
        <LinearGradient
          style={[
            styles.button,
            styles.buttonDimensions,
            {
              opacity: isDisabled ? 0.5 : 1.0,
            },
            extractedStyle,
          ]}
          colors={props.backgroundColors}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}>
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={[styles.text, textStyle, styles.fullOpacity]}>
              {label}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </ShimmerView>
  );
};

const styles = StyleSheet.create({
  buttonDimensions: {
    borderRadius: 16,
    height: 58,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: Fonts.Default.Bold,
    fontSize: 18,
    lineHeight: 24,
    color: Colors.white,
  },
  fullOpacity: {
    opacity: 1,
  },
});
