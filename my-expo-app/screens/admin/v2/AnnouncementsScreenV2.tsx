import React, { useState, memo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert,
  TextInput, Image, Modal, ActivityIndicator,
  KeyboardAvoidingView, Platform, StatusBar, StyleSheet, Dimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import PremiumPopup from '../../../components/PremiumPopup';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth, Announcement } from '../../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import GlassDropdown from './GlassDropdown';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const BORDER_RADIUS = 22;

const MEGAPHONE_ICON = require('../../../assets/icons/megaphone.png');

// ─── Soft radial glow (layered gradients ≈ blurred radial) ─────────────────────
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
  userName, onClose, onSubmit, isSubmitting, isMasterAdmin, ownBranchId,
}: {
  userName: string;
  onClose: () => void; onSubmit: (a: Announcement) => void; isSubmitting: boolean;
  isMasterAdmin: boolean;
  ownBranchId?: string | null;
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [date, setDate] = useState(formatDate(new Date()));
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [target, setTarget] = useState<'all' | 'student' | 'teacher' | 'admin'>('all');
  const [annBranchId, setAnnBranchId] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<'date' | 'start' | 'end' | null>(null);
  const insets = useSafeAreaInsets();

  const effectiveBranchId = isMasterAdmin ? annBranchId : (ownBranchId || null);

  const pickImage = useCallback(async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].base64 ? `data:image/jpeg;base64,${result.assets[0].base64}` : result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image');
    }
  }, []);

  const handlePost = useCallback(() => {
    if (!title.trim()) { Alert.alert('Missing Title', 'Please enter a title'); return; }
    if (!content.trim()) { Alert.alert('Missing Content', 'Please enter a message'); return; }
    if (!date.trim()) { Alert.alert('Missing Date', 'Please enter a date'); return; }
    onSubmit({
      id: `ann_${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      image: image || undefined,
      date: date.trim(),
      start_date: startDate.trim() || undefined,
      end_date: endDate.trim() || undefined,
      target,
      author: userName,
      branch_id: effectiveBranchId || undefined,
    });
  }, [title, content, image, date, startDate, endDate, target, userName, onSubmit, effectiveBranchId]);

  const inputStyle = {
    borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, fontWeight: '700' as const,
    color: TEXT_PRIMARY,
    backgroundColor: 'rgba(247,249,246,0.95)',
    borderColor: 'rgba(255,255,255,0.6)',
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
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

      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 20, paddingBottom: 16, paddingTop: Math.max(insets.top, 20),
        }}>
          <TouchableOpacity onPress={onClose} style={{
            width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
          }}>
            <MaterialCommunityIcons name="close" size={22} color={TEXT_PRIMARY} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'flex-end', marginLeft: 14 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.5 }}>Broadcast Message</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Image source={MEGAPHONE_ICON} style={{ width: 18, height: 18 }} resizeMode="contain" />
              <Text style={{ color: '#D97706', fontWeight: '700', fontSize: 12, marginLeft: 6 }}>New Announcement</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1, paddingHorizontal: 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}
        >
          {/* ── Audience Target ── */}
          <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', color: TEXT_MUTED, marginBottom: 10 }}>
            Audience Target
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 22 }}>
            {(['all', 'student', 'teacher', 'admin'] as const).map(t => (
              <TouchableOpacity
                key={t}
                activeOpacity={0.7}
                onPress={() => setTarget(t)}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center', backgroundColor: target === t ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: target === t ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.6)' }}
              >
                <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'capitalize', color: target === t ? '#D97706' : TEXT_MUTED }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Branch (master admin scope) ── */}
          {isMasterAdmin && (
            <View style={{ marginBottom: 22 }}>
              <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', color: TEXT_MUTED, marginBottom: 10 }}>
                Broadcast Branch
              </Text>
              <GlassDropdown
                selectedBranchId={annBranchId}
                onSelect={setAnnBranchId}
                showAll
              />
            </View>
          )}
          {!isMasterAdmin && (
            <Text style={{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: TEXT_MUTED, marginBottom: 22 }}>
              Broadcasting to branch {'#'}{ownBranchId || '—'}
            </Text>
          )}

          {/* ── Event Date ── */}
          <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', color: TEXT_MUTED, marginBottom: 8 }}>
            Event Date *
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowDatePicker('date')}
            style={{ ...inputStyle, marginBottom: 18, flexDirection: 'row', alignItems: 'center' }}
          >
            <MaterialCommunityIcons name="calendar-clock" size={20} color="#D97706" style={{ marginRight: 10 }} />
            <Text style={{ flex: 1, fontWeight: '700', fontSize: 15, color: TEXT_PRIMARY }}>{date}</Text>
            <MaterialCommunityIcons name="chevron-down" size={18} color={TEXT_MUTED} />
          </TouchableOpacity>

          {/* ── Banner Duration (optional) ── */}
          <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', color: TEXT_MUTED, marginBottom: 8, marginTop: 4 }}>
            Banner Duration (optional)
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowDatePicker('start')}
              style={{ flex: 1, ...inputStyle, flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}
            >
              <MaterialCommunityIcons name="calendar-start" size={18} color="#10B981" style={{ marginRight: 8 }} />
              <Text style={{ flex: 1, fontWeight: '700', fontSize: 13, color: startDate ? TEXT_PRIMARY : '#9CA3AF' }}>{startDate || 'Start Date'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowDatePicker('end')}
              style={{ flex: 1, ...inputStyle, flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}
            >
              <MaterialCommunityIcons name="calendar-end" size={18} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={{ flex: 1, fontWeight: '700', fontSize: 13, color: endDate ? TEXT_PRIMARY : '#9CA3AF' }}>{endDate || 'End Date'}</Text>
            </TouchableOpacity>
          </View>

          {/* ── Headline ── */}
          <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', color: TEXT_MUTED, marginBottom: 8 }}>
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
          <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', color: TEXT_MUTED, marginBottom: 8 }}>
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
          <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', color: TEXT_MUTED, marginBottom: 8 }}>
            Banner Image (optional)
          </Text>
          <TouchableOpacity
            onPress={pickImage}
            activeOpacity={0.7}
            style={{
              borderWidth: 1, borderRadius: 16, paddingVertical: 16,
              borderColor: image ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.6)',
              backgroundColor: image ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.92)',
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <MaterialCommunityIcons name={image ? 'image-check' : 'image-plus'} size={22} color={image ? '#D97706' : TEXT_MUTED} />
            <Text style={{ fontWeight: '700', marginLeft: 10, color: image ? '#D97706' : TEXT_MUTED }}>
              {image ? 'Change Image' : 'Select Image'}
            </Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 9, fontWeight: '600', letterSpacing: 0.5, color: TEXT_MUTED, marginBottom: 12, textAlign: 'center' }}>
            Recommended: 1280 × 720 px (16:9) — shows fully without cropping
          </Text>

          {image ? (
            <View style={{ borderRadius: 18, overflow: 'hidden', height: 180, marginBottom: 22 }}>
              <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              <TouchableOpacity
                onPress={() => setImage('')}
                style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, padding: 6 }}
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
            style={{ marginTop: 4, height: 56, borderRadius: 18, overflow: 'hidden' }}
          >
            <LinearGradient colors={['#F59E0B', '#D97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialCommunityIcons name="send" size={22} color="white" />
                  <Text style={{ color: 'white', fontWeight: '900', fontSize: 15, marginLeft: 10 }}>Post to Feed</Text>
                </>
              )}
            </LinearGradient>
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
export default function AnnouncementsScreenV2({ navigation }: AnnouncementsScreenProps) {
  const { announcements, addAnnouncement, deleteAnnouncement, notifyAnnouncement, user } = useAuth();
  const insets = useSafeAreaInsets();
  const isMasterAdmin = user?.role === 'master_admin';

  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<any>(null);
  const [branchFilterId, setBranchFilterId] = useState<string | null>(isMasterAdmin ? null : (user?.branch_id?.toString() || null));

  const openForm = useCallback(() => setShowForm(true), []);
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

  const sendNotification = useCallback(async (item: any) => {
    try {
      await notifyAnnouncement(item.id);
      Alert.alert('Notification Sent! 🔔', `Push notification sent for "${item.title}"`);
    } catch {
      Alert.alert('Error', 'Failed to send notification');
    }
  }, [notifyAnnouncement]);

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
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      {/* ── Aurora Glass background ── */}
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

      {/* ── Header ── */}
      <View style={{ paddingTop: Math.max(insets.top, 56), paddingHorizontal: 20, paddingBottom: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
            style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY }}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontSize: 12, fontWeight: '400', color: TEXT_MUTED }}>TN HAPPYKIDS</Text>
            <Text style={{ fontSize: 22, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 2, letterSpacing: -0.5 }}>Announce Board</Text>
          </View>
          <TouchableOpacity
            onPress={openForm}
            activeOpacity={0.85}
            style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Image source={MEGAPHONE_ICON} style={{ width: 46, height: 46 }} resizeMode="contain" />
          </TouchableOpacity>
        </View>

        {isMasterAdmin && (
          <View style={{ marginTop: 20 }}>
            <GlassDropdown selectedBranchId={branchFilterId} onSelect={setBranchFilterId} />
          </View>
        )}
      </View>

      {/* ── Feed list ── */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: TEXT_PRIMARY }}>Recent Posts</Text>
          <View style={{ backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100 }}>
            <Text style={{ color: '#D97706', fontWeight: '900', fontSize: 11 }}>{filteredAnnouncements.length} live</Text>
          </View>
        </View>

        {filteredAnnouncements.length > 0 ? filteredAnnouncements.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.9}
            style={{ width: '100%', aspectRatio: 16 / 9, marginBottom: 20, borderRadius: BORDER_RADIUS, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}
            onPress={() => setSelectedNotice(item)}
          >
            {item.image ? (
              <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Image source={MEGAPHONE_ICON} style={{ width: 64, height: 64, opacity: 0.4 }} resizeMode="contain" />
              </View>
            )}

            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', padding: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ backgroundColor: 'rgba(245,158,11,0.85)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 1 }}>{item.target}</Text>
                </View>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="calendar-edit" size={12} color="white" style={{ marginRight: 4 }} />
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>{item.date}</Text>
                </View>
              </View>
              <Text style={{ color: 'white', fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginBottom: 6 }} numberOfLines={2}>{item.title}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="account-circle-outline" size={14} color="white" />
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700', marginLeft: 4 }}>{item.author || 'Admin'}</Text>
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700' }}>Tap to read more →</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => sendNotification(item)}
              style={{ position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(245,158,11,0.85)', width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="bell-ring-outline" size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDelete(item.id, item.title)}
              style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(239,68,68,0.85)', width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={20} color="white" />
            </TouchableOpacity>
          </TouchableOpacity>
        )) : (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Image source={MEGAPHONE_ICON} style={{ width: 80, height: 80, opacity: 0.25 }} resizeMode="contain" />
            <Text style={{ fontSize: 16, fontWeight: '700', color: TEXT_MUTED, marginTop: 16 }}>No announcements yet</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Add form in Modal (fully isolated) ── */}
      <Modal visible={showForm} animationType="slide" transparent={false} onRequestClose={closeForm} statusBarTranslucent>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <AddAnnouncementForm
          userName={user?.name || 'Admin'}
          onClose={closeForm}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          isMasterAdmin={isMasterAdmin}
          ownBranchId={user?.branch_id}
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
          <View style={{ backgroundColor: 'rgba(245,158,11,0.1)', alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="calendar-clock" size={12} color="#D97706" />
            <Text style={{ color: '#D97706', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 6 }}>{selectedNotice.date}</Text>
          </View>
        )}
        {selectedNotice?.image && (
          <Image source={{ uri: selectedNotice.image }} style={{ width: '100%', height: 200, borderRadius: 24, marginBottom: 16 }} resizeMode="cover" />
        )}
      </PremiumPopup>
    </View>
  );
}
