import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../services/api';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = Array.from({ length: 10 }, (_, i) => 2026 + i);

interface BackendRecord {
  id: number;
  student_id: number;
  date: string;
  status: 'present' | 'absent' | 'late' | 'holiday';
  in_time: string | null;
  out_time: string | null;
  dropped_by_type: string | null;
  picked_by_type: string | null;
  dropped_by_name: string | null;
  picked_by_name: string | null;
}

export default function AttendanceScreen({ navigation }: any) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [records, setRecords] = useState<BackendRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const fetchAttendance = useCallback(async (showIndicator = true) => {
    if (!user?.id) return;
    try {
      if (showIndicator) setLoading(true);
      const params = new URLSearchParams();
      params.append('student_id', user.id.toString());
      params.append('user_role', user.role);
      const res = await api.get(`/attendance?${params.toString()}`);
      setRecords(res.data);
    } catch (error) {
      console.error('Fetch attendance error:', error);
    } finally {
      if (showIndicator) setLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, user?.role]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchAttendance(false);
  }, [fetchAttendance]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const attendanceData = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const result = [];
    const recordMap: Record<string, BackendRecord> = {};
    records.forEach(r => { recordMap[r.date] = r; });

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dateObj = new Date(selectedYear, selectedMonth, day);
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const record = recordMap[dateStr];
      result.push({
        day, dayName,
        date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: dateStr,
        status: record?.status || 'not_marked',
        clockIn: record?.in_time,
        clockOut: record?.out_time,
        clockInBy: record?.dropped_by_name || record?.dropped_by_type,
        clockOutBy: record?.picked_by_name || record?.picked_by_type,
      });
    }
    return result.reverse();
  }, [records, selectedMonth, selectedYear]);

  const stats = useMemo(() => {
    const relevant = attendanceData.filter(d =>
      (d.status === 'present' || d.status === 'absent' || d.status === 'late')
    );
    const present = relevant.filter(d => d.status === 'present' || d.status === 'late').length;
    const total = relevant.length;
    return {
      present,
      absent: relevant.filter(d => d.status === 'absent').length,
      holiday: attendanceData.filter(d => d.status === 'holiday').length,
      percentage: total > 0 ? Math.round((present / total) * 100) : 0,
    };
  }, [attendanceData]);

  const renderItem = ({ item }: { item: any }) => (
    <View className="bg-white dark:bg-gray-800 p-4 rounded-2xl mb-3 flex-row items-center justify-between shadow-sm">
      <View className="flex-row items-center">
        <View className={`${item.status === 'present' ? 'bg-emerald-500' : (item.status === 'absent' ? 'bg-red-500' : 'bg-gray-200 dark:bg-gray-600')} w-10 h-10 rounded-xl items-center justify-center mr-3`}>
          <Text className="text-white font-bold text-base">{item.day}</Text>
        </View>
        <View>
          <Text className="font-bold text-gray-900 dark:text-white text-sm">{item.dayName}, {item.date}</Text>
          <Text className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${item.status === 'present' ? 'text-emerald-600 dark:text-emerald-400' : (item.status === 'absent' ? 'text-red-500' : 'text-gray-400')}`}>
            {item.status.replace('_', ' ')}
          </Text>
        </View>
      </View>
      {item.status === 'present' && (
        <View className="bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-xl">
          <View className="flex-row items-center">
            <MaterialCommunityIcons name="clock-check-outline" size={12} color="#10B981" />
            <Text className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold ml-1.5">{item.clockIn || '--:--'}</Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-1">
        <View style={{ paddingTop: Math.max(insets.top, 10) }} className="px-6 pb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl items-center justify-center mb-4"
              >
                <MaterialCommunityIcons name="arrow-left" size={22} color="#374151" />
              </TouchableOpacity>
              <Text className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">My</Text>
              <Text className="text-lg font-bold text-emerald-500 mt-[-2px]">Attendance</Text>
            </View>
            <View className="bg-emerald-500 w-16 h-16 rounded-2xl items-center justify-center">
              <MaterialCommunityIcons name="calendar-check" size={32} color="white" />
            </View>
          </View>
        </View>

        <View className="px-6 mb-6 flex-row gap-3">
          <View className="bg-gray-50 dark:bg-gray-800 flex-1 p-4 rounded-2xl items-center">
            <Text className="text-2xl font-black text-emerald-500">{stats.present}</Text>
            <Text className="text-[8px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mt-1">Present</Text>
          </View>
          <View className="bg-gray-50 dark:bg-gray-800 flex-1 p-4 rounded-2xl items-center">
            <Text className="text-2xl font-black text-red-500">{stats.absent}</Text>
            <Text className="text-[8px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mt-1">Absent</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowPicker(true)}
            className="bg-gray-50 dark:bg-gray-800 flex-[1.4] p-4 rounded-2xl items-center"
          >
            <Text className="text-base font-bold text-gray-900 dark:text-white">{MONTHS[selectedMonth].substring(0, 3)} {selectedYear}</Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-[8px] font-bold uppercase tracking-widest text-amber-500">Change</Text>
              <MaterialCommunityIcons name="chevron-down" size={12} color="#F59E0B" style={{ marginLeft: 2 }} />
            </View>
          </TouchableOpacity>
        </View>

        <View className="px-6 mb-3 flex-row items-center justify-between">
          <Text className="font-bold text-gray-900 dark:text-white text-base">Daily Records</Text>
          <View className="flex-row items-center">
            <View className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1" />
            <Text className="text-[9px] font-bold text-gray-400 mr-3 uppercase tracking-wider">{stats.percentage}%</Text>
            {loading && <ActivityIndicator color="#10B981" size="small" />}
          </View>
        </View>

        <FlatList
          data={attendanceData}
          keyExtractor={(item) => item.day.toString()}
          renderItem={renderItem}
          className="px-6"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={['#10B981']}
              tintColor="#10B981"
            />
          }
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="items-center py-20 opacity-30">
              <MaterialCommunityIcons name="calendar-blank-outline" size={64} color="#D1D5DB" />
              <Text className="font-bold text-gray-400 uppercase tracking-widest mt-4 text-xs">No Records</Text>
            </View>
          }
        />
      </View>

      {showPicker && (
        <View className="absolute inset-0 z-50 justify-center items-center bg-black/60 px-6">
          <View className="bg-white dark:bg-gray-800 w-full rounded-3xl p-6 shadow-lg max-h-[80%]">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">Select Month & Year</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {YEARS.map((year) => (
                <View key={year} className="mb-4">
                  <Text className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-3 px-1">{year}</Text>
                  <View className="flex-row flex-wrap">
                    {MONTHS.map((m, i) => (
                      <TouchableOpacity
                        key={m}
                        onPress={() => { setSelectedMonth(i); setSelectedYear(year); setShowPicker(false); }}
                        className={`w-[31%] py-3 rounded-xl mb-2 mr-[3.5%] items-center ${selectedMonth === i && selectedYear === year ? 'bg-amber-500' : 'bg-gray-100 dark:bg-gray-700'}`}
                        style={{ marginRight: 0 }}
                      >
                        <Text className={`font-bold text-xs ${selectedMonth === i && selectedYear === year ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                          {m.substring(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}
