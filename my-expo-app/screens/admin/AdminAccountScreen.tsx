import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, Linking, TextInput, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import LogoutModal from '../../components/LogoutModal';


interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface AdminAccountScreenProps {
  navigation: NavigationProps;
}

export default function AdminAccountScreen({ navigation }: AdminAccountScreenProps) {
  const { user, logout, updateAvatar, updateProfile } = useAuth();
  const { theme, colors } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [email, setEmail] = useState(user?.email || '');
  const [savingEmail, setSavingEmail] = useState(false);
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

  const handleSaveEmail = async () => {
    if (!email.trim()) return;
    setSavingEmail(true);
    const ok = await updateProfile({ email: email.trim() });
    setSavingEmail(false);
    if (ok) setEditingEmail(false);
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
    backgroundColor: theme === 'dark' ? '#262626' : '#F3F4F6',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, fontWeight: '700' as const,
    color: theme === 'dark' ? '#FFF' : '#111',
    borderWidth: 1, borderColor: theme === 'dark' ? '#333' : '#E5E7EB',
  };

  const cardStyle = {
    backgroundColor: theme === 'dark' ? '#1e1e1e' : '#FFFFFF',
    borderRadius: 32, padding: 20,
    borderWidth: 1, borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
  };

  const menuItems = [
    {
      id: 'profile',
      title: 'Profile Settings',
      subtitle: 'Update your profile information',
      icon: 'account-cog',
      iconColor: '#F59E0B', // Amber
      bgColor: 'rgba(245, 158, 11, 0.15)',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Manage notification settings',
      icon: 'bell-outline',
      iconColor: '#F59E0B', // Pink
      bgColor: 'rgba(244, 114, 182, 0.15)',
    },
    {
      id: 'settings',
      title: 'App Settings',
      subtitle: 'Configure app preferences',
      icon: 'cog-outline',
      iconColor: '#6366F1', // Indigo
      bgColor: 'rgba(99, 102, 241, 0.15)',
    },
    {
      id: 'support',
      title: 'Support & Help',
      subtitle: 'Get help and contact support',
      icon: 'help-circle-outline',
      iconColor: '#10B981', // Green
      bgColor: 'rgba(16, 185, 129, 0.15)',
    },
    {
      id: 'about',
      title: 'About',
      subtitle: 'App version and information',
      icon: 'information-outline',
      iconColor: '#EC4899', // Pinkish
      bgColor: 'rgba(236, 72, 153, 0.15)',
    },
  ];

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const insets = useSafeAreaInsets();

  return (
    <View 
        className={`flex-1 ${theme === 'dark' ? 'bg-[#1c1c14]' : 'bg-white'}`}
        style={{ backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF' }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>


      {/* Header */}
      <View style={{ paddingTop: Math.max(insets.top, 20) }} className="px-6 pb-6">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className={`text-xl font-black ${colors.textSecondary} uppercase tracking-[3px]`}>
              Admin Hub 🔐
            </Text>
            <View className="flex-row items-center mt-1">
              <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>
                 {user?.name || 'Admin'}
              </Text>
            </View>
            <View className="bg-brand-violet/20 self-start px-4 py-1.5 rounded-full mt-3 border border-brand-violet/10 shadow-sm flex-row items-center">
                <MaterialCommunityIcons name="shield-check" size={12} color="#F59E0B" />
                <Text className="text-brand-violet text-[9px] font-black uppercase tracking-[2px] ml-1.5">System Administrator</Text>
            </View>
          </View>
          <TouchableOpacity 
            className="bg-brand-yellow w-24 h-24 rounded-[36px] items-center justify-center shadow-2xl border-4 border-white rotate-3 relative overflow-hidden"
            onPress={updateAvatar}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <MaterialCommunityIcons name="shield-account-outline" size={48} color="#92400E" />
            )}
            <View className="absolute -bottom-1 -right-1 bg-brand-violet p-2 rounded-xl border-2 border-white">
              <MaterialCommunityIcons name="camera" size={14} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Profile Card */}
      <View className="px-6 py-4">
        <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => setShowProfileForm(!showProfileForm)}
            className="rounded-[40px] overflow-hidden shadow-2xl"
            style={{ elevation: 25 }}
        >
            <LinearGradient
                colors={theme === 'dark' ? ['#0f172a', '#1e293b'] : ['#FFFFFF', '#F9FAFB']}
                className={`p-8 border ${theme === 'dark' ? 'border-white/10' : 'border-gray-50'}`}
            >
                <View className="flex-row items-center">
                    <View className="bg-brand-violet/10 p-5 rounded-3xl mr-5">
                        <MaterialCommunityIcons name="security" size={36} color="#F59E0B" />
                    </View>
                    <View className="flex-1">
                        <View className="mb-2">
                             <Text className="text-brand-violet text-[9px] font-black uppercase tracking-widest leading-3">Security Level: High</Text>
                        </View>
                        <Text className={`text-2xl font-black ${colors.text} tracking-tight`}>{user?.name || 'Administrator'}</Text>
                        <Text className={`text-sm ${colors.textSecondary} font-bold opacity-70`}>{user?.email || 'Not provided'}</Text>
                        <View className={`${theme === 'dark' ? 'bg-brand-yellow/10 border-brand-yellow/20' : 'bg-brand-yellow/20 border-brand-yellow/10'} px-4 py-1.5 rounded-full self-start mt-3 border`}>
                            <Text className={`${theme === 'dark' ? 'text-brand-yellow' : 'text-amber-900'} text-[10px] font-black uppercase tracking-widest`}>Verified Badge</Text>
                        </View>
                    </View>
                    <MaterialCommunityIcons name={showProfileForm ? 'chevron-up' : 'chevron-right'} size={24} color="#F59E0B" />
                </View>
                <View className="absolute -bottom-10 -right-10 opacity-5">
                    <MaterialCommunityIcons name="key-chain-variant" size={120} color={colors.text} />
                </View>
            </LinearGradient>
        </TouchableOpacity>

        {showProfileForm && (
          <View style={{ marginTop: 12 }}>
            {/* Name */}
            <View style={cardStyle}>
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <MaterialCommunityIcons name="account" size={22} color="#F59E0B" />
                  </View>
                  <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>Full Name</Text>
                </View>
                {!editingName && (
                  <TouchableOpacity onPress={() => { setEditingName(true); setName(user?.name || ''); }}>
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
                    <MaterialCommunityIcons name="close" size={22} color={theme === 'dark' ? '#FFF' : '#111'} />
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={{ fontSize: 20, fontWeight: '900', color: theme === 'dark' ? '#FFF' : '#111', marginTop: 4 }}>{user?.name || 'Admin'}</Text>
              )}
            </View>

            {/* Email */}
            <View style={[cardStyle, { marginTop: 12 }]}>
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <View style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <MaterialCommunityIcons name="email" size={22} color="#6366F1" />
                  </View>
                  <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>Email</Text>
                </View>
                {!editingEmail && (
                  <TouchableOpacity onPress={() => { setEditingEmail(true); setEmail(user?.email || ''); }}>
                    <MaterialCommunityIcons name="pencil" size={18} color="#6366F1" />
                  </TouchableOpacity>
                )}
              </View>
              {editingEmail ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput value={email} onChangeText={setEmail} style={{ ...inputStyle, flex: 1, fontSize: 16 }} autoFocus placeholder="Enter email" placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" />
                  <TouchableOpacity onPress={handleSaveEmail} disabled={savingEmail} style={{ backgroundColor: '#6366F1', width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}>
                    {savingEmail ? <ActivityIndicator color="white" /> : <MaterialCommunityIcons name="check" size={22} color="white" />}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setEditingEmail(false); setEmail(user?.email || ''); }} style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginLeft: 4 }}>
                    <MaterialCommunityIcons name="close" size={22} color={theme === 'dark' ? '#FFF' : '#111'} />
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={{ fontSize: 16, fontWeight: '700', color: theme === 'dark' ? '#FFF' : '#111', marginTop: 4 }}>{user?.email || 'Not provided'}</Text>
              )}
            </View>

            {/* Password */}
            <View style={[cardStyle, { marginTop: 12 }]}>
              <TouchableOpacity onPress={() => setShowPasswordForm(!showPasswordForm)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View className="flex-row items-center">
                  <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <MaterialCommunityIcons name="lock" size={22} color="#10B981" />
                  </View>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: theme === 'dark' ? '#FFF' : '#111' }}>Password</Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginTop: 2 }}>Update your login credentials</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name={showPasswordForm ? 'chevron-up' : 'chevron-down'} size={22} color={theme === 'dark' ? '#FFF' : '#111'} />
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
          </View>
        )}
      </View>

      {/* Menu Options Hub */}
      <View className="flex-1 px-6 py-8">
        <View className="flex-row items-center justify-between mb-6 px-1">
            <Text className={`text-xl font-black ${colors.text} tracking-tighter`}>Settings & Controls ✨</Text>
            <View className="bg-brand-violet/10 px-3 py-1 rounded-full">
                <Text className="text-brand-violet text-[9px] font-black uppercase tracking-widest">Management</Text>
            </View>
        </View>

        <View 
          className="rounded-[40px] overflow-hidden border shadow-2xl"
          style={{ 
            backgroundColor: theme === 'dark' ? '#1e1e1e' : '#FFFFFF',
            borderColor: theme === 'dark' ? '#262626' : '#F3F4F6'
          }}
        >
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              className={`p-5 flex-row items-center justify-between ${index !== menuItems.length - 1 ? 'border-b' : ''}`}
              style={{ borderBottomColor: theme === 'dark' ? '#262626' : '#F3F4F6' }}
              onPress={() => {
                if (item.id === 'profile') {
                  setShowProfileForm(!showProfileForm);
                } else if (item.id === 'notifications') {
                  navigation.navigate('notificationSettings');
                } else if (item.id === 'about') {
                  Linking.openURL('https://tnhappykids.in').catch(err => 
                    Alert.alert('Error', 'Could not open website')
                  );
                } else if (item.id === 'settings') {
                  navigation.navigate('settings');
                } else if (item.id === 'backup') {
                    navigation.navigate('backup');
                } else {
                  console.log(`Navigate to ${item.id}`);
                  Alert.alert('Coming Soon', `${item.title} screen is coming soon! ✨`);
                }
              }}
            >
              <View className="flex-row items-center flex-1">
                <View 
                  className={`p-3.5 rounded-[22px] mr-4 shadow-sm relative overflow-hidden`}
                  style={{ 
                    backgroundColor: theme === 'dark' ? '#262626' : item.bgColor,
                  }}
                >
                  <MaterialCommunityIcons 
                    name={item.icon as any} 
                    size={22} 
                    color={item.iconColor} 
                  />
                </View>
                <View className="flex-1">
                  <Text className={`text-base font-black ${colors.text} tracking-tight`}>{item.title}</Text>
                  <Text className={`text-[11px] ${colors.textSecondary} font-bold opacity-60 mt-0.5`}>{item.subtitle}</Text>
                </View>
              </View>

              <View 
                className="w-8 h-8 rounded-xl items-center justify-center"
                style={{ backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#F9FAFB' }}
              >
                <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textTertiary} opacity={0.5} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
 
        {/* Sign Out Button */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleLogout}
          className="mt-8 mb-16 overflow-hidden rounded-[32px] shadow-2xl"
          style={{ elevation: 15 }}
        >
            <LinearGradient
                colors={['#EF4444', '#B91C1C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="py-6 flex-row items-center justify-center border border-red-200/20"
            >
                <MaterialCommunityIcons name="power" size={28} color="white" />
                <Text className="text-white font-black text-xl ml-3 uppercase tracking-tighter">Secure Sign Out</Text>
            </LinearGradient>
        </TouchableOpacity>
        <View className="h-32" />
      </View>
    </ScrollView>

    <LogoutModal 
      visible={showLogoutModal} 
      onConfirm={logout} 
      onCancel={() => setShowLogoutModal(false)} 
    />
    </View>
  );
}
