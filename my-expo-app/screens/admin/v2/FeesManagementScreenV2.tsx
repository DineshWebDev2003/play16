import React, { useState, useCallback, memo, useMemo, useEffect } from 'react';
const QRCode = require('qrcode');
import {
  View, Text, ScrollView, Pressable, TextInput, Alert, Modal,
  ActivityIndicator, FlatList, TouchableOpacity, Image, Platform,
  KeyboardAvoidingView, RefreshControl, StyleSheet, Dimensions
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth, FeeRecord } from '../../../contexts/AuthContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import GlassDropdown from './GlassDropdown';
import api from '../../../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NavigationProps { navigate: (screen: string) => void; goBack: () => void; }

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'N/A';
  try {
    if (dateString.includes('-') && dateString.length <= 10) {
        const [year, month, day] = dateString.split('-');
        if (year && month && day) {
            return `${day}/${month}/${year}`;
        }
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  } catch (e) {
    return dateString;
  }
};

const FEES_TABS = [
  { id: 'manage', label: 'Monthly' },
  { id: 'admission', label: 'Admission' },
  { id: 'history', label: 'History' }
] as const;

const YEAR_DATA = [
  { name: '2020', code: '2020' },
  { name: '2021', code: '2021' },
  { name: '2022', code: '2022' },
  { name: '2023', code: '2023' },
  { name: '2024', code: '2024' },
  { name: '2025', code: '2025' },
  { name: '2026', code: '2026' },
  { name: '2027', code: '2027' },
  { name: '2028', code: '2028' },
  { name: '2029', code: '2029' },
  { name: '2030', code: '2030' },
];

const MONTH_DATA = [
  { name: 'January', code: '01' },
  { name: 'February', code: '02' },
  { name: 'March', code: '03' },
  { name: 'April', code: '04' },
  { name: 'May', code: '05' },
  { name: 'June', code: '06' },
  { name: 'July', code: '07' },
  { name: 'August', code: '08' },
  { name: 'September', code: '09' },
  { name: 'October', code: '10' },
  { name: 'November', code: '11' },
  { name: 'December', code: '12' },
];

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const BORDER_RADIUS = 22;
const SECTION_GAP = 28;
const NOTEBOOK_ICON = require('../../../assets/icons/note-book.png');

const styles = StyleSheet.create({
  glassCard: {
    borderRadius: BORDER_RADIUS,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  input: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(247,249,246,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: TEXT_MUTED,
    marginBottom: 10,
  },
  sectionLabelRow: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 3,
    color: TEXT_MUTED,
  },
  selectField: {
    borderRadius: 16,
    backgroundColor: 'rgba(247,249,246,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectFieldText: {
    flex: 1,
    fontWeight: '800',
    fontSize: 14,
    color: TEXT_PRIMARY,
  },
  pickerCard: {
    marginTop: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    padding: 12,
  },
  studentOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 4,
    backgroundColor: 'rgba(247,249,246,0.6)',
  },
  studentOptionId: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  dropdownTrigger: {
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryCard: {
    width: '48.5%',
    borderRadius: BORDER_RADIUS,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: TEXT_MUTED,
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    letterSpacing: -0.5,
  },
  backCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: TEXT_MUTED,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginTop: 3,
    letterSpacing: -0.5,
  },
  headerIconBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,20,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: SCREEN_WIDTH - 40,
    maxWidth: 440,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    overflow: 'hidden',
  },
  segmented: {
    flexDirection: 'row',
    gap: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.5)',
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    padding: 12,
  },
  rupeeTile: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountInput: {
    flex: 1,
    marginLeft: 16,
    fontSize: 34,
    fontWeight: '900',
    color: TEXT_PRIMARY,
    letterSpacing: -1,
  },
  innerGlass: {
    borderRadius: 18,
    backgroundColor: 'rgba(247,249,246,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
});

const RadialGlow = ({ size, color, opacity, style }: {
  size: number;
  color: string;
  opacity: number;
  style?: any;
}) => (
  <View
    pointerEvents="none"
    style={[
      { position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity },
      style,
    ]}
  />
);

