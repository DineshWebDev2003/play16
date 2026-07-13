import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  View, Text, TouchableOpacity, Alert, Image, Dimensions, 
  ActivityIndicator, FlatList, ScrollView, Modal, TextInput 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function StudentAttendanceReportScreen({ navigation }: any) {
  const { colors, theme: appTheme } = useTheme();
  const { users } = useAuth();
  const insets = useSafeAreaInsets();
  const isDark = appTheme === 'dark';
  
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyRecords, setMonthlyRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const students = useMemo(() => {
    const list = users.filter(u => u.role === 'student');
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

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* ── Background Decoration ── */}
      <View className="absolute top-0 left-0 right-0 h-[450px] overflow-hidden">
        <LinearGradient
          colors={isDark ? ['#B45309', '#1c1c14'] : ['#F59E0B', '#FCD34D']}
          className="absolute inset-0"
        />
      </View>

      <View className="flex-1">
        {/* Header */}
        <View style={{ paddingTop: Math.max(insets.top, 20) }} className="px-6 pb-6">
          <View className="flex-row items-center justify-between">
            <View>
              <TouchableOpacity 
                onPress={() => selectedStudent ? setSelectedStudent(null) : navigation.goBack()}
                className={`w-12 h-12 rounded-2xl items-center justify-center border mb-6 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-indigo-100 shadow-sm'}`}
              >
                <MaterialCommunityIcons name="arrow-left" size={24} color={isDark ? '#FFF' : '#6366F1'} />
              </TouchableOpacity>
              <Text className={`text-4xl font-black tracking-tighter ${colors.text}`}>Roster</Text>
              <Text className="text-2xl font-bold text-brand-pink mt-[-4px]">Analytics 📊</Text>
            </View>
            <View className="bg-indigo-600 w-20 h-20 rounded-[28px] items-center justify-center border-4 border-white shadow-2xl rotate-3 overflow-hidden">
               <MaterialCommunityIcons name="database-eye-outline" size={40} color="white" />
            </View>
          </View>
        </View>

        {!selectedStudent ? (
           <View className="flex-1 px-6">
              <View className={`${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100'} p-5 rounded-[28px] border mb-6 flex-row items-center shadow-lg`}>
                 <MaterialCommunityIcons name="magnify" size={24} color={isDark ? '#4B5563' : '#9CA3AF'} />
                 <TextInput 
                    className={`ml-3 flex-1 font-black ${colors.text} text-lg`}
                    placeholder="Search student name..."
                    placeholderTextColor={isDark ? '#334155' : '#9CA3AF'}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                 />
              </View>

              <FlatList
                data={students}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        onPress={() => setSelectedStudent(item)}
                        className={`p-5 rounded-[32px] mb-4 flex-row items-center border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}
                    >
                        <View className={`w-14 h-14 rounded-2xl items-center justify-center mr-4 ${isDark ? 'bg-white/5' : 'bg-indigo-50'}`}>
                            {item.avatar ? (
                                <Image source={{ uri: item.avatar }} className="w-full h-full rounded-2xl" resizeMode="cover" />
                            ) : (
                                <MaterialCommunityIcons name="account-child-outline" size={32} color={isDark ? '#4B5563' : '#6366F1'} />
                            )}
                        </View>
                        <View className="flex-1">
                            <Text className={`text-lg font-black ${colors.text} tracking-tight`} numberOfLines={1}>{item.name}</Text>
                            <Text className={`text-[9px] font-black uppercase tracking-widest ${colors.textTertiary} mt-1`}>ID: {item.studentId || item.id}</Text>
                        </View>
                        <View className="bg-gray-50 dark:bg-white/5 w-10 h-10 rounded-xl items-center justify-center">
                            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View className="items-center justify-center opacity-30 mt-20">
                        <MaterialCommunityIcons name="account-search-outline" size={80} color={colors.text} />
                        <Text className={`font-black uppercase tracking-[5px] ${colors.text} mt-4 text-xs`}>No Students Found</Text>
                    </View>
                }
              />
           </View>
        ) : (
           <View className="flex-1 px-6">
              {/* Selected Student Card */}
              <View className="bg-brand-pink p-6 rounded-[40px] shadow-2xl flex-row items-center relative overflow-hidden mb-8">
                  <View className="bg-white/20 w-16 h-16 rounded-[24px] items-center justify-center mr-5 border border-white/20">
                    <MaterialCommunityIcons name="badge-account-horizontal-outline" size={36} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-2xl font-black tracking-tight" numberOfLines={1}>{selectedStudent.name}</Text>
                    <Text className="text-white/80 font-black uppercase text-[10px] tracking-widest">Growth Analytics • {MONTHS[selectedMonth]}</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => setShowMonthSelector(true)}
                    className="bg-white/20 w-12 h-12 rounded-2xl items-center justify-center border border-white/20"
                  >
                    <MaterialCommunityIcons name="calendar-month-outline" size={24} color="white" />
                  </TouchableOpacity>
                  {/* Decorative background pattern */}
                  <View className="absolute -bottom-10 -right-10 opacity-10">
                     <MaterialCommunityIcons name="school-outline" size={150} color="white" />
                  </View>
              </View>

              {/* Stats Grid */}
              <View className="flex-row gap-3 mb-8">
                  <View className={`${isDark ? 'bg-white/5' : 'bg-white'} flex-1 p-5 rounded-[28px] border ${isDark ? 'border-white/5' : 'border-gray-50 shadow-sm'} items-center`}>
                    <Text className="text-green-500 text-2xl font-black">{stats.present}</Text>
                    <Text className="text-gray-400 text-[8px] font-black uppercase tracking-widest mt-1">Present</Text>
                  </View>
                  <View className={`${isDark ? 'bg-white/5' : 'bg-white'} flex-1 p-5 rounded-[28px] border ${isDark ? 'border-white/5' : 'border-gray-50 shadow-sm'} items-center`}>
                    <Text className="text-red-500 text-2xl font-black">{stats.absent}</Text>
                    <Text className="text-gray-400 text-[8px] font-black uppercase tracking-widest mt-1">Absent</Text>
                  </View>
                  <View className={`${isDark ? 'bg-white/5' : 'bg-white'} flex-1 p-5 rounded-[28px] border ${isDark ? 'border-white/5' : 'border-gray-50 shadow-sm'} items-center`}>
                    <Text className="text-orange-500 text-2xl font-black">{stats.late}</Text>
                    <Text className="text-gray-400 text-[8px] font-black uppercase tracking-widest mt-1">Late</Text>
                  </View>
              </View>

              <FlatList
                data={monthlyRecords}
                keyExtractor={(item) => item.day.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                renderItem={({ item }) => (
                    <View className={`p-5 rounded-[36px] mb-4 flex-row items-center border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-50 shadow-sm'}`}>
                        <View className={`w-14 h-14 rounded-2xl items-center justify-center mr-4 ${
                            item.status === 'present' ? 'bg-green-500/10' : (item.status === 'absent' ? 'bg-red-500/10' : (isDark ? 'bg-white/5' : 'bg-gray-100'))
                        }`}>
                            <Text className={`font-black text-xl ${
                                item.status === 'present' ? 'text-green-600' : (item.status === 'absent' ? 'text-red-500' : 'text-gray-400')
                            }`}>{item.day}</Text>
                        </View>
                        <View className="flex-1">
                            <Text className={`font-black ${colors.text} text-sm lowercase tracking-tighter capitalize`}>{item.dayName}, {item.date}</Text>
                            <View className="flex-row items-center mt-1">
                                <View className={`w-1.5 h-1.5 rounded-full mr-2 ${item.status === 'present' ? 'bg-green-500' : (item.status === 'absent' ? 'bg-red-500' : 'bg-gray-400')}`} />
                                <Text className={`text-[9px] font-black uppercase tracking-widest ${item.status === 'present' ? 'text-green-500' : (item.status === 'absent' ? 'text-red-500' : 'text-gray-400')}`}>
                                    {item.status.replace('_', ' ')}
                                </Text>
                            </View>
                        </View>
                        {item.status === 'present' && (
                            <View className="items-end bg-gray-50 dark:bg-white/2 rounded-2xl py-2 px-3 border border-gray-100 dark:border-white/5">
                                <View className="flex-row items-center mb-1">
                                   <MaterialCommunityIcons name="clock-in" size={10} color="#10B981" />
                                   <Text className="text-green-500 text-[9px] font-black ml-1">{item.clockIn}</Text>
                                </View>
                                {item.clockOut && (
                                   <View className="flex-row items-center">
                                      <MaterialCommunityIcons name="clock-out" size={10} color="#F59E0B" />
                                      <Text className="text-brand-pink text-[9px] font-black ml-1">{item.clockOut}</Text>
                                   </View>
                                )}
                            </View>
                        )}
                    </View>
                )}
              />
           </View>
        )}
      </View>

      {/* Month Selector Overlay */}
      <Modal visible={showMonthSelector} transparent animationType="fade">
        <View className="flex-1 bg-black/80 items-center justify-center px-6">
           <View className={`${isDark ? 'bg-[#1a1a18]' : 'bg-white'} w-full rounded-[45px] p-8 shadow-2xl border border-white/10`}>
              <Text className={`text-2xl font-black ${colors.text} mb-8 text-center tracking-tighter`}>Select Reporting Window</Text>
              <View className="flex-row flex-wrap justify-between">
                 {MONTHS.map((m, i) => (
                    <TouchableOpacity 
                       key={m}
                       onPress={() => { setSelectedMonth(i); setShowMonthSelector(false); }}
                       className={`w-[48%] py-4 rounded-[24px] mb-4 items-center border-2 ${selectedMonth === i ? 'border-brand-pink bg-brand-pink' : (isDark ? 'border-white/5 bg-white/5' : 'border-gray-50 bg-gray-50')}`}
                    >
                       <Text className={`font-black uppercase tracking-widest text-[10px] ${selectedMonth === i ? 'text-white' : colors.textSecondary}`}>{m}</Text>
                    </TouchableOpacity>
                 ))}
              </View>
              <TouchableOpacity 
                 onPress={() => setShowMonthSelector(false)}
                 className="mt-6 bg-gray-100 dark:bg-white/10 py-5 rounded-[24px] items-center"
              >
                 <Text className="font-black text-gray-400 uppercase tracking-widest text-xs">Close Panel</Text>
              </TouchableOpacity>
           </View>
        </View>
      </Modal>
    </View>
  );
}
