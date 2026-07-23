import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, Image, Dimensions, Modal, ActivityIndicator, FlatList, ScrollView, RefreshControl, TextInput, Animated, StatusBar, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../services/api';
import StatusModal from '../../components/StatusModal';
import ChoiceModal from '../../components/ChoiceModal';
import PremiumPopup from '../../components/PremiumPopup';
import BranchFilter from '../../components/BranchFilter';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface TakeAttendanceScreenProps {
  navigation: any;
}

interface StudentAttendance {
  id: string;
  status: 'present' | 'absent' | 'late' | 'not_marked';
  inTime: string | null;
  outTime: string | null;
  droppedBy?: string;
  droppedByType?: 'Mother' | 'Father' | 'Guardian';
  pickedBy?: string;
  pickedByType?: 'Mother' | 'Father' | 'Guardian';
}

const getBranchName = (branchId: string | undefined | null, branches: any[]): string => {
  if (!branchId) return 'X';
  const branch = branches.find((b: any) => b.id?.toString() === branchId.toString());
  return branch?.name || 'X';
};

const generateId = (branchName: string, role: string): string => {
  const branchLetter = branchName ? branchName.charAt(0).toUpperCase() : 'X';
  const year = new Date().getFullYear().toString().slice(-2);
  const roleLetter = role === 'teacher' ? 't' : 's';
  return `tnhk${branchLetter}${roleLetter}${year}`;
};

const generateIdFromBranchId = (branchId: string | undefined | null, role: string): string => {
  const letter = branchId ? branchId.toString().charAt(0).toUpperCase() : 'X';
  const year = new Date().getFullYear().toString().slice(-2);
  const roleLetter = role === 'teacher' ? 't' : 's';
  return `tnhk${letter}${roleLetter}${year}`;
};

