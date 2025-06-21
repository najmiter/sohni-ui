import { SwitchProps } from '@/types/props';
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';

const DEFAULTS = {
  width: 48,
  height: 28,
  thumbSize: 24,
  activeColor: '#6366f1',
  inactiveColor: '#e5e7eb',
  thumbColor: '#fff',
  thumbInactiveColor: '#fff',
};

export const Switch = React.memo((props: SwitchProps) => {
  const {
    value,
    onValueChange,
    disabled = false,
    activeColor = DEFAULTS.activeColor,
    inactiveColor = DEFAULTS.inactiveColor,
    thumbColor = DEFAULTS.thumbColor,
    thumbInactiveColor = DEFAULTS.thumbInactiveColor,
    width = DEFAULTS.width,
    height = DEFAULTS.height,
    thumbSize = DEFAULTS.thumbSize,
    style,
    testID,
    ...rest
  } = props;

  const offset = useSharedValue(value ? 1 : 0);
  const [isAnimating, setIsAnimating] = React.useState(false);

  React.useEffect(() => {
    setIsAnimating(true);
    offset.value = withTiming(value ? 1 : 0, { duration: 180 }, () => {
      runOnJS(setIsAnimating)(false);
    });
  }, [value, offset]);

  const handleToggle = useCallback(() => {
    if (disabled) return;
    if (isAnimating) return;
    runOnJS(onValueChange)(!value);
  }, [onValueChange, value, disabled, isAnimating]);

  const trackStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        offset.value,
        [0, 1],
        [inactiveColor, activeColor]
      ),
      opacity: disabled ? 0.5 : 1,
    };
  });

  const thumbStyle = useAnimatedStyle(() => {
    const margin = (height - thumbSize) / 2;
    return {
      transform: [
        {
          translateX: offset.value * (width - thumbSize - margin * 2),
        },
      ],
      backgroundColor: interpolateColor(
        offset.value,
        [0, 1],
        [thumbInactiveColor, thumbColor]
      ),
      shadowOpacity: offset.value > 0.5 ? 0.25 : 0.15,
    };
  });

  return (
    <Pressable
      onPress={handleToggle}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={rest.accessibilityLabel}
      style={[
        {
          width,
          height,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
      hitSlop={8}
      testID={testID}
      {...rest}
    >
      <Animated.View
        style={[
          styles.track,
          {
            borderRadius: height / 2,
            width,
            height,
          },
          trackStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.thumb,
          {
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
            top: (height - thumbSize) / 2,
            left: (height - thumbSize) / 2,
            shadowRadius: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            elevation: Platform.OS === 'android' ? 2 : 0,
          },
          thumbStyle,
        ]}
      />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  track: {
    position: 'absolute',
    backgroundColor: DEFAULTS.inactiveColor,
    transitionProperty: 'background-color',
  } as any,
  thumb: {
    position: 'absolute',
    backgroundColor: DEFAULTS.thumbColor,
    shadowOpacity: 0.15,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Switch;
