import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, RefreshControl } from 'react-native';
import PremiumPopup from '../../components/PremiumPopup';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface StudentHomeScreenProps {
  navigation: NavigationProps;
}

const AMBER = ['#F59E0B', '#D97706'] as [string, string];
const AMBER_DARK = ['#92400E', '#78350F'] as [string, string];
const BLUE = ['#3B82F6', '#2563EB'] as [string, string];
const BLUE_DARK = ['#1e40af', '#1e1b4b'] as [string, string];
const EMERALD = ['#10B981', '#059669'] as [string, string];
const EMERALD_DARK = ['#064e3b', '#022c22'] as [string, string];
const PINK = ['#EC4899', '#DB2777'] as [string, string];
const PINK_DARK = ['#831843', '#500724'] as [string, string];
const VIOLET = ['#8B5CF6', '#7C3AED'] as [string, string];
const VIOLET_DARK = ['#5b21b6', '#2e1065'] as [string, string];
const RED = ['#EF4444', '#DC2626'] as [string, string];
const RED_DARK = ['#7f1d1d', '#450a0a'] as [string, string];

export default function StudentHomeScreen({ navigation }: StudentHomeScreenProps) {
  const { user, announcements, updateAvatar, fees: allFees, refreshFees } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = theme === 'dark';

  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [selectedNotice, setSelectedNotice] = useState<any>(null);
  const [todaySchedule, setTodaySchedule] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const myFees = useMemo(() => {
    if (!user || user.role !== 'student') return [];
    const dbId = user.id?.toString();
    const schoolId = user.studentId?.toString();
    return allFees.filter(f =>
      (f.student_id?.toString() === dbId || f.student_id?.toString() === schoolId)
    );
  }, [allFees, user]);

  const { currentMonthStr, currentMonthYearCode, academicYear } = useMemo(() => {
    const d = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthStr = months[d.getMonth()];
    const year = d.getFullYear();
    const acadYearStart = d.getMonth() >= 5 ? year : year - 1;
    const acadYearEnd = acadYearStart + 1;
    return {
      currentMonthStr: `${monthStr} ${year}`,
      currentMonthYearCode: `${year}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      academicYear: `${acadYearStart}-${acadYearEnd.toString().slice(-2)}`
    };
  }, []);

  const financialStatus = useMemo(() => {
    if (!user || user.role !== 'student') return null;
    const dbId = user.id?.toString();
    const schoolId = user.studentId?.toString();
    const todayStr = new Date().toISOString().split('T')[0];
    const studentFees = allFees.filter(f =>
      (f.student_id?.toString() === dbId || f.student_id?.toString() === schoolId)
    );
    const unpaidFees = studentFees.filter(f => f.status === 'unpaid');
    const currentMonthPaid = studentFees.find(f =>
      f.date?.includes(currentMonthYearCode) && f.status === 'paid'
    );
    let hasAnyOverdue = unpaidFees.some(f => f.due_date && f.due_date < todayStr);
    if (!hasAnyOverdue && !currentMonthPaid && !studentFees.some(f => f.date?.includes(currentMonthYearCode))) {
      const dueDayNum = parseInt(user.fee_due_day || '5');
      if (new Date().getDate() > dueDayNum) {
        hasAnyOverdue = true;
      }
    }
    const isPending = unpaidFees.length > 0 || (!currentMonthPaid && (user.fees && parseInt(user.fees) > 0));
    const isPaid = !isPending && currentMonthPaid;
    const sortedUnpaid = [...unpaidFees].sort((a, b) => (a.due_date || a.date).localeCompare(b.due_date || b.date));
    const oldestFee = sortedUnpaid[0];
    return {
      isPaid,
      paidAt: currentMonthPaid?.paid_at,
      isOverdue: hasAnyOverdue,
      isPending,
      dueDay: oldestFee?.due_date ? parseInt(oldestFee.due_date.split('-')[2]) : parseInt(user.fee_due_day || '5'),
      exists: isPending || isPaid,
      title: hasAnyOverdue ? 'Overdue Balance' : (isPending ? 'Monthly Fee' : 'Current Month')
    };
  }, [allFees, user, currentMonthYearCode]);

  const feeBreakdown = useMemo(() => {
    if (!user) return { total: 0, overdue: 0, current: 0 };
    const todayStr = new Date().toISOString().split('T')[0];
    const overdueAmount = myFees
      .filter(f => f.status === 'unpaid' && f.due_date && f.due_date < todayStr)
      .reduce((sum, f) => sum + (f.amount || 0), 0);
    const currentAmountDb = myFees
      .filter(f => f.status === 'unpaid' && (!f.due_date || f.due_date >= todayStr))
      .reduce((sum, f) => sum + (f.amount || 0), 0);
    const currentMonthPaid = myFees.find(f => f.date?.includes(currentMonthYearCode) && f.status === 'paid');
    const currentMonthInDb = myFees.find(f => f.date?.includes(currentMonthYearCode));
    let extra = 0;
    if (!currentMonthInDb && !currentMonthPaid && user.fees && parseInt(user.fees) > 0) {
      extra = parseInt(user.fees);
    }
    const totalCurrent = currentAmountDb + extra;
    return { total: overdueAmount + totalCurrent, overdue: overdueAmount, current: totalCurrent };
  }, [myFees, user, currentMonthYearCode]);

  const fetchTimetable = useCallback(async () => {
    try {
      const response = await api.get('/timetable');
      const todayNum = new Date().getDay();
      const dayIndex = todayNum === 0 ? 6 : todayNum - 1;
      const data = response.data?.data || (Array.isArray(response.data) ? response.data : []);
      const filtered = data.filter((s: any) => s.day === dayIndex);
      if (filtered.length > 0) {
        const timeToMinutes = (timeStr: string) => {
          const [time, period] = timeStr.split(' ');
          let [hours, minutes] = time.split(':').map(Number);
          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;
          return hours * 60 + minutes;
        };
        const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
        const sorted = filtered.sort((a: any, b: any) => timeToMinutes(a.time) - timeToMinutes(b.time));
        const currentOrNext = sorted.find((s: any) => timeToMinutes(s.time) >= nowMinutes - 30);
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
    setAttendanceLoading(true);
    try {
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const studentUid = user.id.toString();
      const response = await api.get(`/attendance?date=${today}`);
      if (response.data && response.data.length > 0) {
        const myRecord = response.data.find((r: any) =>
          r.student_id?.toString() === studentUid &&
          r.date === today
        );
        setTodayAttendance(myRecord || null);
      } else {
        setTodayAttendance(null);
      }
    } catch (err) {
      console.error('Fetch Attendance Error:', err);
    } finally {
      setAttendanceLoading(false);
    }
  }, [user]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchTodayAttendance(), fetchTimetable(), refreshFees()]);
    } catch (err) {
      console.error('Refresh Error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchTodayAttendance, fetchTimetable, refreshFees]);

  useEffect(() => {
    fetchTodayAttendance();
    fetchTimetable();
    refreshFees();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [fetchTodayAttendance, fetchTimetable, refreshFees]);

  const studentNotices = announcements.filter(a => a.target === 'all' || a.target === 'student');

  const handleQuickAction = (screen: string | null) => {
    if (screen) {
      navigation.navigate(screen as any);
    } else {
      Alert.alert('Coming Soon', 'This feature will be available shortly! 🎨');
    }
  };

  const timeStr = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFFFFF' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#F59E0B']}
            tintColor="#F59E0B"
            progressBackgroundColor={isDark ? '#1c1c14' : '#FFFFFF'}
          />
        }
      >
        <View style={{ paddingTop: Math.max(insets.top, 50), paddingHorizontal: 24, paddingBottom: 24 }}>

          {/* ── Modern Header ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: isDark ? '#D1D5DB' : '#6B7280' }}>
                TN HAPPYKIDS
              </Text>
              <Text style={{ fontSize: 30, fontWeight: '900', letterSpacing: -0.5, marginTop: 4, color: isDark ? '#FFFFFF' : '#111827' }} numberOfLines={1}>
                {user?.name?.split(' ')[0] || 'Explorer'}
              </Text>
              <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100, marginTop: 12, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.1)' }}>
                <Text style={{ color: '#F59E0B', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Student Console</Text>
              </View>
            </View>
            <TouchableOpacity activeOpacity={0.85} onPress={updateAvatar}
              style={{ backgroundColor: '#FDE047', width: 80, height: 80, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FFFFFF', transform: [{ rotate: '3deg' }], overflow: 'hidden' }}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <MaterialCommunityIcons name="face-man-shimmer-outline" size={36} color="#92400E" />
              )}
              <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: '#7C3AED', padding: 4, borderRadius: 10, borderWidth: 2, borderColor: '#FFFFFF' }}>
                <MaterialCommunityIcons name="camera" size={12} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Today's Journey (hero counter card) ── */}
          <View style={{ paddingVertical: 8 }}>
            <View style={{ borderRadius: 16, overflow: 'hidden', elevation: 15 }}>
              <LinearGradient
                colors={todayAttendance?.in_time ? (isDark ? EMERALD_DARK : EMERALD) : (isDark ? AMBER_DARK : AMBER)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 12 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                      <MaterialCommunityIcons name={todayAttendance?.in_time ? 'school' : 'bus-clock'} size={18} color="white" />
                    </View>
                    <View>
                      <Text style={{ color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: -0.5 }}>Today's Journey</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 1 }}>{dateStr} · {timeStr}</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 }}>
                    <Text style={{ color: 'white', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>
                      {todayAttendance?.in_time ? (todayAttendance?.out_time ? 'Journey Complete' : 'Safely In') : 'Expecting Arrival'}
                    </Text>
                  </View>
                </View>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    {[
                      { label: 'Arrival', value: todayAttendance?.in_time || '--:--', icon: 'login', color: '#FCD34D' },
                      { label: 'Departure', value: todayAttendance?.out_time || '--:--', icon: 'logout', color: '#6EE7B7' },
                      { label: 'Status', value: todayAttendance?.in_time ? (todayAttendance?.out_time ? 'Done' : 'Active') : 'Pending', icon: 'shield-check', color: '#93C5FD' },
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
                  onPress={() => navigation.navigate('attendance')}
                  style={{ marginTop: 10, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                >
                  <MaterialCommunityIcons name="calendar-check-outline" size={18} color="white" />
                  <Text style={{ color: 'white', fontWeight: '900', fontSize: 14, marginLeft: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                    View Attendance
                  </Text>
                </TouchableOpacity>
                <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
                  <MaterialCommunityIcons name="school-outline" size={90} color="white" />
                </View>
              </LinearGradient>
            </View>
          </View>

          {/* ── Main Operations ── */}
          <View style={{ paddingVertical: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', letterSpacing: -0.5, color: isDark ? '#FFFFFF' : '#111827' }}>Main Operations ⚙️</Text>
              <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                <Text style={{ color: '#F59E0B', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Student Tools</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('timetable')}
                style={{ width: '48%', borderRadius: 16, overflow: 'hidden', shadowColor: '#4F46E5', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 12 }}
              >
                <LinearGradient
                  colors={isDark ? VIOLET_DARK : VIOLET}
                  style={{ padding: 20, height: 180, justifyContent: 'space-between' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 }}>
                      <MaterialCommunityIcons name="timeline-clock-outline" size={24} color="white" />
                    </View>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 }}>
                      <Text style={{ fontSize: 12, fontWeight: '900', color: 'white' }}>Now</Text>
                    </View>
                  </View>
                  <View>
                    <Text style={{ color: 'white', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 }}>Timetable</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '700', marginTop: 3, textTransform: 'uppercase', letterSpacing: 1.5 }}>Daily Schedule</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingVertical: 6, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: '#E9D5FF' }} numberOfLines={1}>{todaySchedule ? todaySchedule.activity : 'Standby'}</Text>
                      <Text style={{ fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>Activity</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingVertical: 6, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: '#E9D5FF' }} numberOfLines={1}>{todaySchedule ? todaySchedule.time : '--:--'}</Text>
                      <Text style={{ fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>Time</Text>
                    </View>
                  </View>
                  <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
                    <MaterialCommunityIcons name="timetable" size={90} color="white" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('activityFeed')}
                style={{ width: '48%', borderRadius: 16, overflow: 'hidden', shadowColor: '#059669', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 12 }}
              >
                <LinearGradient
                  colors={isDark ? EMERALD_DARK : EMERALD}
                  style={{ padding: 20, height: 180, justifyContent: 'space-between' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 }}>
                      <MaterialCommunityIcons name="star-face" size={24} color="white" />
                    </View>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 }}>
                      <Text style={{ fontSize: 12, fontWeight: '900', color: 'white' }}>Kids</Text>
                    </View>
                  </View>
                  <View>
                    <Text style={{ color: 'white', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 }}>Activity Feed</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '700', marginTop: 3, textTransform: 'uppercase', letterSpacing: 1.5 }}>Moments & Highlights</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingVertical: 6, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: '#D1FAE5' }}>{studentNotices.length}</Text>
                      <Text style={{ fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>Notices</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingVertical: 6, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: '#D1FAE5' }}>Live</Text>
                      <Text style={{ fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>Moments</Text>
                    </View>
                  </View>
                  <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
                    <MaterialCommunityIcons name="image-multiple-outline" size={90} color="white" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('liveCamera')}
                style={{ width: '48%', borderRadius: 16, overflow: 'hidden', shadowColor: '#2563EB', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 12 }}
              >
                <LinearGradient
                  colors={isDark ? BLUE_DARK : BLUE}
                  style={{ padding: 20, height: 150, justifyContent: 'space-between' }}
                >
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', padding: 10, borderRadius: 12 }}>
                    <MaterialCommunityIcons name="video-vintage" size={24} color="white" />
                  </View>
                  <View>
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 }}>Live Feed</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '700', marginTop: 3, textTransform: 'uppercase', letterSpacing: 1.5 }}>Secure Stream</Text>
                  </View>
                  <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
                    <MaterialCommunityIcons name="cctv" size={80} color="white" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('nannyChat')}
                style={{ width: '48%', borderRadius: 16, overflow: 'hidden', shadowColor: '#DB2777', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 12 }}
              >
                <LinearGradient
                  colors={isDark ? PINK_DARK : PINK}
                  style={{ padding: 20, height: 150, justifyContent: 'space-between' }}
                >
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', padding: 10, borderRadius: 12 }}>
                    <MaterialCommunityIcons name="microphone-message" size={24} color="white" />
                  </View>
                  <View>
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 }}>Voice Chat</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '700', marginTop: 3, textTransform: 'uppercase', letterSpacing: 1.5 }}>Talk to your Nanny</Text>
                  </View>
                  <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
                    <MaterialCommunityIcons name="microphone-message" size={80} color="white" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Financial Overview ── */}
          <View style={{ paddingVertical: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', letterSpacing: -0.5, color: isDark ? '#FFFFFF' : '#111827' }}>Financial Vault 💳</Text>
              <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                <Text style={{ color: '#10B981', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Secure Payments</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('myFees')}
              style={{ borderRadius: 16, overflow: 'hidden', shadowColor: financialStatus?.isOverdue ? '#991B1B' : '#059669', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 15 }}
            >
              <LinearGradient
                colors={financialStatus?.isOverdue
                  ? (isDark ? RED_DARK : RED)
                  : (financialStatus?.isPending
                    ? (isDark ? AMBER_DARK : AMBER)
                    : (isDark ? EMERALD_DARK : EMERALD))}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 12 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                      <MaterialCommunityIcons name={financialStatus?.isOverdue ? 'cash-remove' : (financialStatus?.isPending ? 'cash-fast' : 'currency-inr')} size={18} color="white" />
                    </View>
                    <View>
                      <Text style={{ color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: -0.5 }}>
                        {financialStatus?.isOverdue ? 'Overdue Balance' : (financialStatus?.isPending ? 'Fee Pending' : 'School Fees')}
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 1 }}>Academic Year {academicYear}</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 }}>
                    <Text style={{ color: 'white', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>
                      {financialStatus?.isOverdue ? 'Due Now' : (financialStatus?.isPending ? 'Unpaid' : 'All Clear')}
                    </Text>
                  </View>
                </View>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    {[
                      { label: 'Total', value: `₹${(feeBreakdown.total || 0).toLocaleString('en-IN')}`, icon: 'wallet-outline', color: '#FCD34D' },
                      { label: 'Overdue', value: `₹${(feeBreakdown.overdue || 0).toLocaleString('en-IN')}`, icon: 'clock-alert-outline', color: '#FCA5A5' },
                      { label: 'Current', value: `₹${(feeBreakdown.current || 0).toLocaleString('en-IN')}`, icon: 'calendar-month-outline', color: '#6EE7B7' },
                    ].map((item, i) => (
                      <View key={item.label} style={{ alignItems: 'center', flex: 1, borderRightWidth: i < 2 ? 1 : 0, borderRightColor: 'rgba(255,255,255,0.1)' }}>
                        <MaterialCommunityIcons name={item.icon as any} size={20} color="#FFFFFF" style={{ marginBottom: 4 }} />
                        <Text style={{ color: 'white', fontSize: 15, fontWeight: '900' }} numberOfLines={1}>{item.value}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginTop: 1 }}>{item.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
                  <MaterialCommunityIcons name="safe-square-outline" size={90} color="white" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ── Notice Board ── */}
          {studentNotices.length > 0 && (
            <View style={{ paddingVertical: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 4 }}>
                <Text style={{ fontSize: 20, fontWeight: '900', letterSpacing: -0.5, color: isDark ? '#FFFFFF' : '#111827' }}>Notice Board 📢</Text>
                <View style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)' }}>
                  <Text style={{ color: '#8B5CF6', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Updates</Text>
                </View>
              </View>

              {studentNotices.slice(0, 5).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.9}
                  onPress={() => setSelectedNotice(item)}
                  style={{ borderRadius: 16, overflow: 'hidden', elevation: 8, marginBottom: 12, borderWidth: 1, borderColor: isDark ? '#262626' : '#F3F4F6', backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF' }}
                >
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={{ width: '100%', height: 170 }} resizeMode="cover" />
                  ) : (
                    <LinearGradient
                      colors={isDark ? ['#312e81', '#4c1d95'] : ['#8B5CF6', '#7C3AED']}
                      style={{ width: '100%', height: 90, justifyContent: 'center', alignItems: 'center' }}
                    >
                      <MaterialCommunityIcons name="bullhorn-outline" size={42} color="white" />
                    </LinearGradient>
                  )}
                  <View style={{ padding: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialCommunityIcons name="calendar-edit" size={10} color="#F59E0B" />
                        <Text style={{ color: '#F59E0B', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 4 }}>{item.date}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 17, fontWeight: '900', letterSpacing: -0.5, color: isDark ? '#FFFFFF' : '#111827' }} numberOfLines={2}>{item.title}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                      <MaterialCommunityIcons name="account-circle-outline" size={14} color={isDark ? '#6B7280' : '#9CA3AF'} />
                      <Text style={{ color: isDark ? '#9CA3AF' : '#6B7280', fontSize: 10, fontWeight: '700', marginLeft: 5 }}>
                        {item.author || 'Admin'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 128 }} />
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
