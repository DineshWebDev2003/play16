import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../services/api';

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
}

const CYAN = ['#06B6D4', '#0891B2'] as [string, string];
const CYAN_DARK = ['#164e63', '#083344'] as [string, string];
const EMERALD = ['#10B981', '#059669'] as [string, string];
const EMERALD_DARK = ['#064e3b', '#022c22'] as [string, string];
const PINK = ['#EC4899', '#DB2777'] as [string, string];
const PINK_DARK = ['#831843', '#500724'] as [string, string];

export default function NannyHomeScreen({ navigation }: Props) {
  const { user, users } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
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

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFFFFF' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#06B6D4']}
            tintColor="#06B6D4"
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
              <Text style={{ fontSize: 30, fontWeight: '900', letterSpacing: -0.5, marginTop: 4, color: isDark ? '#FFFFFF' : '#111827' }}>
                {user?.name?.split(' ')[0] || 'Nanny'}
              </Text>
              <View style={{ backgroundColor: 'rgba(6, 182, 212, 0.2)', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100, marginTop: 12, borderWidth: 1, borderColor: 'rgba(6, 182, 212, 0.1)' }}>
                <Text style={{ color: '#06B6D4', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Nanny Console</Text>
              </View>
            </View>
            <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('account')}
              style={{ backgroundColor: '#06B6D4', width: 80, height: 80, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FFFFFF', transform: [{ rotate: '3deg' }], overflow: 'hidden' }}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <MaterialCommunityIcons name="baby-face-outline" size={36} color="white" />
              )}
              <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: '#0E7490', padding: 4, borderRadius: 10, borderWidth: 2, borderColor: '#FFFFFF' }}>
                <MaterialCommunityIcons name="camera" size={12} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Duty Status (hero counter card) ── */}
          <View style={{ paddingVertical: 8 }}>
            <View style={{ borderRadius: 16, overflow: 'hidden', elevation: 15 }}>
              <LinearGradient
                colors={isClockedIn ? (isDark ? EMERALD_DARK : EMERALD) : (isDark ? CYAN_DARK : CYAN)}
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
          </View>

          {/* ── Main Operations ── */}
          <View style={{ paddingVertical: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', letterSpacing: -0.5, color: isDark ? '#FFFFFF' : '#111827' }}>Main Operations ⚙️</Text>
              <View style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(6, 182, 212, 0.2)' }}>
                <Text style={{ color: '#06B6D4', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Nanny Tools</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('nannyAttendance')}
                style={{ width: '48%', borderRadius: 16, overflow: 'hidden', shadowColor: '#059669', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 12 }}
              >
                <LinearGradient
                  colors={isDark ? EMERALD_DARK : EMERALD}
                  style={{ padding: 20, height: 180, justifyContent: 'space-between' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 }}>
                      <MaterialCommunityIcons name="calendar-check-outline" size={24} color="white" />
                    </View>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 }}>
                      <Text style={{ fontSize: 12, fontWeight: '900', color: 'white' }}>Today</Text>
                    </View>
                  </View>
                  <View>
                    <Text style={{ color: 'white', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 }}>Attendance</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '700', marginTop: 3, textTransform: 'uppercase', letterSpacing: 1.5 }}>Mark Students</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingVertical: 6, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: '#D1FAE5' }}>{todayPresent}</Text>
                      <Text style={{ fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>Present</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingVertical: 6, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: '#FECACA' }}>{todayAbsent}</Text>
                      <Text style={{ fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>Absent</Text>
                    </View>
                  </View>
                  <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
                    <MaterialCommunityIcons name="check-decagram" size={90} color="white" />
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
                  style={{ padding: 20, height: 180, justifyContent: 'space-between' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 }}>
                      <MaterialCommunityIcons name="microphone-message" size={24} color="white" />
                    </View>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100, flexDirection: 'row', alignItems: 'center' }}>
                      {unreadTotal > 0 ? (
                        <>
                          <MaterialCommunityIcons name="message-text" size={10} color="white" />
                          <Text style={{ fontSize: 10, fontWeight: '900', color: 'white', marginLeft: 3 }}>{unreadTotal}</Text>
                        </>
                      ) : (
                        <Text style={{ fontSize: 9, fontWeight: '900', color: 'white' }}>Open</Text>
                      )}
                    </View>
                  </View>
                  <View>
                    <Text style={{ color: 'white', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 }}>Voice Chat</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '700', marginTop: 3, textTransform: 'uppercase', letterSpacing: 1.5 }}>Parents & Admin</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingVertical: 6, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: '#FBCFE8' }}>{unreadTotal}</Text>
                      <Text style={{ fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>Unread</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingVertical: 6, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: '#FBCFE8' }}>{branchStudents.length}</Text>
                      <Text style={{ fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>Kids</Text>
                    </View>
                  </View>
                  <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
                    <MaterialCommunityIcons name="microphone-message" size={90} color="white" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('alumni')}
              style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 14, shadowColor: '#7C3AED', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 10 }}
            >
              <LinearGradient
                colors={isDark ? ['#4c1d95', '#3b0764'] : ['#7C3AED', '#6D28D9']}
                style={{ padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 }}>
                    <MaterialCommunityIcons name="account-star-outline" size={24} color="white" />
                  </View>
                  <View style={{ marginLeft: 14, flex: 1 }}>
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: -0.5 }}>Alumni</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 1.5 }}>View Disabled Members</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color="rgba(255,255,255,0.8)" />
              </LinearGradient>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('account')}
                style={{ width: '48%', borderRadius: 16, overflow: 'hidden', shadowColor: '#4F46E5', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 12 }}
              >
                <LinearGradient
                  colors={isDark ? ['#3730a3', '#312e81'] : ['#6366F1', '#4F46E5']}
                  style={{ padding: 20, height: 150, justifyContent: 'space-between' }}
                >
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', padding: 10, borderRadius: 12 }}>
                    <MaterialCommunityIcons name="account-cog" size={24} color="white" />
                  </View>
                  <View>
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 }}>Profile</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '700', marginTop: 3, textTransform: 'uppercase', letterSpacing: 1.5 }}>Settings</Text>
                  </View>
                  <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
                    <MaterialCommunityIcons name="account-circle-outline" size={80} color="white" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('activityFeed')}
                style={{ width: '48%', borderRadius: 16, overflow: 'hidden', shadowColor: '#D97706', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 12 }}
              >
                <LinearGradient
                  colors={isDark ? ['#92400E', '#78350F'] : ['#F59E0B', '#D97706']}
                  style={{ padding: 20, height: 150, justifyContent: 'space-between' }}
                >
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', padding: 10, borderRadius: 12 }}>
                    <MaterialCommunityIcons name="star-face" size={24} color="white" />
                  </View>
                  <View>
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 }}>Kids Feed</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '700', marginTop: 3, textTransform: 'uppercase', letterSpacing: 1.5 }}>Moments & Highlights</Text>
                  </View>
                  <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
                    <MaterialCommunityIcons name="image-multiple-outline" size={80} color="white" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ height: 128 }} />
      </ScrollView>
    </View>
  );
}
