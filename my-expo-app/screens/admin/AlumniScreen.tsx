import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, FlatList, ListRenderItem,
  Image, StatusBar, RefreshControl
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth, User } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StatusModal from '../../components/StatusModal';

interface NavigationProps { navigate: (screen: string) => void; goBack: () => void; }
interface Props { navigation: NavigationProps; }

const alumniColor = '#7C3AED';
const brandColor = '#F59E0B';

const roleMeta: Record<string, { icon: string; label: string; color: string }> = {
  student: { icon: 'school', label: 'Student', color: '#3B82F6' },
  teacher: { icon: 'account-tie', label: 'Teacher', color: '#F59E0B' },
  nanny: { icon: 'baby-face-outline', label: 'Nanny', color: '#06B6D4' },
  admin: { icon: 'shield-account', label: 'Admin', color: '#7C3AED' },
};

export default function AlumniScreen({ navigation }: Props) {
  const { user, users, toggleUserStatus, fetchData } = useAuth();
  const { theme: appTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = appTheme === 'dark';

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
    const meta = roleMeta[item.role] || { icon: 'account', label: item.role, color: '#6B7280' };
    return (
      <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
        <View style={{
          backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF',
          borderRadius: 20, elevation: 4,
          borderWidth: 1, borderColor: isDark ? '#262626' : '#F3F4F6',
          overflow: 'hidden',
        }}>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ width: 6, backgroundColor: '#9CA3AF' }} />
            <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={{
                width: 48, height: 48, borderRadius: 16,
                backgroundColor: isDark ? '#2d2d24' : '#F3F4F6',
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1, borderColor: isDark ? '#333' : '#E5E7EB',
                overflow: 'hidden',
              }}>
                {item.avatar ? (
                  <Image source={{ uri: item.avatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <MaterialCommunityIcons name={meta.icon as any} size={22} color={isDark ? '#9CA3AF' : '#6B7280'} />
                )}
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontWeight: '900', fontSize: 15, color: isDark ? '#FFFFFF' : '#111827' }} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={{ backgroundColor: isDark ? '#7F1D1D' : '#FFF5F5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                    <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: isDark ? '#FCA5A5' : '#991B1B' }}>
                      Disabled
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280' }}>@{item.username}</Text>
                  <Text style={{ fontSize: 10, color: isDark ? '#6B7280' : '#9CA3AF', marginHorizontal: 4 }}>|</Text>
                  <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1, color: isDark ? '#9CA3AF' : '#6B7280' }}>
                    {item.studentId || item.teacherId || 'ADMIN'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 6 }}>
                  <View style={{ backgroundColor: isDark ? '#2d2d24' : '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: isDark ? '#333' : '#E5E7EB' }}>
                    <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: meta.color }}>
                      {meta.label}
                    </Text>
                  </View>
                  {item.gender && (
                    <View style={{ backgroundColor: isDark ? '#2d2d24' : '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: isDark ? '#333' : '#E5E7EB' }}>
                      <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: isDark ? '#D1D5DB' : '#6B7280' }}>{item.gender}</Text>
                    </View>
                  )}
                  {item.branch?.name && (
                    <View style={{ backgroundColor: '#F5F3FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: '#DDD6FE' }}>
                      <Text style={{ fontSize: 8, fontWeight: '900', color: '#7C3AED' }}>{item.branch.name}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>

          <View style={{
            flexDirection: 'row', borderTopWidth: 1, borderTopColor: isDark ? '#262626' : '#F3F4F6',
            backgroundColor: isDark ? '#2d2d24' : '#F9FAFB',
            paddingVertical: 10, paddingHorizontal: 16,
          }}>
            <TouchableOpacity
              disabled={!canEnable}
              onPress={() => handleEnable(item)}
              style={{ flex: 1, alignItems: 'center', opacity: canEnable ? 1 : 0.4 }}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? '#333' : '#E5E7EB' }}>
                <MaterialCommunityIcons name="account-check-outline" size={16} color="#10B981" />
              </View>
              <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 4 }}>
                {isViewOnly ? 'View Only' : 'Enable'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }, [isDark, canEnable, isViewOnly, handleEnable]);

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#F8F6F0' }}>
      <StatusBar backgroundColor={isDark ? '#1c1c14' : '#F8F6F0'} barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={{ paddingTop: Math.max(insets.top, 20), paddingBottom: 8 }}>
        <View style={{ paddingHorizontal: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity onPress={() => navigation.goBack()}
              style={{
                backgroundColor: brandColor, width: 50, height: 50, borderRadius: 16,
                alignItems: 'center', justifyContent: 'center', elevation: 4,
              }}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontSize: 26, fontWeight: '900', letterSpacing: -0.5, color: isDark ? '#FFFFFF' : '#111827' }}>
                Alumni
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 2 }}>
                Disabled members ({alumni.length})
              </Text>
            </View>
            <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: alumniColor, alignItems: 'center', justifyContent: 'center', opacity: 0.15 }}>
              <MaterialCommunityIcons name="account-star-outline" size={26} color={alumniColor} />
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: isDark ? '#262626' : '#F3F4F6', elevation: 4 }}>
            <MaterialCommunityIcons name="account-search-outline" size={18} color={isDark ? '#6B7280' : '#9CA3AF'} />
            <TextInput
              style={{ flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '600', color: isDark ? '#FFF' : '#111' }}
              placeholder="Search alumni..."
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              value={search}
              onChangeText={setSearch}
            />
            {search !== '' && (
              <TouchableOpacity onPress={() => setSearch('')} style={{ backgroundColor: isDark ? '#333' : '#F3F4F6', padding: 6, borderRadius: 10 }}>
                <MaterialCommunityIcons name="close" size={14} color={isDark ? '#9CA3AF' : '#9CA3AF'} />
              </TouchableOpacity>
            )}
          </View>

          {!canEnable && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, backgroundColor: isDark ? '#2d2d24' : '#FEF3C7', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: isDark ? '#333' : '#FDE68A' }}>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9CA3AF" />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 80 }}>
            <MaterialCommunityIcons name="account-group-outline" size={56} color={isDark ? '#4B5563' : '#D1D5DB'} />
            <Text style={{ fontSize: 16, fontWeight: '800', color: isDark ? '#D1D5DB' : '#6B7280', marginTop: 12 }}>
              No alumni found
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 4 }}>
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
