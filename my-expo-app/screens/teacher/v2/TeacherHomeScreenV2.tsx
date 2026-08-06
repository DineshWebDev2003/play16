import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Image, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import PremiumPopup from '../../../components/PremiumPopup';
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

export default function TeacherHomeScreenV2({ navigation }: Props) {
  const { user, announcements, updateAvatar, users } = useAuth();
  const insets = useSafeAreaInsets();

  // Filter announcements for teachers
  const teacherNotices = announcements.filter(a => a.target === 'all' || a.target === 'teacher');

  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [clockOutTime, setClockOutTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [studentStats, setStudentStats] = useState({ total: 0, present: 0 });
  const [todaySchedule, setTodaySchedule] = useState<any>(null);
  const [selectedNotice, setSelectedNotice] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStudentStats = useCallback(async () => {
    try {
      const response = await api.get('/attendance');
      const today = new Date().toISOString().split('T')[0];
      const todayRecords = response.data.filter((r: any) => r.date === today && r.user_role === 'student');
      const presentCount = todayRecords.filter((r: any) => r.status === 'present').length;

      const totalStudents = users.filter(u => u.role === 'student' || u.role === 'tuition_student').length;
      setStudentStats({
        total: totalStudents || 0,
        present: presentCount
      });
    } catch (err) {
      console.error('Fetch Stats Error:', err);
    }
  }, [users]);

  const fetchTimetable = useCallback(async () => {
    try {
      const response = await api.get('/timetable');
      const todayNum = new Date().getDay();
      const dayIndex = todayNum === 0 ? 6 : todayNum - 1;
      const filtered = response.data.filter((s: any) => s.day === dayIndex);

      if (filtered.length > 0) {
        // Function to convert "HH:MM AM/PM" to total minutes for comparison
        const timeToMinutes = (timeStr: string) => {
          const [time, period] = timeStr.split(' ');
          let [hours, minutes] = time.split(':').map(Number);
          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;
          return hours * 60 + minutes;
        };

        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();

        // Sort by time
        const sorted = filtered.sort((a: any, b: any) => timeToMinutes(a.time) - timeToMinutes(b.time));

        // Find first session that hasn't finished yet (assuming 1 hour duration or just start time)
        const currentOrNext = sorted.find((s: any) => timeToMinutes(s.time) >= nowMinutes - 30); // 30 min grace period

        setTodaySchedule(currentOrNext || null);
      } else {
        setTodaySchedule(null);
      }
    } catch (err) {
      console.error('Fetch Timetable Error:', err);
    }
  }, []);

  const fetchTodayAttendance = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get(`/attendance?student_id=${user.id}&date=${today}`);
      if (response.data && response.data.length > 0) {
        const record = response.data.find((r: any) => r.user_role === 'teacher' || !r.user_role); // fallback
        if (record) {
          setClockInTime(record.in_time);
          setClockOutTime(record.out_time);
          // Only show as clocked in if there is an in_time but NO out_time
          setIsClockedIn(!!record.in_time && !record.out_time);
        } else {
          setClockInTime(null);
          setClockOutTime(null);
          setIsClockedIn(false);
        }
      }
      await Promise.all([
        fetchStudentStats(),
        fetchTimetable()
      ]);
    } catch (err) {
      console.error('Fetch Attendance Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchStudentStats]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchTodayAttendance();
    } catch (err) {
      console.error('Refresh Error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchTodayAttendance]);

  useEffect(() => {
    fetchTodayAttendance();
  }, [fetchTodayAttendance]);

  const handleClockIn = async () => {
    if (!user) return;
    try {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const today = now.toISOString().split('T')[0];

      const payload = {
        student_id: user.id,
        date: today,
        status: 'present',
        in_time: timeString,
        user_role: 'teacher',
        student_name: user.name
      };

      await api.post('/attendance', payload);
      setClockInTime(timeString);
      setIsClockedIn(true);
      Alert.alert('Success 🎉', `You clocked in at ${timeString}`);
    } catch (err) {
      Alert.alert('Error', 'Failed to clock in. Please try again.');
    }
  };

  const handleClockOut = async () => {
    if (!user) return;
    try {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const today = now.toISOString().split('T')[0];

      const payload = {
        student_id: user.id,
        date: today,
        status: 'present',
        in_time: clockInTime,
        out_time: timeString,
        user_role: 'teacher',
        student_name: user.name
      };

      await api.post('/attendance', payload);
      setClockOutTime(timeString);
      setIsClockedIn(false);
      Alert.alert('Done! 👋', `You clocked out at ${timeString}. Great job today!`);
    } catch (err) {
      Alert.alert('Error', 'Failed to clock out.');
    }
  };

  const dutyAccent = '#14B8A6';
  const pulseAccent = '#6366F1';

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#F59E0B" colors={['#F59E0B']} />}
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
                {user?.name?.split(' ')[0] || 'Teacher'}
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

          {/* ── Teaching Pulse (hero card) ── */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('timetable')}
            style={{
              borderRadius: BORDER_RADIUS,
              overflow: 'hidden',
              backgroundColor: pulseAccent + '1F',
            }}
          >
            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ backgroundColor: pulseAccent + '1F', width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                    <Image source={require('../../../assets/icons/calendar.png')} style={{ width: 24, height: 24 }} resizeMode="contain" />
                  </View>
                  <View>
                    <Text style={{ color: TEXT_PRIMARY, fontSize: 15, fontWeight: '700', letterSpacing: -0.5 }}>Teaching Pulse</Text>
                    <Text style={{ color: TEXT_MUTED, fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 1 }}>Today's Schedule</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: pulseAccent + '1F', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 }}>
                  <Text style={{ color: pulseAccent, fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>{todaySchedule ? todaySchedule.time : 'Standby'}</Text>
                </View>
              </View>
              <View style={{ backgroundColor: 'rgba(247,249,246,0.9)', borderRadius: 14, padding: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  {[
                    { label: 'Kids', value: studentStats.total, image: require('../../../assets/icons/student.png') },
                    { label: 'Present', value: studentStats.present, image: require('../../../assets/icons/exam-results.png') },
                    { label: 'Next', value: todaySchedule ? todaySchedule.activity : 'Standby', image: require('../../../assets/icons/note-book.png') },
                  ].map((item) => (
                    <View key={item.label} style={{ alignItems: 'center', flex: 1 }}>
                      <View style={{ backgroundColor: pulseAccent + '14', width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                        <Image source={item.image} style={{ width: 16, height: 16 }} resizeMode="contain" />
                      </View>
                      <Text style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: '900' }} numberOfLines={1}>{item.value}</Text>
                      <Text style={{ color: TEXT_MUTED, fontSize: 7, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 1 }}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
                <MaterialCommunityIcons name="chevron-right" size={12} color={TEXT_MUTED} />
                <Text style={{ color: TEXT_MUTED, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 6 }}>View Timetable</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* ── Main Operations ── */}
          <View style={{ paddingTop: SECTION_GAP }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: TEXT_PRIMARY }}>Main Operations</Text>
              <View style={{ backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100 }}>
                <Text style={{ color: ACCENT, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Faculty Tools</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <ActionCard
                image={require('../../../assets/icons/student.png')}
                label="My Class"
                subtitle="Total Enrolled"
                tag="Class"
                color="#F59E0B"
                onPress={() => navigation.navigate('studentList')}
              />
              <ActionCard
                image={require('../../../assets/icons/exam-results.png')}
                label="Attendance"
                subtitle="Daily Register"
                tag="Register"
                color="#3B82F6"
                onPress={() => navigation.navigate('takeAttendance')}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <ActionCard
                image={require('../../../assets/icons/painting.png')}
                label="Post Activity"
                subtitle="Share Moments"
                tag="Share"
                color="#DB2777"
                onPress={() => navigation.navigate('postActivity')}
              />
              <ActionCard
                image={require('../../../assets/icons/player.png')}
                label="Kids Feed"
                subtitle="Moments & Highlights"
                tag="Feed"
                color="#8B5CF6"
                onPress={() => navigation.navigate('activityFeed')}
              />
            </View>
          </View>

          {/* ── Duty Log (full-width card) ── */}
          <View style={{ paddingTop: SECTION_GAP }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: TEXT_PRIMARY }}>Duty Log</Text>
              <View style={{ backgroundColor: 'rgba(20,184,166,0.12)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100 }}>
                <Text style={{ color: dutyAccent, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Official Entry</Text>
              </View>
            </View>

            <View
              style={{
                borderRadius: BORDER_RADIUS,
                overflow: 'hidden',
                backgroundColor: dutyAccent + '1F',
              }}
            >
              <View style={{ padding: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ backgroundColor: dutyAccent + '1F', width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Image source={require('../../../assets/icons/note-book.png')} style={{ width: 26, height: 26 }} resizeMode="contain" />
                    </View>
                    <View>
                      <Text style={{ color: TEXT_PRIMARY, fontSize: 17, fontWeight: '700', letterSpacing: -0.5 }}>Duty Status</Text>
                      <Text style={{ color: TEXT_MUTED, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 2 }}>
                        {isLoading ? 'Checking your duty...' : !clockInTime ? 'Start your day with clock in' : !clockOutTime ? `Clocked in at ${clockInTime}` : 'Duty completed for today'}
                      </Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: dutyAccent + '1F', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100 }}>
                    <Text style={{ color: dutyAccent, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>
                      {!clockInTime ? 'Not In' : !clockOutTime ? 'On Duty' : 'Done'}
                    </Text>
                  </View>
                </View>
                <View style={{ backgroundColor: 'rgba(247,249,246,0.9)', borderRadius: 18, padding: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    {[
                      { label: 'Clock In', value: clockInTime || '--:--' },
                      { label: 'Clock Out', value: clockOutTime || '--:--' },
                    ].map((item, i) => (
                      <View key={item.label} style={{ alignItems: 'center', flex: 1 }}>
                        <View style={{ backgroundColor: dutyAccent + '14', width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                          <MaterialCommunityIcons name={i === 0 ? 'login-variant' : 'logout-variant'} size={18} color={dutyAccent} />
                        </View>
                        <Text style={{ color: TEXT_PRIMARY, fontSize: 14, fontWeight: '900' }} numberOfLines={1}>{item.value}</Text>
                        <Text style={{ color: TEXT_MUTED, fontSize: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 1 }}>{item.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                {isLoading ? (
                  <ActivityIndicator size="small" color={dutyAccent} style={{ marginTop: 16 }} />
                ) : (
                  <TouchableOpacity
                    onPress={isClockedIn ? handleClockOut : handleClockIn}
                    activeOpacity={0.9}
                    style={{ marginTop: 14, backgroundColor: dutyAccent, borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                  >
                    <MaterialCommunityIcons name={isClockedIn ? 'logout-variant' : 'login-variant'} size={16} color="white" />
                    <Text style={{ color: 'white', fontWeight: '800', fontSize: 12, marginLeft: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                      {!clockInTime ? 'Start Duty' : !clockOutTime ? 'End Duty' : 'Duty Logged'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* ── Faculty Notices (full width) ── */}
        <View style={{ paddingTop: SECTION_GAP, paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: TEXT_PRIMARY }}>Faculty Notices</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('announcements')}>
              <Text style={{ fontSize: 13, fontWeight: '400', color: TEXT_SECONDARY }}>See All</Text>
            </TouchableOpacity>
          </View>

          {teacherNotices.length > 0 ? (
            teacherNotices.slice(0, 5).map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.9}
                onPress={() => setSelectedNotice(item)}
                style={{
                  borderRadius: BORDER_RADIUS,
                  overflow: 'hidden',
                  backgroundColor: 'rgba(255,255,255,0.92)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.6)',
                  marginBottom: 14,
                }}
              >
                {item.image ? (
                  <Image source={{ uri: item.image }} style={{ width: '100%', height: 150 }} resizeMode="cover" />
                ) : (
                  <View style={{ height: 70, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(139,92,246,0.1)' }}>
                    <Image source={require('../../../assets/icons/megaphone.png')} style={{ width: 44, height: 44 }} resizeMode="contain" />
                  </View>
                )}
                <View style={{ padding: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="calendar-edit" size={10} color="#F59E0B" />
                      <Text style={{ color: '#F59E0B', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 4 }}>{item.date}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '700', letterSpacing: -0.3, color: TEXT_PRIMARY }} numberOfLines={2}>{item.title}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <MaterialCommunityIcons name="account-circle-outline" size={14} color="#A5B3AB" />
                    <Text style={{ color: TEXT_MUTED, fontSize: 10, fontWeight: '700', marginLeft: 5 }}>
                      {item.author || 'School Admin'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View
              style={{
                borderRadius: BORDER_RADIUS,
                backgroundColor: 'rgba(255,255,255,0.92)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.6)',
                padding: 28,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View style={{ backgroundColor: 'rgba(139,92,246,0.1)', width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Image source={require('../../../assets/icons/megaphone.png')} style={{ width: 40, height: 40 }} resizeMode="contain" />
              </View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: TEXT_PRIMARY }}>All Quiet for Now</Text>
              <Text style={{ fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5, color: TEXT_MUTED, marginTop: 4 }}>No Active Notices</Text>
            </View>
          )}
        </View>

        {/* Spacer so the tab dock never covers content */}
        <View style={{ height: 140 }} />
      </ScrollView>

      <PremiumPopup
        visible={!!selectedNotice}
        onClose={() => setSelectedNotice(null)}
        title={selectedNotice?.title || ''}
        message={selectedNotice?.content}
        type="info"
        icon="bullhorn"
      >
        {selectedNotice?.date && (
          <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)', marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="calendar-clock" size={12} color="#F59E0B" />
            <Text style={{ color: '#F59E0B', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 6 }}>{selectedNotice.date}</Text>
          </View>
        )}
        {selectedNotice?.image && (
          <Image
            source={{ uri: selectedNotice.image }}
            style={{ width: '100%', height: 200, borderRadius: 24, marginBottom: 16 }}
            resizeMode="cover"
          />
        )}
      </PremiumPopup>
    </View>
  );
}
