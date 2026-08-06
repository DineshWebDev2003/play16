import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

const GRID_ROWS: { label: string; screen: string; image: any; color: string; tag: string; fullWidth?: boolean }[][] = [
  [
    { label: 'Live Monitoring', screen: 'liveCamera', image: require('../../../assets/icons/cctv-camera.png'), color: '#EF4444', tag: 'Live' },
    { label: 'Attendance', screen: 'attendanceSelection', image: require('../../../assets/icons/exam-results.png'), color: '#14B8A6', tag: 'Register' },
  ],
  [
    { label: 'Student List', screen: 'studentList', image: require('../../../assets/icons/student.png'), color: '#3B82F6', tag: 'Database' },
    { label: 'Staff Logs', screen: 'teacherAttendanceReport', image: require('../../../assets/icons/teacher.png'), color: '#4F46E5', tag: 'Stats' },
  ],
  [
    { label: 'Tuition Console', screen: 'tuitionConsole', image: require('../../../assets/icons/education.png'), color: '#8B5CF6', tag: 'Tuition', fullWidth: true },
  ],
  [
    { label: 'User Add', screen: 'userMange', image: require('../../../assets/icons/team.png'), color: '#F59E0B', tag: 'New' },
    { label: 'Assign Fee', screen: 'feesManagement', image: require('../../../assets/icons/maths.png'), color: '#DB2777', tag: 'Fees' },
  ],
  [
    { label: 'Finances', screen: 'incomeExpense', image: require('../../../assets/icons/wallet.png'), color: '#059669', tag: 'Budget' },
    { label: 'Broadcast', screen: 'announcements', image: require('../../../assets/icons/megaphone.png'), color: '#EF4444', tag: 'Alerts' },
  ],
  [
    { label: 'Kids Activity', screen: 'activityFeed', image: require('../../../assets/icons/player.png'), color: '#F59E0B', tag: 'Moments' },
    { label: 'Post Activity', screen: 'postActivity', image: require('../../../assets/icons/painting.png'), color: '#D97706', tag: 'Share' },
  ],
  [
    { label: 'Timetable', screen: 'timetable', image: require('../../../assets/icons/calendar.png'), color: '#6366F1', tag: 'Plans' },
    { label: 'Backup', screen: 'backup', image: require('../../../assets/icons/database.png'), color: '#14B8A6', tag: 'Vault' },
  ],
  [
    { label: 'Messages', screen: 'nannyChat', image: require('../../../assets/icons/discussion (1).png'), color: '#06B6D4', tag: 'Chat', fullWidth: true },
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
        <Text numberOfLines={1} style={{ flex: 1, fontSize: 14, fontWeight: '700', color: '#1F2D28' }}>
          {action.label}
        </Text>
        <View style={{ backgroundColor: tintBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, marginLeft: 6 }}>
          <Text style={{ fontSize: 8, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', color: action.color }}>
            {action.tag}
          </Text>
        </View>
      </View>
      <Text style={{ fontSize: 9, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: '#7A8A82', marginTop: 4 }}>
        Tap to open
      </Text>
    </TouchableOpacity>
  );
}

export default function AdminQuickActionScreenV2({ navigation }: Props) {
  const { user } = useAuth();
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
          {/* ── Header ── */}
          <View style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '400', color: '#7A8A82' }}>Admin Access</Text>
              <Text numberOfLines={1} style={{ fontSize: 20, fontWeight: '700', color: '#1F2D28', marginTop: 2 }}>
                Quick Actions
              </Text>
            </View>
            <View
              style={{
                width: 54,
                height: 54,
                borderRadius: 27,
                backgroundColor: 'rgba(255,255,255,0.92)',
                borderWidth: 2,
                borderColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <Image
                  source={require('../../../assets/Avatar/school-admin.png')}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              )}
            </View>
          </View>

          <View style={{ height: SECTION_GAP }} />

          {/* ── Section title ── */}
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#1F2D28' }}>Admin Controls</Text>

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
