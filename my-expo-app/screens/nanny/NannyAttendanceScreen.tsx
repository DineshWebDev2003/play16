import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

const statusColor = (s?: string) => s === 'present' ? '#10B981' : s === 'absent' ? '#EF4444' : s === 'late' ? '#F59E0B' : '#E5E7EB';
const statusLabel = (s?: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Not Marked';

export default function NannyAttendanceScreen({ navigation }: Props) {
  const { user, users } = useAuth();
  const insets = useSafeAreaInsets();

  const [todayAttendance, setTodayAttendance] = useState<Record<string, any>>({});
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const branchStudents = useMemo(() => {
    return users
      .filter(u => u.role === 'student' && u.branch_id === user?.branch_id && u.status === 'active')
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users, user?.branch_id]);

  const fetchToday = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.get(`/attendance?date=${today}&user_role=student`);
      const map: Record<string, any> = {};
      (res.data || []).forEach((r: any) => {
        map[String(r.student_id)] = r;
      });
      setTodayAttendance(map);
    } catch (err) {
      console.error('Fetch attendance error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchToday();
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  }, [fetchToday]);

  const markStudent = async (studentId: string, status: string) => {
    setMarkingId(studentId);
    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      await api.post('/attendance', {
        student_id: studentId,
        date: today,
        status,
        user_role: 'student',
        in_time: status === 'present' ? timeString : null,
        dropped_by_type: 'Nanny',
        dropped_by_name: user?.name || 'Nanny',
      });
      setTodayAttendance(prev => ({
        ...prev,
        [String(studentId)]: {
          status,
          in_time: status === 'present' ? timeString : null,
          dropped_by_type: 'Nanny',
          dropped_by_name: user?.name || 'Nanny',
        },
      }));
    } catch (err) {
      Alert.alert('Error', 'Failed to mark attendance.');
    } finally {
      setMarkingId(null);
    }
  };

  const todayPresent = useMemo(
    () => branchStudents.filter(s => todayAttendance[String(s.id)]?.status === 'present').length,
    [branchStudents, todayAttendance]
  );
  const todayAbsent = useMemo(
    () => branchStudents.filter(s => todayAttendance[String(s.id)]?.status === 'absent').length,
    [branchStudents, todayAttendance]
  );
  const todayLate = useMemo(
    () => branchStudents.filter(s => todayAttendance[String(s.id)]?.status === 'late').length,
    [branchStudents, todayAttendance]
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ paddingTop: Math.max(insets.top, 20) }} className="px-6 pb-5">
        <View className="flex-row items-center justify-between mb-5">
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-12 h-12 rounded-[16px] bg-gray-100 items-center justify-center" activeOpacity={0.8}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
          </TouchableOpacity>
          <View style={{ backgroundColor: '#CFFAFE' }} className="rounded-full px-3 py-1">
            <Text className="text-[9px] font-black uppercase tracking-[2px]" style={{ color: '#0891B2' }}>Pick & Mark</Text>
          </View>
          <TouchableOpacity onPress={onRefresh} className="w-12 h-12 rounded-[16px] bg-gray-50 items-center justify-center" activeOpacity={0.8}>
            <MaterialCommunityIcons name="refresh" size={22} color="#111827" />
          </TouchableOpacity>
        </View>
        <Text className="text-3xl font-black tracking-tighter text-gray-900">Student</Text>
        <Text className="text-xl font-black" style={{ color: '#06B6D4' }}>Attendance</Text>

        <View className="flex-row mt-5">
          {[
            { label: 'Present', value: todayPresent, color: '#10B981' },
            { label: 'Absent', value: todayAbsent, color: '#EF4444' },
            { label: 'Late', value: todayLate, color: '#F59E0B' },
            { label: 'Total', value: branchStudents.length, color: '#6B7280' },
          ].map(stat => (
            <View key={stat.label} className="flex-1 items-center" style={{ backgroundColor: '#F9FAFB', borderRadius: 16, paddingVertical: 10, marginHorizontal: 3 }}>
              <Text className="text-lg font-black" style={{ color: stat.color }}>{stat.value}</Text>
              <Text className="text-[7px] font-black uppercase tracking-widest text-gray-400 mt-0.5">{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[nannyColor]} tintColor={nannyColor} />
        }
      >
        {loading && (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <ActivityIndicator color={nannyColor} />
          </View>
        )}

        {!loading && branchStudents.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <MaterialCommunityIcons name="account-group-outline" size={56} color="#D1D5DB" />
            <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">No kids assigned yet</Text>
          </View>
        )}

        {branchStudents.map(student => {
          const record = todayAttendance[String(student.id)];
          const status = record?.status;
          return (
            <View key={student.id} style={{ backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 12, padding: 14 }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  {student.avatar ? (
                    <Image source={{ uri: student.avatar }} style={{ width: 42, height: 42, borderRadius: 14, marginRight: 12 }} />
                  ) : (
                    <View style={{ backgroundColor: statusColor(status) }} className="w-10 h-10 rounded-[14px] items-center justify-center mr-3">
                      <MaterialCommunityIcons name="account-child" size={20} color="white" />
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="font-black text-sm text-gray-900">{student.name}</Text>
                    <Text className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                      {student.studentId || `ID ${student.id}`}
                    </Text>
                    {status && (
                      <View className="flex-row items-center mt-1.5 flex-wrap">
                        <View style={{ backgroundColor: statusColor(status) }} className="rounded-md px-1.5 py-0.5 mr-2">
                          <Text className="text-[8px] font-black text-white uppercase">{statusLabel(status)}</Text>
                        </View>
                        {record?.dropped_by_name && (
                          <View style={{ backgroundColor: '#F3F4F6' }} className="rounded-md px-1.5 py-0.5 flex-row items-center">
                            <MaterialCommunityIcons name="account-check-outline" size={10} color="#6B7280" />
                            <Text className="text-[8px] font-bold text-gray-500 ml-1">by {record.dropped_by_name} · {record.dropped_by_type || 'Nanny'}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>
                <View className="flex-row items-center">
                  {markingId === String(student.id) ? (
                    <ActivityIndicator size="small" color={nannyColor} />
                  ) : (
                    (['present', 'absent', 'late'] as const).map(s => (
                      <TouchableOpacity
                        key={s}
                        activeOpacity={0.8}
                        onPress={() => markStudent(String(student.id), s)}
                        style={{ backgroundColor: status === s ? (s === 'present' ? '#10B981' : s === 'absent' ? '#EF4444' : '#F59E0B') : '#F3F4F6' }}
                        className="w-9 h-9 rounded-xl items-center justify-center ml-2"
                      >
                        <MaterialCommunityIcons
                          name={s === 'present' ? 'check' : s === 'absent' ? 'close' : 'clock-outline'}
                          size={15}
                          color={status === s ? 'white' : '#9CA3AF'}
                        />
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
