import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
}

export default function AdminQuickActionScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const schoolActions = [
    { label: 'Live Monitoring', screen: 'liveCamera', icon: 'broadcast', color: '#EF4444', grad: ['#EF4444', '#DC2626'], gradDark: ['#7f1d1d', '#450a0a'], tag: 'Live', desc: 'Secure surveillance' },
    { label: 'Daily Highlights', screen: 'activityFeed', icon: 'image-multiple-outline', color: '#DB2777', grad: ['#DB2777', '#BE185D'], gradDark: ['#831843', '#500724'], tag: 'Feed', desc: 'Parent social feed' },
    { label: 'Student List', screen: 'studentList', icon: 'briefcase-account', color: '#3B82F6', grad: ['#3B82F6', '#2563EB'], gradDark: ['#1e40af', '#1e1b4b'], tag: 'Database', desc: 'Global database' },
    { label: 'Staff Logs', screen: 'teacherAttendanceReport', icon: 'account-tie', color: '#4F46E5', grad: ['#4F46E5', '#4338CA'], gradDark: ['#312e81', '#1e1b4b'], tag: 'Stats', desc: 'Attendance stats' },
    { label: 'Attendance', screen: 'attendanceSelection', icon: 'calendar-check', color: '#14B8A6', grad: ['#14B8A6', '#0D9488'], gradDark: ['#0f766e', '#134e4a'], tag: 'Register', desc: 'Record presence' },
    { label: 'User Add', screen: 'userManagementV2', icon: 'account-plus', color: '#FBBF24', grad: ['#FBBF24', '#F59E0B'], gradDark: ['#92400E', '#78350F'], tag: 'New', desc: 'Create account' },
    { label: 'Assign Fee', screen: 'feesManagement', icon: 'cash-plus', color: '#DB2777', grad: ['#DB2777', '#BE185D'], gradDark: ['#831843', '#500724'], tag: 'Fees', desc: 'Student records' },
    { label: 'Finances', screen: 'incomeExpense', icon: 'cash-multiple', color: '#059669', grad: ['#059669', '#047857'], gradDark: ['#065f46', '#022c22'], tag: 'Budget', desc: 'Budget tracker' },
    { label: 'Broadcast', screen: 'announcements', icon: 'bullhorn', color: '#DB2777', grad: ['#DB2777', '#BE185D'], gradDark: ['#831843', '#500724'], tag: 'Alerts', desc: 'Push alerts' },
    { label: 'Post Activity', screen: 'postActivity', icon: 'creation', color: '#D97706', grad: ['#D97706', '#B45309'], gradDark: ['#92400E', '#78350F'], tag: 'Share', desc: 'Post student activities' },
    { label: 'Backup', screen: 'backup', icon: 'database', color: '#F59E0B', grad: ['#F59E0B', '#D97706'], gradDark: ['#92400E', '#78350F'], tag: 'Vault', desc: 'System vault' },
    { label: 'Timetable', screen: 'timetable', icon: 'calendar-clock', color: '#6366F1', grad: ['#6366F1', '#4F46E5'], gradDark: ['#3730a3', '#312e81'], tag: 'Plans', desc: 'Daily plans' },
    { label: 'Nanny Voice', screen: 'nannyChat', icon: 'microphone-message', color: '#06B6D4', grad: ['#06B6D4', '#0891B2'], gradDark: ['#164e63', '#083344'], tag: 'Chat', desc: 'Talk to nannies' },
  ];

  const renderSection = (actions: typeof schoolActions) => (
    <View className="flex-row flex-wrap justify-between">
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.9}
            onPress={() => navigation.navigate(action.screen)}
            style={{ width: '48%', marginBottom: 16, borderRadius: 16, overflow: 'hidden', shadowColor: action.color, shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 12 }}
          >
            <LinearGradient
              colors={(isDark ? action.gradDark : action.grad) as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 20, minHeight: 180, justifyContent: 'space-between' }}
            >
                <View className="flex-row items-center justify-between">
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 }}>
                    <MaterialCommunityIcons name={action.icon as any} size={24} color="white" />
                  </View>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 }}>
                    <Text style={{ fontSize: 10, fontWeight: '900', color: 'white', textTransform: 'uppercase', letterSpacing: 1 }}>{action.tag}</Text>
                  </View>
                </View>
                <View>
                  <Text className="text-white text-xl font-black tracking-tight">{action.label}</Text>
                  <Text className="text-white/80 text-[9px] font-bold mt-1 uppercase tracking-widest">{action.desc}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.6)', marginRight: 6 }} />
                  <Text style={{ fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Tap to open
                  </Text>
                </View>
                <View className="absolute -bottom-3.5 -right-3.5 opacity-10">
                  <MaterialCommunityIcons name={action.icon as any} size={90} color="white" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
        ))}
      </View>
  );

  return (
    <View className={`flex-1 ${isDark ? 'bg-[#1c1c14]' : 'bg-white'}`}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-12 pb-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Admin Access
              </Text>
              <Text className={`text-3xl font-black tracking-tight mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Quick Actions
              </Text>
            </View>
            <View className="bg-pink-500 w-16 h-16 rounded-2xl items-center justify-center">
              <MaterialCommunityIcons name="flash" size={32} color="white" />
            </View>
          </View>
        </View>

        <View className="px-6 pb-4">
          {renderSection(schoolActions)}
        </View>

        <View className="h-32" />
      </ScrollView>
    </View>
  );
}
