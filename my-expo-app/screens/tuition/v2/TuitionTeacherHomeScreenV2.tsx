import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
}

const BORDER_RADIUS = 28;
const SECTION_GAP = 28;

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const ACCENT = '#F59E0B';

const ROLE_AVATAR = require('../../../assets/Avatar/tuition-teacher.png');

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

// ─── Aurora Glass background (matches all V2 screens) ──────────────────────────
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

// ─── Glass action card for the operations grid ─────────────────────────────────
function ActionCard({ image, label, subtitle, tag, color, onPress }: {
  image: any;
  label: string;
  subtitle: string;
  tag: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={{
        width: '48%',
        marginBottom: 16,
        borderRadius: BORDER_RADIUS,
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        padding: 16,
      }}
    >
      <View
        style={{
          height: 84,
          borderRadius: 18,
          backgroundColor: color + '1F',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image source={image} style={{ width: 64, height: 64 }} resizeMode="contain" />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <Text numberOfLines={1} style={{ flex: 1, fontSize: 15, fontWeight: '700', color: TEXT_PRIMARY }}>
          {label}
        </Text>
        <View style={{ backgroundColor: color + '1F', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, marginLeft: 6 }}>
          <Text style={{ fontSize: 8, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', color }}>
            {tag}
          </Text>
        </View>
      </View>
      <Text style={{ fontSize: 9, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: TEXT_MUTED, marginTop: 4 }}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

export default function TuitionTeacherHomeScreenV2({ navigation }: Props) {
  const { user, users, fetchData, updateAvatar } = useAuth();
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
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
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" colors={['#F59E0B']} />
        }
      >
        <View style={{ paddingTop: Math.max(insets.top, 56), paddingHorizontal: 20 }}>
          {/* ── Header (52px) ── */}
          <View style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '400', color: TEXT_MUTED }}>
                {(() => {
                  const h = new Date().getHours();
                  if (h < 12) return 'Good Morning 👋';
                  if (h < 17) return 'Good Afternoon 👋';
                  return 'Good Evening 👋';
                })()}
              </Text>
              <Text numberOfLines={1} style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 2 }}>
                {user?.name?.split(' ')[0] || 'Teacher'}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={updateAvatar}
              style={{
                width: 54,
                height: 54,
                borderRadius: 27,
                backgroundColor: 'rgba(255,255,255,0.92)',
                borderWidth: 2,
                borderColor: '#FFFFFF',
                shadowColor: '#000000',
                shadowOpacity: 0.1,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 6 },
                elevation: 8,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <Image source={ROLE_AVATAR} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              )}
              <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: ACCENT, padding: 4, borderRadius: 10, borderWidth: 2, borderColor: '#FFFFFF' }}>
                <MaterialCommunityIcons name="camera" size={12} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ height: SECTION_GAP }} />

          {/* ── Tuition Overview (compact hero card) ── */}
          <View style={{ borderRadius: BORDER_RADIUS, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('tuitionAttendance')}>
              <View style={{ padding: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ backgroundColor: ACCENT + '1F', width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Image source={require('../../../assets/icons/calendar.png')} style={{ width: 26, height: 26 }} resizeMode="contain" />
                    </View>
                    <View>
                      <Text style={{ color: TEXT_PRIMARY, fontSize: 17, fontWeight: '700', letterSpacing: -0.5 }}>Tuition Overview</Text>
                      <Text style={{ color: TEXT_MUTED, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 2 }}>{tuitionStudents.length} Students enrolled</Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={18} color="#C7C7CC" />
                </View>
                <View style={{ backgroundColor: 'rgba(247,249,246,0.9)', borderRadius: 14, padding: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    {[
                      { label: 'Total', value: tuitionStudents.length, image: require('../../../assets/icons/team.png') },
                      { label: 'Present', value: todayPresent, image: require('../../../assets/icons/student.png') },
                      { label: 'Absent', value: todayAbsent, image: require('../../../assets/icons/error.png') },
                    ].map((item) => (
                      <View key={item.label} style={{ alignItems: 'center', flex: 1 }}>
                        <View style={{ backgroundColor: ACCENT + '14', width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                          <Image source={item.image} style={{ width: 16, height: 16 }} resizeMode="contain" />
                        </View>
                        <Text style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: '900' }} numberOfLines={1}>{item.value}</Text>
                        <Text style={{ color: TEXT_MUTED, fontSize: 7, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 1 }}>{item.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
                  <MaterialCommunityIcons name="calendar-text" size={12} color={TEXT_MUTED} />
                  <Text style={{ color: TEXT_MUTED, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 6 }}>{todayStr} · Tap to view full attendance</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Today's Pulse ── */}
          <View style={{ paddingTop: SECTION_GAP }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: TEXT_PRIMARY }}>Today's Pulse</Text>
              <View style={{ backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100 }}>
                <Text style={{ color: ACCENT, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Teacher Tools</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <ActionCard
                image={require('../../../assets/icons/note-book.png')}
                label="Homework"
                subtitle="Due Today"
                tag="Assign"
                color="#8B5CF6"
                onPress={() => navigation.navigate('postHomework')}
              />
              <ActionCard
                image={require('../../../assets/icons/database.png')}
                label="Submissions"
                subtitle="Pending Review"
                tag="Review"
                color="#3B82F6"
                onPress={() => navigation.navigate('viewSubmissions')}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <ActionCard
                image={require('../../../assets/icons/exam-results.png')}
                label="Progress"
                subtitle="Reports Pending"
                tag="Track"
                color="#10B981"
                onPress={() => navigation.navigate('tuitionPostProgress')}
              />
              <ActionCard
                image={require('../../../assets/icons/discussion (1).png')}
                label="Messages"
                subtitle="Unread"
                tag="Chat"
                color="#EC4899"
                onPress={() => navigation.navigate('nannyChat')}
              />
            </View>
          </View>
        </View>

        {/* Spacer so the tab dock never covers content */}
        <View style={{ height: 140 }} />
      </ScrollView>
    </View>
  );
}
