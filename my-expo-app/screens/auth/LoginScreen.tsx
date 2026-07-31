import React, { useEffect, useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, Dimensions, KeyboardAvoidingView, Platform, Linking, Image } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import PremiumPopup from '../../components/PremiumPopup';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GOOGLE } from '../../config/google';
import 'react-native-reanimated';
import '../../global.css';

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

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE.clientId,
      iosClientId: GOOGLE.iosClientId,
    });
    GoogleSignin.signOut().catch(() => {});
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      try { await GoogleSignin.signOut(); } catch (_) {}
      const hasPlay = await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken || userInfo.idToken;
      if (!idToken) {
        setStatusModal({ visible: true, title: 'Google Login Failed', message: 'Could not get ID token from Google.', type: 'error' });
        return;
      }
      setIsLoading(true);
      const success = await googleLogin(idToken);
      if (success) onLogin();
      else setStatusModal({ visible: true, title: 'Google Login Failed', message: 'Your Gmail is not registered. Contact your admin.', type: 'error' });
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) return;
      if (error.code === statusCodes.IN_PROGRESS) return;
      setStatusModal({ visible: true, title: 'Error', message: error?.message || 'Google sign-in failed.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const formTranslateY = useSharedValue(height * 0.3);

  const formAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: formTranslateY.value }],
  }));

  useEffect(() => {
    formTranslateY.value = withTiming(0, { duration: 1000, easing: Easing.out(Easing.exp) });
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      setStatusModal({ visible: true, title: 'Oops!', message: 'Please enter both username and password.', type: 'error' });
      return;
    }
    setIsLoading(true);
    try {
      const success = await login(username, password);
      if (success) onLogin();
      else setStatusModal({ visible: true, title: 'Login Failed', message: 'Invalid username or password.', type: 'error' });
    } catch (error: any) {
      if (error.message === 'INACTIVE_USER_ALERT') setStatusModal({ visible: true, title: 'Account Halted', message: 'Your account has been disabled. Contact your admin.', type: 'info' });
      else setStatusModal({ visible: true, title: 'Error', message: 'Something went wrong. Please try again.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCallOffice = () => Linking.openURL('tel:9787751430');

  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#E91E63' }}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <View style={{ position: 'absolute', top: -60, right: -40, opacity: 0.08 }}>
        <MaterialCommunityIcons name="shield-check" size={240} color="#FFFFFF" />
      </View>
      <View style={{ position: 'absolute', bottom: -40, left: -40, opacity: 0.06 }}>
        <MaterialCommunityIcons name="flower" size={200} color="#FFFFFF" />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 24) }}>
          <Animated.View style={[formAnimatedStyle, { width: '100%', alignItems: 'center' }]}>
            <Image source={require('../../assets/hk-removebg-preview.png')} style={{ width: width * 0.85, height: 80, tintColor: '#FFFFFF' }} resizeMode="contain" />

            <View style={{ marginTop: 20, marginBottom: 28, alignItems: 'center' }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 4, marginBottom: 6 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900', letterSpacing: 2 }}>PRESCHOOL PORTAL</Text>
              </View>
              <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 }}>Account Login</Text>
            </View>

            <View style={{ width: '100%' }}>
              <View style={{ marginBottom: 20 }}>
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  borderRadius: 20,
                  paddingHorizontal: 20,
                  paddingVertical: 6,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 10,
                  elevation: 4,
                }}>
                  <Text style={{ color: '#E91E63', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 4 }}>USERNAME</Text>
                  <TextInput
                    style={{ paddingVertical: 8, fontWeight: '700', color: '#333', fontSize: 17 }}
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
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  borderRadius: 20,
                  paddingHorizontal: 20,
                  paddingVertical: 6,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 10,
                  elevation: 4,
                }}>
                  <Text style={{ color: '#E91E63', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 4 }}>PASSWORD</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput
                      style={{ flex: 1, paddingVertical: 8, fontWeight: '700', color: '#333', fontSize: 17 }}
                      placeholder="Enter your password"
                      placeholderTextColor="#C8C0B0"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                      <MaterialCommunityIcons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={22} color="#C8C0B0" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 28 }}>
                <TouchableOpacity onPress={() => setShowRecoverModal(true)}>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '600', fontSize: 13 }}>Forgot Password?</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onOpenPrivacy}>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '600', fontSize: 13 }}>Privacy Policy</Text>
                </TouchableOpacity>
              </View>

              <LinearGradient
                colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 20, padding: 1.5, marginBottom: 20 }}>
                <TouchableOpacity onPress={handleLogin} disabled={isLoading} activeOpacity={0.9}
                  style={{ backgroundColor: '#FFFFFF', borderRadius: 20, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#E91E63', fontWeight: '900', fontSize: 18, letterSpacing: 1 }}>
                    {isLoading ? 'LOGGING IN...' : 'LOGIN'}
                  </Text>
                  {!isLoading && <MaterialCommunityIcons name="arrow-right" size={22} color="#E91E63" style={{ marginLeft: 8 }} />}
                </TouchableOpacity>
              </LinearGradient>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                <Text style={{ marginHorizontal: 16, color: 'rgba(255,255,255,0.7)', fontWeight: '700', fontSize: 12 }}>OR</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
              </View>

              <TouchableOpacity onPress={handleGoogleSignIn} disabled={isLoading} activeOpacity={0.9}
                style={{ borderRadius: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.95)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 }}>
                <MaterialCommunityIcons name="google" size={22} color="#EA4335" />
                <Text style={{ color: '#444', fontWeight: '800', fontSize: 16, marginLeft: 10 }}>Sign in with Google</Text>
              </TouchableOpacity>

              <Image source={require('../../assets/bottom-login.png')} style={{ width: '100%', height: 100, marginTop: 16, tintColor: 'rgba(255,255,255,0.6)' }} resizeMode="contain" />
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 8, letterSpacing: 0.5, fontStyle: 'italic' }}>
                "Every child is a different kind of flower, and all together make this world a beautiful garden."
              </Text>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>

      <PremiumPopup visible={showRecoverModal} onClose={() => setShowRecoverModal(false)} title="Reset Password"
        message="Oops! Forgot your keys? Contact our school office directly to reset the password."
        type="info" icon="phone-message" buttonText="Call School Office" onButtonPress={handleCallOffice} />
      <PremiumPopup visible={statusModal.visible} title={statusModal.title} message={statusModal.message}
        type={statusModal.type} onClose={() => setStatusModal({ ...statusModal, visible: false })} buttonText="Got it" />
    </View>
  );
}
