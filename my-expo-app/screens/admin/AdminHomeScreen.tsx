import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface AdminHomeScreenProps {
  navigation: NavigationProps;
}

export default function AdminHomeScreen({ navigation }: AdminHomeScreenProps) {
  const { user, users, fees, transactions, fetchData, updateAvatar } = useAuth();
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const getTodayDateString = useCallback(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const studentCount = useMemo(() => users.filter(u => u.role === 'student' && u.status === 'active').length, [users]);
  const teacherCount = useMemo(() => users.filter(u => u.role === 'teacher' && u.status === 'active').length, [users]);

  // Use actual fee records for the status card (matches Fees Management "Monthly" view)
  const feeStats = useMemo(() => {
    const todayStr = getTodayDateString();
    const currentMonthPrefix = todayStr.substring(0, 8);
    const activeStudents = users.filter(u => u.role === 'student' && u.status === 'active' && parseInt(u.fees || '0') > 0);

    const paidStudents = activeStudents.filter(student => {
      const dbId = student.id?.toString();
      const schoolId = student.studentId?.toString();
      
      return fees.some(f => 
        (dbId && f.student_id?.toString() === dbId || (schoolId && f.student_id?.toString() === schoolId)) &&
        f.status === 'paid' &&
        f.date.includes(currentMonthPrefix) &&
        !(f.type || '').toLowerCase().includes('admission')
      );
    });

    const totalCollected = fees
      .filter(f => f.status === 'paid' && f.date.includes(currentMonthPrefix) && !(f.type || '').toLowerCase().includes('admission'))
      .reduce((sum, f) => sum + (f.amount || 0), 0);

    return {
       total: activeStudents.length,
       paid: paidStudents.length,
       collected: totalCollected
    };
  }, [fees, users, getTodayDateString]);

  const totalFeeCount = feeStats.total;
  const paidFeeCount  = feeStats.paid;
  const collectedAmount = feeStats.collected;

  const monthlyFinance = useMemo(() => {
    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const approved = transactions.filter(t =>
      (t.status === 'approved' || !t.status) &&
      t.date && t.date.startsWith(monthPrefix)
    );
    const income = approved.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
    const expense = approved.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
    return { income, expense, net: income - expense };
  }, [transactions]);

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

  const handleQuickAction = (screen: string | null) => {
    if (screen) {
      navigation.navigate(screen as any);
    } else {
      Alert.alert('Coming Soon', 'This feature will be available in the next update! 🚀');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#F59E0B"
            colors={["#F59E0B"]}
            progressBackgroundColor={theme === 'dark' ? '#1c1c14' : '#FFFFFF'}
          />
        }
      >
        <View style={{ paddingTop: Math.max(useSafeAreaInsets().top, 50), paddingHorizontal: 24, paddingBottom: 24 }}>
          {/* ── Modern Header ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: theme === 'dark' ? '#D1D5DB' : '#6B7280' }}>
                TN HAPPYKIDS
              </Text>
              <Text style={{ fontSize: 30, fontWeight: '900', letterSpacing: -0.5, marginTop: 4, color: theme === 'dark' ? '#FFFFFF' : '#111827' }}>
                {user?.name || 'Administrator'}
              </Text>
              <View style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100, marginTop: 12, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.1)' }}>
                <Text style={{ color: '#F59E0B', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Admin Console</Text>
              </View>
            </View>
            <TouchableOpacity activeOpacity={0.85} onPress={updateAvatar}
              style={{ backgroundColor: '#FDE047', width: 80, height: 80, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FFFFFF', transform: [{ rotate: '3deg' }], overflow: 'hidden' }}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <MaterialCommunityIcons name="shield-crown" size={36} color="#92400E" />
              )}
              <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: '#7C3AED', padding: 4, borderRadius: 10, borderWidth: 2, borderColor: '#FFFFFF' }}>
                <MaterialCommunityIcons name="camera" size={12} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Campus Hub (cyan counter card) ── */}
          <View style={{ paddingVertical: 8 }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleQuickAction('userManagementV2')}
              style={{ borderRadius: 16, overflow: 'hidden', elevation: 15 }}
            >
              <LinearGradient
                colors={theme === 'dark' ? ['#0E7490', '#155E75'] : ['#06B6D4', '#0891B2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 12 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                      <MaterialCommunityIcons name="school" size={18} color="white" />
                    </View>
                    <View>
                      <Text style={{ color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: -0.5 }}>Campus Hub</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 1 }}>Faculty & Enrollment</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 }}>
                    <Text style={{ color: 'white', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>{studentCount + teacherCount} Total</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    {[
                      { label: 'Students', value: studentCount, icon: 'school', color: '#FCD34D' },
                      { label: 'Teachers', value: teacherCount, icon: 'account-group', color: '#6EE7B7' },
                      { label: 'Active', value: studentCount + teacherCount, icon: 'check-circle', color: '#93C5FD' },
                    ].map((item, i) => (
                      <View key={item.label} style={{ alignItems: 'center', flex: 1, borderRightWidth: i < 2 ? 1 : 0, borderRightColor: 'rgba(255,255,255,0.1)' }}>
                        <MaterialCommunityIcons name={item.icon as any} size={20} color="#FFFFFF" style={{ marginBottom: 4 }} />
                        <Text style={{ color: 'white', fontSize: 15, fontWeight: '900' }}>{item.value}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginTop: 1 }}>{item.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
                  <MaterialCommunityIcons name="arrow-right-circle" size={12} color="rgba(255,255,255,0.5)" />
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 6 }}>Manage Users</Text>
                </View>
                <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
                  <MaterialCommunityIcons name="share-variant" size={90} color="white" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ── Main Operations ── */}
          <View style={{ paddingVertical: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', letterSpacing: -0.5, color: theme === 'dark' ? '#FFFFFF' : '#111827' }}>Main Operations ⚙️</Text>
              <View style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)' }}>
                <Text style={{ color: '#8B5CF6', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Master Controls</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleQuickAction('incomeExpense')}
                style={{ width: '48%', borderRadius: 16, overflow: 'hidden', shadowColor: '#059669', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 12 }}
              >
                <LinearGradient
                  colors={theme === 'dark' ? ['#064e3b', '#022c22'] : ['#10B981', '#059669']}
                  style={{ padding: 20, height: 180, justifyContent: 'space-between' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 }}>
                      <MaterialCommunityIcons name="finance" size={24} color="white" />
                    </View>
                    <View style={{ backgroundColor: monthlyFinance.net >= 0 ? '#D1FAE5' : '#FEE2E2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 }}>
                      <Text style={{ fontSize: 12, fontWeight: '900', color: monthlyFinance.net >= 0 ? '#065F46' : '#991B1B' }}>
                        ₹{(monthlyFinance.net || 0).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                  <View>
                    <Text style={{ color: 'white', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 }}>Finance Hub</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '700', marginTop: 3, textTransform: 'uppercase', letterSpacing: 1.5 }}>Accounts & Budget</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingVertical: 6, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: '#D1FAE5' }}>₹{(monthlyFinance.income || 0).toLocaleString('en-IN')}</Text>
                      <Text style={{ fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>Income</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingVertical: 6, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: '#FECACA' }}>₹{(monthlyFinance.expense || 0).toLocaleString('en-IN')}</Text>
                      <Text style={{ fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>Expense</Text>
                    </View>
                  </View>
                  <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
                    <MaterialCommunityIcons name="chart-line" size={90} color="white" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleQuickAction('feesManagement')}
                style={{ width: '48%', borderRadius: 16, overflow: 'hidden', shadowColor: '#2563EB', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 12 }}
              >
                <LinearGradient
                  colors={theme === 'dark' ? ['#1e40af', '#1e1b4b'] : ['#3B82F6', '#2563EB']}
                  style={{ padding: 20, height: 180, justifyContent: 'space-between' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 }}>
                      <MaterialCommunityIcons name="cash-register" size={24} color="white" />
                    </View>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 }}>
                      <Text style={{ fontSize: 12, fontWeight: '900', color: 'white' }}>{paidFeeCount}/{totalFeeCount}</Text>
                    </View>
                  </View>
                  <View>
                    <Text style={{ color: 'white', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 }}>Fee Portal</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '700', marginTop: 3, textTransform: 'uppercase', letterSpacing: 1.5 }}>Collections Info</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingVertical: 6, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: '#BFDBFE' }}>₹{collectedAmount.toLocaleString('en-IN')}</Text>
                      <Text style={{ fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>Collected</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingVertical: 6, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: '#BFDBFE' }}>{paidFeeCount}</Text>
                      <Text style={{ fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>Paid</Text>
                    </View>
                  </View>
                  <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
                    <MaterialCommunityIcons name="account-group" size={90} color="white" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleQuickAction('liveCamera')}
                style={{ width: '48%', borderRadius: 16, overflow: 'hidden', shadowColor: '#DC2626', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 12 }}
              >
                <LinearGradient
                  colors={theme === 'dark' ? ['#7f1d1d', '#450a0a'] : ['#EF4444', '#DC2626']}
                  style={{ padding: 20, height: 150, justifyContent: 'space-between' }}
                >
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', padding: 10, borderRadius: 12 }}>
                    <MaterialCommunityIcons name="broadcast" size={24} color="white" />
                  </View>
                  <View>
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 }}>Live Monitoring</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '700', marginTop: 3, textTransform: 'uppercase', letterSpacing: 1.5 }}>CCTV & Cameras</Text>
                  </View>
                  <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
                    <MaterialCommunityIcons name="cctv" size={80} color="white" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleQuickAction('takeAttendance')}
                style={{ width: '48%', borderRadius: 16, overflow: 'hidden', shadowColor: '#0D9488', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 12 }}
              >
                <LinearGradient
                  colors={theme === 'dark' ? ['#0f766e', '#134e4a'] : ['#14B8A6', '#0D9488']}
                  style={{ padding: 20, height: 150, justifyContent: 'space-between' }}
                >
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', padding: 10, borderRadius: 12 }}>
                    <MaterialCommunityIcons name="calendar-check" size={24} color="white" />
                  </View>
                  <View>
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 }}>Attendance</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '700', marginTop: 3, textTransform: 'uppercase', letterSpacing: 1.5 }}>Daily Register</Text>
                  </View>
                  <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
                    <MaterialCommunityIcons name="clipboard-check-outline" size={80} color="white" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleQuickAction('tuitionConsole')}
                style={{ width: '48%', borderRadius: 16, overflow: 'hidden', shadowColor: '#8B5CF6', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 12 }}
              >
                <LinearGradient
                  colors={theme === 'dark' ? ['#5b21b6', '#2e1065'] : ['#8B5CF6', '#7C3AED']}
                  style={{ padding: 20, height: 150, justifyContent: 'space-between' }}
                >
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', padding: 10, borderRadius: 12 }}>
                    <MaterialCommunityIcons name="school" size={24} color="white" />
                  </View>
                  <View>
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 }}>Tuition Console</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '700', marginTop: 3, textTransform: 'uppercase', letterSpacing: 1.5 }}>After-School Programs</Text>
                  </View>
                  <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
                    <MaterialCommunityIcons name="account-school-outline" size={80} color="white" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleQuickAction('postActivity')}
                style={{ width: '48%', borderRadius: 16, overflow: 'hidden', shadowColor: '#D97706', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 12 }}
              >
                <LinearGradient
                  colors={theme === 'dark' ? ['#92400E', '#78350F'] : ['#F59E0B', '#D97706']}
                  style={{ padding: 20, height: 150, justifyContent: 'space-between' }}
                >
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', padding: 10, borderRadius: 12 }}>
                    <MaterialCommunityIcons name="star-face" size={24} color="white" />
                  </View>
                  <View>
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 }}>Kids Feed</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '700', marginTop: 3, textTransform: 'uppercase', letterSpacing: 1.5 }}>Moments & Highlights</Text>
                  </View>
                  <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
                    <MaterialCommunityIcons name="image-multiple-outline" size={80} color="white" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleQuickAction('pettyCash')}
              style={{ borderRadius: 16, overflow: 'hidden', shadowColor: '#0D9488', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 12 }}
            >
              <LinearGradient
                colors={theme === 'dark' ? ['#0f766e', '#134e4a'] : ['#14B8A6', '#0D9488']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, marginBottom: 8 }}>
                    <Text style={{ color: 'white', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 }}>Cash Management</Text>
                  </View>
                  <Text style={{ color: 'white', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 }}>Petty Cash</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700', marginTop: 2 }}>Track add & expense funds 💰</Text>
                </View>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.3)', padding: 14, borderRadius: 20 }}>
                  <MaterialCommunityIcons name="wallet-outline" size={36} color="white" />
                </View>
                <View style={{ position: 'absolute', bottom: -18, right: -10, opacity: 0.1 }}>
                  <MaterialCommunityIcons name="cash-multiple" size={110} color="white" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={{ height: 128 }} />
        </View>
      </ScrollView>
    </View>
  );
}
