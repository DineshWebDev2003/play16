import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { getMediaUrl } from '../../services/api';

interface Props { navigation: { navigate: (s: string) => void; goBack: () => void } }

type AttendanceStatus = 'present' | 'absent' | null;
type ViewMode = 'day' | 'month';

const STORAGE_KEY = 'tuition_attendance_cache';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatLocalDate = (d: Date | undefined) => {
  if (!d || isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function TuitionAttendanceScreen({ navigation }: Props) {
  const { user, users } = useAuth();
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = theme === 'dark';

  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState(today);
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [attendanceMap, setAttendanceMap] = useState<Record<string, Record<string, { status: AttendanceStatus; inTime?: string; synced: boolean }>>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [monthData, setMonthData] = useState<Record<string, { present: number; absent: number; total: number }>>({});
  const [monthLoading, setMonthLoading] = useState(false);
  const [showViewDropdown, setShowViewDropdown] = useState(false);

  const isToday = selectedDate === today;

  const tuitionStudents = useMemo(() =>
    users.filter((u: any) =>
      u.role === 'tuition_student' &&
      u.status === 'active' &&
      (!user?.branch_id || u.branch_id === user.branch_id)
    ),
  [users, user?.branch_id]);

  const isAdminOrMaster = user?.role === 'admin' || user?.role === 'master_admin';

  const loadCachedAttendance = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setAttendanceMap(parsed);
      }
    } catch {}
  }, []);

  const saveCache = useCallback(async (map: any) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch {}
  }, []);

  const fetchAttendanceForDate = useCallback(async (date: string) => {
    try {
      const res = await api.get(`/attendance?date=${date}&user_role=tuition_student`);
      const records: any[] = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      return records;
    } catch { return []; }
  }, []);

  const fetchMonthSummary = useCallback(async (year: number, month: number) => {
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dateFrom = `${monthStr}-01`;
    const dateTo = `${monthStr}-${String(daysInMonth).padStart(2, '0')}`;
    const summary: Record<string, { present: number; absent: number; total: number }> = {};

    setMonthLoading(true);
    try {
      const res = await api.get(`/attendance?user_role=tuition_student&date_from=${dateFrom}&date_to=${dateTo}`);
      const allRecords: any[] = res.data?.data || (Array.isArray(res.data) ? res.data : []);

      const students = tuitionStudents;
      const idSet = new Set(students.map(s => s.id?.toString()));
      for (const r of allRecords) {
        const sid = r.student_id?.toString();
        if (!sid || !idSet.has(sid)) continue;
        const date = r.date;
        if (!date || !date.startsWith(monthStr)) continue;
        if (!summary[date]) summary[date] = { present: 0, absent: 0, total: 0 };
        summary[date].total++;
        if (r.status === 'present') summary[date].present++;
        else summary[date].absent++;
      }
      setMonthData(summary);
    } catch {}
    setMonthLoading(false);
  }, [tuitionStudents]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadCachedAttendance();
      const records = await fetchAttendanceForDate(today);
      setAttendanceMap(prev => {
        const next = { ...prev };
        if (!next[today]) next[today] = {};
        tuitionStudents.forEach(s => {
          const record = records.find((r: any) => r.student_id?.toString() === s.id.toString());
          if (record) {
            next[today][s.id] = {
              status: record.status as AttendanceStatus,
              inTime: record.in_time || undefined,
              synced: true,
            };
          }
        });
        saveCache(next);
        return next;
      });

      const now = new Date();
      await fetchMonthSummary(now.getFullYear(), now.getMonth());
      setLoading(false);
    })();
  }, []);

  const toggleAttendance = useCallback(async (studentId: string) => {
    if (!isToday) {
      Alert.alert('Restricted', 'You can only mark attendance for today.');
      return;
    }

    const current = attendanceMap[today]?.[studentId]?.status || null;
    const newStatus: AttendanceStatus = current === 'present' ? 'absent' : 'present';

    setAttendanceMap(prev => {
      const next = { ...prev };
      if (!next[today]) next[today] = {};
      next[today] = {
        ...next[today],
        [studentId]: {
          status: newStatus,
          inTime: newStatus === 'present' ? (next[today][studentId]?.inTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })) : undefined,
          synced: false,
        },
      };
      saveCache(next);
      return next;
    });

    setSavingId(studentId);
    try {
      await api.post('/attendance', {
        student_id: studentId,
        date: today,
        status: newStatus,
        in_time: newStatus === 'present' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : undefined,
        user_role: 'tuition_student',
      });
      setAttendanceMap(prev => {
        const next = { ...prev };
        if (next[today]?.[studentId]) {
          next[today][studentId].synced = true;
        }
        saveCache(next);
        return next;
      });
    } catch {
      setAttendanceMap(prev => {
        const next = { ...prev };
        if (next[today]?.[studentId]) {
          next[today][studentId].status = current;
          next[today][studentId].synced = true;
        }
        saveCache(next);
        return next;
      });
    }
    setSavingId(null);
  }, [isToday, today, attendanceMap, saveCache]);

  const undoAttendance = useCallback(async (studentId: string) => {
    if (!isToday) {
      Alert.alert('Restricted', 'You can only undo attendance for today.');
      return;
    }

    setAttendanceMap(prev => {
      const next = { ...prev };
      if (next[today]) {
        delete next[today][studentId];
      }
      saveCache(next);
      return next;
    });

    try {
      await api.post('/attendance', {
        student_id: studentId,
        date: today,
        status: 'absent',
        user_role: 'tuition_student',
      });
    } catch {}
  }, [isToday, today, saveCache]);

  const changeDate = useCallback((offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    const newDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setSelectedDate(newDate);
    if (viewMode === 'day') {
      (async () => {
        const records = await fetchAttendanceForDate(newDate);
        setAttendanceMap(prev => {
          const next = { ...prev };
          if (!next[newDate]) next[newDate] = {};
          tuitionStudents.forEach(s => {
            const record = records.find((r: any) => r.student_id?.toString() === s.id.toString());
            if (record) {
              next[newDate][s.id] = {
                status: record.status as AttendanceStatus,
                inTime: record.in_time || undefined,
                synced: true,
              };
            }
          });
          saveCache(next);
          return next;
        });
      })();
    }
  }, [selectedDate, viewMode, tuitionStudents, fetchAttendanceForDate, saveCache]);

  const selectedDayStudents = useMemo(() => {
    const dayRecords = attendanceMap[selectedDate] || {};
    return tuitionStudents.map(s => ({
      ...s,
      attendance: dayRecords[s.id] || null,
    }));
  }, [tuitionStudents, attendanceMap, selectedDate]);

  const presentCount = selectedDayStudents.filter(s => s.attendance?.status === 'present').length;
  const absentCount = selectedDayStudents.filter(s => s.attendance?.status === 'absent').length;
  const unmarkedCount = tuitionStudents.length - presentCount - absentCount;

  const getBatchName = useCallback((batchId: any) => {
    return batchId ? `Batch #${batchId}` : 'General';
  }, []);

  const renderDropdown = (topOffset: number) => (
    <Modal transparent visible={showViewDropdown} onRequestClose={() => setShowViewDropdown(false)} animationType="fade">
      <TouchableOpacity activeOpacity={1} onPress={() => setShowViewDropdown(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }}>
        <TouchableOpacity activeOpacity={1}
          style={{
            marginHorizontal: 24, borderRadius: 24, overflow: 'hidden', borderWidth: 1,
            borderColor: isDark ? '#3a3a38' : '#F3F4F6',
            backgroundColor: isDark ? '#2a2a28' : '#FFFFFF',
            elevation: 20, marginTop: topOffset,
          }}>
          {[
            { label: 'Day', value: 'day' as ViewMode, icon: 'weather-sunny' },
            { label: 'Month', value: 'month' as ViewMode, icon: 'calendar-month' },
          ].map(opt => (
            <TouchableOpacity
              key={opt.value} activeOpacity={0.7}
              onPress={() => {
                setViewMode(opt.value);
                setShowViewDropdown(false);
                if (opt.value === 'month') {
                  const d = new Date(selectedDate);
                  fetchMonthSummary(d.getFullYear(), d.getMonth());
                }
              }}
              style={{
                flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16,
                backgroundColor: viewMode === opt.value ? (isDark ? 'rgba(217,119,6,0.2)' : 'rgba(245,158,11,0.1)') : undefined,
              }}>
              <MaterialCommunityIcons name={opt.icon as any} size={18} color={viewMode === opt.value ? '#D97706' : '#9CA3AF'} />
              <Text style={{ flex: 1, fontWeight: '900', fontSize: 14, marginHorizontal: 12, color: viewMode === opt.value ? '#D97706' : (isDark ? '#D1D5DB' : '#6B7280') }}>
                {opt.label}
              </Text>
              {viewMode === opt.value && <MaterialCommunityIcons name="check-bold" size={16} color="#D97706" />}
            </TouchableOpacity>
          ))}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  const renderDayView = () => (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={() => changeDate(-1)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(245,158,11,0.15)', alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="chevron-left" size={22} color="#D97706" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelectedDate(today)} style={{ alignItems: 'center', paddingHorizontal: 8 }}>
            <Text style={{ color: isDark ? '#D97706' : '#92400E', fontWeight: '900', fontSize: 14 }}>{selectedDate}</Text>
            {isToday && <Text style={{ color: '#F59E0B', fontSize: 9, fontWeight: '700' }}>Today</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeDate(1)} disabled={isToday}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isToday ? (isDark ? '#2a2a28' : '#F3F4F6') : 'rgba(245,158,11,0.15)', alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="chevron-right" size={22} color={isToday ? '#D1D5DB' : '#D97706'} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={() => setShowViewDropdown(true)}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
          <MaterialCommunityIcons name="calendar-month" size={14} color="#D97706" />
          <Text style={{ fontWeight: '900', fontSize: 10, color: isDark ? '#D97706' : '#92400E', marginHorizontal: 6, textTransform: 'uppercase' }}>Day</Text>
          <MaterialCommunityIcons name="chevron-down" size={14} color="#D97706" />
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', paddingHorizontal: 24, marginBottom: 20, gap: 12 }}>
        <View style={{ flex: 1, backgroundColor: '#10B981', borderRadius: 16, padding: 14, alignItems: 'center' }}>
          <MaterialCommunityIcons name="check-circle" size={20} color="#FFF" />
          <Text style={{ color: 'white', fontWeight: '900', fontSize: 20, marginTop: 4 }}>{presentCount}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 }}>Present</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#EF4444', borderRadius: 16, padding: 14, alignItems: 'center' }}>
          <MaterialCommunityIcons name="close-circle" size={20} color="#FFF" />
          <Text style={{ color: 'white', fontWeight: '900', fontSize: 20, marginTop: 4 }}>{absentCount}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 }}>Absent</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#9CA3AF', borderRadius: 16, padding: 14, alignItems: 'center' }}>
          <MaterialCommunityIcons name="minus-circle" size={20} color="#FFF" />
          <Text style={{ color: 'white', fontWeight: '900', fontSize: 20, marginTop: 4 }}>{unmarkedCount}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 }}>Unmarked</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 24 }} showsVerticalScrollIndicator={false}>
        {selectedDayStudents.map((s: any) => {
          const status = s.attendance?.status;
          const isPresent = status === 'present';
          const isAbsent = status === 'absent';
          const isSaving = savingId === s.id;
          const avatarUrl = getMediaUrl(s.avatar || s.student_photo);

          return (
            <View key={s.id}
              style={{
                backgroundColor: isDark ? '#2a2a28' : '#FFFFFF', borderRadius: 24, padding: 16, marginBottom: 12,
                borderWidth: 1,
                borderColor: isPresent ? '#A7F3D0' : isAbsent ? '#FECACA' : (isDark ? '#3a3a38' : '#F3F4F6'),
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={{ width: 56, height: 56, borderRadius: 16 }} />
                ) : (
                  <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(139,92,246,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name="school" size={28} color="#8B5CF6" />
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontWeight: '900', fontSize: 14, color: isDark ? '#FFFFFF' : '#111827' }}>{s.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Text style={{ color: isDark ? '#6B7280' : '#9CA3AF', fontSize: 10, fontWeight: '700' }}>@{s.username}</Text>
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: isDark ? '#4B5563' : '#D1D5DB', marginHorizontal: 8 }} />
                    <MaterialCommunityIcons name="tag" size={10} color={isDark ? '#6B7280' : '#9CA3AF'} />
                    <Text style={{ color: isDark ? '#6B7280' : '#9CA3AF', fontSize: 10, fontWeight: '700', marginLeft: 4 }}>{getBatchName(s.batch_id)}</Text>
                  </View>
                  {isPresent && s.attendance?.inTime && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <MaterialCommunityIcons name="clock-in" size={12} color="#10B981" />
                      <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '700', marginLeft: 4 }}>In: {s.attendance.inTime}</Text>
                    </View>
                  )}
                </View>
                {isSaving ? (
                  <ActivityIndicator size="small" color="#8B5CF6" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <TouchableOpacity activeOpacity={0.7} onPress={() => toggleAttendance(s.id)}
                      style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: isPresent ? '#10B981' : (isDark ? '#2a2a28' : '#F3F4F6') }}>
                      <MaterialCommunityIcons name="check-circle" size={20} color={isPresent ? '#FFF' : '#D1D5DB'} />
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.7} onPress={() => toggleAttendance(s.id)}
                      style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: isAbsent ? '#EF4444' : (isDark ? '#2a2a28' : '#F3F4F6') }}>
                      <MaterialCommunityIcons name="close-circle" size={20} color={isAbsent ? '#FFF' : '#D1D5DB'} />
                    </TouchableOpacity>
                    {(isPresent || isAbsent) && (
                      <TouchableOpacity activeOpacity={0.7} onPress={() => undoAttendance(s.id)}
                        style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(217,119,6,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                        <MaterialCommunityIcons name="undo" size={14} color="#D97706" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </View>
          );
        })}
        {tuitionStudents.length === 0 && (
          <View style={{ backgroundColor: isDark ? '#2a2a28' : '#FFFFFF', borderRadius: 24, padding: 32, alignItems: 'center' }}>
            <MaterialCommunityIcons name="account-group-outline" size={48} color={isDark ? '#6B7280' : '#9CA3AF'} />
            <Text style={{ color: isDark ? '#6B7280' : '#9CA3AF', fontWeight: '700', marginTop: 12 }}>No tuition students found</Text>
          </View>
        )}
        <View style={{ height: 128 }} />
      </ScrollView>
    </View>
  );

  const renderMonthView = () => {
    const d = new Date(selectedDate);
    const year = d.getFullYear();
    const month = d.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const todayDateNum = new Date().getDate();
    const todayMonth = new Date().getMonth();
    const todayYear = new Date().getFullYear();

    const cells: ({ day: number; dateStr: string } | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ day, dateStr });
    }

    return (
      <View style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFF8F0' }}>
        <View style={{ paddingHorizontal: 24, paddingTop: insets.top, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <TouchableOpacity onPress={() => navigation.goBack()}
              style={{ backgroundColor: isDark ? '#2a2a28' : '#FFFFFF', width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? '#3a3a38' : 'rgba(245,158,11,0.2)' }} activeOpacity={0.7}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={isDark ? '#FFF' : '#1F2937'} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 40, height: 40, borderRadius: 16, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="calendar" size={22} color="#FFF" />
              </View>
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#F59E0B', marginLeft: 12 }}>Attendance</Text>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 8 }}>
          <TouchableOpacity onPress={() => { const nd = new Date(year - 1, month); setSelectedDate(formatLocalDate(nd)); fetchMonthSummary(year - 1, month); }}
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? '#2a2a28' : '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
            <MaterialCommunityIcons name="chevron-double-left" size={18} color="#D97706" />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
            <TouchableOpacity onPress={() => { const nd = new Date(year, month - 1); setSelectedDate(formatLocalDate(nd)); fetchMonthSummary(year, month - 1); }}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(245,158,11,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
              <MaterialCommunityIcons name="chevron-left" size={22} color="#D97706" />
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: '900', color: isDark ? '#FFFFFF' : '#111827' }}>{MONTHS[month]}</Text>
              <Text style={{ color: '#F59E0B', fontSize: 14, fontWeight: '700' }}>{year}</Text>
            </View>
            <TouchableOpacity onPress={() => { const nd = new Date(year, month + 1); setSelectedDate(formatLocalDate(nd)); fetchMonthSummary(year, month + 1); }}
              disabled={month >= todayMonth && year >= todayYear}
              style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginLeft: 16, backgroundColor: month >= todayMonth && year >= todayYear ? (isDark ? '#2a2a28' : '#F3F4F6') : 'rgba(245,158,11,0.15)' }}>
              <MaterialCommunityIcons name="chevron-right" size={22} color={month >= todayMonth && year >= todayYear ? '#D1D5DB' : '#D97706'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { const nd = new Date(year + 1, month); setSelectedDate(formatLocalDate(nd)); fetchMonthSummary(year + 1, month); }}
              disabled={year >= todayYear}
              style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginLeft: 16, backgroundColor: year >= todayYear ? (isDark ? '#2a2a28' : '#F3F4F6') : (isDark ? '#2a2a28' : '#F3F4F6') }}>
              <MaterialCommunityIcons name="chevron-double-right" size={18} color={year >= todayYear ? '#D1D5DB' : '#D97706'} />
            </TouchableOpacity>
          </View>
          {monthLoading && <ActivityIndicator size="small" color="#F59E0B" style={{ marginLeft: 8 }} />}
        </View>

        <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 4 }}>
          {DAYS.map(day => (
            <View key={day} style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
              <Text style={{ color: isDark ? '#6B7280' : '#9CA3AF', fontSize: 11, fontWeight: '700' }}>{day}</Text>
            </View>
          ))}
        </View>

        <View style={{ flex: 1, paddingHorizontal: 12, paddingBottom: 16 }}>
          {Array.from({ length: Math.ceil(cells.length / 7) }).map((_, rowIdx) => (
            <View key={rowIdx} style={{ flex: 1, flexDirection: 'row' }}>
              {cells.slice(rowIdx * 7, rowIdx * 7 + 7).map((cell, colIdx) => {
                if (!cell) return <View key={`empty-${rowIdx * 7 + colIdx}`} style={{ flex: 1, padding: 4 }} />;
                const summary = monthData[cell.dateStr];
                const isCurrentDay = cell.day === todayDateNum && month === todayMonth && year === todayYear;

                let bgColor = isDark ? '#1e1e1e' : '#F9FAFB';
                let badge = null;
                let badgeColor = '';
                if (summary) {
                  if (summary.absent === 0 && summary.present > 0) { bgColor = '#DCFCE7'; badge = 'P'; badgeColor = '#059669'; }
                  else if (summary.absent > 0 && summary.present === 0) { bgColor = '#FEE2E2'; badge = 'A'; badgeColor = '#DC2626'; }
                  else if (summary.absent > 0 && summary.present > 0) { bgColor = '#FEF3C7'; badge = `${summary.present}/${summary.total}`; badgeColor = '#D97706'; }
                }
                if (isCurrentDay) bgColor = '#F59E0B';

                return (
                  <TouchableOpacity key={cell.dateStr} activeOpacity={0.7}
                    onPress={() => { setSelectedDate(cell.dateStr); setViewMode('day'); }}
                    style={{ flex: 1, padding: 4 }}>
                    <View style={{ flex: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: bgColor }}>
                      <Text style={{ fontWeight: '900', fontSize: 18, color: isCurrentDay ? 'white' : (isDark ? 'white' : '#374151') }}>{cell.day}</Text>
                      {badge && <Text style={{ fontSize: 10, fontWeight: '700', marginTop: 2, color: badgeColor }}>{badge}</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
          <View style={{ paddingVertical: 12, marginTop: 8, backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' }}>
            <Text style={{ color: '#92400E', fontWeight: '900', fontSize: 12, textAlign: 'center' }}>Tap a day to view & mark attendance</Text>
          </View>
        </View>

        {renderDropdown(insets.top + 130)}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFF8F0' }} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#F59E0B" />
        </View>
      </SafeAreaView>
    );
  }

  if (viewMode === 'month') return renderMonthView();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFF8F0' }} edges={['top']}>
      <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <TouchableOpacity onPress={() => navigation.goBack()}
            style={{ backgroundColor: isDark ? '#2a2a28' : '#FFFFFF', width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? '#3a3a38' : 'rgba(245,158,11,0.2)' }} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={isDark ? '#FFF' : '#1F2937'} />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 40, height: 40, borderRadius: 16, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="calendar" size={22} color="#FFF" />
            </View>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#F59E0B', marginLeft: 12 }}>Attendance</Text>
          </View>
        </View>
      </View>

      {renderDayView()}

      {renderDropdown(insets.top + 130)}
    </SafeAreaView>
  );
}
