import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';

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

const PLACEHOLDER = '#E3EBE7';

const ROLE_AVATARS = [
  { label: 'Master Admin', role: 'master_admin', image: require('../../../assets/Avatar/master-admin.png') },
  { label: 'School Admin', role: 'admin', image: require('../../../assets/Avatar/school-admin.png') },
  { label: 'Teacher', role: 'teacher', image: require('../../../assets/Avatar/teacher.png') },
  { label: 'Kids', role: 'student', image: require('../../../assets/Avatar/kids.png') },
  { label: 'Tuition Teacher', role: 'tuition_teacher', image: require('../../../assets/Avatar/teacher.png') },
  { label: 'Tuition Student', role: 'tuition_student', image: require('../../../assets/Avatar/tuitio-student.png') },
  { label: 'Nanny', role: 'nanny', image: require('../../../assets/Avatar/Nanny-avatrt.png') },
];

const ROLE_IMAGE_BY_ROLE: Record<string, any> = {
  master_admin: require('../../../assets/Avatar/master-admin.png'),
  admin: require('../../../assets/Avatar/school-admin.png'),
  teacher: require('../../../assets/Avatar/teacher.png'),
  student: require('../../../assets/Avatar/kids.png'),
  tuition_teacher: require('../../../assets/Avatar/teacher.png'),
  tuition_student: require('../../../assets/Avatar/tuitio-student.png'),
  nanny: require('../../../assets/Avatar/Nanny-avatrt.png'),
};

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

