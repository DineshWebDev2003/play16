import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Image, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
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
const SECTION_GAP = 28;

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const ACCENT = '#F59E0B';

const ROLE_AVATAR = require('../../../assets/Avatar/Nanny-avatrt.png');

const EMERALD = ['#10B981', '#059669'] as [string, string];
const CYAN = ['#06B6D4', '#0891B2'] as [string, string];

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
function ActionCard({ image, label, subtitle, tag, color, onPress, fullWidth }: {
  image: any;
  label: string;
  subtitle: string;
  tag: string;
  color: string;
  onPress: () => void;
  fullWidth?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={{
        width: fullWidth ? '100%' : '48%',
        marginBottom: 16,
        borderRadius: 22,
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
        <Text numberOfLines={1} style={{ flex: 1, fontSize: 15, fontWeight: '700', color: TEXT_PRIMARY }}>
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

// ─── Stats grid used inside hero cards ─────────────────────────────────────────
function StatItem({ image, value, label, tint }: {
  image: any;
  value: string | number;
  label: string;
  tint: string;
}) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <View style={{ backgroundColor: tint + '14', width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
        <Image source={image} style={{ width: 16, height: 16 }} resizeMode="contain" />
      </View>
      <Text style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: '900' }} numberOfLines={1}>{value}</Text>
      <Text style={{ color: TEXT_MUTED, fontSize: 7, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 1 }}>{label}</Text>
    </View>
  );
}

export default function NannyHomeScreenV2({ navigation }: Props) {
  const { user, users, updateAvatar } = useAuth();
  const insets = useSafeAreaInsets();

  // In & Out
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [clockOutTime, setClockOutTime] = useState<string | null>(null);
  const [clockLoading, setClockLoading] = useState(false);

  // Attendance stats
  const [todayAttendance, setTodayAttendance] = useState<Record<string, string>>({});

  // Voice chat unread
  const [unreadTotal, setUnreadTotal] = useState(0);

  const [refreshing, setRefreshing] = useState(false);

  const branchStudents = useMemo(() => {
    return users
      .filter(u => u.role === 'student' && u.branch_id === user?.branch_id && u.status === 'active')
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users, user?.branch_id]);

  const fetchTodayAttendance = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.get(`/attendance?date=${today}&user_role=student`);
      const map: Record<string, string> = {};
      (res.data || []).forEach((r: any) => {
        map[String(r.student_id)] = r.status;
      });
      setTodayAttendance(map);
    } catch (err) {
      console.error('Fetch attendance error:', err);
    }
  }, []);

  const fetchOwnClock = useCallback(async () => {
    if (!user) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.get(`/attendance?student_id=${user.id}&date=${today}`);
      const record = (res.data || []).find((r: any) => r.user_role === 'nanny');
      if (record) {
        setClockInTime(record.in_time);
        setClockOutTime(record.out_time);
        setIsClockedIn(!!record.in_time && !record.out_time);
      } else {
        setClockInTime(null);
        setClockOutTime(null);
        setIsClockedIn(false);
      }
    } catch (err) {
      console.error('Fetch clock error:', err);
    }
  }, [user]);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await api.get('/voice-messages/conversations');
      const total = (res.data || []).reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0);
      setUnreadTotal(total);
    } catch (err) {
      console.error('Fetch unread error:', err);
    }
  }, []);

  const loadAll = useCallback(async () => {
    await Promise.all([fetchTodayAttendance(), fetchOwnClock(), fetchUnread()]);
  }, [fetchTodayAttendance, fetchOwnClock, fetchUnread]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadAll();
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  }, [loadAll]);

  const handleClockIn = async () => {
    if (!user) return;
    setClockLoading(true);
    try {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const today = now.toISOString().split('T')[0];
      await api.post('/attendance', {
        student_id: user.id,
        date: today,
        status: 'present',
        in_time: timeString,
        user_role: 'nanny',
      });
      setClockInTime(timeString);
      setIsClockedIn(true);
      Alert.alert('Clocked In', `Welcome on duty at ${timeString}`);
    } catch (err) {
      Alert.alert('Error', 'Failed to clock in. Please try again.');
    } finally {
      setClockLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!user) return;
    setClockLoading(true);
    try {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const today = now.toISOString().split('T')[0];
      await api.post('/attendance', {
        student_id: user.id,
        date: today,
        status: 'present',
        in_time: clockInTime,
        out_time: timeString,
        user_role: 'nanny',
      });
      setClockOutTime(timeString);
      setIsClockedIn(false);
      Alert.alert('Clocked Out', `Shift ended at ${timeString}`);
    } catch (err) {
      Alert.alert('Error', 'Failed to clock out.');
    } finally {
      setClockLoading(false);
    }
  };

  const todayPresent = useMemo(() => {
    return branchStudents.filter(s => todayAttendance[String(s.id)] === 'present').length;
  }, [branchStudents, todayAttendance]);

  const todayAbsent = useMemo(() => {
    return branchStudents.filter(s => todayAttendance[String(s.id)] === 'absent').length;
  }, [branchStudents, todayAttendance]);

  const dutyAccent = isClockedIn ? '#10B981' : '#06B6D4';

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" colors={['#F59E0B']} />}
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
                {user?.name?.split(' ')[0] || 'Nanny'}
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

          {/* ── Duty Status (hero counter card) ── */}
          <View style={{ borderRadius: BORDER_RADIUS, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', elevation: 6, shadowColor: '#000000', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } }}>
            <LinearGradient
              colors={isClockedIn ? EMERALD : CYAN}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 12 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                    <MaterialCommunityIcons name={isClockedIn ? 'logout' : 'login'} size={18} color="white" />
                  </View>
                  <View>
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: -0.5 }}>Duty Status</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 1 }}>Today's Shift</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 }}>
                  <Text style={{ color: 'white', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>
                    {isClockedIn ? 'On Duty' : (clockOutTime ? 'Ended' : 'Off Duty')}
                  </Text>
                </View>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  {[
                    { label: 'In', value: clockInTime || '--:--', icon: 'login', color: '#FCD34D' },
                    { label: 'Out', value: clockOutTime || '--:--', icon: 'logout', color: '#6EE7B7' },
                    { label: 'Kids', value: branchStudents.length, icon: 'account-group', color: '#93C5FD' },
                  ].map((item, i) => (
                    <View key={item.label} style={{ alignItems: 'center', flex: 1, borderRightWidth: i < 2 ? 1 : 0, borderRightColor: 'rgba(255,255,255,0.1)' }}>
                      <MaterialCommunityIcons name={item.icon as any} size={20} color="#FFFFFF" style={{ marginBottom: 4 }} />
                      <Text style={{ color: 'white', fontSize: 15, fontWeight: '900' }} numberOfLines={1}>{item.value}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginTop: 1 }}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <TouchableOpacity
                activeOpacity={0.9}
                disabled={clockLoading}
                onPress={isClockedIn ? handleClockOut : handleClockIn}
                style={{ marginTop: 10, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
              >
                {clockLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <MaterialCommunityIcons name={isClockedIn ? 'logout' : 'login'} size={18} color="white" />
                    <Text style={{ color: 'white', fontWeight: '900', fontSize: 14, marginLeft: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                      {isClockedIn ? 'Clock Out' : 'Clock In'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
                <MaterialCommunityIcons name="clipboard-clock-outline" size={90} color="white" />
              </View>
            </LinearGradient>
          </View>

          {/* ── Main Operations ── */}
          <View style={{ paddingTop: SECTION_GAP }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: TEXT_PRIMARY }}>Main Operations</Text>
              <View style={{ backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100 }}>
                <Text style={{ color: ACCENT, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Nanny Tools</Text>
              </View>
            </View>

            {/* Attendance */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('nannyAttendance')}
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
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ backgroundColor: '#10B981' + '1F', width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Image source={require('../../../assets/icons/exam-results.png')} style={{ width: 26, height: 26 }} resizeMode="contain" />
                  </View>
                  <View>
                    <Text style={{ color: TEXT_PRIMARY, fontSize: 17, fontWeight: '700', letterSpacing: -0.5 }}>Attendance</Text>
                    <Text style={{ color: TEXT_MUTED, fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 1 }}>Mark Students Today</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: '#10B981' + '1F', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 }}>
                  <Text style={{ color: '#10B981', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>Today</Text>
                </View>
              </View>
              <View style={{ backgroundColor: 'rgba(247,249,246,0.9)', borderRadius: 14, padding: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <StatItem image={require('../../../assets/icons/student.png')} value={todayPresent} label="Present" tint="#10B981" />
                  <StatItem image={require('../../../assets/icons/error.png')} value={todayAbsent} label="Absent" tint="#EF4444" />
                  <StatItem image={require('../../../assets/icons/team.png')} value={branchStudents.length} label="Total Kids" tint="#6366F1" />
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
                <MaterialCommunityIcons name="chevron-right" size={12} color={TEXT_MUTED} />
                <Text style={{ color: TEXT_MUTED, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 6 }}>Open Attendance</Text>
              </View>
            </TouchableOpacity>

            {/* Voice Chat */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('nannyChat')}
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
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ backgroundColor: '#EC4899' + '1F', width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Image source={require('../../../assets/icons/discussion (1).png')} style={{ width: 26, height: 26 }} resizeMode="contain" />
                  </View>
                  <View>
                    <Text style={{ color: TEXT_PRIMARY, fontSize: 17, fontWeight: '700', letterSpacing: -0.5 }}>Voice Chat</Text>
                    <Text style={{ color: TEXT_MUTED, fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 1 }}>Parents & Admin</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: '#EC4899' + '1F', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, flexDirection: 'row', alignItems: 'center' }}>
                  {unreadTotal > 0 ? (
                    <>
                      <MaterialCommunityIcons name="message-text" size={10} color="#EC4899" />
                      <Text style={{ fontSize: 10, fontWeight: '900', color: '#EC4899', marginLeft: 3 }}>{unreadTotal}</Text>
                    </>
                  ) : (
                    <Text style={{ fontSize: 9, fontWeight: '900', color: '#EC4899', textTransform: 'uppercase', letterSpacing: 1 }}>Open</Text>
                  )}
                </View>
              </View>
              <View style={{ backgroundColor: 'rgba(247,249,246,0.9)', borderRadius: 14, padding: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <StatItem image={require('../../../assets/icons/bell (1).png')} value={unreadTotal} label="Unread" tint="#EC4899" />
                  <StatItem image={require('../../../assets/icons/kindergarten.png')} value={branchStudents.length} label="Kids" tint="#8B5CF6" />
                  <StatItem image={require('../../../assets/icons/family.png')} value={branchStudents.length} label="Families" tint="#06B6D4" />
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
                <MaterialCommunityIcons name="chevron-right" size={12} color={TEXT_MUTED} />
                <Text style={{ color: TEXT_MUTED, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 6 }}>Open Chat</Text>
              </View>
            </TouchableOpacity>

            {/* Grid */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <ActionCard
                image={require('../../../assets/icons/team.png')}
                label="Alumni"
                subtitle="View Disabled Members"
                tag="Alumni"
                color="#7C3AED"
                onPress={() => navigation.navigate('alumni')}
              />
              <ActionCard
                image={require('../../../assets/icons/player.png')}
                label="Kids Feed"
                subtitle="Moments & Highlights"
                tag="Feed"
                color="#F59E0B"
                onPress={() => navigation.navigate('activityFeed')}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <ActionCard
                image={require('../../../assets/icons/customer.png')}
                label="Profile"
                subtitle="Account & Settings"
                tag="Account"
                color="#6366F1"
                onPress={() => navigation.navigate('account')}
              />
              <ActionCard
                image={require('../../../assets/icons/calendar.png')}
                label="Schedule"
                subtitle="Daily Routine Plan"
                tag="Plan"
                color="#06B6D4"
                onPress={() => navigation.navigate('nannyAttendance')}
              />
            </View>
          </View>
        </View>

        {/* Bottom spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
