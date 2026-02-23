export const API_BASE_URL = 'https://vev-squizer-backend.onrender.com/api';
export const MAX_ACCOUNTS_PER_DEVICE = 3;

export const COLORS = {
  primary: '#667eea',
  secondary: '#764ba2',
  success: '#4CAF50',
  danger: '#ff4757',
  warning: '#FFA500',
  info: '#17a2b8',
  light: '#f8f9fa',
  dark: '#343a40',
  white: '#fff',
  black: '#000',
  gray: '#6c757d',
  lightGray: '#f5f5f5',
  darkGray: '#333'
};

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  huge: 32,
  massive: 40
};

export const LAYOUT = {
  padding: {
    xs: 5,
    sm: 10,
    md: 15,
    lg: 20,
    xl: 25
  },
  margin: {
    xs: 5,
    sm: 10,
    md: 15,
    lg: 20,
    xl: 25
  },
  borderRadius: {
    sm: 5,
    md: 10,
    lg: 15,
    xl: 20,
    round: 999
  }
};

export const MIN_DEPOSIT = 50;
export const MIN_STAKE = 10;
export const MAX_STAKE = 100000;
export const MIN_WITHDRAWAL = 500;
export const MAX_WITHDRAWAL = 5000000;

export const CONTACT = {
  EMAIL: 'vevquizer@gmail.com',
  TELEGRAM: '+234 7087690822',
  WHATSAPP: '+234 8142928718',
  WEBSITE: 'https://vevquizer.com'
};

export const STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
  USER_SETTINGS: 'userSettings',
  DEVICE_ID: 'deviceId',
  INSTALLATION_ID: 'installationId',
  IN_GAME: 'inGame'
};

export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection.',
  SERVER: 'Server error. Please try again later.',
  INSUFFICIENT_BALANCE: 'Insufficient balance.',
  INVALID_STAKE: 'Invalid stake amount.',
  MIN_STAKE: `Minimum stake is ₦${MIN_STAKE}`,
  MAX_STAKE: `Maximum stake is ₦${MAX_STAKE}`,
  MIN_WITHDRAWAL: `Minimum withdrawal is ₦${MIN_WITHDRAWAL}`,
  MAX_WITHDRAWAL: `Maximum withdrawal is ₦${MAX_WITHDRAWAL}`,
  UNAUTHORIZED: 'Please login to continue.',
  SESSION_EXPIRED: 'Session expired. Please login again.',
  MAX_DEVICES_REACHED: `Maximum ${MAX_ACCOUNTS_PER_DEVICE} accounts reached on this device.`
};

export const SUCCESS_MESSAGES = {
  DEPOSIT: 'Deposit successful!',
  WITHDRAWAL: 'Withdrawal request submitted.',
  GAME_WON: 'Congratulations! You won!',
  INVITE_SENT: 'Invite sent successfully.',
  INVITE_ACCEPTED: 'Invite accepted! Game starting...',
  PROFILE_UPDATED: 'Profile updated successfully.'
};