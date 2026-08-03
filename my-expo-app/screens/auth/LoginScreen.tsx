import React, { useEffect, useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, Dimensions, KeyboardAvoidingView, Platform, Linking, Image, ScrollView } from 'react-native';
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
  maintenanceMessage?: string;
}

export default function LoginScreen({ onLogin, onOpenPrivacy, maintenanceMessage }: LoginScreenProps) {
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

  const handleCallOffice = () => Linking.openURL('tel:8925105109');

  const insets = useSafeAreaInsets();
  const primary = '#E91E63';

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />

      {/* Decorative onboarding-style background circles */}
      <View style={{ position: 'absolute', top: -90, right: -70, width: 240, height: 240, borderRadius: 120, backgroundColor: '#FDF2F8', opacity: 0.9 }} />
      <View style={{ position: 'absolute', top: -30, right: -10, width: 90, height: 90, borderRadius: 45, backgroundColor: '#FFF7ED' }} />
      <View style={{ position: 'absolute', bottom: -100, left: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: '#FEF3F2', opacity: 0.9 }} />
      <View style={{ position: 'absolute', top: '42%', left: -50, width: 90, height: 90, borderRadius: 45, backgroundColor: '#FFF1F2', opacity: 0.8 }} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28, paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 20) }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[formAnimatedStyle, { width: '100%', alignItems: 'center' }]}>
            {/* Brand */}
            <View style={{ alignItems: 'center', marginBottom: 26 }}>
              <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } }}>
                <Image source={require('../../assets/icon.png')} style={{ width: 74, height: 74, borderRadius: 37 }} resizeMode="contain" />
              </View>
              <Text style={{ color: '#111827', fontSize: 24, fontWeight: '900', letterSpacing: -0.5, marginTop: 14 }}>Welcome Back!</Text>
              <View style={{ backgroundColor: '#FFF0F5', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20, marginTop: 8 }}>
                <Text style={{ color: primary, fontSize: 10, fontWeight: '900', letterSpacing: 2 }}>TN HAPPYKIDS PRESCHOOL PORTAL</Text>
              </View>
            </View>

            {maintenanceMessage ? (
              <View style={{
                width: '100%', marginBottom: 18, padding: 12, borderRadius: 14,
                backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A',
                flexDirection: 'row', alignItems: 'flex-start',
              }}>
                <MaterialCommunityIcons name="tools" size={18} color="#B45309" style={{ marginRight: 10, marginTop: 1 }} />
                <Text style={{ color: '#92400E', fontSize: 12, fontWeight: '700', lineHeight: 18, flex: 1 }}>
                  {maintenanceMessage || 'The app is currently under maintenance. You can still log in if you have an account.'}
                </Text>
              </View>
            ) : null}

            <View style={{ width: '100%' }}>
              {/* Username */}
              <View style={{ marginBottom: 16 }}>
                <LinearGradient
                  colors={['#FFF0F5', '#FFFFFF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 18,
                    paddingHorizontal: 18,
                    paddingVertical: 6,
                    borderWidth: 1.5,
                    borderColor: '#FAD1DE',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.05,
                    shadowRadius: 10,
                    elevation: 2,
                  }}
                >
                  <Text style={{ color: primary, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: 4 }}>USERNAME</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#FDE8EF', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <MaterialCommunityIcons name="account-outline" size={18} color={primary} />
                    </View>
                    <TextInput
                      style={{ flex: 1, paddingVertical: 8, fontWeight: '700', color: '#333', fontSize: 16 }}
                      placeholder="Enter your username"
                      placeholderTextColor="#C8C0B0"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                    />
                  </View>
                </LinearGradient>
              </View>

              {/* Password */}
              <View style={{ marginBottom: 12 }}>
                <LinearGradient
                  colors={['#FFF0F5', '#FFFFFF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 18,
                    paddingHorizontal: 18,
                    paddingVertical: 6,
                    borderWidth: 1.5,
                    borderColor: '#FAD1DE',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.05,
                    shadowRadius: 10,
                    elevation: 2,
                  }}
                >
                  <Text style={{ color: primary, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: 4 }}>PASSWORD</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#FDE8EF', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <MaterialCommunityIcons name="lock-outline" size={18} color={primary} />
                    </View>
                    <TextInput
                      style={{ flex: 1, paddingVertical: 8, fontWeight: '700', color: '#333', fontSize: 16 }}
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
                </LinearGradient>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 24 }}>
                <TouchableOpacity onPress={() => setShowRecoverModal(true)}>
                  <Text style={{ color: '#9CA3AF', fontWeight: '700', fontSize: 13 }}>Forgot Password?</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onOpenPrivacy}>
                  <Text style={{ color: primary, fontWeight: '700', fontSize: 13 }}>Privacy Policy</Text>
                </TouchableOpacity>
              </View>

              <LinearGradient
                colors={[primary, '#D81B60', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 18, padding: 1.5, marginBottom: 18, elevation: 4, shadowColor: primary, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }}>
                <TouchableOpacity onPress={handleLogin} disabled={isLoading} activeOpacity={0.9}
                  style={{ backgroundColor: '#FFFFFF', borderRadius: 17, paddingVertical: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: primary, fontWeight: '900', fontSize: 17, letterSpacing: 1 }}>
                    {isLoading ? 'LOGGING IN...' : 'LOGIN'}
                  </Text>
                  {!isLoading && <MaterialCommunityIcons name="arrow-right" size={22} color={primary} style={{ marginLeft: 8 }} />}
                </TouchableOpacity>
              </LinearGradient>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: '#EDE9E9' }} />
                <Text style={{ marginHorizontal: 16, color: '#9CA3AF', fontWeight: '700', fontSize: 12 }}>OR</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: '#EDE9E9' }} />
              </View>

              <TouchableOpacity onPress={handleGoogleSignIn} disabled={isLoading} activeOpacity={0.9}
                style={{ borderRadius: 18, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#F3E8FF', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
                <MaterialCommunityIcons name="google" size={22} color="#EA4335" />
                <Text style={{ color: '#444', fontWeight: '800', fontSize: 15, marginLeft: 10 }}>Sign in with Google</Text>
              </TouchableOpacity>

              <Image source={require('../../assets/bottom-login.png')} style={{ width: '100%', height: 100, marginTop: 16, tintColor: 'rgba(233,30,99,0.35)' }} resizeMode="contain" />
              <Text style={{ color: '#9CA3AF', fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 8, letterSpacing: 0.5, fontStyle: 'italic', lineHeight: 16 }}>
                "Every child is a different kind of flower, and all together make this world a beautiful garden."
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <PremiumPopup visible={showRecoverModal} onClose={() => setShowRecoverModal(false)} title="Reset Password"
        message="Oops! Forgot your keys? Contact our school office directly to reset the password."
        type="info" icon="phone-message" buttonText="Call School Office" onButtonPress={handleCallOffice} />
      <PremiumPopup visible={statusModal.visible} title={statusModal.title} message={statusModal.message}
        type={statusModal.type} onClose={() => setStatusModal({ ...statusModal, visible: false })} buttonText="Got it" />
    </View>
  );
}
