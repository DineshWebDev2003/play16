import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
}

export default function StudentQuickActionScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const actions = [
    { label: 'My Attendance', screen: 'attendance', icon: 'calendar-check', color: '#10B981', grad: ['#10B981', '#059669'], gradDark: ['#064e3b', '#022c22'], tag: 'Report', desc: 'View attendance report' },
    { label: 'Kids Activity', screen: 'activityFeed', icon: 'image-multiple', color: '#F59E0B', grad: ['#F59E0B', '#D97706'], gradDark: ['#92400E', '#78350F'], tag: 'Feed', desc: 'View school activities' },
    { label: 'Timetable', screen: 'timetable', icon: 'calendar-clock', color: '#6366F1', grad: ['#6366F1', '#4F46E5'], gradDark: ['#3730a3', '#312e81'], tag: 'Plans', desc: 'Daily school schedule' },
    { label: 'Live Camera', screen: 'liveCamera', icon: 'broadcast', color: '#F59E0B', grad: ['#F59E0B', '#D97706'], gradDark: ['#92400E', '#78350F'], tag: 'Live', desc: 'View classroom live feed' },
    { label: 'My Fees', screen: 'myFees', icon: 'cash-multiple', color: '#8B5CF6', grad: ['#8B5CF6', '#7C3AED'], gradDark: ['#5b21b6', '#2e1065'], tag: 'Payments', desc: 'View fee details & payments' },
    { label: 'Emergency Contact', screen: 'emergencyContact', icon: 'phone-alert', color: '#EF4444', grad: ['#EF4444', '#DC2626'], gradDark: ['#7f1d1d', '#450a0a'], tag: 'Call', desc: 'Call guardians quickly' },
    { label: 'Messages', screen: 'nannyChat', icon: 'microphone-message', color: '#06B6D4', grad: ['#06B6D4', '#0891B2'], gradDark: ['#164e63', '#083344'], tag: 'Chat', desc: 'Talk to your nanny' },
  ];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFFFFF' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-12 pb-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Student Access
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
        <View className="h-40" />
      </ScrollView>
    </SafeAreaView>
  );
}
