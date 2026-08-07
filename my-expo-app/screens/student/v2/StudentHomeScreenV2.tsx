import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Image, TouchableOpacity, RefreshControl } from 'react-native';
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

const ROLE_AVATAR = require('../../../assets/Avatar/kids.png');

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
function ActionCard({ image, label, subtitle, tag, color, onPress }: {
  image: any;
  label: string;
  subtitle: string;
  tag: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={{
        width: '48%',
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

export default function StudentHomeScreenV2({ navigation }: Props) {
  const { user, announcements, updateAvatar, fees: allFees, refreshFees } = useAuth();
  const insets = useSafeAreaInsets();

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
    return {
      isPaid,
      isOverdue: hasAnyOverdue,
      isPending,
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

  const timeStr = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  const journeyAccent = todayAttendance?.in_time ? '#10B981' : '#F59E0B';
  const journeyLabel = todayAttendance?.in_time
    ? (todayAttendance?.out_time ? 'Journey Complete' : 'Safely In')
    : 'Expecting Arrival';

  const feeAccent = financialStatus?.isOverdue ? '#EF4444' : (financialStatus?.isPending ? '#F59E0B' : '#10B981');
  const feeTitle = financialStatus?.isOverdue ? 'Overdue Balance' : (financialStatus?.isPending ? 'Fee Pending' : 'School Fees');
  const feeBadge = financialStatus?.isOverdue ? 'Due Now' : (financialStatus?.isPending ? 'Unpaid' : 'All Clear');

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#F59E0B" colors={['#F59E0B']} />}
      >
        <View style={{ paddingTop: Math.max(insets.top, 56), paddingHorizontal: 20 }}>
          {/* ── Header: greet + avatar (left), bell (right) ── */}
          <View style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 12 }}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={updateAvatar}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  marginRight: 12,
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
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '400', color: TEXT_MUTED }}>
                  {(() => {
                    const h = new Date().getHours();
                    if (h < 12) return 'Good Morning 👋';
                    if (h < 17) return 'Good Afternoon 👋';
                    return 'Good Evening 👋';
                  })()}
                </Text>
                <Text numberOfLines={1} style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 2 }}>
                  {user?.name?.split(' ')[0] || 'Explorer'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('announcements')}
              style={{
                width: 52,
                height: 52,
                borderRadius: 18,
                backgroundColor: 'rgba(255,255,255,0.92)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.6)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Image
                source={require('../../../assets/icons/bell (1).png')}
                style={{ width: 28, height: 28 }}
                resizeMode="contain"
              />
              {announcements.length > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: '#EF4444',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 4,
                    borderWidth: 1.5,
                    borderColor: '#FFFFFF',
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>
                    {announcements.length > 99 ? '99+' : announcements.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: SECTION_GAP }} />

          {/* ── Today's Journey (compact hero card) ── */}
          <View
            style={{
              borderRadius: BORDER_RADIUS,
              overflow: 'hidden',
              backgroundColor: journeyAccent + '1F',
            }}
          >
            <View style={{ padding: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ backgroundColor: journeyAccent + '1F', width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                      <Image source={require('../../../assets/icons/exam-results.png')} style={{ width: 24, height: 24 }} resizeMode="contain" />
                    </View>
                    <View>
                      <Text style={{ color: TEXT_PRIMARY, fontSize: 15, fontWeight: '700', letterSpacing: -0.5 }}>Today's Journey</Text>
                      <Text style={{ color: TEXT_MUTED, fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 1 }}>{dateStr} · {timeStr}</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: journeyAccent + '1F', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 }}>
                    <Text style={{ color: journeyAccent, fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>{journeyLabel}</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: 'rgba(247,249,246,0.9)', borderRadius: 14, padding: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    {[
                      { label: 'Arrival', value: todayAttendance?.in_time || '--:--', image: require('../../../assets/icons/student.png') },
                      { label: 'Departure', value: todayAttendance?.out_time || '--:--', image: require('../../../assets/icons/family.png') },
                      { label: 'Status', value: todayAttendance?.in_time ? (todayAttendance?.out_time ? 'Done' : 'Active') : 'Pending', image: require('../../../assets/icons/bell (1).png') },
                    ].map((item) => (
                      <View key={item.label} style={{ alignItems: 'center', flex: 1 }}>
                        <View style={{ backgroundColor: journeyAccent + '14', width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                          <Image source={item.image} style={{ width: 16, height: 16 }} resizeMode="contain" />
                        </View>
                        <Text style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: '900' }} numberOfLines={1}>{item.value}</Text>
                        <Text style={{ color: TEXT_MUTED, fontSize: 7, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 1 }}>{item.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('attendance')}
                  style={{ marginTop: 10, backgroundColor: journeyAccent, borderRadius: 12, paddingVertical: 9, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                >
                  <Image source={require('../../../assets/icons/calendar.png')} style={{ width: 14, height: 14 }} resizeMode="contain" />
                  <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 11, marginLeft: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                    View Attendance
                  </Text>
                </TouchableOpacity>
              </View>
          </View>

          {/* ── Main Operations ── */}
          <View style={{ paddingTop: SECTION_GAP }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: TEXT_PRIMARY }}>Main Operations</Text>
              <View style={{ backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100 }}>
                <Text style={{ color: ACCENT, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Student Tools</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <ActionCard
                image={require('../../../assets/icons/calendar.png')}
                label="Timetable"
                subtitle="Daily Schedule"
                tag="Now"
                color="#6366F1"
                onPress={() => navigation.navigate('timetable')}
              />
              <ActionCard
                image={require('../../../assets/icons/player.png')}
                label="Activity Feed"
                subtitle="Moments & Highlights"
                tag="Kids"
                color="#F59E0B"
                onPress={() => navigation.navigate('activityFeed')}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <ActionCard
                image={require('../../../assets/icons/cctv-camera.png')}
                label="Live Feed"
                subtitle="Secure Stream"
                tag="Live"
                color="#3B82F6"
                onPress={() => navigation.navigate('liveCamera')}
              />
              <ActionCard
                image={require('../../../assets/icons/discussion (1).png')}
                label="Voice Chat"
                subtitle="Talk to your Nanny"
                tag="Chat"
                color="#EC4899"
                onPress={() => navigation.navigate('nannyChat')}
              />
            </View>
          </View>

          {/* ── Financial Vault ── */}
          <View style={{ paddingTop: SECTION_GAP }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: TEXT_PRIMARY }}>Financial Vault</Text>
              <View style={{ backgroundColor: 'rgba(16,185,129,0.12)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100 }}>
                <Text style={{ color: '#10B981', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Secure Payments</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('myFees')}
              style={{
                borderRadius: BORDER_RADIUS,
                overflow: 'hidden',
                backgroundColor: feeAccent + '1F',
              }}
            >
              <View style={{ padding: 18 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ backgroundColor: feeAccent + '1F', width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Image source={require('../../../assets/icons/wallet.png')} style={{ width: 26, height: 26 }} resizeMode="contain" />
                      </View>
                      <View>
                        <Text style={{ color: TEXT_PRIMARY, fontSize: 17, fontWeight: '700', letterSpacing: -0.5 }}>{feeTitle}</Text>
                        <Text style={{ color: TEXT_MUTED, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 2 }}>Academic Year {academicYear}</Text>
                      </View>
                    </View>
                    <View style={{ backgroundColor: feeAccent + '1F', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100 }}>
                      <Text style={{ color: feeAccent, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>{feeBadge}</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: 'rgba(247,249,246,0.9)', borderRadius: 18, padding: 14 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      {[
                        { label: 'Total', value: `₹${(feeBreakdown.total || 0).toLocaleString('en-IN')}`, image: require('../../../assets/icons/wallet.png') },
                        { label: 'Overdue', value: `₹${(feeBreakdown.overdue || 0).toLocaleString('en-IN')}`, image: require('../../../assets/icons/error.png') },
                        { label: 'Current', value: `₹${(feeBreakdown.current || 0).toLocaleString('en-IN')}`, image: require('../../../assets/icons/calendar.png') },
                      ].map((item) => (
                        <View key={item.label} style={{ alignItems: 'center', flex: 1 }}>
                          <View style={{ backgroundColor: feeAccent + '14', width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                            <Image source={item.image} style={{ width: 18, height: 18 }} resizeMode="contain" />
                          </View>
                          <Text style={{ color: TEXT_PRIMARY, fontSize: 14, fontWeight: '900' }} numberOfLines={1}>{item.value}</Text>
                          <Text style={{ color: TEXT_MUTED, fontSize: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 1 }}>{item.label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
                    <MaterialCommunityIcons name="chevron-right" size={12} color={TEXT_MUTED} />
                    <Text style={{ color: TEXT_MUTED, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 6 }}>View Fee Details</Text>
                  </View>
                </View>
            </TouchableOpacity>
          </View>

          {/* ── Notice Board ── */}
          {studentNotices.length > 0 && (
            <View style={{ paddingTop: SECTION_GAP }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: TEXT_PRIMARY }}>Notice Board</Text>
                <View style={{ backgroundColor: 'rgba(139,92,246,0.12)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100 }}>
                  <Text style={{ color: '#8B5CF6', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Updates</Text>
                </View>
              </View>

              {studentNotices.slice(0, 5).map((item) => (
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
                        {item.author || 'Admin'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
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
