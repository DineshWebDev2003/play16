import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';

interface Props { navigation: { navigate: (s: string) => void; goBack: () => void } }

export default function TuitionTeacherHomeScreen({ navigation }: Props) {
  const { user, users, fetchData } = useAuth();
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const isDark = theme === 'dark';

  const [todayPresent, setTodayPresent] = useState<string>('-');
  const [todayAbsent, setTodayAbsent] = useState<string>('-');

  const tuitionStudents = useMemo(() =>
    users.filter(u => u.role === 'tuition_student' && u.status === 'active'),
  [users]);

  const today = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  const todayStr = useMemo(() =>
    new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
  []);

  const loadTodayAttendance = useCallback(async () => {
    try {
      const res = await api.get(`/attendance?date=${today}&user_role=tuition_student`);
      const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      const present = data.filter((a: any) => a.status === 'present' || a.status === 'late').length;
      const absent = data.filter((a: any) => a.status === 'absent').length;
      setTodayPresent(present || '-');
      setTodayAbsent(absent || '-');
    } catch {
      setTodayPresent('-');
      setTodayAbsent('-');
    }
  }, [today]);

  useEffect(() => { loadTodayAttendance(); }, [loadTodayAttendance]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    await loadTodayAttendance();
    setRefreshing(false);
  }, [fetchData, loadTodayAttendance]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFFFFF' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" colors={['#F59E0B']} />
        }
      >
        <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: isDark ? '#D1D5DB' : '#6B7280' }}>
                TN HAPPYKIDS
              </Text>
              <Text style={{ fontSize: 30, fontWeight: '900', letterSpacing: -0.5, marginTop: 4, color: isDark ? '#FFFFFF' : '#111827' }}>
                {user?.name || 'Teacher'}
              </Text>
              <View style={{ backgroundColor: 'rgba(245,158,11,0.15)', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100, marginTop: 12, borderWidth: 1, borderColor: 'rgba(245,158,11,0.1)' }}>
                <Text style={{ color: '#D97706', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Tuition Teacher</Text>
              </View>
            </View>
            <TouchableOpacity activeOpacity={0.85}
              style={{ backgroundColor: '#FDE047', width: 80, height: 80, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FFFFFF', transform: [{ rotate: '3deg' }], overflow: 'hidden' }}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <MaterialCommunityIcons name="account-tie" size={36} color="#92400E" />
              )}
            </TouchableOpacity>
          </View>
        </View>

          <View style={{ paddingHorizontal: 24, paddingVertical: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 }}>
              <MaterialCommunityIcons name="calendar-text" size={14} color="#8E8E93" />
              <Text style={{ color: '#8E8E93', fontSize: 13, fontWeight: '600', marginLeft: 6 }}>{todayStr}</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('tuitionAttendance')}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 14,
                borderWidth: 0.5,
                borderColor: '#E5E5EA',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 12,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(245,158,11,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                    <MaterialCommunityIcons name="school" size={16} color="#D97706" />
                  </View>
                  <View>
                    <Text style={{ color: '#1C1C1E', fontSize: 15, fontWeight: '700', letterSpacing: -0.2 }}>Tuition Overview</Text>
                    <Text style={{ color: '#8E8E93', fontSize: 11, fontWeight: '500', marginTop: 1 }}>{tuitionStudents.length} Students enrolled</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color="#C7C7CC" />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F9F9F9', borderRadius: 12, padding: 10 }}>
                {[
                  { label: 'Total', value: tuitionStudents.length, icon: 'account-group', color: '#D97706' },
                  { label: 'Present', value: todayPresent, icon: 'check-circle', color: '#34C759' },
                  { label: 'Absent', value: todayAbsent, icon: 'close-circle', color: '#FF3B30' },
                ].map((item, i) => (
                  <View key={item.label} style={{ alignItems: 'center', flex: 1, borderRightWidth: i < 2 ? 1 : 0, borderRightColor: '#E5E5EA' }}>
                    <MaterialCommunityIcons name={item.icon as any} size={18} color={item.color} style={{ marginBottom: 2 }} />
                    <Text style={{ color: '#1C1C1E', fontSize: 17, fontWeight: '800', letterSpacing: -0.5 }}>{item.value}</Text>
                    <Text style={{ color: '#8E8E93', fontSize: 10, fontWeight: '600', marginTop: 1 }}>{item.label}</Text>
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
                <Text style={{ color: '#8E8E93', fontSize: 11, fontWeight: '500' }}>Tap to view full attendance</Text>
              </View>
            </TouchableOpacity>
          </View>

        <View style={{ paddingHorizontal: 24, paddingVertical: 8, marginTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', letterSpacing: -0.5, color: isDark ? '#FFFFFF' : '#111827' }}>Today's Pulse</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {[
              { label: 'Homework', value: '-', sub: 'Due today', icon: 'book-open-page-variant', color: '#8B5CF6' },
              { label: 'Submissions', value: '-', sub: 'Pending review', icon: 'clipboard-text', color: '#3B82F6' },
              { label: 'Progress', value: '-', sub: 'Reports pending', icon: 'chart-line', color: '#10B981' },
              { label: 'Messages', value: '-', sub: 'Unread', icon: 'message-text', color: '#EC4899' },
            ].map((item, i) => (
              <TouchableOpacity
                key={item.label}
                activeOpacity={0.85}
                onPress={() => {
                  const screens: Record<string, string> = { 'Homework': 'postHomework', 'Submissions': 'viewSubmissions', 'Progress': 'tuitionPostProgress', 'Messages': 'nannyChat' };
                  navigation.navigate(screens[item.label]);
                }}
                style={{
                  width: i < 2 ? '48%' : '48%',
                  marginBottom: 14,
                  borderRadius: 24,
                  overflow: 'hidden',
                  elevation: 12,
                  backgroundColor: item.color,
                  padding: 20,
                  minHeight: 130,
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 14 }}>
                    <MaterialCommunityIcons name={item.icon as any} size={24} color="white" />
                  </View>
                </View>
                <View>
                  <Text style={{ color: 'white', fontSize: 28, fontWeight: '900', letterSpacing: -1 }}>{item.value}</Text>
                  <Text style={{ color: 'white', fontSize: 13, fontWeight: '900', marginTop: 2 }}>{item.label}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 1 }}>{item.sub}</Text>
                </View>
                <View style={{ position: 'absolute', bottom: 0, right: 0, opacity: 0.08 }}>
                  <MaterialCommunityIcons name={item.icon as any} size={70} color="white" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 128 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
