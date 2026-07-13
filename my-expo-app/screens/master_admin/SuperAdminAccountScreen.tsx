import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Image, Linking, Switch, TextInput, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';
import LogoutModal from '../../components/LogoutModal';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
}

export default function SuperAdminAccountScreen({ navigation }: Props) {
  const { user, logout, updateAvatar, updateProfile } = useAuth();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  const [showLogout, setShowLogout] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleSaveName = async () => {
    if (!name.trim()) return;
    setSavingName(true);
    const ok = await updateProfile({ name: name.trim() });
    setSavingName(false);
    if (ok) setEditingName(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill all password fields');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    setSavingPassword(true);
    try {
      const ok = await updateProfile({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      } as any);
      if (ok) {
        Alert.alert('Success', 'Password updated successfully');
        setShowPasswordForm(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const inputStyle = {
    backgroundColor: isDark ? '#262626' : '#F3F4F6',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, fontWeight: '700' as const,
    color: isDark ? '#FFF' : '#111',
    borderWidth: 1, borderColor: isDark ? '#333' : '#E5E7EB',
  };

  const cardStyle = {
    backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF',
    borderRadius: 32, padding: 20,
    borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFFFFF' }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className={`w-12 h-12 rounded-2xl items-center justify-center border ${colors.border} ${colors.surface}`}
            style={{ elevation: 5 }}
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
          </TouchableOpacity>
          <View className="items-center">
            <Text className={`text-2xl font-black ${colors.text} tracking-tighter`}>Profile</Text>
            <View className="bg-brand-pink/10 px-3 py-0.5 rounded-full mt-1">
              <Text className="text-brand-pink text-[9px] font-black uppercase tracking-widest">Settings</Text>
            </View>
          </View>
          <View className="w-12" />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}>
          {/* Avatar */}
          <View className="items-center mb-8">
            <TouchableOpacity
              onPress={updateAvatar}
              style={{ backgroundColor: '#FDE047', width: 100, height: 100, borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: isDark ? '#333' : '#FFF', overflow: 'hidden' }}
            >
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <MaterialCommunityIcons name="shield-crown" size={50} color="#92400E" />
              )}
              <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: '#F59E0B', padding: 6, borderRadius: 12, borderWidth: 2, borderColor: isDark ? '#333' : '#FFF' }}>
                <MaterialCommunityIcons name="camera" size={14} color="white" />
              </View>
            </TouchableOpacity>
            <View style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100, marginTop: 12, flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="shield-crown" size={12} color="#F59E0B" />
              <Text style={{ color: '#F59E0B', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginLeft: 6 }}>Master Administrator</Text>
            </View>
          </View>

          {/* Name */}
          <View style={cardStyle}>
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <MaterialCommunityIcons name="account" size={22} color="#F59E0B" />
                </View>
                <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: isDark ? '#9CA3AF' : '#6B7280' }}>Full Name</Text>
              </View>
              {!editingName && (
                <TouchableOpacity onPress={() => setEditingName(true)}>
                  <MaterialCommunityIcons name="pencil" size={18} color="#F59E0B" />
                </TouchableOpacity>
              )}
            </View>
            {editingName ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput value={name} onChangeText={setName} style={{ ...inputStyle, flex: 1, fontSize: 18 }} autoFocus placeholder="Enter name" placeholderTextColor="#9CA3AF" />
                <TouchableOpacity onPress={handleSaveName} disabled={savingName} style={{ backgroundColor: '#F59E0B', width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}>
                  {savingName ? <ActivityIndicator color="white" /> : <MaterialCommunityIcons name="check" size={22} color="white" />}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setEditingName(false); setName(user?.name || ''); }} style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginLeft: 4 }}>
                  <MaterialCommunityIcons name="close" size={22} color={isDark ? '#FFF' : '#111'} />
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={{ fontSize: 20, fontWeight: '900', color: isDark ? '#FFF' : '#111', marginTop: 4 }}>{user?.name || 'Master Admin'}</Text>
            )}
          </View>

          {/* Email */}
          <View style={[cardStyle, { marginTop: 12 }]}>
            <View className="flex-row items-center mb-2">
              <View style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <MaterialCommunityIcons name="email" size={22} color="#6366F1" />
              </View>
              <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: isDark ? '#9CA3AF' : '#6B7280' }}>Email</Text>
            </View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#FFF' : '#111', marginTop: 4 }}>{user?.email || 'Not provided'}</Text>
          </View>

          {/* Password */}
          <View style={[cardStyle, { marginTop: 12 }]}>
            <TouchableOpacity onPress={() => setShowPasswordForm(!showPasswordForm)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View className="flex-row items-center">
                <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <MaterialCommunityIcons name="lock" size={22} color="#10B981" />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: isDark ? '#FFF' : '#111' }}>Password</Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 2 }}>Update your login credentials</Text>
                </View>
              </View>
              <MaterialCommunityIcons name={showPasswordForm ? 'chevron-up' : 'chevron-down'} size={22} color={isDark ? '#FFF' : '#111'} />
            </TouchableOpacity>

            {showPasswordForm && (
              <View style={{ marginTop: 16 }}>
                <TextInput value={currentPassword} onChangeText={setCurrentPassword} placeholder="Current Password" placeholderTextColor="#9CA3AF" secureTextEntry style={{ ...inputStyle, marginBottom: 12 }} />
                <TextInput value={newPassword} onChangeText={setNewPassword} placeholder="New Password" placeholderTextColor="#9CA3AF" secureTextEntry style={{ ...inputStyle, marginBottom: 12 }} />
                <TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm New Password" placeholderTextColor="#9CA3AF" secureTextEntry style={{ ...inputStyle, marginBottom: 16 }} />
                <TouchableOpacity onPress={handleChangePassword} disabled={savingPassword} style={{ backgroundColor: '#F59E0B', paddingVertical: 16, borderRadius: 16, alignItems: 'center' }}>
                  <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>
                    {savingPassword ? 'Updating...' : 'Update Password'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Branch */}
          {user?.branch && (
            <View style={[cardStyle, { marginTop: 12 }]}>
              <View className="flex-row items-center mb-2">
                <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <MaterialCommunityIcons name="domain" size={22} color="#F59E0B" />
                </View>
                <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: isDark ? '#9CA3AF' : '#6B7280' }}>Branch</Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#FFF' : '#111', marginTop: 4 }}>{user.branch.name}</Text>
            </View>
          )}

          {/* Theme */}
          <View style={[cardStyle, { marginTop: 12 }]}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View style={{ backgroundColor: isDark ? 'rgba(129, 140, 248, 0.15)' : 'rgba(249, 115, 22, 0.15)', width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <MaterialCommunityIcons name={isDark ? 'weather-night' : 'weather-sunny'} size={22} color={isDark ? '#818CF8' : '#F97316'} />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: isDark ? '#FFF' : '#111' }}>Theme</Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 2 }}>{isDark ? 'Dark' : 'Light'} Mode</Text>
                </View>
              </View>
              <Switch value={isDark} onValueChange={() => {}} trackColor={{ false: '#D1D5DB', true: '#F59E0B' }} thumbColor="#FFF" />
            </View>
          </View>

          {/* Navigation items */}
          <TouchableOpacity
            onPress={() => navigation.navigate('notificationSettings')}
            style={[cardStyle, { marginTop: 12 }]}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <MaterialCommunityIcons name="bell-outline" size={22} color="#F59E0B" />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: isDark ? '#FFF' : '#111' }}>Notifications</Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 2 }}>Manage notification settings</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={isDark ? '#FFF' : '#111'} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('settings')}
            style={[cardStyle, { marginTop: 12 }]}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <MaterialCommunityIcons name="cog-outline" size={22} color="#6366F1" />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: isDark ? '#FFF' : '#111' }}>App Settings</Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 2 }}>Configure app preferences</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={isDark ? '#FFF' : '#111'} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Linking.openURL('https://tnhappykids.in')}
            style={[cardStyle, { marginTop: 12 }]}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <MaterialCommunityIcons name="help-circle-outline" size={22} color="#10B981" />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: isDark ? '#FFF' : '#111' }}>Support & Help</Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 2 }}>Get help and contact support</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={isDark ? '#FFF' : '#111'} />
            </View>
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            onPress={() => setShowLogout(true)}
            style={{ backgroundColor: '#EF4444', borderRadius: 32, padding: 20, marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
          >
            <MaterialCommunityIcons name="power" size={24} color="white" />
            <Text style={{ color: 'white', fontWeight: '900', fontSize: 16, marginLeft: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      <LogoutModal visible={showLogout} onConfirm={logout} onCancel={() => setShowLogout(false)} />
    </View>
  );
}
