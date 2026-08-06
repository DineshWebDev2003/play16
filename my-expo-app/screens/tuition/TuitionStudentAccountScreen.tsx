import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Image, Linking, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import LogoutModal from '../../components/LogoutModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props { navigation: { navigate: (s: string) => void; goBack: () => void } }

const BORDER_RADIUS = 28;
const SECTION_GAP = 28;

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const ACCENT = '#10B981';

const ROLE_AVATAR = require('../../assets/Avatar/tuitio-student.png');

const MENU_ICONS: Record<string, any> = {
  profile: require('../../assets/icons/doctor.png'),
  phone: require('../../assets/icons/discussion (1).png'),
  studentId: require('../../assets/icons/student.png'),
  notifications: require('../../assets/icons/bell (1).png'),
  support: require('../../assets/icons/customer.png'),
  about: require('../../assets/icons/info.png'),
  privacy: require('../../assets/icons/lock.png'),
};

// ─── Soft radial glow (layered gradients ≈ blurred radial) ─────────────────────
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

// ─── Aurora Glass background (matches home screen) ──────────────────────────────
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

export default function TuitionStudentAccountScreen({ navigation }: Props) {
  const { user, logout, updateAvatar } = useAuth();
  const insets = useSafeAreaInsets();

  const [showLogout, setShowLogout] = useState(false);

  const glassCard = {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: BORDER_RADIUS,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  };

  const menuItems = [
    { id: 'profile', title: 'Profile Settings', subtitle: 'Update your profile information', image: 'profile', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', value: null },
    { id: 'phone', title: 'Phone', subtitle: 'Contact number', image: 'phone', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', value: user?.phone || 'Not provided' },
    { id: 'studentId', title: 'Student ID', subtitle: 'Admission number', image: 'studentId', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)', value: user?.studentId || 'N/A' },
    { id: 'notifications', title: 'Notifications', subtitle: 'Manage notification settings', image: 'notifications', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)', value: null },
    { id: 'support', title: 'Support & Help', subtitle: 'Get help and contact support', image: 'support', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', value: null },
    { id: 'about', title: 'About', subtitle: 'Visit our school website', image: 'about', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)', value: null },
    { id: 'privacy', title: 'Privacy Policy', subtitle: 'Data protection & privacy', image: 'privacy', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.12)', value: null },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={{ paddingTop: Math.max(insets.top, 56), paddingHorizontal: 20 }}>
          {/* ── Header (52px) ── */}
          <View style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '400', color: TEXT_MUTED }}>
                {(() => {
                  const h = new Date().getHours();
                  if (h < 12) return 'Good Morning 👋';
                  if (h < 17) return 'Good Afternoon 👋';
                  return 'Good Evening 👋';
                })()}
              </Text>
              <Text numberOfLines={1} style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 2 }}>
                {user?.name?.split(' ')[0] || 'Student'}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={updateAvatar}
              style={{
                width: 54,
                height: 54,
                borderRadius: 27,
                backgroundColor: 'rgba(255,255,255,0.92)',
                borderWidth: 2,
                borderColor: '#FFFFFF',
                shadowColor: '#000000',
                shadowOpacity: 0.1,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 6 },
                elevation: 8,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <Image source={ROLE_AVATAR} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              )}
              <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: ACCENT, padding: 4, borderRadius: 10, borderWidth: 2, borderColor: '#FFFFFF' }}>
                <MaterialCommunityIcons name="camera" size={12} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ height: SECTION_GAP }} />

          {/* ── Profile hero card ── */}
          <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('profileSettings')} style={glassCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(245,158,11,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Image source={MENU_ICONS.profile} style={{ width: 26, height: 26 }} resizeMode="contain" />
                </View>
                <View>
                  <Text style={{ color: TEXT_PRIMARY, fontSize: 17, fontWeight: '700', letterSpacing: -0.5 }}>Student Profile</Text>
                  <Text style={{ color: TEXT_MUTED, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 1 }}>
                    Learning Account
                  </Text>
                </View>
              </View>
              <View style={{ backgroundColor: 'rgba(16,185,129,0.12)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100, flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="shield-check" size={11} color={ACCENT} />
                <Text style={{ color: ACCENT, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', marginLeft: 4 }}>Verified</Text>
              </View>
            </View>
            <View style={{ backgroundColor: 'rgba(247,249,246,0.9)', borderRadius: 18, padding: 14 }}>
              <Text style={{ color: TEXT_PRIMARY, fontSize: 22, fontWeight: '700', letterSpacing: -0.5 }} numberOfLines={1}>
                {user?.name || 'Tuition Student'}
              </Text>
              <Text style={{ color: TEXT_SECONDARY, fontSize: 12, fontWeight: '600', marginTop: 3 }}>
                {user?.email || 'Not provided'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                {user?.studentId && (
                  <View style={{ backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
                    <MaterialCommunityIcons name="school" size={12} color={ACCENT} />
                    <Text style={{ color: ACCENT, fontSize: 10, fontWeight: '900', marginLeft: 5 }}>{user.studentId}</Text>
                  </View>
                )}
                {!!user?.phone && (
                  <View style={{ backgroundColor: 'rgba(245,158,11,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="phone" size={12} color="#D97706" />
                    <Text style={{ color: '#D97706', fontSize: 10, fontWeight: '900', marginLeft: 5 }}>{user.phone}</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
              <MaterialCommunityIcons name="pencil" size={12} color={TEXT_MUTED} />
              <Text style={{ color: TEXT_MUTED, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 6 }}>
                Edit Profile
              </Text>
            </View>
          </TouchableOpacity>

          {/* ── Account Info & More ── */}
          <View style={{ paddingTop: SECTION_GAP }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: TEXT_PRIMARY }}>Settings & Controls</Text>
              <View style={{ backgroundColor: 'rgba(16,185,129,0.12)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100 }}>
                <Text style={{ color: ACCENT, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Account</Text>
              </View>
            </View>

            <View style={{ borderRadius: BORDER_RADIUS, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  disabled={item.value !== null}
                  style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: index !== menuItems.length - 1 ? 1 : 0, borderBottomColor: 'rgba(247,249,246,1)' }}
                  onPress={() => {
                    if (item.id === 'profile') {
                      navigation.navigate('profileSettings');
                    } else if (item.id === 'notifications') {
                      navigation.navigate('notificationSettings');
                    } else if (item.id === 'about') {
                      Linking.openURL('https://tnhappykids.in').catch(err => Alert.alert('Error', 'Could not open website'));
                    } else if (item.id === 'privacy') {
                      Linking.openURL('https://dineshwebdev2003.github.io/play16/privacy-policy.html').catch(err => Alert.alert('Error', 'Could not open website'));
                    } else {
                      Alert.alert('Coming Soon', `${item.title} screen is coming soon! ✨`);
                    }
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={{ backgroundColor: item.bg, padding: 12, borderRadius: 14, marginRight: 14 }}>
                      <Image source={MENU_ICONS[item.image]} style={{ width: 22, height: 22 }} resizeMode="contain" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', letterSpacing: -0.3, color: TEXT_PRIMARY }}>{item.title}</Text>
                      <Text style={{ fontSize: 11, fontWeight: '600', marginTop: 1, color: TEXT_MUTED }}>{item.subtitle}</Text>
                    </View>
                  </View>
                  {item.value !== null ? (
                    <Text style={{ fontSize: 14, fontWeight: '900', color: TEXT_SECONDARY }} numberOfLines={1}>{item.value}</Text>
                  ) : (
                    <View style={{ backgroundColor: 'rgba(247,249,246,0.9)', width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialCommunityIcons name="chevron-right" size={18} color={TEXT_MUTED} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Sign Out */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setShowLogout(true)}
              style={{ borderRadius: BORDER_RADIUS, overflow: 'hidden', marginTop: 20, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}
            >
              <View style={{ paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="power" size={24} color="#EF4444" />
                <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 18, marginLeft: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Secure Sign Out</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Spacer so the tab dock never covers content */}
        <View style={{ height: 140 }} />
      </ScrollView>

      <LogoutModal visible={showLogout} onConfirm={logout} onCancel={() => setShowLogout(false)} />
    </View>
  );
}
