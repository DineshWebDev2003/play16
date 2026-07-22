import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, Image, TextInput, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface SettingsScreenProps {
  navigation: NavigationProps;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { user, updateNotificationSettings, updateBranchSettings, branches } = useAuth() as any;
  const { colors, theme, toggleTheme } = useTheme();
  
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);

  const pushEnabled = user?.notification_settings?.enabled ?? true;

  const isAdminOrMaster = user?.role === 'admin' || user?.role === 'master_admin';

  const currentBranch = branches?.find((b: any) => b.id === user?.branch_id);

  const [correspondentPhone, setCorrespondentPhone] = useState('');
  const [schoolOfficePhone, setSchoolOfficePhone] = useState('');
  const [savingContact, setSavingContact] = useState(false);

  useEffect(() => {
    if (currentBranch?.settings) {
      setCorrespondentPhone(currentBranch.settings.correspondent_phone || '');
      setSchoolOfficePhone(currentBranch.settings.school_office_phone || '');
    }
  }, [currentBranch]);

  const handlePushToggle = async () => {
    const newSettings = {
      ...user?.notification_settings,
      enabled: !pushEnabled
    };
    await updateNotificationSettings(newSettings);
  };

  const handleSaveContactSettings = async () => {
    if (!currentBranch) {
      Alert.alert('Error', 'No branch associated with your account.');
      return;
    }
    setSavingContact(true);
    const result = await updateBranchSettings(currentBranch.id, {
      correspondent_phone: correspondentPhone.trim(),
      school_office_phone: schoolOfficePhone.trim(),
    });
    setSavingContact(false);
    if (result) {
      Alert.alert('Saved', 'Contact numbers updated successfully.');
    } else {
      Alert.alert('Error', 'Failed to save contact numbers.');
    }
  };

  const settingsSections = [
    {
      title: 'Appearance',
      items: [
        {
          id: 'darkMode',
          icon: 'theme-light-dark',
          label: 'Dark Mode',
          value: theme === 'dark',
          onToggle: toggleTheme,
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          id: 'pushNotifications',
          icon: 'bell',
          label: 'Push Notifications',
          value: pushEnabled,
          onToggle: handlePushToggle,
        },
        {
          id: 'emailAlerts',
          icon: 'email',
          label: 'Email Alerts',
          value: emailAlerts,
          onToggle: () => setEmailAlerts(!emailAlerts),
        },
      ],
    },
    {
      title: 'Data Management',
      items: [
        {
          id: 'autoBackup',
          icon: 'backup-restore',
          label: 'Auto Backup',
          value: autoBackup,
          onToggle: () => setAutoBackup(!autoBackup),
        },
      ],
    },
  ];

  return (
    <View className={`flex-1 ${colors.background}`} style={{ backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF' }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="absolute top-0 left-0 right-0 h-[450px] overflow-hidden">
        <LinearGradient
            colors={[theme === 'dark' ? '#92400E33' : '#F59E0B33', theme === 'dark' ? '#F59E0B33' : '#FCD34D33']}
            className="absolute inset-0"
        />
        <View className="absolute -top-20 -left-20 w-64 h-64 bg-brand-pink/10 rounded-full blur-3xl" />
        
        <LinearGradient
            colors={['transparent', theme === 'dark' ? '#1c1c14' : '#FFFFFF']}
            className="absolute bottom-0 left-0 right-0 h-40"
        />
      </View>

      <View className="px-6 pt-10 pb-6">
        <View className="flex-row items-center justify-between">
            <View className="flex-1">
                <TouchableOpacity 
                    onPress={() => navigation.goBack()} 
                    className={`mb-4 ${theme === 'dark' ? 'bg-[#191919] border-gray-800' : 'bg-white border-brand-pink/20'} w-12 h-12 rounded-2xl items-center justify-center border shadow-sm`}
                    activeOpacity={0.7}
                >
                    <MaterialCommunityIcons name="arrow-left" size={28} color={theme === 'dark' ? '#FFF' : '#F59E0B'} />
                </TouchableOpacity>
                <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>System</Text>
                <Text className="text-2xl font-bold text-brand-pink">Settings ⚙️</Text>
                <View className="bg-brand-pink/20 self-start px-3 py-1 rounded-full mt-2 border border-brand-pink/10 shadow-sm">
                    <Text className="text-brand-pink text-[9px] font-black uppercase tracking-[2px]">Configurations</Text>
                </View>
            </View>
            <View className="bg-brand-yellow w-20 h-20 rounded-3xl items-center justify-center shadow-lg border-4 border-white rotate-3">
                <MaterialCommunityIcons name="cog-outline" size={42} color="#92400E" />
            </View>
        </View>
      </View>

      <View className="px-6">
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} className="mb-6">
            <Text className={`text-xl font-black ${colors.text} mb-4 ml-1 uppercase tracking-widest opacity-60`}>
              {section.title}
            </Text>
            
            <View className={`${colors.surface} rounded-2xl border ${colors.border} overflow-hidden`}>
              {section.items.map((item, itemIndex) => (
                <View 
                  key={item.id}
                  className={`flex-row items-center justify-between p-4 ${
                    itemIndex !== section.items.length - 1 ? `border-b ${colors.border}` : ''
                  }`}
                >
                  <View className="flex-row items-center flex-1">
                    <View className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} p-3 rounded-2xl mr-4`}>
                      <MaterialCommunityIcons 
                        name={item.icon as any} 
                        size={24} 
                        color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} 
                      />
                    </View>
                    <Text className={`font-bold ${colors.text} text-base`}>{item.label}</Text>
                  </View>
                  <Switch
                    value={item.value}
                    onValueChange={item.onToggle}
                    trackColor={{ false: '#D1D5DB', true: '#F59E0B' }}
                    thumbColor={item.value ? '#FFFFFF' : '#F3F4F6'}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}

        {isAdminOrMaster && (
          <View className="mb-6">
            <Text className={`text-xl font-black ${colors.text} mb-4 ml-1 uppercase tracking-widest opacity-60`}>
              Contact Numbers ☎️
            </Text>

            <View className={`${colors.surface} rounded-2xl border ${colors.border} p-5`}>
              <View className="mb-4">
                <Text className={`text-sm font-black ${colors.textSecondary} mb-2 uppercase tracking-wider`}>
                  Correspondent Phone
                </Text>
                <TextInput
                  value={correspondentPhone}
                  onChangeText={setCorrespondentPhone}
                  placeholder="Enter correspondent phone number"
                  placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
                  keyboardType="phone-pad"
                  className={`${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-100 text-gray-900 border-gray-200'} p-4 rounded-xl border font-bold text-base`}
                />
              </View>

              <View className="mb-4">
                <Text className={`text-sm font-black ${colors.textSecondary} mb-2 uppercase tracking-wider`}>
                  School Office Phone
                </Text>
                <TextInput
                  value={schoolOfficePhone}
                  onChangeText={setSchoolOfficePhone}
                  placeholder="Enter school office phone number"
                  placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
                  keyboardType="phone-pad"
                  className={`${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-100 text-gray-900 border-gray-200'} p-4 rounded-xl border font-bold text-base`}
                />
              </View>

              <TouchableOpacity
                onPress={handleSaveContactSettings}
                disabled={savingContact}
                className="bg-brand-yellow p-4 rounded-xl flex-row items-center justify-center"
                activeOpacity={0.7}
              >
                {savingContact ? (
                  <ActivityIndicator color="#92400E" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="content-save" size={20} color="#92400E" />
                    <Text className="text-amber-900 font-black text-base ml-2">Save Contact Numbers</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View className="mb-6">
          <Text className={`text-xl font-black ${colors.text} mb-4 ml-1 uppercase tracking-widest opacity-60`}>
            About
          </Text>
          
          <View className={`${colors.surface} rounded-2xl border ${colors.border} p-4`}>
            <View className="flex-row items-center justify-between mb-3">
              <Text className={`${colors.textSecondary} font-bold`}>Version</Text>
              <Text className={`${colors.text} font-black`}>1.0.0</Text>
            </View>
            <View className="flex-row items-center justify-between mb-3">
              <Text className={`${colors.textSecondary} font-bold`}>School Name</Text>
              <Text className={`${colors.text} font-black`}>Chithode Happy Kids</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className={`${colors.textSecondary} font-bold`}>License</Text>
              <Text className={`${colors.text} font-black`}>Premium</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => Alert.alert('Help', 'Contact support at support@tnhappykids.in')}
          className={`${colors.surface} rounded-2xl p-4 mb-8 border ${colors.border} flex-row items-center justify-between`}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center">
            <View className="bg-blue-500/10 p-3 rounded-2xl mr-4">
              <MaterialCommunityIcons name="help-circle" size={24} color="#3B82F6" />
            </View>
            <Text className={`font-bold ${colors.text} text-base`}>Help & Support</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
        </TouchableOpacity>

      </View>
      <View className="h-20" />
      </ScrollView>
    </View>
  );
}
