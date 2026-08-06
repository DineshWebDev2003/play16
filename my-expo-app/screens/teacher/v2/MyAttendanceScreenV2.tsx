import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
  Image, Dimensions, Modal, RefreshControl
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

const GLASS = {
  backgroundColor: 'rgba(255,255,255,0.92)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.6)',
};

export default function MyAttendanceScreenV2({ navigation }: Props) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  const fetchAttendance = useCallback(async (showIndicator = true) => {
    if (!user) return;
    try {
      if (showIndicator) setIsLoading(true);
      const response = await api.get(`/attendance?student_id=${user.id}&user_role=teacher`);
      setRecords(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      if (showIndicator) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const recordMap: Record<string, any> = {};
    records.forEach(r => { recordMap[r.date] = r; });

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dateObj = new Date(selectedYear, selectedMonth, day);
      dateObj.setHours(0, 0, 0, 0);
      const record = recordMap[dateStr];

      let derivedStatus = 'not_marked';
      if (record) derivedStatus = record.status;
      else if (dateObj.getTime() > today.getTime()) derivedStatus = 'upcoming';
      else if (dateObj.getTime() < today.getTime()) derivedStatus = 'absent';
      else derivedStatus = 'pending';

      result.push({
        day,
        dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
        date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: dateStr,
        status: derivedStatus,
        inTime: record?.in_time,
        outTime: record?.out_time
      });
    }
    return result;
  }, [selectedMonth, selectedYear, records]);

  const stats = useMemo(() => {
    const monthRecords = records.filter(r => {
      const [y, m] = r.date.split('-');
      return parseInt(y) === selectedYear && parseInt(m) === (selectedMonth + 1);
    });
    return {
      present: monthRecords.filter(r => r.status === 'present').length,
      late: monthRecords.filter(r => r.status === 'late').length,
      total: monthRecords.length
    };
  }, [selectedMonth, selectedYear, records]);

  const statusTileColor = (status: string) => {
    if (status === 'present') return { bg: 'rgba(34,197,94,0.12)', fg: '#16A34A' };
    if (status === 'absent') return { bg: 'rgba(239,68,68,0.12)', fg: '#DC2626' };
    if (status === 'late') return { bg: 'rgba(249,115,22,0.12)', fg: '#EA580C' };
    return { bg: '#F1F5F2', fg: '#B6C2BB' };
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />

      {/* Header */}
      <View style={{ paddingTop: Math.max(insets.top, 20), paddingHorizontal: 20, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <TouchableOpacity
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
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setShowMonthDropdown(true)}
            style={{
              backgroundColor: 'rgba(245,158,11,0.12)',
              width: 52, height: 52, borderRadius: 18,
              borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Image source={require('../../../assets/icons/calendar.png')} style={{ width: 28, height: 28 }} resizeMode="contain" />
          </TouchableOpacity>
        </View>
        <View>
          <Text style={{ color: TEXT_PRIMARY, fontSize: 26, fontWeight: '700', letterSpacing: -0.5 }}>My Duty</Text>
          <Text style={{ color: '#DB2777', fontSize: 14, fontWeight: '800' }}>Attendance 🛡️</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#F59E0B" colors={['#F59E0B']} />}
      >
        <View style={{ paddingHorizontal: 20 }}>
          {/* Stats Bar */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
            {[
              { label: 'Present', value: stats.present, color: '#22C55E', image: require('../../../assets/icons/exam-results.png') },
              { label: 'Late', value: stats.late, color: '#F97316', image: require('../../../assets/icons/calendar.png') },
              { label: 'Logged', value: stats.total, color: '#6366F1', image: require('../../../assets/icons/note-book.png') },
            ].map((item) => (
              <View key={item.label} style={{ flex: 1, marginHorizontal: 4, ...GLASS, borderRadius: BORDER_RADIUS, paddingVertical: 16, alignItems: 'center' }}>
                <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: item.color + '1F', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                  <Image source={item.image} style={{ width: 17, height: 17 }} resizeMode="contain" />
                </View>
                <Text style={{ color: item.color, fontSize: 22, fontWeight: '900' }}>{item.value}</Text>
                <Text style={{ color: TEXT_MUTED, fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* Month selector */}
          <TouchableOpacity
            onPress={() => setShowMonthDropdown(true)}
            activeOpacity={0.6}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 18 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: TEXT_PRIMARY }}>{MONTHS[selectedMonth]} {selectedYear}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" style={{ marginLeft: 6 }} />
            </View>
            <View style={{ backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)' }}>
              <Text style={{ color: ACCENT, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 }}>Monthly Pulse</Text>
            </View>
          </TouchableOpacity>

          {isLoading ? (
            <ActivityIndicator size="large" color="#F59E0B" style={{ marginTop: 50 }} />
          ) : (
            attendanceData.map((item, index) => {
              const tile = statusTileColor(item.status);
              const hasTimes = !!item.inTime || !!item.outTime;
              return (
                <View
                  key={index}
                  style={{ marginBottom: 14, padding: 16, borderRadius: BORDER_RADIUS, ...GLASS, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={{ width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 14, backgroundColor: tile.bg }}>
                      <Text style={{ color: tile.fg, fontSize: 19, fontWeight: '900' }}>{item.day}</Text>
                      <Text style={{ fontSize: 8, fontWeight: '800', color: TEXT_MUTED, textTransform: 'uppercase', marginTop: 1 }}>{item.dayName}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: TEXT_PRIMARY }}>{item.date}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                        {item.inTime && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                            <MaterialCommunityIcons name="clock-in" size={12} color="#10B981" />
                            <Text style={{ color: '#16A34A', fontSize: 10, fontWeight: '800', marginLeft: 4 }}>{item.inTime}</Text>
                          </View>
                        )}
                        {item.outTime && (
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <MaterialCommunityIcons name="clock-out" size={12} color="#EF4444" />
                            <Text style={{ color: '#DC2626', fontSize: 10, fontWeight: '800', marginLeft: 4 }}>{item.outTime}</Text>
                          </View>
                        )}
                        {!hasTimes && (
                          <Text style={{ color: TEXT_MUTED, fontSize: 9, fontWeight: '700', fontStyle: 'italic' }}>No records found</Text>
                        )}
                      </View>
                    </View>
                  </View>

                  <View style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 100,
                    backgroundColor: item.status === 'present' ? '#22C55E' : item.status === 'absent' ? '#EF4444' : item.status === 'late' ? '#F97316' : '#F1F5F2',
                  }}>
                    <Text style={{ color: item.status === 'not_marked' ? '#9CA3AF' : '#FFFFFF', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>
                      {item.status === 'not_marked' ? 'N/A' : item.status}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Month & Year Dropdown Overlay */}
      <Modal visible={showMonthDropdown} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,20,0.7)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <View style={{ width: '100%', borderRadius: BORDER_RADIUS, ...GLASS, backgroundColor: 'rgba(255,255,255,0.97)', padding: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: TEXT_PRIMARY, marginBottom: 24, textAlign: 'center' }}>Select Period</Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <TouchableOpacity
                onPress={() => setSelectedYear(selectedYear - 1)}
                style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#F1F5F2', alignItems: 'center', justifyContent: 'center' }}
              >
                <MaterialCommunityIcons name="chevron-left" size={24} color="#4B5563" />
              </TouchableOpacity>
              <Text style={{ fontSize: 20, fontWeight: '900', color: TEXT_PRIMARY, marginHorizontal: 22 }}>{selectedYear}</Text>
              <TouchableOpacity
                onPress={() => setSelectedYear(selectedYear + 1)}
                style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#F1F5F2', alignItems: 'center', justifyContent: 'center' }}
              >
                <MaterialCommunityIcons name="chevron-right" size={24} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {MONTHS.map((m, i) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => { setSelectedMonth(i); setShowMonthDropdown(false); }}
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
                  <Text style={{ color: selectedMonth === i ? '#FFFFFF' : '#6B7280', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              onPress={() => setShowMonthDropdown(false)}
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
