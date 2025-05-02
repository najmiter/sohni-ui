import { StyleProp, TextStyle, ViewStyle } from 'react-native';

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
  radius?: number;

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

export interface ToastItem extends ToastProps {
  id: string;
  createdAt: number;
}

export interface ToastContextType {
  showToast: (props: Partial<ToastProps>) => string;
  hideToast: (id?: string) => void;
  success: (message: string, options?: Partial<ToastProps>) => string;
  error: (message: string, options?: Partial<ToastProps>) => string;
  info: (message: string, options?: Partial<ToastProps>) => string;
  warning: (message: string, options?: Partial<ToastProps>) => string;
  loading: (message: string, options?: Partial<ToastProps>) => string;
  promise: <T>(
    promise: Promise<T>,
    options?: Partial<ToastProps>
  ) => Promise<T>;
}

export interface ToastComponentProps extends ToastProps {
  toastIndex?: number;
  totalToasts?: number;
}
