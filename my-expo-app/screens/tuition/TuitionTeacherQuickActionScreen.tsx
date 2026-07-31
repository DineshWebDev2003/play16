import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
}

export default function TuitionTeacherQuickActionScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const actions = [
    { label: 'Post Homework', screen: 'postHomework', icon: 'book-plus', color: '#8B5CF6', grad: ['#8B5CF6', '#7C3AED'], gradDark: ['#5b21b6', '#2e1065'], tag: 'Assign', desc: 'Assign homework to students' },
    { label: 'Study Materials', screen: 'tuitionStudyMaterials', icon: 'book-open-variant', color: '#F97316', grad: ['#F97316', '#EA580C'], gradDark: ['#9a3412', '#7c2d12'], tag: 'Upload', desc: 'Upload & manage resources' },
    { label: 'Post Progress', screen: 'tuitionPostProgress', icon: 'chart-line', color: '#10B981', grad: ['#10B981', '#059669'], gradDark: ['#064e3b', '#022c22'], tag: 'Track', desc: 'Track student progress' },
    { label: 'Attendance', screen: 'tuitionAttendance', icon: 'calendar-check', color: '#F59E0B', grad: ['#F59E0B', '#D97706'], gradDark: ['#92400E', '#78350F'], tag: 'Mark', desc: 'Mark daily attendance' },
    { label: 'View Submissions', screen: 'viewSubmissions', icon: 'clipboard-list', color: '#3B82F6', grad: ['#3B82F6', '#2563EB'], gradDark: ['#1e40af', '#1e1b4b'], tag: 'Review', desc: 'Review submitted work' },
    { label: 'Messages', screen: 'parentMessages', icon: 'message-text', color: '#EC4899', grad: ['#EC4899', '#DB2777'], gradDark: ['#831843', '#500724'], tag: 'Chat', desc: 'Chat with parents & students' },
  ];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFFFFF' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 24, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: isDark ? '#9CA3AF' : '#6B7280' }}>
                Tuition Teacher
              </Text>
              <Text style={{ fontSize: 30, fontWeight: '900', letterSpacing: -0.5, marginTop: 4, color: isDark ? '#FFFFFF' : '#111827' }}>
                Quick Actions
              </Text>
            </View>
            <View style={{ backgroundColor: '#F59E0B', width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="flash" size={32} color="white" />
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 24, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
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
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
        <View style={{ height: 128 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
