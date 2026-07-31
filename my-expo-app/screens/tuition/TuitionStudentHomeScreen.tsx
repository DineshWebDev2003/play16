import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface Props { navigation: { navigate: (s: string) => void; goBack: () => void } }

export default function TuitionStudentHomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const isDark = theme === 'dark';

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFFFFF' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" colors={['#F59E0B']} />}
      >
        <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: isDark ? '#D1D5DB' : '#6B7280' }}>
                TN HAPPYKIDS
              </Text>
              <Text style={{ fontSize: 30, fontWeight: '900', letterSpacing: -0.5, marginTop: 4, color: isDark ? '#FFFFFF' : '#111827' }}>
                {user?.name || 'Student'}
              </Text>
              <View style={{ backgroundColor: 'rgba(245,158,11,0.15)', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100, marginTop: 12, borderWidth: 1, borderColor: 'rgba(245,158,11,0.1)' }}>
                <Text style={{ color: '#D97706', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Tuition Student</Text>
              </View>
            </View>
            <View style={{ backgroundColor: '#FDE047', width: 80, height: 80, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FFFFFF', transform: [{ rotate: '3deg' }], overflow: 'hidden' }}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <MaterialCommunityIcons name="school" size={36} color="#92400E" />
              )}
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 24, paddingVertical: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', letterSpacing: -0.5, color: isDark ? '#FFFFFF' : '#111827' }}>My Dashboard</Text>
            <View style={{ backgroundColor: 'rgba(245,158,11,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' }}>
              <Text style={{ color: '#F59E0B', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Student</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {[
              { label: 'Homework', icon: 'book-open-page-variant', color: '#8B5CF6', bg: '#F3E8FF', screen: 'homework', desc: 'View assignments' },
              { label: 'Progress', icon: 'chart-line', color: '#10B981', bg: '#ECFDF5', screen: 'tuitionMyProgress', desc: 'Track your progress' },
              { label: 'Attendance', icon: 'calendar-check', color: '#F59E0B', bg: '#FFFBEB', screen: 'attendance', desc: 'My attendance record' },
            ].map((item, i) => (
              <TouchableOpacity
                key={item.label}
                activeOpacity={0.85}
                onPress={() => navigation.navigate(item.screen)}
                style={{
                  width: i < 2 ? '48%' : '100%',
                  marginBottom: 14,
                  borderRadius: 24,
                  overflow: 'hidden',
                  elevation: 12,
                  backgroundColor: isDark ? '#2a2a28' : item.bg,
                  borderWidth: 1,
                  borderColor: isDark ? '#3a3a38' : `${item.color}20`,
                  padding: 20,
                }}
              >
                <View style={{
                  width: 56, height: 56, borderRadius: 18,
                  backgroundColor: item.color,
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14,
                  shadowColor: item.color, shadowOpacity: 0.3,
                  shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 8,
                }}>
                  <MaterialCommunityIcons name={item.icon as any} size={28} color="white" />
                </View>
                <Text style={{ fontSize: 15, fontWeight: '900', color: isDark ? '#fff' : '#111827', marginBottom: 4 }}>
                  {item.label}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: item.color, marginRight: 6 }} />
                  <Text style={{ fontSize: 10, fontWeight: '700', color: item.color, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {item.desc}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 128 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
