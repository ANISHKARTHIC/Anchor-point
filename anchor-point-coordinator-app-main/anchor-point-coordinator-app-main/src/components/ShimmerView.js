import React, {useEffect, useState} from 'react';
import Shimmer from 'react-native-shimmer';

export default ShimmerView = props => {
  const [loading, setLoading] = useState(
    props.animating ? props.animating : false,
  );

  useEffect(() => {
    setLoading(props.animating);
  }, [props]);

  return Platform.OS === 'ios' ? (
    <Shimmer
      style={props.style}
      animationOpacity={0.5}
      opacity={1}
      intensity={1}
      animating={loading ? loading : false}>
      {props.children}
    </Shimmer>
  ) : (
    <Shimmer
      style={props.style}
      animationOpacity={loading ? 0.6 : 1}
      opacity={1}
      intensity={0.8}>
      {props.children}
    </Shimmer>
  );
};
