import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import BranchFilter from '../../components/BranchFilter';

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}
interface Props { navigation: NavigationProps; }

export default function StudentInfoScreen({ navigation }: Props) {
  const { user, users, branches, fetchData } = useAuth();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
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
    <View style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFFFFF' }}>
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" colors={['#F59E0B']} progressBackgroundColor={isDark ? '#1e1e1e' : '#FFFFFF'} />}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Header */}
          <View className="px-6 pt-4 pb-6">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  className={`mb-4 ${colors.surface} w-12 h-12 rounded-2xl items-center justify-center border ${colors.border} shadow-sm`}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="arrow-left" size={28} color={isDark ? '#FFF' : '#000'} />
                </TouchableOpacity>
                <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>Student</Text>
                <Text className="text-2xl font-bold text-blue-500">Info 📋</Text>
              </View>
              <View className="bg-blue-500 w-20 h-20 rounded-3xl items-center justify-center shadow-lg border-4 border-white rotate-3">
                <MaterialCommunityIcons name="school-outline" size={42} color="white" />
              </View>
            </View>

            {isMasterAdmin && (
              <View style={{ marginTop: 12 }}>
                <BranchFilter selectedBranchId={branchFilterId} onSelect={setBranchFilterId} />
              </View>
            )}

            {/* Search */}
            <View className={`px-6 py-4 rounded-2xl flex-row items-center mt-5 ${colors.surface} border ${colors.border}`}>
              <MaterialCommunityIcons name="magnify" size={22} color="#3B82F6" />
              <TextInput
                style={{ flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '700', color: isDark ? '#FFF' : '#111' }}
                placeholder="Search by name, ID, father or phone..."
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
              />
              {search !== '' && (
                <TouchableOpacity onPress={() => setSearch('')} style={{ padding: 4 }}>
                  <MaterialCommunityIcons name="close-circle" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Count */}
          <View className="flex-row items-center justify-between px-6 mb-5">
            <Text className={`text-xl font-black ${colors.text} ml-1 uppercase tracking-widest opacity-60`}>
              Student Directory ✨
            </Text>
            <View className="bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/10">
              <Text className="text-blue-500 font-black text-xs">{filteredStudents.length} found</Text>
            </View>
          </View>

          {/* List */}
          <View className="px-6">
            {filteredStudents.length === 0 ? (
              <View className="items-center justify-center py-20">
                <MaterialCommunityIcons name="account-off-outline" size={80} color={isDark ? '#4B5563' : '#E5E7EB'} />
                <Text className={`text-2xl font-black mt-6 ${colors.text}`}>No Students Found</Text>
                <Text className={`text-center px-10 mt-2 ${colors.textSecondary}`}>Try adjusting your search or branch filter.</Text>
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
                        width: '100%', aspectRatio: 16 / 9,
                        backgroundColor: isDark ? '#1e1e1c' : '#FFFFFF',
                      }}
                      className="mb-6 relative overflow-hidden rounded-[32px] border-4 border-white shadow-xl"
                    >
                      {/* Background */}
                      {student.avatar ? (
                        <Image
                          source={{ uri: student.avatar }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="flex-1 items-center justify-center" style={{ backgroundColor: isDark ? '#2a2a28' : '#EFF6FF' }}>
                          <MaterialCommunityIcons name="school-outline" size={80} color={isDark ? '#3a3a38' : '#93C5FD'} />
                        </View>
                      )}

                      {/* Overlay */}
                      <View className="absolute inset-0 justify-end p-6" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
                        {/* Top badges */}
                        <View className="flex-row items-center justify-between mb-2">
                          <View className="flex-row gap-2">
                            <View className="bg-white/20 px-3 py-1 rounded-full flex-row items-center">
                              <MaterialCommunityIcons name="card-account-details-outline" size={11} color="white" />
                              <Text className="text-white text-[10px] font-black ml-1.5 uppercase tracking-wider">
                                {student.studentId || student.id}
                              </Text>
                            </View>
                            {branch && (
                              <View className="bg-amber-500/80 px-3 py-1 rounded-full flex-row items-center">
                                <MaterialCommunityIcons name="domain" size={11} color="white" />
                                <Text className="text-white text-[10px] font-black ml-1.5 uppercase tracking-wider">{branch.name}</Text>
                              </View>
                            )}
                          </View>
                          <View className="bg-blue-500/80 px-3 py-1 rounded-full">
                            <Text className="text-white text-[9px] font-black uppercase tracking-wider">
                              {student.gender || 'N/A'}
                            </Text>
                          </View>
                        </View>

                        {/* Name */}
                        <Text className="text-white text-2xl font-black tracking-tighter mb-1" numberOfLines={1}>
                          {student.name}
                        </Text>

                        {/* Details */}
                        <View className="flex-row items-center mb-1">
                          <MaterialCommunityIcons name="account-tie" size={13} color="white" />
                          <Text className="text-white/80 text-xs font-bold ml-1.5">
                            {student.fatherName || 'Parent'} {student.fatherPhone ? `• ${student.fatherPhone}` : ''}
                          </Text>
                        </View>

                        <View className="flex-row items-center justify-between mt-1">
                          <View className="flex-row items-center">
                            <MaterialCommunityIcons name={student.gender === 'Female' ? 'face-woman' : 'face-man'} size={13} color="white" />
                            <Text className="text-white/70 text-[10px] font-bold ml-1.5 uppercase">
                              {student.category || 'Playschool'}
                            </Text>
                          </View>
                          <Text className="text-white/50 text-[10px] font-bold">View Profile →</Text>
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
                    className={`${colors.surface} rounded-2xl p-5 mb-6 border ${colors.border} items-center`}
                    style={{ borderStyle: 'dashed' }}
                  >
                    <MaterialCommunityIcons name="chevron-double-down" size={24} color={isDark ? '#9CA3AF' : '#6B7280'} />
                    <Text className={`font-black text-xs uppercase tracking-wider mt-2 ${colors.textSecondary}`}>
                      Load More ({filteredStudents.length - paginatedStudents.length} remaining)
                    </Text>
                  </TouchableOpacity>
                )}

                {!hasMore && filteredStudents.length > PAGE_SIZE && (
                  <Text className={`text-center text-[10px] font-black uppercase tracking-widest py-4 ${colors.textSecondary}`}>
                    All {filteredStudents.length} students loaded
                  </Text>
                )}
              </>
            )}
          </View>
          <View className="h-32" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