// ─── Stat card (real data, full-width, scrollable) ─────────────────────────────
function StatCard({ iconImage, label, bigValue, bigSuffix, caption, stats, style }: {
  iconImage: any;
  label: string;
  bigValue: string;
  bigSuffix?: string;
  caption: string;
  stats: { label: string; value: string; color?: string }[];
  style?: any;
}) {
  return (
    <View
      style={[
        {
          width: SCREEN_WIDTH - 40,
          height: 150,
          borderRadius: BORDER_RADIUS,
          overflow: 'hidden',
          backgroundColor: 'rgba(255,255,255,0.92)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.6)',
          padding: 16,
          justifyContent: 'space-between',
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 84, height: 84, alignItems: 'center', justifyContent: 'center' }}>
          <Image source={iconImage} style={{ width: 80, height: 80 }} resizeMode="contain" />
        </View>
        <View style={{ flex: 1, marginLeft: 6 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: '#7A8A82' }}>
            {label}
          </Text>
          <Text style={{ fontSize: 30, fontWeight: '700', color: '#1F2D28', letterSpacing: -1, marginTop: 2 }}>
            {bigValue}
            {bigSuffix ? <Text style={{ fontSize: 16, fontWeight: '600', color: '#4A5B53' }}> {bigSuffix}</Text> : null}
          </Text>
          <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: '500', color: '#7A8A82', marginTop: 2 }}>
            {caption}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row' }}>
        {stats.map((s, idx) => (
          <View
            key={s.label}
            style={{
              flex: 1,
              backgroundColor: 'rgba(247,249,246,0.9)',
              borderRadius: 10,
              paddingVertical: 6,
              paddingHorizontal: 8,
              alignItems: 'center',
              marginRight: idx < stats.length - 1 ? 10 : 0,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: s.color || '#1F2D28' }}>{s.value}</Text>
            <Text numberOfLines={1} style={{ fontSize: 8, fontWeight: '600', color: '#7A8A82', marginTop: 1 }}>
              {s.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Placeholder shapes (no text / icons / branding) ───────────────────────────
function PlaceholderBar({ width, height, radius = 6, style }: {
  width: number;
  height: number;
  radius?: number;
  style?: any;
}) {
  return (
    <View
      style={{
        width,
        height,
        borderRadius: radius,
        backgroundColor: PLACEHOLDER,
        ...style,
      }}
    />
  );
}

export default function SuperAdminHomeScreenV2({ navigation }: Props) {
  const { user, activities, users, branches, transactions } = useAuth();
  const insets = useSafeAreaInsets();

  const stats = useMemo(() => {
    const admins = users.filter(u => u.role === 'admin').length;
    const teachers = users.filter(u => u.role === 'teacher').length;
    const students = users.filter(u => u.role === 'student').length;
    const tuitionTeachers = users.filter(u => u.role === 'tuition_teacher').length;
    const tuitionStudents = users.filter(u => u.role === 'tuition_student').length;

    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const approved = transactions.filter(t =>
      (t.status === 'approved' || !t.status) && t.date && t.date.startsWith(monthPrefix)
    );
    const income = approved.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
    const expense = approved.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);

    return {
      totalUsers: users.length,
      admins,
      teachers,
      students,
      tuitionTeachers,
      tuitionStudents,
      tuitionTotal: tuitionTeachers + tuitionStudents,
      income,
      expense,
      net: income - expense,
    };
  }, [users, transactions]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      {/* ── Aurora Glass background ── */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#F7F9F6', '#F2FAF5', '#EEFDFC', '#F7F9F6']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <RadialGlow size={480} color="#DDF8D7" opacity={0.28} style={{ top: -160, left: -160 }} />
        <RadialGlow
          size={420}
          color="#DDFBFF"
          opacity={0.25}
          style={{ top: -140, left: SCREEN_WIDTH / 2 - 210 }}
        />
        <RadialGlow size={520} color="#F8FFD8" opacity={0.24} style={{ bottom: -180, left: -180 }} />
        <RadialGlow
          size={450}
          color="#EAF5FF"
          opacity={0.18}
          style={{ top: SCREEN_HEIGHT * 0.4 - 225, right: -180 }}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={{ paddingTop: Math.max(insets.top, 56), paddingHorizontal: 20 }}>
          {/* ── Header (52px) ── */}
          <View style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '400', color: '#7A8A82' }}>
                {(() => {
                  const h = new Date().getHours();
                  if (h < 12) return 'Good Morning 👋';
                  if (h < 17) return 'Good Afternoon 👋';
                  return 'Good Evening 👋';
                })()}
              </Text>
              <Text numberOfLines={1} style={{ fontSize: 20, fontWeight: '700', color: '#1F2D28', marginTop: 2 }}>
                {user?.name || 'Master Admin'}
              </Text>
            </View>
            <View
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
                <Image
                  source={ROLE_IMAGE_BY_ROLE[user?.role || ''] || ROLE_IMAGE_BY_ROLE.master_admin}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              )}
            </View>
          </View>

          <View style={{ height: SECTION_GAP }} />

          {/* ── Section title ── */}
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#1F2D28' }}>Overview</Text>

          <View style={{ height: 16 }} />

          {/* ── Stats carousel (full-width, scrollable) ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={SCREEN_WIDTH - 40 + 16}
            decelerationRate="fast"
            style={{ marginHorizontal: -20 }}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            <StatCard
              iconImage={require('../../../assets/icons/team.png')}
              label="Total Users"
              bigValue={String(stats.totalUsers)}
              caption="All admins, teachers & students"
              stats={[
                { label: 'Admins', value: String(stats.admins), color: '#3B82F6' },
                { label: 'Teachers', value: String(stats.teachers), color: '#F59E0B' },
                { label: 'Students', value: String(stats.students), color: '#10B981' },
              ]}
              style={{ marginRight: 16 }}
            />
            <StatCard
              iconImage={require('../../../assets/icons/maths.png')}
              label="Finance · This Month"
              bigValue={`₹${(stats.net || 0).toLocaleString('en-IN')}`}
              caption="Net balance for the current month"
              stats={[
                { label: 'Income', value: `₹${(stats.income || 0).toLocaleString('en-IN')}`, color: '#10B981' },
                { label: 'Expense', value: `₹${(stats.expense || 0).toLocaleString('en-IN')}`, color: '#EF4444' },
              ]}
              style={{ marginRight: 16 }}
            />
            <StatCard
              iconImage={require('../../../assets/icons/education.png')}
              label="Tuition Users"
              bigValue={String(stats.tuitionTotal)}
              caption="After-school program members"
              stats={[
                { label: 'Tuition Teachers', value: String(stats.tuitionTeachers), color: '#8B5CF6' },
                { label: 'Tuition Students', value: String(stats.tuitionStudents), color: '#6366F1' },
              ]}
            />
          </ScrollView>

          <View style={{ height: SECTION_GAP }} />

          {/* ── User Management section header (title + small action) ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1F2D28' }}>User Management</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('userMange')}>
              <Text style={{ fontSize: 13, fontWeight: '400', color: '#4A5B53' }}>View</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 18 }} />

          {/* ── Circular avatar list (64px, gap 18) ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -20 }}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {ROLE_AVATARS.map((role, i) => (
              <TouchableOpacity key={role.label} activeOpacity={0.8} onPress={() => navigation.navigate('userMange', { role: role.role })} style={{ alignItems: 'center', marginRight: i < ROLE_AVATARS.length - 1 ? 18 : 0 }}>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: '#E3EBE7',
                    borderWidth: 3,
                    borderColor: '#FFFFFF',
                    shadowColor: '#000000',
                    shadowOpacity: 0.05,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 4,
                    overflow: 'hidden',
                  }}
                >
                  <Image source={role.image} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                </View>
                <Text
                  numberOfLines={1}
                  style={{
                    marginTop: 8,
                    fontSize: 11,
                    fontWeight: '600',
                    color: '#4A5B53',
                    maxWidth: 80,
                  }}
                >
                  {role.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={{ height: SECTION_GAP }} />

          {/* ── Kids Quick Feed ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1F2D28' }}>Kids Quick Feed</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('activityFeed')}>
              <Text style={{ fontSize: 13, fontWeight: '400', color: '#4A5B53' }}>View</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 18 }} />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -20 }}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {activities.slice(0, 6).map((act, i) => {
              const isVideo = act.mediaType === 'video';
              const imageUri = isVideo ? act.thumbnailUrl || act.mediaUrl : act.mediaUrl;
              const branchName =
                branches.find(b => b.id?.toString() === act.branch_id?.toString())?.name || 'All Branches';
              const students = users.filter(u => act.studentIds?.includes(u.id));
              const studentName = students[0]?.name || 'Kids';
              return (
                <View
                  key={act.id}
                  style={{
                    width: 150,
                    marginRight: 14,
                    borderRadius: 22,
                    overflow: 'hidden',
                    backgroundColor: 'rgba(255,255,255,0.92)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.6)',
                  }}
                >
                  <View style={{ height: 130, width: '100%', overflow: 'hidden' }}>
                    {imageUri ? (
                      <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <Image
                        source={ROLE_AVATARS[3].image}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    )}
                    {isVideo && (
                      <View
                        style={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          borderRadius: 10,
                          width: 22,
                          height: 22,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900' }}>▶</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ padding: 12 }}>
                    <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '600', color: '#1F2D28' }}>
                      {act.title || 'Kids Moment'}
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 6,
                        backgroundColor: 'rgba(247,249,246,0.9)',
                        borderRadius: 8,
                        paddingHorizontal: 6,
                        paddingVertical: 3,
                      }}
                    >
                      <Text numberOfLines={1} style={{ fontSize: 9, fontWeight: '700', color: '#3F8F5F', flex: 1 }}>
                        {branchName}
                      </Text>
                      <Text style={{ fontSize: 9, color: '#A5B3AB', marginHorizontal: 4 }}>·</Text>
                      <Text numberOfLines={1} style={{ fontSize: 9, fontWeight: '600', color: '#4A5B53', flex: 1 }}>
                        {studentName}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* ── Bottom padding 40 ── */}
          <View style={{ height: 40 }} />
        </View>

        {/* Spacer so the tab dock never covers content */}
        <View style={{ height: 140 }} />
      </ScrollView>
    </View>
  );
}