const StudentCard = React.memo(({ 
  student, 
  record, 
  colors, 
  onTap, 
  onLongPress 
}: { 
  student: any, 
  record: StudentAttendance | undefined, 
  colors: any,
  onTap: (id: string) => void,
  onLongPress?: (id: string) => void
}) => {
  const { theme: appTheme } = useTheme();
  const isAbsent = record?.status === 'absent';
  const isIn = !!record?.inTime;
  const isOut = !!record?.outTime;

  const borderColor = useMemo(() => {
    if (isAbsent) return '#EF4444';
    if (isOut) return '#10B981';
    if (isIn) return '#10B981';
    return '#F59E0B';
  }, [isAbsent, isIn, isOut]);

  return (
    <TouchableOpacity 
      onPress={() => onTap(student.id)}
      onLongPress={onLongPress ? () => onLongPress(student.id) : undefined}
      delayLongPress={500}
      activeOpacity={0.9}
      className={`${colors.surface} rounded-[32px] p-4 mb-4 border-b-4 ${isAbsent ? 'border-red-500 bg-red-900/10' : colors.border} shadow-sm`}
    >
      <View className="flex-row items-center">
        <View className="relative">
          {student.avatar ? (
            <Image 
              source={{ uri: student.avatar }} 
              className="w-16 h-16 rounded-2xl border-4"
              style={{ borderColor }}
            />
          ) : (
            <View 
              className={`w-16 h-16 rounded-2xl items-center justify-center border-4 ${isAbsent ? (appTheme === 'dark' ? 'bg-red-900/20' : 'bg-red-50') : (appTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100')}`}
              style={{ borderColor }}
            >
              <MaterialCommunityIcons name="account-school" size={32} color={isAbsent ? '#EF4444' : (isIn ? '#10B981' : '#F59E0B')} />
            </View>
          )}
          {isAbsent && (
            <View className="absolute inset-0 bg-red-500/20 rounded-2xl items-center justify-center">
              <MaterialCommunityIcons name="close-thick" size={24} color="#EF4444" />
            </View>
          )}
          {isIn && !isAbsent && (
            <View className="absolute -top-1 -right-1 bg-green-500 rounded-full w-5 h-5 items-center justify-center border-2 border-white dark:border-gray-900">
              <MaterialCommunityIcons name="check" size={12} color="white" />
            </View>
          )}
        </View>

        <View className="flex-1 ml-4 justify-center">
          <Text className={`font-black text-lg ${isAbsent ? 'text-red-500 line-through opacity-70' : colors.text}`} numberOfLines={1}>
            {student.name}
          </Text>
          <View className="flex-row items-center mt-2">
            <View className={`${isAbsent ? (appTheme === 'dark' ? 'bg-red-900/30' : 'bg-red-100') : (isIn ? (appTheme === 'dark' ? 'bg-green-900/30' : 'bg-green-100') : 'bg-brand-pink/10')} px-2 py-0.5 rounded-lg mr-2`}>
              <Text className={`text-[9px] font-black ${isAbsent ? 'text-red-400' : (isIn ? 'text-green-500' : 'text-brand-pink')}`}>
                {generateIdFromBranchId(student.branch_id, 'student')}
              </Text>
            </View>
          </View>

          {(isIn || isOut) && !isAbsent && (
            <View className="flex-row flex-wrap mt-3 gap-2">
              {isIn && (
                <View className={`${appTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100/50'} px-3 py-1.5 rounded-xl flex-row items-center border ${appTheme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                  <MaterialCommunityIcons name="login" size={12} color="#10B981" />
                  <Text className={`text-[10px] font-black ${colors.textSecondary} ml-1`}>
                    {record?.droppedByType}: {record?.inTime}
                  </Text>
                </View>
              )}
              {isOut && (
                <View className={`${appTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100/50'} px-3 py-1.5 rounded-xl flex-row items-center border ${appTheme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                  <MaterialCommunityIcons name="logout" size={12} color="#F59E0B" />
                  <Text className={`text-[10px] font-black ${colors.textSecondary} ml-1`}>
                    {record?.pickedByType}: {record?.outTime}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View className="items-end">
          {isIn && (
            <View className="items-end">
              <Text className="text-[10px] font-black text-green-500 uppercase tracking-tighter">In: {record?.inTime}</Text>
              {isOut && <Text className="text-[10px] font-black text-orange-500 uppercase mt-1 tracking-tighter">Out: {record?.outTime}</Text>}
            </View>
          )}
          {isAbsent && (
            <View className="bg-red-500 px-3 py-1 rounded-full">
              <Text className="text-white text-[9px] font-black uppercase">Absent</Text>
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
         prev.record?.outTime === next.record?.outTime &&
         prev.colors.surface === next.colors.surface;
});

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];

const getCurrentTime = () => {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const getTodayDateString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const EmptyList = React.memo(({ colors }: { colors: any }) => (
  <View className="items-center justify-center py-20">
    <MaterialCommunityIcons name="account-search-outline" size={60} color="#F59E0B" style={{ opacity: 0.5 }} />
    <Text className={`mt-4 ${colors.textTertiary} font-black text-lg uppercase tracking-widest`}>No students found</Text>
  </View>
));

const ThreeDotLoader = () => {
  const { theme: appTheme } = useTheme();
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounce = (anim: Animated.Value, delay: number) => Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: -12, duration: 300, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ])
    );
    bounce(anim1, 0).start();
    bounce(anim2, 150).start();
    bounce(anim3, 300).start();
  }, []);

  const dot = (anim: Animated.Value) => (
    <Animated.View style={{ transform: [{ translateY: anim }], width: 10, height: 10, borderRadius: 5, backgroundColor: '#F59E0B', marginHorizontal: 4 }} />
  );

  return (
    <View className="absolute inset-0 z-50 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
      <View className={`${appTheme === 'dark' ? 'bg-[#1c1c14]' : 'bg-white'} rounded-[32px] px-10 py-8 items-center shadow-2xl border ${appTheme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
        <View className="flex-row items-center mb-4">
          {dot(anim1)}
          {dot(anim2)}
          {dot(anim3)}
        </View>
        <Text className={`text-[10px] font-black uppercase tracking-widest ${appTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Loading</Text>
      </View>
    </View>
  );
};

const MonthlyRecordCard = React.memo(({ record, colors }: { record: any, colors: any }) => {
  const { theme: appTheme } = useTheme();
  return (
  <View className={`${appTheme === 'dark' ? 'bg-[#1e1e1e]' : colors.surface} rounded-[28px] p-5 mb-3 border ${appTheme === 'dark' ? 'border-gray-800' : colors.border}`}>
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center">
        <View className={`${record.status === 'present' ? 'bg-green-500 shadow-sm' : (record.status === 'absent' ? 'bg-red-500 shadow-sm' : (appTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'))} w-10 h-10 rounded-xl items-center justify-center mr-4`}>
          <Text className="text-white font-black">{record.day}</Text>
        </View>
        <View>
          <Text className={`font-black ${colors.text} text-sm mb-1`}>{record.dayName}, {record.date}</Text>
          <View className={`self-start px-2 py-0.5 rounded-lg ${record.status === 'present' ? 'bg-green-500/10' : (record.status === 'absent' ? 'bg-red-500/10' : (appTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-500/10'))}`}>
            <Text className={`text-[8px] font-black uppercase ${record.status === 'present' ? 'text-green-500' : (record.status === 'absent' ? 'text-red-500' : colors.textTertiary)}`}>
                {record.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      {record.status === 'present' && (
        <View className="items-end">
          <View className="flex-row items-center mb-1">
             <MaterialCommunityIcons name="login-variant" size={10} color="#10B981" />
             <Text className={`text-[9px] font-black text-green-500 ml-1`}>
                {record.clockInBy || 'In'}: {record.clockIn}
             </Text>
          </View>
          {record.clockOut && (
            <View className="flex-row items-center">
                <MaterialCommunityIcons name="logout-variant" size={10} color="#F59E0B" />
                <Text className={`text-[9px] font-black text-pink-500 ml-1`}>
                {record.clockOutBy || 'Out'}: {record.clockOut}
                </Text>
            </View>
          )}
        </View>
      )}
    </View>
  </View>
  );
});

const ViewDropdown = React.memo(({ 
  activeTab, 
  onTabChange, 
  colors, 
  isOpen, 
  setIsOpen 
}: { 
  activeTab: 'day' | 'month', 
  onTabChange: (tab: 'day' | 'month') => void, 
  colors: any,
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) => {
  const { theme: appTheme } = useTheme();
  return (
  <View className="px-6 mb-6">
    <TouchableOpacity 
      onPress={() => setIsOpen(true)}
      activeOpacity={0.8}
      className={`${appTheme === 'dark' ? 'bg-[#1e1e1e]' : colors.surface} rounded-[24px] p-4 flex-row items-center justify-between border ${appTheme === 'dark' ? 'border-gray-800' : colors.border} shadow-sm`}
    >
      <View className="flex-row items-center">
        <View className={`${appTheme === 'dark' ? 'bg-pink-500/10' : 'bg-brand-pink/10'} w-10 h-10 rounded-2xl items-center justify-center mr-3`}>
          <MaterialCommunityIcons 
            name={activeTab === 'day' ? "calendar-today" : "calendar-month"} 
            size={20} 
            color="#F59E0B" 
          />
        </View>
        <View>
          <Text className={`text-[10px] font-black uppercase tracking-widest ${colors.textTertiary}`}>Current View</Text>
          <Text className={`text-base font-black ${colors.text}`}>
            {activeTab === 'day' ? 'Daily Attendance' : 'Monthly Reports'}
          </Text>
        </View>
      </View>
      <MaterialCommunityIcons name="unfold-more-horizontal" size={24} color={colors.textTertiary} />
    </TouchableOpacity>

    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setIsOpen(false)}
    >
      <View className="flex-1 bg-black/90 justify-center items-center px-6">
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={() => setIsOpen(false)}
          className="absolute inset-0"
        />
        <View 
            style={{ backgroundColor: appTheme === 'dark' ? '#1c1c14' : '#FFFFFF' }}
            className="w-full rounded-[48px] p-8 border-4 border-brand-pink shadow-2xl relative overflow-hidden"
        >
          {/* Decorative Header Area */}
          <View className="items-center mb-8">
            <View className={`w-20 h-20 rounded-[28px] bg-brand-pink items-center justify-center mb-4 shadow-xl rotate-3 border-4 border-white`}>
              <MaterialCommunityIcons name="calendar-multiselect" size={42} color="white" />
            </View>
            <Text className={`text-2xl font-black ${colors.text} tracking-tighter text-center`}>Select View Mode</Text>
            <Text className={`text-[10px] ${colors.textTertiary} font-black uppercase tracking-[2px] mt-1`}>Attendance Dashboard</Text>
          </View>

          <TouchableOpacity 
            onPress={() => {
              onTabChange('day');
              setIsOpen(false);
            }}
            activeOpacity={0.7}
            className={`flex-row items-center p-4 mb-3 rounded-3xl border-2 ${activeTab === 'day' ? 'border-brand-pink bg-brand-pink/5' : `border-transparent ${appTheme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'}`}`}
          >
            <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${activeTab === 'day' ? 'bg-brand-pink' : (appTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200')}`}>
              <MaterialCommunityIcons name="calendar-today" size={24} color={activeTab === 'day' ? 'white' : colors.textTertiary} />
            </View>
            <View className="flex-1">
              <Text className={`text-lg font-black ${activeTab === 'day' ? 'text-brand-pink' : colors.text}`}>Daily Roll Call</Text>
              <Text className={`text-[10px] ${colors.textTertiary} font-bold uppercase tracking-wider`}>Mark presence for today</Text>
            </View>
            {activeTab === 'day' && <MaterialCommunityIcons name="check-circle" size={22} color="#F59E0B" />}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => {
              onTabChange('month');
              setIsOpen(false);
            }}
            activeOpacity={0.7}
            className={`flex-row items-center p-4 rounded-3xl border-2 ${activeTab === 'month' ? 'border-brand-pink bg-brand-pink/5' : `border-transparent ${appTheme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'}`}`}
          >
            <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${activeTab === 'month' ? 'bg-brand-pink' : (appTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200')}`}>
              <MaterialCommunityIcons name="calendar-month" size={24} color={activeTab === 'month' ? 'white' : colors.textTertiary} />
            </View>
            <View className="flex-1">
              <Text className={`text-lg font-black ${activeTab === 'month' ? 'text-brand-pink' : colors.text}`}>Performance Reports</Text>
              <Text className={`text-[10px] ${colors.textTertiary} font-bold uppercase tracking-wider`}>Analyze monthly history</Text>
            </View>
            {activeTab === 'month' && <MaterialCommunityIcons name="check-circle" size={22} color="#F59E0B" />}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setIsOpen(false)}
            activeOpacity={0.8}
            className={`mt-6 py-4 rounded-[22px] border-2 border-dashed ${appTheme === 'dark' ? 'border-white/10' : 'border-gray-200'} items-center`}
          >
            <Text className={`font-black uppercase tracking-[2px] ${colors.textTertiary} text-[9px]`}>Cancel Selection</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  </View>
  );
});

export default function TakeAttendanceScreen({ navigation }: TakeAttendanceScreenProps) {
  const { colors, theme: appTheme } = useTheme();
  const { users, branches, fetchData: refreshUsers, user: authUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilterId, setBranchFilterId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showStudentPopup, setShowStudentPopup] = useState(false);
  const [popupSearchQuery, setPopupSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const PAGE_SIZE = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, branchFilterId]);
  const [activeTab, setActiveTab] = useState<'day' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [selectedStudentForMonthly, setSelectedStudentForMonthly] = useState<any | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, StudentAttendance>>({});
  const [monthlyRecords, setMonthlyRecords] = useState<any[]>([]);
  const [markingStudentId, setMarkingStudentId] = useState<string | null>(null);
  const [markingType, setMarkingType] = useState<'IN' | 'OUT'>('IN');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [isMonthlyLoading, setIsMonthlyLoading] = useState(false);
  const [statusModal, setStatusModal] = useState({ visible: false, title: '', message: '', type: 'error' as any });
  const [choiceModal, setChoiceModal] = useState({ visible: false, title: '', message: '', options: [] as any[], iconName: '', accentColor: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  
  const fetchData = useCallback(async () => {
    try {
      setInitialLoading(true);
      const startTime = Date.now();
      await refreshUsers();
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
          pickedByType: item.picked_by_type
        };
      });
      setAttendanceRecords(records);
      const elapsed = Date.now() - startTime;
      if (elapsed < 500) {
        await new Promise(resolve => setTimeout(resolve, 500 - elapsed));
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate, refreshUsers]);

  useEffect(() => {
        if (activeTab === 'day') {
            fetchData();
        } else if (activeTab === 'month' && selectedStudentForMonthly) {
            fetchMonthlyData();
        }
    }, [fetchData, fetchMonthlyData, activeTab, selectedStudentForMonthly]);

  const fetchMonthlyData = useCallback(async () => {
    if (!selectedStudentForMonthly) return;
    try {
      setIsMonthlyLoading(true);
      const response = await api.get(`/attendance?student_id=${selectedStudentForMonthly.id}`);
      
      const data = response.data;
      const attendanceMap: Record<string, any> = {};
      data.forEach((r: any) => {
        attendanceMap[r.date] = r;
      });

      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const records = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = day.toString().padStart(2, '0');
        const monthStr = (selectedMonth + 1).toString().padStart(2, '0');
        const dateStr = `${selectedYear}-${monthStr}-${dayStr}`;
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
          isWeekend: dateObj.getDay() === 0 || dateObj.getDay() === 6
        });
      }
      setMonthlyRecords(records);
    } catch (error) {
      console.error('Error fetching monthly records:', error);
    } finally {
      setIsMonthlyLoading(false);
    }
  }, [selectedStudentForMonthly?.id, selectedMonth, selectedYear]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'day') {
        await fetchData();
      } else {
        await refreshUsers();
        await fetchMonthlyData();
      }
    } catch (error) {
      console.error('Refresh Error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchData, fetchMonthlyData, activeTab, refreshUsers]);

  // Synchronous ref for all state-dependent callbacks to keep them stable
  const stateRef = useRef({ attendanceRecords, users, colors });
  stateRef.current = { attendanceRecords, users, colors };

  // Stabilize students list
  const students = useMemo(() => {
    let filtered = users.filter(u => u.role === 'student' && u.status === 'active');
    if (branchFilterId) {
      filtered = filtered.filter(u => u.branch_id?.toString() === branchFilterId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.name?.toLowerCase().includes(q) ||
        u.studentId?.toString().includes(q) ||
        u.student_id?.toString().includes(q)
      );
    }
    return filtered.slice(0, currentPage * PAGE_SIZE);
  }, [users, branchFilterId, searchQuery, currentPage]);

  const totalFilteredCount = useMemo(() => {
    let filtered = users.filter(u => u.role === 'student' && u.status === 'active');
    if (branchFilterId) {
      filtered = filtered.filter(u => u.branch_id?.toString() === branchFilterId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.name?.toLowerCase().includes(q) ||
        u.studentId?.toString().includes(q) ||
        u.student_id?.toString().includes(q)
      );
    }
    return filtered.length;
  }, [users, branchFilterId, searchQuery]);

  const isAdminUser = authUser?.role === 'master_admin' || authUser?.role === 'admin';
  const headerIconColor = authUser?.role === 'master_admin' ? '#7C3AED' : (authUser?.role === 'admin' ? '#3B82F6' : '#F59E0B');

  const markingStudent = useMemo(() => {
    return students.find(s => s.id === markingStudentId);
  }, [markingStudentId, students]);

  // Attendance summary calculated only when records change
  const attendanceSummary = useMemo(() => {
    const rawRecords = attendanceRecords || {};
    const studentIds = students.map(s => s.id.toString());
    
    // Only count records for students currently in our list
    const activeRecords = Object.entries(rawRecords)
      .filter(([id]) => studentIds.includes(id))
      .map(([_, r]) => r);

    const totalCount = totalFilteredCount || students?.length || 0;
    return {
      total: totalCount,
      in: activeRecords.filter(r => !!r.inTime).length,
      out: activeRecords.filter(r => !!r.outTime).length,
      absent: activeRecords.filter(r => r.status === 'absent').length
    };
  }, [attendanceRecords, students, totalFilteredCount]);

  const monthlyStats = useMemo(() => {
    const present = monthlyRecords.filter(r => r.status === 'present').length;
    const absent = monthlyRecords.filter(r => r.status === 'absent').length;
    const late = monthlyRecords.filter(r => r.status === 'late').length;
    return { present, absent, late, total: monthlyRecords.length };
  }, [monthlyRecords]);

  const hasMore = students.length < totalFilteredCount;

  const loadMore = useCallback(() => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMore]);



  const markPresent = useCallback(async (studentId: string, guardianType: 'Mother' | 'Father' | 'Guardian') => {
    if (selectedDate !== getTodayDateString()) {
      setStatusModal({ visible: true, title: 'Action Restricted', message: 'Attendance can only be marked for the current date!', type: 'warning' });
      return;
    }
    const time = getCurrentTime();
    const { users: currentUsers } = stateRef.current;
    const student = currentUsers.find(u => u.id === studentId);
    let guardianName = 'Guardian';
    
    if (guardianType === 'Father') {
      guardianName = (student as any)?.fatherName || (student as any)?.parentName || 'Father';
    } else if (guardianType === 'Mother') {
      guardianName = (student as any)?.motherName || 'Mother';
    } else {
      guardianName = (student as any)?.guardianName || (student as any)?.parentName || 'Guardian';
    }
    
    const current = attendanceRecords[studentId];
    const newRecord: StudentAttendance = markingType === 'IN' ? {
      id: studentId,
      status: 'present',
      inTime: time,
      outTime: current?.outTime || null,
      droppedBy: guardianName,
      droppedByType: guardianType
    } : {
      ...current,
      outTime: time,
      pickedBy: guardianName,
      pickedByType: guardianType,
      status: 'present'
    };

    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: newRecord
    }));

    setMarkingStudentId(null);

    // Auto-submit change
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
        user_role: 'student'
      });
    } catch (error) {
      console.error('Error auto-submitting attendance present:', error);
      setStatusModal({ visible: true, title: 'Error', message: 'Failed to save attendance change.', type: 'error' });
    }
  }, [markingType, attendanceRecords]); 

  const handleSubmit = useCallback(async () => {
    if (selectedDate !== getTodayDateString()) {
      setStatusModal({ visible: true, title: 'Action Restricted', message: 'Attendance can only be marked for the current date!', type: 'warning' });
      return;
    }
    const rawRecords = attendanceRecords || {};
    const records = Object.values(rawRecords);
    if (records.length === 0) {
      setStatusModal({ visible: true, title: 'No Changes', message: 'No attendance records to submit.', type: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      const promises = records.map(record => {
        const payload = {
          student_id: record.id,
          date: selectedDate,
          status: record.status,
          in_time: record.inTime,
          out_time: record.outTime,
          dropped_by_type: record.droppedByType,
          picked_by_type: record.pickedByType,
          dropped_by_name: record.droppedBy,
          picked_by_name: record.pickedBy,
          user_role: 'student'
        };
        return api.post('/attendance', payload);
      });
      await Promise.all(promises);
      setStatusModal({ 
        visible: true, 
        title: 'Success!', 
        message: 'Attendance stored safely in the vault! 💾✨', 
        type: 'success' 
      });
      setTimeout(() => {
        setStatusModal(prev => ({ ...prev, visible: false }));
        navigation.goBack();
      }, 1500);
    } catch (error) {
       setStatusModal({ visible: true, title: 'Error', message: 'Failed to store attendance.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }, [attendanceRecords, navigation]);



  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleTabChange = useCallback((tab: 'day' | 'month') => {
    setActiveTab(tab);
    if (tab === 'day') setSelectedStudentForMonthly(null);
  }, []);

  const changeMonth = useCallback((offset: number) => {
    setSelectedMonth(prev => {
      let nextMonth = prev + offset;
      if (nextMonth > 11) {
        setSelectedYear(y => y + 1);
        return 0;
      }
      if (nextMonth < 0) {
        setSelectedYear(y => y - 1);
        return 11;
      }
      return nextMonth;
    });
  }, []);

  const unmarkAttendance = useCallback((studentId: string) => {
    setAttendanceRecords(prev => {
      const newRecords = { ...prev };
      delete newRecords[studentId];
      return newRecords;
    });
  }, []);

  const markAbsent = useCallback((studentId: string) => {
    if (selectedDate !== getTodayDateString()) {
      setStatusModal({ visible: true, title: 'Action Restricted', message: 'Attendance can only be marked for the current date!', type: 'warning' });
      return;
    }
    const record = stateRef.current.attendanceRecords[studentId];
    if (record?.status === 'present') {
      setStatusModal({ visible: true, title: 'Action Denied', message: 'Student is already marked Present. Please undo the Present marking first.', type: 'warning' });
      return;
    }

    setChoiceModal({
      visible: true,
      title: 'Mark Absent',
      message: 'Mark this student as Absent for today?',
      iconName: 'account-remove-outline',
      accentColor: '#EF4444',
      options: [
        { 
          label: 'Confirm Absent', 
          type: 'destructive',
          onPress: async () => {
            const newRecord: StudentAttendance = {
              id: studentId,
              status: 'absent',
              inTime: null,
              outTime: null
            };
            
            setAttendanceRecords(prev => ({
              ...prev,
              [studentId]: newRecord
            }));

            // Auto-submit change
            try {
              await api.post('/attendance', {
                student_id: studentId,
                date: selectedDate,
                status: 'absent',
                in_time: null,
                out_time: null,
                user_role: 'student'
              });
            } catch (error) {
              console.error('Error auto-submitting attendance absent:', error);
              setStatusModal({ visible: true, title: 'Error', message: 'Failed to save attendance change.', type: 'error' });
            }
          }
        }
      ]
    });
  }, []);

  const onDayStudentTap = useCallback((studentId: string) => {
    if (selectedDate !== getTodayDateString()) {
      setStatusModal({ visible: true, title: 'Action Restricted', message: 'Attendance can only be marked for the current date!', type: 'warning' });
      return;
    }
    const record = stateRef.current.attendanceRecords[studentId];
    
    // Case 1: Already marked Absent
    if (record?.status === 'absent') {
      setChoiceModal({
        visible: true,
        title: 'Student Absent',
        message: 'Would you like to undo the Absent marking?',
        iconName: 'account-question',
        accentColor: '#EF4444',
        options: [
          { label: 'Yes, Undo', type: 'destructive', onPress: () => unmarkAttendance(studentId) }
        ]
      });
      return;
    }

    if (!record?.inTime) {
      // Mark IN
      setMarkingStudentId(studentId);
      setMarkingType('IN');
    } else if (!record?.outTime) {
      // Offer Mark OUT or Undo
      setChoiceModal({
        visible: true,
        title: 'Attendance Options',
        message: 'Student is already marked IN. What next?',
        iconName: 'account-clock',
        accentColor: '#10B981',
        options: [
          { 
            label: 'Mark OUT', 
            type: 'primary',
            onPress: () => {
              setMarkingStudentId(studentId);
              setMarkingType('OUT');
            }
          },
          { label: 'Undo In-Marking', type: 'destructive', onPress: () => unmarkAttendance(studentId) },
        ]
      });
    } else {
      // Already marked OUT, offer Undo
      setChoiceModal({
        visible: true,
        title: 'Attendance Complete',
        message: 'Attendance cycle finished for this student. Undo marking?',
        iconName: 'check-all',
        accentColor: '#F59E0B',
        options: [
          { label: 'Yes, Undo', type: 'destructive', onPress: () => unmarkAttendance(studentId) }
        ]
      });
    }
  }, [unmarkAttendance]); 

  const onMonthlyStudentSelect = useCallback((student: any) => {
    setSelectedStudentForMonthly(student);
  }, []);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <View className="px-6 py-1">
      <StudentCard 
        student={item}
        record={stateRef.current.attendanceRecords[item.id]} 
        colors={stateRef.current.colors}
        onTap={onDayStudentTap}
        onLongPress={markAbsent}
      />
    </View>
  ), [onDayStudentTap, markAbsent]); 

  const renderMonthlyStudentItem = useCallback(({ item }: { item: any }) => (
    <View className="px-6 py-1">
      <StudentCard 
        student={item}
        record={undefined}
        colors={stateRef.current.colors}
        onTap={() => onMonthlyStudentSelect(item)}
      />
    </View>
  ), [onMonthlyStudentSelect]);

  const renderMonthlyRecord = useCallback(({ item }: { item: any }) => (
    <View className="px-6">
      <MonthlyRecordCard record={item} colors={colors} />
    </View>
  ), [colors]);

  const SummaryHeader = useMemo(() => {
    const { total, in: checkedIn, out: checkedOut, absent } = attendanceSummary;
    return (
      <View className="px-6 mb-6">
        <View className={`${appTheme === 'dark' ? 'bg-[#1e1e1e]' : colors.surface} rounded-[32px] p-6 flex-row justify-between border ${appTheme === 'dark' ? 'border-gray-800' : colors.border} shadow-xl`}>
          <View className={`items-center flex-1 border-r ${appTheme === 'dark' ? 'border-gray-800' : 'border-gray-100/50'}`}>
            <Text className="text-2xl font-black text-brand-pink">{total}</Text>
            <Text className={`text-[9px] font-black uppercase tracking-widest ${colors.textTertiary}`}>Total</Text>
          </View>
          <View className={`items-center flex-1 border-r ${appTheme === 'dark' ? 'border-gray-800' : 'border-gray-100/50'}`}>
            <Text className="text-2xl font-black text-green-500">{checkedIn}</Text>
            <Text className={`text-[9px] font-black uppercase tracking-widest ${colors.textTertiary}`}>Present</Text>
          </View>
          <View className="items-center flex-1">
            <Text className="text-2xl font-black text-red-500">{absent}</Text>
            <Text className={`text-[9px] font-black uppercase tracking-widest ${colors.textTertiary}`}>Absent</Text>
          </View>
        </View>
      </View>
    );
  }, [attendanceSummary, colors, appTheme]);

  const markAttendanceSync = useCallback((guardianLabel: string) => {
    let guardianType: 'Mother' | 'Father' | 'Guardian';
    if (guardianLabel === 'Father') {
      guardianType = 'Father';
    } else if (guardianLabel === 'Mother') {
      guardianType = 'Mother';
    } else {
      guardianType = 'Guardian';
    }
    if (markingStudentId) {
      markPresent(markingStudentId, guardianType);
    }
  }, [markingStudentId, markPresent]);

  return (
    <View 
        className={`flex-1 ${colors.background}`}
        style={{ backgroundColor: appTheme === 'dark' ? '#121212' : '#FFFFFF' }}
    >
      {/* Header */}
      <View style={{ paddingTop: Math.max(insets.top, 20) }} className="px-6 pb-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <TouchableOpacity 
              onPress={handleGoBack} 
              className={`mb-4 ${appTheme === 'dark' ? 'bg-[#1e1e1e]' : colors.surface} w-12 h-12 rounded-2xl items-center justify-center border ${appTheme === 'dark' ? 'border-gray-800' : colors.border} shadow-sm`}
            >
              <MaterialCommunityIcons name="arrow-left" size={28} color={appTheme === 'dark' ? '#FFF' : '#000'} />
            </TouchableOpacity>
            <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>{activeTab === 'day' ? 'Daily' : 'Monthly'}</Text>
            <Text className="text-2xl font-bold text-brand-pink">Attendance ✓</Text>
          </View>
          <View style={{ backgroundColor: headerIconColor, width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', elevation: 10, shadowColor: headerIconColor, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 12 }}>
            <MaterialCommunityIcons name="calendar-check" size={36} color="white" />
          </View>
        </View>
        {isAdminUser && (
          <View className="flex-row items-center mt-4 gap-3">
            <View className="flex-1">
              <BranchFilter selectedBranchId={branchFilterId} onSelect={setBranchFilterId} />
            </View>
            <TouchableOpacity
              onPress={() => { setShowStudentPopup(true); setPopupSearchQuery(''); }}
              className={`${appTheme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-gray-100'} w-12 h-12 rounded-2xl items-center justify-center border shadow-sm`}
            >
              <MaterialCommunityIcons name="magnify" size={22} color={headerIconColor} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* View Selector Dropdown */}
      <ViewDropdown 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        colors={colors}
        isOpen={isDropdownOpen}
        setIsOpen={setIsDropdownOpen}
      />

      {/* Main Content Area */}
      <View className="flex-1">
          {activeTab === 'day' ? (
                <View className="flex-1">
                {initialLoading && <ThreeDotLoader />}
                <FlatList
                    data={students}
                    keyExtractor={(item) => item.id}
                    initialNumToRender={8}
                    maxToRenderPerBatch={5}
                    windowSize={5}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={<EmptyList colors={colors} />}
                    ListHeaderComponent={
                    <>
                        <View className="px-6 mb-6 flex-row items-center justify-center">
                        <TouchableOpacity 
                            onPress={() => setShowDatePicker(true)}
                            className="flex-row items-center"
                        >
                            <MaterialCommunityIcons name="calendar" size={22} color="#F59E0B" />
                            <Text className={`text-base font-black ml-2 ${colors.text}`}>{selectedDate}</Text>
                            <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textTertiary} style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                        </View>

                        {showDatePicker && (
                          <View className="px-6 mb-4">
                            {Platform.OS === 'ios' ? (
                              <View className={`rounded-2xl p-4 ${appTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                <DateTimePicker
                                  value={new Date(selectedDate)}
                                  mode="date"
                                  display="inline"
                                  minimumDate={new Date()}
                                  onChange={(_event: DateTimePickerEvent, date?: Date) => {
                                    if (date) {
                                      setSelectedDate(date.toISOString().split('T')[0]);
                                    }
                                    setShowDatePicker(false);
                                  }}
                                />
                              </View>
                            ) : (
                              <DateTimePicker
                                value={new Date(selectedDate)}
                                mode="date"
                                display="default"
                                minimumDate={new Date()}
                                onChange={(_event: DateTimePickerEvent, date?: Date) => {
                                  if (date) {
                                    setSelectedDate(date.toISOString().split('T')[0]);
                                  }
                                  setShowDatePicker(false);
                                }}
                              />
                            )}
                          </View>
                        )}
    
                        {SummaryHeader}
    
                        <View className="px-6 flex-row items-center justify-between mb-4 mt-2">
                        <Text className={`text-[10px] font-black ${colors.textTertiary} uppercase tracking-[3px]`}>Student Roster</Text>
                        <Text className="text-[9px] text-brand-pink font-black uppercase">Long Press to Mark Absent</Text>
                        </View>
                    </>
                    }
                    renderItem={renderItem}
                    extraData={attendanceRecords}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                      <View>
                        <View className="h-8" />
                        {hasMore && (
                          <TouchableOpacity
                            onPress={loadMore}
                            activeOpacity={0.8}
                            className="mx-6 mb-6 py-4 rounded-2xl items-center border-2 border-dashed"
                            style={{ borderColor: headerIconColor + '40' }}
                          >
                            <MaterialCommunityIcons name="chevron-double-down" size={20} color={headerIconColor} />
                            <Text className="text-brand-pink text-[10px] font-black uppercase tracking-widest mt-1">
                              Load More ({students.length}/{totalFilteredCount})
                            </Text>
                          </TouchableOpacity>
                        )}
                        <View className="h-24" />
                      </View>
                    }
                    refreshControl={
                      <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#F59E0B"
                        colors={["#F59E0B"]}
                        progressBackgroundColor={appTheme === 'dark' ? '#1c1c14' : '#FFFFFF'}
                      />
                    }
                />
                </View>
          ) : (
                <View className="flex-1">
                {selectedStudentForMonthly ? (
                    <FlatList
                    data={monthlyRecords}
                    keyExtractor={(item) => item.day.toString()}
                    renderItem={renderMonthlyRecord}
                    initialNumToRender={15}
                    ListHeaderComponent={
                        <View className="mb-4">
                        <View className="px-6 flex-row items-center justify-between mb-8">
                            <View className="flex-row items-center flex-1">
                            {selectedStudentForMonthly.avatar ? (
                                <Image 
                                source={{ uri: selectedStudentForMonthly.avatar }} 
                                style={{ width: 64, height: 64, borderRadius: 24 }}
                                className="border-4 border-white dark:border-gray-800 shadow-sm"
                                />
                            ) : (
                                <View className={`w-16 h-16 rounded-[24px] items-center justify-center border-4 border-white dark:border-gray-800 ${appTheme === 'dark' ? 'bg-gray-800' : 'bg-brand-pink/10'} shadow-sm`}>
                                <MaterialCommunityIcons name="account-school" size={32} color="#F59E0B" />
                                </View>
                            )}
                            <View className="ml-4 flex-1">
                                <Text className={`text-xl font-black ${colors.text} tracking-tight`} numberOfLines={1}>{selectedStudentForMonthly.name}</Text>
                                <View className="flex-row items-center mt-1">
                                <View className="bg-brand-pink/10 px-2 py-0.5 rounded-lg mr-2 border border-brand-pink/20">
                                    <Text className="text-[10px] font-black text-brand-pink uppercase tracking-widest">{generateIdFromBranchId(selectedStudentForMonthly.branch_id, 'student')}</Text>
                                </View>
                                </View>
                            </View>
                            </View>
                            <TouchableOpacity 
                            onPress={() => setSelectedStudentForMonthly(null)}
                            className="bg-brand-pink w-11 h-11 rounded-2xl items-center justify-center shadow-sm"
                            >
                            <MaterialCommunityIcons name="format-list-bulleted" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
    
                        <View className="px-6 mb-6">
                            <View className="flex-row items-center justify-center">
                              <TouchableOpacity onPress={() => setShowMonthSelector(true)} className="flex-row items-center mr-3 px-5 py-3 rounded-full" style={{ backgroundColor: '#F59E0B15' }}>
                                <MaterialCommunityIcons name="calendar-month" size={14} color="#F59E0B" />
                                <Text className="font-black text-[10px] uppercase tracking-widest text-brand-pink ml-2">{MONTHS[selectedMonth]}</Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => setShowYearSelector(true)} className="flex-row items-center px-5 py-3 rounded-full" style={{ backgroundColor: '#F59E0B15' }}>
                                <MaterialCommunityIcons name="calendar-range" size={14} color="#F59E0B" />
                                <Text className="font-black text-[10px] uppercase tracking-widest text-brand-pink ml-2">{selectedYear}</Text>
                              </TouchableOpacity>
                            </View>
                        </View>

                        {/* Monthly Stats Summary */}
                        <View className="px-6 mb-6">
                          <View className="flex-row justify-between">
                            {[
                              { label: 'Present', value: monthlyStats.present, color: '#10B981' },
                              { label: 'Absent', value: monthlyStats.absent, color: '#EF4444' },
                              { label: 'Late', value: monthlyStats.late, color: '#F59E0B' },
                            ].map((item) => (
                              <View key={item.label} className="flex-1 items-center mx-1" style={{ backgroundColor: appTheme === 'dark' ? '#1e1e1e' : '#FFFFFF', borderRadius: 20, padding: 16, elevation: 5, borderWidth: 1, borderColor: appTheme === 'dark' ? '#262626' : '#F3F4F6' }}>
                                <Text style={{ fontSize: 24, fontWeight: '900', color: item.color }}>{item.value}</Text>
                                <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: appTheme === 'dark' ? '#9CA3AF' : '#6B7280', marginTop: 4 }}>{item.label}</Text>
                              </View>
                            ))}
                          </View>
                        </View>

                        {showMonthSelector && (
                          <View style={{ position: 'absolute', inset: 0, zIndex: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 24 }}>
                            <View style={{ backgroundColor: appTheme === 'dark' ? '#1c1c14' : '#FFFFFF', width: '100%', borderRadius: 45, padding: 24 }}>
                              <Text style={{ fontSize: 22, fontWeight: '900', color: appTheme === 'dark' ? '#FFFFFF' : '#111827', textAlign: 'center', marginBottom: 20 }}>Select Month</Text>
                              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                {MONTHS.map((m, i) => (
                                  <TouchableOpacity
                                    key={m}
                                    onPress={() => { setSelectedMonth(i); setShowMonthSelector(false); }}
                                    style={{ width: '48%', paddingVertical: 16, borderRadius: 16, marginBottom: 8, alignItems: 'center', backgroundColor: selectedMonth === i ? '#F59E0B' : (appTheme === 'dark' ? 'rgba(255,255,255,0.05)' : '#F9FAFB') }}
                                  >
                                    <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: selectedMonth === i ? '#FFFFFF' : (appTheme === 'dark' ? '#FFFFFF' : '#111827') }}>{m}</Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>
                          </View>
                        )}

                        {showYearSelector && (
                          <View style={{ position: 'absolute', inset: 0, zIndex: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 24 }}>
                            <View style={{ backgroundColor: appTheme === 'dark' ? '#1c1c14' : '#FFFFFF', width: '100%', borderRadius: 45, padding: 24 }}>
                              <Text style={{ fontSize: 22, fontWeight: '900', color: appTheme === 'dark' ? '#FFFFFF' : '#111827', textAlign: 'center', marginBottom: 20 }}>Select Year</Text>
                              <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                  {YEARS.map((y) => (
                                    <TouchableOpacity
                                      key={y}
                                      onPress={() => { setSelectedYear(y); setShowYearSelector(false); }}
                                      style={{ width: '48%', paddingVertical: 16, borderRadius: 16, marginBottom: 8, alignItems: 'center', backgroundColor: selectedYear === y ? '#F59E0B' : (appTheme === 'dark' ? 'rgba(255,255,255,0.05)' : '#F9FAFB') }}
                                    >
                                      <Text style={{ fontSize: 14, fontWeight: '900', color: selectedYear === y ? '#FFFFFF' : (appTheme === 'dark' ? '#FFFFFF' : '#111827') }}>{y}</Text>
                                    </TouchableOpacity>
                                  ))}
                                </View>
                              </ScrollView>
                            </View>
                          </View>
                        )}

                        {isMonthlyLoading && (
                            <ActivityIndicator color="#F59E0B" style={{ marginTop: 10, marginBottom: 10 }} />
                        )}
                        </View>
                    }
                    ListFooterComponent={<View className="h-32" />}
                    />
                ) : (
                    <FlatList
                    data={students}
                    keyExtractor={(item) => `monthly-select-${item.id}`}
                    initialNumToRender={10}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <View className="px-6 mb-6 mt-4">
                            <Text className={`text-[10px] font-black uppercase tracking-[3px] ${colors.textTertiary}`}>Select Student for Report</Text>
                        </View>
                    }
                    renderItem={renderMonthlyStudentItem}
                    />
                )}
                </View>
          )}
      </View>

      {/* Full Screen Marking Dashboard */}
      <Modal 
        visible={!!markingStudentId} 
        animationType="slide" 
        transparent={false}
        onRequestClose={() => setMarkingStudentId(null)}
      >
        <View className="flex-1 bg-white">
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Top Bar */}
            <View style={{ paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 30) + 16 : 50 }} className="px-6 flex-row items-center justify-between mb-8">
                <View>
                  <Text className="text-[10px] font-black uppercase tracking-widest text-gray-400">Attendance</Text>
                  <Text className="text-2xl font-black text-gray-900">Report Entry</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setMarkingStudentId(null)}
                className="bg-gray-100 w-11 h-11 rounded-2xl items-center justify-center"
              >
                <MaterialCommunityIcons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {markingStudent && (
              <View className="px-6">
                {/* Student Card */}
                <View className="items-center mb-10">
                  <View className="relative mb-5">
                    <View className="w-28 h-28 rounded-full bg-amber-50 border-4 border-amber-200 overflow-hidden items-center justify-center">
                      {markingStudent.avatar ? (
                        <Image source={{ uri: markingStudent.avatar }} className="w-full h-full" resizeMode="cover" />
                      ) : (
                        <MaterialCommunityIcons name="account-child" size={52} color="#D97706" />
                      )}
                    </View>
                    <View className="absolute -bottom-1 -right-1 bg-amber-500 w-9 h-9 rounded-xl items-center justify-center border-4 border-white shadow-sm">
                      <MaterialCommunityIcons name={markingType === 'IN' ? "login" : "logout"} size={16} color="white" />
                    </View>
                  </View>
                  <Text className="text-2xl font-black text-gray-900 tracking-tight text-center">{markingStudent.name}</Text>
                  <View className="flex-row items-center mt-2 bg-amber-50 px-4 py-1.5 rounded-xl">
                    <MaterialCommunityIcons name="badge-account" size={14} color="#D97706" />
                    <Text className="text-amber-600 text-[10px] font-black uppercase tracking-widest ml-2">
                      ID: {markingStudent.studentId || 'N/A'}
                    </Text>
                  </View>
                </View>

                {/* Guardian Section */}
                <View className="mb-6">
                  <Text className="text-lg font-black text-gray-900 mb-1">Who is dropping off?</Text>
                  <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-5">Select the guardian present</Text>

                  {[
                    { label: 'Father', icon: 'face-man', color: '#3B82F6', name: (markingStudent as any).fatherName },
                    { label: 'Mother', icon: 'face-woman', color: '#D97706', name: (markingStudent as any).motherName },
                    { label: 'Guardian', icon: 'account-child', color: '#10B981', name: (markingStudent as any).parentName },
                  ].map((item, idx) => (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.9}
                      onPress={() => markAttendanceSync(item.label)}
                      className="mb-4 rounded-2xl overflow-hidden shadow-sm border border-gray-100"
                    >
                      <View className="p-5 flex-row items-center">
                        <View style={{ backgroundColor: item.color + '18' }} className="w-14 h-14 rounded-2xl items-center justify-center mr-4">
                          <MaterialCommunityIcons name={item.icon as any} size={30} color={item.color} />
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center flex-wrap">
                            {item.name ? (
                              <Text className="text-base font-black text-gray-900">{item.name}</Text>
                            ) : (
                              <Text className="text-base font-black text-gray-400">Not specified</Text>
                            )}
                            <View style={{ backgroundColor: item.color + '20' }} className="ml-3 px-2.5 py-0.5 rounded-lg">
                              <Text style={{ color: item.color }} className="text-[9px] font-black uppercase tracking-widest">{item.label}</Text>
                            </View>
                          </View>
                          <Text className="text-xs text-gray-500 mt-1">Guardian</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={22} color="#9CA3AF" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            <View className="h-32" />
          </ScrollView>
        </View>
      </Modal>

      {/* Student Search Popup */}
      <Modal
        visible={showStudentPopup}
        animationType="slide"
        transparent={false}
        onRequestClose={() => { setShowStudentPopup(false); setPopupSearchQuery(''); }}
      >
        <View className={`flex-1 ${colors.background}`}>
          <View style={{ paddingTop: Math.max(insets.top, 20) }} className="px-6 pb-4">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className={`text-[10px] font-black uppercase tracking-[4px] ${colors.textTertiary}`}>Search</Text>
                <Text className={`text-2xl font-black ${colors.text}`}>Student Roster</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowStudentPopup(false)}
                className={`${appTheme === 'dark' ? 'bg-[#25251d]' : 'bg-gray-100'} w-12 h-12 rounded-2xl items-center justify-center border ${appTheme === 'dark' ? 'border-white/10' : 'border-gray-200'} shadow-sm`}
              >
                <MaterialCommunityIcons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View className={`flex-row items-center px-4 h-14 rounded-2xl border ${appTheme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-gray-100'}`}>
              <MaterialCommunityIcons name="magnify" size={20} color={headerIconColor} />
              <TextInput
                className={`flex-1 ml-3 font-bold text-base ${colors.text}`}
                placeholder="Search by name or ID..."
                placeholderTextColor={appTheme === 'dark' ? '#6B7280' : '#9CA3AF'}
                value={popupSearchQuery}
                onChangeText={setPopupSearchQuery}
              />
              {popupSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setPopupSearchQuery('')}>
                  <MaterialCommunityIcons name="close-circle" size={20} color={colors.textSecondary} opacity={0.5} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <FlatList
            data={students.filter(s => {
              if (!popupSearchQuery) return true;
              const q = popupSearchQuery.toLowerCase();
              const id = generateIdFromBranchId(s.branch_id, 'student').toLowerCase();
              return s.name.toLowerCase().includes(q) || id.includes(q);
            })}
            keyExtractor={(item) => `popup-${item.id}`}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyList colors={colors} />}
            renderItem={({ item }) => {
              const studentId = generateIdFromBranchId(item.branch_id, 'student');
              return (
                <TouchableOpacity
                  onPress={() => { setShowStudentPopup(false); setMarkingStudentId(item.id); }}
                  activeOpacity={0.7}
                  className="mx-6 mb-3"
                >
                  <View className={`${appTheme === 'dark' ? 'bg-[#1a1a18] border-white/5' : 'bg-white border-gray-100'} p-4 rounded-[20px] flex-row items-center border shadow-sm`}>
                    <View className={`w-14 h-14 rounded-2xl items-center justify-center ${appTheme === 'dark' ? 'bg-gray-800' : 'bg-brand-pink/10'}`}>
                      {item.avatar ? (
                        <Image source={{ uri: item.avatar }} className="w-14 h-14 rounded-2xl" resizeMode="cover" />
                      ) : (
                        <MaterialCommunityIcons name="account-school" size={28} color="#F59E0B" />
                      )}
                    </View>
                    <View className="ml-4 flex-1">
                      <Text className={`text-base font-black ${colors.text} tracking-tight`} numberOfLines={1}>{item.name}</Text>
                      <View className="flex-row items-center mt-1">
                        <View className="bg-brand-pink/10 px-2 py-0.5 rounded-lg border border-brand-pink/20">
                          <Text className="text-[9px] font-black text-brand-pink uppercase tracking-widest">{studentId}</Text>
                        </View>
                        {selectedDate === getTodayDateString() && stateRef.current.attendanceRecords[item.id] && (
                          <View className={`ml-2 px-2 py-0.5 rounded-lg ${stateRef.current.attendanceRecords[item.id]?.status === 'present' ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                            <Text className={`text-[9px] font-black uppercase tracking-widest ${stateRef.current.attendanceRecords[item.id]?.status === 'present' ? 'text-green-500' : 'text-red-500'}`}>
                              {stateRef.current.attendanceRecords[item.id]?.status === 'present' ? '✓ PRESENT' : '✗ ABSENT'}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
                  </View>
                </TouchableOpacity>
              );
            }}
            ListFooterComponent={
              hasMore ? (
                <TouchableOpacity
                  onPress={loadMore}
                  activeOpacity={0.8}
                  className="mx-6 mb-6 py-4 rounded-2xl items-center border-2 border-dashed"
                  style={{ borderColor: headerIconColor + '40' }}
                >
                  <MaterialCommunityIcons name="chevron-double-down" size={20} color={headerIconColor} />
                  <Text className="text-brand-pink text-[10px] font-black uppercase tracking-widest mt-1">
                    Load More ({students.length}/{totalFilteredCount})
                  </Text>
                </TouchableOpacity>
              ) : <View className="h-24" />
            }
          />
        </View>
      </Modal>

      <StatusModal
        visible={statusModal.visible}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
        onClose={() => setStatusModal({ ...statusModal, visible: false })}
      />

      <ChoiceModal
        visible={choiceModal.visible}
        title={choiceModal.title}
        message={choiceModal.message}
        options={choiceModal.options}
        iconName={choiceModal.iconName}
        accentColor={choiceModal.accentColor}
        onClose={() => setChoiceModal({ ...choiceModal, visible: false })}
      />
    </View>
  );
}
