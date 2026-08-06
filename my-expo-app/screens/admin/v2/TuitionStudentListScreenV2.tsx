import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, RefreshControl, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import GlassDropdown from './GlassDropdown';
import GlassSelectV2 from './GlassSelectV2';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const BORDER_RADIUS = 22;

const STUDENT_ICON = require('../../../assets/icons/student.png');
const CLASS_ICON = require('../../../assets/icons/education.png');

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

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

interface Props { navigation: NavigationProps }

interface Batch {
  id: string;
  name: string;
  description?: string;
  branch_id?: string | number;
  students_count?: number;
}

export default function TuitionStudentListScreenV2({ navigation }: Props) {
  const { user, users, branches, fetchData } = useAuth();
  const insets = useSafeAreaInsets();

  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const isMasterAdmin = user?.role === 'master_admin';
  const isSchoolAdmin = user?.role === 'admin';
  const effectiveBranchId = isSchoolAdmin ? (user?.branch_id || null) : isMasterAdmin ? selectedBranchId : null;

  const loadBatches = useCallback(async () => {
    try {
      const params = effectiveBranchId ? `?branch_id=${effectiveBranchId}` : '';
      const res = await api.get(`/batches${params}`);
      const d: Batch[] = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      const mapped = d.map(b => ({
        id: b.id.toString(),
        name: b.name,
        description: b.description,
        branch_id: b.branch_id != null ? b.branch_id.toString() : undefined,
        students_count: b.students_count,
      }));
      setBatches(mapped);
      setSelectedBatchId(prev => {
        if (prev && mapped.some(b => b.id === prev)) return prev;
        return null;
      });
    } catch {}
  }, [effectiveBranchId]);

  useEffect(() => { loadBatches(); }, [loadBatches]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await Promise.all([fetchData(), loadBatches()]); } catch (e) { console.error('Refresh Error:', e); } finally { setRefreshing(false); }
  }, [fetchData, loadBatches]);

  const students = useMemo(() => {
    let list = users.filter(u => u.role === 'tuition_student');
    if (effectiveBranchId) list = list.filter(u => u.branch_id?.toString() === effectiveBranchId);
    if (selectedBatchId) list = list.filter(u => u.batch_id?.toString() === selectedBatchId);
    return list.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [users, effectiveBranchId, selectedBatchId]);

  const selectedBatch = useMemo(() => batches.find(b => b.id === selectedBatchId) || null, [batches, selectedBatchId]);

  const branchName = (id?: string | number) => {
    if (id === undefined || id === null || id === '') return '';
    return branches.find(b => b.id?.toString() === id.toString())?.name || '';
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" colors={['#F59E0B']} />}
      >
        {/* ── Header ── */}
        <View style={{ paddingTop: Math.max(insets.top, 56), flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY }}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontSize: 12, fontWeight: '400', color: TEXT_MUTED }}>Tuition</Text>
            <Text style={{ fontSize: 22, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 2, letterSpacing: -0.5 }}>Student List</Text>
          </View>
          <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
            <Image source={STUDENT_ICON} style={{ width: 46, height: 46 }} resizeMode="contain" />
          </View>
        </View>

        {/* ── Filters ── */}
        {isMasterAdmin && (
          <View style={{ marginTop: 20 }}>
            <GlassDropdown selectedBranchId={selectedBranchId} onSelect={setSelectedBranchId} icon={STUDENT_ICON} />
          </View>
        )}

        <View style={{ marginTop: 20 }}>
          <GlassSelectV2
            label="Class"
            value={selectedBatchId}
            placeholder="All Classes"
            options={batches.map(b => ({ label: b.name + (branchName(b.branch_id) ? ` · ${branchName(b.branch_id)}` : ''), value: b.id, hint: `${b.students_count != null ? b.students_count + ' students' : 'Select this class'}` }))}
            onSelect={setSelectedBatchId}
            icon={CLASS_ICON}
            title="Select Class"
            subtitle="Filter students by batch"
            footerHint="Selected class is applied to the student list below."
            showAllOption
            allLabel="All Classes"
            allHint={`${batches.length} classes available`}
          />
        </View>

        {/* ── Selected batch summary ── */}
        {selectedBatch && (
          <TouchableOpacity activeOpacity={0.9} style={{ marginTop: 16, borderRadius: BORDER_RADIUS, overflow: 'hidden' }}>
            <LinearGradient colors={['#8B5CF6', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <MaterialCommunityIcons name="google-classroom" size={20} color="white" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ color: 'white', fontSize: 16, fontWeight: '900' }}>{selectedBatch.name}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 2 }}>
                      {branchName(selectedBatch.branch_id) || 'Class'} · Tuition Students
                    </Text>
                  </View>
                </View>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100 }}>
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: '900' }}>{students.length} students</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* ── Students ── */}
        <View style={{ marginTop: 20 }}>
          {batches.length === 0 && !selectedBatchId ? (
            <View style={{ alignItems: 'center', paddingVertical: 60, borderRadius: BORDER_RADIUS, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
              <ActivityIndicator size="large" color="#F59E0B" />
              <Text style={{ color: TEXT_MUTED, fontWeight: '700', marginTop: 16 }}>Loading classes...</Text>
            </View>
          ) : students.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 60, borderRadius: BORDER_RADIUS, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
              <MaterialCommunityIcons name="account-search-outline" size={72} color={TEXT_MUTED} style={{ opacity: 0.3 }} />
              <Text style={{ fontSize: 17, fontWeight: '900', color: TEXT_PRIMARY, marginTop: 14 }}>No Students Found</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: TEXT_MUTED, marginTop: 4, textAlign: 'center' }}>No tuition students in this class yet.</Text>
            </View>
          ) : (
            students.map(student => {
              const isActive = student.status === 'active';
              return (
                <TouchableOpacity
                  key={student.id}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('tuitionStudentDetail', { studentId: student.id })}
                  style={{
                    borderRadius: BORDER_RADIUS,
                    backgroundColor: 'rgba(255,255,255,0.92)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.6)',
                    borderLeftWidth: 4,
                    borderLeftColor: isActive ? '#10B981' : '#9CA3AF',
                    padding: 14,
                    marginBottom: 10,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: isActive ? 'rgba(245,158,11,0.12)' : 'rgba(156,163,175,0.12)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {student.avatar ? (
                        <Image source={{ uri: student.avatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      ) : (
                        <MaterialCommunityIcons name="school" size={24} color={isActive ? '#D97706' : '#9CA3AF'} />
                      )}
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text numberOfLines={1} style={{ fontWeight: '900', fontSize: 15, color: TEXT_PRIMARY }}>{student.name}</Text>
                        <View style={{ backgroundColor: isActive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                          <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: isActive ? '#059669' : '#DC2626' }}>{student.status}</Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                        <MaterialCommunityIcons name="card-account-details-outline" size={11} color="#D97706" />
                        <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1, color: TEXT_MUTED, marginLeft: 4 }}>{student.studentId || 'TS-000'}</Text>
                        {student.fees && (
                          <>
                            <Text style={{ fontSize: 10, color: '#B0B7C3', marginHorizontal: 4 }}>|</Text>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#D97706' }}>₹{student.fees}</Text>
                          </>
                        )}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                        <MaterialCommunityIcons name="gender-male-female" size={11} color="#B0B7C3" />
                        <Text style={{ fontSize: 9, fontWeight: '700', color: TEXT_MUTED, marginLeft: 4 }}>{student.gender || 'N/A'}</Text>
                        {student.fatherName && (
                          <>
                            <Text style={{ fontSize: 9, color: '#B0B7C3', marginHorizontal: 6 }}>·</Text>
                            <MaterialCommunityIcons name="account-tie" size={11} color="#B0B7C3" />
                            <Text numberOfLines={1} style={{ fontSize: 9, fontWeight: '700', color: TEXT_MUTED, marginLeft: 4 }}>{student.fatherName}</Text>
                          </>
                        )}
                      </View>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={22} color="#B0B7C3" />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
