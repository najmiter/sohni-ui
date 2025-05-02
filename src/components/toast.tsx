import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import {
  ToastComponentProps,
  ToastContextType,
  ToastItem,
  ToastProps,
  ToastType,
} from '@/types/props';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TOAST_MARGIN = 16;
const TOAST_WIDTH = SCREEN_WIDTH - TOAST_MARGIN * 2;
const MAX_TOASTS = 3;

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const generateId = () => Math.random().toString(36).substring(2, 9);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((props: Partial<ToastProps>) => {
    const id = generateId();
    const newToast = {
      ...props,
      id,
      createdAt: Date.now(),
    } as ToastItem;

    setToasts((currentToasts) => {
      const updatedToasts = [...currentToasts];
      if (updatedToasts.length >= MAX_TOASTS) {
        updatedToasts.sort((a, b) => a.createdAt - b.createdAt);
        updatedToasts.shift();
      }
      return [...updatedToasts, newToast];
    });

    return id;
  }, []);

  const hideToast = useCallback((id?: string) => {
    if (id) {
      setToasts((currentToasts) =>
        currentToasts.filter((toast) => toast.id !== id)
      );
    } else {
      setToasts([]);
    }
  }, []);

  const success = useCallback(
    (message: string, options?: Partial<ToastProps>) => {
      return showToast({
        message,
        type: 'success',
        ...options,
      });
    },
    [showToast]
  );

  const error = useCallback(
    (message: string, options?: Partial<ToastProps>) => {
      return showToast({
        message,
        type: 'error',
        ...options,
      });
    },
    [showToast]
  );

  const info = useCallback(
    (message: string, options?: Partial<ToastProps>) => {
      return showToast({
        message,
        type: 'info',
        ...options,
      });
    },
    [showToast]
  );

  const warning = useCallback(
    (message: string, options?: Partial<ToastProps>) => {
      return showToast({
        message,
        type: 'warning',
        ...options,
      });
    },
    [showToast]
  );

  const loading = useCallback(
    (message: string, options?: Partial<ToastProps>) => {
      return showToast({
        message,
        type: 'loading',
        duration: 0,
        ...options,
      });
    },
    [showToast]
  );

  const promise = useCallback(
    <T extends any>(promise: Promise<T>, options?: Partial<ToastProps>) => {
      const id = showToast({
        promise,
        pendingMessage: options?.pendingMessage || 'Loading...',
        successMessage: options?.successMessage || 'Success!',
        errorMessage: options?.errorMessage || 'Something went wrong',
        position: options?.position || 'bottom',
        duration: options?.duration || 3000,
        theme: options?.theme || 'system',
        ...options,
      });

      return promise.finally(() => {});
    },
    [showToast]
  );

  const contextValue = useMemo(
    () => ({
      showToast,
      hideToast,
      success,
      error,
      info,
      warning,
      loading,
      promise,
    }),
    [showToast, hideToast, success, error, info, warning, loading, promise]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => hideToast(toast.id)}
          toastIndex={index}
          totalToasts={toasts.length}
        />
      ))}
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);

  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}

