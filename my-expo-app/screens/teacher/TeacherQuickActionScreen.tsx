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

export default function TeacherQuickActionScreen({ navigation }: Props) {
  const { user } = useAuth();

  const actions = [
    { label: 'Student Info', screen: 'studentList', icon: 'account-group', color: '#3B82F6', desc: 'Global directory' },
    { label: 'School Fee', screen: 'feesManagement', icon: 'cash-multiple', color: '#10B981', desc: 'Fee records & payments' },
    { label: 'Duty Log', screen: 'myAttendance', icon: 'calendar-account', color: '#6366F1', desc: 'Work history' },
    { label: 'Roll Call', screen: 'takeAttendance', icon: 'calendar-check', color: '#F59E0B', desc: 'Mark presence' },
    { label: 'Analytics', screen: 'studentAttendanceReport', icon: 'file-chart-outline', color: '#10B981', desc: 'Student stats' },
    { label: 'Social Feed', screen: 'postActivity', icon: 'camera-burst', color: '#FBBF24', desc: 'Share moments' },
    { label: 'Timetable', screen: 'timetable', icon: 'calendar-clock', color: '#6366F1', desc: 'Daily schedule' },
  ];

  return (
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-12 pb-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Teacher Access
              </Text>
              <Text className="text-3xl font-black text-gray-900 tracking-tight mt-1">
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
              className="w-[48%] mb-4 rounded-2xl overflow-hidden shadow-lg"
            >
              <View style={{ backgroundColor: action.color }} className="p-5 h-36 justify-between">
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
