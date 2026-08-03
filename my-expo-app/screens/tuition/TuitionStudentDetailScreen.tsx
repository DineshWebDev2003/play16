import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Linking, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

interface TuitionStudentDetailScreenProps {
  navigation: NavigationProps;
  route: { params: { studentId: string } };
}

export default function TuitionStudentDetailScreen({ navigation, route }: TuitionStudentDetailScreenProps) {
  const { users, branches, fetchData } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { studentId } = route.params;
  const [refreshing, setRefreshing] = useState(false);

  const bg = isDark ? '#1c1c14' : '#FFFFFF';
  const cardBg = isDark ? '#2a2a28' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#000000';
  const textSecondary = isDark ? '#9CA3AF' : '#6B7280';
  const border = isDark ? '#3a3a38' : '#F3F4F6';

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } catch (error) {
      console.error('Refresh Error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

  const student = users.find(u => u.id === studentId && u.role === 'tuition_student');

  if (!student) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', paddingHorizontal: 40 }}>
          <MaterialCommunityIcons name="account-search-outline" size={80} color={textSecondary} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: textPrimary, marginTop: 16, textAlign: 'center' }}>Student not found</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginTop: 32, backgroundColor: '#F59E0B', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 24, elevation: 6 }}
          >
            <Text style={{ color: 'white', fontWeight: '900' }}>BACK TO LIST</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const branch = branches.find(b => b.id?.toString() === student.branch_id?.toString());

  const InfoRow = ({ label, value, icon, iconColor, isPhone }: { label: string; value?: string; icon: string; iconColor: string; isPhone?: boolean }) => (
    <View style={{ marginBottom: 20, width: '100%' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
          width: 48, height: 48, borderRadius: 16,
          backgroundColor: isDark ? '#333' : '#F3F4F6',
          alignItems: 'center', justifyContent: 'center',
          marginRight: 14
        }}>
          <MaterialCommunityIcons name={icon as any} size={22} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: textSecondary, marginBottom: 2 }}>{label}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: textPrimary, flex: 1, marginRight: 8 }}>
              {value || 'Not provided'}
            </Text>
            {isPhone && value && (
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${value}`)}
                style={{ backgroundColor: '#22C55E', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', elevation: 4 }}
              >
                <MaterialCommunityIcons name="phone" size={18} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );

  const QuickPill = ({ label, color }: { label: string; color: string }) => (
    <View style={{ backgroundColor: color + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: color + '30' }}>
      <Text style={{ fontSize: 10, fontWeight: '800', color, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Text>
    </View>
  );

  const statusColor = student.status === 'active' ? '#22C55E' : student.status === 'pending_payment' ? '#F59E0B' : '#EF4444';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" colors={['#F59E0B']} progressBackgroundColor={isDark ? '#1c1c14' : '#FFFFFF'} />
        }
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ backgroundColor: cardBg, width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: border }}
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color={textPrimary} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ backgroundColor: statusColor, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                <Text style={{ color: 'white', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>{student.status}</Text>
              </View>
            </View>
          </View>

          {/* Hero */}
          <View style={{ alignItems: 'center', marginTop: 24 }}>
            <View style={{
              width: 110, height: 110, borderRadius: 32, overflow: 'hidden',
              backgroundColor: isDark ? '#2d2d24' : '#FDF2F8',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 4, borderColor: '#F59E0B',
              elevation: 12, transform: [{ rotate: '3deg' }],
            }}>
              {student.avatar ? (
                <Image source={{ uri: student.avatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <MaterialCommunityIcons name="school" size={48} color="#F59E0B" />
              )}
            </View>
            <Text style={{ fontSize: 24, fontWeight: '900', letterSpacing: -0.5, color: textPrimary, marginTop: 16 }}>
              {student.name}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '800', letterSpacing: 1, color: '#F59E0B', marginTop: 2 }}>
              {student.studentId || 'TS-000'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <QuickPill label={student.gender || 'N/A'} color="#8B5CF6" />
              <QuickPill label="Tuition Student" color="#F59E0B" />
              {student.category && <QuickPill label={student.category} color="#10B981" />}
            </View>
          </View>
        </View>

        {/* Details */}
        <View style={{ paddingHorizontal: 24, marginTop: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#FDF2F8', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <MaterialCommunityIcons name="account-details-outline" size={20} color="#EC4899" />
            </View>
            <View>
              <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: textSecondary }}>PROFILE</Text>
              <Text style={{ fontSize: 18, fontWeight: '900', color: textPrimary }}>Basic Details</Text>
            </View>
          </View>

          <View style={{ backgroundColor: cardBg, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: border }}>
            <InfoRow label="Username" value={student.username} icon="at" iconColor="#8B5CF6" />
            <InfoRow label="Branch" value={branch?.name} icon="domain" iconColor="#F59E0B" />
            <InfoRow label="Phone" value={student.phone} icon="phone" iconColor="#22C55E" isPhone />
            <InfoRow label="Email" value={student.email} icon="email-outline" iconColor="#3B82F6" />
            <InfoRow label="Date of Birth" value={student.date_of_birth} icon="cake-variant" iconColor="#EC4899" />
            <InfoRow label="Address" value={student.address} icon="map-marker-outline" iconColor="#EF4444" />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 28, marginBottom: 16 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <MaterialCommunityIcons name="account-heart" size={20} color="#22C55E" />
            </View>
            <View>
              <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: textSecondary }}>GUARDIAN</Text>
              <Text style={{ fontSize: 18, fontWeight: '900', color: textPrimary }}>Parents</Text>
            </View>
          </View>

          <View style={{ backgroundColor: cardBg, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: border }}>
            <InfoRow label="Father Name" value={student.fatherName} icon="account-tie" iconColor="#3B82F6" />
            <InfoRow label="Father Phone" value={student.fatherPhone} icon="phone" iconColor="#22C55E" isPhone />
            <InfoRow label="Mother Name" value={student.motherName} icon="account-heart" iconColor="#EC4899" />
            <InfoRow label="Mother Phone" value={student.motherPhone} icon="phone" iconColor="#22C55E" isPhone />
            <InfoRow label="Guardian Phone" value={student.guardianPhone} icon="cellphone" iconColor="#8B5CF6" isPhone />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 28, marginBottom: 16 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFBEB', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <MaterialCommunityIcons name="finance" size={20} color="#F59E0B" />
            </View>
            <View>
              <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: textSecondary }}>FINANCIAL</Text>
              <Text style={{ fontSize: 18, fontWeight: '900', color: textPrimary }}>Fees</Text>
            </View>
          </View>

          <View style={{ backgroundColor: cardBg, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: border }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1, backgroundColor: isDark ? '#1e1e1e' : '#F9FAFB', borderRadius: 16, padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                    <Text style={{ color: 'white', fontWeight: '900', fontSize: 14 }}>₹</Text>
                  </View>
                  <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: textSecondary }}>Monthly Fee</Text>
                </View>
                <Text style={{ fontSize: 22, fontWeight: '900', color: textPrimary }}>₹{student.fees || '0'}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: isDark ? '#1e1e1e' : '#F9FAFB', borderRadius: 16, padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                    <MaterialCommunityIcons name="calendar-clock" size={16} color="white" />
                  </View>
                  <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: textSecondary }}>Due Day</Text>
                </View>
                <Text style={{ fontSize: 22, fontWeight: '900', color: textPrimary }}>{student.fee_due_day || '5'}</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
