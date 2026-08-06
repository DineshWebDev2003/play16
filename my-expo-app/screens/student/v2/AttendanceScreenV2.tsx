import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, FlatList, RefreshControl, StyleSheet, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
}

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

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const ACCENT = '#F59E0B';
const BORDER_RADIUS = 28;

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

export default function AttendanceScreenV2({ navigation }: Props) {
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
    <View style={{ backgroundColor: 'rgba(255,255,255,0.92)', padding: 16, borderRadius: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ backgroundColor: item.status === 'present' ? '#10B981' : (item.status === 'absent' ? '#EF4444' : '#E5E7EB'), width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>{item.day}</Text>
        </View>
        <View>
          <Text style={{ fontWeight: '800', color: TEXT_PRIMARY, fontSize: 13 }}>{item.dayName}, {item.date}</Text>
          <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2, color: item.status === 'present' ? '#059669' : (item.status === 'absent' ? '#EF4444' : TEXT_MUTED) }}>
            {item.status.replace('_', ' ')}
          </Text>
        </View>
      </View>
      {item.status === 'present' && (
        <View style={{ backgroundColor: 'rgba(16,185,129,0.12)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="clock-check-outline" size={12} color="#10B981" />
            <Text style={{ color: '#059669', fontSize: 10, fontWeight: '700', marginLeft: 4 }}>{item.clockIn || '--:--'}</Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />

      <View style={{ paddingTop: Math.max(insets.top, 20), paddingHorizontal: 20, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.goBack()}
            style={{
              backgroundColor: 'rgba(255,255,255,0.92)',
              width: 50, height: 50, borderRadius: 16,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={TEXT_PRIMARY} />
          </TouchableOpacity>
          <View style={{ backgroundColor: 'rgba(245,158,11,0.12)', width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
            <Image source={require('../../../assets/icons/calendar.png')} style={{ width: 28, height: 28 }} resizeMode="contain" />
          </View>
        </View>
        <View>
          <Text style={{ color: TEXT_PRIMARY, fontSize: 26, fontWeight: '700', letterSpacing: -0.5 }}>My Attendance</Text>
          <Text style={{ color: '#DB2777', fontSize: 14, fontWeight: '800' }}>Daily Records</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 20, flexDirection: 'row', gap: 10 }}>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.92)', flex: 1, padding: 16, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
          <Text style={{ fontSize: 24, fontWeight: '900', color: '#10B981' }}>{stats.present}</Text>
          <Text style={{ fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: TEXT_MUTED, marginTop: 4 }}>Present</Text>
        </View>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.92)', flex: 1, padding: 16, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
          <Text style={{ fontSize: 24, fontWeight: '900', color: '#EF4444' }}>{stats.absent}</Text>
          <Text style={{ fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: TEXT_MUTED, marginTop: 4 }}>Absent</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setShowPicker(true)}
          style={{ backgroundColor: 'rgba(255,255,255,0.92)', flex: 1.4, padding: 16, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}
        >
          <Text style={{ fontSize: 14, fontWeight: '800', color: TEXT_PRIMARY }}>{MONTHS[selectedMonth].substring(0, 3)} {selectedYear}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text style={{ fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: ACCENT }}>Change</Text>
            <MaterialCommunityIcons name="chevron-down" size={12} color={ACCENT} style={{ marginLeft: 2 }} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontWeight: '800', color: TEXT_PRIMARY, fontSize: 15 }}>Daily Records</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981', marginRight: 4 }} />
          <Text style={{ fontSize: 9, fontWeight: '700', color: TEXT_MUTED, marginRight: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{stats.percentage}%</Text>
          {loading && <ActivityIndicator color={ACCENT} size="small" />}
        </View>
      </View>

      <FlatList
        data={attendanceData}
        keyExtractor={(item) => item.day.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#F59E0B']} tintColor="#F59E0B" />
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 80, opacity: 0.3 }}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={64} color="#D1D5DB" />
            <Text style={{ fontWeight: '700', color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, fontSize: 11 }}>No Records</Text>
          </View>
        }
      />

      {showPicker && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 24 }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.98)', width: '100%', borderRadius: 24, padding: 24, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: TEXT_PRIMARY }}>Select Month & Year</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <MaterialCommunityIcons name="close" size={22} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {YEARS.map((year) => (
                <View key={year} style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: ACCENT, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, paddingHorizontal: 4 }}>{year}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {MONTHS.map((m, i) => (
                      <TouchableOpacity
                        key={m}
                        onPress={() => { setSelectedMonth(i); setSelectedYear(year); setShowPicker(false); }}
                        style={{ width: '31%', paddingVertical: 12, borderRadius: 12, marginBottom: 8, marginRight: '3.5%', alignItems: 'center', backgroundColor: selectedMonth === i && selectedYear === year ? ACCENT : 'rgba(243,244,246,0.9)' }}>
                        <Text style={{ fontWeight: '700', fontSize: 11, color: selectedMonth === i && selectedYear === year ? '#FFFFFF' : TEXT_SECONDARY }}>
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
