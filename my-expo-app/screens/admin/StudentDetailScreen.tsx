import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Linking, Alert, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

interface StudentDetailScreenProps {
  navigation: NavigationProps;
  route: { params: { studentId: string } };
}

export default function StudentDetailScreen({ navigation, route }: StudentDetailScreenProps) {
  const { users, user, fees: allFees, fetchData } = useAuth();
  const { colors, theme } = useTheme();
  const { studentId } = route.params;
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } catch (error) {
      console.error('Refresh Error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

  const student = users.find(u => u.id === studentId);

  // ── Smart Financial Logic (Synced with Student Home) ──
  const { financialStatus, totalPending } = React.useMemo(() => {
    if (!student) return { financialStatus: null, totalPending: 0 };
    
    const dbId = student.id?.toString();
    const schoolId = student.studentId?.toString();
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Academic Year Logic
    const d = new Date();
    const monthYearCode = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    const studentFees = allFees.filter(f => 
      (f.student_id?.toString() === dbId || f.student_id?.toString() === schoolId)
    );

    const unpaidFees = studentFees.filter(f => f.status === 'unpaid');
    const currentMonthPaid = studentFees.find(f => 
       f.date?.includes(monthYearCode) && f.status === 'paid'
    );
    const currentMonthBilled = studentFees.find(f => f.date?.includes(monthYearCode));

    // Cumulative Overdue
    let hasAnyOverdue = unpaidFees.some(f => f.due_date && f.due_date < todayStr);
    
    // Virtual Overdue
    if (!hasAnyOverdue && !currentMonthPaid && !currentMonthBilled) {
       const dueDayNum = parseInt(student.fee_due_day || '5');
       if (new Date().getDate() > dueDayNum) {
          hasAnyOverdue = true;
       }
    }

    const isPending = unpaidFees.length > 0 || (!currentMonthPaid && (student.fees && parseInt(student.fees) > 0));
    
    // Calculate total
    const dbUnpaidAmount = unpaidFees.reduce((sum, f) => sum + (f.amount || 0), 0);
    let extra = 0;
    if (!currentMonthBilled && student.fees && parseInt(student.fees) > 0) {
       extra = parseInt(student.fees);
    }
    const total = dbUnpaidAmount + extra;

    return {
      financialStatus: {
        isOverdue: hasAnyOverdue,
        isPending,
        isPaid: !isPending && currentMonthPaid,
        title: hasAnyOverdue ? 'Overdue Balance' : (isPending ? 'Pending Dues' : 'Account Clear')
      },
      totalPending: total
    };
  }, [student, allFees]);

  if (!student) {
    return (
      <SafeAreaView className={`flex-1 ${colors.background} items-center justify-center`}>
        <View className="items-center px-10">
          <MaterialCommunityIcons name="account-search-outline" size={80} color={colors.textTertiary} />
          <Text className={`text-xl font-bold ${colors.text} mt-4 text-center`}>Student not found</Text>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            className="mt-8 bg-brand-pink px-8 py-4 rounded-3xl shadow-lg"
          >
            <Text className="text-white font-black">BACK TO LIST</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderInfoRow = (label: string, value: string | undefined, icon: string, color: string = colors.textTertiary, isPhone: boolean = false, photo?: string) => (
    <View className="mb-8 w-full">
      <View className="flex-row items-start">
        <View className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} w-12 h-12 rounded-2xl items-center justify-center mr-4 shadow-sm overflow-hidden`}>
          {photo ? (
            <Image source={{ uri: photo }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <MaterialCommunityIcons name={icon as any} size={24} color={color} />
          )}
        </View>
        <View className="flex-1">
          <Text className={`text-[10px] font-black uppercase tracking-[2px] ${colors.textTertiary} mb-1`}>{label}</Text>
          <View className="flex-row items-center justify-between">
            <Text className={`text-lg font-bold ${colors.text} flex-1 mr-2`} style={{ lineHeight: 24 }}>
              {value || 'Not provided'}
            </Text>
            {isPhone && value && (
              <TouchableOpacity 
                onPress={() => Linking.openURL(`tel:${value}`)}
                className="bg-green-500 w-10 h-10 rounded-full items-center justify-center shadow-md shadow-green-200"
              >
                <MaterialCommunityIcons name="phone" size={18} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className={`flex-1 ${colors.background}`}>
      <ScrollView 
        className="flex-1" 
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
        {/* Profile Header */}
        <View className="px-6 pt-4 pb-12 w-full">
          {/* Navigation Bar */}
          <View className="flex-row items-center justify-between mb-8 w-full">
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              className={`${colors.surface} w-12 h-12 rounded-2xl items-center justify-center border ${colors.border} shadow-sm`}
            >
              <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
            </TouchableOpacity>
            {user?.role !== 'teacher' && (
              <TouchableOpacity 
                onPress={() => navigation.navigate('profile', { studentId: student.id })}
                className={`bg-brand-yellow px-6 h-12 rounded-2xl items-center justify-center shadow-lg border-2 ${theme === 'dark' ? 'border-gray-800' : 'border-white'}`}
              >
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="pencil" size={18} color="#92400E" />
                  <Text className="text-amber-900 font-black ml-2 uppercase text-xs tracking-widest">Edit</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Profile Card - Fixed Image Container and Tag Position */}
          <View className="items-center justify-center w-full">
            <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {/* Main Photo Circle */}
              <View 
                className={`bg-brand-pink border-4 ${theme === 'dark' ? 'border-gray-800' : 'border-white'} shadow-2xl overflow-hidden`} 
                style={{ width: 192, height: 192, borderRadius: 96, alignItems: 'center', justifyContent: 'center' }}
              >
                {student.avatar ? (
                  <Image source={{ uri: student.avatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <MaterialCommunityIcons name="account" size={100} color="white" />
                )}
              </View>
              
              {/* Verified Badge - Positioned perfectly at bottom right of the circle */}
              <View 
                className={`absolute bg-green-500 items-center justify-center border-4 ${theme === 'dark' ? 'border-gray-800' : 'border-white'} shadow-lg z-20`}
                style={{ 
                  width: 52, 
                  height: 52, 
                  borderRadius: 26, 
                  bottom: 8, 
                  right: 8 
                }}
              >
                <MaterialCommunityIcons name="check-decagram" size={26} color="white" />
              </View>
            </View>

            <Text className="text-4xl font-black mt-8 tracking-tighter text-center" style={{ color: theme === 'dark' ? '#FFFFFF' : '#111827' }}>{student.name}</Text>
            
            <View className="flex-row items-center mt-3 gap-2">
              <View className="bg-brand-pink/10 px-6 py-2 rounded-full border border-brand-pink/20 flex-row items-center">
                <MaterialCommunityIcons name="tag-outline" size={16} color="#F59E0B" />
                <Text className="text-brand-pink font-black text-xs ml-2 uppercase tracking-[3px]">{student.studentId}</Text>
              </View>
              
              {/* Live Status Chip */}
              <View className={`${financialStatus?.isOverdue ? 'bg-red-500' : (financialStatus?.isPending ? 'bg-amber-500' : 'bg-green-500')} px-6 py-2 rounded-full shadow-md`}>
                <Text className="text-white font-black text-[10px] uppercase tracking-widest">
                  {financialStatus?.isOverdue ? 'CRITICAL: OVERDUE' : (financialStatus?.isPending ? 'FEE PENDING' : 'SECURE: PAID')}
                </Text>
              </View>
            </View>

            {/* Financial Summary Card (Cumulative) */}
            <View 
               className={`mt-10 w-full overflow-hidden rounded-[40px] border-2 ${financialStatus?.isOverdue ? 'border-red-500/20 bg-red-500/5' : (financialStatus?.isPending ? 'border-amber-500/20 bg-amber-500/5' : 'border-green-500/20 bg-green-500/5')}`}
            >
              <View className="p-6 flex-row items-center justify-between">
                 <View>
                    <Text className={`text-[9px] font-black uppercase tracking-widest ${financialStatus?.isOverdue ? 'text-red-600' : (financialStatus?.isPending ? 'text-amber-600' : 'text-green-600')}`}>
                      {financialStatus?.title}
                    </Text>
                    <Text className={`text-2xl font-black ${colors.text} tracking-tighter mt-1`}>
                      ₹{totalPending.toLocaleString()}
                    </Text>
                 </View>
                 <View className={`w-14 h-14 rounded-2xl items-center justify-center ${financialStatus?.isOverdue ? 'bg-red-500' : (financialStatus?.isPending ? 'bg-amber-500' : 'bg-green-500')}`}>
                    <MaterialCommunityIcons 
                      name={financialStatus?.isOverdue ? 'cash-remove' : (financialStatus?.isPending ? 'cash-clock' : 'cash-check')} 
                      size={28} 
                      color="white" 
                    />
                 </View>
              </View>
            </View>
          </View>
        </View>

        {/* Info Content */}
        <View className="px-6 pb-24 w-full">
          {/* General Information Card */}
          <View className={`${colors.surface} rounded-[48px] p-8 shadow-xl border ${colors.border} mb-8 w-full`}>
            <View className="flex-row items-center mb-10">
              <View className="w-8 h-1 bg-brand-pink rounded-full mr-3" />
              <Text className="text-brand-pink font-black text-lg uppercase tracking-widest">General Info</Text>
            </View>
            
            {renderInfoRow('Category', student.category, 'school', '#3B82F6')}
            {renderInfoRow('Blood Group', student.bloodGroup, 'water', '#EF4444')}
            {renderInfoRow('Admission Date', student.admissionDate, 'calendar-star', '#F59E0B')}
            {renderInfoRow('Monthly Fees', student.fees, 'cash-multiple', '#10B981')}
            {renderInfoRow('Monthly Due Day', student.fee_due_day ? `Day ${student.fee_due_day} of every month` : undefined, 'calendar-clock', '#FBBF24')}
            {renderInfoRow('Full Address', student.address, 'map-marker', '#F59E0B')}
          </View>

          {/* Family Contact Card */}
          <View className={`${colors.surface} rounded-[48px] p-8 shadow-xl border ${colors.border} w-full`}>
            <View className="flex-row items-center mb-10">
              <View className="w-8 h-1 bg-blue-500 rounded-full mr-3" />
              <Text className="text-blue-500 font-black text-lg uppercase tracking-widest">Family & Contacts</Text>
            </View>
            
            <View className="mb-2">
              <Text className={`font-bold text-[10px] uppercase mb-8 ml-1 tracking-[4px] ${theme === 'dark' ? colors.textTertiary : 'text-gray-400'}`}>Paternal Records</Text>
              {renderInfoRow('Father Name', student.fatherName, 'account-tie', colors.textSecondary, false, student.fatherPhoto)}
              {renderInfoRow('Father Phone', student.fatherPhone, 'phone', '#22C55E', true)}
            </View>

            <View className={`pt-8 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'} mb-2`}>
              <Text className={`font-bold text-[10px] uppercase mb-8 ml-1 tracking-[4px] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Maternal Records</Text>
              {renderInfoRow('Mother Name', student.motherName, 'account-outline', colors.textSecondary, false, student.motherPhoto)}
              {renderInfoRow('Mother Phone', student.motherPhone, 'phone', '#22C55E', true)}
            </View>

            <View className={`pt-8 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
              <Text className={`font-bold text-[10px] uppercase mb-8 ml-1 tracking-[4px] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Legal Guardian</Text>
              {renderInfoRow('Guardian Name', student.parentName, 'account-group', colors.textSecondary, false, student.guardianPhoto)}
              {renderInfoRow('Guardian Phone', student.guardianPhone, 'phone', '#22C55E', true)}
            </View>
          </View>
        </View>
        <View className="h-32" />
      </ScrollView>
    </SafeAreaView>
  );
}
