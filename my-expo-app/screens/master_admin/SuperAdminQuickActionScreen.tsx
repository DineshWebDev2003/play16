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

export default function SuperAdminQuickActionScreen({ navigation }: Props) {
  const { user } = useAuth();

  const actions = [
    { label: 'Manage Branches', screen: 'branchManagement', icon: 'domain', color: '#F59E0B', desc: 'Create & manage franchise branches' },
    { label: 'Live Monitoring', screen: 'liveCamera', icon: 'broadcast', color: '#EF4444', desc: 'Secure surveillance' },
    { label: 'User Management', screen: 'userManagementV2', icon: 'account-multiple', color: '#3B82F6', desc: 'Add/edit users across branches' },
    { label: 'Announcements', screen: 'announcements', icon: 'bullhorn', color: '#F59E0B', desc: 'Post global announcements' },
    { label: 'Fees Management', screen: 'feesManagement', icon: 'cash-register', color: '#10B981', desc: 'View all fee records' },
    { label: 'Income/Expense', screen: 'incomeExpense', icon: 'finance', color: '#6366F1', desc: 'Financial transactions' },
    { label: 'Backup & Restore', screen: 'backup', icon: 'backup-restore', color: '#14B8A6', desc: 'Data backup management' },
    { label: 'Student Info', screen: 'studentInfo', icon: 'account-details', color: '#3B82F6', desc: 'View all student profiles' },
    { label: 'Post Activity', screen: 'postActivity', icon: 'creation', color: '#D97706', desc: 'Post student activities with branch selection' },
  ];

  return (
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-12 pb-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-xs font-bold uppercase tracking-widest text-gray-400">
                All Admin Access
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
                style={{ width: action.label === 'Post Activity' ? '100%' : '48%', marginBottom: 16 }}
                className="rounded-2xl shadow-lg"
              >
                <View style={{ backgroundColor: action.color, borderRadius: 16, padding: 20, minHeight: 150, justifyContent: 'space-between' }}>
                  <View className="flex-row justify-between items-start">
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 16 }}>
                      <MaterialCommunityIcons name={action.icon as any} size={24} color="white" />
                    </View>
                  </View>
                  <View>
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 }}>{action.label}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 }}>{action.desc}</Text>
                  </View>
                  <View style={{ position: 'absolute', bottom: 0, right: 0, opacity: 0.1 }}>
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
