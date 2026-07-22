import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Image,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth, User } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../services/api';

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

interface StudentListScreenProps {
  navigation: NavigationProps;
}

export default function StudentListScreen({ navigation }: StudentListScreenProps) {
  const { users, fees: allFees, fetchData } = useAuth();
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceToday, setAttendanceToday] = useState<Record<string, any>>({});
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const fetchTodayAttendance = useCallback(async () => {
    try {
      setLoadingAttendance(true);
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get(`/attendance?date=${today}`);
      const data = response.data;
      const map: Record<string, any> = {};
      data.forEach((r: any) => {
        map[r.student_id] = r;
      });
      setAttendanceToday(map);
    } catch (error) {
      console.error('Error fetching today attendance:', error);
    } finally {
      setLoadingAttendance(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
      await fetchTodayAttendance();
    } catch (error) {
      console.error('Refresh Error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchData, fetchTodayAttendance]);

  React.useEffect(() => {
    fetchTodayAttendance();
  }, [fetchTodayAttendance]);

  const studentFinancials = React.useMemo(() => {
    const map: Record<string, { status: 'overdue' | 'pending' | 'paid', title: string }> = {};
    const todayStr = new Date().toISOString().split('T')[0];
    const monthYearCode = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    users.forEach(student => {
      if (student.role !== 'student') return;
      const dbId = student.id?.toString();
      const schoolId = student.studentId?.toString();

      const myFees = allFees.filter(f => (f.student_id?.toString() === dbId || f.student_id?.toString() === schoolId));
      const unpaidFees = myFees.filter(f => f.status === 'unpaid');
      const currentMonthPaid = myFees.find(f => f.date?.includes(monthYearCode) && f.status === 'paid');
      const currentMonthBilled = myFees.find(f => f.date?.includes(monthYearCode));

      let isOverdue = unpaidFees.some(f => f.due_date && f.due_date < todayStr);
      if (!isOverdue && !currentMonthPaid && !currentMonthBilled) {
        const dueDayNum = parseInt(student.fee_due_day || '5');
        if (new Date().getDate() > dueDayNum) isOverdue = true;
      }

      const isPending = unpaidFees.length > 0 || (!currentMonthPaid && (student.fees && parseInt(student.fees) > 0));

      map[student.id] = {
        status: (isPending && isOverdue) ? 'overdue' : (isPending ? 'pending' : 'paid'),
        title: (isPending && isOverdue) ? 'OVERDUE' : (isPending ? 'PENDING' : 'PAID')
      };
    });
    return map;
  }, [users, allFees]);

  const students = users.filter(u => u.role === 'student' && u.status === 'active');
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.studentId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryTheme = (category?: string) => {
    switch (category) {
      case 'Playschool': return { color: '#F59E0B', bg: '#FDF2F8', icon: 'face-man-profile' };
      case 'PreKG': return { color: '#F59E0B', bg: '#FFFBEB', icon: 'baby-face-outline' };
      case 'Daycare': return { color: '#3B82F6', bg: '#EFF6FF', icon: 'home-heart' };
      default: return { color: '#6B7280', bg: '#F9FAFB', icon: 'school' };
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF' }}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" />
        }
      >
        {/* Header */}
        <View style={{ paddingTop: Math.max(insets.top, 20) }} className="px-6 pb-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className={`mb-4 ${colors.surface} w-12 h-12 rounded-2xl items-center justify-center border ${colors.border} shadow-sm`}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="arrow-left" size={28} color={theme === 'dark' ? '#FFF' : '#000'} />
              </TouchableOpacity>
              <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>Students</Text>
              <Text className="text-2xl font-bold text-brand-pink">Directory 📇</Text>
            </View>
            <View className="bg-brand-pink w-20 h-20 rounded-3xl items-center justify-center shadow-lg border-4 border-white rotate-3">
              <MaterialCommunityIcons name="account-group" size={42} color="white" />
            </View>
          </View>

          {/* Search */}
          <View className={`px-6 py-4 rounded-2xl flex-row items-center mt-6 ${colors.surface} border ${colors.border}`}>
            <MaterialCommunityIcons name="magnify" size={22} color="#F59E0B" />
            <TextInput
              placeholder="Search by name or ID..."
              placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
              className={`flex-1 ml-3 font-bold text-base ${colors.text}`}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Count */}
        <View className="flex-row items-center justify-between px-6 mb-5">
          <Text className={`text-xl font-black ${colors.text} ml-1 uppercase tracking-widest opacity-60`}>
            Student Records ✨
          </Text>
          <View className="bg-brand-pink/10 px-4 py-1.5 rounded-full border border-brand-pink/10">
            <Text className="text-brand-pink font-black text-xs">{filteredStudents.length} found</Text>
          </View>
        </View>

        {/* List */}
        <View className="px-6">
          {loadingAttendance && (
            <View className="items-center py-4">
              <ActivityIndicator size="small" color="#F59E0B" />
            </View>
          )}
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => {
              const catTheme = getCategoryTheme(student.category);
              const finStatus = studentFinancials[student.id];
              return (
                <TouchableOpacity
                  key={student.id}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('studentDetail', { studentId: student.id })}
                  style={{
                    width: '100%', aspectRatio: 16 / 9,
                    backgroundColor: theme === 'dark' ? '#1e1e1c' : '#FFFFFF',
                  }}
                  className="mb-6 relative overflow-hidden rounded-[32px] border-4 border-white shadow-xl"
                >
                  {/* Background with avatar/icon */}
                  {student.avatar ? (
                    <Image
                      source={{ uri: student.avatar }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center" style={{ backgroundColor: theme === 'dark' ? '#2a2a28' : '#FDF2F8' }}>
                      <MaterialCommunityIcons name="account-child" size={80} color={theme === 'dark' ? '#3a3a38' : '#F9A8D4'} />
                    </View>
                  )}

                  {/* Dark overlay for text readability */}
                  <View className="absolute inset-0 justify-end p-6" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
                    {/* Top badges row */}
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row gap-2">
                        <View className="px-3 py-1 rounded-full flex-row items-center" style={{ backgroundColor: catTheme.bg }}>
                          <MaterialCommunityIcons name={catTheme.icon as any} size={11} color={catTheme.color} />
                          <Text className="text-[10px] font-black ml-1.5 uppercase" style={{ color: catTheme.color }}>{student.category || 'Playschool'}</Text>
                        </View>
                        <View className="bg-white/20 px-3 py-1 rounded-full flex-row items-center">
                          <MaterialCommunityIcons name={student.gender === 'Female' ? 'gender-female' : 'gender-male'} size={11} color="white" />
                          <Text className="text-white text-[10px] font-black ml-1.5 uppercase">{student.gender || 'N/A'}</Text>
                        </View>
                      </View>
                      <View className={`px-3 py-1 rounded-full ${
                        finStatus.status === 'overdue' ? 'bg-red-500/90' :
                        finStatus.status === 'pending' ? 'bg-amber-500/90' : 'bg-green-500/90'
                      }`}>
                        <Text className="text-white text-[9px] font-black uppercase tracking-wider">{finStatus.title}</Text>
                      </View>
                    </View>

                    {/* Student Name */}
                    <Text className="text-white text-2xl font-black tracking-tighter mb-1" numberOfLines={1}>
                      {student.name}
                    </Text>

                    {/* ID Row */}
                    <View className="flex-row items-center mb-1">
                      <MaterialCommunityIcons name="card-account-details-outline" size={13} color="white" />
                      <Text className="text-white/80 text-xs font-bold ml-1.5 uppercase tracking-wider">
                        {student.studentId || 'PENDING'}
                      </Text>
                    </View>

                    {/* Bottom row */}
                    <View className="flex-row items-center justify-between mt-1">
                      <View className="flex-row items-center">
                        <MaterialCommunityIcons name="account-circle-outline" size={13} color="white" />
                        <Text className="text-white/70 text-[10px] font-bold ml-1.5">
                          {student.fatherName || 'Parent'} {student.fatherPhone ? `• ${student.fatherPhone}` : ''}
                        </Text>
                      </View>
                      <Text className="text-white/50 text-[10px] font-bold">View Profile →</Text>
                    </View>
                  </View>

                  {/* Attendance strip at bottom edge */}
                  {attendanceToday[student.id] && (
                    <View className="absolute bottom-0 left-0 right-0 px-6 py-2 flex-row items-center" style={{ backgroundColor: attendanceToday[student.id].status === 'absent' ? 'rgba(239,68,68,0.85)' : 'rgba(16,185,129,0.85)' }}>
                      <MaterialCommunityIcons
                        name={attendanceToday[student.id].status === 'absent' ? 'close-circle' : 'check-circle'}
                        size={13}
                        color="white"
                      />
                      <Text className="text-white text-[9px] font-black ml-2 uppercase tracking-wider">
                        Today: {attendanceToday[student.id].status === 'absent' ? 'Absent' : `Present (${attendanceToday[student.id].in_time || 'In'})`}
                      </Text>
                      {attendanceToday[student.id].out_time && (
                        <Text className="text-white/80 text-[9px] font-bold ml-3 italic">
                          Picked at {attendanceToday[student.id].out_time}
                        </Text>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          ) : (
            <View className="items-center justify-center py-20">
              <MaterialCommunityIcons name="account-search-outline" size={80} color={theme === 'dark' ? '#4B5563' : '#E5E7EB'} />
              <Text className={`text-2xl font-black mt-6 ${colors.text}`}>No Students Found</Text>
              <Text className={`text-center px-10 mt-2 ${colors.textSecondary}`}>Try searching for a different name or checking the student ID.</Text>
            </View>
          )}
        </View>
        <View className="h-32" />
      </ScrollView>
    </View>
  );
}
