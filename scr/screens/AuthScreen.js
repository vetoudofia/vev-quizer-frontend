import * as Device from 'expo-device';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as Device from 'expo-device';
import { api } from '../utils/api';
import { MAX_ACCOUNTS_PER_DEVICE, ERROR_MESSAGES } from '../utils/constants';
import LoadingSpinner from '../components/LoadingSpinner';

WebBrowser.maybeCompleteAuthSession();

const AuthScreen = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isOver18, setIsOver18] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [useEmail, setUseEmail] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deviceId, setDeviceId] = useState('');

  // Password Recovery State
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState(1);
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [recoveryMethod, setRecoveryMethod] = useState('email');
  const [recoveryToken, setRecoveryToken] = useState('');

  useEffect(() => {
    getDeviceId();
  }, []);

  useEffect(() => {
    let interval = null;
    if (recoveryStep === 2 && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [recoveryStep, otpTimer]);

  const getDeviceId = async () => {
    try {
      let id = await AsyncStorage.getItem('deviceId');
      if (!id) {
        id = `${Device.brand || 'unknown'}_${Device.modelName || 'unknown'}_${Date.now()}`;
        await AsyncStorage.setItem('deviceId', id);
      }
      setDeviceId(id);
    } catch (error) {
      console.error('Error getting device ID:', error);
    }
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone) => {
    const re = /^\+?[\d\s-]{10,}$/;
    return re.test(phone);
  };

  const handleForgotPassword = () => {
    setShowRecoveryModal(true);
    setRecoveryStep(1);
    setRecoveryIdentifier('');
    setOtp(['', '', '', '', '', '']);
    setNewPassword('');
    setConfirmNewPassword('');
    setOtpTimer(60);
    setCanResend(false);
  };

  const handleSendOTP = async () => {
    if (!recoveryIdentifier) {
      Alert.alert('Error', `Please enter your ${useEmail ? 'email' : 'phone number'}`);
      return;
    }

    if (useEmail && !validateEmail(recoveryIdentifier)) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

    if (!useEmail && !validatePhone(recoveryIdentifier)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', {
        [useEmail ? 'email' : 'phone']: recoveryIdentifier
      });

      setRecoveryMethod(useEmail ? 'email' : 'phone');
      setRecoveryToken(response.data.user_id);
      setRecoveryStep(2);
      setOtpTimer(60);
      setCanResend(false);
      
      Alert.alert(
        'OTP Sent',
        `A 6-digit code has been sent to your ${useEmail ? 'email' : 'phone'}.`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', {
        [useEmail ? 'email' : 'phone']: recoveryIdentifier
      });
      setOtpTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      Alert.alert('Success', 'New OTP sent successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/verify-otp', {
        user_id: recoveryToken,
        otp: otpString
      });
      setRecoveryStep(3);
    } catch (error) {
      Alert.alert('Error', 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        user_id: recoveryToken,
        new_password: newPassword
      });
      
      Alert.alert(
        'Success',
        'Password reset successfully! You can now login with your new password.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowRecoveryModal(false);
              setRecoveryStep(1);
              setIsLogin(true);
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
  };

  const handleAuth = async () => {
    if (useEmail && !email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (useEmail && !validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }
    if (!useEmail && !phone) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }
    if (!useEmail && !validatePhone(phone)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (!isLogin && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (!isLogin && (!isOver18 || !acceptTerms)) {
      Alert.alert('Error', 'You must be 18+ and accept terms to continue');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = {
        password,
        device_id: deviceId
      };

      if (useEmail) {
        payload.email = email;
      } else {
        payload.phone = phone;
      }

      if (!isLogin) {
        payload.first_name = firstName;
        payload.last_name = lastName;
      }

      const response = await api.post(endpoint, payload);

      if (response.data.success) {
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        
        if (response.data.refresh_token) {
          await AsyncStorage.setItem('refreshToken', response.data.refresh_token);
        }
        
        navigation.replace('Home');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error;
      
      if (error.response?.status === 403 && errorMsg === 'MAX_DEVICES_REACHED') {
        Alert.alert(
          'Device Limit Reached',
          `Maximum ${MAX_ACCOUNTS_PER_DEVICE} accounts allowed on this device. Please use another device to create more accounts.`
        );
      } else {
        Alert.alert('Error', errorMsg || 'Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const showTerms = () => {
    Alert.alert(
      'Terms and Conditions',
      `VEV QUIZER TERMS AND CONDITIONS

1. ELIGIBILITY
- You must be 18 years or older
- Maximum ${MAX_ACCOUNTS_PER_DEVICE} accounts per device

2. ACCOUNT RECOVERY
- Password reset requires OTP verification

3. WELCOME BONUS
- New users receive ₦30 welcome bonus

By continuing, you agree to all terms and conditions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Accept', onPress: () => setAcceptTerms(true) }
      ]
    );
  };

  const RecoveryModal = () => (
    <Modal
      visible={showRecoveryModal}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Account Recovery</Text>
            <TouchableOpacity onPress={() => setShowRecoveryModal(false)}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {recoveryStep === 1 && (
            <>
              <Text style={styles.modalSubtitle}>
                Enter your {useEmail ? 'email' : 'phone number'}
              </Text>
              
              <View style={styles.methodToggle}>
                <TouchableOpacity
                  style={[styles.methodButton, useEmail && styles.activeMethod]}
                  onPress={() => setUseEmail(true)}
                >
                  <Icon name="email" size={20} color={useEmail ? '#667eea' : '#999'} />
                  <Text style={[styles.methodText, useEmail && styles.activeMethodText]}>Email</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.methodButton, !useEmail && styles.activeMethod]}
                  onPress={() => setUseEmail(false)}
                >
                  <Icon name="phone" size={20} color={!useEmail ? '#667eea' : '#999'} />
                  <Text style={[styles.methodText, !useEmail && styles.activeMethodText]}>Phone</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.modalInput}
                placeholder={useEmail ? "Enter your email" : "Enter your phone number"}
                value={recoveryIdentifier}
                onChangeText={setRecoveryIdentifier}
                keyboardType={useEmail ? 'email-address' : 'phone-pad'}
              />

              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleSendOTP}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>
                    {loading ? 'SENDING...' : 'SEND RECOVERY CODE'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {recoveryStep === 2 && (
            <>
              <Text style={styles.modalSubtitle}>
                Enter the 6-digit code sent to your {recoveryMethod}
              </Text>
              
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    style={styles.otpInput}
                    maxLength={1}
                    keyboardType="numeric"
                    value={digit}
                    onChangeText={(text) => handleOTPChange(text, index)}
                  />
                ))}
              </View>

              <View style={styles.timerContainer}>
                <Text style={styles.timerText}>
                  {otpTimer > 0 ? `Resend code in ${otpTimer}s` : 'Code expired?'}
                </Text>
                {canResend && (
                  <TouchableOpacity onPress={handleResendOTP}>
                    <Text style={styles.resendText}>Resend</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleVerifyOTP}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#4CAF50', '#45a049']}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>
                    {loading ? 'VERIFYING...' : 'VERIFY CODE'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {recoveryStep === 3 && (
            <>
              <Text style={styles.modalSubtitle}>
                Create your new password
              </Text>
              
              <TextInput
                style={styles.modalInput}
                placeholder="New password (min 6 characters)"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
              
              <TextInput
                style={styles.modalInput}
                placeholder="Confirm new password"
                secureTextEntry
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
              />

              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleResetPassword}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#ff6b6b', '#ff4757']}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>
                    {loading ? 'RESETTING...' : 'RESET PASSWORD'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.modalCancel}
            onPress={() => setShowRecoveryModal(false)}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>VEV QUIZER</Text>
            <Text style={styles.tagline}>Play Smart • Win Big</Text>
            <View style={styles.bonusBadge}>
              <Text style={styles.bonusText}>🎁 ₦30 WELCOME BONUS</Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, isLogin && styles.activeToggle]}
                onPress={() => setIsLogin(true)}
              >
                <Text style={[styles.toggleText, isLogin && styles.activeToggleText]}>
                  Login
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, !isLogin && styles.activeToggle]}
                onPress={() => setIsLogin(false)}
              >
                <Text style={[styles.toggleText, !isLogin && styles.activeToggleText]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.methodToggle}>
              <TouchableOpacity
                style={[styles.methodButton, useEmail && styles.activeMethod]}
                onPress={() => setUseEmail(true)}
              >
                <Icon name="email" size={20} color={useEmail ? '#667eea' : '#999'} />
                <Text style={[styles.methodText, useEmail && styles.activeMethodText]}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.methodButton, !useEmail && styles.activeMethod]}
                onPress={() => setUseEmail(false)}
              >
                <Icon name="phone" size={20} color={!useEmail ? '#667eea' : '#999'} />
                <Text style={[styles.methodText, !useEmail && styles.activeMethodText]}>Phone</Text>
              </TouchableOpacity>
            </View>

            {!isLogin && (
              <View style={styles.nameContainer}>
                <TextInput
                  style={[styles.input, styles.nameInput]}
                  placeholder="First Name"
                  placeholderTextColor="#999"
                  value={firstName}
                  onChangeText={setFirstName}
                />
                <TextInput
                  style={[styles.input, styles.nameInput]}
                  placeholder="Last Name"
                  placeholderTextColor="#999"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            )}

            {useEmail ? (
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="#999"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            )}

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Icon name={showPassword ? 'visibility' : 'visibility-off'} size={24} color="#999" />
              </TouchableOpacity>
            </View>

            {!isLogin && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />

                <TouchableOpacity 
                  style={styles.checkboxContainer}
                  onPress={() => setIsOver18(!isOver18)}
                >
                  <View style={[styles.checkbox, isOver18 && styles.checkboxChecked]}>
                    {isOver18 && <Icon name="check" size={16} color="#fff" />}
                  </View>
                  <Text style={styles.checkboxLabel}>I am 18 years or older</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.checkboxContainer}
                  onPress={showTerms}
                >
                  <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                    {acceptTerms && <Icon name="check" size={16} color="#fff" />}
                  </View>
                  <Text style={styles.checkboxLabel}>Accept Terms & Conditions</Text>
                </TouchableOpacity>
              </>
            )}

            {isLogin && (
              <TouchableOpacity 
                style={styles.forgotPasswordContainer}
                onPress={handleForgotPassword}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {!isLogin && (
              <View style={styles.deviceInfo}>
                <Icon name="info" size={16} color="#667eea" />
                <Text style={styles.deviceInfoText}>
                  Maximum {MAX_ACCOUNTS_PER_DEVICE} accounts per device
                </Text>
              </View>
            )}

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleAuth}
              disabled={loading}
            >
              <LinearGradient
                colors={['#ff6b6b', '#ff4757']}
                style={styles.gradientButton}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Please wait...' : (isLogin ? 'LOGIN' : 'SIGN UP & GET ₦30')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>

      <RecoveryModal />
      {loading && <LoadingSpinner fullScreen text="Please wait..." />}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  gradient: {
    flex: 1
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff'
  },
  tagline: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5
  },
  bonusBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 10
  },
  bonusText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 12
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    padding: 5
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8
  },
  activeToggle: {
    backgroundColor: '#667eea'
  },
  toggleText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500'
  },
  activeToggleText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  methodToggle: {
    flexDirection: 'row',
    marginBottom: 15,
    justifyContent: 'space-around'
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    width: '45%',
    justifyContent: 'center'
  },
  activeMethod: {
    backgroundColor: '#e0e0ff',
    borderWidth: 1,
    borderColor: '#667eea'
  },
  methodText: {
    marginLeft: 10,
    color: '#999',
    fontWeight: '500'
  },
  activeMethodText: {
    color: '#667eea',
    fontWeight: 'bold'
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  nameInput: {
    width: '48%'
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#333'
  },
  passwordContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center'
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#333'
  },
  eyeIcon: {
    padding: 15
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#667eea',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkboxChecked: {
    backgroundColor: '#667eea'
  },
  checkboxLabel: {
    color: '#333',
    fontSize: 14
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 15
  },
  forgotPasswordText: {
    color: '#667eea',
    fontSize: 14,
    textDecorationLine: 'underline'
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0ff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15
  },
  deviceInfoText: {
    marginLeft: 8,
    color: '#667eea',
    fontSize: 12
  },
  submitButton: {
    marginVertical: 20,
    borderRadius: 10,
    overflow: 'hidden'
  },
  gradientButton: {
    paddingVertical: 15,
    alignItems: 'center'
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15
  },
  modalButton: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10
  },
  modalButtonGradient: {
    padding: 15,
    alignItems: 'center'
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  modalCancel: {
    padding: 15,
    alignItems: 'center'
  },
  modalCancelText: {
    color: '#999',
    fontSize: 14
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  otpInput: {
    width: 45,
    height: 45,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold'
  },
  timerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  timerText: {
    fontSize: 14,
    color: '#999',
    marginRight: 10
  },
  resendText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: 'bold',
    textDecorationLine: 'underline'
  }
});

export default AuthScreen;