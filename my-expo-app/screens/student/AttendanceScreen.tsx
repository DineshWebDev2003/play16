import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
    <View style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#F3F4F6' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ backgroundColor: item.status === 'present' ? '#10B981' : (item.status === 'absent' ? '#EF4444' : '#E5E7EB'), width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>{item.day}</Text>
        </View>
        <View>
          <Text style={{ fontWeight: '800', color: '#111827', fontSize: 13 }}>{item.dayName}, {item.date}</Text>
          <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2, color: item.status === 'present' ? '#059669' : (item.status === 'absent' ? '#EF4444' : '#9CA3AF') }}>
            {item.status.replace('_', ' ')}
          </Text>
        </View>
      </View>
      {item.status === 'present' && (
        <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="clock-check-outline" size={12} color="#10B981" />
            <Text style={{ color: '#059669', fontSize: 10, fontWeight: '700', marginLeft: 4 }}>{item.clockIn || '--:--'}</Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flex: 1 }}>
        <View style={{ paddingTop: Math.max(insets.top, 10), paddingHorizontal: 24, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, backgroundColor: '#F3F4F6', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <MaterialCommunityIcons name="arrow-left" size={22} color="#374151" />
              </TouchableOpacity>
              <Text style={{ fontSize: 30, fontWeight: '900', color: '#111827', letterSpacing: -0.5 }}>My</Text>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#10B981', marginTop: -2 }}>Attendance</Text>
            </View>
            <View style={{ backgroundColor: '#10B981', width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="calendar-check" size={32} color="white" />
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 24, marginBottom: 20, flexDirection: 'row', gap: 10 }}>
          <View style={{ backgroundColor: '#F9FAFB', flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#10B981' }}>{stats.present}</Text>
            <Text style={{ fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: '#9CA3AF', marginTop: 4 }}>Present</Text>
          </View>
          <View style={{ backgroundColor: '#F9FAFB', flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#EF4444' }}>{stats.absent}</Text>
            <Text style={{ fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: '#9CA3AF', marginTop: 4 }}>Absent</Text>
          </View>
          <TouchableOpacity onPress={() => setShowPicker(true)} style={{ backgroundColor: '#F9FAFB', flex: 1.4, padding: 16, borderRadius: 16, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>{MONTHS[selectedMonth].substring(0, 3)} {selectedYear}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Text style={{ fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: '#F59E0B' }}>Change</Text>
              <MaterialCommunityIcons name="chevron-down" size={12} color="#F59E0B" style={{ marginLeft: 2 }} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 24, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontWeight: '800', color: '#111827', fontSize: 15 }}>Daily Records</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981', marginRight: 4 }} />
            <Text style={{ fontSize: 9, fontWeight: '700', color: '#9CA3AF', marginRight: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{stats.percentage}%</Text>
            {loading && <ActivityIndicator color="#10B981" size="small" />}
          </View>
        </View>

        <FlatList
          data={attendanceData}
          keyExtractor={(item) => item.day.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#10B981']} tintColor="#10B981" />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 80, opacity: 0.3 }}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={64} color="#D1D5DB" />
              <Text style={{ fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, fontSize: 11 }}>No Records</Text>
            </View>
          }
        />
      </View>

      {showPicker && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 24 }}>
          <View style={{ backgroundColor: '#FFFFFF', width: '100%', borderRadius: 24, padding: 24, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#111827' }}>Select Month & Year</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {YEARS.map((year) => (
                <View key={year} style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#F59E0B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, paddingHorizontal: 4 }}>{year}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {MONTHS.map((m, i) => (
                      <TouchableOpacity
                        key={m}
                        onPress={() => { setSelectedMonth(i); setSelectedYear(year); setShowPicker(false); }}
                        style={{ width: '31%', paddingVertical: 12, borderRadius: 12, marginBottom: 8, marginRight: '3.5%', alignItems: 'center', backgroundColor: selectedMonth === i && selectedYear === year ? '#F59E0B' : '#F3F4F6' }}>
                        <Text style={{ fontWeight: '700', fontSize: 11, color: selectedMonth === i && selectedYear === year ? '#FFFFFF' : '#6B7280' }}>
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
    </SafeAreaView>
  );
}
