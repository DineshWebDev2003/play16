import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Image, TouchableOpacity, Alert, Modal, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import GlassSelectV2 from '../../admin/v2/GlassSelectV2';
import GlassDropdown from '../../admin/v2/GlassDropdown';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const ACTIVE = '#F59E0B';
const INDIGO = '#6366F1';
const BORDER_RADIUS = 22;

const CALENDAR_ICON = require('../../../assets/icons/calendar.png');
const CLOCK_ICON = require('../../../assets/icons/maths.png');
const NOTE_ICON = require('../../../assets/icons/note-book.png');

const DAYS = [
  { label: 'Monday', index: 0 },
  { label: 'Tuesday', index: 1 },
  { label: 'Wednesday', index: 2 },
  { label: 'Thursday', index: 3 },
  { label: 'Friday', index: 4 },
  { label: 'Saturday', index: 5 },
];

const ICONS = [
  'book-outline', 'brush-outline', 'music-note-outline', 'flask-outline',
  'palette-outline', 'translate', 'calculator-variant-outline',
  'basketball', 'image-multiple-outline', 'emoticon-happy-outline',
  'toy-brick-outline', 'puzzle-outline',
];

const COLORS = [
  { name: 'Indigo', class: 'bg-indigo-500', hex: '#6366F1' },
  { name: 'Blue', class: 'bg-blue-500', hex: '#3B82F6' },
  { name: 'Pink', class: 'bg-pink-500', hex: '#EC4899' },
  { name: 'Red', class: 'bg-red-500', hex: '#EF4444' },
  { name: 'Orange', class: 'bg-orange-500', hex: '#F59E0B' },
  { name: 'Green', class: 'bg-green-500', hex: '#10B981' },
  { name: 'Purple', class: 'bg-purple-500', hex: '#A855F7' },
];

const TIME_OPTIONS = (() => {
  const opts: { label: string; value: string }[] = [];
  const h = 7, m = 0;
  for (let t = h * 60; t <= 20 * 60; t += 30) {
    const hh = Math.floor(t / 60);
    const mm = t % 60;
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const hour12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
    opts.push({
      label: `${String(hour12).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${ampm}`,
      value: `${String(hour12).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${ampm}`,
    });
  }
  return opts;
})();

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

const glassCard = {
  borderRadius: BORDER_RADIUS,
  backgroundColor: 'rgba(255,255,255,0.92)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.6)',
  padding: 16,
};

interface Props { navigation: { navigate: (s: string) => void; goBack: () => void } }

