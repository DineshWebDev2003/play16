import React, { useState, memo, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Alert, Platform, ActivityIndicator
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth, Transaction } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';
import ChoiceModal from '../../components/ChoiceModal';
import PremiumPopup from '../../components/PremiumPopup';
import BranchFilter from '../../components/BranchFilter';

interface NavigationProps { navigate: (screen: string) => void; goBack: () => void; }
interface Props { navigation: NavigationProps; }

const brandColor = '#F59E0B';

function DatePicker({ label, value, onChange, theme, colors }: {
  label: string; value: string; onChange: (v: string) => void; theme: string; colors: any;
}) {
  const [show, setShow] = useState(false);
  const dateValue = value ? new Date(value) : new Date();
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginBottom: 4 }}>{label}</Text>
      <TouchableOpacity onPress={() => setShow(true)} activeOpacity={0.8}
        style={{ backgroundColor: theme === 'dark' ? '#1e1e1e' : '#FFFFFF', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: theme === 'dark' ? '#262626' : '#F3F4F6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontWeight: '900', fontSize: 11, color: value ? (theme === 'dark' ? '#FFFFFF' : '#111827') : (theme === 'dark' ? '#6B7280' : '#9CA3AF') }}>{value || 'Select'}</Text>
        <MaterialCommunityIcons name="calendar-edit" size={14} color={brandColor} />
      </TouchableOpacity>
      {show && <DateTimePicker value={dateValue} mode="date" display="default" accentColor={brandColor} onChange={(_, d) => { setShow(Platform.OS === 'ios'); if (d) { const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const day = String(d.getDate()).padStart(2,'0'); onChange(`${y}-${m}-${day}`); }}} />}
    </View>
  );
}

