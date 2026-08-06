import React, { useEffect, useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, Dimensions, KeyboardAvoidingView, Platform, Linking, Image, ScrollView, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../../contexts/AuthContext';
import PremiumPopup from '../../../components/PremiumPopup';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GOOGLE } from '../../../config/google';
import 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TEXT_PRIMARY = '#1F2D28';
const TEXT_MUTED = '#7A8A82';
const TEXT_SECONDARY = '#4A5B53';
const ACCENT = '#F59E0B';
const PINK = '#DB2777';

const CARD = {
  backgroundColor: 'rgba(255,255,255,0.92)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.6)',
  borderRadius: 22,
};

const INPUT = {
  backgroundColor: 'rgba(247,249,246,0.9)',
  borderWidth: 1,
  borderColor: 'rgba(122,138,130,0.25)',
  borderRadius: 16,
};

interface Props {
  onLogin: () => void;
  onOpenPrivacy: () => void;
  maintenanceMessage?: string;
}

function RadialGlow({ size, color, opacity, style }: {
  size: number;
  color: string;
  opacity: number;
  style?: any;
}) {
  const layers = [0, 45, 90, 135];
  return (
    <View
      pointerEvents="none"
      style={[
        { position: 'absolute', width: size, height: size, borderRadius: size / 2, opacity },
        style,
      ]}
    >
      {layers.map((deg) => (
        <LinearGradient
          key={deg}
          colors={[color, 'rgba(255,255,255,0)']}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[StyleSheet.absoluteFill, { transform: [{ rotate: `${deg}deg` }] }]}
        />
      ))}
    </View>
  );
}

function AuroraBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['#F7F9F6', '#F2FAF5', '#EEFDFC', '#F7F9F6']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <RadialGlow size={480} color="#DDF8D7" opacity={0.28} style={{ top: -160, left: -160 }} />
      <RadialGlow size={420} color="#DDFBFF" opacity={0.25} style={{ top: -140, left: SCREEN_WIDTH / 2 - 210 }} />
      <RadialGlow size={520} color="#F8FFD8" opacity={0.24} style={{ bottom: -180, left: -180 }} />
      <RadialGlow size={450} color="#EAF5FF" opacity={0.18} style={{ top: SCREEN_HEIGHT * 0.4 - 225, right: -180 }} />
    </View>
  );
}

export default function LoginScreenV2({ onLogin, onOpenPrivacy, maintenanceMessage }: Props) {
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
      const idToken = userInfo.data?.idToken || (userInfo as any).idToken;
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

  const formTranslateY = useSharedValue(SCREEN_HEIGHT * 0.3);

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

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <StatusBar style="dark" />
      <AuroraBackground />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 20) }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[formAnimatedStyle, { width: '100%', alignItems: 'center' }]}>
            <View style={{ alignItems: 'center', marginBottom: 26 }}>
              <View style={{ width: 88, height: 88, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8 }}>
                <Image source={require('../../../assets/icon.png')} style={{ width: 74, height: 74, borderRadius: 22 }} resizeMode="contain" />
              </View>
              <Text style={{ color: TEXT_PRIMARY, fontSize: 24, fontWeight: '900', letterSpacing: -0.5, marginTop: 14 }}>Welcome Back!</Text>
              <View style={{ backgroundColor: 'rgba(219,39,119,0.1)', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginTop: 8 }}>
                <Text style={{ color: PINK, fontSize: 10, fontWeight: '900', letterSpacing: 2 }}>TN HAPPYKIDS PRESCHOOL PORTAL</Text>
              </View>
            </View>

            {maintenanceMessage ? (
              <View style={{
                width: '100%', marginBottom: 18, padding: 12, borderRadius: 16,
                backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)',
                flexDirection: 'row', alignItems: 'flex-start',
              }}>
                <MaterialCommunityIcons name="tools" size={18} color="#B45309" style={{ marginRight: 10, marginTop: 1 }} />
                <Text style={{ color: '#92400E', fontSize: 12, fontWeight: '700', lineHeight: 18, flex: 1 }}>
                  {maintenanceMessage || 'The app is currently under maintenance. You can still log in if you have an account.'}
                </Text>
              </View>
            ) : null}

            <View style={{ width: '100%' }}>
              <View style={[CARD, { paddingHorizontal: 18, paddingVertical: 14, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }]}>
                <Text style={{ color: TEXT_SECONDARY, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 }}>USERNAME</Text>
                <View style={[INPUT, { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 }]}>
                  <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(219,39,119,0.08)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Image source={require('../../../assets/icons/customer.png')} style={{ width: 20, height: 20 }} resizeMode="contain" />
                  </View>
                  <TextInput
                    style={{ flex: 1, paddingVertical: 12, fontWeight: '700', color: TEXT_PRIMARY, fontSize: 16 }}
                    placeholder="Enter your username"
                    placeholderTextColor={TEXT_MUTED}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={[CARD, { paddingHorizontal: 18, paddingVertical: 14, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }]}>
                <Text style={{ color: TEXT_SECONDARY, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 }}>PASSWORD</Text>
                <View style={[INPUT, { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 }]}>
                  <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(219,39,119,0.08)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Image source={require('../../../assets/icons/lock.png')} style={{ width: 20, height: 20 }} resizeMode="contain" />
                  </View>
                  <TextInput
                    style={{ flex: 1, paddingVertical: 12, fontWeight: '700', color: TEXT_PRIMARY, fontSize: 16 }}
                    placeholder="Enter your password"
                    placeholderTextColor={TEXT_MUTED}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                    <MaterialCommunityIcons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={22} color={TEXT_MUTED} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 24 }}>
                <TouchableOpacity onPress={() => setShowRecoverModal(true)}>
                  <Text style={{ color: TEXT_MUTED, fontWeight: '700', fontSize: 13 }}>Forgot Password?</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onOpenPrivacy}>
                  <Text style={{ color: PINK, fontWeight: '700', fontSize: 13 }}>Privacy Policy</Text>
                </TouchableOpacity>
              </View>

              <LinearGradient
                colors={[PINK, '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 18, marginBottom: 18, elevation: 4, shadowColor: PINK, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }}>
                <TouchableOpacity onPress={handleLogin} disabled={isLoading} activeOpacity={0.9}
                  style={{ borderRadius: 17, paddingVertical: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 17, letterSpacing: 1 }}>
                    {isLoading ? 'LOGGING IN...' : 'LOGIN'}
                  </Text>
                  {!isLoading && <MaterialCommunityIcons name="arrow-right" size={22} color="#FFFFFF" style={{ marginLeft: 8 }} />}
                </TouchableOpacity>
              </LinearGradient>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(122,138,130,0.25)' }} />
                <Text style={{ marginHorizontal: 16, color: TEXT_MUTED, fontWeight: '700', fontSize: 12 }}>OR</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(122,138,130,0.25)' }} />
              </View>

              <TouchableOpacity onPress={handleGoogleSignIn} disabled={isLoading} activeOpacity={0.9}
                style={[CARD, { paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }]}>
                <MaterialCommunityIcons name="google" size={22} color="#EA4335" />
                <Text style={{ color: TEXT_SECONDARY, fontWeight: '800', fontSize: 15, marginLeft: 10 }}>Sign in with Google</Text>
              </TouchableOpacity>

              <Image source={require('../../../assets/bottom-login.png')} style={{ width: '100%', height: 100, marginTop: 16, tintColor: 'rgba(245,158,11,0.4)' }} resizeMode="contain" />
              <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 8, letterSpacing: 0.5, fontStyle: 'italic', lineHeight: 16 }}>
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
