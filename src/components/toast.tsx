import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
  Dimensions,
  useColorScheme,
  Platform,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TOAST_MARGIN = 16;
const TOAST_WIDTH = SCREEN_WIDTH - TOAST_MARGIN * 2;

export type ToastPosition = 'top' | 'bottom' | 'center';
export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';
export type ToastTheme = 'light' | 'dark' | 'colored' | 'system';

export interface ToastProps {
  message?: string;
  description?: string;

  type?: ToastType;
  position?: ToastPosition;
  theme?: ToastTheme;
  icon?: React.ReactNode;
  duration?: number;

  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  descriptionStyle?: StyleProp<TextStyle>;

  closable?: boolean;
  progress?: boolean;

  promise?: Promise<any>;
  pendingMessage?: string;
  successMessage?: string;
  errorMessage?: string;

  onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({
  message = '',
  description,
  type = 'info',
  position = 'top',
  theme = 'system',
  icon,
  duration = 3000,
  containerStyle,
  textStyle,
  descriptionStyle,
  closable = true,
  progress = false,
  promise,
  pendingMessage = 'Loading...',
  successMessage = 'Success!',
  errorMessage = 'Something went wrong',
  onClose,
}) => {
  const systemColorScheme = useColorScheme();
  const effectiveTheme = useMemo(
    () =>
      theme === 'system'
        ? systemColorScheme === 'dark'
          ? 'dark'
          : 'light'
        : theme,
    [theme, systemColorScheme]
  );

  const [isVisible, setIsVisible] = useState(message.length > 0 || !!promise);
  const [internalMessage, setInternalMessage] = useState(message);
  const [internalType, setInternalType] = useState<ToastType>(type);
  const [progressWidth, setProgressWidth] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const translateYAnim = useRef(
    new Animated.Value(position === 'top' ? -50 : 50)
  ).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      fadeAnim.stopAnimation();
      progressAnim.stopAnimation();
    };
  }, []);

  useEffect(() => {
    if (message && message !== internalMessage) {
      setInternalMessage(message);
      setInternalType(type);
      showToastCallback();
    }
  }, [message, type]);

  useEffect(() => {
    if (!promise) return;

    setIsVisible(true);
    setInternalType('loading');
    setInternalMessage(pendingMessage);

    showToastCallback(0);

    promise
      .then((result) => {
        if (isMounted.current) {
          setInternalType('success');
          setInternalMessage(successMessage);
          showToastCallback(duration);
        }
        return result;
      })
      .catch((error) => {
        if (isMounted.current) {
          setInternalType('error');
          setInternalMessage(
            typeof error?.message === 'string' ? error.message : errorMessage
          );
          showToastCallback(duration);
        }
        return Promise.reject(error);
      });
  }, [promise]);

  useEffect(() => {
    const progressListener = progressAnim.addListener(({ value }) => {
      setProgressWidth(value);
    });

    return () => {
      progressAnim.removeListener(progressListener);
    };
  }, []);

  const showToastCallback = useCallback(
    (autoHideDuration = duration) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setIsVisible(true);

      if (position === 'top') {
        translateYAnim.setValue(-50);
      } else if (position === 'bottom') {
        translateYAnim.setValue(50);
      } else {
        scaleAnim.setValue(0.8);
      }

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),

        position === 'center'
          ? Animated.spring(scaleAnim, {
              toValue: 1,
              friction: 8,
              tension: 40,
              useNativeDriver: true,
            })
          : Animated.spring(translateYAnim, {
              toValue: 0,
              friction: 8,
              tension: 40,
              useNativeDriver: true,
            }),
      ]).start();

      if (progress && autoHideDuration > 0) {
        progressAnim.setValue(0);
        Animated.timing(progressAnim, {
          toValue: 100,
          duration: autoHideDuration,
          useNativeDriver: false,
        }).start();
      }

      if (autoHideDuration > 0) {
        timeoutRef.current = setTimeout(() => {
          hideToastCallback();
        }, autoHideDuration);
      }
    },
    [
      duration,
      position,
      fadeAnim,
      translateYAnim,
      scaleAnim,
      progressAnim,
      progress,
    ]
  );

  const hideToastCallback = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),

      position === 'center'
        ? Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 250,
            useNativeDriver: true,
          })
        : Animated.timing(translateYAnim, {
            toValue: position === 'top' ? -50 : 50,
            duration: 250,
            useNativeDriver: true,
          }),
    ]).start(() => {
      if (isMounted.current) {
        setIsVisible(false);
        if (onClose) {
          onClose();
        }
      }
    });
  }, [fadeAnim, translateYAnim, scaleAnim, position, onClose]);

  const getPositionStyle = useMemo((): StyleProp<ViewStyle> => {
    switch (position) {
      case 'top':
        return { top: 50 };
      case 'bottom':
        return { bottom: 50 };
      case 'center':
        return { top: SCREEN_HEIGHT / 2 - 50 };
      default:
        return { top: 50 };
    }
  }, [position]);

  const getColors = useMemo(() => {
    const colorMap = {
      success: {
        light: { bg: '#F8F8F8', text: '#333333', icon: '#4CAF50' },
        dark: { bg: '#333333', text: '#FFFFFF', icon: '#81C784' },
        colored: { bg: '#4CAF50', text: '#FFFFFF', icon: '#FFFFFF' },
      },
      error: {
        light: { bg: '#F8F8F8', text: '#333333', icon: '#F44336' },
        dark: { bg: '#333333', text: '#FFFFFF', icon: '#E57373' },
        colored: { bg: '#F44336', text: '#FFFFFF', icon: '#FFFFFF' },
      },
      info: {
        light: { bg: '#F8F8F8', text: '#333333', icon: '#03A9F4' },
        dark: { bg: '#333333', text: '#FFFFFF', icon: '#4FC3F7' },
        colored: { bg: '#03A9F4', text: '#FFFFFF', icon: '#FFFFFF' },
      },
      warning: {
        light: { bg: '#F8F8F8', text: '#333333', icon: '#FF9800' },
        dark: { bg: '#333333', text: '#FFFFFF', icon: '#FFB74D' },
        colored: { bg: '#FF9800', text: '#FFFFFF', icon: '#FFFFFF' },
      },
      loading: {
        light: { bg: '#F8F8F8', text: '#333333', icon: '#3F51B5' },
        dark: { bg: '#333333', text: '#FFFFFF', icon: '#7986CB' },
        colored: { bg: '#3F51B5', text: '#FFFFFF', icon: '#FFFFFF' },
      },
    };

    return colorMap[internalType][effectiveTheme];
  }, [internalType, effectiveTheme]);

  const renderIcon = useCallback(() => {
    if (icon) return icon;

    const colors = getColors;

    switch (internalType) {
      case 'loading':
        return <ActivityIndicator size="small" color={colors.icon} />;
      case 'success':
        return (
          <View style={styles.iconCircle}>
            <Text
              style={{ fontSize: 14, color: colors.icon, fontWeight: '700' }}
            >
              ✓
            </Text>
          </View>
        );
      case 'error':
        return (
          <View style={styles.iconCircle}>
            <Text
              style={{ fontSize: 14, color: colors.icon, fontWeight: '700' }}
            >
              ✕
            </Text>
          </View>
        );
      case 'warning':
        return (
          <View style={styles.iconCircle}>
            <Text
              style={{ fontSize: 14, color: colors.icon, fontWeight: '700' }}
            >
              !
            </Text>
          </View>
        );
      case 'info':
        return (
          <View style={styles.iconCircle}>
            <Text
              style={{ fontSize: 14, color: colors.icon, fontWeight: '700' }}
            >
              i
            </Text>
          </View>
        );
      default:
        return null;
    }
  }, [internalType, getColors, icon]);

  const animationStyle = useMemo(() => {
    if (position === 'center') {
      return {
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      };
    } else {
      return {
        opacity: fadeAnim,
        transform: [{ translateY: translateYAnim }],
      };
    }
  }, [position, fadeAnim, scaleAnim, translateYAnim]);

  const colors = getColors;

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        getPositionStyle,
        animationStyle,
        {
          backgroundColor: colors.bg,
        },
        containerStyle,
      ]}
    >
      {/* Progress bar */}
      {progress && (
        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              { width: `${progressWidth}%`, backgroundColor: colors.icon },
            ]}
          />
        </View>
      )}

      <View style={styles.contentContainer}>
        {/* Icon */}
        <View style={styles.iconContainer}>{renderIcon()}</View>

        {/* Text content */}
        <View style={styles.textContainer}>
          <Text style={[styles.message, { color: colors.text }, textStyle]}>
            {internalMessage}
          </Text>
          {description && (
            <Text
              style={[
                styles.description,
                { color: colors.text },
                descriptionStyle,
              ]}
            >
              {description}
            </Text>
          )}
        </View>

        {/* Close button */}
        {closable && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={hideToastCallback}
          >
            <Text style={{ color: colors.text, fontSize: 16 }}>×</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 9999,
    width: TOAST_WIDTH,
    marginHorizontal: TOAST_MARGIN,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  progressContainer: {
    height: 3,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  progressBar: {
    height: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  contentContainer: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
    height: 26,
    width: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.1,
  },
  description: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.9,
  },
  closeButton: {
    height: 24,
    width: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
});

export function useToast() {
  const [toastProps, setToastProps] = useState<Partial<ToastProps>>({});

  const showToast = useCallback((props: Partial<ToastProps>) => {
    setToastProps(props);
  }, []);

  const hideToast = useCallback(() => {
    setToastProps({});
  }, []);

  const handlePromise = useCallback(
    <T extends any>(promise: Promise<T>, options?: Partial<ToastProps>) => {
      setToastProps({
        promise,
        pendingMessage: options?.pendingMessage || 'Loading...',
        successMessage: options?.successMessage || 'Success!',
        errorMessage: options?.errorMessage || 'Something went wrong',
        position: options?.position || 'bottom',
        duration: options?.duration || 3000,
        theme: options?.theme || 'system',
      });

      return promise;
    },
    []
  );

  const ToastComponent = useCallback(
    () =>
      Object.keys(toastProps).length > 0 ? (
        <Toast {...(toastProps as ToastProps)} />
      ) : null,
    [toastProps]
  );

  return {
    showToast,
    hideToast,
    handlePromise,
    ToastComponent,
  };
}

export default Toast;