const Toast: React.FC<ToastComponentProps> = ({
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
  toastIndex = 0,
  totalToasts = 1,
  radius = 100,
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

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(position === 'top' ? -50 : 50);
  const scale = useSharedValue(0.8);
  const progressValue = useSharedValue(0);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    if (message.length > 0) {
      showToast();
    }
  }, []);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      cancelAnimation(opacity);
      cancelAnimation(translateY);
      cancelAnimation(scale);
      cancelAnimation(progressValue);
    };
  }, []);

  useEffect(() => {
    if (message && message !== internalMessage) {
      setInternalMessage(message);
      setInternalType(type);
      showToast();
    }
  }, [message, type]);

  useEffect(() => {
    if (!promise) return;
    setInternalType('loading');
    setInternalMessage(pendingMessage);

    showToast(0);
    if (!promise) return;
    promise
      .then((result) => {
        if (isMounted.current) {
          setInternalType('success');
          setInternalMessage(successMessage);
          showToast(duration);
        }
        return result;
      })
      .catch((error) => {
        if (isMounted.current) {
          setInternalType('error');
          setInternalMessage(
            typeof error?.message === 'string' ? error.message : errorMessage
          );
          showToast(duration);
        }
        return Promise.reject(error);
      });
  }, [promise]);

  const showToast = useCallback(
    (autoHideDuration = duration) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsVisible(true);

      if (position === 'top') {
        translateY.value = -50;
      } else if (position === 'bottom') {
        translateY.value = 50;
      } else {
        scale.value = 0.8;
      }

      opacity.value = withTiming(1, { duration: 300 });

      if (position === 'center') {
        scale.value = withSpring(1, {
          damping: 15,
          stiffness: 120,
        });
      } else {
        translateY.value = withSpring(0, {
          damping: 15,
          stiffness: 120,
        });
      }

      if (progress && autoHideDuration > 0) {
        progressValue.value = 0;
        progressValue.value = withTiming(100, { duration: autoHideDuration });
      }

      if (autoHideDuration > 0) {
        timeoutRef.current = setTimeout(() => {
          hideToast();
        }, autoHideDuration);
      }
    },
    [duration, position]
  );

  const hideToast = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    opacity.value = withTiming(0, { duration: 250 });

    if (position === 'center') {
      scale.value = withTiming(0.8, { duration: 250 });
    } else {
      translateY.value = withTiming(position === 'top' ? -50 : 50, {
        duration: 250,
      });
    }

    setTimeout(() => {
      if (isMounted.current) {
        setIsVisible(false);
        if (onClose) {
          onClose();
        }
      }
    }, 300);
  }, [position, onClose]);

  const getPositionStyle = useMemo((): StyleProp<ViewStyle> => {
    const TOAST_SPACING = 5;
    const TOAST_HEIGHT = description ? 90 : 60;
    const offset = toastIndex * (TOAST_HEIGHT + TOAST_SPACING);
    switch (position) {
      case 'top':
        return { top: 50 + offset };
      case 'bottom':
        return { bottom: 50 + offset };
      case 'center':
        return {
          top:
            SCREEN_HEIGHT / 2 -
            50 +
            offset -
            ((totalToasts - 1) * (TOAST_HEIGHT + TOAST_SPACING)) / 2,
        };
      default:
        return { top: 50 + offset };
    }
  }, [position, toastIndex, totalToasts, description]);

  const getColors = useMemo(() => {
    const colorMap = {
      success: {
        light: { bg: '#F8F8F8', text: '#181818', icon: '#4CAF50' },
        dark: { bg: '#181818', text: '#FFFFFF', icon: '#81C784' },
        colored: { bg: '#4CAF50', text: '#FFFFFF', icon: '#FFFFFF' },
      },
      error: {
        light: { bg: '#F8F8F8', text: '#181818', icon: '#F44336' },
        dark: { bg: '#181818', text: '#FFFFFF', icon: '#E57373' },
        colored: { bg: '#F44336', text: '#FFFFFF', icon: '#FFFFFF' },
      },
      info: {
        light: { bg: '#F8F8F8', text: '#181818', icon: '#03A9F4' },
        dark: { bg: '#181818', text: '#FFFFFF', icon: '#4FC3F7' },
        colored: { bg: '#03A9F4', text: '#FFFFFF', icon: '#FFFFFF' },
      },
      warning: {
        light: { bg: '#F8F8F8', text: '#181818', icon: '#FF9800' },
        dark: { bg: '#181818', text: '#FFFFFF', icon: '#FFB74D' },
        colored: { bg: '#FF9800', text: '#FFFFFF', icon: '#FFFFFF' },
      },
      loading: {
        light: { bg: '#F8F8F8', text: '#181818', icon: '#3F51B5' },
        dark: { bg: '#181818', text: '#FFFFFF', icon: '#7986CB' },
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
              ✅
            </Text>
          </View>
        );
      case 'error':
        return (
          <View style={styles.iconCircle}>
            <Text
              style={{ fontSize: 14, color: colors.icon, fontWeight: '700' }}
            >
              ❌
            </Text>
          </View>
        );
      case 'warning':
        return (
          <View style={styles.iconCircle}>
            <Text
              style={{ fontSize: 14, color: colors.icon, fontWeight: '700' }}
            >
              ⚠️
            </Text>
          </View>
        );
      case 'info':
        return (
          <View style={styles.iconCircle}>
            <Text
              style={{ fontSize: 14, color: colors.icon, fontWeight: '700' }}
            >
              ℹ️
            </Text>
          </View>
        );
      default:
        return null;
    }
  }, [internalType, getColors, icon]);

  const animatedStyle = useAnimatedStyle(() => {
    if (position === 'center') {
      return {
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
      };
    } else {
      return {
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
      };
    }
  });

  const progressAnimStyle = useAnimatedStyle(() => {
    return {
      width: `${progressValue.value}%`,
    };
  });

  const colors = getColors;

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        getPositionStyle,
        animatedStyle,
        {
          backgroundColor: colors.bg,
          borderRadius: radius,
        },
        containerStyle,
      ]}
    >
      {progress && (
        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              { backgroundColor: colors.icon },
              progressAnimStyle,
            ]}
          />
        </View>
      )}
      <View style={styles.contentContainer}>
        <View style={styles.iconContainer}>{renderIcon()}</View>

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

        {closable && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => hideToast()}
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
    zIndex: 1000000,
    width: TOAST_WIDTH,
    marginHorizontal: TOAST_MARGIN,
    borderRadius: 100,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
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
    marginRight: 4,
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

export default Toast;
