import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, Image, ActivityIndicator, FlatList, ScrollView, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../services/api';
import BranchFilter from '../../components/BranchFilter';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];

const getBranchName = (branchId: string | undefined | null, branches: any[]): string => {
  if (!branchId) return 'X';
  const branch = branches.find(b => b.id?.toString() === branchId.toString());
  return branch?.name || 'X';
};

const generateStaffId = (branchName: string, role: string): string => {
  const branchLetter = branchName ? branchName.charAt(0).toUpperCase() : 'X';
  const year = new Date().getFullYear().toString().slice(-2);
  const roleLetter = role === 'teacher' ? 't' : 's';
  return `tnhk${branchLetter}${roleLetter}${year}`;
};

export default function TeacherAttendanceReportScreen({ navigation }: Props) {
  const { colors, theme: appTheme } = useTheme();
  const { users, branches, user: authUser } = useAuth();
  const insets = useSafeAreaInsets();
  const isDark = appTheme === 'dark';

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
    if (branchFilterId) {
      filtered = filtered.filter(u => u.branch_id?.toString() === branchFilterId);
    }
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
          remarks: dayRecord?.remarks
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

  const selectedBranch = authUser?.branch?.name || '';

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFFFFF' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: Math.max(insets.top, 50), paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, color: isDark ? '#D1D5DB' : '#6B7280' }}>
                Staff Attendance
              </Text>
              <Text style={{ fontSize: 32, fontWeight: '900', letterSpacing: -0.5, marginTop: 2, color: isDark ? '#FFFFFF' : '#111827' }}>
                Attendance
              </Text>
            </View>
            <View style={{ backgroundColor: '#EC4899', width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', elevation: 10, shadowColor: '#EC4899', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12 }}>
              <MaterialCommunityIcons name="account-tie" size={36} color="white" />
            </View>
          </View>
          {isAdminUser && (
            <View style={{ marginTop: 16 }}>
              <BranchFilter selectedBranchId={branchFilterId} onSelect={setBranchFilterId} />
            </View>
          )}
        </View>

        {/* Teacher Selector */}
        <View style={{ paddingHorizontal: 24, paddingVertical: 12 }}>
          <TouchableOpacity
            onPress={() => setShowTeacherDropdown(true)}
            activeOpacity={0.8}
            style={{ marginBottom: 12, borderRadius: 16, overflow: 'hidden', elevation: 8 }}
          >
            <View style={{ backgroundColor: '#6366F1', padding: 20, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                <MaterialCommunityIcons name="account-search" size={26} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>Selected Staff</Text>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFFFFF', marginTop: 2 }}>{selectedTeacher?.name || 'Tap to select teacher'}</Text>
                {selectedTeacher && (
                  <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>
                    {generateStaffId(getBranchName(selectedTeacher.branch_id, branches), 'teacher')}
                  </Text>
                )}
              </View>
              <MaterialCommunityIcons name="chevron-down" size={24} color="rgba(255,255,255,0.6)" />
            </View>
          </TouchableOpacity>
        </View>

        {!selectedTeacher ? (
          <View style={{ paddingHorizontal: 24, paddingVertical: 40, alignItems: 'center' }}>
            <MaterialCommunityIcons name="account-search-outline" size={80} color={isDark ? '#333' : '#E5E7EB'} />
            <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#FFFFFF' : '#111827', marginTop: 16, textAlign: 'center' }}>Select a Teacher</Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', textAlign: 'center', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Choose from the directory above</Text>
          </View>
        ) : (
          <>
            {/* Stats Summary */}
            <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {[
                  { label: 'Present', value: stats.present, color: '#10B981' },
                  { label: 'Absent', value: stats.absent, color: '#EF4444' },
                  { label: 'Late', value: stats.late, color: '#F59E0B' },
                ].map((item, i) => (
                  <View key={item.label} style={{ flex: 1, alignItems: 'center', marginHorizontal: 4, backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF', borderRadius: 20, padding: 16, elevation: 5, borderWidth: 1, borderColor: isDark ? '#262626' : '#F3F4F6' }}>
                    <Text style={{ fontSize: 24, fontWeight: '900', color: item.color }}>{item.value}</Text>
                    <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 4 }}>{item.label}</Text>
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 12 }}>
                <TouchableOpacity onPress={() => setShowMonthSelector(true)} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, backgroundColor: 'rgba(99,102,241,0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100 }}>
                  <MaterialCommunityIcons name="calendar-month" size={14} color="#6366F1" />
                  <Text style={{ color: '#6366F1', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 6 }}>{MONTHS[selectedMonth]}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowYearSelector(true)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(99,102,241,0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100 }}>
                  <MaterialCommunityIcons name="calendar-range" size={14} color="#6366F1" />
                  <Text style={{ color: '#6366F1', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 6 }}>{selectedYear}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Records */}
            <View style={{ paddingHorizontal: 24 }}>
              {isLoading ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <ActivityIndicator size="large" color="#6366F1" />
                </View>
              ) : (
                monthlyRecords.map((item, index) => (
                  <View key={index} style={{ backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 10, elevation: 5, borderWidth: 1, borderColor: isDark ? '#262626' : '#F3F4F6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ backgroundColor: item.status === 'present' ? '#10B981' : (item.status === 'absent' ? '#EF4444' : (isDark ? '#333' : '#E5E7EB')), width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                        <Text style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>{item.day}</Text>
                      </View>
                      <View>
                        <Text style={{ fontSize: 14, fontWeight: '900', color: isDark ? '#FFFFFF' : '#111827' }}>{item.dayName}, {item.date}</Text>
                        <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: item.status === 'present' ? '#10B981' : (item.status === 'absent' ? '#EF4444' : '#9CA3AF'), marginTop: 2 }}>
                          {item.status.replace('_', ' ')}
                        </Text>
                      </View>
                    </View>
                    {item.status === 'present' && (
                      <View style={{ alignItems: 'flex-end', backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 }}>
                        {item.clockIn && <Text style={{ fontSize: 9, fontWeight: '900', color: '#10B981', textTransform: 'uppercase' }}>IN: {item.clockIn}</Text>}
                        {item.clockOut && <Text style={{ fontSize: 9, fontWeight: '900', color: '#F59E0B', textTransform: 'uppercase', marginTop: 2 }}>OUT: {item.clockOut}</Text>}
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          </>
        )}

        <View style={{ height: 128 }} />
      </ScrollView>

      {/* Teacher Selection Modal */}
      <Modal visible={showTeacherDropdown} transparent animationType="slide" onRequestClose={() => setShowTeacherDropdown(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowTeacherDropdown(false)} />
          <View style={{ backgroundColor: isDark ? '#1c1c14' : '#FFFFFF', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 24, maxHeight: '70%' }}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{ width: 40, height: 4, backgroundColor: isDark ? '#525252' : '#D1D5DB', borderRadius: 2, marginBottom: 16 }} />
              <Text style={{ fontSize: 22, fontWeight: '900', color: isDark ? '#FFFFFF' : '#111827' }}>Select Teacher</Text>
            </View>
            <FlatList
              data={teachers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => {
                const staffId = generateStaffId(getBranchName(item.branch_id, branches), 'teacher');
                return (
                  <TouchableOpacity
                    onPress={() => { setSelectedTeacher(item); setShowTeacherDropdown(false); }}
                    activeOpacity={0.8}
                    style={{ padding: 16, borderRadius: 24, marginBottom: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: selectedTeacher?.id === item.id ? '#6366F1' : (isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB') }}
                  >
                    <View style={{ backgroundColor: selectedTeacher?.id === item.id ? 'rgba(255,255,255,0.2)' : 'rgba(99,102,241,0.1)', width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                      <MaterialCommunityIcons name="account" size={24} color={selectedTeacher?.id === item.id ? 'white' : '#6366F1'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '900', color: selectedTeacher?.id === item.id ? '#FFFFFF' : (isDark ? '#FFFFFF' : '#111827') }}>{item.name}</Text>
                      <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: selectedTeacher?.id === item.id ? 'rgba(255,255,255,0.6)' : (isDark ? '#9CA3AF' : '#6B7280'), marginTop: 2 }}>{staffId}</Text>
                    </View>
                    {selectedTeacher?.id === item.id && <MaterialCommunityIcons name="check-circle" size={20} color="white" />}
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* Month Selector */}
      {showMonthSelector && (
        <View style={{ position: 'absolute', inset: 0, zIndex: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 24 }}>
          <View style={{ backgroundColor: isDark ? '#1c1c14' : '#FFFFFF', width: '100%', borderRadius: 45, padding: 24 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: isDark ? '#FFFFFF' : '#111827', textAlign: 'center', marginBottom: 20 }}>Select Month</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {MONTHS.map((m, i) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => { setSelectedMonth(i); setShowMonthSelector(false); }}
                  style={{ width: '48%', paddingVertical: 16, borderRadius: 16, marginBottom: 8, alignItems: 'center', backgroundColor: selectedMonth === i ? '#6366F1' : (isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB') }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: selectedMonth === i ? '#FFFFFF' : (isDark ? '#FFFFFF' : '#111827') }}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Year Selector */}
      {showYearSelector && (
        <View style={{ position: 'absolute', inset: 0, zIndex: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 24 }}>
          <View style={{ backgroundColor: isDark ? '#1c1c14' : '#FFFFFF', width: '100%', borderRadius: 45, padding: 24 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: isDark ? '#FFFFFF' : '#111827', textAlign: 'center', marginBottom: 20 }}>Select Year</Text>
            <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {YEARS.map((y) => (
                  <TouchableOpacity
                    key={y}
                    onPress={() => { setSelectedYear(y); setShowYearSelector(false); }}
                    style={{ width: '48%', paddingVertical: 16, borderRadius: 16, marginBottom: 8, alignItems: 'center', backgroundColor: selectedYear === y ? '#6366F1' : (isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB') }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '900', color: selectedYear === y ? '#FFFFFF' : (isDark ? '#FFFFFF' : '#111827') }}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}
