import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
  Image, Dimensions, Modal, TextInput, RefreshControl
} from 'react-native';
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

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

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
          style={[StyleSheet.absoluteFill, { transform: [{ rotate: deg + 'deg' }] }]}
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

const GLASS = {
  backgroundColor: 'rgba(255,255,255,0.92)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.6)',
};

export default function StudentAttendanceReportScreenV2({ navigation }: Props) {
  const { users } = useAuth();
  const insets = useSafeAreaInsets();

  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyRecords, setMonthlyRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const students = useMemo(() => {
    const list = users.filter(u => u.role === 'student' || u.role === 'tuition_student');
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(s => s.name.toLowerCase().includes(q) || (s.studentId && s.studentId.toLowerCase().includes(q)));
  }, [users, searchQuery]);

  const fetchMonthlyRecords = useCallback(async (studentId: string) => {
    try {
      setIsLoading(true);
      const response = await api.get(`/attendance?student_id=${studentId}&user_role=student`);
      const data = response.data;

      const attendanceMap: Record<string, any> = {};
      data.forEach((r: any) => { attendanceMap[r.date] = r; });

      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const records = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayRecord = attendanceMap[dateStr];
        const dateObj = new Date(selectedYear, selectedMonth, day);

        records.push({
          day,
          dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
          date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          status: dayRecord?.status || 'not_marked',
          clockIn: dayRecord?.in_time,
          clockOut: dayRecord?.out_time,
          clockInBy: dayRecord?.dropped_by_type,
          clockOutBy: dayRecord?.picked_by_type
        });
      }
      setMonthlyRecords(records);
    } catch (error) {
      console.error('Error fetching monthly records:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (selectedStudent) fetchMonthlyRecords(selectedStudent.id);
  }, [selectedStudent, selectedMonth, selectedYear, fetchMonthlyRecords]);

  const stats = useMemo(() => {
    const valid = monthlyRecords.filter(r => r.status !== 'not_marked');
    return {
      present: valid.filter(r => r.status === 'present').length,
      absent: valid.filter(r => r.status === 'absent').length,
      late: valid.filter(r => r.status === 'late').length,
      total: valid.length
    };
  }, [monthlyRecords]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (selectedStudent) {
        await fetchMonthlyRecords(selectedStudent.id);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedStudent, fetchMonthlyRecords]);

  const statusTile = (status: string) => {
    if (status === 'present') return { bg: 'rgba(34,197,94,0.12)', fg: '#16A34A' };
    if (status === 'absent') return { bg: 'rgba(239,68,68,0.12)', fg: '#DC2626' };
    if (status === 'late') return { bg: 'rgba(249,115,22,0.12)', fg: '#EA580C' };
    return { bg: '#F1F5F2', fg: '#B6C2BB' };
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#F59E0B" colors={['#F59E0B']} />}
      >
        <View style={{ paddingTop: Math.max(insets.top, 20), paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => selectedStudent ? setSelectedStudent(null) : navigation.goBack()}
              style={{ width: 50, height: 50, borderRadius: 16, ...GLASS, alignItems: 'center', justifyContent: 'center' }}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={TEXT_PRIMARY} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontSize: 26, fontWeight: '700', color: TEXT_PRIMARY }}>Roster</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#DB2777', marginTop: 1 }}>Analytics</Text>
            </View>
            <View style={{ width: 50, height: 50, borderRadius: 16, ...GLASS, alignItems: 'center', justifyContent: 'center' }}>
              <Image source={require('../../../assets/icons/database.png')} style={{ width: 30, height: 30 }} resizeMode="contain" />
            </View>
          </View>

          <View style={{ height: SECTION_GAP }} />

          {!selectedStudent ? (
            <View>
              <View style={{ padding: 16, ...GLASS, borderRadius: 22, flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <MaterialCommunityIcons name="magnify" size={24} color="#9CA3AF" />
                <TextInput
                  style={{ flex: 1, marginLeft: 12, fontWeight: '700', fontSize: 15, color: TEXT_PRIMARY, paddingVertical: 0 }}
                  placeholder="Search student name..."
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {students.length === 0 && (
                <View style={{ alignItems: 'center', justifyContent: 'center', opacity: 0.3, marginTop: 40 }}>
                  <MaterialCommunityIcons name="account-search-outline" size={80} color={TEXT_PRIMARY} />
                  <Text style={{ color: TEXT_PRIMARY, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 5, marginTop: 16, fontSize: 12 }}>No Students Found</Text>
                </View>
              )}

              {students.map((item) => (
                <TouchableOpacity
                  key={item.id.toString()}
                  activeOpacity={0.85}
                  onPress={() => setSelectedStudent(item)}
                  style={{ padding: 16, borderRadius: BORDER_RADIUS, ...GLASS, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}
                >
                  <View style={{ width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 14, backgroundColor: 'rgba(99,102,241,0.1)', overflow: 'hidden' }}>
                    {item.avatar ? (
                      <Image source={{ uri: item.avatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <MaterialCommunityIcons name="account-child-outline" size={30} color="#6366F1" />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.3 }}>{item.name}</Text>
                    <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: TEXT_MUTED, marginTop: 3 }}>ID: {item.studentId || item.id}</Text>
                  </View>
                  <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: '#F1F5F2', alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={TEXT_MUTED} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View>
              <LinearGradient
                colors={['#F472B6', '#DB2777']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: BORDER_RADIUS, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 28, overflow: 'hidden' }}
              >
                <View style={{ width: 60, height: 60, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}>
                  <MaterialCommunityIcons name="badge-account-horizontal-outline" size={32} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '800', letterSpacing: -0.5 }}>{selectedStudent.name}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '900', textTransform: 'uppercase', fontSize: 10, letterSpacing: 1.5, marginTop: 3 }}>Growth Analytics · {MONTHS[selectedMonth]}</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setShowMonthSelector(true)}
                  style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}
                >
                  <MaterialCommunityIcons name="calendar-month-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={{ position: 'absolute', bottom: -30, right: -20, opacity: 0.1 }}>
                  <MaterialCommunityIcons name="school-outline" size={140} color="#FFFFFF" />
                </View>
              </LinearGradient>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SECTION_GAP }}>
                {[
                  { label: 'Present', value: stats.present, color: '#16A34A', image: require('../../../assets/icons/exam-results.png') },
                  { label: 'Absent', value: stats.absent, color: '#DC2626', image: require('../../../assets/icons/error.png') },
                  { label: 'Late', value: stats.late, color: '#EA580C', image: require('../../../assets/icons/calendar.png') },
                ].map((item) => (
                  <View key={item.label} style={{ flex: 1, marginHorizontal: 4, ...GLASS, borderRadius: 22, paddingVertical: 16, alignItems: 'center' }}>
                    <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: item.color + '1F', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                      <Image source={item.image} style={{ width: 17, height: 17 }} resizeMode="contain" />
                    </View>
                    <Text style={{ color: item.color, fontSize: 22, fontWeight: '900' }}>{item.value}</Text>
                    <Text style={{ color: TEXT_MUTED, fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{item.label}</Text>
                  </View>
                ))}
              </View>

              {isLoading ? (
                <ActivityIndicator size="large" color="#F59E0B" style={{ marginTop: 50 }} />
              ) : (
                monthlyRecords.map((item) => {
                  const tile = statusTile(item.status);
                  return (
                    <View
                      key={item.day}
                      style={{ padding: 16, borderRadius: BORDER_RADIUS, ...GLASS, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}
                    >
                      <View style={{ width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 14, backgroundColor: tile.bg }}>
                        <Text style={{ color: tile.fg, fontSize: 19, fontWeight: '900' }}>{item.day}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: TEXT_PRIMARY, textTransform: 'capitalize' }}>{item.dayName}, {item.date}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, marginRight: 8, backgroundColor: item.status === 'present' ? '#22C55E' : item.status === 'absent' ? '#EF4444' : '#9CA3AF' }} />
                          <Text style={{
                            fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1,
                            color: item.status === 'present' ? '#16A34A' : item.status === 'absent' ? '#DC2626' : item.status === 'late' ? '#EA580C' : TEXT_MUTED
                          }}>
                            {item.status.replace('_', ' ')}
                          </Text>
                        </View>
                      </View>
                      {item.status === 'present' && (
                        <View style={{ alignItems: 'flex-end', backgroundColor: '#F1F5F2', borderRadius: 16, paddingVertical: 8, paddingHorizontal: 12 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <MaterialCommunityIcons name="clock-in" size={11} color="#10B981" />
                            <Text style={{ color: '#16A34A', fontSize: 9, fontWeight: '900', marginLeft: 4 }}>{item.clockIn}</Text>
                          </View>
                          {item.clockOut && (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <MaterialCommunityIcons name="clock-out" size={11} color="#F59E0B" />
                              <Text style={{ color: '#DB2777', fontSize: 9, fontWeight: '900', marginLeft: 4 }}>{item.clockOut}</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={showMonthSelector} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,20,0.7)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <View style={{ width: '100%', borderRadius: 28, ...GLASS, backgroundColor: 'rgba(255,255,255,0.97)', padding: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: TEXT_PRIMARY, marginBottom: 24, textAlign: 'center' }}>Select Reporting Window</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {MONTHS.map((m, i) => (
                <TouchableOpacity
                  key={m}
                  activeOpacity={0.85}
                  onPress={() => { setSelectedMonth(i); setShowMonthSelector(false); }}
                  style={{
                    width: '48%',
                    paddingVertical: 14,
                    borderRadius: 22,
                    marginBottom: 14,
                    alignItems: 'center',
                    borderWidth: 2,
                    backgroundColor: selectedMonth === i ? '#F59E0B' : '#F1F5F2',
                    borderColor: selectedMonth === i ? '#F59E0B' : '#F1F5F2',
                  }}
                >
                  <Text style={{ color: selectedMonth === i ? '#FFFFFF' : TEXT_SECONDARY, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowMonthSelector(false)}
              style={{ marginTop: 8, backgroundColor: '#F1F5F2', paddingVertical: 16, borderRadius: 22, alignItems: 'center' }}
            >
              <Text style={{ color: TEXT_MUTED, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, fontSize: 12 }}>Close Panel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
