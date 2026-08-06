import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput, Image, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import GlassDropdown from '../../admin/v2/GlassDropdown';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TEXT_PRIMARY = '#1F2D28';
const TEXT_MUTED = '#7A8A82';
const BORDER_RADIUS = 22;
const SECTION_GAP = 28;

const STUDENT_ICON = require('../../../assets/icons/student.png');

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

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}
interface Props { navigation: NavigationProps; }

export default function StudentInfoScreenV2({ navigation }: Props) {
  const { user, users, branches, fetchData } = useAuth();
  const insets = useSafeAreaInsets();
  const isMasterAdmin = user?.role === 'master_admin';
  const [branchFilterId, setBranchFilterId] = useState<string | null>(isMasterAdmin ? null : (user?.branch_id?.toString() || null));
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const PAGE_SIZE = 20;

  const students = useMemo(() =>
    users.filter(u =>
      u.role === 'student' &&
      u.status === 'active' &&
      (!branchFilterId || u.branch_id?.toString() === branchFilterId)
    ).sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [users, branchFilterId]
  );

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase().trim();
    return students.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.studentId || '').toLowerCase().includes(q) ||
      (s.fatherName || '').toLowerCase().includes(q) ||
      (s.phone || '').includes(q)
    );
  }, [students, search]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const paginatedStudents = useMemo(() =>
    filteredStudents.slice(0, page * PAGE_SIZE),
    [filteredStudents, page]
  );

  const hasMore = paginatedStudents.length < filteredStudents.length;

  const loadMore = useCallback(() => {
    if (hasMore) setPage(p => p + 1);
  }, [hasMore]);

  useEffect(() => { setPage(1); }, [branchFilterId, search]);

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
        <RadialGlow size={420} color="#DDFBFF" opacity={0.25} style={{ top: -140, left: SCREEN_WIDTH / 2 - 210 }} />
        <RadialGlow size={520} color="#F8FFD8" opacity={0.24} style={{ bottom: -180, left: -180 }} />
        <RadialGlow size={450} color="#EAF5FF" opacity={0.18} style={{ top: SCREEN_HEIGHT * 0.4 - 225, right: -180 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" colors={['#10B981']} />}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View style={{ paddingTop: Math.max(insets.top, 56), paddingHorizontal: 20 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.goBack()}
              style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY }}>‹</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontSize: 12, fontWeight: '400', color: TEXT_MUTED }}>Directory</Text>
              <Text style={{ fontSize: 22, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 2, letterSpacing: -0.5 }}>Student Info</Text>
            </View>
            <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
              <Image source={STUDENT_ICON} style={{ width: 46, height: 46 }} resizeMode="contain" />
            </View>
          </View>

          {/* Branch dropdown */}
          {isMasterAdmin && (
            <View style={{ marginTop: SECTION_GAP }}>
              <GlassDropdown selectedBranchId={branchFilterId} onSelect={setBranchFilterId} />
            </View>
          )}

          {/* Search */}
          <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, height: 50, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
            <MaterialCommunityIcons name="magnify" size={20} color="#3B82F6" />
            <TextInput
              style={{ flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY }}
              placeholder="Search by name, ID, father or phone..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />
            {search !== '' && (
              <TouchableOpacity onPress={() => setSearch('')} style={{ padding: 4 }}>
                <MaterialCommunityIcons name="close-circle" size={18} color={TEXT_MUTED} />
              </TouchableOpacity>
            )}
          </View>

          {/* Count */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: TEXT_PRIMARY }}>Student Directory</Text>
            <View style={{ backgroundColor: 'rgba(59,130,246,0.12)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100 }}>
              <Text style={{ color: '#3B82F6', fontWeight: '900', fontSize: 11 }}>{filteredStudents.length} found</Text>
            </View>
          </View>

          {/* List */}
          {filteredStudents.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Image source={STUDENT_ICON} style={{ width: 80, height: 80, opacity: 0.3 }} resizeMode="contain" />
              <Text style={{ fontSize: 20, fontWeight: '800', color: TEXT_PRIMARY, marginTop: 16 }}>No Students Found</Text>
              <Text style={{ fontSize: 13, color: TEXT_MUTED, textAlign: 'center', marginTop: 6, paddingHorizontal: 20 }}>
                Try adjusting your search or branch filter.
              </Text>
            </View>
          ) : (
            <>
              {paginatedStudents.map(student => {
                const branch = branches.find(b => b.id?.toString() === student.branch_id?.toString());
                return (
                  <TouchableOpacity
                    key={student.id}
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('studentDetail', { studentId: student.id })}
                    style={{
                      marginBottom: 16,
                      borderRadius: BORDER_RADIUS,
                      backgroundColor: 'rgba(255,255,255,0.92)',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.6)',
                      overflow: 'hidden',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                      <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: 'rgba(59,130,246,0.12)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {student.avatar ? (
                          <Image source={{ uri: student.avatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        ) : (
                          <Image source={STUDENT_ICON} style={{ width: 52, height: 52 }} resizeMode="contain" />
                        )}
                      </View>
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text style={{ fontSize: 17, fontWeight: '800', color: TEXT_PRIMARY }} numberOfLines={1}>{student.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap', gap: 6 }}>
                          <View style={{ backgroundColor: 'rgba(247,249,246,0.95)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                            <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, color: '#6B7280' }}>
                              {student.studentId || student.id}
                            </Text>
                          </View>
                          {branch && (
                            <View style={{ backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                              <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, color: '#D97706' }}>{branch.name}</Text>
                            </View>
                          )}
                          <View style={{ backgroundColor: 'rgba(59,130,246,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                            <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, color: '#3B82F6' }}>{student.gender || 'N/A'}</Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: TEXT_MUTED, marginTop: 6 }} numberOfLines={1}>
                          {student.fatherName ? `${student.fatherName}${student.fatherPhone ? ` • ${student.fatherPhone}` : ''}` : 'No parent info'}
                        </Text>
                      </View>
                      <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(59,130,246,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#3B82F6" />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Load More */}
              {hasMore && (
                <TouchableOpacity
                  onPress={loadMore}
                  activeOpacity={0.8}
                  style={{ borderRadius: BORDER_RADIUS, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', padding: 16, alignItems: 'center', marginBottom: 16, borderStyle: 'dashed' }}
                >
                  <MaterialCommunityIcons name="chevron-double-down" size={24} color={TEXT_MUTED} />
                  <Text style={{ fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: TEXT_MUTED, marginTop: 8 }}>
                    Load More ({filteredStudents.length - paginatedStudents.length} remaining)
                  </Text>
                </TouchableOpacity>
              )}

              {!hasMore && filteredStudents.length > PAGE_SIZE && (
                <Text style={{ textAlign: 'center', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: TEXT_MUTED, paddingVertical: 8 }}>
                  All {filteredStudents.length} students loaded
                </Text>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