const TxItem = memo(({ item, onDelete, onEdit, isSelectMode, isSelected, onToggleSelect, isMasterAdmin, onApprove, onReject }: {
    item: Transaction;
    onDelete: (id: string) => void; onEdit: (t: Transaction) => void;
    isSelectMode?: boolean; isSelected?: boolean; onToggleSelect?: (id: string) => void;
    isMasterAdmin?: boolean; onApprove?: (id: string) => void; onReject?: (id: string) => void;
}) => {
    let title = item.name;
    if (item.category === 'Fees') {
        if (item.name.toLowerCase().startsWith('admission:')) title = item.name.split(':')[1]?.trim() || item.name;
        else if (item.name.toLowerCase().startsWith('monthly fee:')) title = item.name.split(':')[1]?.trim() || item.name;
    }
    const isPending = item.status === 'pending';
    return (
    <TouchableOpacity onPress={() => { if (isSelectMode) { onToggleSelect?.(item.id); } else { onEdit(item); } }} activeOpacity={0.9}
      style={{ backgroundColor: isSelected ? '#FEF2F2' : '#FFFFFF', borderRadius: 20, padding: 14, marginBottom: 10, elevation: 3, borderWidth: 1, borderColor: isSelected ? '#EF4444' : '#F3F4F6' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {isSelectMode && (
          <TouchableOpacity onPress={() => onToggleSelect?.(item.id)} style={{ marginRight: 10 }}>
            <MaterialCommunityIcons name={isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'} size={22} color={isSelected ? '#EF4444' : '#6B7280'} />
          </TouchableOpacity>
        )}
        <View style={{ backgroundColor: item.type === 'income' ? '#10B981' : '#EF4444', width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <MaterialCommunityIcons name={item.type === 'income' ? 'arrow-down-bold' : 'arrow-up-bold'} size={20} color="white" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '900', fontSize: 14, color: '#111827', flex: 1 }} numberOfLines={1}>{title}</Text>
            <Text style={{ fontWeight: '900', fontSize: 15, color: item.type === 'income' ? '#10B981' : '#EF4444', marginLeft: 8 }}>₹{item.amount.toLocaleString()}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', gap: 4 }}>
            <View style={{ backgroundColor: item.type === 'income' ? '#D1FAE5' : '#FEE2E2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, color: item.type === 'income' ? '#065F46' : '#991B1B' }}>{item.category}</Text>
            </View>
            <Text style={{ fontSize: 10, fontWeight: '900', color: '#9CA3AF' }}>{item.date}</Text>
            {item.branch?.name && (
              <View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ fontSize: 8, fontWeight: '900', color: '#6B7280' }}>{item.branch.name}</Text>
              </View>
            )}
            {isPending && (
              <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', color: '#B45309' }}>Pending</Text>
              </View>
            )}
            {item.status === 'rejected' && (
              <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', color: '#991B1B' }}>Rejected</Text>
              </View>
            )}
          </View>
          {!isSelectMode && (
            <View style={{ flexDirection: 'row', marginTop: 4, gap: 4 }}>
              {isMasterAdmin && isPending && (
                <>
                  <TouchableOpacity onPress={() => onApprove?.(item.id)} style={{ width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#D1FAE5' }}>
                    <MaterialCommunityIcons name="check-bold" size={12} color="#065F46" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onReject?.(item.id)} style={{ width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEE2E2' }}>
                    <MaterialCommunityIcons name="close" size={13} color="#991B1B" />
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity onPress={() => onEdit(item)} style={{ width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' }}>
                <MaterialCommunityIcons name="pencil-outline" size={12} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(item.id)} style={{ width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2' }}>
                <MaterialCommunityIcons name="trash-can-outline" size={12} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
    );
});

export default function IncomeExpenseScreen({ navigation }: Props) {
  const { transactions, addTransaction, deleteTransaction, updateTransaction, approveTransaction, rejectTransaction, user, users, branches } = useAuth();
  const { theme: appTheme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = appTheme === 'dark';
  const scrollY = useSharedValue(0);

  const [activeTab, setActiveTab] = useState<'history' | 'entry' | 'pending'>('history');
  const [editingItem, setEditingItem] = useState<Transaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [branchFilterId, setBranchFilterId] = useState<string | null>(isAdmin ? (user?.branch_id?.toString() || null) : null);
  const [statusModal, setStatusModal] = useState({ visible: false, title: '', message: '', type: 'info' as 'success' | 'info' | 'error' | 'action' });

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [entryType, setEntryType] = useState<'income' | 'expense'>('income');
  const [entryDate, setEntryDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const isAdmin = user?.role === 'admin';
  const isMasterAdmin = user?.role === 'master_admin';
  const pendingCount = transactions.filter(t => t.status === 'pending').length;

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setAmount(editingItem.amount.toString());
      setCategory(editingItem.category);
      setEntryType(editingItem.type);
      setEntryDate(editingItem.date);
    } else {
      setName(''); setAmount(''); setCategory(''); setEntryType('income');
      const d = new Date();
      setEntryDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
  }, [editingItem]);

  const filtered = useMemo(() => {
    let list = [...transactions];
    if (branchFilterId) list = list.filter((t: any) => t.branch_id?.toString() === branchFilterId);
    if (typeFilter !== 'all') list = list.filter(t => t.type === typeFilter);
    if (fromDate) list = list.filter(t => t.date >= fromDate);
    if (toDate) list = list.filter(t => t.date <= toDate);
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, branchFilterId, typeFilter, fromDate, toDate]);

  const historyFiltered = useMemo(() => filtered.filter(t => t.status !== 'pending'), [filtered]);

  const approvedFiltered = useMemo(() => historyFiltered.filter(t => t.status === 'approved' || !t.status), [historyFiltered]);
  const totalIncome = useMemo(() => approvedFiltered.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0), [approvedFiltered]);
  const totalExpense = useMemo(() => approvedFiltered.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0), [approvedFiltered]);
  const net = totalIncome - totalExpense;
  const pendingIncome = useMemo(() => transactions.filter(t => t.status === 'pending' && t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0), [transactions]);
  const pendingExpense = useMemo(() => transactions.filter(t => t.status === 'pending' && t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0), [transactions]);
  const pendingNet = pendingIncome - pendingExpense;
  const rupee = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

  const handleSubmit = async () => {
    if (!name.trim() || !amount || !category.trim()) {
      setStatusModal({ visible: true, title: 'Missing', message: 'Please fill all fields.', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    try {
      const data = { name: name.trim(), amount: parseFloat(amount), category: category.trim(), type: entryType, date: entryDate };
      if (editingItem) {
        await updateTransaction(editingItem.id, data);
        setStatusModal({ visible: true, title: 'Updated', message: 'Transaction updated.', type: 'success' });
      } else {
        await addTransaction({ ...data, id: Date.now().toString() });
        setStatusModal({ visible: true, title: entryType === 'expense' ? 'Request Sent' : 'Added', message: entryType === 'expense' ? 'Your expense request has been sent for approval.' : 'Income added successfully.', type: 'success' });
      }
        setEditingItem(null);
        if (isAdmin && entryType === 'expense') {
          setActiveTab('pending');
        } else {
          setActiveTab('history');
        }
    } catch {
      setStatusModal({ visible: true, title: 'Error', message: 'Failed to save.', type: 'error' });
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Delete?', 'Remove this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await deleteTransaction(id); } catch {} } },
    ]);
  }, [deleteTransaction]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleBatchDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    Alert.alert('Delete Selected?', `Remove ${selectedIds.size} transaction(s)?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete All', style: 'destructive', onPress: async () => {
        try {
          for (const id of selectedIds) await deleteTransaction(id);
          setSelectedIds(new Set());
          setIsSelectMode(false);
        } catch {}
      }},
    ]);
  }, [selectedIds, deleteTransaction]);

  const enterSelectMode = useCallback(() => {
    setIsSelectMode(true);
    setSelectedIds(new Set());
  }, []);

  const exitSelectMode = useCallback(() => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleEdit = useCallback((t: Transaction) => { setEditingItem(t); setActiveTab('entry'); }, []);

  const handleApprove = useCallback(async (id: string) => {
    try {
      await approveTransaction(id);
      setStatusModal({ visible: true, title: 'Approved', message: 'Transaction approved successfully.', type: 'success' });
    } catch (e: any) {
      const status = e?.response?.status || '';
      const msg = e?.response?.data?.message || e?.message || 'Could not approve transaction';
      setStatusModal({ visible: true, title: `Failed (${status})`, message: msg, type: 'error' });
    }
  }, [approveTransaction]);

  const handleReject = useCallback(async (id: string) => {
    Alert.alert('Reject Request?', 'This will mark the request as rejected.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: async () => {
        try {
          await rejectTransaction(id);
          setStatusModal({ visible: true, title: 'Rejected', message: 'Transaction rejected.', type: 'success' });
        } catch (e: any) {
          const msg = e?.response?.data?.message || e?.message || 'Could not reject transaction';
          setStatusModal({ visible: true, title: 'Failed', message: msg, type: 'error' });
        }
      }},
    ]);
  }, [rejectTransaction]);

  const handlePrint = useCallback(async () => {
    setPdfLoading(true);
    const html = `<html><body style="font-family:sans-serif;padding:40px;">
      <h1 style="color:#F59E0B;text-align:center;">Finance Report</h1>
      <table style="width:100%;border-collapse:collapse;margin-top:30px;">
        <tr style="background:#F9FAFB;"><th style="padding:12px;text-align:left;">Date</th><th style="padding:12px;text-align:left;">Description</th><th style="padding:12px;text-align:left;">Type</th><th style="padding:12px;text-align:right;">Amount</th></tr>
        ${historyFiltered.map((t: any) => `<tr style="border-bottom:1px solid #E5E7EB;"><td style="padding:12px;">${t.date}</td><td style="padding:12px;">${t.name}</td><td style="padding:12px;">${t.type}</td><td style="padding:12px;text-align:right;">₹${t.amount.toLocaleString()}</td></tr>`).join('')}
      </table>
      <p style="margin-top:40px;text-align:center;color:#9CA3AF;">Income: ₹${totalIncome.toLocaleString()} | Expense: ₹${totalExpense.toLocaleString()}</p>
    </body></html>`;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch { Alert.alert('Error', 'Print failed.'); }
    finally { setPdfLoading(false); }
  }, [historyFiltered, totalIncome, totalExpense]);

  const HEADER_H = 520;
  const stickyHeaderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, HEADER_H - 80], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [0, HEADER_H - 80], [0, -(HEADER_H - 80)], Extrapolation.CLAMP) }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: '#FFFFFF', paddingTop: Math.max(insets.top, 20) }, stickyHeaderStyle]}>
        <View style={{ paddingHorizontal: 24, paddingBottom: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 32, fontWeight: '900', letterSpacing: -0.5, color: '#111827' }}>Finance</Text>
              {!isAdmin && <View style={{ marginTop: 8 }}>
                <BranchFilter selectedBranchId={branchFilterId} onSelect={setBranchFilterId} />
              </View>}
            </View>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ backgroundColor: brandColor, width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: brandColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[{ position: 'absolute', top: Math.max(insets.top, 50) + 80, left: 0, right: 0, zIndex: 8, backgroundColor: '#FFFFFF', paddingHorizontal: 24, paddingBottom: 4 }, stickyHeaderStyle]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          {[
            { label: 'Income', value: rupee(totalIncome), color: '#10B981' },
            { label: 'Expense', value: rupee(totalExpense), color: '#EF4444' },
            { label: 'Net', value: rupee(net), color: net >= 0 ? '#10B981' : '#EF4444' },
          ].map(item => (
            <View key={item.label} style={{ flex: 1, alignItems: 'center', marginHorizontal: 4, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 10, elevation: 4, borderWidth: 1, borderColor: '#F3F4F6' }}>
              <Text style={{ fontSize: 14, fontWeight: '900', color: item.color }}>{item.value}</Text>
              <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: '#6B7280', marginTop: 4 }}>{item.label}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <View style={{ position: 'absolute', bottom: insets.bottom + 10, left: 12, right: 12, zIndex: 11, borderRadius: 16, backgroundColor: '#FFFFFF', padding: 6, flexDirection: 'row', gap: 6, borderWidth: 1, borderColor: '#E5E7EB', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 }}>
          <TouchableOpacity onPress={() => { setActiveTab('history'); setEditingItem(null); }}
            style={{ flex: 1, backgroundColor: activeTab === 'history' ? brandColor : 'transparent', borderRadius: 12, paddingVertical: 10, alignItems: 'center' }}>
            <MaterialCommunityIcons name="file-document-multiple-outline" size={18} color={activeTab === 'history' ? '#FFFFFF' : '#6B7280'} />
            <Text style={{ fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: activeTab === 'history' ? '#FFFFFF' : '#6B7280', marginTop: 2 }}>HISTORY</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('pending')}
            style={{ flex: 1, backgroundColor: activeTab === 'pending' ? brandColor : 'transparent', borderRadius: 12, paddingVertical: 10, alignItems: 'center' }}>
            <MaterialCommunityIcons name="clock-outline" size={18} color={activeTab === 'pending' ? '#FFFFFF' : '#6B7280'} />
            <Text style={{ fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: activeTab === 'pending' ? '#FFFFFF' : '#6B7280', marginTop: 2 }}>PENDING {pendingCount > 0 ? `(${pendingCount})` : ''}</Text>
          </TouchableOpacity>
          {isAdmin ? (
            <TouchableOpacity onPress={() => { setActiveTab('entry'); }}
              style={{ flex: 1, backgroundColor: activeTab === 'entry' ? brandColor : 'transparent', borderRadius: 12, paddingVertical: 10, alignItems: 'center' }}>
              <MaterialCommunityIcons name="plus-circle-outline" size={18} color={activeTab === 'entry' ? '#FFFFFF' : '#6B7280'} />
              <Text style={{ fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: activeTab === 'entry' ? '#FFFFFF' : '#6B7280', marginTop: 2 }}>REQUEST</Text>
            </TouchableOpacity>
          ) : (
            branchFilterId ? (
              <TouchableOpacity onPress={() => { setActiveTab('entry'); }}
                style={{ flex: 1, backgroundColor: activeTab === 'entry' ? brandColor : 'transparent', borderRadius: 12, paddingVertical: 10, alignItems: 'center' }}>
                <MaterialCommunityIcons name="plus-circle-outline" size={18} color={activeTab === 'entry' ? '#FFFFFF' : '#6B7280'} />
                <Text style={{ fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: activeTab === 'entry' ? '#FFFFFF' : '#6B7280', marginTop: 2 }}>ENTRY</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setStatusModal({ visible: true, title: 'Select Branch', message: 'Please select a branch from the filter above to add transactions.', type: 'info' })}
                style={{ flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center', opacity: 0.4 }}>
                <MaterialCommunityIcons name="plus-circle-outline" size={18} color={'#6B7280'} />
                <Text style={{ fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#6B7280', marginTop: 2 }}>ENTRY</Text>
              </TouchableOpacity>
            )
          )}
        </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: Math.max(insets.top, 50) + 180, paddingBottom: 100, paddingHorizontal: 24 }}
        onScroll={(e) => { scrollY.value = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
      >
        {activeTab === 'history' ? (
          <>
            <View style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                <DatePicker label="FROM" value={fromDate} onChange={setFromDate} theme={isDark ? 'dark' : 'light'} colors={colors} />
                <DatePicker label="TO" value={toDate} onChange={setToDate} theme={isDark ? 'dark' : 'light'} colors={colors} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {(['all', 'income', 'expense'] as const).map(f => (
                  <TouchableOpacity key={f} onPress={() => setTypeFilter(f)}
                    style={{ flex: 1, backgroundColor: typeFilter === f ? brandColor : '#FFFFFF', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: typeFilter === f ? brandColor : '#F3F4F6' }}>
                    <Text style={{ fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: typeFilter === f ? '#FFFFFF' : '#6B7280' }}>{f}</Text>
                  </TouchableOpacity>
                ))}
                {(fromDate || toDate || typeFilter !== 'all') && (
                  <TouchableOpacity onPress={() => { setFromDate(''); setToDate(''); setTypeFilter('all'); }}
                    style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' }}>
                    <MaterialCommunityIcons name="refresh" size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
              {fromDate || toDate ? (
                <Animated.View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
                  <TouchableOpacity onPress={handlePrint} disabled={pdfLoading} activeOpacity={0.8}
                    style={{ backgroundColor: '#FFFBEB', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: '#FDE68A', flexDirection: 'row', alignItems: 'center' }}>
                    {pdfLoading ? <ActivityIndicator size="small" color="#D97706" /> : <><MaterialCommunityIcons name="printer-outline" size={14} color="#D97706" /><Text style={{ color: '#D97706', fontWeight: '900', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, marginLeft: 6 }}>Print</Text></>}
                  </TouchableOpacity>
                </Animated.View>
              ) : null}
            </View>

            <View style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontWeight: '900', fontSize: 18, color: '#111827' }}>Transactions</Text>
                  <Text style={{ fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#6B7280', marginTop: 4 }}>{historyFiltered.length} entries</Text>
                </View>
                {isSelectMode ? (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={exitSelectMode} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' }}>
                      <Text style={{ fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#6B7280' }}>Cancel</Text>
                    </TouchableOpacity>
                    {selectedIds.size > 0 && (
                      <TouchableOpacity onPress={handleBatchDelete} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: '#EF4444' }}>
                        <Text style={{ fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#FFFFFF' }}>Delete {selectedIds.size}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <TouchableOpacity onPress={enterSelectMode} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' }}>
                    <MaterialCommunityIcons name="checkbox-multiple-marked-outline" size={18} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {historyFiltered.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 60, opacity: 0.4 }}>
                <MaterialCommunityIcons name="database-off-outline" size={60} color="#9CA3AF" />
                <Text style={{ fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 2, color: '#9CA3AF', marginTop: 16 }}>No Data</Text>
              </View>
            ) : (
              historyFiltered.map(item => <TxItem key={item.id} item={item} onDelete={handleDelete} onEdit={handleEdit} isSelectMode={isSelectMode} isSelected={selectedIds.has(item.id)} onToggleSelect={toggleSelect} isMasterAdmin={isMasterAdmin} onApprove={handleApprove} onReject={handleReject} />)
            )}
          </>
        ) : activeTab === 'pending' ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <View>
                <Text style={{ fontWeight: '900', fontSize: 18, color: '#111827' }}>Pending Requests</Text>
                <Text style={{ fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#6B7280', marginTop: 4 }}>
                  {pendingCount} pending
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 16, gap: 8 }}>
              <View style={{ flex: 1, backgroundColor: '#D1FAE5', borderRadius: 12, padding: 10, alignItems: 'center' }}>
                <Text style={{ fontWeight: '900', fontSize: 14, color: '#065F46' }}>{rupee(pendingIncome)}</Text>
                <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: '#065F46', marginTop: 2 }}>Income</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: '#FEE2E2', borderRadius: 12, padding: 10, alignItems: 'center' }}>
                <Text style={{ fontWeight: '900', fontSize: 14, color: '#991B1B' }}>{rupee(pendingExpense)}</Text>
                <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: '#991B1B', marginTop: 2 }}>Expense</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: pendingNet >= 0 ? '#D1FAE5' : '#FEE2E2', borderRadius: 12, padding: 10, alignItems: 'center' }}>
                <Text style={{ fontWeight: '900', fontSize: 14, color: pendingNet >= 0 ? '#065F46' : '#991B1B' }}>{rupee(pendingNet)}</Text>
                <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: pendingNet >= 0 ? '#065F46' : '#991B1B', marginTop: 2 }}>Net</Text>
              </View>
            </View>
            {transactions.filter(t => t.status === 'pending').length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 60, opacity: 0.4 }}>
                <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={60} color="#9CA3AF" />
                <Text style={{ fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 2, color: '#9CA3AF', marginTop: 16 }}>No Pending Requests</Text>
              </View>
            ) : (
              transactions.filter(t => t.status === 'pending').map(item => (
                <TxItem key={item.id} item={item} onDelete={handleDelete} onEdit={handleEdit} isMasterAdmin={isMasterAdmin} onApprove={handleApprove} onReject={handleReject} />
              ))
            )}
          </>
        ) : (
          <>
            <Text style={{ fontWeight: '900', fontSize: 18, color: '#111827', marginBottom: 16 }}>{editingItem ? (isAdmin ? 'Edit Request' : 'Edit Entry') : (isAdmin ? 'New Request' : 'New Entry')}</Text>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, elevation: 5, borderWidth: 1, borderColor: '#F3F4F6' }}>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                <TouchableOpacity onPress={() => setEntryType('income')}
                  style={{ flex: 1, backgroundColor: entryType === 'income' ? '#D1FAE5' : '#F9FAFB', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: entryType === 'income' ? '#10B981' : '#E5E7EB' }}>
                  <MaterialCommunityIcons name={entryType === 'income' ? 'arrow-down-bold-circle' : 'arrow-down-bold-circle-outline'} size={18} color={entryType === 'income' ? '#065F46' : '#6B7280'} />
                  <Text style={{ fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: entryType === 'income' ? '#065F46' : '#6B7280', marginTop: 4 }}>Income</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEntryType('expense')}
                  style={{ flex: 1, backgroundColor: entryType === 'expense' ? '#FEE2E2' : '#F9FAFB', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: entryType === 'expense' ? '#EF4444' : '#E5E7EB' }}>
                  <MaterialCommunityIcons name={entryType === 'expense' ? 'arrow-up-bold-circle' : 'arrow-up-bold-circle-outline'} size={18} color={entryType === 'expense' ? '#991B1B' : '#6B7280'} />
                  <Text style={{ fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: entryType === 'expense' ? '#991B1B' : '#6B7280', marginTop: 4 }}>Expense</Text>
                </TouchableOpacity>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: '#6B7280', marginBottom: 8 }}>Description</Text>
                <View style={{ backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="text-box-outline" size={20} color={brandColor} style={{ marginRight: 12 }} />
                  <TextInput value={name} onChangeText={setName} placeholder="e.g. Term Fees, Salary..." placeholderTextColor={'#9CA3AF'}
                    style={{ flex: 1, fontWeight: '900', fontSize: 15, color: '#111827' }} />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: '#6B7280', marginBottom: 8 }}>Amount</Text>
                  <View style={{ backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' }}>
                    <TextInput value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="numeric" placeholderTextColor={'#CBD5E0'}
                      style={{ fontWeight: '900', fontSize: 18, color: entryType === 'income' ? '#10B981' : '#EF4444' }} />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: '#6B7280', marginBottom: 8 }}>Category</Text>
                  <TouchableOpacity onPress={() => setShowCategoryModal(true)}
                    style={{ backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: category ? '#111827' : '#9CA3AF' }}>{category || 'SELECT'}</Text>
                    <MaterialCommunityIcons name="chevron-down" size={18} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ marginBottom: 20 }}>
                <DatePicker label="Date" value={entryDate} onChange={setEntryDate} theme={isDark ? 'dark' : 'light'} colors={colors} />
              </View>

              <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting} activeOpacity={0.9} style={{ borderRadius: 16, overflow: 'hidden', elevation: 8 }}>
                <LinearGradient colors={['#FBBF24', '#F59E0B']} style={{ paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
                  {isSubmitting ? <ActivityIndicator color="white" /> : <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 14, textTransform: 'uppercase', letterSpacing: 2 }}>{editingItem ? 'UPDATE' : 'SUBMIT'}</Text>}
                </LinearGradient>
              </TouchableOpacity>

              {editingItem && (
                <TouchableOpacity onPress={() => { setEditingItem(null); setActiveTab('history'); }} style={{ marginTop: 16, alignItems: 'center', paddingVertical: 10 }}>
                  <Text style={{ fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: '#6B7280' }}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>

            <ChoiceModal visible={showCategoryModal} onClose={() => setShowCategoryModal(false)} title="Category" message="" iconName="layers-triple" accentColor={brandColor} options={[
              { label: 'Salaries', icon: 'account-cash', onPress: () => { setCategory('Salaries'); setShowCategoryModal(false); } },
              { label: 'Fees', icon: 'school-outline', onPress: () => { setCategory('Fees'); setShowCategoryModal(false); } },
              { label: 'Maintenance', icon: 'hammer-wrench', onPress: () => { setCategory('Maintenance'); setShowCategoryModal(false); } },
              { label: 'Infrastructure', icon: 'office-building-marker', onPress: () => { setCategory('Infrastructure'); setShowCategoryModal(false); } },
              { label: 'Stationery', icon: 'pencil-ruler', onPress: () => { setCategory('Stationery'); setShowCategoryModal(false); } },
              { label: 'Other', icon: 'dots-horizontal', onPress: () => { setCategory('Miscellaneous'); setShowCategoryModal(false); } },
            ]} />
          </>
        )}
      </ScrollView>

      <PremiumPopup visible={statusModal.visible} title={statusModal.title} message={statusModal.message} type={statusModal.type} onClose={() => setStatusModal({ ...statusModal, visible: false })} buttonText="OK" />
    </View>
  );
}
