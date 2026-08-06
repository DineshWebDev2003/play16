import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, Modal, ActivityIndicator, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import GlassDropdown from './GlassDropdown';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const BORDER_RADIUS = 22;
const INDIGO = '#6366F1';
const INDIGO_DARK = '#4F46E5';
const GREEN = '#10B981';
const RED = '#EF4444';
const AMBER = '#F59E0B';

const TEACHER_ICON = require('../../../assets/icons/teacher.png');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];

const getBranchName = (branchId: string | undefined | null, branches: any[]): string => {
  if (!branchId) return 'X';
  const branch = branches.find(b => b.id?.toString() === branchId.toString());
  return branch?.name || 'X';
};

const generateStaffId = (branchName: string): string => {
  const branchLetter = branchName ? branchName.charAt(0).toUpperCase() : 'X';
  const year = new Date().getFullYear().toString().slice(-2);
  return `tnhk${branchLetter}t${year}`;
};

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

// ─── Aurora Glass background layer ─────────────────────────────────────────────
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

const MonthlyRecordCard = React.memo(({ record }: { record: any }) => {
  const accent = record.status === 'present' ? GREEN : record.status === 'absent' ? RED : '#9CA3AF';
  return (
    <View style={{ borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', padding: 14, marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: accent + '16', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Text style={{ color: accent, fontWeight: '900', fontSize: 15 }}>{record.day}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: TEXT_PRIMARY }}>{record.dayName}, {record.date}</Text>
            <View style={{ alignSelf: 'flex-start', backgroundColor: accent + '14', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 3 }}>
              <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, color: accent }}>
                {record.status.replace('_', ' ')}
              </Text>
            </View>
          </View>
        </View>
        {record.status === 'present' && (
          <View style={{ alignItems: 'flex-end' }}>
            {record.clockIn && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="login-variant" size={10} color={GREEN} />
                <Text style={{ fontSize: 9, fontWeight: '900', color: GREEN, marginLeft: 3 }}>IN: {record.clockIn}</Text>
              </View>
            )}
            {record.clockOut && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                <MaterialCommunityIcons name="logout-variant" size={10} color={AMBER} />
                <Text style={{ fontSize: 9, fontWeight: '900', color: AMBER, marginLeft: 3 }}>OUT: {record.clockOut}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
});

interface Props { navigation: { navigate: (s: string, params?: any) => void; goBack: () => void } }

export default function TeacherAttendanceReportScreenV2({ navigation }: Props) {
  const { user: authUser, users, branches } = useAuth();
  const insets = useSafeAreaInsets();

  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyRecords, setMonthlyRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [branchFilterId, setBranchFilterId] = useState<string | null>(null);

  const isAdminUser = authUser?.role === 'master_admin' || authUser?.role === 'admin';

  const teachers = useMemo(() => {
    let filtered = users.filter(u => u.role === 'teacher');
    if (branchFilterId) filtered = filtered.filter(u => u.branch_id?.toString() === branchFilterId);
    return filtered;
  }, [users, branchFilterId]);

  const fetchMonthlyRecords = useCallback(async (teacherId: string) => {
    try {
      setIsLoading(true);
      const response = await api.get(`/attendance?student_id=${teacherId}&user_role=teacher`);
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
        });
      }
      setMonthlyRecords(records);
    } catch (error) {
      console.error('Error fetching teacher records:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (selectedTeacher) fetchMonthlyRecords(selectedTeacher.id);
  }, [selectedTeacher, selectedMonth, selectedYear, fetchMonthlyRecords]);

  const stats = useMemo(() => {
    const present = monthlyRecords.filter(r => r.status === 'present').length;
    const absent = monthlyRecords.filter(r => r.status === 'absent').length;
    const late = monthlyRecords.filter(r => r.status === 'late').length;
    return { present, absent, late, total: monthlyRecords.filter(r => r.status !== 'not_marked').length };
  }, [monthlyRecords]);

  const selectedStaffId = selectedTeacher
    ? generateStaffId(getBranchName(selectedTeacher.branch_id, branches))
    : '';

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />

      <FlatList
        data={monthlyRecords}
        keyExtractor={(item) => item.day.toString()}
        initialNumToRender={15}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        ListHeaderComponent={
          <>
            {/* ── Header ── */}
            <View style={{ paddingTop: Math.max(insets.top, 56) }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY }}>‹</Text>
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ fontSize: 12, fontWeight: '400', color: TEXT_MUTED }}>Staff Attendance</Text>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 2, letterSpacing: -0.5 }}>Attendance</Text>
                </View>
                <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                  <Image source={TEACHER_ICON} style={{ width: 46, height: 46 }} resizeMode="contain" />
                </View>
              </View>

              {isAdminUser && (
                <View style={{ marginTop: 20 }}>
                  <GlassDropdown selectedBranchId={branchFilterId} onSelect={setBranchFilterId} icon={TEACHER_ICON} />
                </View>
              )}
            </View>

            {/* ── Teacher selector ── */}
            <View style={{ marginTop: 20 }}>
              <TouchableOpacity
                onPress={() => setShowTeacherDropdown(true)}
                activeOpacity={0.85}
                style={{ borderRadius: BORDER_RADIUS, overflow: 'hidden' }}
              >
                <LinearGradient colors={[INDIGO, INDIGO_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 18, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                    <MaterialCommunityIcons name="account-search" size={26} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1.5 }}>Selected Staff</Text>
                    <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: '900', color: '#FFFFFF', marginTop: 3 }}>
                      {selectedTeacher?.name || 'Tap to select teacher'}
                    </Text>
                    {selectedTeacher && (
                      <Text style={{ fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 3 }}>
                        {selectedStaffId}
                      </Text>
                    )}
                  </View>
                  <MaterialCommunityIcons name="chevron-down" size={24} color="rgba(255,255,255,0.7)" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* ── Empty state / content ── */}
            {!selectedTeacher ? (
              <View style={{ alignItems: 'center', paddingVertical: 56 }}>
                <Image source={TEACHER_ICON} style={{ width: 72, height: 72, opacity: 0.25 }} resizeMode="contain" />
                <Text style={{ fontSize: 16, fontWeight: '800', color: TEXT_PRIMARY, marginTop: 14 }}>Select a Teacher</Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 5 }}>Choose from the directory above</Text>
              </View>
            ) : (
              <>
                {/* ── Stats summary ── */}
                <View style={{ flexDirection: 'row', borderRadius: BORDER_RADIUS, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', padding: 16, marginBottom: 14 }}>
                  {[
                    { label: 'Present', value: stats.present, color: GREEN },
                    { label: 'Absent', value: stats.absent, color: RED },
                    { label: 'Late', value: stats.late, color: AMBER },
                  ].map((item, i) => (
                    <View key={item.label} style={{ flex: 1, alignItems: 'center', borderRightWidth: i < 2 ? 1 : 0, borderRightColor: 'rgba(31,45,40,0.08)' }}>
                      <Text style={{ fontSize: 22, fontWeight: '900', color: item.color }}>{item.value}</Text>
                      <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: TEXT_MUTED, marginTop: 3 }}>{item.label}</Text>
                    </View>
                  ))}
                </View>

                {/* ── Month / Year pills ── */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <TouchableOpacity onPress={() => setShowMonthSelector(true)} activeOpacity={0.8} style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 6, backgroundColor: 'rgba(99,102,241,0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100 }}>
                    <MaterialCommunityIcons name="calendar-month" size={14} color={INDIGO} />
                    <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: INDIGO, marginLeft: 6 }}>{MONTHS[selectedMonth]}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowYearSelector(true)} activeOpacity={0.8} style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 6, backgroundColor: 'rgba(99,102,241,0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100 }}>
                    <MaterialCommunityIcons name="calendar-range" size={14} color={INDIGO} />
                    <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: INDIGO, marginLeft: 6 }}>{selectedYear}</Text>
                  </TouchableOpacity>
                </View>

                {isLoading && (
                  <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                    <ActivityIndicator color={INDIGO} />
                  </View>
                )}
              </>
            )}
          </>
        }
        renderItem={({ item }) => <MonthlyRecordCard record={item} />}
        ListEmptyComponent={
          selectedTeacher ? (
            !isLoading ? (
              <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                <MaterialCommunityIcons name="calendar-blank-outline" size={56} color={TEXT_MUTED} style={{ opacity: 0.3 }} />
                <Text style={{ marginTop: 12, fontWeight: '800', fontSize: 14, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1.5 }}>No records marked</Text>
              </View>
            ) : null
          ) : null
        }
      />

      {/* ── Teacher selection modal ── */}
      <Modal visible={showTeacherDropdown} transparent animationType="fade" onRequestClose={() => setShowTeacherDropdown(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,20,0.45)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
          <View style={{ width: SCREEN_WIDTH - 40, maxWidth: 440, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.96)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', padding: 22, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: 'rgba(99,102,241,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="account-group" size={26} color={INDIGO} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY }}>Select Teacher</Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: TEXT_MUTED, marginTop: 2 }}>{teachers.length} staff in directory</Text>
              </View>
              <TouchableOpacity onPress={() => setShowTeacherDropdown(false)} activeOpacity={0.8} style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 15, color: TEXT_PRIMARY, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={teachers}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 6 }}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <MaterialCommunityIcons name="account-search-outline" size={52} color={TEXT_MUTED} style={{ opacity: 0.3 }} />
                  <Text style={{ marginTop: 10, fontWeight: '800', fontSize: 13, color: TEXT_MUTED }}>No teachers found</Text>
                </View>
              }
              renderItem={({ item }) => {
                const isSelected = selectedTeacher?.id === item.id;
                const staffId = generateStaffId(getBranchName(item.branch_id, branches));
                return (
                  <TouchableOpacity
                    onPress={() => { setSelectedTeacher(item); setShowTeacherDropdown(false); }}
                    activeOpacity={0.8}
                    style={{
                      padding: 14,
                      borderRadius: 18,
                      marginBottom: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: isSelected ? 'rgba(99,102,241,0.45)' : 'rgba(31,45,40,0.08)',
                      backgroundColor: isSelected ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.85)',
                    }}
                  >
                    <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: isSelected ? INDIGO : 'rgba(99,102,241,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <MaterialCommunityIcons name="account" size={24} color={isSelected ? '#FFFFFF' : INDIGO} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '800', color: TEXT_PRIMARY }}>{item.name}</Text>
                      <Text style={{ fontSize: 9, fontWeight: '900', color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, marginTop: 3 }}>{staffId}</Text>
                    </View>
                    {isSelected && <MaterialCommunityIcons name="check-circle" size={20} color={INDIGO} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* ── Month selector ── */}
      <Modal visible={showMonthSelector} transparent animationType="fade" onRequestClose={() => setShowMonthSelector(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,20,0.45)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
          <View style={{ width: SCREEN_WIDTH - 40, maxWidth: 440, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.96)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', padding: 22 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY, textAlign: 'center', marginBottom: 18 }}>Select Month</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {MONTHS.map((m, i) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => { setSelectedMonth(i); setShowMonthSelector(false); }}
                  style={{ width: '48%', paddingVertical: 14, borderRadius: 14, marginBottom: 8, alignItems: 'center', backgroundColor: selectedMonth === i ? 'rgba(99,102,241,0.12)' : 'rgba(247,249,246,0.95)' }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: selectedMonth === i ? INDIGO_DARK : TEXT_SECONDARY }}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Year selector ── */}
      <Modal visible={showYearSelector} transparent animationType="fade" onRequestClose={() => setShowYearSelector(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,20,0.45)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
          <View style={{ width: SCREEN_WIDTH - 40, maxWidth: 440, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.96)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', padding: 22 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY, textAlign: 'center', marginBottom: 18 }}>Select Year</Text>
            <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {YEARS.map((y) => (
                  <TouchableOpacity
                    key={y}
                    onPress={() => { setSelectedYear(y); setShowYearSelector(false); }}
                    style={{ width: '48%', paddingVertical: 14, borderRadius: 14, marginBottom: 8, alignItems: 'center', backgroundColor: selectedYear === y ? 'rgba(99,102,241,0.12)' : 'rgba(247,249,246,0.95)' }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '900', color: selectedYear === y ? INDIGO_DARK : TEXT_SECONDARY }}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
