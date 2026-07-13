import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, Dimensions, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PremiumPopup from '../../components/PremiumPopup';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';

const DISMISSED_KEY = 'announcement_banner_dismissed';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface AdminHomeScreenProps {
  navigation: NavigationProps;
}

export default function AdminHomeScreen({ navigation }: AdminHomeScreenProps) {
  const { user, users, fees, branches, updateAvatar, announcements, fetchData } = useAuth();
  const { colors, theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [bannerQueue, setBannerQueue] = useState<any[]>([]);
  const [bannerIndex, setBannerIndex] = useState(0);

  const getTodayDateString = useCallback(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const studentCount = useMemo(() => users.filter(u => u.role === 'student' && u.status === 'active').length, [users]);
  const teacherCount = useMemo(() => users.filter(u => u.role === 'teacher' && u.status === 'active').length, [users]);

  // Use actual fee records for the status card (matches Fees Management "Monthly" view)
  const feeStats = useMemo(() => {
    const todayStr = getTodayDateString();
    const currentMonthPrefix = todayStr.substring(0, 8);
    const activeStudents = users.filter(u => u.role === 'student' && u.status === 'active' && parseInt(u.fees || '0') > 0);

    const paidStudents = activeStudents.filter(student => {
      const dbId = student.id?.toString();
      const schoolId = student.studentId?.toString();
      
      return fees.some(f => 
        (dbId && f.student_id?.toString() === dbId || (schoolId && f.student_id?.toString() === schoolId)) &&
        f.status === 'paid' &&
        f.date.includes(currentMonthPrefix) &&
        !(f.type || '').toLowerCase().includes('admission')
      );
    });

    const totalCollected = fees
      .filter(f => f.status === 'paid' && f.date.includes(currentMonthPrefix) && !(f.type || '').toLowerCase().includes('admission'))
      .reduce((sum, f) => sum + (f.amount || 0), 0);

    return {
       total: activeStudents.length,
       paid: paidStudents.length,
       collected: totalCollected
    };
  }, [fees, users, getTodayDateString]);

  const totalFeeCount = feeStats.total;
  const paidFeeCount  = feeStats.paid;
  const collectedAmount = feeStats.collected;

  const userBranch = useMemo(() => branches.find(b => b.id === user?.branch_id), [branches, user]);
  const adminShare = userBranch?.share ?? 70;
  const netShareAmount = useMemo(() => Math.round(collectedAmount * adminShare / 100), [collectedAmount, adminShare]);
  const masterShareAmount = collectedAmount - netShareAmount;

  const [presentToday, setPresentToday] = useState<number>(0);
  const [attendanceLoaded, setAttendanceLoaded] = useState(false);
  const [todaySchedule, setTodaySchedule] = useState<any>(null);
  const [selectedNotice, setSelectedNotice] = useState<any>(null);

  const todayStr = useMemo(() => getTodayDateString(), [getTodayDateString]);

  const fetchTodayAttendance = useCallback(async () => {
    try {
      const studentIds = users.filter(u => u.role === 'student' && u.status === 'active').map(u => u.id.toString());
      const res = await api.get('/attendance');
      const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      const todayPresent = data.filter(
        (r: any) => 
          r.date === todayStr && 
          r.status === 'present' &&
          studentIds.includes(r.student_id?.toString())
      ).length;
      setPresentToday(todayPresent);
    } catch {
      // silently fail
    } finally {
      setAttendanceLoaded(true);
    }
  }, [todayStr, users]);

  const fetchTimetable = useCallback(async () => {
    try {
      const response = await api.get('/timetable');
      const todayNum = new Date().getDay();
      const dayIndex = todayNum === 0 ? 6 : todayNum - 1;
      const data = response.data?.data || (Array.isArray(response.data) ? response.data : []);
      const filtered = data.filter((s: any) => s.day === dayIndex);
      
      if (filtered.length > 0) {
        const timeToMinutes = (timeStr: string) => {
          const [time, period] = timeStr.split(' ');
          let [hours, minutes] = time.split(':').map(Number);
          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;
          return hours * 60 + minutes;
        };
        const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
        const sorted = filtered.sort((a: any, b: any) => timeToMinutes(a.time) - timeToMinutes(b.time));
        const currentOrNext = sorted.find((s: any) => timeToMinutes(s.time) >= nowMinutes - 30);
        setTodaySchedule(currentOrNext || null);
      } else {
        setTodaySchedule(null);
      }
    } catch (err) {
      console.error('Fetch Timetable Error:', err);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
      await Promise.all([fetchTodayAttendance(), fetchTimetable()]);
    } catch (error) {
      console.error('Refresh Error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchData, fetchTodayAttendance, fetchTimetable]);

  useEffect(() => { 
    fetchTodayAttendance(); 
    fetchTimetable();
  }, [fetchTodayAttendance, fetchTimetable]);

  // ── Announcement Banner Popup ──
  useEffect(() => {
    const today = getTodayDateString();
    const eligible = announcements.filter(a => {
      if (a.id.startsWith('ann_')) return false;
      if (a.end_date && a.end_date < today) return false;
      if (a.start_date && a.start_date > today) return false;
      return true;
    });
    if (eligible.length === 0) return;
    AsyncStorage.getItem(DISMISSED_KEY).then(saved => {
      const dismissed: string[] = saved ? JSON.parse(saved) : [];
      const unseen = eligible.filter(a => !dismissed.includes(a.id)).slice(0, 3);
      if (unseen.length > 0) {
        setBannerQueue(unseen);
        setBannerIndex(0);
      }
    });
  }, [announcements, getTodayDateString]);

  const dismissBanner = useCallback((id: string, dontShowAgain = false) => {
    if (dontShowAgain) {
      AsyncStorage.getItem(DISMISSED_KEY).then(saved => {
        const dismissed: string[] = saved ? JSON.parse(saved) : [];
        dismissed.push(id);
        AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
      });
    }
    if (bannerIndex < bannerQueue.length - 1) {
      setBannerIndex(prev => prev + 1);
    } else {
      setBannerQueue([]);
      setBannerIndex(0);
    }
  }, [bannerIndex, bannerQueue]);

  const handleQuickAction = (screen: string | null) => {
    if (screen) {
      navigation.navigate(screen as any);
    } else {
      Alert.alert('Coming Soon', 'This feature will be available in the next update! 🚀');
    }
  };

  const renderAnnouncements = (list: any[], sectionTitle: string, hint: string) => {
    const screenWidth = Dimensions.get('window').width;
    const cardWidth = screenWidth - 48;

    return (
      <View className="mt-8">
        <View className="flex-row items-center justify-between mb-5 px-1">
          <Text className={`text-xl font-black ${colors.text} uppercase tracking-widest opacity-60 ml-6`}>{sectionTitle} 📢</Text>
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
            snapToInterval={cardWidth + 12} // card width + margin
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
                
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  className="absolute inset-x-0 bottom-0 h-40 justify-end p-8"
                >
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
                    <Text className="text-white/80 text-[11px] font-black uppercase tracking-[2px]">{item.author || 'Admin Headquarters'}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View className="px-6">
            <LinearGradient
              colors={theme === 'dark' ? ['#1e1e1e', '#1a1a14'] : ['#FFF5F8', '#FFFFFF']}
              style={{ width: '100%', aspectRatio: 16 / 9 }}
              className="items-center justify-center rounded-2xl border-2 border-brand-violet/10 border-dashed"
            >
              <View className="bg-brand-violet/10 w-20 h-20 rounded-full items-center justify-center mb-4">
                <MaterialCommunityIcons name="bullhorn-variant-outline" size={42} color="#F59E0B" />
              </View>
              <Text className={`text-xl font-black ${colors.text} tracking-tighter`}>Mission Complete! ✨</Text>
              <Text className="mt-1 font-black text-brand-violet/40 uppercase text-[8px] tracking-[3px]">No Active {hint}</Text>
            </LinearGradient>
          </View>
        )}
      </View>
    );
  };

  return (
    <View className={`flex-1 ${theme === 'dark' ? 'bg-[#1c1c14]' : 'bg-white'}`}>
        <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#F59E0B"
            colors={["#F59E0B"]}
            progressBackgroundColor={theme === 'dark' ? '#1c1c14' : '#FFFFFF'}
          />
        }
        >


        {/* ── Modern Header ── */}
        <View style={{ paddingTop: Math.max(useSafeAreaInsets().top, 20) }} className="px-6 pb-6">
            <View className="flex-row items-center justify-between">
                <View className="flex-1">
                    <Text className={`text-xl font-black ${colors.textSecondary} uppercase tracking-widest`}>
                        Admin Hub 🔐
                    </Text>
                    <Text className={`text-4xl font-black ${colors.text} tracking-tighter mt-1`}>
                        {user?.name || 'Administrator'}
                    </Text>
                    <View className="bg-brand-violet/20 self-start px-4 py-1.5 rounded-full mt-3 border border-brand-violet/10 shadow-sm">
                        <Text className="text-brand-violet text-[10px] font-black uppercase tracking-[2px]">Master Control Panel</Text>
            </View>
            <View className="mt-4 rounded-2xl overflow-hidden" style={{ elevation: 4 }}>
              <LinearGradient
                colors={theme === 'dark' ? ['#1e3a2f', '#0d2818'] : ['#E8F5E9', '#C8E6C9']}
                className="p-4 flex-row items-center justify-between"
              >
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons name="handshake" size={18} color="#2E7D32" />
                    <Text className="text-green-800 dark:text-green-300 font-black text-[10px] uppercase tracking-widest ml-2">Your Share ({adminShare}%)</Text>
                  </View>
                  <Text className="text-green-900 dark:text-green-200 font-black text-2xl mt-1">₹{netShareAmount.toLocaleString('en-IN')}</Text>
                </View>
                <View className="h-8 w-px bg-green-300 dark:bg-green-700 mx-4" />
                <View className="items-end">
                  <Text className="text-green-700 dark:text-green-400 font-black text-[10px] uppercase tracking-widest">Master Share</Text>
                  <Text className="text-green-800 dark:text-green-300 font-black text-lg">₹{masterShareAmount.toLocaleString('en-IN')}</Text>
                </View>
              </LinearGradient>
            </View>
        </View>

                <TouchableOpacity
                    className="bg-brand-yellow w-20 h-20 rounded-2xl items-center justify-center shadow-2xl border-4 border-white rotate-3 relative overflow-hidden"
                    onPress={updateAvatar}
                >
                    {user?.avatar ? (
                    <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                    <MaterialCommunityIcons name="shield-crown-outline" size={36} color="#92400E" />
                    )}
                    <View className="absolute -bottom-1 -right-1 bg-brand-violet p-1.5 rounded-xl border-2 border-white">
                        <MaterialCommunityIcons name="camera" size={12} color="white" />
                    </View>
                </TouchableOpacity>
            </View>
        </View>

        {/* ── Premium Unified Stats Card ── */}
        <View className="px-6 py-4">
          <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleQuickAction('userManagementV2')}
              className="rounded-[30px] overflow-hidden shadow-2xl"
              style={{ elevation: 20 }}
          >
              <LinearGradient
                  colors={theme === 'dark' ? ['#3d2d31', '#1c1c14'] : ['#FFFFFF', '#FDF2F8']}
                  className="p-7"
              >
                  <View className="flex-row items-center justify-between mb-8">
                      <View>
                          <Text className={`text-2xl font-black tracking-tighter ${colors.text}`}>Campus Hub 🏫</Text>
                          <Text className={`text-[10px] font-black uppercase tracking-[2px] ${colors.textSecondary} opacity-60`}>Faculty & Enrollment</Text>
                      </View>
                      <View className={`${theme === 'dark' ? 'bg-white/10 border-white/10' : 'bg-brand-violet/10 border-brand-violet/20'} px-3 py-1.5 rounded-full border`}>
                          <Text className={`${theme === 'dark' ? 'text-white' : 'text-brand-violet'} text-[10px] font-black uppercase`}>Live Updates</Text>
                      </View>
                  </View>

                  <View className="flex-row justify-between items-center">
                      {/* Students Stats */}
                      <TouchableOpacity 
                        onPress={() => handleQuickAction('userManagementV2')}
                        className={`${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-brand-yellow/10 border-brand-yellow/20'} rounded-[20px] p-4 w-[46%] border`}
                      >
                          <View className="flex-row items-center mb-4">
                              <View className="bg-brand-yellow w-10 h-10 rounded-2xl items-center justify-center mr-3 shadow-lg">
                                  <MaterialCommunityIcons name="school-outline" size={22} color="#92400E" />
                              </View>
                              <View>
                                  <Text className={`font-black text-2xl leading-none ${colors.text}`}>{studentCount}</Text>
                                  <Text className={`text-[9px] font-black uppercase ${colors.textSecondary} opacity-60`}>Students</Text>
                              </View>
                          </View>
                          <View className={`${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-brand-yellow/20 border-brand-yellow/30'} px-2 py-1.5 rounded-xl border`}>
                            <Text className={`${theme === 'dark' ? 'text-white' : 'text-amber-900'} text-[9px] font-black uppercase text-center`}>Active Learners</Text>
                          </View>
                      </TouchableOpacity>

                      {/* Staff Stats */}
                      <TouchableOpacity 
                         onPress={() => handleQuickAction('userManagementV2')}
                         className={`${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-brand-violet/10 border-brand-violet/20'} rounded-[20px] p-4 w-[46%] border`}
                      >
                          <View className="flex-row items-center mb-4">
                              <View className="bg-brand-violet w-10 h-10 rounded-2xl items-center justify-center mr-3 shadow-lg">
                                  <MaterialCommunityIcons name="account-group" size={22} color="white" />
                              </View>
                              <View>
                                  <Text className={`font-black text-2xl leading-none ${colors.text}`}>{teacherCount}</Text>
                                  <Text className={`text-[9px] font-black uppercase ${colors.textSecondary} opacity-60`}>Staff</Text>
                              </View>
                          </View>
                          <View className={`${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-brand-violet/20 border-brand-violet/30'} px-2 py-1.5 rounded-xl border`}>
                            <Text className={`${theme === 'dark' ? 'text-white' : 'text-brand-violet'} text-[9px] font-black uppercase text-center`}>Active Faculty</Text>
                          </View>
                      </TouchableOpacity>
                  </View>

                  {/* Decorative Background Patterns */}
                  <View className="absolute -top-10 -right-10 w-32 h-32 bg-brand-violet/5 rounded-full blur-3xl" />
                  <View className="absolute -bottom-10 -left-10 w-32 h-32 bg-brand-yellow/5 rounded-full blur-3xl" />
                  <View className="absolute -bottom-6 -right-6 opacity-10">
                      <MaterialCommunityIcons name="shield-check-outline" size={100} color={theme === 'dark' ? 'white' : '#F59E0B'} />
                  </View>
              </LinearGradient>
          </TouchableOpacity>
        </View>
      {/* ── School Metrics ── */}
        <View className="px-6 mt-4">
            <View className="flex-row items-center justify-between mb-3 px-1">
                <Text className={`text-lg font-black tracking-tighter ${colors.text}`}>Today's Overview</Text>
                <View className="bg-brand-violet/10 px-2 py-1 rounded-full">
                    <Text className="text-brand-violet text-[8px] font-black uppercase tracking-widest">Live</Text>
                </View>
            </View>

            <View className="flex-row justify-between">
                <TouchableOpacity 
                   activeOpacity={0.9}
                   onPress={() => handleQuickAction('feesManagement')}
                   style={{ elevation: 8 }}
                   className="w-[48%] rounded-2xl overflow-hidden shadow-md"
                >
                    <LinearGradient
                        colors={theme === 'dark' ? ['#78350f', '#451a03'] : ['#F59E0B', '#D97706']}
                        className="p-5"
                    >
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="bg-white/20 w-10 h-10 rounded-2xl items-center justify-center">
                                <MaterialCommunityIcons name="currency-inr" size={20} color="white" />
                            </View>
                            <Text className="text-white font-black text-[18px]">{paidFeeCount}</Text>
                        </View>
                        <Text className="text-white/70 text-[9px] font-bold uppercase tracking-wider">Collected</Text>
                        <Text className="text-white font-black text-xl mt-1">₹{collectedAmount.toLocaleString('en-IN')}</Text>
                        <View className="mt-3 h-1.5 bg-white/15 rounded-full overflow-hidden">
                            <View 
                                style={{ width: `${totalFeeCount > 0 ? (paidFeeCount / totalFeeCount) * 100 : 0}%`, height: '100%' }} 
                                className="bg-white rounded-full" 
                            />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                   activeOpacity={0.9}
                   onPress={() => handleQuickAction('takeAttendance')}
                   style={{ elevation: 8 }}
                   className="w-[48%] rounded-2xl overflow-hidden shadow-md"
                >
                    <LinearGradient
                        colors={theme === 'dark' ? ['#064e3b', '#022c22'] : ['#10B981', '#059669']}
                        className="p-5"
                    >
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="bg-white/20 w-10 h-10 rounded-2xl items-center justify-center">
                                <MaterialCommunityIcons name="account-check-outline" size={20} color="white" />
                            </View>
                            <Text className="text-white font-black text-[18px]">{presentToday}</Text>
                        </View>
                        <Text className="text-white/70 text-[9px] font-bold uppercase tracking-wider">Present Today</Text>
                        <Text className="text-white font-black text-xl mt-1">{Math.round(studentCount > 0 ? (presentToday / studentCount) * 100 : 0)}%</Text>
                        <View className="mt-3 h-1.5 bg-white/15 rounded-full overflow-hidden">
                            <View 
                                style={{ width: `${studentCount > 0 ? (presentToday / studentCount) * 100 : 0}%`, height: '100%' }} 
                                className="bg-white rounded-full" 
                            />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>

        {announcements.length > 0 && renderAnnouncements(announcements, 'Central Notices', 'announcements')}

        {/* ── Modern Management Portal ── */}
        <View className="px-6 py-8">
            <View className="flex-row items-center justify-between mb-6 px-1">
                <Text className={`text-xl font-black ${colors.text} tracking-tighter`}>Main Operations ⚙️</Text>
                <View className="bg-brand-violet/10 px-3 py-1 rounded-full">
                    <Text className="text-brand-violet text-[9px] font-black uppercase font-bold tracking-widest">Master Controls</Text>
                </View>
            </View>

            <View className="flex-row justify-between mb-4">
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => handleQuickAction('incomeExpense')}
                    className="w-[48%] rounded-2xl overflow-hidden shadow-xl"
                    style={{ elevation: 12 }}
                >
                    <LinearGradient
                        colors={theme === 'dark' ? ['#064e3b', '#022c22'] : ['#10B981', '#059669']}
                        className="p-6 h-48 justify-between"
                    >
                        <View className="bg-white/20 self-start p-3.5 rounded-2xl shadow-sm">
                            <MaterialCommunityIcons name="finance" size={28} color="white" />
                        </View>
                        <View>
                            <Text className="text-white text-2xl font-black tracking-tighter">Finance Hub</Text>
                            <Text className="text-white/80 text-[10px] font-bold mt-1 uppercase tracking-widest">Accounts & Budget</Text>
                        </View>
                        <View className="absolute -bottom-4 -right-4 opacity-10">
                            <MaterialCommunityIcons name="leaf" size={100} color="white" />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => handleQuickAction('feesManagement')}
                    className="w-[48%] rounded-2xl overflow-hidden shadow-xl"
                    style={{ elevation: 12 }}
                >
                    <LinearGradient
                        colors={theme === 'dark' ? ['#1e40af', '#1e1b4b'] : ['#3B82F6', '#2563EB']}
                        className="p-6 h-48 justify-between"
                    >
                        <View className="bg-white/20 self-start p-3.5 rounded-2xl shadow-sm">
                            <MaterialCommunityIcons name="cash-register" size={28} color="white" />
                        </View>
                        <View>
                            <Text className="text-white text-2xl font-black tracking-tighter">Fee Portal</Text>
                            <Text className="text-white/80 text-[10px] font-bold mt-1 uppercase tracking-widest">Collections Info</Text>
                        </View>
                        <View className="absolute -bottom-4 -right-4 opacity-10">
                            <MaterialCommunityIcons name="credit-card-chip" size={100} color="white" />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleQuickAction('postActivity')}
                className="rounded-2xl overflow-hidden shadow-xl"
                style={{ elevation: 12 }}
            >
                <LinearGradient
                    colors={theme === 'dark' ? ['#92400E', '#78350F'] : ['#F59E0B', '#D97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="p-6 flex-row items-center justify-between"
                >
                    <View className="flex-1">
                        <View className="bg-white/20 self-start px-3 py-1 rounded-full mb-3">
                            <Text className="text-white text-[9px] font-black uppercase tracking-widest">Broadcast Tool</Text>
                        </View>
                        <Text className="text-white text-3xl font-black tracking-tighter">Post Highlights</Text>
                        <Text className="text-white/80 text-sm font-bold mt-1">Share school moments with parents ✨</Text>
                    </View>
                    <View className="bg-white/30 p-4 rounded-3xl ml-4">
                        <MaterialCommunityIcons name="camera-iris" size={42} color="white" />
                    </View>
                    <View className="absolute -bottom-10 -right-10 opacity-10">
                        <MaterialCommunityIcons name="image-multiple-outline" size={150} color="white" />
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </View>

        {/* ── Today's Pulse Card ── */}
        <View className="px-6 pb-12">
            <View className="flex-row items-center justify-between mb-8 px-1">
                <Text className={`text-xl font-black ${colors.text} tracking-tighter`}>Daily Pulse 📡</Text>
                <TouchableOpacity onPress={() => navigation.navigate('timetable')}>
                    <Text className="text-brand-violet font-bold text-xs">Full View</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => navigation.navigate('timetable')}
                className="rounded-2xl overflow-hidden shadow-2xl"
                style={{ elevation: 20 }}
            >
                <LinearGradient
                    colors={theme === 'dark' ? ['#701a75', '#4c1d95'] : ['#F59E0B', '#DB2777']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="p-7"
                >
                    <View className="flex-row items-center justify-between relative z-10">
                        <View className="flex-1 mr-4">
                            <View className="flex-row items-center mb-1">
                                <View className="bg-white/20 p-1.5 rounded-lg mr-2">
                                    <MaterialCommunityIcons name="timeline-clock-outline" size={14} color="white" />
                                </View>
                                <Text className="text-white font-black uppercase text-[10px] tracking-[2px] opacity-80">
                                    {todaySchedule ? "Ongoing Activity" : "Operations Ready"}
                                </Text>
                            </View>
                            <Text className="text-white text-3xl font-black mt-2 tracking-tighter" numberOfLines={1}>
                                {todaySchedule ? todaySchedule.activity : "No Scheduled Events"}
                            </Text>
                            <View className="flex-row items-center mt-4">
                                <View className="bg-white/20 self-start px-4 py-2 rounded-2xl flex-row items-center mr-3 border border-white/10">
                                    <MaterialCommunityIcons name="clock-fast" size={16} color="white" />
                                    <Text className="text-white text-[12px] font-black ml-2">
                                        {todaySchedule ? todaySchedule.time : "Standby"}
                                    </Text>
                                </View>
                                <View className="bg-white/20 self-start px-4 py-2 rounded-2xl flex-row items-center border border-white/10">
                                    <MaterialCommunityIcons name="map-marker-outline" size={16} color="white" />
                                    <Text className="text-white text-[12px] font-black ml-2">
                                        {todaySchedule ? (todaySchedule.room || 'All Class') : "Main Site"}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <View className="bg-white/30 w-18 h-18 rounded-[28px] items-center justify-center border-4 border-white/10 shadow-lg rotate-6">
                            <MaterialCommunityIcons 
                                name={todaySchedule ? (todaySchedule.icon || "bullseye-arrow") : "checkbox-marked-circle-outline"} 
                                size={42} 
                                color="white" 
                            />
                        </View>
                    </View>
                    <View className="absolute -bottom-10 -right-10 opacity-10">
                        <MaterialCommunityIcons name="toy-brick-plus" size={180} color="white" />
                    </View>
                </LinearGradient>
            </TouchableOpacity>
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
            <View className="bg-blue-50/50 dark:bg-blue-500/10 self-center px-4 py-1.5 rounded-full border border-blue-100 dark:border-blue-500/20 mb-4 flex-row items-center">
              <MaterialCommunityIcons name="calendar-clock" size={12} color="#3B82F6" />
              <Text className="text-blue-500 text-[10px] font-black uppercase tracking-widest ml-2">{selectedNotice.date}</Text>
            </View>
          )}
          {selectedNotice?.image && (
            <Image 
              source={{ uri: selectedNotice.image }} 
              style={{ width: '100%', height: 200, borderRadius: 24 }}
              resizeMode="cover"
            />
          )}
        </PremiumPopup>

        {/* ── Auto-show Announcement Banner ── */}
        {bannerQueue.length > 0 && bannerIndex < bannerQueue.length && (
          <PremiumPopup
            visible
            onClose={() => dismissBanner(bannerQueue[bannerIndex].id, false)}
            title={bannerQueue[bannerIndex].title || ''}
            message={bannerQueue[bannerIndex].content}
            type="info"
            icon="bullhorn"
          >
            <TouchableOpacity
              onPress={() => dismissBanner(bannerQueue[bannerIndex].id, true)}
              className="flex-row items-center justify-center mt-2 mb-1"
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="checkbox-blank-off-outline" size={18} color="#9CA3AF" />
              <Text className="text-gray-400 text-[11px] font-bold uppercase tracking-wide ml-2">
                Don't show this again
              </Text>
            </TouchableOpacity>
            {bannerIndex < bannerQueue.length - 1 && (
              <Text className="text-gray-500 text-[10px] font-bold text-center mt-3">
                {bannerIndex + 1} of {bannerQueue.length}
              </Text>
            )}
          </PremiumPopup>
        )}
    </View>
  );
}
