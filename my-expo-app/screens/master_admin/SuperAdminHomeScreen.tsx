import React, { useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
}

export default function SuperAdminHomeScreen({ navigation }: Props) {
  const { user, users, branches, fetchData, updateAvatar } = useAuth();
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);

  const stats = useMemo(() => ({
    branches: branches.length,
    admins: users.filter(u => u.role === 'admin').length,
    teachers: users.filter(u => u.role === 'teacher' && u.status === 'active').length,
    students: users.filter(u => u.role === 'student' && u.status === 'active').length,
  }), [users, branches]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  return (
    <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" colors={["#F59E0B"]} />
        }
      >
        <View style={{ paddingTop: Math.max(useSafeAreaInsets().top, 50), paddingHorizontal: 24, paddingBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: theme === 'dark' ? '#D1D5DB' : '#6B7280' }}>
                TN HAPPYKIDS
              </Text>
              <Text style={{ fontSize: 30, fontWeight: '900', letterSpacing: -0.5, marginTop: 4, color: theme === 'dark' ? '#FFFFFF' : '#111827' }}>
                {user?.name || 'Master Admin'}
              </Text>
              <View style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100, marginTop: 12, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.1)' }}>
                <Text style={{ color: '#F59E0B', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Super Admin Console</Text>
              </View>
            </View>
            <TouchableOpacity activeOpacity={0.85} onPress={updateAvatar}
              style={{ backgroundColor: '#FDE047', width: 80, height: 80, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FFFFFF', transform: [{ rotate: '3deg' }], overflow: 'hidden' }}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <MaterialCommunityIcons name="shield-crown" size={36} color="#92400E" />
              )}
              <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: '#7C3AED', padding: 4, borderRadius: 10, borderWidth: 2, borderColor: '#FFFFFF' }}>
                <MaterialCommunityIcons name="camera" size={12} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ paddingHorizontal: 24, paddingVertical: 8 }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('branchManagement')}
            style={{ borderRadius: 24, overflow: 'hidden', elevation: 15 }}
          >
            <View style={{ backgroundColor: '#EC4899', padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <MaterialCommunityIcons name="domain" size={22} color="white" />
                  </View>
                  <View>
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 }}>Branch Network</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 1 }}>Franchise Management</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 }}>
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }}>{stats.branches} Branches</Text>
                </View>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  {[
                    { label: 'Admins', value: stats.admins, icon: 'account-tie', color: '#FCD34D' },
                    { label: 'Teachers', value: stats.teachers, icon: 'account-group', color: '#6EE7B7' },
                    { label: 'Students', value: stats.students, icon: 'school', color: '#93C5FD' },
            ].map((item, i) => (
                    <View key={item.label} style={{ alignItems: 'center', flex: 1, borderRightWidth: i < 2 ? 1 : 0, borderRightColor: 'rgba(255,255,255,0.1)' }}>
                      <MaterialCommunityIcons name={item.icon as any} size={28} color="#FFFFFF" style={{ marginBottom: 6 }} />
                      <Text style={{ color: 'white', fontSize: 18, fontWeight: '900' }}>{item.value}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginTop: 1 }}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
                <MaterialCommunityIcons name="arrow-right-circle" size={14} color="rgba(255,255,255,0.5)" />
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 6 }}>Manage Branches</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 24, paddingVertical: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', letterSpacing: -0.5, color: theme === 'dark' ? '#FFFFFF' : '#111827' }}>Quick Actions</Text>
            <View style={{ backgroundColor: 'rgba(245,158,11,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' }}>
              <Text style={{ color: '#F59E0B', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>5 Actions</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {[
              { label: 'Live Monitoring', screen: 'liveCamera', icon: 'broadcast', color: '#EF4444', bg: '#FEF2F2' },
              { label: 'Kids Feed', screen: 'activityFeed', icon: 'star-face', color: '#3B82F6', bg: '#EFF6FF' },
              { label: 'User Management', screen: 'userManagementV2', icon: 'account-multiple', color: '#F59E0B', bg: '#FFFBEB' },
              { label: 'Income/Expense', screen: 'incomeExpense', icon: 'finance', color: '#10B981', bg: '#ECFDF5' },
              { label: 'Attendance', screen: 'attendanceSelection', icon: 'calendar-check', color: '#EC4899', bg: '#FDF2F8' },
            ].map((item, i) => (
              <TouchableOpacity
                key={item.label}
                activeOpacity={0.85}
                onPress={() => navigation.navigate(item.screen)}
                style={{
                  width: i === 4 ? '100%' : '48%',
                  marginBottom: 14,
                  borderRadius: 24,
                  overflow: 'hidden',
                  elevation: 12,
                  backgroundColor: theme === 'dark' ? '#2a2a28' : item.bg,
                  borderWidth: 1,
                  borderColor: theme === 'dark' ? '#3a3a38' : `${item.color}20`,
                  padding: 20,
                }}
              >
                <View style={{
                  width: 56, height: 56, borderRadius: 18,
                  backgroundColor: item.color,
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14,
                  shadowColor: item.color, shadowOpacity: 0.3,
                  shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 8,
                }}>
                  <MaterialCommunityIcons name={item.icon as any} size={28} color="white" />
                </View>
                <Text style={{ fontSize: 15, fontWeight: '900', color: theme === 'dark' ? '#fff' : '#111827', marginBottom: 4 }}>
                  {item.label}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: item.color, marginRight: 6 }} />
                  <Text style={{ fontSize: 10, fontWeight: '700', color: item.color, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Tap to open
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 128 }} />
      </ScrollView>
    </View>
  );
}
