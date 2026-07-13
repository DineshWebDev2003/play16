import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Image, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import PremiumPopup from '../../components/PremiumPopup';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../services/api';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface TeacherHomeScreenProps {
  navigation: NavigationProps;
}

export default function TeacherHomeScreen({ navigation }: TeacherHomeScreenProps) {
  const { user, announcements, updateAvatar, users } = useAuth();
  
  // Filter announcements for teachers
  const teacherNotices = announcements.filter(a => a.target === 'all' || a.target === 'teacher');
  const latestNotice = teacherNotices.length > 0 ? teacherNotices[0] : null;

  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [clockOutTime, setClockOutTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [studentStats, setStudentStats] = useState({ total: 0, present: 0 });
  const [todaySchedule, setTodaySchedule] = useState<any>(null);
  const [selectedNotice, setSelectedNotice] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchTodayAttendance();
    } catch (err) {
      console.error('Refresh Error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchTodayAttendance]);

  const fetchStudentStats = useCallback(async () => {
    try {
      const response = await api.get('/attendance');
      const today = new Date().toISOString().split('T')[0];
      const todayRecords = response.data.filter((r: any) => r.date === today && r.user_role === 'student');
      const presentCount = todayRecords.filter((r: any) => r.status === 'present').length;
      
      const totalStudents = users.filter(u => u.role === 'student').length;
      setStudentStats({ 
        total: totalStudents || 0,
        present: presentCount 
      });
    } catch (err) {
      console.error('Fetch Stats Error:', err);
    }
  }, [users]);

  const fetchTimetable = useCallback(async () => {
    try {
      const response = await api.get('/timetable');
      const todayNum = new Date().getDay();
      const dayIndex = todayNum === 0 ? 6 : todayNum - 1;
      const filtered = response.data.filter((s: any) => s.day === dayIndex);
      
      if (filtered.length > 0) {
        // Function to convert "HH:MM AM/PM" to total minutes for comparison
        const timeToMinutes = (timeStr: string) => {
          const [time, period] = timeStr.split(' ');
          let [hours, minutes] = time.split(':').map(Number);
          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;
          return hours * 60 + minutes;
        };

        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        
        // Sort by time
        const sorted = filtered.sort((a: any, b: any) => timeToMinutes(a.time) - timeToMinutes(b.time));
        
        // Find first session that hasn't finished yet (assuming 1 hour duration or just start time)
        const currentOrNext = sorted.find((s: any) => timeToMinutes(s.time) >= nowMinutes - 30); // 30 min grace period
        
        setTodaySchedule(currentOrNext || null);
      } else {
        setTodaySchedule(null);
      }
    } catch (err) {
      console.error('Fetch Timetable Error:', err);
    }
  }, []);

  const fetchTodayAttendance = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get(`/attendance?student_id=${user.id}&date=${today}`);
      if (response.data && response.data.length > 0) {
        const record = response.data.find((r: any) => r.user_role === 'teacher' || !r.user_role); // fallback
        if (record) {
          setClockInTime(record.in_time);
          setClockOutTime(record.out_time);
          // Only show as clocked in if there is an in_time but NO out_time
          setIsClockedIn(!!record.in_time && !record.out_time);
        } else {
          setClockInTime(null);
          setClockOutTime(null);
          setIsClockedIn(false);
        }
      }
      await Promise.all([
        fetchStudentStats(),
        fetchTimetable()
      ]);
    } catch (err) {
      console.error('Fetch Attendance Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchStudentStats]);

  useEffect(() => {
    fetchTodayAttendance();
  }, [fetchTodayAttendance]);

  const handleClockIn = async () => {
    if (!user) return;
    try {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const today = now.toISOString().split('T')[0];
      
      const payload = {
        student_id: user.id,
        date: today,
        status: 'present',
        in_time: timeString,
        user_role: 'teacher',
        student_name: user.name
      };

      await api.post('/attendance', payload);
      setClockInTime(timeString);
      setIsClockedIn(true);
      Alert.alert('Success 🎉', `You clocked in at ${timeString}`);
    } catch (err) {
      Alert.alert('Error', 'Failed to clock in. Please try again.');
    }
  };

  const handleClockOut = async () => {
    if (!user) return;
    try {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const today = now.toISOString().split('T')[0];
      
      const payload = {
        student_id: user.id,
        date: today,
        status: 'present',
        in_time: clockInTime,
        out_time: timeString,
        user_role: 'teacher',
        student_name: user.name
      };

      await api.post('/attendance', payload);
      setClockOutTime(timeString);
      setIsClockedIn(false);
      Alert.alert('Done! 👋', `You clocked out at ${timeString}. Great job today!`);
    } catch (err) {
      Alert.alert('Error', 'Failed to clock out.');
    }
  };

  const renderAnnouncements = (list: any[], sectionTitle: string, hint: string) => {
    const screenWidth = Dimensions.get('window').width;
    const cardWidth = screenWidth - 48;

    return (
      <View className="mt-8">
        <View className="flex-row items-center justify-between mb-5 px-1">
          <Text className="text-xl font-black text-gray-900 uppercase tracking-widest opacity-60 ml-6">{sectionTitle} 📢</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('announcements')}
            className="bg-brand-violet/10 px-4 py-1.5 rounded-full border border-brand-violet/20"
          >
             <Text className="text-brand-violet text-[9px] font-black uppercase tracking-widest">See All</Text>
          </TouchableOpacity>
        </View>
        
        {list.length > 0 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
            snapToInterval={cardWidth + 12}
            snapToAlignment="center"
            decelerationRate="fast"
            disableIntervalMomentum={true}
          >
            {list.map((item) => (
              <TouchableOpacity 
                key={item.id}
                activeOpacity={0.9}
                style={{ width: cardWidth, aspectRatio: 16 / 9 }}
                className="mr-3 bg-brand-violet relative overflow-hidden rounded-2xl border-2 border-white shadow-2xl"
                onPress={() => setSelectedNotice(item)}
              >
                {item.image ? (
                  <Image 
                    source={{ uri: item.image }} 
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center bg-brand-violet/20">
                    <MaterialCommunityIcons name="bullhorn-outline" size={80} color="#F59E0B" />
                  </View>
                )}
                
                <View className="absolute inset-x-0 bottom-0 h-40 justify-end p-8 bg-black/70">
                  <View className="bg-white/20 self-start px-3 py-1.5 rounded-xl mb-3 flex-row items-center border border-white/10">
                    <MaterialCommunityIcons name="calendar-clock" size={14} color="white" />
                    <Text className="text-white text-[10px] font-black uppercase tracking-widest ml-2">{item.date}</Text>
                  </View>
                  <Text className="text-white text-3xl font-black tracking-tighter" numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View className="flex-row items-center mt-2">
                    <View className="bg-brand-yellow w-5 h-5 rounded-full items-center justify-center mr-2">
                        <MaterialCommunityIcons name="account-tie" size={12} color="#92400E" />
                    </View>
                    <Text className="text-white/80 text-[11px] font-black uppercase tracking-[2px]">{item.author || 'School Admin'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View className="px-6">
            <View
              style={{ width: '100%', aspectRatio: 16 / 9 }}
              className="bg-white items-center justify-center rounded-2xl border-2 border-brand-violet/10 border-dashed"
            >
              <View className="bg-brand-violet/10 w-20 h-20 rounded-full items-center justify-center mb-4">
                <MaterialCommunityIcons name="bullhorn-variant-outline" size={42} color="#F59E0B" />
              </View>
              <Text className="text-xl font-black text-gray-900 tracking-tighter">Mission Complete! ✨</Text>
              <Text className="mt-1 font-black text-brand-violet/40 uppercase text-[8px] tracking-[3px]">No Active {hint}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };


  return (
    <View className="flex-1 bg-white">
        <ScrollView 
            className="flex-1" 
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl 
                    refreshing={isRefreshing} 
                    onRefresh={onRefresh}
                    colors={['#F59E0B']}
                    tintColor={'#F59E0B'}
                />
            }
        >


          {/* Header */}
          <View style={{ paddingTop: Math.max(useSafeAreaInsets().top, 20) }} className="px-6 pb-6">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-xl font-black text-gray-500 uppercase tracking-[3px]">
                  Educator Hub 🍎
                </Text>
                <View className="flex-row items-center mt-1">
                  <Text className="text-4xl font-black text-gray-900 tracking-tighter">
                    {user?.name || 'Teacher'}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('profile')}
                    className="ml-3 bg-brand-violet/10 p-2.5 rounded-2xl"
                  >
                    <MaterialCommunityIcons name="pencil-box-multiple-outline" size={22} color="#F59E0B" />
                  </TouchableOpacity>
                </View>
                <View className="bg-brand-violet/20 self-start px-4 py-1.5 rounded-full mt-3 border border-brand-violet/10 shadow-sm">
                    <Text className="text-brand-violet text-[10px] font-black uppercase tracking-[2px]">Core Faculty</Text>
                </View>
              </View>
              <TouchableOpacity 
                className="bg-brand-yellow w-24 h-24 rounded-xl items-center justify-center shadow-2xl border-4 border-white rotate-3 relative overflow-hidden"
                onPress={updateAvatar}
              >
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <MaterialCommunityIcons name="face-woman-outline" size={48} color="#92400E" />
                )}
                <View className="absolute -bottom-1 -right-1 bg-brand-violet p-2 rounded-xl border-2 border-white">
                  <MaterialCommunityIcons name="camera" size={14} color="white" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Official Notices ── */}
          {renderAnnouncements(teacherNotices, 'Faculty Notices', 'notices')}

          {/* Quick Stats - Premium Cards */}
          <View className="px-6 py-4 flex-row justify-between">
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => navigation.navigate('studentList')}
              className="w-[48%] rounded-2xl overflow-hidden shadow-2xl"
            >
              <View className="bg-amber-500 p-6 h-40 justify-between">
                <View className="flex-row justify-between items-start">
                  <View className="bg-white/20 p-2.5 rounded-2xl">
                    <MaterialCommunityIcons name="account-group-outline" size={28} color="white" />
                  </View>
                  <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest">My Class</Text>
                </View>
                <View>
                  <Text className="text-white text-5xl font-black font-mono tracking-tighter">{studentStats.total}</Text>
                  <Text className="text-white/80 text-[11px] font-black uppercase mt-1 tracking-widest">Total Kids</Text>
                </View>
                <View className="absolute -bottom-6 -right-6 opacity-10">
                  <MaterialCommunityIcons name="baby-face-outline" size={100} color="white" />
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => navigation.navigate('takeAttendance')}
              className="w-[48%] rounded-2xl overflow-hidden shadow-2xl"
            >
              <View className="bg-pink-500 p-6 h-40 justify-between">
                <View className="flex-row justify-between items-start">
                  <View className="bg-white/20 p-2.5 rounded-2xl">
                    <MaterialCommunityIcons name="account-check-outline" size={28} color="white" />
                  </View>
                  <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest">Attendance</Text>
                </View>
                <View>
                  <Text className="text-white text-5xl font-black font-mono tracking-tighter">{studentStats.present}</Text>
                  <Text className="text-white/80 text-[11px] font-black uppercase mt-1 tracking-widest">Present Now</Text>
                </View>
                <View className="absolute -bottom-6 -right-6 opacity-10">
                  <MaterialCommunityIcons name="check-decagram" size={100} color="white" />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Today's Pulse Card */}
          <View className="px-6 mt-6">
            <View className="flex-row items-center justify-between mb-4 px-1">
                <Text className="text-xl font-black text-gray-900 tracking-tighter">Teaching Pulse 📡</Text>
                <TouchableOpacity onPress={() => navigation.navigate('timetable')}>
                    <Text className="text-brand-violet font-bold text-xs tracking-tighter">View Timetable</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => navigation.navigate('timetable')}
              className="rounded-2xl overflow-hidden shadow-2xl"
            >
              <View
                  className="bg-indigo-500 p-7"
              >
                <View className="flex-row items-center justify-between relative z-10">
                  <View className="flex-1 mr-4">
                    <View className="flex-row items-center mb-1">
                      <View className="bg-white/20 p-1.5 rounded-lg mr-2">
                        <MaterialCommunityIcons name="calendar-clock" size={14} color="white" />
                      </View>
                      <Text className="text-white font-black uppercase text-[10px] tracking-[2px] opacity-80">
                        {todaySchedule ? "Ongoing Session" : "Operations Ready"}
                      </Text>
                    </View>
                    <Text className="text-white text-2xl font-black mt-2 tracking-tighter" numberOfLines={1}>
                      {todaySchedule ? todaySchedule.activity : "No sessions mentioned"}
                    </Text>
                    <View className="flex-row items-center mt-4">
                      <View className="bg-white/20 self-start px-4 py-2 rounded-2xl flex-row items-center mr-3 border border-white/10">
                         <MaterialCommunityIcons name="clock-outline" size={14} color="white" />
                         <Text className="text-white text-[12px] font-black ml-2" numberOfLines={1}>
                           {todaySchedule ? todaySchedule.time : "Standby"}
                         </Text>
                      </View>
                      <View className="bg-white/20 self-start px-4 py-2 rounded-2xl flex-row items-center border border-white/10">
                         <MaterialCommunityIcons name="map-marker-outline" size={14} color="white" />
                         <Text className="text-white text-[12px] font-black ml-2" numberOfLines={1}>
                            {todaySchedule ? (todaySchedule.room || 'Classroom') : "Main Site"}
                         </Text>
                      </View>
                    </View>
                  </View>
                  <View className="bg-white/30 w-18 h-18 rounded-xl items-center justify-center border-4 border-white/10 shadow-lg rotate-6">
                    <MaterialCommunityIcons 
                      name={todaySchedule ? (todaySchedule.icon || "book-open-variant") : "calendar-blank"} 
                      size={42} 
                      color="white" 
                    />
                  </View>
                </View>
                <View className="absolute -bottom-6 -right-6 opacity-10">
                  <MaterialCommunityIcons name="pencil-ruler" size={150} color="white" />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Quick Actions Panel */}
          <View className="px-6 py-8">
            <View className="flex-row items-center justify-between mb-6 px-1">
                <Text className="text-xl font-black text-gray-900 tracking-tighter">Daily Actions ⚙️</Text>
                <View className="bg-brand-violet/10 px-3 py-1 rounded-full">
                    <Text className="text-brand-violet text-[9px] font-black uppercase tracking-widest">Faculty Tools</Text>
                </View>
            </View>

            <View className="flex-row justify-between">
              {[
                { label: 'Attendance', icon: 'calendar-check', color: '#F59E0B', bg: 'bg-brand-violet/10', screen: 'takeAttendance' },
                { label: 'Post Activity', icon: 'camera-plus', color: '#EAB308', bg: 'bg-brand-yellow/10', screen: 'postActivity' },
                { label: 'Highlights', icon: 'newspaper-variant', color: '#10B981', bg: 'bg-green-100/10', screen: 'activityFeed' }
              ].map((action, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.9}
                  className="bg-white py-6 px-2 rounded-3xl shadow-xl items-center w-[31%] border border-gray-50"
                  onPress={() => navigation.navigate(action.screen as any)}
                >
                  <View className={`${action.bg} p-4 rounded-2xl mb-3`}>
                    <MaterialCommunityIcons name={action.icon as any} size={28} color={action.color} />
                  </View>
                  <Text className="text-[10px] font-black text-gray-900 text-center uppercase tracking-tighter">{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Teacher Duty Log - Premium Card */}
          <View className="px-6 pb-12">
            <View className="flex-row items-center justify-between mb-6 px-1">
                <Text className="text-xl font-black text-gray-900 tracking-tighter">Duty Log 📅</Text>
                <View className="bg-brand-violet/10 px-3 py-1 rounded-full">
                    <Text className="text-brand-violet text-[9px] font-black uppercase tracking-widest">Official Entry</Text>
                </View>
            </View>

            {isLoading ? (
              <ActivityIndicator size="large" color="#F59E0B" className="my-10" />
            ) : (
              <View className="bg-white p-8 rounded-2xl shadow-2xl border border-brand-violet/10 relative overflow-hidden">
                <View className="flex-row justify-between mb-8">
                  <View className="bg-yellow-50/50 p-5 rounded-3xl flex-1 mr-2 items-center border border-yellow-100">
                    <Text className="text-[9px] font-black uppercase text-amber-600 tracking-[3px]">Clock In</Text>
                    <Text className="text-2xl font-black text-gray-900 mt-2">{clockInTime || '--:--'}</Text>
                  </View>
                  <View className="bg-pink-50/50 p-5 rounded-3xl flex-1 ml-2 items-center border border-pink-100">
                    <Text className="text-[9px] font-black uppercase text-brand-violet tracking-[3px]">Clock Out</Text>
                    <Text className="text-2xl font-black text-gray-900 mt-2">{clockOutTime || '--:--'}</Text>
                  </View>
                </View>

                {!clockInTime ? (
                  <TouchableOpacity
                    onPress={handleClockIn}
                    activeOpacity={0.9}
                    className="overflow-hidden rounded-xl shadow-xl"
                  >
                    <View className="bg-amber-500 py-6 items-center flex-row justify-center">
                      <MaterialCommunityIcons name="login-variant" size={24} color="white" />
                      <Text className="text-white font-black text-xl ml-3 uppercase tracking-tighter">Start Duty</Text>
                    </View>
                  </TouchableOpacity>
                ) : !clockOutTime ? (
                  <TouchableOpacity
                    onPress={handleClockOut}
                    activeOpacity={0.9}
                    className="overflow-hidden rounded-xl shadow-xl"
                  >
                    <View className="bg-amber-400 py-6 items-center flex-row justify-center">
                      <MaterialCommunityIcons name="logout-variant" size={24} color="#92400E" />
                      <Text className="text-amber-900 font-black text-xl ml-3 uppercase tracking-tighter">End Duty</Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View className="bg-green-500/10 py-6 rounded-3xl items-center border border-green-500/20 flex-row justify-center">
                      <MaterialCommunityIcons name="check-decagram-outline" size={32} color="#10B981" />
                      <Text className="text-green-600 font-black text-lg ml-3 tracking-tighter">Duty Logged ✨</Text>
                  </View>
                )}
                
                <View className="absolute -bottom-4 -right-4 opacity-5">
                   <MaterialCommunityIcons name="clipboard-check" size={120} color="text-gray-900" />
                </View>
              </View>
            )}


          </View>
          <View className="h-32" />
        </ScrollView>

        <PremiumPopup
          visible={!!selectedNotice}
          onClose={() => setSelectedNotice(null)}
          title={selectedNotice?.title || ''}
          message={selectedNotice?.content}
          type="info"
          icon="bullhorn"
        >
          {selectedNotice?.date && (
            <View className="bg-blue-50/50 self-center px-4 py-1.5 rounded-full border border-blue-100 mb-4 flex-row items-center">
              <MaterialCommunityIcons name="calendar-clock" size={12} color="#3B82F6" />
              <Text className="text-blue-500 text-[10px] font-black uppercase tracking-widest ml-2">{selectedNotice.date}</Text>
            </View>
          )}
          {selectedNotice?.image && (
            <Image 
              source={{ uri: selectedNotice.image }} 
              style={{ width: '100%', height: 200, borderRadius: 24, marginBottom: 16 }}
              resizeMode="cover"
            />
          )}
        </PremiumPopup>
    </View>
  );
}
