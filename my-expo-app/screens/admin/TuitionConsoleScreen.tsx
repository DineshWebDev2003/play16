import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import BranchFilter from '../../components/BranchFilter';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface TuitionConsoleScreenProps {
  navigation: NavigationProps;
}

const tuitionActions = [
  { label: 'Post Homework', screen: 'postHomework', icon: 'book-plus', color: '#8B5CF6', desc: 'Assignments & tasks' },
  { label: 'Post Progress', screen: 'tuitionPostProgress', icon: 'chart-line', color: '#10B981', desc: 'Student progress' },
  { label: 'Take Attendance', screen: 'tuitionAttendance', icon: 'calendar-check', color: '#F59E0B', desc: 'Tuition attendance' },
  { label: 'View Submissions', screen: 'viewSubmissions', icon: 'clipboard-list', color: '#3B82F6', desc: 'Check assignments' },
  { label: 'Messages', screen: 'nannyChat', icon: 'microphone-message', color: '#06B6D4', desc: 'Chat with nannies' },
  { label: 'Manage Users', screen: 'manageTuitionUsers', icon: 'account-group', color: '#14B8A6', desc: 'Create & manage tuition users' },
  { label: 'Study Materials', screen: 'tuitionStudyMaterials', icon: 'book-open-variant', color: '#F97316', desc: 'Upload resources' },
  { label: 'Tests & Marks', screen: 'tuitionPostProgress', icon: 'clipboard-check', color: '#A855F7', desc: 'Assessments' },
];

export default function TuitionConsoleScreen({ navigation }: TuitionConsoleScreenProps) {
  const { user, users } = useAuth();
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  const isSchoolAdmin = user?.role === 'admin';

  const branchUsers = useMemo(() => {
    if (user?.role !== 'master_admin') return users;
    if (!selectedBranchId) return users;
    return users.filter(u => u.branch_id === selectedBranchId);
  }, [users, selectedBranchId, user?.role]);

  const tuitionStudentCount = useMemo(() => branchUsers.filter(u => u.role === 'tuition_student' && u.status === 'active').length, [branchUsers]);
  const tuitionTeacherCount = useMemo(() => branchUsers.filter(u => u.role === 'tuition_teacher' && u.status === 'active').length, [branchUsers]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-4">
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-1">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="mb-4 bg-white border-2 border-amber-200 w-12 h-12 rounded-2xl items-center justify-center"
              >
                <MaterialCommunityIcons name="arrow-left" size={28} color="#000" />
              </TouchableOpacity>
              <Text className="text-4xl font-black tracking-tighter text-gray-900">Tuition</Text>
              <Text className="text-2xl font-bold text-amber-400 mt-[-4px]">Console 🎯</Text>
            </View>
            <View className="bg-pink-500 w-16 h-16 rounded-3xl items-center justify-center shadow-lg shadow-pink-200">
              <MaterialCommunityIcons name="school" size={32} color="white" />
            </View>
          </View>

          {user?.role === 'master_admin' && (
            <View className="mb-6">
              <BranchFilter selectedBranchId={selectedBranchId} onSelect={setSelectedBranchId} />
            </View>
          )}

          <View className="flex-row gap-3 mb-8">
            <View style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }} className="flex-1 p-5 rounded-[28px] border overflow-hidden">
              <View className="flex-row items-center justify-between mb-4">
                <View style={{ backgroundColor: '#F59E0B' }} className="w-12 h-12 rounded-2xl items-center justify-center shadow-lg shadow-amber-200">
                  <MaterialCommunityIcons name="account-tie" size={24} color="white" />
                </View>
                <MaterialCommunityIcons name="human-male-board" size={34} color="#FCD34D" />
              </View>
              <Text className="text-4xl font-black tracking-tighter text-gray-900">{tuitionTeacherCount}</Text>
              <Text className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mt-1">Tuition Teachers</Text>
              <Text className="text-[9px] font-bold text-gray-400 mt-0.5">Active instructors</Text>
            </View>
            <View style={{ backgroundColor: '#FDF2F8', borderColor: '#FBCFE8' }} className="flex-1 p-5 rounded-[28px] border overflow-hidden">
              <View className="flex-row items-center justify-between mb-4">
                <View style={{ backgroundColor: '#EC4899' }} className="w-12 h-12 rounded-2xl items-center justify-center shadow-lg shadow-pink-200">
                  <MaterialCommunityIcons name="account-school" size={24} color="white" />
                </View>
                <MaterialCommunityIcons name="school" size={34} color="#F9A8D4" />
              </View>
              <Text className="text-4xl font-black tracking-tighter text-gray-900">{tuitionStudentCount}</Text>
              <Text className="text-[10px] font-bold uppercase tracking-widest text-pink-600 mt-1">Tuition Students</Text>
              <Text className="text-[9px] font-bold text-gray-400 mt-0.5">Enrolled learners</Text>
            </View>
          </View>

          <View className="flex-row items-center mb-4">
            <View className="bg-purple-100 p-2 rounded-xl mr-3">
              <MaterialCommunityIcons name="school" size={20} color="#8B5CF6" />
            </View>
            <Text className="text-gray-900 text-lg font-black tracking-tight">Tuition Management</Text>
          </View>
          <View className="flex-row flex-wrap justify-between">
            {tuitionActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.9}
                onPress={() => navigation.navigate(action.screen)}
                style={{ width: '48%', marginBottom: 16 }}
                className="rounded-2xl overflow-hidden shadow-lg"
              >
                <View style={{ backgroundColor: action.color, borderRadius: 16, padding: 20, minHeight: 144, justifyContent: 'space-between' }}>
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

          <View className="bg-purple-50 rounded-2xl p-4 border border-purple-100 mb-4">
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="information-outline" size={18} color="#8B5CF6" />
              <Text className="text-purple-700 text-xs font-bold ml-2 flex-1">
                Full tuition management access — post homework, track progress, take attendance, and communicate with parents.
              </Text>
            </View>
          </View>
        </View>
        <View className="h-32" />
      </ScrollView>
    </SafeAreaView>
  );
}
