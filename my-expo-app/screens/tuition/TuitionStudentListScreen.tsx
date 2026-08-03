import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import BranchFilter from '../../components/BranchFilter';
import FormSelect from '../../components/FormSelect';
import api from '../../services/api';

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

interface TuitionStudentListScreenProps {
  navigation: NavigationProps;
}

interface Batch {
  id: string;
  name: string;
  description?: string;
  branch_id?: string | number;
  students_count?: number;
}

export default function TuitionStudentListScreen({ navigation }: TuitionStudentListScreenProps) {
  const { user, users, branches, fetchData } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = theme === 'dark';

  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const isMasterAdmin = user?.role === 'master_admin';
  const isSchoolAdmin = user?.role === 'admin';

  const effectiveBranchId = isSchoolAdmin ? user?.branch_id || null : isMasterAdmin ? selectedBranchId : null;

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
        if (mapped.some(b => b.id === prev)) return prev;
        return mapped.length > 0 ? mapped[0].id : '';
      });
    } catch {}
  }, [effectiveBranchId]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchData(), loadBatches()]);
    } catch (e) {
      console.error('Refresh Error:', e);
    } finally {
      setRefreshing(false);
    }
  }, [fetchData, loadBatches]);

  const students = useMemo(() => {
    let list = users.filter(u => u.role === 'tuition_student');
    if (effectiveBranchId) {
      list = list.filter(u => u.branch_id === effectiveBranchId);
    }
    if (selectedBatchId) {
      list = list.filter(u => u.batch_id === selectedBatchId);
    }
    return list.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [users, effectiveBranchId, selectedBatchId]);

  const selectedBatch = useMemo(
    () => batches.find(b => b.id === selectedBatchId) || null,
    [batches, selectedBatchId]
  );

  const branchName = (id?: string | number) => {
    if (id === undefined || id === null || id === '') return '';
    return branches.find(b => b.id?.toString() === id.toString())?.name || '';
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#F8F6F0' }}>
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#F8F6F0' }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" colors={['#F59E0B']} progressBackgroundColor={isDark ? '#1c1c14' : '#FFFFFF'} />
          }
        >
          <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <View style={{ flex: 1 }}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={{
                    backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF',
                    borderRadius: 16, width: 50, height: 50, alignItems: 'center', justifyContent: 'center',
                    borderWidth: 1, borderColor: isDark ? '#262626' : '#E5E7EB', marginBottom: 16, elevation: 4,
                  }}>
                  <MaterialCommunityIcons name="arrow-left" size={24} color={isDark ? '#FFF' : '#111'} />
                </TouchableOpacity>
                <Text style={{ fontSize: 34, fontWeight: '900', letterSpacing: -0.5, color: isDark ? '#FFFFFF' : '#111827' }}>
                  Tuition
                </Text>
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#F59E0B', marginTop: -2 }}>
                  Student List 🎓
                </Text>
              </View>
              <View style={{ backgroundColor: '#F59E0B', width: 80, height: 80, borderRadius: 20, alignItems: 'center', justifyContent: 'center', elevation: 8, transform: [{ rotate: '3deg' }], borderWidth: 4, borderColor: isDark ? '#2d2d24' : '#FFFFFF' }}>
                <MaterialCommunityIcons name="account-school" size={40} color="white" />
              </View>
            </View>

            {/* Filters */}
            <View style={{ gap: 12, marginBottom: 20 }}>
              {isMasterAdmin && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <BranchFilter selectedBranchId={selectedBranchId} onSelect={setSelectedBranchId} />
                  </View>
                </View>
              )}
              {isSchoolAdmin && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <BranchFilter selectedBranchId={null} onSelect={() => {}} />
                  </View>
                </View>
              )}
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 7 }}>
                  <View style={{ width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#2a2a28' : '#F3F4F6', marginRight: 8 }}>
                    <MaterialCommunityIcons name="google-classroom" size={14} color="#F59E0B" />
                  </View>
                  <Text style={{ fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', color: isDark ? '#9CA3AF' : '#6B7280' }}>
                    Select Class
                  </Text>
                </View>
                <FormSelect
                  value={selectedBatchId}
                  options={batches.map(b => ({ label: b.name + (branchName(b.branch_id) ? ` · ${branchName(b.branch_id)}` : ''), value: b.id }))}
                  onSelect={setSelectedBatchId}
                  placeholder="Select a class"
                  theme={theme}
                />
              </View>
            </View>

            {/* Selected batch summary */}
            {selectedBatch && (
              <TouchableOpacity
                activeOpacity={0.9}
                style={{ borderRadius: 16, overflow: 'hidden', elevation: 12, marginBottom: 20 }}
              >
                <View style={{ backgroundColor: '#8B5CF6', padding: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                        <MaterialCommunityIcons name="google-classroom" size={20} color="white" />
                      </View>
                      <View>
                        <Text style={{ color: 'white', fontSize: 18, fontWeight: '900' }}>{selectedBatch.name}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 1 }}>
                          {branchName(selectedBatch.branch_id) || 'Class'} · Tuition Students
                        </Text>
                      </View>
                    </View>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100 }}>
                      <Text style={{ color: 'white', fontSize: 10, fontWeight: '900' }}>{students.length} students</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* Students */}
            {batches.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <ActivityIndicator size="large" color="#F59E0B" />
                <Text style={{ color: isDark ? '#9CA3AF' : '#6B7280', fontWeight: '700', marginTop: 16 }}>Loading classes...</Text>
              </View>
            ) : students.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <MaterialCommunityIcons name="account-search-outline" size={80} color={isDark ? '#3a3a38' : '#E5E7EB'} />
                <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#FFFFFF' : '#111827', marginTop: 16 }}>No Students Found</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 4, textAlign: 'center' }}>
                  No tuition students in this class yet.
                </Text>
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
                      backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF',
                      borderRadius: 20, marginBottom: 12, elevation: 4,
                      borderWidth: 1, borderColor: isDark ? '#262626' : '#F3F4F6',
                      overflow: 'hidden',
                    }}
                  >
                    <View style={{ flexDirection: 'row' }}>
                      <View style={{ width: 6, backgroundColor: isActive ? '#10B981' : '#9CA3AF' }} />
                      <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={{
                          width: 52, height: 52, borderRadius: 16,
                          backgroundColor: isDark ? '#2d2d24' : '#F3F4F6',
                          alignItems: 'center', justifyContent: 'center',
                          borderWidth: 1, borderColor: isDark ? '#333' : '#E5E7EB',
                          overflow: 'hidden',
                        }}>
                          {student.avatar ? (
                            <Image source={{ uri: student.avatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                          ) : (
                            <MaterialCommunityIcons name="school" size={24} color={isDark ? '#9CA3AF' : '#6B7280'} />
                          )}
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={{ fontWeight: '900', fontSize: 15, color: isDark ? '#FFFFFF' : '#111827' }} numberOfLines={1}>
                              {student.name}
                            </Text>
                            <View style={{
                              backgroundColor: isActive ? (isDark ? '#064E3B' : '#F0FFF4') : (isDark ? '#7F1D1D' : '#FFF5F5'),
                              paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                            }}>
                              <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: isActive ? '#065F46' : '#991B1B' }}>
                                {student.status}
                              </Text>
                            </View>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                            <MaterialCommunityIcons name="card-account-details-outline" size={11} color="#F59E0B" />
                            <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1, color: isDark ? '#9CA3AF' : '#6B7280', marginLeft: 4 }}>
                              {student.studentId || 'TS-000'}
                            </Text>
                            {student.fees && (
                              <>
                                <Text style={{ fontSize: 10, color: isDark ? '#6B7280' : '#9CA3AF', marginHorizontal: 4 }}>|</Text>
                                <Text style={{ fontSize: 10, fontWeight: '800', color: '#D97706' }}>₹{student.fees}</Text>
                              </>
                            )}
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                            <MaterialCommunityIcons name="gender-male-female" size={11} color={isDark ? '#6B7280' : '#9CA3AF'} />
                            <Text style={{ fontSize: 9, fontWeight: '700', color: isDark ? '#6B7280' : '#9CA3AF', marginLeft: 4 }}>
                              {student.gender || 'N/A'}
                            </Text>
                            {student.fatherName && (
                              <>
                                <Text style={{ fontSize: 9, color: isDark ? '#6B7280' : '#9CA3AF', marginHorizontal: 6 }}>·</Text>
                                <MaterialCommunityIcons name="account-tie" size={11} color={isDark ? '#6B7280' : '#9CA3AF'} />
                                <Text style={{ fontSize: 9, fontWeight: '700', color: isDark ? '#6B7280' : '#9CA3AF', marginLeft: 4 }} numberOfLines={1}>
                                  {student.fatherName}
                                </Text>
                              </>
                            )}
                          </View>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={22} color={isDark ? '#6B7280' : '#9CA3AF'} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
            <View style={{ height: 32 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
