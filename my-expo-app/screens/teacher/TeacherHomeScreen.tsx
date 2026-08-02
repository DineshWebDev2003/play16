import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import PremiumPopup from '../../components/PremiumPopup';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

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

      const totalStudents = users.filter(u => u.role === 'student' || u.role === 'tuition_student').length;
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
      <View style={{ paddingVertical: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: '900', letterSpacing: -0.5, color: theme === 'dark' ? '#FFFFFF' : '#111827' }}>{sectionTitle} 📢</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('announcements')}
            style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)' }}
          >
            <Text style={{ color: '#8B5CF6', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>See All</Text>
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
          <View style={{ paddingHorizontal: 24 }}>
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
    <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#F59E0B"
            colors={["#F59E0B"]}
            progressBackgroundColor={theme === 'dark' ? '#1c1c14' : '#FFFFFF'}
          />
        }
      >
        <View style={{ paddingTop: Math.max(insets.top, 50), paddingHorizontal: 24, paddingBottom: 24 }}>

          {/* ── Modern Header ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: theme === 'dark' ? '#D1D5DB' : '#6B7280' }}>
                TN HAPPYKIDS
              </Text>
              <Text style={{ fontSize: 30, fontWeight: '900', letterSpacing: -0.5, marginTop: 4, color: theme === 'dark' ? '#FFFFFF' : '#111827' }}>
                {user?.name || 'Teacher'}
              </Text>
              <View style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100, marginTop: 12, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.1)' }}>
                <Text style={{ color: '#F59E0B', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Core Faculty</Text>
              </View>
            </View>
            <TouchableOpacity activeOpacity={0.85} onPress={updateAvatar}
              style={{ backgroundColor: '#FDE047', width: 80, height: 80, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FFFFFF', transform: [{ rotate: '3deg' }], overflow: 'hidden' }}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <MaterialCommunityIcons name="face-woman-outline" size={36} color="#92400E" />
              )}
              <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: '#7C3AED', padding: 4, borderRadius: 10, borderWidth: 2, borderColor: '#FFFFFF' }}>
                <MaterialCommunityIcons name="camera" size={12} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Teaching Pulse (hero counter card) ── */}
          <View style={{ paddingVertical: 8 }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('timetable')}
              style={{ borderRadius: 16, overflow: 'hidden', elevation: 15 }}
            >
              <LinearGradient
                colors={theme === 'dark' ? ['#4338CA', '#1e1b4b'] : ['#6366F1', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 12 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                      <MaterialCommunityIcons name="calendar-clock" size={18} color="white" />
                    </View>
                    <View>
                      <Text style={{ color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: -0.5 }}>Teaching Pulse</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 1 }}>Today's Schedule</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 }}>
                    <Text style={{ color: 'white', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>{todaySchedule ? todaySchedule.time : 'Standby'}</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    {[
                      { label: 'Kids', value: studentStats.total, icon: 'account-group', color: '#FCD34D' },
                      { label: 'Present', value: studentStats.present, icon: 'account-check', color: '#6EE7B7' },
                      { label: 'Next', value: todaySchedule ? todaySchedule.activity : 'Standby', icon: 'book-open-variant', color: '#93C5FD' },
                    ].map((item, i) => (
                      <View key={item.label} style={{ alignItems: 'center', flex: 1, borderRightWidth: i < 2 ? 1 : 0, borderRightColor: 'rgba(255,255,255,0.1)' }}>
                        <MaterialCommunityIcons name={item.icon as any} size={20} color="#FFFFFF" style={{ marginBottom: 4 }} />
                        <Text style={{ color: 'white', fontSize: 15, fontWeight: '900' }} numberOfLines={1}>{item.value}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginTop: 1 }}>{item.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
                  <MaterialCommunityIcons name="arrow-right-circle" size={12} color="rgba(255,255,255,0.5)" />
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 6 }}>View Timetable</Text>
                </View>
                <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
                  <MaterialCommunityIcons name="pencil-ruler" size={90} color="white" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ── Main Operations ── */}
          <View style={{ paddingVertical: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', letterSpacing: -0.5, color: theme === 'dark' ? '#FFFFFF' : '#111827' }}>Main Operations ⚙️</Text>
              <View style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)' }}>
                <Text style={{ color: '#8B5CF6', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Faculty Tools</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('studentList')}
                style={{ width: '48%', borderRadius: 16, overflow: 'hidden', shadowColor: '#D97706', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 12 }}
              >
                <LinearGradient
                  colors={theme === 'dark' ? ['#92400E', '#78350F'] : ['#F59E0B', '#D97706']}
                  style={{ padding: 20, height: 180, justifyContent: 'space-between' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 }}>
                      <MaterialCommunityIcons name="account-group-outline" size={24} color="white" />
                    </View>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 }}>
                      <Text style={{ fontSize: 12, fontWeight: '900', color: 'white' }}>{studentStats.total} Kids</Text>
                    </View>
                  </View>
                  <View>
                    <Text style={{ color: 'white', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 }}>My Class</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '700', marginTop: 3, textTransform: 'uppercase', letterSpacing: 1.5 }}>Total Enrolled</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingVertical: 6, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: '#FDE68A' }}>{studentStats.total}</Text>
                      <Text style={{ fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>Total</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingVertical: 6, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: '#D1FAE5' }}>{studentStats.present}</Text>
                      <Text style={{ fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>Present</Text>
                    </View>
                  </View>
                  <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
                    <MaterialCommunityIcons name="baby-face-outline" size={90} color="white" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('takeAttendance')}
                style={{ width: '48%', borderRadius: 16, overflow: 'hidden', shadowColor: '#DB2777', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 12 }}
              >
                <LinearGradient
                  colors={theme === 'dark' ? ['#9D174D', '#500724'] : ['#F472B6', '#DB2777']}
                  style={{ padding: 20, height: 180, justifyContent: 'space-between' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 }}>
                      <MaterialCommunityIcons name="account-check-outline" size={24} color="white" />
                    </View>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 }}>
                      <Text style={{ fontSize: 12, fontWeight: '900', color: 'white' }}>{studentStats.present} Now</Text>
                    </View>
                  </View>
                  <View>
                    <Text style={{ color: 'white', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 }}>Attendance</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '700', marginTop: 3, textTransform: 'uppercase', letterSpacing: 1.5 }}>Daily Register</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingVertical: 6, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: '#FECDD3' }}>{studentStats.present}</Text>
                      <Text style={{ fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>Present</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingVertical: 6, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: '#FECACA' }}>{Math.max(0, studentStats.total - studentStats.present)}</Text>
                      <Text style={{ fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>Absent</Text>
                    </View>
                  </View>
                  <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
                    <MaterialCommunityIcons name="check-decagram" size={90} color="white" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('postActivity')}
                style={{ width: '48%', borderRadius: 16, overflow: 'hidden', shadowColor: '#DC2626', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 12 }}
              >
                <LinearGradient
                  colors={theme === 'dark' ? ['#7f1d1d', '#450a0a'] : ['#EF4444', '#DC2626']}
                  style={{ padding: 20, height: 150, justifyContent: 'space-between' }}
                >
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', padding: 10, borderRadius: 12 }}>
                    <MaterialCommunityIcons name="camera-plus" size={24} color="white" />
                  </View>
                  <View>
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 }}>Post Activity</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '700', marginTop: 3, textTransform: 'uppercase', letterSpacing: 1.5 }}>Share Moments</Text>
                  </View>
                  <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
                    <MaterialCommunityIcons name="star-face" size={80} color="white" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('activityFeed')}
                style={{ width: '48%', borderRadius: 16, overflow: 'hidden', shadowColor: '#8B5CF6', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 12 }}
              >
                <LinearGradient
                  colors={theme === 'dark' ? ['#5b21b6', '#2e1065'] : ['#8B5CF6', '#7C3AED']}
                  style={{ padding: 20, height: 150, justifyContent: 'space-between' }}
                >
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', padding: 10, borderRadius: 12 }}>
                    <MaterialCommunityIcons name="newspaper-variant" size={24} color="white" />
                  </View>
                  <View>
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 }}>Kids Feed</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '700', marginTop: 3, textTransform: 'uppercase', letterSpacing: 1.5 }}>Moments & Highlights</Text>
                  </View>
                  <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
                    <MaterialCommunityIcons name="image-multiple-outline" size={80} color="white" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Duty Log (full-width card) ── */}
          <View style={{ paddingVertical: 8 }}>
            <View style={{ borderRadius: 16, overflow: 'hidden', shadowColor: '#0D9488', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 12 }}>
              <LinearGradient
                colors={theme === 'dark' ? ['#0f766e', '#134e4a'] : ['#14B8A6', '#0D9488']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 20 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, marginBottom: 8 }}>
                      <Text style={{ color: 'white', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 }}>Official Entry</Text>
                    </View>
                    <Text style={{ color: 'white', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 }}>Duty Log</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700', marginTop: 2 }}>
                      {isLoading ? 'Checking your duty...' : !clockInTime ? 'Start your day with clock in' : !clockOutTime ? `Clocked in at ${clockInTime}` : 'Duty completed for today'}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                      <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingVertical: 6, alignItems: 'center' }}>
                        <Text style={{ fontSize: 11, fontWeight: '900', color: '#A7F3D0' }}>{clockInTime || '--:--'}</Text>
                        <Text style={{ fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>Clock In</Text>
                      </View>
                      <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingVertical: 6, alignItems: 'center' }}>
                        <Text style={{ fontSize: 11, fontWeight: '900', color: '#FECACA' }}>{clockOutTime || '--:--'}</Text>
                        <Text style={{ fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>Clock Out</Text>
                      </View>
                    </View>
                  </View>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.3)', padding: 14, borderRadius: 20, marginLeft: 12 }}>
                    <MaterialCommunityIcons name="clipboard-check-outline" size={36} color="white" />
                  </View>
                </View>
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" style={{ marginTop: 16 }} />
                ) : (
                  <TouchableOpacity
                    onPress={isClockedIn ? handleClockOut : handleClockIn}
                    activeOpacity={0.9}
                    style={{ marginTop: 16, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                  >
                    <MaterialCommunityIcons name={isClockedIn ? 'logout-variant' : 'login-variant'} size={20} color="white" />
                    <Text style={{ color: 'white', fontWeight: '900', fontSize: 15, marginLeft: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                      {!clockInTime ? 'Start Duty' : !clockOutTime ? 'End Duty' : 'Duty Logged'}
                    </Text>
                  </TouchableOpacity>
                )}
                <View style={{ position: 'absolute', bottom: -18, right: -10, opacity: 0.1 }}>
                  <MaterialCommunityIcons name="clipboard-check" size={110} color="white" />
                </View>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* ── Faculty Notices (full width) ── */}
        {renderAnnouncements(teacherNotices, 'Faculty Notices', 'notices')}

        <View style={{ height: 128 }} />
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
