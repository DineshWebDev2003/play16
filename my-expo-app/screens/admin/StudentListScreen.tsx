import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Dimensions, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth, User } from '../../contexts/AuthContext';
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
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceToday, setAttendanceToday] = useState<Record<string, any>>({});
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const fetchTodayAttendance = React.useCallback(async () => {
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

  const onRefresh = React.useCallback(async () => {
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

  // ── Financial Status Memo ──
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
    <View className="flex-1 bg-white">
      <View className="flex-1">
        {/* ── Header ── */}
        <View style={{ paddingTop: Math.max(insets.top, 20) }} className="px-6 pb-2">
          <View className="flex-row items-center justify-between">
            <View>
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                className="w-12 h-12 rounded-2xl items-center justify-center bg-gray-100"
              >
                <MaterialCommunityIcons name="arrow-left" size={24} color="#F59E0B" />
              </TouchableOpacity>
              <Text className="text-4xl font-black mt-6 tracking-tighter text-gray-900">Students</Text>
              <Text className="text-2xl font-bold text-brand-pink mt-[-4px]">Directory 📇</Text>
            </View>
            <View className="w-20 h-20 rounded-2xl items-center justify-center border-4 border-white bg-brand-pink relative overflow-hidden">
               <MaterialCommunityIcons name="account-group" size={40} color="white" />
            </View>
          </View>

          {/* Search Bar */}
          <View className="mt-8 px-6 py-4 rounded-2xl flex-row items-center bg-gray-50">
            <MaterialCommunityIcons name="magnify" size={24} color="#F59E0B" />
            <TextInput
              placeholder="Search by name or ID..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 ml-3 font-bold text-base text-gray-900"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View className="flex-row items-center justify-between px-8 mb-4 mt-2">
           <Text className="text-[10px] font-black uppercase tracking-[3px] text-gray-500">Records found</Text>
           <View className="bg-brand-pink/10 px-3 py-1 rounded-full">
              <Text className="text-brand-pink font-black text-[10px]">{filteredStudents.length}</Text>
           </View>
        </View>

        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" />
          }
        >
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => {
              const catTheme = getCategoryTheme(student.category);
              const finStatus = studentFinancials[student.id];
              return (
                <TouchableOpacity
                  key={student.id}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('studentDetail', { studentId: student.id })}
                  className="mb-6 rounded-2xl overflow-hidden bg-white border border-gray-100"
                >
                  <View className="p-5 flex-row items-center">
                    {/* Student Avatar */}
                    <View className="w-20 h-20 rounded-[24px] overflow-hidden bg-gray-50 border-2 border-white items-center justify-center">
                      {student.avatar ? (
                        <Image source={{ uri: student.avatar }} className="w-full h-full" resizeMode="cover" />
                      ) : (
                        <MaterialCommunityIcons name="account-child" size={40} color="#E5E7EB" />
                      )}
                    </View>

                    <View className="flex-1 ml-5">
                      <View className="flex-row items-center justify-between">
                         <Text className="text-lg font-black tracking-tight flex-1 mr-2 text-gray-900" numberOfLines={1}>
                           {student.name}
                         </Text>
                         <View className={`px-2 py-1 rounded-lg ${finStatus.status === 'overdue' ? 'bg-red-500' : finStatus.status === 'pending' ? 'bg-amber-500' : 'bg-green-500'}`}>
                           <Text className="text-white text-[8px] font-black uppercase">{finStatus.title}</Text>
                         </View>
                      </View>

                      <View className="flex-row items-center mt-1">
                        <Text className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">ID: </Text>
                        <Text className="text-[11px] font-black text-brand-pink uppercase">{student.studentId || 'PENDING'}</Text>
                      </View>

                      <View className="flex-row items-center mt-3 gap-2">
                        <View className="px-3 py-1.5 rounded-xl flex-row items-center" style={{ backgroundColor: catTheme.bg }}>
                          <MaterialCommunityIcons name={catTheme.icon as any} size={12} color={catTheme.color} />
                          <Text className="text-[10px] font-black ml-2 uppercase" style={{ color: catTheme.color }}>{student.category || 'Playschool'}</Text>
                        </View>
                        <View className="px-3 py-1.5 rounded-xl bg-gray-100 border border-gray-200 flex-row items-center">
                           <MaterialCommunityIcons name={student.gender === 'Female' ? 'gender-female' : 'gender-male'} size={12} color="#4B5563" />
                           <Text className="text-[10px] font-black ml-1.5 uppercase text-gray-600">{student.gender}</Text>
                        </View>
                      </View>
                    </View>

                    <View className="w-10 h-10 rounded-full items-center justify-center bg-gray-50 border border-gray-100">
                       <MaterialCommunityIcons name="chevron-right" size={20} color="#F59E0B" />
                    </View>
                  </View>

                  {/* Attendance Strip */}
                  {attendanceToday[student.id] && (
                    <View className="px-5 py-3 flex-row items-center border-t bg-brand-pink/5 border-brand-pink/5">
                      <MaterialCommunityIcons 
                        name={attendanceToday[student.id].status === 'absent' ? 'close-circle' : 'check-circle'} 
                        size={14} 
                        color={attendanceToday[student.id].status === 'absent' ? '#EF4444' : '#10B981'} 
                      />
                      <Text className={`text-[10px] font-black ml-2 uppercase tracking-wide ${attendanceToday[student.id].status === 'absent' ? 'text-red-500' : 'text-green-600'}`}>
                        Today: {attendanceToday[student.id].status === 'absent' ? 'Absent' : `Present (${attendanceToday[student.id].in_time || 'In'})`}
                      </Text>
                      {attendanceToday[student.id].out_time && (
                        <Text className="text-[10px] font-bold text-amber-600 ml-4 italic">
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
              <MaterialCommunityIcons name="account-search-outline" size={80} color="#E5E7EB" />
              <Text className="text-xl font-black mt-4 text-gray-900">No Students Found</Text>
              <Text className="text-center px-10 mt-2 text-gray-500">Try searching for a different name or checking the student ID.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
