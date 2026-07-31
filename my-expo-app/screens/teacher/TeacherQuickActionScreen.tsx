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

export default function TeacherQuickActionScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const actions = [
    { label: 'Student Info', screen: 'studentList', icon: 'account-group', color: '#3B82F6', grad: ['#3B82F6', '#2563EB'], gradDark: ['#1e40af', '#1e1b4b'], tag: 'Directory', desc: 'Global directory' },
    { label: 'School Fee', screen: 'feesManagement', icon: 'cash-multiple', color: '#10B981', grad: ['#10B981', '#059669'], gradDark: ['#064e3b', '#022c22'], tag: 'Fees', desc: 'Fee records & payments' },
    { label: 'Duty Log', screen: 'myAttendance', icon: 'calendar-account', color: '#6366F1', grad: ['#6366F1', '#4F46E5'], gradDark: ['#3730a3', '#312e81'], tag: 'Work', desc: 'Work history' },
    { label: 'Student Attendance', screen: 'takeAttendance', icon: 'calendar-check', color: '#F59E0B', grad: ['#F59E0B', '#D97706'], gradDark: ['#92400E', '#78350F'], tag: 'Presence', desc: 'Mark presence' },
    { label: 'Social Feed', screen: 'postActivity', icon: 'camera-burst', color: '#FBBF24', grad: ['#FBBF24', '#F59E0B'], gradDark: ['#92400E', '#78350F'], tag: 'Share', desc: 'Share moments' },
    { label: 'Timetable', screen: 'timetable', icon: 'calendar-clock', color: '#6366F1', grad: ['#6366F1', '#4F46E5'], gradDark: ['#3730a3', '#312e81'], tag: 'Plans', desc: 'Daily schedule' },
  ];

  return (
    <View className={`flex-1 ${isDark ? 'bg-[#1c1c14]' : 'bg-white'}`}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-12 pb-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Teacher Access
              </Text>
              <Text className={`text-3xl font-black tracking-tight mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Quick Actions
              </Text>
            </View>
            <View className="bg-amber-500 w-16 h-16 rounded-2xl items-center justify-center">
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
                  <Text style={{ color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 }}>{action.label}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '700', marginTop: 1, textTransform: 'uppercase', letterSpacing: 1 }}>{action.desc}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.6)', marginRight: 6 }} />
                  <Text style={{ fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Tap to open
                  </Text>
                </View>
                <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
                  <MaterialCommunityIcons name={action.icon as any} size={90} color="white" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
        <View className="h-32" />
      </ScrollView>
    </View>
  );
}