const AuroraBackground = ({ topInset }: { topInset?: number }) => (
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

const MonthDropdown = memo(({ activeMonth, activeYear, onSelectMonth, onSelectYear }: any) => {
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Pressable onPress={() => setIsMonthOpen(true)} style={[styles.dropdownTrigger, { flex: 1 }]}>
          <Text style={{ fontWeight: '800', fontSize: 13, textTransform: 'uppercase', color: TEXT_PRIMARY }}>{activeMonth.name}</Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color="#F59E0B" />
        </Pressable>
        <Pressable onPress={() => setIsYearOpen(true)} style={[styles.dropdownTrigger, { width: 120 }]}>
          <Text style={{ fontWeight: '800', fontSize: 13, color: TEXT_PRIMARY }}>{activeYear.code}</Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color="#F59E0B" />
        </Pressable>
      </View>

      <Modal visible={isMonthOpen} transparent animationType="fade" onRequestClose={() => setIsMonthOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { marginTop: Math.max(insets.top, 24), marginBottom: Math.max(insets.bottom, 24) }]}>
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <LinearGradient
                colors={['#F7F9F6', '#F2FAF5', '#EEFDFC', '#F7F9F6']}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
              />
              <RadialGlow size={240} color="#DDF8D7" opacity={0.3} style={{ top: -90, left: -80 }} />
              <RadialGlow size={260} color="#DDFBFF" opacity={0.28} style={{ bottom: -100, right: -90 }} />
            </View>
            <View style={{ paddingHorizontal: 22, paddingTop: 22, flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.headerIconBox}>
                <Image source={NOTEBOOK_ICON} style={{ width: 44, height: 44 }} resizeMode="contain" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.3 }}>Select Month</Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: TEXT_MUTED, marginTop: 2 }}>Pick a billing month</Text>
              </View>
              <TouchableOpacity activeOpacity={0.8} onPress={() => setIsMonthOpen(false)} style={styles.closeBtn}>
                <Text style={{ fontSize: 15, color: TEXT_PRIMARY, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 }}>
              {MONTH_DATA.map(m => {
                const active = activeMonth.code === m.code;
                return (
                  <Pressable
                    key={m.code}
                    onPress={() => { onSelectMonth(m); setIsMonthOpen(false); }}
                    style={{ width: '31%', paddingVertical: 16, borderRadius: 16, marginBottom: 10, alignItems: 'center', backgroundColor: active ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.85)', borderWidth: 1, borderColor: active ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.6)' }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, color: active ? '#D97706' : TEXT_SECONDARY }}>{m.name.substring(0, 3)}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={{ paddingHorizontal: 22, paddingTop: 10, paddingBottom: 20 }}>
              <TouchableOpacity onPress={() => setIsMonthOpen(false)} style={{ paddingVertical: 14, borderRadius: 16, backgroundColor: 'rgba(247,249,246,0.95)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center' }}>
                <Text style={{ fontWeight: '900', color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 2, fontSize: 10 }}>Cancel Selection</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isYearOpen} transparent animationType="fade" onRequestClose={() => setIsYearOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { marginTop: Math.max(insets.top, 24), marginBottom: Math.max(insets.bottom, 24) }]}>
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <LinearGradient
                colors={['#F7F9F6', '#F2FAF5', '#EEFDFC', '#F7F9F6']}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
              />
              <RadialGlow size={240} color="#DDFBFF" opacity={0.3} style={{ top: -90, right: -80 }} />
              <RadialGlow size={260} color="#F8FFD8" opacity={0.28} style={{ bottom: -100, left: -90 }} />
            </View>
            <View style={{ paddingHorizontal: 22, paddingTop: 22, flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.headerIconBox}>
                <Image source={NOTEBOOK_ICON} style={{ width: 44, height: 44 }} resizeMode="contain" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.3 }}>Select Year</Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: TEXT_MUTED, marginTop: 2 }}>Pick a fiscal year</Text>
              </View>
              <TouchableOpacity activeOpacity={0.8} onPress={() => setIsYearOpen(false)} style={styles.closeBtn}>
                <Text style={{ fontSize: 15, color: TEXT_PRIMARY, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              style={{ flexGrow: 0, maxHeight: 350, paddingHorizontal: 16, paddingTop: 18 }}
              showsVerticalScrollIndicator={false}
            >
              {YEAR_DATA.map(y => {
                const active = activeYear.code === y.code;
                return (
                  <TouchableOpacity
                    key={y.code}
                    onPress={() => { onSelectYear(y); setIsYearOpen(false); }}
                    style={{ paddingVertical: 15, borderRadius: 16, marginBottom: 10, alignItems: 'center', backgroundColor: active ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.85)', borderWidth: 1, borderColor: active ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.6)' }}
                  >
                    <Text style={{ fontWeight: '800', fontSize: 14, color: active ? '#D97706' : TEXT_PRIMARY }}>{y.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={{ paddingHorizontal: 22, paddingTop: 10, paddingBottom: 20 }}>
              <TouchableOpacity onPress={() => setIsYearOpen(false)} style={{ paddingVertical: 14, borderRadius: 16, backgroundColor: 'rgba(247,249,246,0.95)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center' }}>
                <Text style={{ fontWeight: '900', color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 2, fontSize: 10 }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const SummaryCard = memo(({ label, value, icon, color }: any) => (
  <View style={styles.summaryCard}>
    <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: color, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
      <MaterialCommunityIcons name={icon} size={18} color="white" />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={1}>{value}</Text>
    </View>
  </View>
));

const FeeEditorModal = memo(({ visible, onClose, item, onSave, students, structures }: any) => {
  const insets = useSafeAreaInsets();
  const [amount,      setAmount]    = useState('');
  const [selectedType,setSelectedType] = useState('');
  const [sName,       setSName]     = useState('');
  const [sid,         setSid]       = useState('');
  const [dueDate,     setDueDate]   = useState(new Date().toISOString().split('T')[0]);
  const [showPicker,  setShowPicker]  = useState(false);
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [showTypePicker,    setShowTypePicker]    = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  useEffect(() => {
    if (item && visible) {
      setAmount(item.amount?.toString() || '0');
      setSelectedType(item.type || '');
      setSName(item.student_name || item.studentName || '');
      setSid(item.student_id || item.studentId || '');
      setDueDate(item.due_date || new Date().toISOString().split('T')[0]);
    }
  }, [item, visible]);

  const filteredStudents = useMemo(() => {
    if (!studentSearch) return students;
    const sq = studentSearch.toLowerCase();
    return students?.filter((s: any) =>
      s.name.toLowerCase().includes(sq) || (s.studentId && s.studentId.toLowerCase().includes(sq))
    );
  }, [students, studentSearch]);

  const handleSave = () => {
    if (!sid || !sName || !selectedType) {
      Alert.alert('Incomplete Record', 'Please complete student and category selection.');
      return;
    }
    onSave({
      ...item,
      amount: parseFloat(amount),
      type: selectedType,
      student_name: sName,
      student_id: sid,
      due_date: dueDate,
      status: item?.status || 'unpaid',
      date: item?.date || new Date().toISOString().split('T')[0]
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
        <AuroraBackground />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={{ paddingTop: Math.max(insets.top, 20), paddingHorizontal: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 28 }}>
                <TouchableOpacity onPress={onClose} activeOpacity={0.8} style={styles.backCircle}>
                  <MaterialCommunityIcons name="close" size={26} color="#F59E0B" />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.eyebrow}>{item?.id === 'NEW' ? 'New Fee Entry' : 'Update Fee Record'}</Text>
                  <Text style={styles.title}>{item?.id === 'NEW' ? 'Fee Entry' : 'Update Record'}</Text>
                </View>
                <View style={styles.headerIconBox}>
                  <Image source={NOTEBOOK_ICON} style={{ width: 46, height: 46 }} resizeMode="contain" />
                </View>
              </View>

              <View style={{ marginBottom: 24 }}>
                <Text style={styles.sectionLabel}>Student Detail</Text>
                <TouchableOpacity
                  onPress={() => item?.id === 'NEW' && setShowStudentPicker(!showStudentPicker)}
                  activeOpacity={0.9}
                  style={[styles.selectField, item?.id !== 'NEW' && { opacity: 0.6 }]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <MaterialCommunityIcons name="account-search-outline" size={22} color="#F59E0B" style={{ marginRight: 12 }} />
                    <Text style={[styles.selectFieldText, !sName && { color: '#9CA3AF' }]} numberOfLines={1}>
                      {sName || 'Select Student Vendor'}
                    </Text>
                  </View>
                  {item?.id === 'NEW' && <MaterialCommunityIcons name="chevron-right" size={22} color="#F59E0B" />}
                </TouchableOpacity>

                {showStudentPicker && (
                  <View style={styles.pickerCard}>
                    <TextInput
                      style={styles.input}
                      placeholder="Search student..."
                      placeholderTextColor="#9CA3AF"
                      value={studentSearch}
                      onChangeText={setStudentSearch}
                    />
                    <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={{ maxHeight: 260 }}>
                      {filteredStudents?.map((s: any) => (
                        <TouchableOpacity
                          key={s.id}
                          style={styles.studentOption}
                          onPress={() => { setSName(s.name); setSid(s.studentId || s.student_id); setShowStudentPicker(false); }}
                        >
                          <Text style={{ fontWeight: '800', fontSize: 14, color: TEXT_PRIMARY }}>{s.name}</Text>
                          <Text style={styles.studentOptionId}>{s.studentId || s.student_id}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionLabel}>Category</Text>
                  <TouchableOpacity
                    onPress={() => item?.id === 'NEW' && setShowTypePicker(!showTypePicker)}
                    activeOpacity={0.9}
                    style={[styles.selectField, item?.id !== 'NEW' && { opacity: 0.6 }]}
                  >
                    <Text style={[styles.selectFieldText, !selectedType && { color: '#9CA3AF' }]} numberOfLines={1}>
                      {selectedType || 'Type'}
                    </Text>
                  </TouchableOpacity>
                  {showTypePicker && item?.id === 'NEW' && (
                    <View style={styles.pickerCard}>
                      <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                        {structures.map((s: any) => (
                          <TouchableOpacity
                            key={s.id}
                            style={styles.studentOption}
                            onPress={() => {
                              const cleanType = s.name.toLowerCase().includes('admission') ? 'Admission' : s.name;
                              setSelectedType(cleanType);
                              setAmount(s.amount.toString());
                              setShowTypePicker(false);
                            }}
                          >
                            <Text style={{ fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: TEXT_SECONDARY }}>{s.name}</Text>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#F59E0B', marginTop: 2 }}>₹{s.amount}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionLabel}>Due Date</Text>
                  <TouchableOpacity onPress={() => setShowPicker(true)} activeOpacity={0.9} style={styles.selectField}>
                    <Text style={[styles.selectFieldText, { color: TEXT_PRIMARY }]}>{formatDate(dueDate)}</Text>
                    <MaterialCommunityIcons name="calendar-clock" size={20} color="#F59E0B" />
                  </TouchableOpacity>
                  {showPicker && <DateTimePicker value={new Date(dueDate)} mode="date" display="default" onChange={(_: DateTimePickerEvent, d?: Date) => { setShowPicker(false); if (d) setDueDate(d.toISOString().split('T')[0]); }} />}
                </View>
              </View>

              <View style={{ marginBottom: 32 }}>
                <Text style={styles.sectionLabel}>Fee Amount</Text>
                <View style={styles.amountBox}>
                  <View style={styles.rupeeTile}>
                    <Text style={{ fontSize: 28, fontWeight: '900', color: '#FFFFFF' }}>₹</Text>
                  </View>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor="#CBD5E0"
                  />
                </View>
              </View>

              <TouchableOpacity onPress={handleSave} activeOpacity={0.9} style={{ borderRadius: 18, overflow: 'hidden' }}>
                <LinearGradient colors={['#F59E0B', '#D97706']} style={{ height: 56, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
                  <MaterialCommunityIcons name="check-all" size={22} color="white" />
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginLeft: 8 }}>Authorize</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
});

const InvoicePopupModal = memo(({ visible, onClose, payment, student, onDownload }: any) => {
  if (!payment) return null;
  const invoiceNo = `HK-${new Date(payment.paid_at || payment.date).getFullYear()}${payment.id.toString().replace(/[^0-9]/g, '').slice(-4).padStart(4, '0')}`;

  const formatDateLocal = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      if (dateString.includes('-') && dateString.length <= 10) {
          const [year, month, day] = dateString.split('-');
          return `${day}/${month}/${year}`;
      }
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? dateString : `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    } catch (e) { return dateString; }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.modalOverlay}>
        <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <LinearGradient
              colors={['#F7F9F6', '#F2FAF5', '#EEFDFC', '#F7F9F6']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
            />
            <RadialGlow size={260} color="#DDF8D7" opacity={0.28} style={{ top: -100, left: -90 }} />
            <RadialGlow size={240} color="#DDFBFF" opacity={0.26} style={{ bottom: -100, right: -80 }} />
          </View>
          <ScrollView style={{ maxHeight: 560 }} showsVerticalScrollIndicator={false}>
            <View style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={styles.headerIconBox}>
                    <Image source={NOTEBOOK_ICON} style={{ width: 40, height: 40 }} resizeMode="contain" />
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={{ color: TEXT_PRIMARY, fontSize: 16, fontWeight: '800', letterSpacing: -0.3 }}>TN HappyKids</Text>
                    <Text style={{ color: TEXT_MUTED, fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 3 }}>{payment.branch?.name || 'Official'} Invoice</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} activeOpacity={0.8} style={styles.closeBtn}>
                  <MaterialCommunityIcons name="close" size={18} color={TEXT_PRIMARY} />
                </TouchableOpacity>
              </View>

              <View style={[styles.innerGlass, { padding: 16, marginBottom: 14 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: TEXT_MUTED }}>Invoice No</Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: TEXT_PRIMARY }}>{invoiceNo}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: TEXT_MUTED }}>Paid Date</Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: TEXT_PRIMARY }}>{payment.paid_at ? formatDateLocal(payment.paid_at) : formatDateLocal(payment.date)}</Text>
                </View>
              </View>

              <Text style={[styles.sectionLabel, { marginLeft: 2 }]}>Student Details</Text>
              <View style={[styles.innerGlass, { padding: 14, marginBottom: 14, flexDirection: 'row', alignItems: 'center' }]}>
                <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <MaterialCommunityIcons name="account-school" size={28} color="#92400E" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', fontSize: 16, color: TEXT_PRIMARY, letterSpacing: -0.3 }} numberOfLines={1}>{payment.student_name}</Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: TEXT_MUTED, marginTop: 2 }}>ID: {student?.studentId || payment.student_id}</Text>
                </View>
              </View>

              <Text style={[styles.sectionLabel, { marginLeft: 2 }]}>Payer Information</Text>
              <View style={[styles.innerGlass, { padding: 14, marginBottom: 14 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <MaterialCommunityIcons name="account-tie" size={16} color="#3B82F6" />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: TEXT_MUTED, marginLeft: 8 }}>Payer Name:</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: TEXT_PRIMARY, marginLeft: 8, flex: 1 }} numberOfLines={1}>{(payment as any).parent_name || (payment as any).father_name || '---'}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="phone" size={16} color="#10B981" />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: TEXT_MUTED, marginLeft: 8 }}>Contact Phone:</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: TEXT_SECONDARY, marginLeft: 8, flex: 1 }} numberOfLines={1}>{(payment as any).phone || '---'}</Text>
                </View>
              </View>

              <Text style={[styles.sectionLabel, { marginLeft: 2 }]}>Fee Information</Text>
              <View style={[styles.innerGlass, { padding: 16, marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                <View>
                  <Text style={{ fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: TEXT_MUTED }}>{payment.type}</Text>
                  <Text style={{ fontWeight: '900', fontSize: 24, color: TEXT_PRIMARY, letterSpacing: -0.5, marginTop: 4 }}>₹{payment.amount?.toLocaleString()}</Text>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#D97706', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Due: {formatDateLocal(payment.due_date)}
                  </Text>
                </View>
                <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                  <Text style={{ color: '#065F46', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Cleared</Text>
                </View>
              </View>

              <TouchableOpacity onPress={() => onDownload(payment, 'download')} activeOpacity={0.9} style={{ borderRadius: 18, overflow: 'hidden', marginBottom: 4 }}>
                <LinearGradient colors={['#F59E0B', '#D97706']} style={{ height: 56, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
                  <MaterialCommunityIcons name="file-pdf-box" size={22} color="white" />
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginLeft: 8 }}>Generate Receipt</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
});

export default function FeesManagementScreenV2({ navigation }: { navigation: NavigationProps }) {
  const { user, users, fees, transactions, branches, refreshFees, addTransaction, updateTransaction, deleteTransaction, fetchData, updateUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const isMasterAdmin = user?.role === 'master_admin';
  const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other'];

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

  const [activeTab, setActiveTab] = useState('manage');
  const [editModal, setEditModal] = useState({ visible: false, item: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [branchFilterId, setBranchFilterId] = useState<string | null>(isMasterAdmin ? null : (user?.branch_id?.toString() || null));
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentModal, setPaymentModal] = useState({ visible: false, item: null as FeeRecord | null });
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [payerName, setPayerName] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [isResyncing, setIsResyncing] = useState(false);

  const handleResyncLedger = useCallback(async () => {
    Alert.alert('Resync Ledger', 'This will clean up duplicate fee records and create missing income entries for paid fees. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Resync', onPress: async () => {
        setIsResyncing(true);
        try {
          await api.post('/fees/cleanup-duplicates');
          await api.post('/fees/backfill-transactions');
          await fetchData();
          Alert.alert('Resync Complete', 'Duplicate records cleaned, missing income entries created.');
        } catch (e) {
          Alert.alert('Resync Failed', 'Could not complete ledger resync.');
        } finally {
          setIsResyncing(false);
        }
      }},
    ]);
  }, [fetchData]);

  const generateInvoiceHtml = (item: FeeRecord, qrSvg?: string, logoBase64?: string) => `
    <html>
      <head>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #1F2937; line-height: 1.5; }
          .header { text-align: center; margin-bottom: 50px; }
          .logo-img { width: 80px; height: 80px; margin-bottom: 10px; }
          .title { font-size: 28px; font-weight: 900; color: #111827; letter-spacing: -1px; }
          .subtitle { color: #F59E0B; font-weight: 700; text-transform: uppercase; font-size: 12px; letter-spacing: 2px; }
          .receipt-box { border: 2px solid #F3F4F6; border-radius: 24px; padding: 30px; margin-top: 30px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
          .row { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px dashed #E5E7EB; padding-bottom: 10px; }
          .label { font-size: 10px; font-weight: 900; color: #9CA3AF; text-transform: uppercase; letter-spacing: 1px; }
          .value { font-size: 14px; font-weight: 700; color: #1F2937; }
          .amount-box { background: #FDF2F8; border: 1px solid #FBCFE8; padding: 20px; border-radius: 20px; text-align: center; margin-top: 40px; }
          .amount-label { font-size: 10px; font-weight: 900; color: #DB2777; text-transform: uppercase; letter-spacing: 2px; }
          .amount-value { font-size: 36px; font-weight: 900; color: #BE185D; margin-top: 5px; }
          .paid-stamp { border: 3px solid #10B981; color: #10B981; display: inline-block; padding: 5px 20px; border-radius: 10px; font-weight: 900; transform: rotate(-10deg); position: absolute; top: 100px; right: 80px; font-size: 24px; opacity: 0.5; }
          .footer { margin-top: 60px; text-align: center; font-size: 10px; color: #9CA3AF; border-top: 1px solid #F3F4F6; padding-top: 20px; }
          .contact-info { font-size: 10px; font-weight: 700; color: #4B5563; margin-top: 5px; }
          .qr-section { text-align: center; margin-top: 40px; }
          .qr-section svg { width: 150px; height: 150px; }
          .qr-label { font-size: 9px; font-weight: 900; color: #9CA3AF; text-transform: uppercase; letter-spacing: 2px; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="paid-stamp">PAID</div>
        <div class="header">
          ${logoBase64 ? `<img class="logo-img" src="${logoBase64}" alt="TN HappyKids" />` : ''}
          <div class="title">TN HAPPYKIDS</div>
          <div class="subtitle">${item.branch?.name || ''} • Official Fee Receipt</div>
        </div>

        <div class="receipt-box">
          <div class="row">
            <span class="label">Invoice No</span>
            <span class="value">HK-${new Date(item.paid_at || item.date).getFullYear()}${item.id.toString().replace(/[^0-9]/g, '').slice(-4).padStart(4, '0')}</span>
          </div>
          <div class="row">
            <span class="label">Paid Date</span>
            <span class="value">${item.paid_at ? formatDate(item.paid_at) : formatDate(item.date)}</span>
          </div>
          <div class="row">
            <span class="label">Fee Type</span>
            <span class="value">${item.type}</span>
          </div>
          <div class="row" style="margin-top: 20px;">
            <span class="label">Student Name</span>
            <span class="value" style="font-size: 18px;">${item.student_name}</span>
          </div>
          <div class="row">
            <span class="label">Student ID</span>
            <span class="value">${item.student_id}</span>
          </div>
          <div class="row">
            <span class="label">Due Date</span>
            <span class="value">${item.due_date ? formatDate(item.due_date) : (item.date ? formatDate(item.date) : 'N/A')}</span>
          </div>
          <div class="row" style="margin-top: 20px;">
            <span class="label">Payment Method</span>
            <span class="value">${item.payment_method || 'N/A'}</span>
          </div>
          <div class="row">
            <span class="label">Payer Name</span>
            <span class="value">${item.payer_name || 'N/A'}</span>
          </div>
          <div class="row">
            <span class="label">Payer Phone</span>
            <span class="value">${item.payer_phone || 'N/A'}</span>
          </div>
        </div>

        <div class="amount-box">
            <div class="amount-label">Total Amount Paid</div>
            <div class="amount-value">₹${item.amount.toLocaleString('en-IN')}</div>
        </div>

        ${qrSvg ? `
        <div class="qr-section">
          ${qrSvg}
          <div class="qr-label">Scan to verify • TN HappyKids</div>
        </div>` : ''}

        <div class="footer">
          Computer Generated Receipt • Valid Without Signature • Issued on ${new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
        </div>
      </body>
    </html>
  `;

  const handleInvoiceAction = async (item: FeeRecord, mode: 'view' | 'download') => {
    try {
      setIsProcessingPdf(true);

      const student = findUserByFeeId(item.student_id);
      const resolvedItem = {
        ...item,
        student_id: student?.studentId || item.student_id,
        parent_name: student?.parentName || student?.fatherName || '',
        due_day: student?.fee_due_day || '05',
        phone: student?.phone || student?.fatherPhone || student?.motherPhone || ''
      };

      const deepLink = `tnhappykids://invoice/${item.id}`;
      let qrSvg: string | undefined;
      try {
        qrSvg = await QRCode.toString(deepLink, { type: 'svg', width: 6, margin: 1 });
      } catch (qrErr) {
        console.warn('QR generation failed:', qrErr);
      }

      let logoBase64: string | undefined;
      try {
        const asset = Asset.fromModule(require('../../../assets/splash.png'));
        await asset.downloadAsync();
        const localUri = asset.localUri || asset.uri;
        if (localUri) {
          const b64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
          logoBase64 = `data:image/png;base64,${b64}`;
        }
      } catch {}

      const html = generateInvoiceHtml(resolvedItem as any, qrSvg, logoBase64);

      if (mode === 'view') {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });

        const sanitizedName = (item.student_name || 'Student').replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
        const fileName = `${sanitizedName}_${item.date}.pdf`;
        const newUri = `${FileSystem.cacheDirectory}${fileName}`;

        try {
          await FileSystem.deleteAsync(newUri, { idempotent: true });
          await FileSystem.moveAsync({ from: uri, to: newUri });
        } catch (fileErr) {
          console.error('File operation error:', fileErr);
          await Sharing.shareAsync(uri, {
            UTI: 'com.adobe.pdf',
            mimeType: 'application/pdf'
          });
          return;
        }

        await Sharing.shareAsync(newUri, {
          UTI: 'com.adobe.pdf',
          mimeType: 'application/pdf',
          dialogTitle: `Save Receipt: ${sanitizedName}`
        });
      }
    } catch (err: any) {
      console.error('PDF Generation/Sharing Error:', err);
      Alert.alert('PDF Error', `Action could not be completed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const currentMonthIdx = new Date().getMonth();
  const currentYearStr  = new Date().getFullYear().toString();
  const [activeMonth, setActiveMonth] = useState(MONTH_DATA[currentMonthIdx]);
  const [activeYear,  setActiveYear]  = useState(YEAR_DATA.find(y => y.code === currentYearStr) || YEAR_DATA[6]);

  useEffect(() => {
    api.get('/fee-structures').then(res => setFeeStructures(res.data)).catch(() => {});
    refreshFees();
  }, []);

  const students = useMemo(() => users.filter(u => u.role === 'student' && u.status === 'active'), [users]);

  const userById = useMemo(() => {
    const m = new Map<string, any>();
    users.forEach(u => { if (u.id != null) m.set(u.id.toString(), u); });
    return m;
  }, [users]);
  const userByStudentId = useMemo(() => {
    const m = new Map<string, any>();
    users.forEach(u => { if (u.studentId != null) m.set(u.studentId.toString(), u); });
    return m;
  }, [users]);
  const findUserByFeeId = useCallback((feeId: string | undefined) =>
    feeId == null ? undefined : (userById.get(feeId.toString()) || userByStudentId.get(feeId.toString())),
  [userById, userByStudentId]);

  const filteredFees = useMemo(() => {
    let list = [...fees];
    const sq = searchQuery.toLowerCase();

    const yCode = activeYear.code;
    const mCode = activeMonth.code;
    const monthPrefix = `${yCode}-${mCode}-`;

    let baseList: any[] = [];

    if (activeTab === 'manage') {
        const todayStr = new Date().toISOString().split('T')[0];

        const feeByStudentDbId = new Map<string, any>();
        list.forEach(f => {
            const isAdmission = (f.type || '').toLowerCase().includes('admission');
            if (isAdmission) return;
            const isSelectedMonth = f.due_date ? f.due_date.includes(monthPrefix) : f.date.includes(monthPrefix);
            const isOverdue = f.status === 'unpaid' && f.due_date && f.due_date < todayStr;
            if (!isSelectedMonth && !isOverdue) return;

            const matchedStudent = findUserByFeeId(f.student_id);
            if (matchedStudent) {
                if (!feeByStudentDbId.has(matchedStudent.id)) {
                    feeByStudentDbId.set(matchedStudent.id, f);
                }
            }
        });

        students.forEach(student => {
            const feeAmount = parseInt(student.fees || '0');
            if (feeAmount <= 0) return;

            const existingFee = feeByStudentDbId.get(student.id);
            if (existingFee) {
                baseList.push(existingFee);
            } else {
                const dueDay = student.fee_due_day?.toString() || '5';
                const dueDate = `${yCode}-${mCode}-${dueDay.padStart(2, '0')}`;
                baseList.push({
                    id: `VIRTUAL_${student.id}_${mCode}_${yCode}`,
                    student_id: student.id,
                    student_name: student.name,
                    type: 'Monthly Fee',
                    amount: feeAmount,
                    status: 'unpaid',
                    date: todayStr,
                    due_date: dueDate,
                    isVirtual: true
                });
            }
        });
    } else if (activeTab === 'admission') {
        baseList = list.filter(f => (f.type || '').split(',').some((t:any) => t.trim().toLowerCase() === 'admission'));
    } else if (activeTab === 'history') {
        const historyList = list.filter(f =>
          (f.status || '').toLowerCase() === 'paid' ||
          f.date.includes(monthPrefix)
        );
        const seen = new Map<string, any>();
        for (const f of historyList) {
          const matchedStudent = findUserByFeeId(f.student_id) || users.find(u => u.name === f.student_name);
          const uid = matchedStudent?.id || f.student_id || f.student_name;
          const typeKey = (f.type || '').toLowerCase().trim();
          const key = `${uid}|${typeKey}`;
          const existing = seen.get(key);
          if (!existing || f.date > existing.date) {
            seen.set(key, f);
          }
        }
        baseList = Array.from(seen.values());
    }

    if (sq) {
        baseList = baseList.filter(f =>
            (f.student_name || '').toLowerCase().includes(sq) ||
            (f.student_id || '').toLowerCase().includes(sq)
        );
    }

    const result = baseList.filter(f => {
      const student = findUserByFeeId(f.student_id);
      if (!student || student.status !== 'active') return false;
      if (isMasterAdmin && branchFilterId && student.branch_id?.toString() !== branchFilterId) return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
    return result;
  }, [fees, activeTab, activeMonth, activeYear, searchQuery, students, users, isMasterAdmin, branchFilterId, findUserByFeeId]);

  const stats = useMemo(() => {
    const total = filteredFees.reduce((acc, f) => acc + (f.amount || 0), 0);
    const paid = filteredFees.filter(f => f.status === 'paid').reduce((acc, f) => acc + (f.amount || 0), 0);
    const todayStr = new Date().toISOString().split('T')[0];
    const overdue = filteredFees.filter(f => f.status === 'unpaid' && f.due_date && f.due_date < todayStr).reduce((acc, f) => acc + (f.amount || 0), 0);
    return {
      total,
      paid,
      pending: total - paid,
      overdue,
      count: filteredFees.length,
      pct: total > 0 ? Math.round((paid/total) * 100) : 0
    };
  }, [filteredFees]);

  const handleUpdateFee = async (updatedItem: any) => {
    try {
      setIsLocalLoading(true);
      const payload = {
          student_id: updatedItem.student_id,
          student_name: updatedItem.student_name,
          type: updatedItem.type,
          amount: updatedItem.amount,
          status: updatedItem.status,
          date: updatedItem.date,
          due_date: updatedItem.due_date
      };
      if (updatedItem.id === 'NEW' || (updatedItem.id?.toString().startsWith('VIRTUAL_'))) {
        const existingFee = fees.find(f =>
          f.student_id?.toString() === updatedItem.student_id?.toString() &&
          (f.type || '').toLowerCase() === (updatedItem.type || '').toLowerCase() &&
          f.due_date === updatedItem.due_date
        );
        if (existingFee) {
          await api.put(`/fees/${existingFee.id}`, payload);
        } else {
          await api.post('/fees', payload);
        }
      } else {
        await api.put(`/fees/${updatedItem.id}`, payload);
      }

      const student = findUserByFeeId(updatedItem.student_id);

      await fetchData();

      if (updatedItem.due_date && student) {
        const newDueDay = updatedItem.due_date.split('-')[2];
        const currentDueDay = student.fee_due_day?.toString().padStart(2, '0');

        if (newDueDay !== currentDueDay && (updatedItem.type || '').toLowerCase().includes('monthly')) {
          try {
            await updateUser(student.id, {
              fee_due_day: parseInt(newDueDay).toString()
            });
          } catch (syncErr) {
            console.error('Failed to sync due day to user profile:', syncErr);
          }
        }
      }

      const today = new Date().toISOString().split('T')[0];
      const isAdmission = (updatedItem.type || '').toLowerCase().includes('admission');
      const txName = isAdmission
        ? `Admission: ${updatedItem.student_name}`
        : `Monthly Fee: ${updatedItem.student_name}`;
      const saveStudent = findUserByFeeId(updatedItem.student_id);
      const saveBranchId = saveStudent?.branch_id;

      const findFeeTx = () => {
        const exact = (transactions || []).find(t =>
          t.category === 'Fees' && t.type === 'income' &&
          t.name === txName &&
          t.student_id === updatedItem.student_id?.toString()
        );
        if (exact) return exact;
        return (transactions || []).find(t =>
          t.category === 'Fees' && t.type === 'income' &&
          t.name === txName && !t.student_id
        );
      };

      if (updatedItem.status === 'paid') {
        try {
          const existingTx = findFeeTx();
          if (existingTx) {
            await updateTransaction(existingTx.id, {
              amount: updatedItem.amount,
              name: txName,
              date: today,
              branch_id: saveBranchId,
              student_id: updatedItem.student_id?.toString()
            });
          } else {
            await addTransaction({
              id: Date.now().toString(),
              name: txName,
              amount: updatedItem.amount,
              category: 'Fees',
              type: 'income',
              date: today,
              student_id: updatedItem.student_id?.toString(),
              branch_id: saveBranchId
            });
          }
        } catch (txErr) {
          console.error('Failed to sync income ledger:', txErr);
        }
      } else {
        try {
          const existingTx = findFeeTx();
          if (existingTx) {
            await deleteTransaction(existingTx.id);
          }
        } catch (txErr) {
          console.error('Failed to remove from income ledger:', txErr);
        }
      }

      setIsLocalLoading(false);
      setEditModal({ visible: false, item: null });
      setTimeout(() => {
        Alert.alert('Treasury Update ✨', 'The record has been updated and posted to income history.');
      }, 300);
    } catch (err) {
      console.error('Update fee error:', err);
      setIsLocalLoading(false);
      Alert.alert('Error', 'Financial update failed.');
    }
  };

  const toggleStatus = async (item: FeeRecord) => {
    const targetStatus = item.status === 'paid' ? 'unpaid' : 'paid';
    if (targetStatus === 'unpaid') {
      Alert.alert('Mark as UNPAID?', `₹${(item.amount || 0).toLocaleString()} — ${item.student_name}`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => executeToggle(item, targetStatus, '', '', '') }
      ]);
      return;
    }
    setPayerName(item.student_name || '');
    setPayerPhone('');
    setPaymentMethod('Cash');
    setPaymentModal({ visible: true, item });
  };

  const executeToggle = async (item: FeeRecord, targetStatus: string, payMethod?: string, payName?: string, payPhone?: string) => {
    try {
      setIsLocalLoading(true);

      const feeStudent = findUserByFeeId(item.student_id);
      const feeBranchId = feeStudent?.branch_id;

      if (item.id.toString().startsWith('VIRTUAL_')) {
        const matchedStudent = findUserByFeeId(item.student_id);
        const realStudentId = matchedStudent?.id || item.student_id;
        const existingFee = fees.find(f =>
          f.student_id?.toString() === realStudentId?.toString() &&
          (f.type || '').toLowerCase() === (item.type || '').toLowerCase() &&
          f.due_date === item.due_date
        );
        if (existingFee) {
          await api.put(`/fees/${existingFee.id}`, {
            status: targetStatus,
            paid_at: targetStatus === 'paid' ? new Date().toISOString().replace('T', ' ').substring(0, 19) : null,
            payment_method: payMethod || null,
            payer_name: payName || null,
            payer_phone: payPhone || null,
          });
        } else {
          await api.post('/fees', {
            student_id: realStudentId,
            student_name: item.student_name,
            type: item.type,
            amount: item.amount,
            status: targetStatus,
            date: new Date().toISOString().split('T')[0],
            due_date: item.due_date,
            paid_at: targetStatus === 'paid' ? new Date().toISOString().replace('T', ' ').substring(0, 19) : null,
            payment_method: payMethod || null,
            payer_name: payName || null,
            payer_phone: payPhone || null,
            branch_id: feeBranchId,
          });
        }
      } else {
        await api.post(`/fees/${item.id}/toggle-status`, {
          payment_method: payMethod || null,
          payer_name: payName || null,
          payer_phone: payPhone || null,
        });
      }

      await fetchData();
      setIsLocalLoading(false);
    } catch (err) {
      console.error('Toggle error:', err);
      try { await Promise.all([refreshFees(), fetchData()]); } catch {}
      setIsLocalLoading(false);
      Alert.alert('Error', 'Failed to update payment status.');
    }
  };

  const renderFeeItem = ({ item }: any) => {
    const isOverdue = item.status === 'unpaid' && item.due_date && new Date(item.due_date) < new Date(new Date().toISOString().split('T')[0]);

    const student = findUserByFeeId(item.student_id);
    const displayId = student?.studentId || item.student_id;
    const branchName = item.branch?.name || student?.branch?.name || branches.find(b => b.id === (item.branch_id || student?.branch_id))?.name;

    return (
      <View
        style={[
          styles.glassCard,
          { marginBottom: 14, overflow: 'hidden', borderColor: isOverdue ? '#FECACA' : 'rgba(255,255,255,0.6)' }
        ]}
      >
        <View style={{ padding: 16, backgroundColor: isOverdue ? 'rgba(254,226,226,0.45)' : 'transparent' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={{ width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: isOverdue ? '#EF4444' : (item.status === 'paid' ? '#10B981' : '#F59E0B') }}>
                <MaterialCommunityIcons name="account-school-outline" size={26} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', fontSize: 16, color: TEXT_PRIMARY, letterSpacing: -0.3 }} numberOfLines={1}>{item.student_name}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 6, gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="badge-account" size={11} color={TEXT_MUTED} />
                    <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 3, color: TEXT_MUTED }}>
                      {displayId}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="calendar-clock" size={11} color={isOverdue ? '#EF4444' : TEXT_MUTED} />
                    <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 3, color: isOverdue ? '#EF4444' : TEXT_MUTED }}>
                      {formatDate(item.due_date)}
                    </Text>
                  </View>
                  {branchName && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(247,249,246,0.95)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                      <MaterialCommunityIcons name="domain" size={9} color={TEXT_MUTED} />
                      <Text style={{ fontSize: 8, fontWeight: '800', textTransform: 'uppercase', marginLeft: 3, color: TEXT_MUTED }}>
                        {branchName}
                      </Text>
                    </View>
                  )}
                  {item.status === 'paid' && item.paid_at && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="check-circle" size={11} color="#10B981" />
                      <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 3, color: '#059669' }}>
                        {formatDate(item.paid_at || item.date)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View style={{ backgroundColor: item.status === 'paid' ? '#10B981' : '#EF4444', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}>
              <Text style={{ fontSize: 9, fontWeight: '900', color: 'white', textTransform: 'uppercase', letterSpacing: 1 }}>
                {item.status === 'paid' ? 'PAID' : 'UNPAID'}
              </Text>
            </View>
          </View>

          <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(31,45,40,0.08)', paddingTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: TEXT_MUTED, marginBottom: 3 }}>{item.type}</Text>
              <Text style={{ fontWeight: '900', fontSize: 22, color: TEXT_PRIMARY, letterSpacing: -0.5 }}>₹{item.amount.toLocaleString()}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => toggleStatus(item as any)}
                activeOpacity={0.85}
                style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: item.status === 'paid' ? '#EF4444' : '#10B981' }}
              >
                <MaterialCommunityIcons name={item.status === 'paid' ? 'close' : 'check'} size={18} color="white" />
              </TouchableOpacity>
              {item.status === 'paid' && (
                <>
                  <TouchableOpacity
                    onPress={() => handleInvoiceAction(item as any, 'view')}
                    activeOpacity={0.85}
                    style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(31,45,40,0.08)', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <MaterialCommunityIcons name="eye-outline" size={18} color="#EC4899" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleInvoiceAction(item as any, 'download')}
                    activeOpacity={0.85}
                    style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <MaterialCommunityIcons name="file-download-outline" size={18} color="white" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const ListHeader = useMemo(() => (
    <View>
      <View style={{ paddingTop: Math.max(insets.top, 56) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} style={styles.backCircle}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY }}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.eyebrow}>School Finance</Text>
            <Text style={styles.title}>Treasury</Text>
          </View>
          <View style={styles.headerIconBox}>
            <Image source={NOTEBOOK_ICON} style={{ width: 46, height: 46 }} resizeMode="contain" />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
          <TouchableOpacity
            onPress={() => setSearchModalVisible(true)}
            activeOpacity={0.85}
            style={{ flex: 1, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
          >
            <MaterialCommunityIcons name="magnify" size={18} color={TEXT_SECONDARY} />
            <Text style={{ color: TEXT_SECONDARY, fontWeight: '700', fontSize: 12, marginLeft: 8 }}>Search records</Text>
          </TouchableOpacity>
          {isMasterAdmin && (
            <TouchableOpacity
              onPress={handleResyncLedger}
              disabled={isResyncing}
              activeOpacity={0.85}
              style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)', alignItems: 'center', justifyContent: 'center' }}
            >
              {isResyncing ? <ActivityIndicator size="small" color="#D97706" /> : <MaterialCommunityIcons name="sync" size={20} color="#D97706" />}
            </TouchableOpacity>
          )}
        </View>

        {isMasterAdmin && (
          <View style={{ marginTop: SECTION_GAP }}>
            <GlassDropdown selectedBranchId={branchFilterId} onSelect={setBranchFilterId} />
          </View>
        )}

        <View style={[styles.segmented, { marginTop: SECTION_GAP }]}>
          {FEES_TABS.filter(t => isMasterAdmin || t.id !== 'admission').map(t => {
            const active = activeTab === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => setActiveTab(t.id)}
                activeOpacity={0.9}
                style={{
                  flex: 1,
                  borderRadius: 14,
                  paddingVertical: 11,
                  alignItems: 'center',
                  backgroundColor: active ? 'rgba(245,158,11,0.15)' : 'transparent',
                  borderWidth: active ? 1 : 0,
                  borderColor: 'rgba(245,158,11,0.3)',
                }}
              >
                <Text style={{ fontWeight: '800', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: active ? '#D97706' : TEXT_MUTED }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {(activeTab === 'manage' || activeTab === 'history') && (
          <View style={{ marginTop: 24 }}>
            <MonthDropdown activeMonth={activeMonth} activeYear={activeYear} onSelectMonth={setActiveMonth} onSelectYear={setActiveYear} />
          </View>
        )}

        <View style={{ marginBottom: 8 }}>
          <Text style={styles.sectionLabel}>Financial Health</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <SummaryCard label="COLLECTED" value={`₹${stats.paid.toLocaleString()}`} icon="check-decagram-outline" color="#10B981" />
            <SummaryCard label="PENDING" value={`₹${stats.pending.toLocaleString()}`} icon="alert-circle-outline" color="#F59E0B" />
            <SummaryCard label="OVERDUE" value={`₹${stats.overdue.toLocaleString()}`} icon="clock-alert-outline" color="#EF4444" />
            <SummaryCard label="RECORDS" value={stats.count} icon="file-document-outline" color="#3B82F6" />
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 16 }}>
          <Text style={styles.sectionLabelRow}>{activeTab.toUpperCase()} LEDGER</Text>
          {activeTab === 'admission' && (
            <TouchableOpacity
              onPress={() => setEditModal({ visible: true, item: { id: 'NEW', student_id: '', student_name: '', amount: 0, type: 'Admission', status: 'unpaid', date: new Date().toISOString().split('T')[0], due_date: new Date().toISOString().split('T')[0] } as any })}
              activeOpacity={0.85}
              style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', alignItems: 'center', justifyContent: 'center' }}
            >
              <MaterialCommunityIcons name="plus" size={22} color="#D97706" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  ), [activeTab, activeMonth, activeYear, stats, insets, isResyncing, isMasterAdmin, branchFilterId, handleResyncLedger]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />

      <FlatList
        key={activeTab}
        data={activeTab === 'list' ? [] : filteredFees}
        keyExtractor={(item) => item.id}
        renderItem={renderFeeItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#F59E0B"
            colors={["#F59E0B"]}
            progressBackgroundColor={'#FFFFFF'}
          />
        }
        ListEmptyComponent={activeTab === 'list' ? (
          <View>
            {feeStructures.map(f => (
              <View key={f.id} style={[styles.glassCard, { padding: 16, marginBottom: 14 }]}>
                <Text style={{ fontWeight: '800', fontSize: 16, color: TEXT_PRIMARY }}>{f.name}</Text>
                <Text style={{ fontWeight: '900', fontSize: 20, color: '#D97706', marginTop: 4 }}>₹{f.amount}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ color: '#9CA3AF', fontWeight: '800', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 }}>No records found</Text>
          </View>
        )}
        initialNumToRender={8}
        windowSize={10}
        maxToRenderPerBatch={10}
        removeClippedSubviews={false}
      />

      <FeeEditorModal
        visible={editModal.visible}
        onClose={() => setEditModal({ visible: false, item: null })}
        item={editModal.item}
        students={students}
        structures={feeStructures}
        onSave={handleUpdateFee}
      />

      <InvoicePopupModal
        visible={invoiceModalVisible}
        onClose={() => setInvoiceModalVisible(false)}
        payment={selectedInvoice}
        student={findUserByFeeId(selectedInvoice?.student_id)}
        onDownload={handleInvoiceAction}
      />

      <Modal visible={searchModalVisible} transparent animationType="fade" onRequestClose={() => setSearchModalVisible(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setSearchModalVisible(false)} style={styles.modalOverlay}>
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <LinearGradient
                colors={['#F7F9F6', '#F2FAF5', '#EEFDFC', '#F7F9F6']}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
              />
              <RadialGlow size={240} color="#DDF8D7" opacity={0.28} style={{ top: -100, left: -80 }} />
              <RadialGlow size={220} color="#DDFBFF" opacity={0.24} style={{ bottom: -80, right: -70 }} />
            </View>
            <View style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={styles.headerIconBox}>
                    <Image source={NOTEBOOK_ICON} style={{ width: 40, height: 40 }} resizeMode="contain" />
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.3 }}>Search Records</Text>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: TEXT_MUTED, marginTop: 2 }}>Find by name or ID</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setSearchModalVisible(false)} activeOpacity={0.8} style={styles.closeBtn}>
                  <MaterialCommunityIcons name="close" size={18} color={TEXT_SECONDARY} />
                </TouchableOpacity>
              </View>
              <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', marginBottom: 12 }]}>
                <MaterialCommunityIcons name="magnify" size={20} color={TEXT_MUTED} />
                <TextInput
                  placeholder="Search by name or ID..."
                  placeholderTextColor="#9CA3AF"
                  style={{ flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY, paddingVertical: 0 }}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
              </View>
              <Text style={{ fontSize: 10, fontWeight: '700', color: TEXT_MUTED, textAlign: 'center' }}>
                Results update as you type
              </Text>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={paymentModal.visible} transparent animationType="fade" onRequestClose={() => setPaymentModal({ visible: false, item: null })}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <LinearGradient
                colors={['#F7F9F6', '#F2FAF5', '#EEFDFC', '#F7F9F6']}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
              />
              <RadialGlow size={240} color="#F8FFD8" opacity={0.26} style={{ top: -90, right: -80 }} />
              <RadialGlow size={220} color="#DDF8D7" opacity={0.24} style={{ bottom: -80, left: -70 }} />
            </View>
            <View style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={styles.headerIconBox}>
                    <Image source={NOTEBOOK_ICON} style={{ width: 40, height: 40 }} resizeMode="contain" />
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.3 }}>Payment Details</Text>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: TEXT_MUTED, marginTop: 2 }}>{paymentModal.item?.student_name}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setPaymentModal({ visible: false, item: null })} activeOpacity={0.8} style={styles.closeBtn}>
                  <MaterialCommunityIcons name="close" size={18} color={TEXT_SECONDARY} />
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionLabel}>Payment Method</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {PAYMENT_METHODS.map(m => {
                    const active = paymentMethod === m;
                    return (
                      <TouchableOpacity key={m} onPress={() => setPaymentMethod(m)} activeOpacity={0.85}
                        style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, backgroundColor: active ? '#10B981' : 'rgba(247,249,246,0.95)', borderWidth: 1, borderColor: active ? '#10B981' : 'rgba(255,255,255,0.6)' }}>
                        <Text style={{ fontWeight: '900', fontSize: 11, color: active ? 'white' : TEXT_SECONDARY }}>{m}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <Text style={styles.sectionLabel}>Payer Name</Text>
              <TextInput
                style={[styles.input, { marginBottom: 16 }]}
                placeholderTextColor="#9CA3AF"
                placeholder="Enter payer name"
                value={payerName}
                onChangeText={setPayerName}
              />

              <Text style={styles.sectionLabel}>Phone Number</Text>
              <TextInput
                style={[styles.input, { marginBottom: 20 }]}
                placeholderTextColor="#9CA3AF"
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                value={payerPhone}
                onChangeText={setPayerPhone}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setPaymentModal({ visible: false, item: null })}
                  activeOpacity={0.85}
                  style={{ flex: 1, height: 52, borderRadius: 16, backgroundColor: 'rgba(247,249,246,0.95)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontWeight: '800', fontSize: 12, color: TEXT_SECONDARY }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    const item = paymentModal.item;
                    setPaymentModal({ visible: false, item: null });
                    if (item) executeToggle(item, 'paid', paymentMethod, payerName, payerPhone);
                  }}
                  activeOpacity={0.85}
                  style={{ flex: 1, height: 52, borderRadius: 16, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontWeight: '800', fontSize: 12, color: 'white' }}>Confirm Payment</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {(isLocalLoading || isProcessingPdf) && (
        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,20,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <ActivityIndicator color="#F59E0B" size="large" />
          <Text style={{ color: 'white', fontWeight: '800', marginTop: 16, textTransform: 'uppercase', letterSpacing: 3, fontSize: 10 }}>Processing Finance Document...</Text>
        </View>
      )}
    </View>
  );
}
