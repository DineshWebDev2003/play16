import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, TextInput, ActivityIndicator, RefreshControl, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import LogoutModal from '../../components/LogoutModal';

interface Props { navigation: { navigate: (s: string) => void; goBack: () => void } }

export default function TuitionTeacherAccountScreen({ navigation }: Props) {
  const { user, logout, updateProfile, fetchData: refreshAuth } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editSection, setEditSection] = useState<'none' | 'profile' | 'password'>('none');

  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshAuth();
    setIsRefreshing(false);
  }, [refreshAuth]);

  const handleSaveProfile = async () => {
    if (!email.trim()) { Alert.alert('Required', 'Email is required.'); return; }
    setSaving(true);
    try {
      await updateProfile({ email: email.trim(), phone: phone.trim() });
      Alert.alert('Success', 'Profile updated.');
      setEditSection('none');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update profile.');
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) { Alert.alert('Required', 'Fill all fields.'); return; }
    if (newPassword.length < 6) { Alert.alert('Weak Password', 'Min 6 characters.'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('Mismatch', 'Passwords do not match.'); return; }
    setSaving(true);
    try {
      await updateProfile({ currentPassword, password: newPassword } as any);
      Alert.alert('Success', 'Password changed.');
      setEditSection('none');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to change password.');
    }
    setSaving(false);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#F8F6F0' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#F59E0B']} tintColor="#F59E0B" />}
      >
        <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 30, fontWeight: '900', letterSpacing: -0.5, color: isDark ? '#FFFFFF' : '#111827' }}>My</Text>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#F59E0B', marginTop: -2 }}>Profile</Text>
              <View style={{ backgroundColor: 'rgba(245,158,11,0.15)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="star-circle" size={12} color="#D97706" />
                <Text style={{ color: '#D97706', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 6 }}>Tuition Teacher</Text>
              </View>
            </View>
            <TouchableOpacity
              style={{ backgroundColor: 'rgba(245,158,11,0.2)', width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
              onPress={() => {}}
            >
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <MaterialCommunityIcons name="account-tie" size={32} color="#D97706" />
              )}
              <View style={{ position: 'absolute', bottom: -4, right: -4, backgroundColor: '#F59E0B', padding: 6, borderRadius: 8 }}>
                <MaterialCommunityIcons name="camera" size={12} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setEditSection(editSection === 'profile' ? 'none' : 'profile')}
            style={{ backgroundColor: '#F59E0B', borderRadius: 24, padding: 32 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 16, borderRadius: 16, marginRight: 20 }}>
                <MaterialCommunityIcons name="account-tie" size={32} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'white', fontSize: 24, fontWeight: '900' }}>{user?.name}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '700', marginTop: 4 }}>{user?.email || 'Not provided'}</Text>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, alignSelf: 'flex-start', marginTop: 12 }}>
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 }}>@{user?.username || 'tuition_teacher'}</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255,255,255,0.5)" />
            </View>
          </TouchableOpacity>
        </View>

        {editSection === 'profile' && (
          <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
            <View style={{ backgroundColor: isDark ? '#2a2a28' : '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: isDark ? '#3a3a38' : 'rgba(245,158,11,0.2)' }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#FFFFFF' : '#111827', marginBottom: 16 }}>Edit Profile</Text>
              <Text style={{ fontSize: 11, fontWeight: '700', marginBottom: 6, marginLeft: 4, color: isDark ? '#9CA3AF' : '#6B7280' }}>EMAIL</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#1e1e1c' : 'rgba(245,158,11,0.05)', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: isDark ? '#3a3a38' : 'rgba(245,158,11,0.2)', height: 48, marginBottom: 12 }}>
                <MaterialCommunityIcons name="email" size={18} color="#D97706" />
                <TextInput style={{ flex: 1, fontWeight: '700', fontSize: 14, marginLeft: 10, color: isDark ? '#FFFFFF' : '#111827' }}
                  value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" />
              </View>
              <Text style={{ fontSize: 11, fontWeight: '700', marginBottom: 6, marginLeft: 4, color: isDark ? '#9CA3AF' : '#6B7280' }}>PHONE</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#1e1e1c' : 'rgba(245,158,11,0.05)', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: isDark ? '#3a3a38' : 'rgba(245,158,11,0.2)', height: 48, marginBottom: 16 }}>
                <MaterialCommunityIcons name="phone" size={18} color="#D97706" />
                <TextInput style={{ flex: 1, fontWeight: '700', fontSize: 14, marginLeft: 10, color: isDark ? '#FFFFFF' : '#111827' }}
                  value={phone} onChangeText={setPhone} placeholder="Phone" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" />
              </View>
              <TouchableOpacity onPress={handleSaveProfile} disabled={saving}
                style={{ paddingVertical: 14, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', backgroundColor: '#F59E0B' }} activeOpacity={0.7}>
                {saving ? <ActivityIndicator size="small" color="#92400E" /> : <><MaterialCommunityIcons name="content-save" size={18} color="#92400E" /><Text style={{ color: '#92400E', fontWeight: '900', fontSize: 14, marginLeft: 8 }}>Save Changes</Text></>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#D1D5DB' : '#374151', marginBottom: 16, paddingHorizontal: 4 }}>Account Settings</Text>
          <View style={{ backgroundColor: isDark ? '#2a2a28' : '#FFFFFF', borderRadius: 24, overflow: 'hidden' }}>
            {[
              { id: 'profile', icon: 'account-cog', title: 'Edit Profile', subtitle: 'Update email & phone number' },
              { id: 'password', icon: 'lock-reset', title: 'Change Password', subtitle: 'Update your login password' },
            ].map((item, index) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: index === 0 ? 1 : 0, borderBottomColor: isDark ? '#3a3a38' : '#F3F4F6' }}
                onPress={() => setEditSection(editSection === item.id as any ? 'none' : item.id as any)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={{ backgroundColor: isDark ? '#1e1e1c' : '#F3F4F6', padding: 12, borderRadius: 16, marginRight: 16 }}>
                    <MaterialCommunityIcons name={item.icon as any} size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#FFFFFF' : '#111827' }}>{item.title}</Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 2 }}>{item.subtitle}</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name={editSection === item.id ? 'chevron-up' : 'chevron-down'} size={18} color={isDark ? '#6B7280' : '#D1D5DB'} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {editSection === 'password' && (
          <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
            <View style={{ backgroundColor: isDark ? '#2a2a28' : '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: isDark ? '#3a3a38' : 'rgba(245,158,11,0.2)' }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#FFFFFF' : '#111827', marginBottom: 16 }}>Change Password</Text>
              <Text style={{ fontSize: 11, fontWeight: '700', marginBottom: 6, marginLeft: 4, color: isDark ? '#9CA3AF' : '#6B7280' }}>CURRENT PASSWORD</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#1e1e1c' : 'rgba(245,158,11,0.05)', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: isDark ? '#3a3a38' : 'rgba(245,158,11,0.2)', height: 48, marginBottom: 12 }}>
                <MaterialCommunityIcons name="lock" size={18} color="#D97706" />
                <TextInput style={{ flex: 1, fontWeight: '700', fontSize: 14, marginLeft: 10, color: isDark ? '#FFFFFF' : '#111827' }}
                  value={currentPassword} onChangeText={setCurrentPassword} placeholder="Current password" placeholderTextColor="#9CA3AF" secureTextEntry />
              </View>
              <Text style={{ fontSize: 11, fontWeight: '700', marginBottom: 6, marginLeft: 4, color: isDark ? '#9CA3AF' : '#6B7280' }}>NEW PASSWORD</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#1e1e1c' : 'rgba(245,158,11,0.05)', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: isDark ? '#3a3a38' : 'rgba(245,158,11,0.2)', height: 48, marginBottom: 12 }}>
                <MaterialCommunityIcons name="lock-plus" size={18} color="#D97706" />
                <TextInput style={{ flex: 1, fontWeight: '700', fontSize: 14, marginLeft: 10, color: isDark ? '#FFFFFF' : '#111827' }}
                  value={newPassword} onChangeText={setNewPassword} placeholder="New password (min 6 chars)" placeholderTextColor="#9CA3AF" secureTextEntry />
              </View>
              <Text style={{ fontSize: 11, fontWeight: '700', marginBottom: 6, marginLeft: 4, color: isDark ? '#9CA3AF' : '#6B7280' }}>CONFIRM PASSWORD</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#1e1e1c' : 'rgba(245,158,11,0.05)', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: isDark ? '#3a3a38' : 'rgba(245,158,11,0.2)', height: 48, marginBottom: 16 }}>
                <MaterialCommunityIcons name="lock-check" size={18} color="#D97706" />
                <TextInput style={{ flex: 1, fontWeight: '700', fontSize: 14, marginLeft: 10, color: isDark ? '#FFFFFF' : '#111827' }}
                  value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter new password" placeholderTextColor="#9CA3AF" secureTextEntry />
              </View>
              <TouchableOpacity onPress={handleChangePassword} disabled={saving}
                style={{ paddingVertical: 14, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', backgroundColor: '#F59E0B' }} activeOpacity={0.7}>
                {saving ? <ActivityIndicator size="small" color="#92400E" /> : <><MaterialCommunityIcons name="shield-key" size={18} color="#92400E" /><Text style={{ color: '#92400E', fontWeight: '900', fontSize: 14, marginLeft: 8 }}>Update Password</Text></>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#D1D5DB' : '#374151', marginBottom: 16, paddingHorizontal: 4 }}>More</Text>
          <View style={{ backgroundColor: isDark ? '#2a2a28' : '#FFFFFF', borderRadius: 24, overflow: 'hidden' }}>
            {[
              { id: 'about', icon: 'information-outline', title: 'About', subtitle: 'App version & details', action: () => Linking.openURL('https://tnhappykids.in') },
              { id: 'help', icon: 'help-circle-outline', title: 'Help & Support', subtitle: 'Get assistance', action: () => Alert.alert('Contact Support', 'Email: support@tnhappykids.in\nPhone: +91-1234567890') },
              { id: 'privacy', icon: 'shield-account-outline', title: 'Privacy Policy', subtitle: 'Data protection & privacy', action: () => Linking.openURL('https://tnhappykids.in/privacy') },
            ].map((item, index) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: index !== 2 ? 1 : 0, borderBottomColor: isDark ? '#3a3a38' : '#F3F4F6' }}
                onPress={item.action}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={{ backgroundColor: isDark ? '#1e1e1c' : '#F3F4F6', padding: 12, borderRadius: 16, marginRight: 16 }}>
                    <MaterialCommunityIcons name={item.icon as any} size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#FFFFFF' : '#111827' }}>{item.title}</Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 2 }}>{item.subtitle}</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color={isDark ? '#6B7280' : '#D1D5DB'} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setShowLogoutModal(true)}
            style={{ backgroundColor: '#EF4444', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
          >
            <MaterialCommunityIcons name="power" size={20} color="white" />
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 16, marginLeft: 12 }}>Sign Out</Text>
          </TouchableOpacity>
          <View style={{ height: 128 }} />
        </View>
      </ScrollView>
      <LogoutModal visible={showLogoutModal} onConfirm={logout} onCancel={() => setShowLogoutModal(false)} />
    </SafeAreaView>
  );
}
