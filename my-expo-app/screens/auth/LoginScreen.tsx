import React, { useEffect, useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, Dimensions, KeyboardAvoidingView, Platform, Linking, Image } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import PremiumPopup from '../../components/PremiumPopup';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GOOGLE } from '../../config/google';
import 'react-native-reanimated';
import '../../global.css';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

interface LoginScreenProps {
  onLogin: () => void;
  onOpenPrivacy: () => void;
}

export default function LoginScreen({ onLogin, onOpenPrivacy }: LoginScreenProps) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [statusModal, setStatusModal] = useState({ visible: false, title: '', message: '', type: 'error' as 'success' | 'error' | 'info' | 'action' });
  const { login, googleLogin } = useAuth();

  const [googleRequest, googleResponse, googlePromptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE.clientId,
    androidClientId: GOOGLE.androidClientId,
    iosClientId: GOOGLE.iosClientId,
  });

  const handleGoogleLogin = async (idToken: string) => {
    setIsLoading(true);
    try {
      const success = await googleLogin(idToken);
      if (success) {
        onLogin();
      } else {
        setStatusModal({
          visible: true,
          title: 'Google Login Failed 🔒',
          message: 'Your Gmail is not registered with any account. Contact your admin to register your email.',
          type: 'error'
        });
      }
    } catch (error: any) {
      if (error.message === 'INACTIVE_USER_ALERT') {
        setStatusModal({
          visible: true,
          title: 'Account Halted 🛑',
          message: 'Your account has been disabled. Please contact your admin to reactivate.',
          type: 'info'
        });
      } else {
        setStatusModal({
          visible: true,
          title: 'System Error ⚠️',
          message: 'Google sign-in failed. Please try again or use username login.',
          type: 'error'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token } = googleResponse.params;
      handleGoogleLogin(id_token);
    }
  }, [googleResponse]);

  const formTranslateY = useSharedValue(height * 0.3);

  const formAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: formTranslateY.value }],
  }));

  useEffect(() => {
    formTranslateY.value = withTiming(0, { duration: 1000, easing: Easing.out(Easing.exp) });
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      setStatusModal({
        visible: true,
        title: 'Oops! 🎈',
        message: 'Please enter both username and password to enter the playground!',
        type: 'error'
      });
      return;
    }
    setIsLoading(true);
    try {
      const success = await login(username, password);
      if (success) {
        onLogin();
      } else {
        setStatusModal({
          visible: true,
          title: 'Login Failed 🔒',
          message: 'The username or password you entered doesn\'t seem right. Please check and try again!',
          type: 'error'
        });
      }
    } catch (error: any) {
      if (error.message === 'INACTIVE_USER_ALERT') {
         setStatusModal({
           visible: true,
           title: 'Account Halted 🛑',
           message: 'Your account has been disabled. Please contact your admin to reactivate.',
           type: 'info'
         });
      } else {
        setStatusModal({
          visible: true,
          title: 'System Error ⚠️',
          message: 'Something went wrong on our end. Please try again or contact the school office.',
          type: 'error'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCallOffice = () => {
    Linking.openURL('tel:9787751430');
  };

  const insets = useSafeAreaInsets();
  const brandColor = '#FFC107';

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFDF5' }}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      <View style={{ position: 'absolute', top: -30, right: -30, opacity: 0.06 }}>
        <MaterialCommunityIcons name="shield-check" size={200} color={brandColor} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 24) }}>
          <Animated.View
            style={[
              formAnimatedStyle,
              { width: '100%', alignItems: 'center' }
            ]}
          >
            <Image
              source={require('../../assets/hk-removebg-preview.png')}
              style={{ width: width * 0.85, height: 80 }}
              resizeMode="contain"
            />

            <View style={{ marginTop: 20, marginBottom: 28, alignItems: 'center' }}>
              <View style={{ backgroundColor: brandColor + '20', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 4, marginBottom: 6 }}>
                <Text style={{ color: brandColor, fontSize: 10, fontWeight: '900', letterSpacing: 2 }}>PRESCHOOL PORTAL</Text>
              </View>
              <Text style={{ color: '#1E1B4B', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 }}>Account Login</Text>
            </View>

            <View style={{ width: '100%' }}>
              <View style={{ marginBottom: 20 }}>
                <View style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 20,
                  paddingHorizontal: 20,
                  paddingVertical: 6,
                  borderWidth: 1.5,
                  borderColor: '#E8E0D0',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 3,
                }}>
                  <Text style={{ color: '#8B7E6B', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 4 }}>USERNAME</Text>
                  <TextInput
                    style={{
                      paddingVertical: 8,
                      fontWeight: '700',
                      color: '#1A202C',
                      fontSize: 17,
                    }}
                    placeholder="Enter your username"
                    placeholderTextColor="#C8C0B0"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={{ marginBottom: 12 }}>
                <View style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 20,
                  paddingHorizontal: 20,
                  paddingVertical: 6,
                  borderWidth: 1.5,
                  borderColor: '#E8E0D0',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 3,
                }}>
                  <Text style={{ color: '#8B7E6B', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 4 }}>PASSWORD</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        fontWeight: '700',
                        color: '#1E202C',
                        fontSize: 17,
                      }}
                      placeholder="Enter your password"
                      placeholderTextColor="#C8C0B0"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                      <MaterialCommunityIcons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={22}
                        color="#C8C0B0"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 28 }}>
                <TouchableOpacity onPress={() => setShowRecoverModal(true)}>
                  <Text style={{ color: '#8B7E6B', fontWeight: '600', fontSize: 13 }}>Forgot Password?</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onOpenPrivacy}>
                  <Text style={{ color: '#8B7E6B', fontWeight: '600', fontSize: 13 }}>Privacy Policy</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={handleLogin} disabled={isLoading} activeOpacity={0.9}>
                <LinearGradient
                  colors={[brandColor, '#FFB300']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 20,
                    paddingVertical: 18,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: brandColor,
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.4,
                    shadowRadius: 20,
                    elevation: 12,
                  }}
                >
                  <Text style={{ color: '#1E1B4B', fontWeight: '900', fontSize: 18, letterSpacing: 1 }}>
                    {isLoading ? 'LOGGING IN...' : 'LOGIN'}
                  </Text>
                  {!isLoading && <MaterialCommunityIcons name="arrow-right" size={22} color="#1E1B4B" style={{ marginLeft: 8 }} />}
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: '#E8E0D0' }} />
                <Text style={{ marginHorizontal: 16, color: '#8B7E6B', fontWeight: '700', fontSize: 12 }}>OR</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: '#E8E0D0' }} />
              </View>

              {/* Google Sign-In */}
              <TouchableOpacity
                onPress={() => googlePromptAsync()}
                disabled={isLoading || !googleRequest}
                activeOpacity={0.9}
                style={{
                  borderRadius: 20,
                  paddingVertical: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1.5,
                  borderColor: '#E8E0D0',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <MaterialCommunityIcons name="google" size={22} color="#EA4335" />
                <Text style={{ color: '#444', fontWeight: '800', fontSize: 16, marginLeft: 10 }}>
                  Sign in with Google
                </Text>
              </TouchableOpacity>

              <Image
                source={require('../../assets/bottom-login.png')}
                style={{ width: '100%', height: 100, marginTop: 16 }}
                resizeMode="contain"
              />
              <Text style={{ color: '#8B7E6B', fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 8, letterSpacing: 0.5, fontStyle: 'italic' }}>
                "Every child is a different kind of flower, and all together make this world a beautiful garden."
              </Text>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>

      <PremiumPopup
        visible={showRecoverModal}
        onClose={() => setShowRecoverModal(false)}
        title="Reset Password"
        message="Oops! Forgot your keys? 🎈 Please contact our school office directly to securely reset the password for your kid."
        type="info"
        icon="phone-message"
        buttonText="Call School Office"
        onButtonPress={handleCallOffice}
      />

      <PremiumPopup
        visible={statusModal.visible}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
        onClose={() => setStatusModal({ ...statusModal, visible: false })}
        buttonText="Got it"
      />
    </View>
  );
}