export default function TimetableScreenV2({ navigation }: Props) {
  const { user, fetchData, branches } = useAuth();
  const insets = useSafeAreaInsets();

  const isAdmin = user?.role === 'admin' || user?.role === 'master_admin';
  const isMasterAdmin = user?.role === 'master_admin';

  const todayIdx = new Date().getDay() === 0 ? 0 : new Date().getDay() - 1;
  const [selectedDayIdx, setSelectedDayIdx] = useState(todayIdx > 5 ? 0 : todayIdx);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any>(null);
  const [branchFilterId, setBranchFilterId] = useState<string | null>(null);
  const [modalBranchId, setModalBranchId] = useState<string | null>(null);

  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('10:00 AM');
  const [activity, setActivity] = useState('');
  const [room, setRoom] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('book-outline');
  const [selectedColor, setSelectedColor] = useState('bg-indigo-500');

  const [timetable, setTimetable] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTimetable = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (isMasterAdmin && branchFilterId) params.append('branch_id', branchFilterId);
      const response = await api.get(`/timetable?${params.toString()}`);
      const data = response.data?.data || (Array.isArray(response.data) ? response.data : []);
      setTimetable(data);
    } catch (err) {
      console.error('Fetch Timetable Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isMasterAdmin, branchFilterId]);

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
    const effectiveBranchId = isMasterAdmin
      ? branchFilterId
      : user?.branch_id?.toString() || null;
    const list = timetable.filter((slot: any) => {
      const slotDay = typeof slot.day === 'string' ? parseInt(slot.day) : slot.day;
      if (slotDay !== selectedDayIdx) return false;
      if (effectiveBranchId) {
        const slotBranch = slot.branch_id?.toString() || slot.branch?.id?.toString() || null;
        if (slotBranch && slotBranch !== effectiveBranchId) return false;
      }
      return true;
    });
    return [...list].sort((a, b) => {
      const timeA = timeToMinutes(a.time.split(' - ')[0]);
      const timeB = timeToMinutes(b.time.split(' - ')[0]);
      return timeA - timeB;
    });
  }, [timetable, selectedDayIdx, timeToMinutes, isMasterAdmin, branchFilterId, user?.branch_id]);

  const handleApply = async () => {
    if (!activity.trim() || !room.trim()) {
      return Alert.alert('Attention', 'Fill all fields');
    }
    setIsSubmitting(true);
    try {
      const data: any = {
        day: selectedDayIdx,
        time: `${startTime} - ${endTime}`,
        activity,
        room,
        icon: selectedIcon,
        color: selectedColor,
      };
      if (isMasterAdmin) {
        if (!modalBranchId) {
          setIsSubmitting(false);
          return Alert.alert('Attention', 'Select a branch first');
        }
        data.branch_id = modalBranchId;
      }
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
      } },
    ]);
  };

  const defaultModalBranch = () =>
    branchFilterId || (branches && branches.length > 0 ? String(branches[0].id) : null);

  const editSlot = (item: any) => {
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
    setModalBranchId(item.branch_id?.toString() || defaultModalBranch());
    setIsModalOpen(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: Math.max(insets.top, 56) }}>
          {/* ── Header ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.goBack()}
              style={{
                width: 44,
                height: 44,
                borderRadius: 16,
                backgroundColor: 'rgba(255,255,255,0.92)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.6)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY }}>‹</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontSize: 12, fontWeight: '400', color: TEXT_MUTED }}>Daily Schedule</Text>
              <Text style={{ fontSize: 22, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 2, letterSpacing: -0.5 }}>
                Timetable
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: TEXT_MUTED, marginTop: 2 }}>Plan lectures, classes & activities</Text>
            </View>
            <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
              <Image source={CALENDAR_ICON} style={{ width: 46, height: 46 }} resizeMode="contain" />
            </View>
          </View>

            <GlassDropdown selectedBranchId={branchFilterId} onSelect={setBranchFilterId} icon={CALENDAR_ICON} />

          {/* ── Day selector (GlassSelectV2) ── */}
          <View style={{ marginTop: 16 }}>
            <GlassSelectV2
              label="Schedule For"
              value={String(selectedDayIdx)}
              placeholder="Select a day"
              options={DAYS.map(d => ({ label: d.label, value: String(d.index), hint: `${daySchedule.length} slots` }))}
              onSelect={(v) => { if (v !== null) setSelectedDayIdx(Number(v)); }}
              icon={CALENDAR_ICON}
              title="Choose Day"
              subtitle="Pick the day to view or edit its schedule"
              footerHint="Slots are shown sorted by start time."
            />
          </View>

          {/* ── Timeline ── */}
          {isLoading ? (
            <View style={{ alignItems: 'center', paddingVertical: 80 }}>
              <ActivityIndicator size="large" color={INDIGO} />
            </View>
          ) : daySchedule.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 70, borderRadius: BORDER_RADIUS, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={72} color={TEXT_MUTED} style={{ opacity: 0.3 }} />
              <Text style={{ fontSize: 16, fontWeight: '900', color: TEXT_PRIMARY, marginTop: 14 }}>No Lectures Programmed</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: TEXT_MUTED, marginTop: 4 }}>Pick another day or add a slot</Text>
            </View>
          ) : (
            daySchedule.map(item => (
              <View key={item.id} style={{ flexDirection: 'row', marginBottom: 14 }}>
                <View style={{ alignItems: 'center', marginRight: 12 }}>
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: INDIGO }} />
                  <View style={{ width: 2, flex: 1, backgroundColor: 'rgba(99,102,241,0.12)', marginVertical: 6 }} />
                </View>
                <View style={[glassCard, { flex: 1, flexDirection: 'row', alignItems: 'center' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#EC4899', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>{item.time}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: (item.color || 'bg-indigo-500').includes('indigo') ? '#6366F1' : (item.color || '').includes('red') ? '#EF4444' : (item.color || '').includes('pink') ? '#EC4899' : (item.color || '').includes('orange') ? '#F59E0B' : (item.color || '').includes('green') ? '#10B981' : (item.color || '').includes('purple') ? '#A855F7' : (item.color || '').includes('blue') ? '#3B82F6' : '#6366F1', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <MaterialCommunityIcons name={(item.icon || 'book-outline') as any} size={20} color="white" />
                      </View>
                      <Text style={{ flex: 1, fontSize: 17, fontWeight: '900', color: TEXT_PRIMARY, letterSpacing: -0.3 }} numberOfLines={1}>{item.activity}</Text>
                    </View>
                    {item.room ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                        <MaterialCommunityIcons name="door-open" size={13} color={TEXT_MUTED} />
                        <Text style={{ fontSize: 10, fontWeight: '700', color: TEXT_MUTED, marginLeft: 4 }}>Room: {item.room}</Text>
                      </View>
                    ) : null}
                  </View>
                  {isAdmin && (
                    <View style={{ flexDirection: 'row' }}>
                      <TouchableOpacity onPress={() => editSlot(item)} style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(99,102,241,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
                        <MaterialCommunityIcons name="pencil" size={17} color={INDIGO} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                        <MaterialCommunityIcons name="trash-can-outline" size={17} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* ── Admin FAB ── */}
      {isAdmin && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => { resetForm(); setModalBranchId(defaultModalBranch()); setIsModalOpen(true); }}
          style={{
            position: 'absolute',
            bottom: 96,
            right: 24,
            width: 62,
            height: 62,
            borderRadius: 22,
            backgroundColor: INDIGO,
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 10,
            shadowColor: '#6366F1',
            shadowOpacity: 0.4,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
          }}
        >
          <MaterialCommunityIcons name="plus" size={32} color="white" />
        </TouchableOpacity>
      )}

      {/* ── Add / Edit Modal ── */}
      <Modal visible={isModalOpen} transparent animationType="slide" onRequestClose={() => setIsModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
          <AuroraBackground />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingTop: Math.max(insets.top, 40), paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => setIsModalOpen(false)} activeOpacity={0.8} style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="close" size={22} color={TEXT_PRIMARY} />
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ fontSize: 12, fontWeight: '400', color: TEXT_MUTED }}>{editingSlot ? 'Refine' : 'Program'}</Text>
                <Text style={{ fontSize: 22, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 2, letterSpacing: -0.5 }}>
                  {editingSlot ? 'Edit Slot' : 'New Slot'}
                </Text>
              </View>
              <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                <Image source={NOTE_ICON} style={{ width: 46, height: 46 }} resizeMode="contain" />
              </View>
            </View>

            <View style={{ marginTop: 16 }}>
              <GlassDropdown
                selectedBranchId={modalBranchId}
                onSelect={setModalBranchId}
                icon={CALENDAR_ICON}
                hideAll
              />
            </View>

            <View style={{ marginTop: 16 }}>
              <GlassSelectV2
                label="Schedule For"
                value={String(selectedDayIdx)}
                placeholder="Select a day"
                options={DAYS.map(d => ({ label: d.label, value: String(d.index) }))}
                onSelect={(v) => { if (v !== null) setSelectedDayIdx(Number(v)); }}
                icon={CALENDAR_ICON}
                title="Choose Day"
                subtitle="Which day does this slot belong to?"
              />
            </View>

            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', color: TEXT_MUTED, marginBottom: 8 }}>
                Activity Description
              </Text>
              <View style={{ borderRadius: 16, paddingHorizontal: 16, paddingVertical: 4, backgroundColor: 'rgba(247,249,246,0.95)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name={(selectedIcon || 'book-outline') as any} size={20} color={COLORS.find(c => c.class === selectedColor)?.hex || INDIGO} style={{ marginRight: 12 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 15, fontWeight: '700', color: TEXT_PRIMARY, paddingVertical: 14 }}
                  placeholder="Ex: Creative Arts, Phonics..."
                  placeholderTextColor="#9CA3AF"
                  value={activity}
                  onChangeText={setActivity}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', marginTop: 20 }}>
              <View style={{ flex: 1, marginRight: 6 }}>
                <GlassSelectV2
                  label="Start Time"
                  value={startTime}
                  placeholder="Start"
                  options={TIME_OPTIONS}
                  onSelect={(v) => { if (v !== null) { setStartTime(v); if (endTime === '10:00 AM') setEndTime(v); } }}
                  icon={CLOCK_ICON}
                  title="Start Time"
                  subtitle="When does the slot begin?"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 6 }}>
                <GlassSelectV2
                  label="End Time"
                  value={endTime}
                  placeholder="End"
                  options={TIME_OPTIONS}
                  onSelect={(v) => { if (v !== null) setEndTime(v); }}
                  icon={CLOCK_ICON}
                  title="End Time"
                  subtitle="When does the slot finish?"
                />
              </View>
            </View>

            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', color: TEXT_MUTED, marginBottom: 10 }}>
                Visual Style (Icon)
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    onPress={() => setSelectedIcon(icon)}
                    style={{
                      width: 52,
                      height: 52,
                      marginRight: 10,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 2,
                      backgroundColor: selectedIcon === icon ? INDIGO : 'rgba(255,255,255,0.92)',
                      borderColor: selectedIcon === icon ? INDIGO : 'rgba(255,255,255,0.6)',
                    }}
                  >
                    <MaterialCommunityIcons name={icon as any} size={24} color={selectedIcon === icon ? 'white' : INDIGO} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={{ marginTop: 20 }}>
              <Text style={{ fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', color: TEXT_MUTED, marginBottom: 10 }}>
                Card Theme (Color)
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {COLORS.map((col) => (
                  <TouchableOpacity
                    key={col.class}
                    onPress={() => setSelectedColor(col.class)}
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 23,
                      marginRight: 12,
                      backgroundColor: col.hex,
                      borderWidth: 3,
                      borderColor: selectedColor === col.class ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                      shadowColor: col.hex,
                      shadowOpacity: selectedColor === col.class ? 0.4 : 0.1,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 4 },
                    }}
                  />
                ))}
              </ScrollView>
            </View>

            <View style={{ marginTop: 20 }}>
              <Text style={{ fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', color: TEXT_MUTED, marginBottom: 8 }}>
                Location / Room
              </Text>
              <View style={{ borderRadius: 16, paddingHorizontal: 16, backgroundColor: 'rgba(247,249,246,0.95)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="door-open" size={20} color={INDIGO} style={{ marginRight: 12 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 15, fontWeight: '700', color: TEXT_PRIMARY, paddingVertical: 14 }}
                  placeholder="Room ID"
                  placeholderTextColor="#9CA3AF"
                  value={room}
                  onChangeText={setRoom}
                />
              </View>
            </View>

            <TouchableOpacity
              disabled={isSubmitting}
              onPress={handleApply}
              activeOpacity={0.9}
              style={{ marginTop: 24, backgroundColor: INDIGO, paddingVertical: 16, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', elevation: 4 }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialCommunityIcons name="shield-check-outline" size={22} color="white" />
                  <Text style={{ color: 'white', fontWeight: '900', fontSize: 15, marginLeft: 8 }}>
                    {editingSlot ? 'Save Changes' : 'Add Slot'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
