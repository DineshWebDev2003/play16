import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Linking, RefreshControl, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const BORDER_RADIUS = 22;

const STUDENT_ICON = require('../../../assets/icons/student.png');

function RadialGlow({ size, color, opacity, style }: {
  size: number;
  color: string;
  opacity: number;
  style?: any;
}) {
  const layers = [0, 45, 90, 135];
  return (
    <View
      pointerEvents="none"
      style={[
        { position: 'absolute', width: size, height: size, borderRadius: size / 2, opacity },
        style,
      ]}
    >
      {layers.map((deg) => (
        <LinearGradient
          key={deg}
          colors={[color, 'rgba(255,255,255,0)']}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[StyleSheet.absoluteFill, { transform: [{ rotate: `${deg}deg` }] }]}
        />
      ))}
    </View>
  );
}

function AuroraBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['#F7F9F6', '#F2FAF5', '#EEFDFC', '#F7F9F6']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <RadialGlow size={480} color="#DDF8D7" opacity={0.28} style={{ top: -160, left: -160 }} />
      <RadialGlow size={420} color="#DDFBFF" opacity={0.25} style={{ top: -140, left: SCREEN_WIDTH / 2 - 210 }} />
      <RadialGlow size={520} color="#F8FFD8" opacity={0.24} style={{ bottom: -180, left: -180 }} />
      <RadialGlow size={450} color="#EAF5FF" opacity={0.18} style={{ top: SCREEN_HEIGHT * 0.4 - 225, right: -180 }} />
    </View>
  );
}

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
  route: { params: { studentId: string } };
}

