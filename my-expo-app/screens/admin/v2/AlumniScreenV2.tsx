import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, FlatList, ListRenderItem,
  Image, StyleSheet, RefreshControl, Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth, User } from '../../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StatusModal from '../../../components/StatusModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NavigationProps { navigate: (screen: string) => void; goBack: () => void; }
interface Props { navigation: NavigationProps; }

const alumniColor = '#7C3AED';
const brandColor = '#F59E0B';

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const BORDER_RADIUS = 22;

const roleMeta: Record<string, { image: any; label: string; color: string }> = {
  student: { image: require('../../../assets/icons/student.png'), label: 'Student', color: '#3B82F6' },
  teacher: { image: require('../../../assets/icons/teacher.png'), label: 'Teacher', color: '#F59E0B' },
  nanny: { image: require('../../../assets/icons/family.png'), label: 'Nanny', color: '#06B6D4' },
  admin: { image: require('../../../assets/icons/team.png'), label: 'Admin', color: '#7C3AED' },
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

export default function AlumniScreenV2({ navigation }: Props) {
  const { user, users, toggleUserStatus, fetchData } = useAuth();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [statusModal, setStatusModal] = useState({ visible: false, title: '', message: '', type: 'error' as any });

  const isMaster = user?.role === 'master_admin';
  const isSchoolAdmin = user?.role === 'admin';
  const canEnable = isMaster || isSchoolAdmin;
  const isViewOnly = user?.role === 'nanny';

  const alumni = useMemo(() => {
    let list = users.filter(u =>
      u.status === 'inactive' &&
      u.role !== 'master_admin' &&
      u.role !== 'tuition_teacher' &&
      u.role !== 'tuition_student'
    );
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(u =>
        u.name.toLowerCase().includes(q) ||
        (u.studentId && u.studentId.toLowerCase().includes(q)) ||
        (u.teacherId && u.teacherId.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [users, search]);

  const handleEnable = useCallback(async (u: User) => {
    if (!canEnable) return;
    try {
      await toggleUserStatus(u.id);
      setStatusModal({ visible: true, title: 'User Enabled ✅', message: `${u.name} has been moved back to active members.`, type: 'success' });
    } catch (e) {
      setStatusModal({ visible: true, title: 'Error ⚠️', message: 'Failed to enable user. Please try again.', type: 'error' });
    }
  }, [canEnable, toggleUserStatus]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const renderItem: ListRenderItem<User> = useCallback(({ item }) => {
    const meta = roleMeta[item.role] || { image: require('../../../assets/icons/team.png'), label: item.role, color: '#6B7280' };
    return (
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.92)',
          borderRadius: BORDER_RADIUS,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.6)',
          overflow: 'hidden',
        }}>
          <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 48, height: 48, borderRadius: 16,
              backgroundColor: meta.color + '1F',
              alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <Image source={meta.image} style={{ width: 28, height: 28 }} resizeMode="contain" />
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '700', fontSize: 15, color: TEXT_PRIMARY }} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={{ backgroundColor: 'rgba(239,68,68,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                  <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: '#EF4444' }}>
                    Disabled
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: TEXT_MUTED }}>@{item.username}</Text>
                <Text style={{ fontSize: 10, color: TEXT_MUTED, marginHorizontal: 4 }}>|</Text>
                <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1, color: TEXT_MUTED }}>
                  {item.studentId || item.teacherId || 'ADMIN'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 6 }}>
                <View style={{ backgroundColor: meta.color + '1F', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                  <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: meta.color }}>
                    {meta.label}
                  </Text>
                </View>
                {item.gender && (
                  <View style={{ backgroundColor: 'rgba(247,249,246,0.9)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                    <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: TEXT_MUTED }}>{item.gender}</Text>
                  </View>
                )}
                {item.branch?.name && (
                  <View style={{ backgroundColor: 'rgba(124,58,237,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                    <Text style={{ fontSize: 8, fontWeight: '900', color: alumniColor }}>{item.branch.name}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={{
            flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(247,249,246,1)',
            backgroundColor: 'rgba(247,249,246,0.7)',
            paddingVertical: 10, paddingHorizontal: 16,
          }}>
            <TouchableOpacity
              disabled={!canEnable}
              onPress={() => handleEnable(item)}
              style={{ flex: 1, alignItems: 'center', opacity: canEnable ? 1 : 0.4 }}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(16,185,129,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="account-check-outline" size={16} color="#10B981" />
              </View>
              <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: TEXT_MUTED, marginTop: 4 }}>
                {isViewOnly ? 'View Only' : 'Enable'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }, [canEnable, isViewOnly, handleEnable]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />

      <View style={{ paddingTop: Math.max(insets.top, 20), paddingBottom: 8 }}>
        <View style={{ paddingHorizontal: 20 }}>
          {/* ── Header ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity onPress={() => navigation.goBack()}
              style={{
                backgroundColor: 'rgba(255,255,255,0.92)',
                width: 50, height: 50, borderRadius: 16,
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
                alignItems: 'center', justifyContent: 'center',
              }}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={TEXT_PRIMARY} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontSize: 22, fontWeight: '700', letterSpacing: -0.5, color: TEXT_PRIMARY }}>
                Alumni
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: TEXT_MUTED, marginTop: 2 }}>
                Disabled members ({alumni.length})
              </Text>
            </View>
            <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: 'rgba(124,58,237,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="account-star-outline" size={26} color={alumniColor} />
            </View>
          </View>

          {/* ── Search ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
            <MaterialCommunityIcons name="account-search-outline" size={18} color={TEXT_MUTED} />
            <TextInput
              style={{ flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '600', color: TEXT_PRIMARY }}
              placeholder="Search alumni..."
              placeholderTextColor={TEXT_MUTED}
              value={search}
              onChangeText={setSearch}
            />
            {search !== '' && (
              <TouchableOpacity onPress={() => setSearch('')} style={{ backgroundColor: 'rgba(247,249,246,0.9)', padding: 6, borderRadius: 10 }}>
                <MaterialCommunityIcons name="close" size={14} color={TEXT_MUTED} />
              </TouchableOpacity>
            )}
          </View>

          {!canEnable && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: 14, padding: 12 }}>
              <MaterialCommunityIcons name="eye-outline" size={16} color="#D97706" />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#D97706', marginLeft: 8, flex: 1 }}>
                You can view alumni. Only Admin / Master Admin can Enable.
              </Text>
            </View>
          )}
        </View>
      </View>

      <FlatList
        data={alumni}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" colors={['#F59E0B']} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 80 }}>
            <MaterialCommunityIcons name="account-group-outline" size={56} color="#D1D5DB" />
            <Text style={{ fontSize: 16, fontWeight: '800', color: TEXT_MUTED, marginTop: 12 }}>
              No alumni found
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: TEXT_MUTED, marginTop: 4 }}>
              Disabled members will appear here.
            </Text>
          </View>
        }
      />

      <StatusModal
        visible={statusModal.visible}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
        onClose={() => setStatusModal(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}
