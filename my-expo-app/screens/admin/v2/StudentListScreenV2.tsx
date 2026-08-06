import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Image,
  RefreshControl, ActivityIndicator, StyleSheet, Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

interface StudentListScreenProps {
  navigation: NavigationProps;
}

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const ACCENT = '#F59E0B';
const BORDER_RADIUS = 22;

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

// ─── Aurora Glass background ────────────────────────────────────────────────────
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

export default function StudentListScreenV2({ navigation }: StudentListScreenProps) {
  const { users, fees: allFees, fetchData } = useAuth();
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
      case 'Playschool': return { color: '#F59E0B', icon: 'face-man-profile' };
      case 'PreKG': return { color: '#F59E0B', icon: 'baby-face-outline' };
      case 'Daycare': return { color: '#3B82F6', icon: 'home-heart' };
      default: return { color: '#6B7280', icon: 'school' };
    }
  };

  const finStatusColors: Record<string, string> = {
    overdue: '#EF4444',
    pending: '#F59E0B',
    paid: '#10B981',
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" colors={['#F59E0B']} />}
      >
        <View style={{ paddingTop: Math.max(insets.top, 20), paddingHorizontal: 20 }}>
          {/* ── Header ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ backgroundColor: 'rgba(255,255,255,0.92)', width: 50, height: 50, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="arrow-left" size={24} color={TEXT_PRIMARY} />
              </TouchableOpacity>
              <Text style={{ fontSize: 26, fontWeight: '700', letterSpacing: -0.5, color: TEXT_PRIMARY }}>Students</Text>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#DB2777', marginTop: 2 }}>Directory 📇</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(219,39,119,0.12)', width: 76, height: 76, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}>
              <Image source={require('../../../assets/icons/student.png')} style={{ width: 46, height: 46 }} resizeMode="contain" />
            </View>
          </View>

          {/* ── Search ── */}
          <View style={{ backgroundColor: 'rgba(255,255,255,0.92)', padding: 16, borderRadius: 18, flexDirection: 'row', alignItems: 'center', marginTop: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
            <MaterialCommunityIcons name="magnify" size={22} color={ACCENT} />
            <TextInput
              placeholder="Search by name or ID..."
              placeholderTextColor={TEXT_MUTED}
              style={{ flex: 1, marginLeft: 10, fontWeight: '700', fontSize: 15, color: TEXT_PRIMARY }}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons name="close-circle" size={20} color={TEXT_MUTED} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Count ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 20, marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.7 }}>
            Student Records ✨
          </Text>
          <View style={{ backgroundColor: 'rgba(219,39,119,0.12)', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 100 }}>
            <Text style={{ color: '#DB2777', fontWeight: '800', fontSize: 12 }}>{filteredStudents.length} found</Text>
          </View>
        </View>

        {/* ── List ── */}
        <View style={{ paddingHorizontal: 20 }}>
          {loadingAttendance && (
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <ActivityIndicator size="small" color={ACCENT} />
            </View>
          )}
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => {
              const catTheme = getCategoryTheme(student.category);
              const finStatus = studentFinancials[student.id];
              const finColor = finStatus ? finStatusColors[finStatus.status] : '#10B981';
              const todayRec = attendanceToday[student.id];
              return (
                <TouchableOpacity
                  key={student.id}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('studentDetail', { studentId: student.id })}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.92)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.6)',
                    borderRadius: BORDER_RADIUS,
                    marginBottom: 16,
                    overflow: 'hidden',
                  }}
                >
                  <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: catTheme.color + '1F', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {student.avatar ? (
                        <Image source={{ uri: student.avatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      ) : (
                        <MaterialCommunityIcons name="account-child" size={28} color={catTheme.color} />
                      )}
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ color: TEXT_PRIMARY, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 }} numberOfLines={1}>
                          {student.name}
                        </Text>
                        <View style={{ backgroundColor: finColor + '1F', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 }}>
                          <Text style={{ color: finColor, fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>{finStatus?.title}</Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <MaterialCommunityIcons name="card-account-details-outline" size={12} color={TEXT_MUTED} />
                        <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '800', marginLeft: 5, textTransform: 'uppercase', letterSpacing: 1 }}>
                          {student.studentId || 'PENDING'}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 6 }}>
                        <View style={{ backgroundColor: catTheme.color + '1F', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}>
                          <MaterialCommunityIcons name={catTheme.icon as any} size={11} color={catTheme.color} />
                          <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: catTheme.color, marginLeft: 4 }}>{student.category || 'Playschool'}</Text>
                        </View>
                        <View style={{ backgroundColor: 'rgba(247,249,246,0.9)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}>
                          <MaterialCommunityIcons name={student.gender === 'Female' ? 'gender-female' : 'gender-male'} size={11} color={TEXT_SECONDARY} />
                          <Text style={{ color: TEXT_SECONDARY, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 4 }}>{student.gender || 'N/A'}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={{ paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <MaterialCommunityIcons name="account-circle-outline" size={14} color={TEXT_MUTED} />
                      <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '700', marginLeft: 5 }} numberOfLines={1}>
                        {student.fatherName || 'Parent'} {student.fatherPhone ? `• ${student.fatherPhone}` : ''}
                      </Text>
                    </View>
                    <Text style={{ color: TEXT_MUTED, fontSize: 10, fontWeight: '700' }}>View Profile →</Text>
                  </View>

                  {todayRec && (
                    <View style={{ backgroundColor: todayRec.status === 'absent' ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons
                        name={todayRec.status === 'absent' ? 'close-circle' : 'check-circle'}
                        size={14}
                        color={todayRec.status === 'absent' ? '#EF4444' : '#10B981'}
                      />
                      <Text style={{ color: todayRec.status === 'absent' ? '#EF4444' : '#10B981', fontSize: 9, fontWeight: '900', marginLeft: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Today: {todayRec.status === 'absent' ? 'Absent' : `Present (${todayRec.in_time || 'In'})`}
                      </Text>
                      {todayRec.out_time && (
                        <Text style={{ color: TEXT_MUTED, fontSize: 9, fontWeight: '700', marginLeft: 12, fontStyle: 'italic' }}>
                          Picked at {todayRec.out_time}
                        </Text>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
              <MaterialCommunityIcons name="account-search-outline" size={80} color="#E5E7EB" />
              <Text style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 16 }}>No Students Found</Text>
              <Text style={{ color: TEXT_MUTED, textAlign: 'center', paddingHorizontal: 40, marginTop: 8 }}>Try searching for a different name or checking the student ID.</Text>
            </View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
