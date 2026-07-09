import React, {useState, useEffect} from 'react';
import {TouchableOpacity} from 'react-native';

export default Clickable = props => {
  const [isDisabled, setIsDisabled] = useState(
    props.disabled ? props.disabled : false,
  );

  useEffect(() => {
    setIsDisabled(props.disabled ? props.disabled : false);
  }, [props.disabled]);

  return (
    <TouchableOpacity
      {...props}
      disabled={isDisabled}
      onPress={() => {
        if (!isDisabled && props.onPress) {
          props.onPress();
        }
      }}
      activeOpacity={
        isDisabled ? 0.3 : props.activeOpacity ? props.activeOpacity : 0.6
      }>
      {props.children}
    </TouchableOpacity>
  );
};
