import React, { useState, memo, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert,
  TextInput, Image, Modal, ActivityIndicator,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import PremiumPopup from '../../components/PremiumPopup';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth, Announcement } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import BranchFilter from '../../components/BranchFilter';

const formatDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}
interface AnnouncementsScreenProps {
  navigation: NavigationProps;
}

// ─── Isolated form — state lives here, never in parent ───────────────────────
const AddAnnouncementForm = memo(({
  theme, colors, userName, onClose, onSubmit, isSubmitting,
}: {
  theme: string; colors: any; userName: string;
  onClose: () => void; onSubmit: (a: Announcement) => void; isSubmitting: boolean;
}) => {
  const [title,     setTitle]     = useState('');
  const [content,   setContent]   = useState('');
  const [image,     setImage]     = useState('');
  const [date,      setDate]      = useState(formatDate(new Date()));
  const [startDate, setStartDate] = useState('');
  const [endDate,   setEndDate]   = useState('');
  const [target,    setTarget]    = useState<'all' | 'student' | 'teacher' | 'admin'>('all');
  const [showDatePicker, setShowDatePicker] = useState<'date' | 'start' | 'end' | null>(null);

  const pickImage = useCallback(async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.5,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        // Prefer base64 if available, fallback to uri
        setImage(result.assets[0].base64 ? `data:image/jpeg;base64,${result.assets[0].base64}` : result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image');
    }
  }, []);

  const handlePost = useCallback(() => {
    if (!title.trim())   { Alert.alert('Missing Title', 'Please enter a title'); return; }
    if (!content.trim()) { Alert.alert('Missing Content', 'Please enter a message'); return; }
    if (!date.trim())    { Alert.alert('Missing Date', 'Please enter a date'); return; }
    onSubmit({
      id:         `ann_${Date.now()}`,
      title:      title.trim(),
      content:    content.trim(),
      image:      image || undefined,
      date:       date.trim(),
      start_date: startDate.trim() || undefined,
      end_date:   endDate.trim() || undefined,
      target,
      author:     userName,
    });
  }, [title, content, image, date, startDate, endDate, target, userName, onSubmit]);

  const chipStyle = useCallback((active: boolean) => ({
    flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center' as const,
    backgroundColor: active ? '#F59E0B' : (theme === 'dark' ? '#2a2a28' : '#F3F4F6'),
  }), [theme]);

  const inputStyle = {
    borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, fontWeight: '700' as const,
    color: theme === 'dark' ? '#fff' : '#111',
    backgroundColor: theme === 'dark' ? '#1e1e1c' : '#F9FAFB',
    borderColor: theme === 'dark' ? '#3a3a38' : '#E5E7EB',
  };

  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#111' : '#F9FAFB' }}>

        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 24, paddingBottom: 16, paddingTop: Math.max(insets.top, 20),
          borderBottomWidth: 1, borderBottomColor: theme === 'dark' ? '#2a2a28' : '#F3F4F6',
        }}>
          <TouchableOpacity onPress={onClose} style={{
            width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
            backgroundColor: theme === 'dark' ? '#1e1e1c' : '#fff',
            borderWidth: 1.5, borderColor: theme === 'dark' ? '#3a3a38' : '#E5E7EB',
          }}>
            <MaterialCommunityIcons name="close" size={22} color={theme === 'dark' ? 'white' : 'black'} />
          </TouchableOpacity>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: theme === 'dark' ? '#fff' : '#111' }}>
              Broadcast Message
            </Text>
            <Text style={{ color: '#F59E0B', fontWeight: '700', fontSize: 13 }}>📢 New Announcement</Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1, paddingHorizontal: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}
        >
          {/* ── Audience Target ── */}
          <Text style={{
            fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase',
            color: '#9CA3AF', marginBottom: 10,
          }}>
            Audience Target
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 22 }}>
            {(['all', 'student', 'teacher', 'admin'] as const).map(t => (
              <TouchableOpacity
                key={t}
                activeOpacity={0.7}
                style={chipStyle(target === t)}
                onPress={() => setTarget(t)}
              >
                <Text style={{
                  fontSize: 11, fontWeight: '900', textTransform: 'capitalize',
                  color: target === t ? 'white' : (theme === 'dark' ? '#9CA3AF' : '#6B7280'),
                }}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Event Date ── */}
          <Text style={{
            fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase',
            color: '#9CA3AF', marginBottom: 8,
          }}>
            Event Date *
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowDatePicker('date')}
            style={{ ...inputStyle, marginBottom: 18, flexDirection: 'row', alignItems: 'center' }}
          >
            <MaterialCommunityIcons name="calendar-clock" size={20} color="#F59E0B" style={{ marginRight: 10 }} />
            <Text style={{ flex: 1, fontWeight: '700', fontSize: 15, color: theme === 'dark' ? '#fff' : '#111' }}>
              {date}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          {/* ── Banner Duration (optional) ── */}
          <Text style={{
            fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase',
            color: '#9CA3AF', marginBottom: 8, marginTop: 4,
          }}>
            Banner Duration (optional)
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowDatePicker('start')}
              style={{ flex: 1, ...inputStyle, flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}
            >
              <MaterialCommunityIcons name="calendar-start" size={18} color="#10B981" style={{ marginRight: 8 }} />
              <Text style={{ flex: 1, fontWeight: '700', fontSize: 13, color: startDate ? (theme === 'dark' ? '#fff' : '#111') : '#9CA3AF' }}>
                {startDate || 'Start Date'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowDatePicker('end')}
              style={{ flex: 1, ...inputStyle, flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}
            >
              <MaterialCommunityIcons name="calendar-end" size={18} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={{ flex: 1, fontWeight: '700', fontSize: 13, color: endDate ? (theme === 'dark' ? '#fff' : '#111') : '#9CA3AF' }}>
                {endDate || 'End Date'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Headline ── */}
          <Text style={{
            fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase',
            color: '#9CA3AF', marginBottom: 8,
          }}>
            Headline *
          </Text>
          <TextInput
            style={{ ...inputStyle, marginBottom: 18 }}
            placeholder="e.g. School Reopening Update"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
          />

          {/* ── Message ── */}
          <Text style={{
            fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase',
            color: '#9CA3AF', marginBottom: 8,
          }}>
            Detailed Message *
          </Text>
          <TextInput
            style={{ ...inputStyle, minHeight: 110, textAlignVertical: 'top', marginBottom: 18 }}
            placeholder="Write your announcement here..."
            placeholderTextColor="#9CA3AF"
            multiline
            value={content}
            onChangeText={setContent}
          />

          {/* ── Banner Image ── */}
          <Text style={{
            fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase',
            color: '#9CA3AF', marginBottom: 8,
          }}>
            Banner Image (optional)
          </Text>
          <TouchableOpacity
            onPress={pickImage}
            activeOpacity={0.7}
            style={{
              borderWidth: 1.5, borderRadius: 16, paddingVertical: 16,
              borderColor: image ? '#F59E0B' : (theme === 'dark' ? '#3a3a38' : '#E5E7EB'),
              backgroundColor: image ? '#FFF1F8' : (theme === 'dark' ? '#1e1e1c' : '#F9FAFB'),
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <MaterialCommunityIcons
              name={image ? 'image-check' : 'image-plus'} size={22}
              color={image ? '#F59E0B' : '#9CA3AF'}
            />
            <Text style={{ fontWeight: '700', marginLeft: 10,
              color: image ? '#F59E0B' : '#9CA3AF' }}>
              {image ? 'Change Image' : 'Select Image'}
            </Text>
          </TouchableOpacity>

          {image ? (
            <View style={{ borderRadius: 18, overflow: 'hidden', height: 180, marginBottom: 22 }}>
              <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              <TouchableOpacity
                onPress={() => setImage('')}
                style={{
                  position: 'absolute', top: 10, right: 10,
                  backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, padding: 6,
                }}
              >
                <MaterialCommunityIcons name="close" size={16} color="white" />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* ── Post button ── */}
          <TouchableOpacity
            onPress={handlePost}
            disabled={isSubmitting}
            activeOpacity={0.85}
            style={{
              backgroundColor: isSubmitting ? '#D1D5DB' : '#F59E0B',
              paddingVertical: 20, borderRadius: 24, alignItems: 'center',
              flexDirection: 'row', justifyContent: 'center',
              shadowColor: '#F59E0B', shadowOpacity: 0.4,
              shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 8,
              marginTop: 4,
            }}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <MaterialCommunityIcons name="send" size={22} color="white" />
                <Text style={{ color: 'white', fontWeight: '900', fontSize: 17, marginLeft: 10 }}>
                  Post to Feed
                </Text>
              </>
            )}
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={new Date(
                showDatePicker === 'date' ? date :
                showDatePicker === 'start' ? (startDate || formatDate(new Date())) :
                (endDate || formatDate(new Date()))
              )}
              mode="date"
              display="default"
              accentColor="#F59E0B"
              onChange={(_, d) => {
                setShowDatePicker(null);
                if (d) {
                  const formatted = formatDate(d);
                  if (showDatePicker === 'date') setDate(formatted);
                  else if (showDatePicker === 'start') setStartDate(formatted);
                  else setEndDate(formatted);
                }
              }}
            />
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AnnouncementsScreen({ navigation }: AnnouncementsScreenProps) {
  const { announcements, addAnnouncement, deleteAnnouncement, user } = useAuth();
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [showForm, setShowForm]         = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<any>(null);
  const [branchFilterId, setBranchFilterId] = useState<string | null>(null);

  const openForm  = useCallback(() => setShowForm(true),  []);
  const closeForm = useCallback(() => setShowForm(false), []);

  const handleSubmit = useCallback(async (a: Announcement) => {
    setIsSubmitting(true);
    try {
      await addAnnouncement(a);
      setShowForm(false);
      Alert.alert('Posted! 📢', 'Announcement is now live.');
    } catch {
      Alert.alert('Error', 'Failed to post announcement.');
    } finally {
      setIsSubmitting(false);
    }
  }, [addAnnouncement]);

  const handleDelete = useCallback((id: string, title: string) => {
    Alert.alert('Delete', `Remove "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteAnnouncement(id) },
    ]);
  }, [deleteAnnouncement]);

  const filteredAnnouncements = branchFilterId
    ? announcements.filter(a => a.branch_id?.toString() === branchFilterId)
    : announcements;

  return (
    <View className={`flex-1 ${colors.background}`}>
      {/* ── Header ── */}
      <View style={{ paddingTop: Math.max(insets.top, 20) }} className="px-6 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className={`mb-4 ${colors.surface} w-12 h-12 rounded-2xl items-center justify-center border ${colors.border} shadow-sm`}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={28} color={theme === 'dark' ? '#FFF' : '#000'} />
            </TouchableOpacity>
            <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>Announce</Text>
            <Text className="text-2xl font-bold text-brand-violet">Board 📢</Text>
            <BranchFilter selectedBranchId={branchFilterId} onSelect={setBranchFilterId} />
          </View>
          <TouchableOpacity
            onPress={openForm}
            activeOpacity={0.85}
            style={{
              backgroundColor: '#F59E0B', width: 64, height: 64,
              borderRadius: 24, alignItems: 'center', justifyContent: 'center',
              shadowColor: '#F59E0B', shadowOpacity: 0.4,
              shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 8,
            }}
          >
            <MaterialCommunityIcons name="bullhorn-outline" size={32} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Feed list ── */}
      <ScrollView className="flex-1 px-6 pb-10" showsVerticalScrollIndicator={false}>
        <Text className={`text-xl font-black ${colors.text} mb-4 ml-1 uppercase tracking-widest opacity-60`}>
          Recent Posts ✨
        </Text>

        {filteredAnnouncements.length > 0 ? filteredAnnouncements.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.9}
            style={{ width: '100%', aspectRatio: 16 / 9 }}
            className="mb-6 bg-brand-violet relative overflow-hidden rounded-[32px] border-4 border-white shadow-xl"
            onPress={() => setSelectedNotice(item)}
          >
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <View className="flex-1 items-center justify-center bg-brand-violet/20">
                <MaterialCommunityIcons name="bullhorn-outline" size={64} color="#F59E0B" />
              </View>
            )}

            {/* Overlay with shadow for text readability */}
            <View className="absolute inset-0 bg-black/40 justify-end p-6">
              <View className="flex-row items-center justify-between mb-2">
                <View className="bg-brand-yellow/80 px-3 py-1 rounded-full">
                  <Text className="text-[10px] font-black text-amber-900 uppercase tracking-widest">
                    {item.target}
                  </Text>
                </View>
                <View className="bg-white/20 px-3 py-1 rounded-full flex-row items-center">
                  <MaterialCommunityIcons name="calendar-edit" size={12} color="white" style={{ marginRight: 4 }} />
                  <Text className="text-white text-[10px] font-black uppercase tracking-widest">{item.date}</Text>
                </View>
              </View>

              <Text className="text-white text-2xl font-black tracking-tighter mb-1" numberOfLines={2}>
                {item.title}
              </Text>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="account-circle-outline" size={14} color="white" />
                  <Text className="text-white/80 text-xs font-bold ml-1">{item.author || 'Admin'}</Text>
                </View>
                <Text className="text-white/60 text-[10px] font-bold">Tap to read more →</Text>
              </View>
            </View>

            {/* Floating Delete Button */}
            <TouchableOpacity
              onPress={() => handleDelete(item.id, item.title)}
              className="absolute top-4 right-4 bg-red-500/80 w-10 h-10 rounded-2xl items-center justify-center border border-white/30"
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={20} color="white" />
            </TouchableOpacity>
          </TouchableOpacity>
        )) : (
          <View className="items-center py-20 opacity-20">
            <MaterialCommunityIcons name="post-outline" size={80} color={theme === 'dark' ? '#9CA3AF' : 'gray'} />
            <Text className={`font-black mt-4 uppercase tracking-widest ${colors.textSecondary}`}>
              No announcements yet
            </Text>
          </View>
        )}
        <View className="h-32" />
      </ScrollView>

      {/* ── Add form in Modal (fully isolated) ── */}
      <Modal visible={showForm} animationType="slide" transparent={false} onRequestClose={closeForm} statusBarTranslucent>
        <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        <AddAnnouncementForm
          theme={theme}
          colors={colors}
          userName={user?.name || 'Admin'}
          onClose={closeForm}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </Modal>

      <PremiumPopup
        visible={!!selectedNotice}
        onClose={() => setSelectedNotice(null)}
        title={selectedNotice?.title || ''}
        message={selectedNotice?.content}
        type="info"
        icon="bullhorn"
      >
        {selectedNotice?.date && (
          <View className="bg-pink-50/50 dark:bg-pink-500/10 self-center px-4 py-1.5 rounded-full border border-pink-100 dark:border-pink-500/20 mb-4 flex-row items-center">
            <MaterialCommunityIcons name="calendar-clock" size={12} color="#F59E0B" />
            <Text className="text-brand-violet text-[10px] font-black uppercase tracking-widest ml-2">{selectedNotice.date}</Text>
          </View>
        )}
        {selectedNotice?.image && (
          <Image 
            source={{ uri: selectedNotice.image }} 
            style={{ width: '100%', height: 200, borderRadius: 24, marginBottom: 16 }}
            resizeMode="cover"
          />
        )}
      </PremiumPopup>
    </View>
  );
}

