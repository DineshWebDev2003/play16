import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface ViewSubmissionsScreenProps {
  navigation: NavigationProps;
}

export default function ViewSubmissionsScreen({ navigation }: ViewSubmissionsScreenProps) {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);

  const batches = ['All Classes', 'Morning Batch', 'Evening Batch', 'Weekend Batch'];

  const onDateChange = (_: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) setSelectedDate(date);
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-4 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mb-4 bg-white border-2 border-amber-200 w-12 h-12 rounded-2xl items-center justify-center" activeOpacity={0.7}>
              <MaterialCommunityIcons name="arrow-left" size={28} color="#000" />
            </TouchableOpacity>
            <Text className="text-4xl font-black text-gray-900 tracking-tighter">View</Text>
            <Text className="text-2xl font-bold text-amber-400">Submissions</Text>
          </View>
          <View className="bg-pink-500 w-16 h-16 rounded-3xl items-center justify-center">
            <MaterialCommunityIcons name="clipboard-check" size={32} color="white" />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Filter Card */}
        <View className={`${isDark ? 'bg-gray-800/60 border-gray-700/50' : 'bg-white border-amber-100/50'} rounded-3xl p-5 border mb-5`}>
          <View className="flex-row items-center mb-4">
            <View className="w-9 h-9 rounded-xl bg-pink-100 items-center justify-center mr-3">
              <MaterialCommunityIcons name="calendar-filter" size={18} color="#EC4899" />
            </View>
            <View>
              <Text className={`font-black text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Filter Submissions</Text>
              <Text className={`text-[11px] font-semibold mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Select date and class</Text>
            </View>
          </View>

          {/* Date Picker */}
          <TouchableOpacity activeOpacity={0.7} onPress={() => setShowDatePicker(true)}
            className={`flex-row items-center px-4 rounded-2xl border mb-3 ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-amber-50 border-amber-100'}`}
            style={{ height: 52 }}>
            <MaterialCommunityIcons name="calendar" size={18} color="#EC4899" />
            <Text className={`flex-1 font-bold text-sm ml-2.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatDate(selectedDate)}</Text>
            <MaterialCommunityIcons name="chevron-down" size={18} color={isDark ? '#6B7280' : '#9CA3AF'} />
          </TouchableOpacity>

          {/* Batch Dropdown */}
          <TouchableOpacity activeOpacity={0.7}
            className={`flex-row items-center px-4 rounded-2xl border ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-amber-50 border-amber-100'}`}
            style={{ height: 52 }}>
            <MaterialCommunityIcons name="google-classroom" size={18} color="#EC4899" />
            <Text className={`flex-1 font-bold text-sm ml-2.5 ${selectedBatch ? (isDark ? 'text-white' : 'text-gray-900') : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {selectedBatch || 'Select Class'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={18} color={isDark ? '#6B7280' : '#9CA3AF'} />
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker value={selectedDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onDateChange} />
        )}

        {/* Empty State */}
        <View className="py-16 items-center">
          <View className="w-20 h-20 rounded-3xl bg-pink-100 items-center justify-center mb-5">
            <MaterialCommunityIcons name="clipboard-text-outline" size={40} color="#EC4899" />
          </View>
          <Text className={`font-black text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>No Submissions Yet</Text>
          <Text className={`text-sm font-semibold mt-2 text-center max-w-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Submissions will appear here once students start submitting their homework.
          </Text>
        </View>
        <View className="h-16" />
      </ScrollView>
    </SafeAreaView>
  );
}
