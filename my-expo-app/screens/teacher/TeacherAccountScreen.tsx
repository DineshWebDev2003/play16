import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, Linking, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import LogoutModal from '../../components/LogoutModal';


interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface TeacherAccountScreenProps {
  navigation: NavigationProps;
}

export default function TeacherAccountScreen({ navigation }: TeacherAccountScreenProps) {
  const { user, logout, updateAvatar, fetchData: refreshAuth } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshAuth();
    setIsRefreshing(false);
  }, [refreshAuth]);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const menuItems = [
    { id: 'profile', title: 'Profile Settings', subtitle: 'Update your profile information', icon: 'account-cog', iconColor: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.15)' },
    { id: 'notifications', title: 'Notifications', subtitle: 'Manage notification settings', icon: 'bell-outline', iconColor: '#F59E0B', bgColor: 'rgba(244, 114, 182, 0.15)' },
    { id: 'settings', title: 'App Settings', subtitle: 'Configure app preferences', icon: 'cog-outline', iconColor: '#6366F1', bgColor: 'rgba(99, 102, 241, 0.15)' },
    { id: 'support', title: 'Support & Help', subtitle: 'Get help and contact support', icon: 'help-circle-outline', iconColor: '#10B981', bgColor: 'rgba(16, 185, 129, 0.15)' },
    { id: 'about', title: 'About', subtitle: 'App version and information', icon: 'information-outline', iconColor: '#EC4899', bgColor: 'rgba(236, 72, 153, 0.15)' },
  ];

  const handleLogout = () => setShowLogoutModal(true);

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFFFFF' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#F59E0B']} tintColor="#F59E0B" />
        }
      >
        <View style={{ paddingTop: Math.max(insets.top, 50), paddingHorizontal: 24, paddingBottom: 24 }}>
          {/* ── Modern Header (matches Home) ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: isDark ? '#D1D5DB' : '#6B7280' }}>
                TN HAPPYKIDS
              </Text>
              <Text style={{ fontSize: 30, fontWeight: '900', letterSpacing: -0.5, marginTop: 4, color: isDark ? '#FFFFFF' : '#111827' }}>
                {user?.name?.split(' ')[0] || 'Teacher'}
              </Text>
              <View style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100, marginTop: 12, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.1)', flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="star-circle" size={12} color="#F59E0B" />
                <Text style={{ color: '#F59E0B', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginLeft: 6 }}>Faculty Console</Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={updateAvatar}
              style={{ backgroundColor: '#FDE047', width: 80, height: 80, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: isDark ? '#333' : '#FFFFFF', transform: [{ rotate: '3deg' }], overflow: 'hidden' }}
            >
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <MaterialCommunityIcons name="account-tie" size={36} color="#92400E" />
              )}
              <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: '#7C3AED', padding: 4, borderRadius: 10, borderWidth: 2, borderColor: '#FFFFFF' }}>
                <MaterialCommunityIcons name="camera" size={12} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Profile Hero Card (cyan gradient) ── */}
          <View style={{ paddingVertical: 8 }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('profile')}
              style={{ borderRadius: 16, overflow: 'hidden', elevation: 15 }}
            >
              <LinearGradient
                colors={isDark ? ['#0E7490', '#155E75'] : ['#06B6D4', '#0891B2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 16 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <MaterialCommunityIcons name="account-tie" size={20} color="white" />
                    </View>
                    <View>
                      <Text style={{ color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 }}>Teacher Profile</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 1 }}>Identity & Credentials</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100, flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="shield-check" size={11} color="white" />
                    <Text style={{ color: 'white', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', marginLeft: 4 }}>Verified</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 12 }}>
                  <Text style={{ color: 'white', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 }} numberOfLines={1}>{user?.name || 'Teacher'}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700', marginTop: 3 }}>{user?.email || 'Not provided'}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="card-account-details-outline" size={12} color="white" />
                      <Text style={{ color: 'white', fontSize: 10, fontWeight: '900', marginLeft: 5 }}>{user?.teacherId || '#T-001'}</Text>
                    </View>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
                  <MaterialCommunityIcons name="chevron-right" size={12} color="rgba(255,255,255,0.5)" />
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 6 }}>Open Profile</Text>
                </View>
                <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
                  <MaterialCommunityIcons name="share-variant" size={90} color="white" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ── Settings & Tools ── */}
          <View style={{ paddingVertical: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', letterSpacing: -0.5, color: isDark ? '#FFFFFF' : '#111827' }}>Settings & Tools ⚙️</Text>
              <View style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)' }}>
                <Text style={{ color: '#8B5CF6', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Management</Text>
              </View>
            </View>

            <View style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF', borderWidth: 1, borderColor: isDark ? '#262626' : '#F3F4F6' }}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: index !== menuItems.length - 1 ? 1 : 0, borderBottomColor: isDark ? '#262626' : '#F3F4F6' }}
                  onPress={() => {
                    if (item.id === 'profile') {
                      navigation.navigate('profile');
                    } else if (item.id === 'notifications') {
                      navigation.navigate('notificationSettings');
                    } else if (item.id === 'about') {
                      Linking.openURL('https://tnhappykids.in').catch(err => Alert.alert('Error', 'Could not open website'));
                    } else {
                      Alert.alert('Coming Soon', `${item.title} screen is coming soon! ✨`);
                    }
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={{ backgroundColor: isDark ? '#262626' : item.bgColor, padding: 12, borderRadius: 14, marginRight: 14 }}>
                      <MaterialCommunityIcons name={item.icon as any} size={22} color={item.iconColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '900', letterSpacing: -0.3, color: isDark ? '#FFFFFF' : '#111827' }}>{item.title}</Text>
                      <Text style={{ fontSize: 11, fontWeight: '700', opacity: 0.6, marginTop: 1, color: isDark ? '#D1D5DB' : '#6B7280' }}>{item.subtitle}</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB', width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name="chevron-right" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} opacity={0.5} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sign Out */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleLogout}
              style={{ borderRadius: 16, overflow: 'hidden', elevation: 15, marginTop: 20 }}
            >
              <LinearGradient
                colors={['#EF4444', '#B91C1C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
              >
                <MaterialCommunityIcons name="power" size={24} color="white" />
                <Text style={{ color: 'white', fontWeight: '900', fontSize: 18, marginLeft: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Secure Sign Out</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={{ height: 96 }} />
        </View>
      </ScrollView>
      <LogoutModal visible={showLogoutModal} onConfirm={logout} onCancel={() => setShowLogoutModal(false)} />
    </View>
  );
}
