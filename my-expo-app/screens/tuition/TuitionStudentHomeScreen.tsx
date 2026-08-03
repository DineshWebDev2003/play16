import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, RefreshControl, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface TuitionStudentHomeScreenProps {
  navigation: NavigationProps;
}

const actions = [
  { icon: 'book-open-page-variant', label: 'Homework', screen: 'homework', color: '#8B5CF6', grad: ['#8B5CF6', '#7C3AED'] as [string, string], gradDark: ['#5b21b6', '#2e1065'] as [string, string], tag: 'Tasks', desc: 'View & submit assignments' },
  { icon: 'book-education', label: 'Study Materials', screen: 'tuitionStudyMaterials', color: '#F97316', grad: ['#F97316', '#EA580C'] as [string, string], gradDark: ['#9a3412', '#7c2d12'] as [string, string], tag: 'Resources', desc: 'View class resources' },
  { icon: 'chart-line', label: 'My Progress', screen: 'tuitionMyProgress', color: '#10B981', grad: ['#10B981', '#059669'] as [string, string], gradDark: ['#064e3b', '#022c22'] as [string, string], tag: 'Track', desc: 'Track performance' },
  { icon: 'calendar-check', label: 'Attendance', screen: 'attendance', color: '#F59E0B', grad: ['#F59E0B', '#D97706'] as [string, string], gradDark: ['#92400E', '#78350F'] as [string, string], tag: 'Report', desc: 'View attendance record' },
  { icon: 'message-text', label: 'Messages', screen: 'nannyChat', color: '#EC4899', grad: ['#EC4899', '#DB2777'] as [string, string], gradDark: ['#831843', '#500724'] as [string, string], tag: 'Chat', desc: 'Chat with teachers & admin' },
];

