import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
}

export default function AttendanceSelectionScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { user } = useAuth();

  const options = [
    {
      label: 'Student Attendance',
      screen: 'takeAttendance',
      icon: 'account-school',
      color: '#3B82F6',
      desc: 'Mark & manage student attendance records',
    },
    {
      label: 'Staff Attendance',
      screen: 'teacherAttendanceReport',
      icon: 'account-tie',
      color: '#EC4899',
      desc: 'View teacher & staff attendance logs',
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, color: theme === 'dark' ? '#D1D5DB' : '#6B7280' }}>
                {user?.role === 'master_admin' ? 'All Admin Access' : 'Admin Access'}
              </Text>
              <Text style={{ fontSize: 36, fontWeight: '900', letterSpacing: -0.5, marginTop: 2, color: theme === 'dark' ? '#FFFFFF' : '#111827' }}>
                Attendance
              </Text>
            </View>
            <View style={{ backgroundColor: '#EC4899', width: 80, height: 80, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 15, shadowColor: '#EC4899', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16 }}>
              <MaterialCommunityIcons name="calendar-check" size={40} color="white" />
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          {options.map((item, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.85}
              onPress={() => navigation.navigate(item.screen)}
              style={{ marginBottom: 20, borderRadius: 28, overflow: 'hidden', elevation: 15, shadowColor: item.color, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 20 }}
            >
              <View style={{ backgroundColor: item.color, padding: 32, alignItems: 'center' }}>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <MaterialCommunityIcons name={item.icon as any} size={44} color="white" />
                </View>
                <Text style={{ fontSize: 24, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 }}>{item.label}</Text>
                <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 6, textAlign: 'center' }}>{item.desc}</Text>
                <View style={{ marginTop: 20, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 100, flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: 'white', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginRight: 8 }}>Open</Text>
                  <MaterialCommunityIcons name="arrow-right" size={16} color="white" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 128 }} />
      </ScrollView>
    </View>
  );
}
