import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, FlatList, Modal, ActivityIndicator, ScrollView, RefreshControl, StyleSheet, Dimensions } from 'react-native';
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
const AMBER = '#F59E0B';
const AMBER_DARK = '#D97706';
const GREEN = '#10B981';
const RED = '#EF4444';

const STUDENT_ICON = require('../../../assets/icons/student.png');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];
const PAGE_SIZE = 20;

const getTodayDateString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getCurrentTime = () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

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

// ─── Status popup (lightweight V2 replacement for StatusModal) ────────────────
function StatusPopup({ visible, title, message, type, onClose }: {
  visible: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning';
  onClose: () => void;
}) {
  const color = type === 'success' ? GREEN : type === 'warning' ? AMBER : RED;
  const icon = type === 'success' ? 'check-circle' : type === 'warning' ? 'alert-circle' : 'close-circle';
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(31,45,40,0.4)', justifyContent: 'center', paddingHorizontal: 20 }}>
        <View style={{ borderRadius: BORDER_RADIUS, backgroundColor: 'rgba(255,255,255,0.98)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', padding: 24, alignItems: 'center' }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: color + '16', alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name={icon as any} size={34} color={color} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY, marginTop: 16, textAlign: 'center' }}>{title}</Text>
          <Text style={{ fontSize: 13, fontWeight: '500', color: TEXT_SECONDARY, marginTop: 8, textAlign: 'center', lineHeight: 19 }}>{message}</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.85} style={{ marginTop: 20, alignSelf: 'stretch', height: 50, borderRadius: 16, overflow: 'hidden' }}>
            <LinearGradient colors={['#F59E0B', '#D97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: '#FFFFFF' }}>Okay</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Choice popup (lightweight V2 replacement for ChoiceModal) ─────────────────
function ChoicePopup({ visible, title, message, options, iconName, accentColor, onClose }: {
  visible: boolean;
  title: string;
  message: string;
  options: { label: string; type?: 'primary' | 'destructive'; onPress?: () => void }[];
  iconName: string;
  accentColor: string;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(31,45,40,0.4)', justifyContent: 'center', paddingHorizontal: 20 }}>
        <View style={{ borderRadius: BORDER_RADIUS, backgroundColor: 'rgba(255,255,255,0.98)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', padding: 24, alignItems: 'center' }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: accentColor + '16', alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name={iconName as any} size={34} color={accentColor} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY, marginTop: 16, textAlign: 'center' }}>{title}</Text>
          <Text style={{ fontSize: 13, fontWeight: '500', color: TEXT_SECONDARY, marginTop: 8, textAlign: 'center', lineHeight: 19 }}>{message}</Text>
          <View style={{ alignSelf: 'stretch', marginTop: 20 }}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.label}
                activeOpacity={0.85}
                onPress={() => { onClose(); opt.onPress && opt.onPress(); }}
                style={{ height: 50, borderRadius: 16, overflow: 'hidden', marginBottom: 10 }}
              >
                <LinearGradient
                  colors={opt.type === 'destructive' ? ['#EF4444', '#DC2626'] : ['#F59E0B', '#D97706']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: '#FFFFFF' }}>{opt.label}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={onClose} activeOpacity={0.8} style={{ height: 50, borderRadius: 16, backgroundColor: 'rgba(247,249,246,0.95)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: TEXT_SECONDARY }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Memoized student card ─────────────────────────────────────────────────────
interface StudentAttendance {
  id: string;
  status: 'present' | 'absent' | 'not_marked';
  inTime: string | null;
  outTime: string | null;
  droppedBy?: string;
  droppedByType?: string;
  pickedBy?: string;
  pickedByType?: string;
}

const StudentCard = React.memo(({ student, record, onTap, onLongPress }: {
  student: any;
  record: StudentAttendance | undefined;
  onTap: (id: string) => void;
  onLongPress?: (id: string) => void;
}) => {
  const isAbsent = record?.status === 'absent';
  const isIn = !!record?.inTime;
  const isOut = !!record?.outTime;
  const accent = isAbsent ? RED : isIn ? GREEN : AMBER;

  return (
    <TouchableOpacity
      onPress={() => onTap(student.id)}
      onLongPress={onLongPress ? () => onLongPress(student.id) : undefined}
      delayLongPress={500}
      activeOpacity={0.9}
      style={{
        borderRadius: BORDER_RADIUS,
        backgroundColor: isAbsent ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.92)',
        borderWidth: 1,
        borderColor: isAbsent ? 'rgba(239,68,68,0.22)' : 'rgba(255,255,255,0.6)',
        borderLeftWidth: 4,
        borderLeftColor: accent,
        padding: 14,
        marginBottom: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ position: 'relative' }}>
          {student.avatar ? (
            <Image source={{ uri: student.avatar }} style={{ width: 56, height: 56, borderRadius: 18, borderWidth: 3, borderColor: accent }} />
          ) : (
            <View style={{ width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: accent + '14', borderWidth: 3, borderColor: accent }}>
              <MaterialCommunityIcons name="account-school" size={28} color={accent} />
            </View>
          )}
          {isAbsent && (
            <View style={{ position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' }}>
              <MaterialCommunityIcons name="close" size={11} color="#FFFFFF" />
            </View>
          )}
          {isIn && !isAbsent && (
            <View style={{ position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' }}>
              <MaterialCommunityIcons name="check" size={11} color="#FFFFFF" />
            </View>
          )}
        </View>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '800', color: TEXT_PRIMARY, textDecorationLine: isAbsent ? 'line-through' : 'none', opacity: isAbsent ? 0.6 : 1 }}>
            {student.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
            <View style={{ backgroundColor: accent + '12', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ fontSize: 9, fontWeight: '900', color: accent, letterSpacing: 0.5 }}>{student.studentId || `ID ${student.id}`}</Text>
            </View>
          </View>
          {(isIn || isOut) && !isAbsent && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
              {isIn && (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6 }}>
                  <MaterialCommunityIcons name="login" size={11} color={GREEN} />
                  <Text style={{ fontSize: 9, fontWeight: '800', color: GREEN, marginLeft: 3 }}>{record?.droppedByType || 'In'}: {record?.inTime}</Text>
                </View>
              )}
              {isOut && (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <MaterialCommunityIcons name="logout" size={11} color={AMBER_DARK} />
                  <Text style={{ fontSize: 9, fontWeight: '800', color: AMBER_DARK, marginLeft: 3 }}>{record?.pickedByType || 'Out'}: {record?.outTime}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          {isIn && !isAbsent && <Text style={{ fontSize: 10, fontWeight: '900', color: GREEN, textTransform: 'uppercase' }}>In {record?.inTime}</Text>}
          {isOut && <Text style={{ fontSize: 10, fontWeight: '900', color: AMBER_DARK, textTransform: 'uppercase', marginTop: 2 }}>Out {record?.outTime}</Text>}
          {isAbsent && (
            <View style={{ backgroundColor: RED, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>Absent</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}, (prev, next) => {
  return prev.student.id === next.student.id &&
    prev.record?.status === next.record?.status &&
    prev.record?.inTime === next.record?.inTime &&
    prev.record?.outTime === next.record?.outTime;
});

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
                <Text style={{ fontSize: 9, fontWeight: '900', color: GREEN, marginLeft: 3 }}>{record.clockInBy || 'In'}: {record.clockIn}</Text>
              </View>
            )}
            {record.clockOut && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                <MaterialCommunityIcons name="logout-variant" size={10} color={AMBER_DARK} />
                <Text style={{ fontSize: 9, fontWeight: '900', color: AMBER_DARK, marginLeft: 3 }}>{record.clockOutBy || 'Out'}: {record.clockOut}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
});

interface Props { navigation: { navigate: (s: string, params?: any) => void; goBack: () => void } }

export default function TakeAttendanceScreenV2({ navigation }: Props) {
  const { user: authUser, users, branches } = useAuth();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<'day' | 'month'>('day');
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilterId, setBranchFilterId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, StudentAttendance>>({});
  const [markingStudentId, setMarkingStudentId] = useState<string | null>(null);
  const [markingType, setMarkingType] = useState<'IN' | 'OUT'>('IN');
  const [initialLoading, setInitialLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusPopup, setStatusPopup] = useState({ visible: false, title: '', message: '', type: 'error' as 'success' | 'error' | 'warning' });
  const [choicePopup, setChoicePopup] = useState({ visible: false, title: '', message: '', iconName: 'alert', accentColor: AMBER, options: [] as { label: string; type?: 'primary' | 'destructive'; onPress?: () => void }[] });
  const [showSearch, setShowSearch] = useState(false);

  // monthly state
  const [selectedStudentForMonthly, setSelectedStudentForMonthly] = useState<any | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyRecords, setMonthlyRecords] = useState<any[]>([]);
  const [isMonthlyLoading, setIsMonthlyLoading] = useState(false);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, branchFilterId]);

  const isAdminUser = authUser?.role === 'master_admin' || authUser?.role === 'admin';
  const isToday = selectedDate === getTodayDateString();

  const fetchData = useCallback(async () => {
    try {
      setInitialLoading(true);
      const response = await api.get(`/attendance?date=${selectedDate}`);
      const data = response.data;
      const records: Record<string, StudentAttendance> = {};
      data.forEach((item: any) => {
        records[item.student_id] = {
          id: item.student_id.toString(),
          status: item.status,
          inTime: item.in_time,
          outTime: item.out_time,
          droppedBy: item.dropped_by_name,
          droppedByType: item.dropped_by_type,
          pickedBy: item.picked_by_name,
          pickedByType: item.picked_by_type,
        };
      });
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  const fetchMonthlyData = useCallback(async () => {
    if (!selectedStudentForMonthly) return;
    try {
      setIsMonthlyLoading(true);
      const response = await api.get(`/attendance?student_id=${selectedStudentForMonthly.id}`);
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
          clockOutBy: dayRecord?.picked_by_type,
        });
      }
      setMonthlyRecords(records);
    } catch (error) {
      console.error('Error fetching monthly records:', error);
    } finally {
      setIsMonthlyLoading(false);
    }
  }, [selectedStudentForMonthly?.id, selectedMonth, selectedYear]);

  useEffect(() => {
    if (activeTab === 'day') fetchData();
    else if (activeTab === 'month' && selectedStudentForMonthly) fetchMonthlyData();
  }, [fetchData, fetchMonthlyData, activeTab, selectedStudentForMonthly]);

  const students = useMemo(() => {
    const allowedRoles = authUser?.role === 'tuition_teacher'
      ? ['tuition_student']
      : (authUser?.role === 'teacher' || authUser?.role === 'nanny')
        ? ['student']
        : ['student', 'tuition_student'];
    let filtered = users.filter(u => allowedRoles.includes(u.role) && u.status === 'active');
    if (branchFilterId) filtered = filtered.filter(u => u.branch_id?.toString() === branchFilterId);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.name?.toLowerCase().includes(q) ||
        u.studentId?.toString().includes(q)
      );
    }
    return filtered.slice(0, currentPage * PAGE_SIZE);
  }, [users, branchFilterId, searchQuery, currentPage, authUser?.role]);

  const totalFilteredCount = useMemo(() => {
    const allowedRoles = authUser?.role === 'tuition_teacher'
      ? ['tuition_student']
      : (authUser?.role === 'teacher' || authUser?.role === 'nanny')
        ? ['student']
        : ['student', 'tuition_student'];
    let filtered = users.filter(u => allowedRoles.includes(u.role) && u.status === 'active');
    if (branchFilterId) filtered = filtered.filter(u => u.branch_id?.toString() === branchFilterId);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.name?.toLowerCase().includes(q) ||
        u.studentId?.toString().includes(q)
      );
    }
    return filtered.length;
  }, [users, branchFilterId, searchQuery, authUser?.role]);

  const hasMore = students.length < totalFilteredCount;
  const loadMore = useCallback(() => { if (hasMore) setCurrentPage(p => p + 1); }, [hasMore]);

  const markingStudent = useMemo(() => students.find(s => s.id === markingStudentId), [markingStudentId, students]);

  const attendanceSummary = useMemo(() => {
    const raw = attendanceRecords || {};
    const ids = students.map(s => s.id.toString());
    const active = Object.entries(raw).filter(([id]) => ids.includes(id)).map(([, r]) => r);
    return {
      total: totalFilteredCount || students.length,
      in: active.filter(r => !!r.inTime).length,
      absent: active.filter(r => r.status === 'absent').length,
    };
  }, [attendanceRecords, students, totalFilteredCount]);

  const monthlyStats = useMemo(() => {
    const present = monthlyRecords.filter(r => r.status === 'present').length;
    const absent = monthlyRecords.filter(r => r.status === 'absent').length;
    const late = monthlyRecords.filter(r => r.status === 'late').length;
    return { present, absent, late, total: monthlyRecords.filter(r => r.status !== 'not_marked').length };
  }, [monthlyRecords]);

  const unmarkAttendance = useCallback((studentId: string) => {
    setAttendanceRecords(prev => {
      const next = { ...prev };
      delete next[studentId];
      return next;
    });
  }, []);

  const guardToday = useCallback((): boolean => {
    if (!isToday) {
      setStatusPopup({ visible: true, title: 'Action Restricted', message: 'Attendance can only be marked for the current date!', type: 'warning' });
      return false;
    }
    return true;
  }, [isToday]);

  const markPresent = useCallback(async (studentId: string, guardianType: string) => {
    if (!guardToday()) return;
    const time = getCurrentTime();
    const student = users.find(u => u.id === studentId);
    let guardianName = 'Guardian';
    if (guardianType === 'Father') guardianName = (student as any)?.fatherName || 'Father';
    else if (guardianType === 'Mother') guardianName = (student as any)?.motherName || 'Mother';
    else guardianName = (student as any)?.guardianName || (student as any)?.parentName || 'Guardian';

    const current = attendanceRecords[studentId];
    const newRecord: StudentAttendance = markingType === 'IN'
      ? { id: studentId, status: 'present', inTime: time, outTime: current?.outTime || null, droppedBy: guardianName, droppedByType: guardianType }
      : { ...current, status: 'present', outTime: time, pickedBy: guardianName, pickedByType: guardianType };

    setAttendanceRecords(prev => ({ ...prev, [studentId]: newRecord }));
    setMarkingStudentId(null);

    try {
      await api.post('/attendance', {
        student_id: studentId,
        date: selectedDate,
        status: newRecord.status,
        in_time: newRecord.inTime,
        out_time: newRecord.outTime,
        dropped_by_type: newRecord.droppedByType,
        picked_by_type: newRecord.pickedByType,
        dropped_by_name: newRecord.droppedBy,
        picked_by_name: newRecord.pickedBy,
        user_role: 'student',
      });
    } catch (error) {
      console.error('Error auto-submitting attendance present:', error);
      setStatusPopup({ visible: true, title: 'Error', message: 'Failed to save attendance change.', type: 'error' });
    }
  }, [markingType, attendanceRecords, guardToday, users, selectedDate]);

  const markAbsent = useCallback((studentId: string) => {
    if (!guardToday()) return;
    const record = attendanceRecords[studentId];
    if (record?.status === 'present') {
      setStatusPopup({ visible: true, title: 'Action Denied', message: 'Student is already marked Present. Please undo the Present marking first.', type: 'warning' });
      return;
    }
    setChoicePopup({
      visible: true,
      title: 'Mark Absent',
      message: 'Mark this student as Absent for today?',
      iconName: 'account-remove-outline',
      accentColor: RED,
      options: [{
        label: 'Confirm Absent',
        type: 'destructive',
        onPress: async () => {
          const newRecord: StudentAttendance = { id: studentId, status: 'absent', inTime: null, outTime: null };
          setAttendanceRecords(prev => ({ ...prev, [studentId]: newRecord }));
          try {
            await api.post('/attendance', {
              student_id: studentId,
              date: selectedDate,
              status: 'absent',
              in_time: null,
              out_time: null,
              user_role: 'student',
            });
          } catch (error) {
            console.error('Error auto-submitting attendance absent:', error);
            setStatusPopup({ visible: true, title: 'Error', message: 'Failed to save attendance change.', type: 'error' });
          }
        },
      }],
    });
  }, [guardToday, attendanceRecords, selectedDate]);

  const onDayStudentTap = useCallback((studentId: string) => {
    if (!guardToday()) return;
    const record = attendanceRecords[studentId];

    if (record?.status === 'absent') {
      setChoicePopup({
        visible: true,
        title: 'Student Absent',
        message: 'Would you like to undo the Absent marking?',
        iconName: 'account-question',
        accentColor: RED,
        options: [{ label: 'Yes, Undo', type: 'destructive', onPress: () => unmarkAttendance(studentId) }],
      });
      return;
    }
    if (!record?.inTime) {
      setMarkingStudentId(studentId);
      setMarkingType('IN');
    } else if (!record?.outTime) {
      setChoicePopup({
        visible: true,
        title: 'Attendance Options',
        message: 'Student is already marked IN. What next?',
        iconName: 'account-clock',
        accentColor: GREEN,
        options: [
          { label: 'Mark OUT', type: 'primary', onPress: () => { setMarkingStudentId(studentId); setMarkingType('OUT'); } },
          { label: 'Undo In-Marking', type: 'destructive', onPress: () => unmarkAttendance(studentId) },
        ],
      });
    } else {
      setChoicePopup({
        visible: true,
        title: 'Attendance Complete',
        message: 'Attendance cycle finished for this student. Undo marking?',
        iconName: 'check-all',
        accentColor: AMBER,
        options: [{ label: 'Yes, Undo', type: 'destructive', onPress: () => unmarkAttendance(studentId) }],
      });
    }
  }, [guardToday, attendanceRecords, unmarkAttendance]);

  const handleTabChange = useCallback((tab: 'day' | 'month') => {
    setActiveTab(tab);
    if (tab === 'day') setSelectedStudentForMonthly(null);
  }, []);

  const changeMonth = useCallback((offset: number) => {
    setSelectedMonth(prev => {
      let next = prev + offset;
      if (next > 11) { setSelectedYear(y => y + 1); return 0; }
      if (next < 0) { setSelectedYear(y => y - 1); return 11; }
      return next;
    });
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'day') await fetchData();
      else await fetchMonthlyData();
    } catch (error) {
      console.error('Refresh Error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchData, fetchMonthlyData, activeTab]);

  const markAttendanceSync = useCallback((guardianLabel: string) => {
    if (markingStudentId) markPresent(markingStudentId, guardianLabel);
  }, [markingStudentId, markPresent]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <StudentCard
      student={item}
      record={attendanceRecords[item.id]}
      onTap={onDayStudentTap}
      onLongPress={markAbsent}
    />
  ), [attendanceRecords, onDayStudentTap, markAbsent]);

  const renderMonthlyStudentItem = useCallback(({ item }: { item: any }) => (
    <TouchableOpacity activeOpacity={0.85} onPress={() => onMonthlyStudentSelect(item)}>
      <StudentCard student={item} record={undefined} onTap={() => onMonthlyStudentSelect(item)} />
    </TouchableOpacity>
  ), []);

  const onMonthlyStudentSelect = useCallback((student: any) => {
    setSelectedStudentForMonthly(student);
  }, []);

  const guardianOptions = markingStudent
    ? [
        { label: 'Father', icon: 'face-man' as any, color: '#3B82F6', name: (markingStudent as any).fatherName },
        { label: 'Mother', icon: 'face-woman' as any, color: '#D97706', name: (markingStudent as any).motherName },
        { label: 'Guardian', icon: 'account-child' as any, color: '#10B981', name: (markingStudent as any).parentName },
      ]
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />

      {/* ── Header ── */}
      <View style={{ paddingTop: Math.max(insets.top, 56), paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY }}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontSize: 12, fontWeight: '400', color: TEXT_MUTED }}>Attendance</Text>
            <Text style={{ fontSize: 22, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 2, letterSpacing: -0.5 }}>Take Attendance</Text>
          </View>
          <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
            <Image source={STUDENT_ICON} style={{ width: 46, height: 46 }} resizeMode="contain" />
          </View>
        </View>

        {isAdminUser && (
          <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <GlassDropdown selectedBranchId={branchFilterId} onSelect={setBranchFilterId} icon={STUDENT_ICON} />
            </View>
            <TouchableOpacity
              onPress={() => setShowSearch(prev => { if (prev) setSearchQuery(''); return !prev; })}
              activeOpacity={0.8}
              style={{ marginLeft: 10, width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}
            >
              <MaterialCommunityIcons name={showSearch ? 'close' : 'magnify'} size={24} color={showSearch ? AMBER_DARK : TEXT_MUTED} />
            </TouchableOpacity>
          </View>
        )}

        {showSearch && (
          <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', paddingHorizontal: 14, height: 50 }}>
            <MaterialCommunityIcons name="magnify" size={20} color={TEXT_MUTED} />
            <TextInput
              style={{ flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY }}
              placeholder="Search by name or ID..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons name="close-circle" size={18} color={TEXT_MUTED} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* ── Tabs ── */}
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 20, marginHorizontal: 20, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', padding: 6 }}>
        {(['day', 'month'] as const).map(tab => {
          const active = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.8}
              onPress={() => handleTabChange(tab)}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 14, backgroundColor: active ? 'rgba(245,158,11,0.15)' : 'transparent' }}
            >
              <MaterialCommunityIcons name={tab === 'day' ? 'calendar-today' : 'calendar-month'} size={16} color={active ? AMBER_DARK : TEXT_MUTED} />
              <Text style={{ fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginLeft: 6, color: active ? AMBER_DARK : TEXT_MUTED }}>
                {tab === 'day' ? 'Daily' : 'Monthly'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Content ── */}
      <View style={{ flex: 1, marginTop: 20 }}>
        {activeTab === 'day' ? (
          <FlatList
            data={students}
            keyExtractor={(item) => item.id.toString()}
            initialNumToRender={8}
            maxToRenderPerBatch={6}
            windowSize={7}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
            ListEmptyComponent={
              initialLoading ? (
                <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                  <ActivityIndicator size="large" color={AMBER} />
                </View>
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                  <MaterialCommunityIcons name="account-search-outline" size={60} color={TEXT_MUTED} style={{ opacity: 0.4 }} />
                  <Text style={{ marginTop: 12, fontWeight: '800', fontSize: 14, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1.5 }}>No students found</Text>
                </View>
              )
            }
            ListHeaderComponent={
              <>
                {/* Date pill */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100 }}>
                    <MaterialCommunityIcons name="calendar-today" size={14} color={AMBER_DARK} />
                    <Text style={{ fontSize: 12, fontWeight: '800', color: AMBER_DARK, marginLeft: 6 }}>{selectedDate}</Text>
                  </View>
                </View>

                {/* Summary */}
                <View style={{ flexDirection: 'row', borderRadius: BORDER_RADIUS, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', padding: 18, marginBottom: 16 }}>
                  {[
                    { label: 'Total', value: attendanceSummary.total, color: AMBER_DARK },
                    { label: 'Present', value: attendanceSummary.in, color: GREEN },
                    { label: 'Absent', value: attendanceSummary.absent, color: RED },
                  ].map((item, i) => (
                    <View key={item.label} style={{ flex: 1, alignItems: 'center', borderRightWidth: i < 2 ? 1 : 0, borderRightColor: 'rgba(31,45,40,0.08)' }}>
                      <Text style={{ fontSize: 24, fontWeight: '900', color: item.color }}>{item.value}</Text>
                      <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: TEXT_MUTED, marginTop: 3 }}>{item.label}</Text>
                    </View>
                  ))}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 2 }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: TEXT_MUTED }}>Student Roster</Text>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: AMBER_DARK, textTransform: 'uppercase' }}>Long press → Absent</Text>
                </View>
              </>
            }
            renderItem={renderItem}
            extraData={attendanceRecords}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AMBER} colors={[AMBER]} />}
            ListFooterComponent={
              hasMore ? (
                <TouchableOpacity
                  onPress={loadMore}
                  activeOpacity={0.8}
                  style={{ marginTop: 6, paddingVertical: 14, borderRadius: 16, alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(217,119,6,0.4)' }}
                >
                  <MaterialCommunityIcons name="chevron-double-down" size={20} color={AMBER_DARK} />
                  <Text style={{ fontSize: 10, fontWeight: '900', color: AMBER_DARK, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>
                    Load More ({students.length}/{totalFilteredCount})
                  </Text>
                </TouchableOpacity>
              ) : null
            }
          />
        ) : (
          selectedStudentForMonthly ? (
            <FlatList
              data={monthlyRecords}
              keyExtractor={(item) => item.day.toString()}
              initialNumToRender={15}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
              renderItem={({ item }) => <MonthlyRecordCard record={item} />}
              ListHeaderComponent={
                <>
                  {/* Student summary + back to list */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                    <View style={{ position: 'relative' }}>
                      {selectedStudentForMonthly.avatar ? (
                        <Image source={{ uri: selectedStudentForMonthly.avatar }} style={{ width: 60, height: 60, borderRadius: 20, borderWidth: 3, borderColor: AMBER }} />
                      ) : (
                        <View style={{ width: 60, height: 60, borderRadius: 20, backgroundColor: 'rgba(245,158,11,0.14)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: AMBER }}>
                          <MaterialCommunityIcons name="account-school" size={30} color={AMBER_DARK} />
                        </View>
                      )}
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text numberOfLines={1} style={{ fontSize: 17, fontWeight: '800', color: TEXT_PRIMARY }}>{selectedStudentForMonthly.name}</Text>
                      <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 }}>
                        <Text style={{ fontSize: 9, fontWeight: '900', color: AMBER_DARK, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {selectedStudentForMonthly.studentId || `ID ${selectedStudentForMonthly.id}`}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedStudentForMonthly(null)} activeOpacity={0.8} style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(245,158,11,0.14)', alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialCommunityIcons name="format-list-bulleted" size={20} color={AMBER_DARK} />
                    </TouchableOpacity>
                  </View>

                  {/* Month/Year pills + arrows */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <TouchableOpacity onPress={() => changeMonth(-1)} activeOpacity={0.8} style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialCommunityIcons name="chevron-left" size={20} color={TEXT_SECONDARY} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowMonthSelector(true)} activeOpacity={0.8} style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 8, backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100 }}>
                      <MaterialCommunityIcons name="calendar-month" size={14} color={AMBER_DARK} />
                      <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: AMBER_DARK, marginLeft: 6 }}>{MONTHS[selectedMonth]}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowYearSelector(true)} activeOpacity={0.8} style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 8, backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100 }}>
                      <MaterialCommunityIcons name="calendar-range" size={14} color={AMBER_DARK} />
                      <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: AMBER_DARK, marginLeft: 6 }}>{selectedYear}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => changeMonth(1)} activeOpacity={0.8} style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialCommunityIcons name="chevron-right" size={20} color={TEXT_SECONDARY} />
                    </TouchableOpacity>
                  </View>

                  {/* Monthly stats */}
                  <View style={{ flexDirection: 'row', borderRadius: BORDER_RADIUS, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', padding: 16, marginBottom: 14 }}>
                    {[
                      { label: 'Present', value: monthlyStats.present, color: GREEN },
                      { label: 'Absent', value: monthlyStats.absent, color: RED },
                      { label: 'Late', value: monthlyStats.late, color: AMBER },
                    ].map((item, i) => (
                      <View key={item.label} style={{ flex: 1, alignItems: 'center', borderRightWidth: i < 2 ? 1 : 0, borderRightColor: 'rgba(31,45,40,0.08)' }}>
                        <Text style={{ fontSize: 22, fontWeight: '900', color: item.color }}>{item.value}</Text>
                        <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: TEXT_MUTED, marginTop: 3 }}>{item.label}</Text>
                      </View>
                    ))}
                  </View>

                  {isMonthlyLoading && (
                    <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                      <ActivityIndicator color={AMBER} />
                    </View>
                  )}
                </>
              }
            />
          ) : (
            <FlatList
              data={students}
              keyExtractor={(item) => `monthly-select-${item.id}`}
              initialNumToRender={10}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
              ListHeaderComponent={
                <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: TEXT_MUTED, marginBottom: 12 }}>
                  Select Student for Report
                </Text>
              }
              renderItem={renderMonthlyStudentItem}
            />
          )
        )}
      </View>

      {/* ── Full screen marking popup (redesigned) ── */}
      <Modal visible={!!markingStudentId} animationType="slide" transparent={false} onRequestClose={() => setMarkingStudentId(null)}>
        <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
          <AuroraBackground />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}>
            {/* Top bar */}
            <View style={{ paddingTop: Math.max(insets.top, 30), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: TEXT_MUTED }}>Attendance</Text>
                <Text style={{ fontSize: 22, fontWeight: '800', color: TEXT_PRIMARY, marginTop: 2 }}>Mark Entry</Text>
              </View>
              <TouchableOpacity onPress={() => setMarkingStudentId(null)} activeOpacity={0.8} style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="close" size={24} color={TEXT_PRIMARY} />
              </TouchableOpacity>
            </View>

            {markingStudent && (
              <>
                {/* Student card */}
                <View style={{ alignItems: 'center', marginTop: 28 }}>
                  <View style={{ position: 'relative' }}>
                    <View style={{ width: 112, height: 112, borderRadius: 36, backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 4, borderColor: 'rgba(245,158,11,0.35)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {markingStudent.avatar ? (
                        <Image source={{ uri: markingStudent.avatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      ) : (
                        <MaterialCommunityIcons name="account-child" size={52} color={AMBER_DARK} />
                      )}
                    </View>
                    <View style={{ position: 'absolute', bottom: -6, right: -6, width: 38, height: 38, borderRadius: 14, backgroundColor: markingType === 'IN' ? GREEN : AMBER, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FFFFFF' }}>
                      <MaterialCommunityIcons name={markingType === 'IN' ? 'login' : 'logout'} size={16} color="#FFFFFF" />
                    </View>
                  </View>
                  <Text style={{ fontSize: 22, fontWeight: '900', color: TEXT_PRIMARY, marginTop: 18, textAlign: 'center' }}>{markingStudent.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100 }}>
                    <MaterialCommunityIcons name="badge-account" size={14} color={AMBER_DARK} />
                    <Text style={{ fontSize: 10, fontWeight: '900', color: AMBER_DARK, textTransform: 'uppercase', letterSpacing: 1, marginLeft: 6 }}>
                      ID: {markingStudent.studentId || 'N/A'}
                    </Text>
                  </View>
                </View>

                {/* Guardian section */}
                <View style={{ marginTop: 28 }}>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: TEXT_PRIMARY }}>Who is {markingType === 'IN' ? 'dropping off?' : 'picking up?'}</Text>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4, marginBottom: 16 }}>
                    Select the guardian present
                  </Text>

                  {guardianOptions.map((item) => (
                    <TouchableOpacity
                      key={item.label}
                      activeOpacity={0.9}
                      onPress={() => markAttendanceSync(item.label)}
                      style={{ marginBottom: 12, borderRadius: BORDER_RADIUS, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', padding: 16 }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: item.color + '16', alignItems: 'center', justifyContent: 'center' }}>
                          <MaterialCommunityIcons name={item.icon} size={28} color={item.color} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '800', color: item.name ? TEXT_PRIMARY : TEXT_MUTED }}>
                              {item.name || 'Not specified'}
                            </Text>
                            <View style={{ backgroundColor: item.color + '18', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginLeft: 8 }}>
                              <Text style={{ fontSize: 8, fontWeight: '900', color: item.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</Text>
                            </View>
                          </View>
                          <Text style={{ fontSize: 11, fontWeight: '600', color: TEXT_MUTED, marginTop: 3 }}>Guardian</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* ── Month selector ── */}
      <Modal visible={showMonthSelector} transparent animationType="fade" onRequestClose={() => setShowMonthSelector(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,20,0.45)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
          <View style={{ width: SCREEN_WIDTH - 40, maxWidth: 440, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.96)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', padding: 22, overflow: 'hidden' }}>
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <LinearGradient
                colors={['#F7F9F6', '#F2FAF5', '#EEFDFC', '#F7F9F6']}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
              />
              <RadialGlow size={240} color="#DDF8D7" opacity={0.3} style={{ top: -90, left: -80 }} />
              <RadialGlow size={260} color="#DDFBFF" opacity={0.28} style={{ bottom: -100, right: -90 }} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY, textAlign: 'center', marginBottom: 18 }}>Select Month</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {MONTHS.map((m, i) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => { setSelectedMonth(i); setShowMonthSelector(false); }}
                  style={{ width: '48%', paddingVertical: 14, borderRadius: 14, marginBottom: 8, alignItems: 'center', backgroundColor: selectedMonth === i ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.85)' }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: selectedMonth === i ? AMBER_DARK : TEXT_SECONDARY }}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Year selector ── */}
      <Modal visible={showYearSelector} transparent animationType="fade" onRequestClose={() => setShowYearSelector(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,20,0.45)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
          <View style={{ width: SCREEN_WIDTH - 40, maxWidth: 440, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.96)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', padding: 22, overflow: 'hidden' }}>
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <LinearGradient
                colors={['#F7F9F6', '#F2FAF5', '#EEFDFC', '#F7F9F6']}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
              />
              <RadialGlow size={240} color="#DDF8D7" opacity={0.3} style={{ top: -90, left: -80 }} />
              <RadialGlow size={260} color="#DDFBFF" opacity={0.28} style={{ bottom: -100, right: -90 }} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY, textAlign: 'center', marginBottom: 18 }}>Select Year</Text>
            <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {YEARS.map((y) => (
                  <TouchableOpacity
                    key={y}
                    onPress={() => { setSelectedYear(y); setShowYearSelector(false); }}
                    style={{ width: '48%', paddingVertical: 14, borderRadius: 14, marginBottom: 8, alignItems: 'center', backgroundColor: selectedYear === y ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.85)' }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '900', color: selectedYear === y ? AMBER_DARK : TEXT_SECONDARY }}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Popups ── */}
      <StatusPopup
        visible={statusPopup.visible}
        title={statusPopup.title}
        message={statusPopup.message}
        type={statusPopup.type}
        onClose={() => setStatusPopup(prev => ({ ...prev, visible: false }))}
      />

      <ChoicePopup
        visible={choicePopup.visible}
        title={choicePopup.title}
        message={choicePopup.message}
        options={choicePopup.options}
        iconName={choicePopup.iconName}
        accentColor={choicePopup.accentColor}
        onClose={() => setChoicePopup(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}
