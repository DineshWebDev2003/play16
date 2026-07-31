import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../services/api';

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
}

const nannyColor = '#06B6D4';
const PINK = ['#EC4899', '#DB2777'];

export default function NannyHomeScreen({ navigation }: Props) {
  const { user, users } = useAuth();
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
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[nannyColor]} tintColor={nannyColor} />
        }
      >
        {/* Header */}
        <View style={{ paddingTop: Math.max(insets.top, 20) }} className="px-6 pb-6">
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className="text-[9px] font-black uppercase tracking-[4px] text-gray-400">TN HAPPYKIDS</Text>
              <Text className="text-3xl font-black tracking-tighter mt-1 text-gray-900">{user?.name?.split(' ')[0] || 'Nanny'}</Text>
              <View className="flex-row items-center mt-2">
                <View style={{ backgroundColor: '#CFFAFE' }} className="rounded-full px-3 py-1">
                  <Text className="text-[9px] font-black uppercase tracking-[2px]" style={{ color: '#0891B2' }}>Nanny Console</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('account')}
              activeOpacity={0.85}
              style={{ backgroundColor: '#06B6D4' }}
              className="w-20 h-20 rounded-[24px] items-center justify-center border-4 border-white shadow-xl overflow-hidden"
            >
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <MaterialCommunityIcons name="baby-face-outline" size={40} color="white" />
              )}
              <View className="absolute -bottom-1 -right-1 bg-cyan-600 p-1.5 rounded-lg">
                <MaterialCommunityIcons name="camera" size={12} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Duty Status — Landscape */}
          <LinearGradient
            colors={isClockedIn ? (['#10B981', '#059669'] as [string, string]) : (['#06B6D4', '#0891B2'] as [string, string])}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            className="rounded-[16px] p-4 mb-4"
            style={{ justifyContent: 'space-between' }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="w-9 h-9 rounded-xl items-center justify-center mr-3">
                  <MaterialCommunityIcons name={isClockedIn ? 'logout' : 'login'} size={18} color="white" />
                </View>
                <Text className="text-white text-lg font-black tracking-tight">Duty Status</Text>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="rounded-full px-2.5 py-1">
                <Text className="text-[9px] font-black uppercase tracking-widest text-white">
                  {isClockedIn ? 'On Duty' : (clockOutTime ? 'Ended' : 'Off Duty')}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center">
              <View className="flex-1">
                <Text className="text-[8px] font-bold uppercase tracking-widest text-white/60">In</Text>
                <Text className="text-xl font-black text-white mt-0.5">{clockInTime || '--:--'}</Text>
              </View>
              <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.25)' }} className="mx-4" />
              <View className="flex-1">
                <Text className="text-[8px] font-bold uppercase tracking-widest text-white/60">Out</Text>
                <Text className="text-xl font-black text-white mt-0.5">{clockOutTime || '--:--'}</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.9}
                disabled={clockLoading}
                onPress={isClockedIn ? handleClockOut : handleClockIn}
                style={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 14 }}
                className="ml-5 px-5 py-3.5 items-center flex-row justify-center"
              >
                {clockLoading ? (
                  <ActivityIndicator color={isClockedIn ? '#059669' : '#0891B2'} />
                ) : (
                  <>
                    <MaterialCommunityIcons name={isClockedIn ? 'logout' : 'login'} size={16} color={isClockedIn ? '#059669' : '#0891B2'} />
                    <Text className="font-black text-xs ml-1.5" style={{ color: isClockedIn ? '#059669' : '#0891B2' }}>
                      {isClockedIn ? 'Clock Out' : 'Clock In'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* 2 Mini Containers in a Row */}
          <View className="flex-row flex-wrap justify-between">
            {/* Student Attendance — opens pick & mark screen */}
            <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('nannyAttendance')} style={{ width: '48%', marginBottom: 16 }}>
              <LinearGradient colors={['#10B981', '#059669'] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="rounded-[16px] p-4" style={{ minHeight: 190, justifyContent: 'space-between' }}>
                <View className="flex-row items-center justify-between">
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="w-9 h-9 rounded-xl items-center justify-center">
                    <MaterialCommunityIcons name="calendar-check-outline" size={18} color="white" />
                  </View>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="rounded-full px-2 py-0.5">
                    <Text className="text-[8px] font-black uppercase tracking-widest text-white">Today</Text>
                  </View>
                </View>
                <View>
                  <Text className="text-white text-lg font-black tracking-tight">Attendance</Text>
                  <Text className="text-[8px] font-bold uppercase tracking-widest text-white/60 mt-0.5">Students</Text>
                </View>
                <View className="flex-row">
                  <View className="flex-1 items-center" style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingVertical: 8 }}>
                    <Text className="text-xl font-black text-white">{todayPresent}</Text>
                    <Text className="text-[7px] font-black uppercase tracking-widest text-white/70 mt-0.5">Present</Text>
                  </View>
                  <View className="flex-1 items-center ml-2" style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingVertical: 8 }}>
                    <Text className="text-xl font-black text-white">{todayAbsent}</Text>
                    <Text className="text-[7px] font-black uppercase tracking-widest text-white/70 mt-0.5">Absent</Text>
                  </View>
                  <View className="flex-1 items-center ml-2" style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingVertical: 8 }}>
                    <Text className="text-xl font-black text-white">{branchStudents.length}</Text>
                    <Text className="text-[7px] font-black uppercase tracking-widest text-white/70 mt-0.5">Total</Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="arrow-right-circle" size={14} color="rgba(255,255,255,0.8)" />
                  <Text className="text-[8px] font-black uppercase tracking-widest text-white/80 ml-1.5">Tap to mark</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Voice Chat */}
            <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('nannyChat')} style={{ width: '48%', marginBottom: 16 }}>
              <LinearGradient colors={PINK as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="rounded-[16px] p-4" style={{ minHeight: 190, justifyContent: 'space-between' }}>
                <View className="flex-row items-center justify-between">
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="w-9 h-9 rounded-xl items-center justify-center">
                    <MaterialCommunityIcons name="microphone-message" size={18} color="white" />
                  </View>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="rounded-full px-2 py-0.5 flex-row items-center">
                    {unreadTotal > 0 && (
                      <>
                        <MaterialCommunityIcons name="message-text" size={10} color="white" />
                        <Text className="text-[8px] font-black text-white ml-1">{unreadTotal}</Text>
                      </>
                    )}
                    {unreadTotal === 0 && <Text className="text-[8px] font-black text-white uppercase tracking-widest">Open</Text>}
                  </View>
                </View>
                <View>
                  <Text className="text-white text-lg font-black tracking-tight">Voice Chat</Text>
                  <Text className="text-[8px] font-bold uppercase tracking-widest text-white/60 mt-0.5">Parents & Admin</Text>
                </View>
                <View className="flex-row items-center">
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.6)', marginRight: 6 }} />
                  <Text className="text-[8px] font-bold text-white/70 uppercase tracking-widest">Tap to open</Text>
                </View>
                <View className="absolute -bottom-3 -right-3 opacity-10">
                  <MaterialCommunityIcons name="microphone-message" size={80} color="white" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
