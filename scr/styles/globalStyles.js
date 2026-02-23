import { StyleSheet } from 'react-native';

export const colors = {
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
  darkGray: '#333',
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#cd7f32'
};

export const typography = {
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

export const spacing = {
  xs: 5,
  sm: 10,
  md: 15,
  lg: 20,
  xl: 25,
  xxl: 30
};

export const borderRadius = {
  sm: 5,
  md: 10,
  lg: 15,
  xl: 20,
  round: 999
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5
  }
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightGray
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.small
  },
  title: {
    fontSize: typography.xl,
    fontWeight: 'bold',
    color: colors.dark
  },
  subtitle: {
    fontSize: typography.md,
    color: colors.gray
  },
  heading: {
    fontSize: typography.xxl,
    fontWeight: 'bold',
    color: colors.dark
  },
  button: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center'
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.md,
    fontWeight: 'bold'
  },
  input: {
    backgroundColor: colors.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.md,
    borderWidth: 1,
    borderColor: colors.lightGray
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  divider: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginVertical: spacing.md
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '90%'
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default globalStyles;