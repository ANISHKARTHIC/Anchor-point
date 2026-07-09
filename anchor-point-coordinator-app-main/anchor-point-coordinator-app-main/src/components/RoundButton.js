import React, {useEffect, useState, useMemo, useCallback} from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';
import Colors from '../theme/Colors';
import Fonts from '../theme/Fonts';
import ShimmerView from './ShimmerView';
import LinearGradient from 'react-native-linear-gradient';

export default RoundButton = props => {
  let {color, invert, label, onClick, containerStyle, textStyle, disabled} =
    props;

  const [isDisabled, setIsDisabled] = useState(disabled ? disabled : true);
  const [isLoading, setIsLoading] = useState(
    props.loading ? props.loading : false,
  );

  const [isPressed, setIsPressed] = useState(false);

  const pressedIn = useCallback(() => {
    setIsPressed(true);
  }, []);

  const pressedOut = useCallback(() => {
    setIsPressed(false);
  }, []);

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

  useEffect(() => {
    setIsDisabled(disabled);
  }, [disabled]);

  return (
    <ShimmerView
      animating={isLoading}
      style={[styles.buttonDimensions, containerStyle]}>
      <Pressable
        onPressIn={pressedIn}
        onPressOut={pressedOut}
        style={[
          styles.button,
          styles.buttonDimensions,
          // eslint-disable-next-line react-native/no-inline-styles
          {
            backgroundColor: invert ? Colors.white : getColor(color),
            borderColor: invert
              ? getColor(color) + (isPressed ? '99' : '')
              : Colors.primary,
            borderWidth: invert ? 2 : 0,
            opacity: isDisabled ? 0.3 : 1.0,
          },
          extractedStyle,
        ]}
        activeOpacity={isLoading ? 1 : isDisabled ? 0.3 : 0.8}
        disabled={isDisabled}
        onPress={() => {
          if (onClick && !isLoading && !isDisabled) {
            onClick();
          }
        }}>
        <Text
          style={[
            styles.text,
            {
              color: invert ? getColor(color) : Colors.white,
            },
            textStyle,
            isPressed ? styles.halfOpacity : styles.fullOpacity,
          ]}>
          {label}
        </Text>
      </Pressable>
    </ShimmerView>
  );
};

const getColor = color => {
  return color ? color : Colors.primary;
};

const styles = StyleSheet.create({
  buttonDimensions: {
    alignSelf: 'stretch',
    borderRadius: 8,
    height: 52,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  text: {
    fontFamily: Fonts.Default.Bold,
    fontSize: 18,
    lineHeight: 24,
    color: Colors.white,
  },
  halfOpacity: {
    opacity: 0.6,
  },
  fullOpacity: {
    opacity: 1,
  },
});
