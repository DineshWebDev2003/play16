import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, Modal,
  ActivityIndicator, TextInput, KeyboardAvoidingView, Platform,
  FlatList, Image, Animated, Easing
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import api from '../../services/api';

const DAYS = [
  { label: 'Monday', index: 0 },
  { label: 'Tuesday', index: 1 },
  { label: 'Wednesday', index: 2 },
  { label: 'Thursday', index: 3 },
  { label: 'Friday', index: 4 },
  { label: 'Saturday', index: 5 }
];

// ─── Custom Time Picker (Native Clock Style) ──────────────────────────────
const TimeSelector = ({ visible, onClose, onConfirm, initialTime, title }: any) => {
  const parseTime = (t: string) => {
    const m = t?.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!m) return new Date();
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    let hour24 = h;
    if (m[3] === 'PM' && h !== 12) hour24 = h + 12;
    if (m[3] === 'AM' && h === 12) hour24 = 0;
    const d = new Date();
    d.setHours(hour24, min, 0, 0);
    return d;
  };

  const [date, setDate] = useState(parseTime(initialTime));

  const onChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleConfirm = () => {
    const h = date.getHours();
    const m = date.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    onConfirm(`${hour12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`);
    onClose();
  };

  if (!visible) return null;

  if (Platform.OS === 'android') {
    return (
      <DateTimePicker
        value={date}
        mode="time"
        is24Hour={false}
        onChange={(event, selectedDate) => {
          if (event.type === 'dismissed') {
            onClose();
            return;
          }
          if (selectedDate) {
            const h = selectedDate.getHours();
            const m = selectedDate.getMinutes();
            const ampm = h >= 12 ? 'PM' : 'AM';
            const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
            onConfirm(`${hour12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`);
            onClose();
          }
        }}
      />
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/80 items-center justify-center px-6">
        <View className="bg-white dark:bg-[#1a1a18] w-full rounded-[45px] p-8 shadow-2xl overflow-hidden border border-white/10">
          <View className="absolute top-0 right-0 opacity-5">
             <MaterialCommunityIcons name="clock-digital" size={150} color="#6366F1" />
          </View>
          <Text className="text-2xl font-black text-gray-900 dark:text-white mb-8 text-center tracking-tighter">{title}</Text>
          
          <View className="items-center mb-6">
            <DateTimePicker
              value={date}
              mode="time"
              is24Hour={false}
              display="spinner"
              onChange={onChange}
            />
          </View>

          <View className="flex-row gap-4 mt-4">
             <TouchableOpacity onPress={onClose} className="flex-1 py-5 rounded-3xl border border-gray-100 dark:border-white/10 items-center">
                <Text className="font-black text-gray-400 uppercase tracking-widest text-xs">Cancel</Text>
             </TouchableOpacity>
             <TouchableOpacity 
                onPress={handleConfirm} 
                className="flex-[1.5] bg-indigo-600 py-5 rounded-3xl items-center shadow-xl shadow-indigo-600/20"
             >
                <Text className="text-white font-black uppercase tracking-widest text-xs">Set Time</Text>
             </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function TimetableScreen({ navigation }: any) {
  const { user, fetchData } = useAuth();
  const { colors, theme: appTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = appTheme === 'dark';

  const todayIdx = new Date().getDay() === 0 ? 0 : new Date().getDay() - 1;
  const [selectedDayIdx, setSelectedDayIdx] = useState(todayIdx > 5 ? 0 : todayIdx);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any>(null);
  
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('10:00 AM');
  const [activity, setActivity] = useState('');
  const [room, setRoom] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('book-outline');
  const [selectedColor, setSelectedColor] = useState('bg-indigo-500');

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  
  const ICONS = [
    'book-outline', 'brush-outline', 'music-note-outline', 'flask-outline', 
    'palette-outline', 'translate', 'calculator-variant-outline', 
    'basketball', 'image-multiple-outline', 'emoticon-happy-outline',
    'toy-brick-outline', 'puzzle-outline'
  ];

  const COLORS = [
    { name: 'Indigo', class: 'bg-indigo-500', hex: '#6366F1' },
    { name: 'Blue', class: 'bg-blue-500', hex: '#3B82F6' },
    { name: 'Pink', class: 'bg-pink-500', hex: '#EC4899' },
    { name: 'Red', class: 'bg-red-500', hex: '#EF4444' },
    { name: 'Orange', class: 'bg-orange-500', hex: '#F59E0B' },
    { name: 'Green', class: 'bg-green-500', hex: '#10B981' },
    { name: 'Purple', class: 'bg-purple-500', hex: '#F59E0B' }
  ];

  const selectedColorHex = COLORS.find(c => c.class === selectedColor)?.hex || '#6366F1';
  
  const [timetable, setTimetable] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDayPickerOpen, setIsDayPickerOpen] = useState(false);

  const fetchTimetable = useCallback(async () => {
    try {
      const response = await api.get('/timetable');
      const data = response.data?.data || (Array.isArray(response.data) ? response.data : []);
      setTimetable(data);
    } catch (err) {
      console.error('Fetch Timetable Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  const timeToMinutes = useCallback((t: string) => {
    if (!t) return 0;
    const parts = t.trim().split(' ');
    if (parts.length < 2) return 0;
    const [time, period] = parts;
    const timeParts = time.split(':');
    let h = parseInt(timeParts[0]) || 0;
    let m = parseInt(timeParts[1]) || 0;
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }, []);

  const daySchedule = useMemo(() => {
    if (!timetable) return [];
    const list = timetable.filter((slot: any) => {
      const slotDay = typeof slot.day === 'string' ? parseInt(slot.day) : slot.day;
      return slotDay === selectedDayIdx;
    });

    return [...list].sort((a, b) => {
        const timeA = timeToMinutes(a.time.split(' - ')[0]);
        const timeB = timeToMinutes(b.time.split(' - ')[0]);
        return timeA - timeB;
    });
  }, [timetable, selectedDayIdx, timeToMinutes]);

  const handleApply = async () => {
    if (!activity.trim() || !room.trim()) {
      return Alert.alert('Attention', 'Fill all fields');
    }
    setIsSubmitting(true);
    try {
      const data = {
        day: selectedDayIdx,
        time: `${startTime} - ${endTime}`,
        activity,
        room,
        icon: selectedIcon,
        color: selectedColor
      };
      
      if (editingSlot) {
        await api.put(`/timetable/${editingSlot.id}`, data);
      } else {
        await api.post('/timetable', data);
      }
      
      await fetchTimetable();
      await fetchData();
      setIsModalOpen(false);
      resetForm();
    } catch (e) {
      Alert.alert('Error', 'Failed to save slot');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setActivity(''); setRoom(''); setEditingSlot(null);
    setStartTime('09:00 AM'); setEndTime('10:00 AM');
    setSelectedIcon('book-outline'); setSelectedColor('bg-indigo-500');
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Slot?', 'Are you sure?', [
        { text: 'No' },
        { text: 'Yes, Remove', style: 'destructive', onPress: async () => {
            try {
                await api.delete(`/timetable/${id}`);
                await fetchTimetable();
                await fetchData();
            } catch (e) { Alert.alert('Error', 'Delete failed'); }
        }}
    ]);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: '#FFFFFF' }}>
      <View className="flex-1">
        {/* Header */}
        <View style={{ paddingTop: Math.max(insets.top, 20) }} className="px-6 pb-6">
          <View className="flex-row items-center justify-between">
            <View>
               <TouchableOpacity 
                 onPress={() => navigation.goBack()}
                 className={`w-12 h-12 rounded-2xl items-center justify-center border mb-6 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-indigo-100 shadow-sm'}`}
               >
                 <MaterialCommunityIcons name="arrow-left" size={24} color={isDark ? '#FFF' : '#6366F1'} />
               </TouchableOpacity>
               <Text className={`text-4xl font-black tracking-tighter ${colors.text}`}>Daily</Text>
               <Text className="text-2xl font-bold text-brand-pink mt-[-4px]">Schedule 📅</Text>
            </View>
            <View className="bg-indigo-600 w-20 h-20 rounded-[28px] items-center justify-center border-4 border-white shadow-2xl rotate-3 overflow-hidden">
               <MaterialCommunityIcons name="calendar-clock" size={40} color="white" />
            </View>
          </View>
        </View>

        {/* Day Selector (Dropdown Style) */}
        <View className="px-6 mb-8">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsDayPickerOpen(true)}
            className={`flex-row items-center justify-between p-5 rounded-[30px] border-2 ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-indigo-50 shadow-xl'}`}
            style={{ elevation: 4 }}
          >
            <View className="flex-row items-center">
               <View className="bg-indigo-600 w-12 h-12 rounded-2xl items-center justify-center mr-4 shadow-lg shadow-indigo-600/20">
                  <MaterialCommunityIcons name="calendar-today" size={24} color="white" />
               </View>
               <View>
                  <Text className={`text-[10px] font-black uppercase tracking-[3px] ${colors.textTertiary} mb-0.5`}>Schedule For</Text>
                  <Text className={`text-xl font-black ${colors.text} tracking-tighter`}>{DAYS[selectedDayIdx].label}</Text>
               </View>
            </View>
            <View className={`w-10 h-10 rounded-xl items-center justify-center ${isDark ? 'bg-white/5' : 'bg-indigo-50'}`}>
                <MaterialCommunityIcons name="chevron-down" size={24} color={isDark ? '#FFF' : '#6366F1'} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Day Selection Modal */}
        <Modal visible={isDayPickerOpen} transparent animationType="fade">
            <View className="flex-1 bg-black/80 items-center justify-center px-8">
                <View className={`${isDark ? 'bg-[#1a1a18]' : 'bg-white'} w-full rounded-[45px] p-8 shadow-2xl overflow-hidden border border-white/10`}>
                    <View className="absolute top-0 right-0 opacity-5">
                       <MaterialCommunityIcons name="calendar-multiselect" size={150} color="#6366F1" />
                    </View>
                    
                    <Text className={`text-3xl font-black ${colors.text} text-center mb-8 tracking-tighter`}>Choose Day</Text>
                    
                    <View className="gap-3">
                        {DAYS.map((day) => (
                            <TouchableOpacity
                                key={day.index}
                                activeOpacity={0.7}
                                onPress={() => { 
                                    setSelectedDayIdx(day.index); 
                                    setIsDayPickerOpen(false); 
                                }}
                                className={`p-5 rounded-[24px] flex-row items-center justify-between border-2 ${selectedDayIdx === day.index ? 'bg-indigo-600 border-indigo-600 shadow-lg' : (isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100')}`}
                            >
                                <View className="flex-row items-center">
                                    <View className={`w-8 h-8 rounded-lg items-center justify-center mr-4 ${selectedDayIdx === day.index ? 'bg-white/20' : 'bg-indigo-500/10'}`}>
                                        <Text className={`font-black text-xs ${selectedDayIdx === day.index ? 'text-white' : 'text-indigo-600'}`}>{day.label.charAt(0)}</Text>
                                    </View>
                                    <Text className={`font-black uppercase tracking-[2px] text-xs ${selectedDayIdx === day.index ? 'text-white' : colors.text}`}>
                                        {day.label}
                                    </Text>
                                </View>
                                {selectedDayIdx === day.index && (
                                    <MaterialCommunityIcons name="check-circle" size={20} color="white" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                    
                    <TouchableOpacity 
                        activeOpacity={0.8}
                        onPress={() => setIsDayPickerOpen(false)}
                        className="mt-8 bg-brand-pink/10 py-5 rounded-[24px] items-center"
                    >
                        <Text className="text-brand-pink font-black uppercase tracking-widest text-[10px]">Dismiss Selection</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

        {/* Timeline */}
        <View className="flex-1 px-6">
           {isLoading ? (
               <View className="flex-1 items-center justify-center">
                   <ActivityIndicator size="large" color="#6366F1" />
               </View>
           ) : daySchedule.length === 0 ? (
               <View className="flex-1 items-center justify-center opacity-30 pb-20">
                   <MaterialCommunityIcons name="calendar-blank-outline" size={80} color={colors.text} />
                   <Text className={`font-black uppercase tracking-[5px] ${colors.text} mt-4 text-xs text-center`}>No Lectures Programmed</Text>
               </View>
           ) : (
               <FlatList
                   data={daySchedule}
                   keyExtractor={(item) => item.id.toString()}
                   showsVerticalScrollIndicator={false}
                   contentContainerStyle={{ paddingBottom: 100 }}
                   renderItem={({ item }) => (
                       <View className="flex-row mb-8">
                           {/* Time Pin */}
                           <View className="items-center mr-6">
                               <View className="bg-indigo-500 w-3 h-3 rounded-full shadow-lg shadow-indigo-500/50" />
                               <View className="w-0.5 flex-1 bg-indigo-500/10 dark:bg-white/5 my-2" />
                           </View>
                           
                           {/* Card */}
                           <View 
                               className={`${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-50 shadow-md'} flex-1 p-6 rounded-[36px] border flex-row items-center justify-between`}
                           >
                               <View className="flex-1">
                                   <Text className="text-brand-pink font-black text-[10px] uppercase tracking-[2px] mb-1.5">{item.time}</Text>
                                   <View className="flex-row items-center">
                                       <View className={`${item.color || 'bg-indigo-500'} w-10 h-10 rounded-2xl items-center justify-center mr-3`}>
                                          <MaterialCommunityIcons name={(item.icon || 'book-outline') as any} size={20} color="white" />
                                       </View>
                                       <Text className={`text-xl font-black ${colors.text} tracking-tight`} numberOfLines={1}>{item.activity}</Text>
                                    </View>
                                    <View className="flex-row items-center mt-2 ml-13">
                                        {item.room && (
                                            <>
                                                <MaterialCommunityIcons name="door-open" size={14} color={colors.textTertiary} />
                                                <Text className={`text-[10px] font-bold ${colors.textTertiary} ml-1`}>Room: {item.room}</Text>
                                            </>
                                        )}
                                    </View>
                               </View>
                               {user?.role === 'admin' && (
                                   <View className="flex-row gap-2">
                                       <TouchableOpacity 
                                          onPress={() => { 
                                               setEditingSlot(item); 
                                               setActivity(item.activity); 
                                               setRoom(item.room); 
                                               const times = item.time.split(' - ');
                                               if (times.length === 2) {
                                                   setStartTime(times[0]);
                                                   setEndTime(times[1]);
                                               } else {
                                                   setStartTime(item.time);
                                               }
                                               setSelectedIcon(item.icon || 'book-outline');
                                               setSelectedColor(item.color || 'bg-indigo-500');
                                               setIsModalOpen(true); 
                                           }}
                                          className="w-10 h-10 bg-indigo-50 dark:bg-white/5 rounded-xl items-center justify-center border border-indigo-100 dark:border-white/10"
                                       >
                                           <MaterialCommunityIcons name="pencil" size={18} color="#6366F1" />
                                       </TouchableOpacity>
                                       <TouchableOpacity 
                                          onPress={() => handleDelete(item.id)}
                                          className="w-10 h-10 bg-red-50 dark:bg-white/5 rounded-xl items-center justify-center border border-red-100 dark:border-white/10"
                                       >
                                           <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
                                       </TouchableOpacity>
                                   </View>
                               )}
                           </View>
                       </View>
                   )}
               />
           )}
        </View>

        {/* Admin floating button */}
        {user?.role === 'admin' && (
            <TouchableOpacity 
                onPress={() => { resetForm(); setIsModalOpen(true); }}
                activeOpacity={0.9}
                className="absolute bottom-8 right-8 w-20 h-20 bg-indigo-600 rounded-[30px] items-center justify-center shadow-2xl shadow-indigo-600/50"
            >
                <MaterialCommunityIcons name="plus" size={40} color="white" />
            </TouchableOpacity>
        )}

        {/* Add/Edit Modal */}
        <Modal visible={isModalOpen} transparent animationType="slide">
            <View className="flex-1 bg-white">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                    <View className="bg-white p-8 flex-1">
                        <View className="flex-row items-center justify-between mb-8">
                            <View>
                                <Text className={`text-2xl font-black ${colors.text} tracking-tighter`}>{editingSlot ? 'Refine' : 'Program'}</Text>
                                <Text className="text-brand-pink text-[10px] font-black uppercase tracking-[3px] mt-1">Schedule Sync 📡</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsModalOpen(false)} className="bg-gray-100 dark:bg-white/10 w-12 h-12 rounded-2xl items-center justify-center">
                                <MaterialCommunityIcons name="close" size={28} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View className="gap-6 mb-8">
                            <View>
                                <Text className={`text-[10px] font-black uppercase tracking-[2px] ${colors.textTertiary} mb-3 ml-2`}>Activity Description</Text>
                                <View className={`${isDark ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-gray-100'} p-5 rounded-[24px] border-2 flex-row items-center`}>
                                    <MaterialCommunityIcons name={(selectedIcon || 'book-outline') as any} size={22} color={selectedColorHex} style={{ marginRight: 24 }} />
                                   <TextInput 
                                      className={`flex-1 text-lg font-black ${colors.text}`}
                                      placeholder="Ex: Creative Arts, Phonics..."
                                      placeholderTextColor={isDark ? '#333' : '#9CA3AF'}
                                      value={activity}
                                      onChangeText={setActivity}
                                   />
                                </View>
                            </View>

                            <View className="flex-row gap-5">
                                <View className="flex-1">
                                    <Text className={`text-[10px] font-black uppercase tracking-[2px] ${colors.textTertiary} mb-3 ml-2`}>Start Time</Text>
                                    <TouchableOpacity 
                                       onPress={() => setShowStartPicker(true)}
                                       className={`${isDark ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-gray-100'} p-5 rounded-[24px] border-2 flex-row items-center justify-between`}
                                    >
                                       <Text className={`font-black ${colors.text} text-sm`}>{startTime}</Text>
                                       <MaterialCommunityIcons name="clock-outline" size={18} color="#6366F1" />
                                    </TouchableOpacity>
                                </View>
                                <View className="flex-1">
                                    <Text className={`text-[10px] font-black uppercase tracking-[2px] ${colors.textTertiary} mb-3 ml-2`}>End Time</Text>
                                    <TouchableOpacity 
                                       onPress={() => setShowEndPicker(true)}
                                       className={`${isDark ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-gray-100'} p-5 rounded-[24px] border-2 flex-row items-center justify-between`}
                                    >
                                       <Text className={`font-black ${colors.text} text-sm`}>{endTime}</Text>
                                       <MaterialCommunityIcons name="clock-check-outline" size={18} color="#6366F1" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View>
                                <Text className={`text-[10px] font-black uppercase tracking-[2px] ${colors.textTertiary} mb-3 ml-2`}>Visual Style (Icon)</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                    {ICONS.map((icon) => (
                                        <TouchableOpacity 
                                            key={icon}
                                            onPress={() => setSelectedIcon(icon)}
                                            className={`w-14 h-14 mx-2 rounded-2xl items-center justify-center border-2 ${selectedIcon === icon ? 'bg-indigo-600 border-indigo-600' : (isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100')}`}
                                        >
                                            <MaterialCommunityIcons name={icon as any} size={24} color={selectedIcon === icon ? 'white' : (isDark ? '#FFF' : '#6366F1')} />
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <View>
                                <Text className={`text-[10px] font-black uppercase tracking-[2px] ${colors.textTertiary} mb-3 ml-2`}>Card Theme (Color)</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-5">
                                    {COLORS.map((col) => (
                                        <TouchableOpacity 
                                            key={col.class}
                                            onPress={() => setSelectedColor(col.class)}
                                            className={`w-12 h-12 rounded-full border-4 ${selectedColor === col.class ? 'border-indigo-400' : 'border-transparent'}`}
                                            style={{ backgroundColor: col.hex }}
                                        />
                                    ))}
                                </ScrollView>
                            </View>

                            <View>
                                <Text className={`text-[10px] font-black uppercase tracking-[2px] ${colors.textTertiary} mb-3 ml-2`}>Location / Room</Text>
                                <TextInput 
                                    className={`${isDark ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-gray-100'} p-5 rounded-[24px] border-2 font-black ${colors.text}`}
                                    placeholder="Room ID"
                                    placeholderTextColor={isDark ? '#333' : '#9CA3AF'}
                                    value={room}
                                    onChangeText={setRoom}
                                />
                            </View>
                        </View>

                        <TouchableOpacity 
                           disabled={isSubmitting}
                           onPress={handleApply}
                           className="bg-indigo-600 py-6 rounded-[32px] items-center justify-center flex-row shadow-2xl shadow-indigo-600/30"
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="shield-check-outline" size={24} color="white" />
                                    <Text className="text-white font-black text-lg uppercase tracking-[4px] ml-3 mt-1">Authorize Sync</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        <View className="h-10" />
                    </View>
                </KeyboardAvoidingView>
            </View>
            
            <TimeSelector 
                visible={showStartPicker} 
                onClose={() => setShowStartPicker(false)} 
                title="Commencement Time"
                initialTime={startTime}
                onConfirm={(t: string) => { setStartTime(t); setShowStartPicker(false); if (endTime === '10:00 AM') setEndTime(t); }} 
            />
            <TimeSelector 
                visible={showEndPicker} 
                onClose={() => setShowEndPicker(false)} 
                title="Termination Time"
                initialTime={endTime}
                onConfirm={(t: string) => { setEndTime(t); setShowEndPicker(false); }} 
            />
        </Modal>
      </View>
    </View>
  );
}
