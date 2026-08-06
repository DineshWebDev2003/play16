import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, Modal, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { getMediaUrl } from '../../../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const AMBER = '#F59E0B';

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

const ATTENDANCE_ICON = require('../../../assets/icons/team.png');

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

export default function TuitionAttendanceScreenV2({ navigation }: Props) {
  const { user, users } = useAuth();
  const insets = useSafeAreaInsets();

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

  const isToday = selectedDate === today;

  const tuitionStudents = useMemo(() =>
    users.filter((u: any) =>
      u.role === 'tuition_student' &&
      u.status === 'active' &&
      (!user?.branch_id || u.branch_id === user.branch_id)
    ),
  [users, user?.branch_id]);

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
      const idSet = new Set(tuitionStudents.map(s => s.id?.toString()));
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

  const renderDayView = () => (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => changeDate(-1)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(245,158,11,0.15)', alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="chevron-left" size={22} color="#D97706" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelectedDate(today)} style={{ alignItems: 'center', paddingHorizontal: 8 }}>
            <Text style={{ color: '#92400E', fontWeight: '900', fontSize: 14 }}>{selectedDate}</Text>
            {isToday && <Text style={{ color: AMBER, fontSize: 9, fontWeight: '700' }}>Today</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeDate(1)} disabled={isToday}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isToday ? '#F3F4F6' : 'rgba(245,158,11,0.15)', alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="chevron-right" size={22} color={isToday ? '#D1D5DB' : '#D97706'} />
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 14, padding: 4 }}>
          {(['day', 'month'] as const).map(m => {
            const active = viewMode === m;
            return (
              <TouchableOpacity key={m} activeOpacity={0.8} onPress={() => { setViewMode(m); if (m === 'month') { const d = new Date(selectedDate); fetchMonthSummary(d.getFullYear(), d.getMonth()); } }}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 11, backgroundColor: active ? AMBER : 'transparent' }}>
                <MaterialCommunityIcons name={m === 'day' ? 'weather-sunny' : 'calendar-month'} size={13} color={active ? 'white' : '#9CA3AF'} />
                <Text style={{ fontWeight: '900', fontSize: 10, textTransform: 'uppercase', marginLeft: 5, color: active ? 'white' : '#6B7280' }}>{m}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16 }}>
        <View style={{ flex: 1, backgroundColor: '#10B981', borderRadius: 18, padding: 14, alignItems: 'center', marginRight: 10 }}>
          <MaterialCommunityIcons name="check-circle" size={20} color="#FFF" />
          <Text style={{ color: 'white', fontWeight: '900', fontSize: 20, marginTop: 4 }}>{presentCount}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 }}>Present</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#EF4444', borderRadius: 18, padding: 14, alignItems: 'center', marginRight: 10 }}>
          <MaterialCommunityIcons name="close-circle" size={20} color="#FFF" />
          <Text style={{ color: 'white', fontWeight: '900', fontSize: 20, marginTop: 4 }}>{absentCount}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 }}>Absent</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#9CA3AF', borderRadius: 18, padding: 14, alignItems: 'center' }}>
          <MaterialCommunityIcons name="minus-circle" size={20} color="#FFF" />
          <Text style={{ color: 'white', fontWeight: '900', fontSize: 20, marginTop: 4 }}>{unmarkedCount}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 }}>Unmarked</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
        {selectedDayStudents.map((s: any) => {
          const status = s.attendance?.status;
          const isPresent = status === 'present';
          const isAbsent = status === 'absent';
          const isSaving = savingId === s.id;
          const avatarUrl = getMediaUrl(s.avatar || s.student_photo);

          return (
            <View key={s.id}
              style={{
                backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 22, padding: 14, marginBottom: 10,
                borderWidth: 1,
                borderColor: isPresent ? '#A7F3D0' : isAbsent ? '#FECACA' : 'rgba(255,255,255,0.6)',
                borderLeftWidth: 4,
                borderLeftColor: isPresent ? '#10B981' : isAbsent ? '#EF4444' : '#E5E7EB',
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={{ width: 52, height: 52, borderRadius: 16 }} />
                ) : (
                  <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(139,92,246,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name="school" size={28} color="#8B5CF6" />
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontWeight: '900', fontSize: 14, color: TEXT_PRIMARY }}>{s.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Text style={{ color: TEXT_MUTED, fontSize: 10, fontWeight: '700' }}>@{s.username}</Text>
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', marginHorizontal: 8 }} />
                    <MaterialCommunityIcons name="tag" size={10} color={TEXT_MUTED} />
                    <Text style={{ color: TEXT_MUTED, fontSize: 10, fontWeight: '700', marginLeft: 4 }}>{getBatchName(s.batch_id)}</Text>
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
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity activeOpacity={0.7} onPress={() => toggleAttendance(s.id)}
                      style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 4, backgroundColor: isPresent ? '#10B981' : '#F3F4F6' }}>
                      <MaterialCommunityIcons name="check-circle" size={20} color={isPresent ? '#FFF' : '#D1D5DB'} />
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.7} onPress={() => toggleAttendance(s.id)}
                      style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 4, backgroundColor: isAbsent ? '#EF4444' : '#F3F4F6' }}>
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
          <View style={{ backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 22, padding: 32, alignItems: 'center' }}>
            <MaterialCommunityIcons name="account-group-outline" size={48} color={TEXT_MUTED} />
            <Text style={{ color: TEXT_MUTED, fontWeight: '700', marginTop: 12 }}>No tuition students found</Text>
          </View>
        )}
        <View style={{ height: 60 }} />
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
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 8 }}>
          <TouchableOpacity onPress={() => { const nd = new Date(year - 1, month); setSelectedDate(formatLocalDate(nd)); fetchMonthSummary(year - 1, month); }}
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
            <MaterialCommunityIcons name="chevron-double-left" size={18} color="#D97706" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { const nd = new Date(year, month - 1); setSelectedDate(formatLocalDate(nd)); fetchMonthSummary(year, month - 1); }}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(245,158,11,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
            <MaterialCommunityIcons name="chevron-left" size={22} color="#D97706" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: TEXT_PRIMARY }}>{MONTHS[month]}</Text>
            <Text style={{ color: AMBER, fontSize: 14, fontWeight: '700' }}>{year}</Text>
          </View>
          <TouchableOpacity onPress={() => { const nd = new Date(year, month + 1); setSelectedDate(formatLocalDate(nd)); fetchMonthSummary(year, month + 1); }}
            disabled={month >= todayMonth && year >= todayYear}
            style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginLeft: 16, backgroundColor: month >= todayMonth && year >= todayYear ? '#F3F4F6' : 'rgba(245,158,11,0.15)' }}>
            <MaterialCommunityIcons name="chevron-right" size={22} color={month >= todayMonth && year >= todayYear ? '#D1D5DB' : '#D97706'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { const nd = new Date(year + 1, month); setSelectedDate(formatLocalDate(nd)); fetchMonthSummary(year + 1, month); }}
            disabled={year >= todayYear}
            style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginLeft: 16, backgroundColor: '#F3F4F6' }}>
            <MaterialCommunityIcons name="chevron-double-right" size={18} color={year >= todayYear ? '#D1D5DB' : '#D97706'} />
          </TouchableOpacity>
          {monthLoading && <ActivityIndicator size="small" color={AMBER} style={{ marginLeft: 8 }} />}
        </View>

        <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 4 }}>
          {DAYS.map(day => (
            <View key={day} style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
              <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '700' }}>{day}</Text>
            </View>
          ))}
        </View>

        <ScrollView style={{ flex: 1, paddingHorizontal: 12 }} showsVerticalScrollIndicator={false}>
          {Array.from({ length: Math.ceil(cells.length / 7) }).map((_, rowIdx) => (
            <View key={rowIdx} style={{ flexDirection: 'row' }}>
              {cells.slice(rowIdx * 7, rowIdx * 7 + 7).map((cell, colIdx) => {
                if (!cell) return <View key={`empty-${rowIdx * 7 + colIdx}`} style={{ flex: 1, aspectRatio: 1, padding: 4 }} />;
                const summary = monthData[cell.dateStr];
                const isCurrentDay = cell.day === todayDateNum && month === todayMonth && year === todayYear;

                let bgColor = '#F9FAFB';
                let badge = null;
                let badgeColor = '';
                if (summary) {
                  if (summary.absent === 0 && summary.present > 0) { bgColor = '#DCFCE7'; badge = 'P'; badgeColor = '#059669'; }
                  else if (summary.absent > 0 && summary.present === 0) { bgColor = '#FEE2E2'; badge = 'A'; badgeColor = '#DC2626'; }
                  else if (summary.absent > 0 && summary.present > 0) { bgColor = '#FEF3C7'; badge = `${summary.present}/${summary.total}`; badgeColor = '#D97706'; }
                }
                if (isCurrentDay) bgColor = AMBER;

                return (
                  <TouchableOpacity key={cell.dateStr} activeOpacity={0.7}
                    onPress={() => { setSelectedDate(cell.dateStr); setViewMode('day'); }}
                    style={{ flex: 1, aspectRatio: 1, padding: 4 }}>
                    <View style={{ flex: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: bgColor }}>
                      <Text style={{ fontWeight: '900', fontSize: 18, color: isCurrentDay ? 'white' : '#374151' }}>{cell.day}</Text>
                      {badge && <Text style={{ fontSize: 10, fontWeight: '700', marginTop: 2, color: badgeColor }}>{badge}</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
          <View style={{ paddingVertical: 12, marginTop: 8, backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', marginBottom: 60 }}>
            <Text style={{ color: '#92400E', fontWeight: '900', fontSize: 12, textAlign: 'center' }}>Tap a day to view & mark attendance</Text>
          </View>
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F7F9F6', alignItems: 'center', justifyContent: 'center' }}>
        <AuroraBackground />
        <ActivityIndicator size="large" color={AMBER} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />
      <View style={{ paddingHorizontal: 20, paddingTop: Math.max(insets.top, 56), flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY }}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={{ fontSize: 12, fontWeight: '400', color: TEXT_MUTED }}>Tuition</Text>
          <Text style={{ fontSize: 22, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 2, letterSpacing: -0.5 }}>Attendance</Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: TEXT_MUTED, marginTop: 2 }}>Mark & review attendance</Text>
        </View>
        <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
          <Image source={ATTENDANCE_ICON} style={{ width: 46, height: 46 }} resizeMode="contain" />
        </View>
      </View>

      <View style={{ flex: 1, marginTop: 16 }}>
        {viewMode === 'month' ? renderMonthView() : renderDayView()}
      </View>
    </View>
  );
}
