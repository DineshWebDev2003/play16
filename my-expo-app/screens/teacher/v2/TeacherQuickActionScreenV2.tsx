import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
}

const BORDER_RADIUS = 22;
const SECTION_GAP = 28;

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const ACCENT = '#F59E0B';

const ROLE_AVATAR = require('../../../assets/Avatar/teacher.png');

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

const GRID_ROWS: { label: string; screen: string; image: any; color: string; tag: string; subtitle: string; fullWidth?: boolean }[][] = [
  [
    { label: 'Student Info', screen: 'studentList', image: require('../../../assets/icons/student.png'), color: '#3B82F6', tag: 'Directory', subtitle: 'Global directory' },
    { label: 'Duty Log', screen: 'myAttendance', image: require('../../../assets/icons/note-book.png'), color: '#6366F1', tag: 'Work', subtitle: 'Work history' },
  ],
  [
    { label: 'Student Attendance', screen: 'takeAttendance', image: require('../../../assets/icons/exam-results.png'), color: '#F59E0B', tag: 'Presence', subtitle: 'Mark presence' },
    { label: 'Social Feed', screen: 'postActivity', image: require('../../../assets/icons/painting.png'), color: '#FBBF24', tag: 'Share', subtitle: 'Share moments' },
  ],
  [
    { label: 'Messages', screen: 'nannyChat', image: require('../../../assets/icons/discussion (1).png'), color: '#06B6D4', tag: 'Chat', subtitle: 'Talk to nannies' },
    { label: 'Timetable', screen: 'timetable', image: require('../../../assets/icons/calendar.png'), color: '#6366F1', tag: 'Plans', subtitle: 'Daily schedule' },
  ],
];

function ActionCard({ action, onPress }: { action: typeof GRID_ROWS[0][0]; onPress: () => void }) {
  const tintBg = action.color + '1F';
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={{
        width: action.fullWidth ? '100%' : '48%',
        marginBottom: 16,
        borderRadius: BORDER_RADIUS,
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        padding: 16,
      }}
    >
      <View
        style={{
          height: 84,
          borderRadius: 18,
          backgroundColor: tintBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image source={action.image} style={{ width: 64, height: 64 }} resizeMode="contain" />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <Text numberOfLines={1} style={{ flex: 1, fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY }}>
          {action.label}
        </Text>
        <View style={{ backgroundColor: tintBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, marginLeft: 6 }}>
          <Text style={{ fontSize: 8, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', color: action.color }}>
            {action.tag}
          </Text>
        </View>
      </View>
      <Text style={{ fontSize: 9, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: TEXT_MUTED, marginTop: 4 }}>
        {action.subtitle}
      </Text>
    </TouchableOpacity>
  );
}

export default function TeacherQuickActionScreenV2({ navigation }: Props) {
  const { user, updateAvatar } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      {/* ── Aurora Glass background ── */}
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={{ paddingTop: Math.max(insets.top, 56), paddingHorizontal: 20 }}>
          {/* ── Header (52px) ── */}
          <View style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '400', color: TEXT_MUTED }}>Teacher Access</Text>
              <Text numberOfLines={1} style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 2 }}>
                Quick Actions
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

          {/* ── Section title ── */}
          <Text style={{ fontSize: 18, fontWeight: '600', color: TEXT_PRIMARY }}>Teacher Controls</Text>

          <View style={{ height: 18 }} />

          {/* ── Quick actions grid (2×2 rows) ── */}
          {GRID_ROWS.map((row, r) => (
            <View key={r} style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              {row.map((action) => (
                <ActionCard key={action.screen} action={action} onPress={() => navigation.navigate(action.screen)} />
              ))}
            </View>
          ))}
        </View>

        {/* Spacer so the tab dock never covers content */}
        <View style={{ height: 140 }} />
      </ScrollView>
    </View>
  );
}
