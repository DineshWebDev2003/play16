import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, TextInput, ActivityIndicator, RefreshControl, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import LogoutModal from '../../components/LogoutModal';

interface Props { navigation: { navigate: (s: string) => void; goBack: () => void } }

export default function TuitionTeacherAccountScreen({ navigation }: Props) {
  const { user, logout, updateProfile, updateAvatar, fetchData: refreshAuth } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();

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

  const cardStyle = {
    backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF',
    borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
  };

  const inputStyle = {
    backgroundColor: isDark ? '#262626' : '#F3F4F6',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 15, fontWeight: '700' as const,
    color: isDark ? '#FFF' : '#111',
    borderWidth: 1, borderColor: isDark ? '#333' : '#E5E7EB',
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFFFFF' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#F59E0B']} tintColor="#F59E0B" />}
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
                <Text style={{ color: '#F59E0B', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginLeft: 6 }}>Tuition Teacher</Text>
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
            <View style={{ borderRadius: 16, overflow: 'hidden', elevation: 15 }}>
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
                      <Text style={{ color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 }}>Tuition Profile</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 1 }}>Teaching Account</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100, flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="shield-check" size={11} color="white" />
                    <Text style={{ color: 'white', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', marginLeft: 4 }}>Verified</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 12 }}>
                  <Text style={{ color: 'white', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 }} numberOfLines={1}>{user?.name || 'Tuition Teacher'}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700', marginTop: 3 }}>{user?.email || 'Not provided'}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="at" size={12} color="white" />
                      <Text style={{ color: 'white', fontSize: 10, fontWeight: '900', marginLeft: 5 }}>@{user?.username || 'tuition_teacher'}</Text>
                    </View>
                  </View>
                </View>
                <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
                  <MaterialCommunityIcons name="share-variant" size={90} color="white" />
                </View>
              </LinearGradient>
            </View>
          </View>

          {/* ── Account Settings ── */}
          <View style={{ paddingVertical: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', letterSpacing: -0.5, color: isDark ? '#FFFFFF' : '#111827' }}>Account Settings ⚙️</Text>
              <View style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)' }}>
                <Text style={{ color: '#8B5CF6', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Management</Text>
              </View>
            </View>

            <View style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF', borderWidth: 1, borderColor: isDark ? '#262626' : '#F3F4F6' }}>
              {[
                { id: 'profile', icon: 'account-cog', title: 'Edit Profile', subtitle: 'Update email & phone number', iconColor: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.15)' },
                { id: 'password', icon: 'lock-reset', title: 'Change Password', subtitle: 'Update your login password', iconColor: '#10B981', bgColor: 'rgba(16, 185, 129, 0.15)' },
              ].map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: index === 0 ? 1 : 0, borderBottomColor: isDark ? '#262626' : '#F3F4F6' }}
                  onPress={() => setEditSection(editSection === item.id as any ? 'none' : item.id as any)}
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
                    <MaterialCommunityIcons name={editSection === item.id ? 'chevron-up' : 'chevron-down'} size={18} color={isDark ? '#9CA3AF' : '#6B7280'} opacity={0.7} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {editSection === 'profile' && (
            <View style={{ paddingVertical: 8 }}>
              <View style={cardStyle}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                  <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <MaterialCommunityIcons name="account-cog" size={22} color="#F59E0B" />
                  </View>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: isDark ? '#FFF' : '#111' }}>Edit Profile</Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 1 }}>Email & phone number</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: 6 }}>Email</Text>
                <TextInput style={{ ...inputStyle, marginBottom: 12 }} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" />
                <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: 6 }}>Phone</Text>
                <TextInput style={{ ...inputStyle, marginBottom: 16 }} value={phone} onChangeText={setPhone} placeholder="Phone" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" />
                <TouchableOpacity onPress={handleSaveProfile} disabled={saving} activeOpacity={0.7} style={{ paddingVertical: 15, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', backgroundColor: '#F59E0B' }}>
                  {saving ? <ActivityIndicator size="small" color="#92400E" /> : <><MaterialCommunityIcons name="content-save" size={18} color="#92400E" /><Text style={{ color: '#92400E', fontWeight: '900', fontSize: 14, marginLeft: 8 }}>Save Changes</Text></>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {editSection === 'password' && (
            <View style={{ paddingVertical: 8 }}>
              <View style={cardStyle}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                  <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <MaterialCommunityIcons name="lock" size={22} color="#10B981" />
                  </View>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: isDark ? '#FFF' : '#111' }}>Change Password</Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 1 }}>Update your login password</Text>
                  </View>
                </View>
                <TextInput style={{ ...inputStyle, marginBottom: 12 }} value={currentPassword} onChangeText={setCurrentPassword} placeholder="Current password" placeholderTextColor="#9CA3AF" secureTextEntry />
                <TextInput style={{ ...inputStyle, marginBottom: 12 }} value={newPassword} onChangeText={setNewPassword} placeholder="New password (min 6 chars)" placeholderTextColor="#9CA3AF" secureTextEntry />
                <TextInput style={{ ...inputStyle, marginBottom: 16 }} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter new password" placeholderTextColor="#9CA3AF" secureTextEntry />
                <TouchableOpacity onPress={handleChangePassword} disabled={saving} activeOpacity={0.7} style={{ paddingVertical: 15, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', backgroundColor: '#F59E0B' }}>
                  {saving ? <ActivityIndicator size="small" color="#92400E" /> : <><MaterialCommunityIcons name="shield-key" size={18} color="#92400E" /><Text style={{ color: '#92400E', fontWeight: '900', fontSize: 14, marginLeft: 8 }}>Update Password</Text></>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── More ── */}
          <View style={{ paddingVertical: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', letterSpacing: -0.5, color: isDark ? '#FFFFFF' : '#111827' }}>More ⚙️</Text>
              <View style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)' }}>
                <Text style={{ color: '#8B5CF6', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Info</Text>
              </View>
            </View>

            <View style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF', borderWidth: 1, borderColor: isDark ? '#262626' : '#F3F4F6' }}>
              {[
                { id: 'about', icon: 'information-outline', title: 'About', subtitle: 'App version & details', iconColor: '#EC4899', bgColor: 'rgba(236, 72, 153, 0.15)', action: () => Linking.openURL('https://tnhappykids.in') },
                { id: 'help', icon: 'help-circle-outline', title: 'Help & Support', subtitle: 'Get assistance', iconColor: '#10B981', bgColor: 'rgba(16, 185, 129, 0.15)', action: () => Alert.alert('Contact Support', 'Email: support@tnhappykids.in\nPhone: +91-1234567890') },
                { id: 'privacy', icon: 'shield-account-outline', title: 'Privacy Policy', subtitle: 'Data protection & privacy', iconColor: '#6366F1', bgColor: 'rgba(99, 102, 241, 0.15)', action: () => Linking.openURL('https://tnhappykids.in/privacy') },
              ].map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: index !== 2 ? 1 : 0, borderBottomColor: isDark ? '#262626' : '#F3F4F6' }}
                  onPress={item.action}
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
          </View>

          {/* Sign Out */}
          <View style={{ paddingVertical: 8 }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setShowLogoutModal(true)}
              style={{ borderRadius: 16, overflow: 'hidden', elevation: 15 }}
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
