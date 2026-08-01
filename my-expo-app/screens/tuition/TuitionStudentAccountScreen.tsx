import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Image, Linking, TextInput, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import LogoutModal from '../../components/LogoutModal';

interface Props { navigation: { navigate: (s: string) => void; goBack: () => void } }

export default function TuitionStudentAccountScreen({ navigation }: Props) {
  const { user, logout, updateProfile, updateAvatar } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();

  const [showLogout, setShowLogout] = useState(false);
  const [showEditCard, setShowEditCard] = useState(false);
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
    backgroundColor: isDark ? '#262626' : '#F3F4F6',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, fontWeight: '700' as const,
    color: isDark ? '#FFF' : '#111',
    borderWidth: 1, borderColor: isDark ? '#333' : '#E5E7EB',
  };

  const cardStyle = {
    backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF',
    borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
  };

  const menuItems = [
    { id: 'phone', title: 'Phone', subtitle: 'Contact number', icon: 'phone', iconColor: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.15)', value: user?.phone || 'Not provided' },
    { id: 'studentId', title: 'Student ID', subtitle: 'Admission number', icon: 'school', iconColor: '#8B5CF6', bgColor: 'rgba(139, 92, 246, 0.15)', value: user?.studentId || 'N/A' },
    { id: 'support', title: 'Support & Help', subtitle: 'Get help and contact support', icon: 'help-circle-outline', iconColor: '#10B981', bgColor: 'rgba(16, 185, 129, 0.15)', value: null },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFFFFF' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={{ paddingTop: Math.max(insets.top, 50), paddingHorizontal: 24, paddingBottom: 24 }}>
          {/* ── Modern Header (matches Home) ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: isDark ? '#D1D5DB' : '#6B7280' }}>
                TN HAPPYKIDS
              </Text>
              <Text style={{ fontSize: 30, fontWeight: '900', letterSpacing: -0.5, marginTop: 4, color: isDark ? '#FFFFFF' : '#111827' }}>
                {user?.name?.split(' ')[0] || 'Student'}
              </Text>
              <View style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100, marginTop: 12, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.1)', flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="school" size={12} color="#F59E0B" />
                <Text style={{ color: '#F59E0B', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginLeft: 6 }}>Tuition Student</Text>
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
                <MaterialCommunityIcons name="account" size={36} color="#92400E" />
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
              onPress={() => setShowEditCard(!showEditCard)}
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
                      <MaterialCommunityIcons name="school" size={20} color="white" />
                    </View>
                    <View>
                      <Text style={{ color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 }}>Student Profile</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 1 }}>Learning Account</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100, flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="shield-check" size={11} color="white" />
                    <Text style={{ color: 'white', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', marginLeft: 4 }}>Verified</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 12 }}>
                  <Text style={{ color: 'white', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 }} numberOfLines={1}>{user?.name || 'Tuition Student'}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700', marginTop: 3 }}>{user?.email || 'Not provided'}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
                      <MaterialCommunityIcons name="school" size={12} color="white" />
                      <Text style={{ color: 'white', fontSize: 10, fontWeight: '900', marginLeft: 5 }}>{user?.studentId || 'N/A'}</Text>
                    </View>
                    {!!user?.phone && (
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialCommunityIcons name="phone" size={12} color="white" />
                        <Text style={{ color: 'white', fontSize: 10, fontWeight: '900', marginLeft: 5 }}>{user.phone}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
                  <MaterialCommunityIcons name={showEditCard ? 'chevron-up' : 'chevron-down'} size={12} color="rgba(255,255,255,0.5)" />
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 6 }}>
                    {showEditCard ? 'Hide Details' : 'Edit Profile'}
                  </Text>
                </View>
                <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
                  <MaterialCommunityIcons name="share-variant" size={90} color="white" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {showEditCard && (
            <View style={{ paddingVertical: 8 }}>
              {/* Name */}
              <View style={cardStyle}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <MaterialCommunityIcons name="account" size={22} color="#F59E0B" />
                    </View>
                    <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: isDark ? '#9CA3AF' : '#6B7280' }}>Full Name</Text>
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
                      <MaterialCommunityIcons name="close" size={22} color={isDark ? '#FFF' : '#111'} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={{ fontSize: 20, fontWeight: '900', color: isDark ? '#FFF' : '#111', marginTop: 4 }}>{user?.name || 'Tuition Student'}</Text>
                )}
              </View>

              {/* Email */}
              <View style={[cardStyle, { marginTop: 12 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <MaterialCommunityIcons name="email" size={22} color="#6366F1" />
                    </View>
                    <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: isDark ? '#9CA3AF' : '#6B7280' }}>Email</Text>
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
                      <MaterialCommunityIcons name="close" size={22} color={isDark ? '#FFF' : '#111'} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#FFF' : '#111', marginTop: 4 }}>{user?.email || 'Not provided'}</Text>
                )}
              </View>

              {/* Password */}
              <View style={[cardStyle, { marginTop: 12 }]}>
                <TouchableOpacity onPress={() => setShowPasswordForm(!showPasswordForm)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
            </View>
          )}

          {/* ── Account Info & More ── */}
          <View style={{ paddingVertical: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', letterSpacing: -0.5, color: isDark ? '#FFFFFF' : '#111827' }}>Account Info ⚙️</Text>
              <View style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)' }}>
                <Text style={{ color: '#8B5CF6', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Details</Text>
              </View>
            </View>

            <View style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF', borderWidth: 1, borderColor: isDark ? '#262626' : '#F3F4F6' }}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  disabled={item.id !== 'support'}
                  style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: index !== menuItems.length - 1 ? 1 : 0, borderBottomColor: isDark ? '#262626' : '#F3F4F6' }}
                  onPress={() => {
                    if (item.id === 'support') {
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
                  {item.id === 'support' ? (
                    <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB', width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialCommunityIcons name="chevron-right" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} opacity={0.5} />
                    </View>
                  ) : (
                    <Text style={{ fontSize: 14, fontWeight: '900', color: isDark ? '#D1D5DB' : '#6B7280' }} numberOfLines={1}>{item.value}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sign Out */}
          <View style={{ paddingVertical: 8 }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setShowLogout(true)}
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
      <LogoutModal visible={showLogout} onConfirm={logout} onCancel={() => setShowLogout(false)} />
    </View>
  );
}
