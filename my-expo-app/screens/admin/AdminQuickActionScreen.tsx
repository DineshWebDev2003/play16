import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
}

export default function AdminQuickActionScreen({ navigation }: Props) {
  const { user } = useAuth();

  const actions = [
    { label: 'Live Monitoring', screen: 'liveCamera', icon: 'broadcast', color: '#EF4444', desc: 'Secure surveillance' },
    { label: 'Daily Highlights', screen: 'activityFeed', icon: 'image-multiple-outline', color: '#DB2777', desc: 'Parent social feed' },
    { label: 'Student List', screen: 'studentList', icon: 'briefcase-account', color: '#3B82F6', desc: 'Global database' },
    { label: 'Staff Logs', screen: 'teacherAttendanceReport', icon: 'account-tie', color: '#4F46E5', desc: 'Attendance stats' },
    { label: 'Analytics', screen: 'studentAttendanceReport', icon: 'file-chart', color: '#10B981', desc: 'Monthly tracking' },
    { label: 'Attendance', screen: 'attendanceSelection', icon: 'calendar-check', color: '#14B8A6', desc: 'Record presence' },
    { label: 'User Add', screen: 'userManagementV2', icon: 'account-plus', color: '#FBBF24', desc: 'Create account' },
    { label: 'Assign Fee', screen: 'feesManagement', icon: 'cash-plus', color: '#DB2777', desc: 'Student records' },
    { label: 'Finances', screen: 'incomeExpense', icon: 'cash-multiple', color: '#059669', desc: 'Budget tracker' },
    { label: 'Broadcast', screen: 'announcements', icon: 'bullhorn', color: '#DB2777', desc: 'Push alerts' },
    { label: 'Post Activity', screen: 'postActivity', icon: 'creation', color: '#D97706', desc: 'Post student activities' },
    { label: 'Backup', screen: 'backup', icon: 'database', color: '#F59E0B', desc: 'System vault' },
    { label: 'Timetable', screen: 'timetable', icon: 'calendar-clock', color: '#6366F1', desc: 'Daily plans' },
  ];

  return (
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-12 pb-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Admin Access
              </Text>
              <Text className="text-3xl font-black text-gray-900 tracking-tight mt-1">
                Quick Actions
              </Text>
            </View>
            <View className="bg-pink-500 w-16 h-16 rounded-2xl items-center justify-center">
              <MaterialCommunityIcons name="flash" size={32} color="white" />
            </View>
          </View>
        </View>

        <View className="px-6 flex-row flex-wrap justify-between">
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.9}
              onPress={() => navigation.navigate(action.screen)}
              style={{ width: action.label === 'Post Activity' ? '100%' : '48%', marginBottom: 16 }}
              className="rounded-2xl overflow-hidden shadow-lg"
            >
              <View style={{ backgroundColor: action.color, borderRadius: 16, padding: 20, minHeight: action.label === 'Post Activity' ? 150 : 144, justifyContent: 'space-between' }}>
                <View className="flex-row justify-between items-start">
                  <View className="bg-white/20 p-2.5 rounded-2xl">
                    <MaterialCommunityIcons name={action.icon as any} size={24} color="white" />
                  </View>
                </View>
                <View>
                  <Text className="text-white text-lg font-black tracking-tight">{action.label}</Text>
                  <Text className="text-white/60 text-[10px] font-bold mt-0.5 uppercase tracking-widest">{action.desc}</Text>
                </View>
                <View className="absolute -bottom-4 -right-4 opacity-10">
                  <MaterialCommunityIcons name={action.icon as any} size={70} color="white" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <View className="h-32" />
      </ScrollView>
    </View>
  );
}
