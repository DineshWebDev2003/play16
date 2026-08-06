import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import GlassDropdown from './GlassDropdown';

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

const ACTIONS: { label: string; screen: string; image: any; color: string; tag: string }[] = [
  { label: 'Post Homework', screen: 'postHomework', image: require('../../../assets/icons/note-book.png'), color: '#8B5CF6', tag: 'Assign' },
  { label: 'Post Progress', screen: 'tuitionPostProgress', image: require('../../../assets/icons/exam-results.png'), color: '#10B981', tag: 'Progress' },
  { label: 'Take Attendance', screen: 'tuitionAttendance', image: require('../../../assets/icons/team.png'), color: '#F59E0B', tag: 'Attend' },
  { label: 'View Submissions', screen: 'viewSubmissions', image: require('../../../assets/icons/painting.png'), color: '#3B82F6', tag: 'Review' },
  { label: 'Messages', screen: 'nannyChat', image: require('../../../assets/icons/megaphone.png'), color: '#06B6D4', tag: 'Chat' },
  { label: 'Manage Users', screen: 'manageTuitionUsers', image: require('../../../assets/icons/teacher.png'), color: '#14B8A6', tag: 'Users' },
  { label: 'Student List', screen: 'tuitionStudentList', image: require('../../../assets/icons/student.png'), color: '#0EA5E9', tag: 'Students' },
  { label: 'Study Materials', screen: 'tuitionStudyMaterials', image: require('../../../assets/icons/database.png'), color: '#F97316', tag: 'Resources' },
  { label: 'Tests & Marks', screen: 'tuitionPostProgress', image: require('../../../assets/icons/maths.png'), color: '#A855F7', tag: 'Assess' },
];

function ActionCard({ action, onPress }: { action: typeof ACTIONS[0]; onPress: () => void }) {
  const tintBg = action.color + '1F';
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={{
        width: '100%',
        marginBottom: 16,
        borderRadius: BORDER_RADIUS,
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        padding: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 84,
            height: 84,
            borderRadius: 18,
            backgroundColor: tintBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image source={action.image} style={{ width: 64, height: 64 }} resizeMode="contain" />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text numberOfLines={1} style={{ flex: 1, fontSize: 16, fontWeight: '700', color: '#1F2D28' }}>
              {action.label}
            </Text>
            <View style={{ backgroundColor: tintBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, marginLeft: 6 }}>
              <Text style={{ fontSize: 8, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', color: action.color }}>
                {action.tag}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 10, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: '#7A8A82', marginTop: 6 }}>
            Tap to open
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: action.color, letterSpacing: 0.3 }}>Open</Text>
            <Text style={{ fontSize: 14, color: action.color, marginLeft: 4 }}>→</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function StatCard({ icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  const tintBg = color + '1F';
  return (
    <View
      style={{
        flex: 1,
        borderRadius: BORDER_RADIUS,
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        padding: 16,
      }}
    >
      <View style={{ height: 72, borderRadius: 18, backgroundColor: tintBg, alignItems: 'center', justifyContent: 'center' }}>
        <Image source={icon} style={{ width: 52, height: 52 }} resizeMode="contain" />
      </View>
      <Text style={{ fontSize: 30, fontWeight: '800', color: '#1F2D28', marginTop: 12, letterSpacing: -1 }}>
        {value}
      </Text>
      <Text style={{ fontSize: 9, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', color: '#7A8A82', marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

export default function TuitionConsoleScreenV2({ navigation }: Props) {
  const { user, users } = useAuth();
  const insets = useSafeAreaInsets();
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  const branchUsers = useMemo(() => {
    if (user?.role !== 'master_admin') return users;
    if (!selectedBranchId) return users;
    return users.filter(u => u.branch_id === selectedBranchId);
  }, [users, selectedBranchId, user?.role]);

  const tuitionTeacherCount = useMemo(() => branchUsers.filter(u => u.role === 'tuition_teacher' && u.status === 'active').length, [branchUsers]);
  const tuitionStudentCount = useMemo(() => branchUsers.filter(u => u.role === 'tuition_student' && u.status === 'active').length, [branchUsers]);

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
        <RadialGlow
          size={420}
          color="#DDFBFF"
          opacity={0.25}
          style={{ top: -140, left: SCREEN_WIDTH / 2 - 210 }}
        />
        <RadialGlow size={520} color="#F8FFD8" opacity={0.24} style={{ bottom: -180, left: -180 }} />
        <RadialGlow
          size={450}
          color="#EAF5FF"
          opacity={0.18}
          style={{ top: SCREEN_HEIGHT * 0.4 - 225, right: -180 }}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={{ paddingTop: Math.max(insets.top, 56), paddingHorizontal: 20 }}>
          {/* ── Header ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.goBack()}
              style={{
                width: 44,
                height: 44,
                borderRadius: 16,
                backgroundColor: 'rgba(255,255,255,0.92)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.6)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#1F2D28' }}>‹</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontSize: 12, fontWeight: '400', color: '#7A8A82' }}>Tuition Center</Text>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#1F2D28', marginTop: 2, letterSpacing: -0.5 }}>
                Console
              </Text>
            </View>
            <View
              style={{
                width: 54,
                height: 54,
                borderRadius: 18,
                backgroundColor: 'rgba(255,255,255,0.92)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.6)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Image
                source={require('../../../assets/icons/education.png')}
                style={{ width: 46, height: 46 }}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={{ height: SECTION_GAP }} />

          {/* ── Branch dropdown (master admin only) ── */}
          {user?.role === 'master_admin' && (
            <View style={{ marginBottom: SECTION_GAP }}>
              <GlassDropdown selectedBranchId={selectedBranchId} onSelect={setSelectedBranchId} />
            </View>
          )}

          {/* ── Stats ── */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <StatCard
                icon={require('../../../assets/icons/teacher.png')}
                label="Tuition Teachers"
                value={tuitionTeacherCount}
                color="#F59E0B"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <StatCard
                icon={require('../../../assets/icons/student.png')}
                label="Tuition Students"
                value={tuitionStudentCount}
                color="#EC4899"
              />
            </View>
          </View>

          <View style={{ height: SECTION_GAP }} />

          {/* ── Section title ── */}
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#1F2D28' }}>Tuition Management</Text>

          <View style={{ height: 18 }} />

          {/* ── Action list (full width cards) ── */}
          {ACTIONS.map((action) => (
            <ActionCard key={action.label} action={action} onPress={() => navigation.navigate(action.screen)} />
          ))}

          {/* ── Info note ── */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: BORDER_RADIUS,
              backgroundColor: 'rgba(255,255,255,0.92)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.6)',
              padding: 16,
              marginBottom: 16,
            }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(139,92,246,0.14)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 16, color: '#8B5CF6' }}>✦</Text>
            </View>
            <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: '#4A5B53', marginLeft: 12, lineHeight: 18 }}>
              Full tuition management access — post homework, track progress, take attendance, and communicate with parents.
            </Text>
          </View>
        </View>

        {/* Spacer so the tab dock never covers content */}
        <View style={{ height: 140 }} />
      </ScrollView>
    </View>
  );
}