export default function TuitionStudentDetailScreenV2({ navigation, route }: Props) {
  const { users, branches, fetchData } = useAuth();
  const insets = useSafeAreaInsets();
  const { studentId } = route.params;
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await fetchData(); } catch (error) { console.error('Refresh Error:', error); } finally { setRefreshing(false); }
  }, [fetchData]);

  const student = users.find(u => u.id === studentId && u.role === 'tuition_student');

  if (!student) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F7F9F6', alignItems: 'center', justifyContent: 'center' }}>
        <AuroraBackground />
        <MaterialCommunityIcons name="account-search-outline" size={80} color={TEXT_MUTED} />
        <Text style={{ fontSize: 18, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 16, textAlign: 'center' }}>Student not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.85} style={{ marginTop: 32, height: 52, borderRadius: 16, overflow: 'hidden' }}>
          <LinearGradient colors={['#F59E0B', '#D97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
            <Text style={{ color: 'white', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>Back to List</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  const branch = branches.find(b => b.id?.toString() === student.branch_id?.toString());
  const statusColor = student.status === 'active' ? '#10B981' : student.status === 'pending_payment' ? '#F59E0B' : '#EF4444';

  const InfoRow = ({ label, value, icon, iconColor, isPhone }: { label: string; value?: string; icon: string; iconColor: string; isPhone?: boolean }) => (
    <View style={{ marginBottom: 16, width: '100%', flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: iconColor + '14', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
        <MaterialCommunityIcons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: TEXT_MUTED, marginBottom: 2 }}>{label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY, flex: 1, marginRight: 8 }}>{value || 'Not provided'}</Text>
          {isPhone && value && (
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${value}`)} activeOpacity={0.85} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="phone" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const QuickPill = ({ label, color }: { label: string; color: string }) => (
    <View style={{ backgroundColor: color + '16', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100, borderWidth: 1, borderColor: color + '30' }}>
      <Text style={{ fontSize: 9, fontWeight: '800', color, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Text>
    </View>
  );

  const SectionHeader = ({ icon, iconBg, iconColor, label, title }: { icon: string; iconBg: string; iconColor: string; label: string; title: string }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 14 }}>
      <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
        <MaterialCommunityIcons name={icon as any} size={20} color={iconColor} />
      </View>
      <View>
        <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: TEXT_MUTED }}>{label}</Text>
        <Text style={{ fontSize: 17, fontWeight: '800', color: TEXT_PRIMARY }}>{title}</Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" colors={['#F59E0B']} />}
      >
        {/* ── Header ── */}
        <View style={{ paddingTop: Math.max(insets.top, 56), flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY }}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontSize: 12, fontWeight: '400', color: TEXT_MUTED }}>Tuition</Text>
            <Text style={{ fontSize: 22, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 2, letterSpacing: -0.5 }}>Student Details</Text>
          </View>
          <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
            <Image source={STUDENT_ICON} style={{ width: 46, height: 46 }} resizeMode="contain" />
          </View>
        </View>

        {/* ── Hero ── */}
        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <View style={{ position: 'relative' }}>
            <View style={{ width: 108, height: 108, borderRadius: 34, overflow: 'hidden', backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 4, borderColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' }}>
              {student.avatar ? (
                <Image source={{ uri: student.avatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <MaterialCommunityIcons name="school" size={46} color="#D97706" />
              )}
            </View>
            <View style={{ position: 'absolute', bottom: -4, right: -4, backgroundColor: statusColor, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, borderWidth: 3, borderColor: '#FFFFFF' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>{student.status}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '900', color: TEXT_PRIMARY, marginTop: 16, letterSpacing: -0.5 }}>{student.name}</Text>
          <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1, color: '#D97706', marginTop: 3 }}>{student.studentId || 'TS-000'}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <QuickPill label={student.gender || 'N/A'} color="#8B5CF6" />
            <QuickPill label="Tuition Student" color="#F59E0B" />
            {student.category && <QuickPill label={student.category} color="#10B981" />}
          </View>
        </View>

        {/* ── Basic details ── */}
        <SectionHeader icon="account-details-outline" iconBg="rgba(236,72,153,0.12)" iconColor="#EC4899" label="Profile" title="Basic Details" />
        <View style={{ borderRadius: BORDER_RADIUS, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', padding: 18 }}>
          <InfoRow label="Username" value={student.username} icon="at" iconColor="#8B5CF6" />
          <InfoRow label="Branch" value={branch?.name} icon="domain" iconColor="#F59E0B" />
          <InfoRow label="Phone" value={student.phone} icon="phone" iconColor="#10B981" isPhone />
          <InfoRow label="Email" value={student.email} icon="email-outline" iconColor="#3B82F6" />
          <InfoRow label="Date of Birth" value={student.date_of_birth} icon="cake-variant" iconColor="#EC4899" />
          <InfoRow label="Address" value={student.address} icon="map-marker-outline" iconColor="#EF4444" />
        </View>

        {/* ── Parents ── */}
        <SectionHeader icon="account-heart" iconBg="rgba(16,185,129,0.12)" iconColor="#10B981" label="Guardian" title="Parents" />
        <View style={{ borderRadius: BORDER_RADIUS, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', padding: 18 }}>
          <InfoRow label="Father Name" value={student.fatherName} icon="account-tie" iconColor="#3B82F6" />
          <InfoRow label="Father Phone" value={student.fatherPhone} icon="phone" iconColor="#10B981" isPhone />
          <InfoRow label="Mother Name" value={student.motherName} icon="account-heart" iconColor="#EC4899" />
          <InfoRow label="Mother Phone" value={student.motherPhone} icon="phone" iconColor="#10B981" isPhone />
          <InfoRow label="Guardian Phone" value={student.guardianPhone} icon="cellphone" iconColor="#8B5CF6" isPhone />
        </View>

        {/* ── Fees ── */}
        <SectionHeader icon="finance" iconBg="rgba(245,158,11,0.12)" iconColor="#F59E0B" label="Financial" title="Fees" />
        <View style={{ borderRadius: BORDER_RADIUS, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', padding: 16 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 16, padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                  <Text style={{ color: 'white', fontWeight: '900', fontSize: 14 }}>₹</Text>
                </View>
                <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: TEXT_MUTED }}>Monthly Fee</Text>
              </View>
              <Text style={{ fontSize: 22, fontWeight: '900', color: TEXT_PRIMARY }}>₹{student.fees || '0'}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: 'rgba(99,102,241,0.1)', borderRadius: 16, padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                  <MaterialCommunityIcons name="calendar-clock" size={16} color="white" />
                </View>
                <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: TEXT_MUTED }}>Due Day</Text>
              </View>
              <Text style={{ fontSize: 22, fontWeight: '900', color: TEXT_PRIMARY }}>{student.fee_due_day || '5'}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
