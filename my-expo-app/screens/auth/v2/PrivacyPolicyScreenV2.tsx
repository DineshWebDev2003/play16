import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
}

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const ACCENT = '#F59E0B';

const GLASS = {
  backgroundColor: 'rgba(255,255,255,0.92)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.6)',
  borderRadius: 22,
};

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

const SECTIONS = [
  {
    image: require('../../../assets/icons/info.png'),
    title: '1. Introduction',
    body: 'Welcome to TN HappyKids. We are committed to protecting the privacy of our students, parents, and teachers. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application.',
  },
  {
    image: require('../../../assets/icons/database.png'),
    title: '2. Information We Collect',
    body: 'We collect information that is necessary for school management and communication:',
    bullets: [
      'User credentials (Username/Password) provided by the school.',
      'Student information including names, attendance records, and activity logs.',
      'Media files (Photos) uploaded by teachers to share classroom activities with parents.',
      'Device information for push notifications and app security.',
    ],
  },
  {
    image: require('../../../assets/icons/education.png'),
    title: '3. How We Use Information',
    body: 'The information collected is used solely for school-related purposes:',
    bullets: [
      'To track student attendance and daily progress.',
      'To facilitate communication between school staff and parents.',
      'To provide secure access to school resources and updates.',
      'To send important notifications regarding school timing, holidays, or emergencies.',
    ],
  },
  {
    image: require('../../../assets/icons/lock.png'),
    title: '4. Data Security',
    body: 'We implement industry-standard security measures to protect your data. Access to student information is restricted to authorized school personnel and the respective parents only. All data is stored on secure servers with encryption.',
  },
  {
    image: require('../../../assets/icons/kindergarten.png'),
    title: '5. Children\u2019s Privacy',
    body: 'CHK is a playschool management app. We do not allow children to create accounts or interact with the app directly. All data related to children is managed by adult teachers and parents. We conform to international standards regarding children\u2019s data privacy.',
  },
  {
    image: require('../../../assets/icons/team.png'),
    title: '6. Third-Party Services',
    body: 'We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. We only use trusted services for app functionality (like push notifications) which do not use your data for advertising.',
  },
  {
    image: require('../../../assets/icons/cctv-camera.png'),
    title: '8. Live Streaming',
    body: 'Our application provides a highly secure live streaming feature for classrooms. This service is provided strictly for the following purposes:',
    bullets: [
      'To allow authorized parents only to observe their child\u2019s learning environment and classroom activities.',
      'To ensure transparency and student safety during school hours.',
    ],
    extra: 'Access to live streams is encrypted and requires valid parent credentials. Sharing stream access or recording student activities is strictly prohibited.',
  },
];

export default function PrivacyPolicyScreenV2({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <StatusBar style="dark" />
      <AuroraBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" colors={['#F59E0B']} />}
      >
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: Math.max(insets.top, 20), paddingBottom: 12 }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.goBack()}
              style={{
                width: 50,
                height: 50,
                borderRadius: 16,
                backgroundColor: 'rgba(255,255,255,0.92)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.6)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={TEXT_PRIMARY} />
            </TouchableOpacity>
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={{ fontSize: 26, fontWeight: '700', color: TEXT_PRIMARY }}>Privacy Policy</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#DB2777', marginTop: 2 }}>Your Privacy, Our Priority</Text>
            </View>
          </View>

          <View style={{ alignItems: 'center', marginBottom: 24, marginTop: 8 }}>
            <View style={{ ...GLASS, borderRadius: 48, width: 96, height: 96, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 }}>
              <LinearGradient colors={[ACCENT, '#DB2777']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="shield-check" size={44} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={{ fontSize: 24, fontWeight: '800', color: TEXT_PRIMARY, marginTop: 16 }}>Your Privacy Matters</Text>
            <View style={{ backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 8 }}>
              <Text style={{ fontSize: 10, fontWeight: '900', color: ACCENT, letterSpacing: 1, textTransform: 'uppercase' }}>Last Updated: March 24, 2026</Text>
            </View>
          </View>

          {SECTIONS.map((section, i) => (
            <View key={i} style={{ marginBottom: 18 }}>
              <View style={{ ...GLASS, padding: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(245,158,11,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Image source={section.image} style={{ width: 22, height: 22 }} resizeMode="contain" />
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: TEXT_PRIMARY, flex: 1 }}>{section.title}</Text>
                </View>
                <Text style={{ fontSize: 14, color: TEXT_SECONDARY, lineHeight: 22 }}>{section.body}</Text>
                {section.bullets?.map((b, bi) => (
                  <View key={bi} style={{ flexDirection: 'row', marginTop: 8, paddingRight: 10 }}>
                    <Text style={{ fontSize: 14, color: ACCENT, marginRight: 10, fontWeight: '900' }}>•</Text>
                    <Text style={{ fontSize: 13.5, color: TEXT_SECONDARY, lineHeight: 21, flex: 1 }}>{b}</Text>
                  </View>
                ))}
                {section.extra ? (
                  <Text style={{ fontSize: 14, color: TEXT_SECONDARY, lineHeight: 22, marginTop: 10 }}>{section.extra}</Text>
                ) : null}
              </View>
            </View>
          ))}

          <View style={{ marginBottom: 20 }}>
            <LinearGradient
              colors={[ACCENT, '#DB2777']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 22, padding: 20, elevation: 4, shadowColor: ACCENT, shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <MaterialCommunityIcons name="phone-message" size={22} color="#FFFFFF" style={{ marginRight: 10 }} />
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF' }}>9. Contact Us</Text>
              </View>
              <Text style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.9)', lineHeight: 20 }}>
                If you have any questions regarding this Privacy Policy, you may contact the school office at:
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14 }}>
                <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                  <Image source={require('../../../assets/icon.png')} style={{ width: 36, height: 36, borderRadius: 18 }} resizeMode="contain" />
                </View>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFFFFF' }}>TN HappyKids</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>Phone: +91 89251 05109</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>
      </ScrollView>

      <View style={{ padding: 14, alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.6)', paddingBottom: Math.max(insets.bottom, 14) }}>
        <Text style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: '700' }}>© 2026 TN HappyKids. All Rights Reserved.</Text>
      </View>
    </View>
  );
}
