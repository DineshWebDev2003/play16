import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
}

const BORDER_RADIUS = 28;
const GRID_RADIUS = 22;
const SECTION_GAP = 28;

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const ACCENT = '#F59E0B';

const ROLE_AVATAR = require('../../../assets/Avatar/tuitio-student.png');

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

// ─── Aurora Glass background (matches all V2 screens) ──────────────────────────
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

// ─── Glass action card for the operations grid ─────────────────────────────────
function ActionCard({ image, label, subtitle, tag, color, fullWidth, onPress }: {
  image: any;
  label: string;
  subtitle: string;
  tag: string;
  color: string;
  fullWidth?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={{
        width: fullWidth ? '100%' : '48%',
        marginBottom: 16,
        borderRadius: GRID_RADIUS,
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
          backgroundColor: color + '1F',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image source={image} style={{ width: 64, height: 64 }} resizeMode="contain" />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <Text numberOfLines={1} style={{ flex: 1, fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY }}>
          {label}
        </Text>
        <View style={{ backgroundColor: color + '1F', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, marginLeft: 6 }}>
          <Text style={{ fontSize: 8, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', color }}>
            {tag}
          </Text>
        </View>
      </View>
      <Text style={{ fontSize: 9, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: TEXT_MUTED, marginTop: 4 }}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

export default function TuitionStudentHomeScreenV2({ navigation }: Props) {
  const { user, fetchData, updateAvatar } = useAuth();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [homeworkCount, setHomeworkCount] = useState(0);
  const [todayAttendance, setTodayAttendance] = useState<string | null>(null);

  const loadHomeworkCount = useCallback(async () => {
    try {
      const res = await api.get('/homework');
      const d = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      const myBatchId = String((user as any)?.batch_id ?? '');
      const myUserId = String(user?.id ?? '');
      const mine = d.filter((h: any) => {
        const hBatch = String(h.batch_id ?? '');
        const hStudentIds = Array.isArray(h.student_ids) ? h.student_ids.map(String) : [];
        const noTarget = !h.batch_id && (!h.student_ids || h.student_ids.length === 0);
        return noTarget || (myBatchId && hBatch === myBatchId) || (myUserId && hStudentIds.includes(myUserId));
      });
      setHomeworkCount(mine.length);
    } catch {}
  }, [user]);

  const loadTodayAttendance = useCallback(async () => {
    if (!user) return;
    try {
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const res = await api.get(`/attendance?date=${today}`);
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      const mine = list.find((r: any) => r.student_id?.toString() === String(user.id) && r.date === today);
      setTodayAttendance(mine ? (mine.status || 'present') : null);
    } catch {}
  }, [user]);

  useEffect(() => {
    loadHomeworkCount();
    loadTodayAttendance();
  }, [loadHomeworkCount, loadTodayAttendance]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
      await loadHomeworkCount();
      await loadTodayAttendance();
    } catch (error) {
      console.error('Refresh Error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchData, loadHomeworkCount, loadTodayAttendance]);

  const attendanceMeta = useMemo(() => {
    if (todayAttendance === 'present') return { label: 'Present', color: '#10B981', icon: 'check-circle' };
    if (todayAttendance === 'late') return { label: 'Late', color: '#F59E0B', icon: 'clock-outline' };
    if (todayAttendance === 'absent') return { label: 'Absent', color: '#EF4444', icon: 'close-circle' };
    return { label: 'Not Marked', color: '#9CA3AF', icon: 'minus-circle' };
  }, [todayAttendance]);

  const gridRows = [
    [
      { image: require('../../../assets/icons/note-book.png'), label: 'Homework', screen: 'homework', color: '#8B5CF6', tag: 'Tasks', subtitle: 'View & submit assignments' },
      { image: require('../../../assets/icons/education.png'), label: 'Study Materials', screen: 'tuitionStudyMaterials', color: '#F97316', tag: 'Resources', subtitle: 'View class resources' },
    ],
    [
      { image: require('../../../assets/icons/exam-results.png'), label: 'My Progress', screen: 'tuitionMyProgress', color: '#10B981', tag: 'Track', subtitle: 'Track performance' },
      { image: require('../../../assets/icons/calendar.png'), label: 'Attendance', screen: 'attendance', color: '#F59E0B', tag: 'Report', subtitle: 'View attendance record' },
    ],
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#F59E0B"
            colors={['#F59E0B']}
          />
        }
      >
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

          {/* ── Learning Hub (hero card) ── */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('homework')}
            style={{ borderRadius: BORDER_RADIUS, overflow: 'hidden', backgroundColor: ACCENT + '1F' }}
          >
            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ backgroundColor: ACCENT + '1F', width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Image source={require('../../../assets/icons/note-book.png')} style={{ width: 26, height: 26 }} resizeMode="contain" />
                  </View>
                  <View>
                    <Text style={{ color: TEXT_PRIMARY, fontSize: 17, fontWeight: '700', letterSpacing: -0.5 }}>Learning Hub</Text>
                    <Text style={{ color: TEXT_MUTED, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 2 }}>My Tuition Dashboard</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: ACCENT + '1F', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100 }}>
                  <Text style={{ color: ACCENT, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {(user as any)?.batch_id ? `Batch ${(user as any)?.batch_id}` : 'Student'}
                  </Text>
                </View>
              </View>
              <View style={{ backgroundColor: 'rgba(247,249,246,0.9)', borderRadius: 18, padding: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  {[
                    { label: 'Homework', value: String(homeworkCount), image: require('../../../assets/icons/note-book.png') },
                    { label: attendanceMeta.label, value: todayAttendance ? '•' : '–', image: require('../../../assets/icons/calendar.png') },
                    { label: 'Student ID', value: String((user as any)?.student_id || user?.studentId || user?.id || '–'), image: require('../../../assets/icons/student.png') },
                  ].map((item) => (
                    <View key={item.label} style={{ alignItems: 'center', flex: 1 }}>
                      <View style={{ backgroundColor: ACCENT + '14', width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                        <Image source={item.image} style={{ width: 18, height: 18 }} resizeMode="contain" />
                      </View>
                      <Text style={{ color: TEXT_PRIMARY, fontSize: 14, fontWeight: '900' }} numberOfLines={1}>{item.value}</Text>
                      <Text style={{ color: TEXT_MUTED, fontSize: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 1 }}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
                <MaterialCommunityIcons name="arrow-right-circle" size={12} color={TEXT_MUTED} />
                <Text style={{ color: TEXT_MUTED, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 6 }}>Open Homework</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* ── Quick Actions ── */}
          <View style={{ paddingTop: SECTION_GAP }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: TEXT_PRIMARY }}>Quick Actions</Text>
              <View style={{ backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100 }}>
                <Text style={{ color: ACCENT, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Tuition</Text>
              </View>
            </View>

            {gridRows.map((row, r) => (
              <View key={r} style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                {row.map((action) => (
                  <ActionCard
                    key={action.label}
                    image={action.image}
                    label={action.label}
                    subtitle={action.subtitle}
                    tag={action.tag}
                    color={action.color}
                    onPress={() => navigation.navigate(action.screen)}
                  />
                ))}
              </View>
            ))}

            <ActionCard
              fullWidth
              image={require('../../../assets/icons/discussion (1).png')}
              label="Messages"
              subtitle="Chat with teachers & admin"
              tag="Chat"
              color="#EC4899"
              onPress={() => navigation.navigate('nannyChat')}
            />
          </View>
        </View>

        {/* Spacer so the tab dock never covers content */}
        <View style={{ height: 140 }} />
      </ScrollView>
    </View>
  );
}