export default function TuitionStudentHomeScreen({ navigation }: TuitionStudentHomeScreenProps) {
  const { user, fetchData } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = theme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const [homeworkCount, setHomeworkCount] = useState(0);
  const [todayAttendance, setTodayAttendance] = useState<string | null>(null);

  const loadHomeworkCount = useCallback(async () => {
    try {
      const res = await api.get('/homework');
      const d = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      const myBatchId = String((user as any)?.batch_id ?? '');
      const myUserId = String(user?.id ?? '');
      const mine = d.filter((h: any) => {
        const hBatch = String(h.batch_id ?? '');
        const hStudentIds = Array.isArray(h.student_ids) ? h.student_ids.map(String) : [];
        const noTarget = !h.batch_id && (!h.student_ids || h.student_ids.length === 0);
        return noTarget || (myBatchId && hBatch === myBatchId) || (myUserId && hStudentIds.includes(myUserId));
      });
      setHomeworkCount(mine.length);
    } catch {}
  }, [user]);

  const loadTodayAttendance = useCallback(async () => {
    if (!user) return;
    try {
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const res = await api.get(`/attendance?date=${today}`);
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      const mine = list.find((r: any) => r.student_id?.toString() === String(user.id) && r.date === today);
      setTodayAttendance(mine ? (mine.status || 'present') : null);
    } catch {}
  }, [user]);

  useEffect(() => {
    loadHomeworkCount();
    loadTodayAttendance();
  }, [loadHomeworkCount, loadTodayAttendance]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
      await loadHomeworkCount();
      await loadTodayAttendance();
    } catch (error) {
      console.error('Refresh Error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchData, loadHomeworkCount, loadTodayAttendance]);

  const attendanceMeta = useMemo(() => {
    if (todayAttendance === 'present') return { label: 'Present', color: '#10B981', icon: 'check-circle' };
    if (todayAttendance === 'late') return { label: 'Late', color: '#F59E0B', icon: 'clock-outline' };
    if (todayAttendance === 'absent') return { label: 'Absent', color: '#EF4444', icon: 'close-circle' };
    return { label: 'Not Marked', color: '#9CA3AF', icon: 'minus-circle' };
  }, [todayAttendance]);

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFFFFF' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#F59E0B"
            colors={['#F59E0B']}
            progressBackgroundColor={isDark ? '#1c1c14' : '#FFFFFF'}
          />
        }
      >
        <View style={{ paddingTop: Math.max(insets.top, 50), paddingHorizontal: 24, paddingBottom: 24 }}>
          {/* ── Modern Header ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: isDark ? '#D1D5DB' : '#6B7280' }}>
                TN HAPPYKIDS
              </Text>
              <Text style={{ fontSize: 30, fontWeight: '900', letterSpacing: -0.5, marginTop: 4, color: isDark ? '#FFFFFF' : '#111827' }} numberOfLines={1}>
                {user?.name || 'Student'}
              </Text>
              <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100, marginTop: 12, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.1)' }}>
                <Text style={{ color: '#D97706', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Tuition Student</Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('profile')}
              style={{ backgroundColor: '#FDE047', width: 80, height: 80, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FFFFFF', transform: [{ rotate: '3deg' }], overflow: 'hidden' }}
            >
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <MaterialCommunityIcons name="school" size={36} color="#92400E" />
              )}
            </TouchableOpacity>
          </View>

          {/* ── Learning Hub (gradient stat card) ── */}
          <View style={{ paddingVertical: 8 }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('homework')}
              style={{ borderRadius: 16, overflow: 'hidden', elevation: 15 }}
            >
              <LinearGradient
                colors={isDark ? ['#92400E', '#78350F'] : ['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 12 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                      <MaterialCommunityIcons name="school" size={18} color="white" />
                    </View>
                    <View>
                      <Text style={{ color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: -0.5 }}>Learning Hub</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 1 }}>My Tuition Dashboard</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 }}>
                    <Text style={{ color: 'white', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>{(user as any)?.batch_id ? `Batch ${(user as any)?.batch_id}` : 'Student'}</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    {[
                      { label: 'Homework', value: homeworkCount, icon: 'book-open-page-variant', color: '#FDE68A' },
                      { label: attendanceMeta.label, value: todayAttendance ? '•' : '–', icon: attendanceMeta.icon, color: attendanceMeta.color },
                      { label: 'Student ID', value: (user as any)?.student_id || user?.studentId || user?.id || '–', icon: 'badge-account', color: '#FDE68A' },
                    ].map((item, i) => (
                      <View key={item.label} style={{ alignItems: 'center', flex: 1, borderRightWidth: i < 2 ? 1 : 0, borderRightColor: 'rgba(255,255,255,0.1)' }}>
                        <MaterialCommunityIcons name={item.icon as any} size={20} color={item.color} style={{ marginBottom: 4 }} />
                        <Text style={{ color: 'white', fontSize: 13, fontWeight: '900' }} numberOfLines={1}>{item.value}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginTop: 1 }}>{item.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
                  <MaterialCommunityIcons name="arrow-right-circle" size={12} color="rgba(255,255,255,0.5)" />
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 6 }}>Open Homework</Text>
                </View>
                <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
                  <MaterialCommunityIcons name="school" size={90} color="white" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ── Quick Actions ── */}
          <View style={{ paddingVertical: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', letterSpacing: -0.5, color: isDark ? '#FFFFFF' : '#111827' }}>Quick Actions ⚡</Text>
              <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                <Text style={{ color: '#D97706', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Student</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
              {actions.slice(0, 2).map(action => (
                <TouchableOpacity
                  key={action.label}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate(action.screen)}
                  style={{ width: '48%', borderRadius: 16, overflow: 'hidden', shadowColor: action.color, shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 12 }}
                >
                  <LinearGradient
                    colors={isDark ? action.gradDark : action.grad}
                    style={{ padding: 20, height: 150, justifyContent: 'space-between' }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 }}>
                        <MaterialCommunityIcons name={action.icon as any} size={22} color="white" />
                      </View>
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100 }}>
                        <Text style={{ color: 'white', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>{action.tag}</Text>
                      </View>
                    </View>
                    <View>
                      <Text style={{ color: 'white', fontSize: 17, fontWeight: '900', letterSpacing: -0.5 }}>{action.label}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 8, fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 }}>{action.desc}</Text>
                    </View>
                    <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
                      <MaterialCommunityIcons name={action.icon as any} size={80} color="white" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
              {actions.slice(2, 4).map(action => (
                <TouchableOpacity
                  key={action.label}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate(action.screen)}
                  style={{ width: '48%', borderRadius: 16, overflow: 'hidden', shadowColor: action.color, shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 12 }}
                >
                  <LinearGradient
                    colors={isDark ? action.gradDark : action.grad}
                    style={{ padding: 20, height: 150, justifyContent: 'space-between' }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 }}>
                        <MaterialCommunityIcons name={action.icon as any} size={22} color="white" />
                      </View>
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100 }}>
                        <Text style={{ color: 'white', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>{action.tag}</Text>
                      </View>
                    </View>
                    <View>
                      <Text style={{ color: 'white', fontSize: 17, fontWeight: '900', letterSpacing: -0.5 }}>{action.label}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 8, fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 }}>{action.desc}</Text>
                    </View>
                    <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
                      <MaterialCommunityIcons name={action.icon as any} size={80} color="white" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('nannyChat')}
              style={{ borderRadius: 16, overflow: 'hidden', shadowColor: '#DB2777', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 12 }}
            >
              <LinearGradient
                colors={isDark ? ['#831843', '#500724'] : ['#EC4899', '#DB2777']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, marginBottom: 8 }}>
                    <Text style={{ color: 'white', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 }}>Chat</Text>
                  </View>
                  <Text style={{ color: 'white', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 }}>Messages</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700', marginTop: 2 }}>Chat with teachers & admin 💬</Text>
                </View>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.3)', padding: 14, borderRadius: 20 }}>
                  <MaterialCommunityIcons name="message-text-outline" size={36} color="white" />
                </View>
                <View style={{ position: 'absolute', bottom: -18, right: -10, opacity: 0.1 }}>
                  <MaterialCommunityIcons name="message-text" size={110} color="white" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={{ height: 128 }} />
        </View>
      </ScrollView>
    </View>
  );
}
