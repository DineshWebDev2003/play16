import React, { useState, memo, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Alert, Platform, ActivityIndicator
} from 'react-native';
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
import api from '../../services/api';

interface NavigationProps { navigate: (screen: string) => void; goBack: () => void; }
interface Props { navigation: NavigationProps; }

const brandColor = '#F59E0B';
const AMBER = ['#F59E0B', '#D97706'] as [string, string];
const AMBER_DARK = ['#92400E', '#78350F'] as [string, string];
const EMERALD = ['#10B981', '#059669'] as [string, string];
const EMERALD_DARK = ['#064e3b', '#022c22'] as [string, string];
const RED = ['#EF4444', '#DC2626'] as [string, string];
const RED_DARK = ['#7f1d1d', '#450a0a'] as [string, string];
const VIOLET = ['#8B5CF6', '#7C3AED'] as [string, string];
const VIOLET_DARK = ['#5b21b6', '#2e1065'] as [string, string];

function DatePicker({ label, value, onChange, theme }: {
  label: string; value: string; onChange: (v: string) => void; theme: string;
}) {
  const isDark = theme === 'dark';
  const [show, setShow] = useState(false);
  const dateValue = value ? new Date(value) : new Date();
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: 4 }}>{label}</Text>
      <TouchableOpacity onPress={() => setShow(true)} activeOpacity={0.8}
        style={{ backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: isDark ? '#262626' : '#F3F4F6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontWeight: '900', fontSize: 11, color: value ? (isDark ? '#FFFFFF' : '#111827') : (isDark ? '#6B7280' : '#9CA3AF') }}>{value || 'Select'}</Text>
        <MaterialCommunityIcons name="calendar-edit" size={14} color={brandColor} />
      </TouchableOpacity>
      {show && <DateTimePicker value={dateValue} mode="date" display="default" accentColor={brandColor} onChange={(_, d) => { setShow(Platform.OS === 'ios'); if (d) { const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const day = String(d.getDate()).padStart(2,'0'); onChange(`${y}-${m}-${day}`); }}} />}
    </View>
  );
}

const TxItem = memo(({ item, onDelete, onEdit, isSelectMode, isSelected, onToggleSelect, isMasterAdmin, onApprove, onReject, isDark }: {
    item: Transaction;
    onDelete: (id: string) => void; onEdit: (t: Transaction) => void;
    isSelectMode?: boolean; isSelected?: boolean; onToggleSelect?: (id: string) => void;
    isMasterAdmin?: boolean; onApprove?: (id: string) => void; onReject?: (id: string) => void;
    isDark?: boolean;
}) => {
    let title = item.name;
    if (item.category === 'Fees') {
        if (item.name.toLowerCase().startsWith('admission:')) title = item.name.split(':')[1]?.trim() || item.name;
        else if (item.name.toLowerCase().startsWith('monthly fee:')) title = item.name.split(':')[1]?.trim() || item.name;
    }
    const isPending = item.status === 'pending';
    const isAdmission = item.type === 'income' && item.category === 'Fees' && item.name.toLowerCase().startsWith('admission:');
    const isMonthlyFee = item.type === 'income' && item.category === 'Fees' && item.name.toLowerCase().startsWith('monthly fee:');
    const feeTag = isAdmission ? { label: 'Admission Fee', bg: '#EDE9FE', fg: '#6D28D9', icon: 'star-four-points' } :
      isMonthlyFee ? { label: 'Monthly Fee', bg: '#DBEAFE', fg: '#1D4ED8', icon: 'calendar-month' } : null;
    const isPettyCashExpense = item.type === 'expense' && (item.payment_method || '').toLowerCase() === 'petty cash';
    return (
    <TouchableOpacity onPress={() => { if (isSelectMode) { onToggleSelect?.(item.id); } else { onEdit(item); } }} activeOpacity={0.9}
      style={{ backgroundColor: isDark ? '#1e1e1e' : (isSelected ? '#FEF2F2' : '#FFFFFF'), borderRadius: 20, padding: 14, marginBottom: 10, elevation: 3, borderWidth: 1, borderColor: isSelected ? '#EF4444' : (isDark ? '#262626' : '#F3F4F6') }}>
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
            <Text style={{ fontWeight: '900', fontSize: 14, color: isDark ? '#FFFFFF' : '#111827', flex: 1 }} numberOfLines={1}>{title}</Text>
            <Text style={{ fontWeight: '900', fontSize: 15, color: item.type === 'income' ? '#10B981' : '#EF4444', marginLeft: 8 }}>₹{item.amount.toLocaleString()}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', gap: 4 }}>
            <View style={{ backgroundColor: item.type === 'income' ? '#D1FAE5' : '#FEE2E2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, color: item.type === 'income' ? '#065F46' : '#991B1B' }}>{item.category}</Text>
            </View>
            {feeTag && (
              <View style={{ backgroundColor: feeTag.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name={feeTag.icon as any} size={10} color={feeTag.fg} style={{ marginRight: 3 }} />
                <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, color: feeTag.fg }}>{feeTag.label}</Text>
              </View>
            )}
            {isAdmission && (
              <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', color: '#B45309' }}>100% Master</Text>
              </View>
            )}
            {isPettyCashExpense && (
              <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="wallet-outline" size={10} color="#047857" style={{ marginRight: 3 }} />
                <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', color: '#047857' }}>Petty Cash</Text>
              </View>
            )}
            <Text style={{ fontSize: 10, fontWeight: '900', color: '#9CA3AF' }}>{item.date}</Text>
            {item.branch?.name && (
              <View style={{ backgroundColor: isDark ? '#262626' : '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ fontSize: 8, fontWeight: '900', color: isDark ? '#9CA3AF' : '#6B7280' }}>{item.branch.name}</Text>
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
              <TouchableOpacity onPress={() => onEdit(item)} style={{ width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#262626' : '#F3F4F6' }}>
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

type TimelinePreset = 'today' | 'week' | 'month' | 'all';

const toDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function IncomeExpenseScreen({ navigation }: Props) {
  const { transactions, addTransaction, deleteTransaction, updateTransaction, approveTransaction, rejectTransaction, user, branches } = useAuth();
  const { theme: appTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = appTheme === 'dark';
  const isAdmin = user?.role === 'admin';
  const isMasterAdmin = user?.role === 'master_admin';

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
  const [entryDate, setEntryDate] = useState(() => toDateStr(new Date()));
  const [paymentMethod, setPaymentMethod] = useState('');
  const [pettyCashBalance, setPettyCashBalance] = useState<number | null>(null);
  const [pettyCashPending, setPettyCashPending] = useState<number>(0);
  const [pettyCashUsed, setPettyCashUsed] = useState<number>(0);
  const [pettyCashAdded, setPettyCashAdded] = useState<number>(0);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const pendingCount = transactions.filter(t => t.status === 'pending').length;

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setAmount(editingItem.amount.toString());
      setCategory(editingItem.category);
      setEntryType(editingItem.type);
      setEntryDate(editingItem.date);
      setPaymentMethod(editingItem.payment_method || '');
    } else {
      setName(''); setAmount(''); setCategory(''); setEntryType('income'); setPaymentMethod('');
      setEntryDate(toDateStr(new Date()));
    }
  }, [editingItem]);

  const loadPettyCash = useCallback(async () => {
    const bid = branchFilterId || user?.branch_id?.toString();
    if (!bid) { setPettyCashBalance(null); setPettyCashPending(0); setPettyCashUsed(0); setPettyCashAdded(0); return; }
    try {
      const [balRes, txRes] = await Promise.all([
        api.get(`/petty-cash/balance?branch_id=${bid}`),
        api.get(`/petty-cash/transactions?branch_id=${bid}`),
      ]);
      const bal = balRes.data?.available ?? balRes.data?.balance ?? balRes.data?.data?.available ?? balRes.data?.data?.balance ?? null;
      const pend = balRes.data?.pending ?? balRes.data?.data?.pending ?? 0;
      const txs = txRes.data?.data || (Array.isArray(txRes.data) ? txRes.data : []);
      let used = 0, added = 0;
      txs.forEach((t: any) => {
        const amt = Math.abs(parseFloat(t.amount) || 0);
        if (t.type === 'debit') used += amt; else added += amt;
      });
      setPettyCashBalance(bal);
      setPettyCashPending(pend);
      setPettyCashUsed(used);
      setPettyCashAdded(added);
    } catch { setPettyCashBalance(null); setPettyCashPending(0); setPettyCashUsed(0); setPettyCashAdded(0); }
  }, [branchFilterId, user?.branch_id]);

  useEffect(() => {
    if (activeTab === 'entry' && paymentMethod === 'Petty Cash') {
      (async () => {
        try {
          const bid = branchFilterId || user?.branch_id?.toString();
          if (!bid) { setPettyCashBalance(null); setPettyCashPending(0); return; }
          const res = await api.get(`/petty-cash/balance?branch_id=${bid}`);
          setPettyCashBalance(res.data?.available ?? res.data?.balance ?? res.data?.data?.available ?? res.data?.data?.balance ?? null);
          setPettyCashPending(res.data?.pending ?? res.data?.data?.pending ?? 0);
        } catch { setPettyCashBalance(null); setPettyCashPending(0); }
      })();
    }
  }, [activeTab, paymentMethod, branchFilterId, user?.branch_id]);

  useEffect(() => {
    loadPettyCash();
  }, [branchFilterId, loadPettyCash]);

  const paymentMethods = ['Cash', 'Bank', 'UPI', 'Petty Cash'];
  const amtVal = parseFloat(amount) || 0;
  const isPettyCash = paymentMethod === 'Petty Cash' && entryType === 'expense';
  const pettyCashAvailable = pettyCashBalance !== null ? pettyCashBalance - amtVal : null;
  const balanceOk = pettyCashBalance !== null && amtVal > pettyCashBalance;

  const applyPreset = useCallback((p: TimelinePreset) => {
    const today = new Date();
    if (p === 'all') { setFromDate(''); setToDate(''); return; }
    if (p === 'today') { setFromDate(toDateStr(today)); setToDate(toDateStr(today)); return; }
    if (p === 'week') { const d = new Date(); d.setDate(d.getDate() - 6); setFromDate(toDateStr(d)); setToDate(toDateStr(today)); return; }
    if (p === 'month') { const d = new Date(today.getFullYear(), today.getMonth(), 1); setFromDate(toDateStr(d)); setToDate(toDateStr(today)); return; }
  }, []);

  const activePreset: TimelinePreset = useMemo(() => {
    const today = toDateStr(new Date());
    if (!fromDate && !toDate) return 'all';
    if (fromDate === today && toDate === today) return 'today';
    const d = new Date(); d.setDate(d.getDate() - 6);
    if (fromDate === toDateStr(d) && toDate === today) return 'week';
    const md = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    if (fromDate === toDateStr(md) && toDate === today) return 'month';
    return 'all';
  }, [fromDate, toDate]);

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

  // Admission fees go 100% direct to branch account (NO share). All other income + all expenses are shared.
  const admissionIncome = useMemo(() =>
    approvedFiltered
      .filter(t => t.type === 'income' && t.category === 'Fees' && t.name.toLowerCase().startsWith('admission:'))
      .reduce((s, t) => s + (t.amount || 0), 0),
    [approvedFiltered]
  );
  const sharableIncome = totalIncome - admissionIncome;
  const sharableNet = sharableIncome - totalExpense;

  const pendingIncome = useMemo(() => transactions.filter(t => t.status === 'pending' && t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0), [transactions]);
  const pendingExpense = useMemo(() => transactions.filter(t => t.status === 'pending' && t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0), [transactions]);
  const pendingNet = pendingIncome - pendingExpense;
  const rupee = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

  const selectedBranch = useMemo(() =>
    branches.find(b => b.id?.toString() === branchFilterId),
    [branches, branchFilterId]
  );
  const sharePct = selectedBranch?.share ?? 70;
  const directAmount = admissionIncome;
  const sharedAdminAmount = Math.round(sharableNet * sharePct / 100);
  const sharedMasterAmount = sharableNet - sharedAdminAmount;
  const adminShareAmount = sharedAdminAmount;
  const masterShareAmount = sharedMasterAmount + directAmount;
  const showShare = !!branchFilterId && (sharableNet !== 0 || admissionIncome > 0);

  const showPettyCashInfo = useCallback(async () => {
    const bid = branchFilterId || user?.branch_id?.toString();
    if (!bid) { Alert.alert('Petty Cash', 'No branch selected.'); return; }
    try {
      const res = await api.get(`/petty-cash/balance?branch_id=${bid}`);
      const bal = res.data?.available ?? res.data?.balance ?? res.data?.data?.available ?? res.data?.data?.balance ?? null;
      const pend = res.data?.pending ?? res.data?.data?.pending ?? 0;
      setPettyCashBalance(bal);
      setPettyCashPending(pend);
      if (bal === null) { Alert.alert('Petty Cash', 'Could not load balance.'); return; }
      const msg = `Available: ₹${bal.toLocaleString('en-IN')}` + (pend > 0 ? `\nPending approval: ₹${pend.toLocaleString('en-IN')}` : '');
      Alert.alert('Petty Cash Available', msg);
    } catch {
      Alert.alert('Petty Cash', 'Could not load balance.');
    }
  }, [branchFilterId, user?.branch_id]);

  const handleSubmit = async () => {
    if (!name.trim() || !amount || !category.trim()) {
      setStatusModal({ visible: true, title: 'Missing', message: 'Please fill all fields.', type: 'error' });
      return;
    }
    if (isPettyCash && balanceOk) {
      setStatusModal({ visible: true, title: 'Insufficient Balance', message: 'Insufficient Petty Cash Balance. Available is less than this amount.', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    try {
      const data: any = { name: name.trim(), amount: parseFloat(amount), category: category.trim(), type: entryType, date: entryDate, payment_method: paymentMethod || undefined };
      if (isMasterAdmin && branchFilterId) data.branch_id = branchFilterId;
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
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to save.';
      setStatusModal({ visible: true, title: 'Error', message: msg, type: 'error' });
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
    const periodLabel = fromDate || toDate
      ? `${fromDate || '...'} → ${toDate || '...'}`
      : 'All Time';
    const netColor = net >= 0 ? '#059669' : '#DC2626';

    const feeTagHtml = (t: any) => {
      if (t.type === 'income' && t.category === 'Fees' && t.name.toLowerCase().startsWith('admission:')) {
        return '<span style="background:#EDE9FE;color:#6D28D9;font-size:9px;font-weight:bold;padding:2px 8px;border-radius:10px;">ADMISSION FEE</span>';
      }
      if (t.type === 'income' && t.category === 'Fees' && t.name.toLowerCase().startsWith('monthly fee:')) {
        return '<span style="background:#DBEAFE;color:#1D4ED8;font-size:9px;font-weight:bold;padding:2px 8px;border-radius:10px;">MONTHLY FEE</span>';
      }
      if (t.type === 'expense' && (t.payment_method || '').toLowerCase() === 'petty cash') {
        return '<span style="background:#D1FAE5;color:#047857;font-size:9px;font-weight:bold;padding:2px 8px;border-radius:10px;">PETTY CASH</span>';
      }
      return `<span style="background:#F3F4F6;color:#4B5563;font-size:9px;font-weight:bold;padding:2px 8px;border-radius:10px;">${(t.category || 'General').toUpperCase()}</span>`;
    };

    const rowsHtml = historyFiltered.map((t: any) => `
      <tr style="border-bottom:1px solid #F3F4F6;">
        <td style="padding:10px;color:#6B7280;font-size:11px;white-space:nowrap;">${t.date}</td>
        <td style="padding:10px;color:#111827;font-weight:600;font-size:12px;">${t.name}</td>
        <td style="padding:10px;text-align:center;">${feeTagHtml(t)}</td>
        <td style="padding:10px;text-align:right;font-weight:bold;color:${t.type === 'income' ? '#059669' : '#DC2626'};font-size:13px;">${t.type === 'income' ? '+' : '−'}₹${t.amount.toLocaleString()}</td>
      </tr>`).join('');

    const shareBlock = showShare ? `
      <div style="margin-top:24px;background:linear-gradient(135deg,#7C3AED,#5B21B6);border-radius:16px;padding:20px;color:white;">
        <div style="text-align:center;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#C4B5FD;margin-bottom:12px;">Revenue Share — ${selectedBranch?.name || 'Branch'}</div>
        <table style="width:100%;border-collapse:collapse;text-align:center;">
          <tr>
            <td style="padding:10px;">
              <div style="font-size:18px;font-weight:bold;">₹${sharedAdminAmount.toLocaleString()}</div>
              <div style="font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#C4B5FD;margin-top:4px;">School Admin (${sharePct}%)</div>
            </td>
            <td style="padding:10px;">
              <div style="font-size:18px;font-weight:bold;">₹${sharedMasterAmount.toLocaleString()}</div>
              <div style="font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#C4B5FD;margin-top:4px;">Master Admin (${100 - sharePct}%)</div>
            </td>
            <td style="padding:10px;background:rgba(255,255,255,0.12);border-radius:12px;">
              <div style="font-size:18px;font-weight:bold;">₹${masterShareAmount.toLocaleString()}</div>
              <div style="font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#FDE68A;margin-top:4px;">Master Total</div>
            </td>
          </tr>
        </table>
        ${directAmount > 0 ? `<div style="margin-top:10px;text-align:center;font-size:10px;color:#FDE68A;font-weight:bold;">+ Admission Fees 100% to Master: ₹${directAmount.toLocaleString()}</div>` : ''}
      </div>` : '';

    const pettyCashExpenseCount = historyFiltered.filter((t: any) => t.type === 'expense' && (t.payment_method || '').toLowerCase() === 'petty cash').length;
    const pettyBlock = pettyCashBalance !== null ? `
      <div style="margin-top:16px;background:linear-gradient(135deg,#10B981,#059669);border-radius:16px;padding:16px;color:white;">
        <div style="text-align:center;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#A7F3D0;margin-bottom:10px;">Petty Cash</div>
        <table style="width:100%;border-collapse:collapse;text-align:center;">
          <tr>
            <td style="padding:8px;"><div style="font-size:16px;font-weight:bold;">₹${pettyCashBalance.toLocaleString()}</div><div style="font-size:8px;letter-spacing:1px;text-transform:uppercase;color:#A7F3D0;margin-top:3px;">Balance</div></td>
            <td style="padding:8px;"><div style="font-size:16px;font-weight:bold;">₹${pettyCashUsed.toLocaleString()}</div><div style="font-size:8px;letter-spacing:1px;text-transform:uppercase;color:#FCA5A5;margin-top:3px;">Used</div></td>
            <td style="padding:8px;"><div style="font-size:16px;font-weight:bold;">₹${pettyCashAdded.toLocaleString()}</div><div style="font-size:8px;letter-spacing:1px;text-transform:uppercase;color:#FDE68A;margin-top:3px;">Added</div></td>
          </tr>
        </table>
        ${pettyCashPending > 0 ? `<div style="margin-top:8px;text-align:center;font-size:9px;color:#FDE68A;font-weight:bold;">₹${pettyCashPending.toLocaleString()} pending approval</div>` : ''}
        ${pettyCashExpenseCount > 0 ? `<div style="margin-top:6px;text-align:center;font-size:9px;color:#A7F3D0;font-weight:bold;">${pettyCashExpenseCount} expense(s) in this period paid from petty cash by School Admin</div>` : ''}
      </div>` : '';

    const html = `<html><head>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; background:#FFFFFF; margin:0; padding:0; color:#111827; }
        .header { background:linear-gradient(135deg,#F59E0B,#D97706); padding:28px 40px; color:white; }
        .header .eyebrow { font-size:10px; font-weight:900; letter-spacing:3px; text-transform:uppercase; color:#FEF3C7; }
        .header h1 { margin:6px 0 2px 0; font-size:26px; font-weight:900; letter-spacing:-1px; }
        .header .period { font-size:11px; color:rgba(255,255,255,0.85); font-weight:600; }
        .content { padding:28px 40px 40px; }
        .stats { display:flex; gap:12px; margin-bottom:24px; }
        .stat { flex:1; border:1px solid #F3F4F6; border-radius:16px; padding:14px; text-align:center; }
        .stat .value { font-size:20px; font-weight:900; }
        .stat .label { font-size:9px; font-weight:900; letter-spacing:1.5px; text-transform:uppercase; color:#6B7280; margin-top:4px; }
        table { width:100%; border-collapse:collapse; }
        thead th { background:#F9FAFB; padding:10px; text-align:left; font-size:9px; font-weight:900; letter-spacing:1.5px; text-transform:uppercase; color:#6B7280; }
        .net-box { margin-top:20px; border:2px solid ${netColor}; border-radius:16px; padding:18px; text-align:center; }
        .net-box .net-value { font-size:26px; font-weight:900; color:${netColor}; }
        .net-box .net-label { font-size:9px; font-weight:900; letter-spacing:2px; text-transform:uppercase; color:#6B7280; margin-top:4px; }
        .footer { margin-top:32px; padding-top:16px; border-top:1px solid #F3F4F6; text-align:center; font-size:9px; color:#9CA3AF; letter-spacing:1px; text-transform:uppercase; }
      </style></head>
      <body>
        <div class="header">
          <div class="eyebrow">TN HAPPYKIDS</div>
          <h1>Finance Report${selectedBranch ? ' — ' + selectedBranch.name : ''}</h1>
          <div class="period">Period: ${periodLabel}</div>
        </div>
        <div class="content">
          <div class="stats">
            <div class="stat"><div class="value" style="color:#059669;">₹${totalIncome.toLocaleString()}</div><div class="label">Total Income</div></div>
            <div class="stat"><div class="value" style="color:#DC2626;">₹${totalExpense.toLocaleString()}</div><div class="label">Total Expense</div></div>
            <div class="stat"><div class="value" style="color:${netColor};">₹${net.toLocaleString()}</div><div class="label">Net</div></div>
          </div>
          <table>
            <thead><tr><th>Date</th><th>Description</th><th>Type</th><th style="text-align:right;">Amount</th></tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <div class="net-box">
            <div class="net-value">₹${net.toLocaleString()}</div>
            <div class="net-label">Net ${net >= 0 ? 'Surplus' : 'Deficit'}</div>
          </div>
          ${shareBlock}
          ${pettyBlock}
          <div class="footer">Generated on ${new Date().toLocaleString()}</div>
        </div>
      </body></html>`;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch { Alert.alert('Error', 'Print failed.'); }
    finally { setPdfLoading(false); }
  }, [historyFiltered, totalIncome, totalExpense, net, showShare, sharePct, sharedAdminAmount, sharedMasterAmount, masterShareAmount, directAmount, selectedBranch, pettyCashBalance, pettyCashUsed, pettyCashAdded, pettyCashPending, fromDate, toDate]);

  const renderDashboard = () => (
    <View style={{ paddingHorizontal: 24 }}>
      <View style={{ paddingVertical: 4 }}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setActiveTab('history')}
          style={{ borderRadius: 16, overflow: 'hidden', elevation: 15 }}
        >
          <LinearGradient
            colors={net >= 0 ? (isDark ? EMERALD_DARK : EMERALD) : (isDark ? RED_DARK : RED)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 12 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                  <MaterialCommunityIcons name="finance" size={18} color="white" />
                </View>
                <View>
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: -0.5 }}>Treasury</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 1 }}>Finance Ledger</Text>
                </View>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 }}>
                <Text style={{ color: 'white', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>
                  {fromDate ? `${fromDate.split('-').reverse().join('/')}` : 'All Time'}
                </Text>
              </View>
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {[
                  { label: 'Income', value: rupee(totalIncome), icon: 'arrow-down-bold-circle', color: '#6EE7B7' },
                  { label: 'Expense', value: rupee(totalExpense), icon: 'arrow-up-bold-circle', color: '#FCA5A5' },
                  { label: 'Net', value: rupee(net), icon: net >= 0 ? 'trending-up' : 'trending-down', color: net >= 0 ? '#6EE7B7' : '#FCA5A5' },
                ].map((item, i) => (
                  <View key={item.label} style={{ alignItems: 'center', flex: 1, borderRightWidth: i < 2 ? 1 : 0, borderRightColor: 'rgba(255,255,255,0.1)' }}>
                    <MaterialCommunityIcons name={item.icon as any} size={20} color="#FFFFFF" style={{ marginBottom: 4 }} />
                    <Text style={{ color: 'white', fontSize: 15, fontWeight: '900' }} numberOfLines={1}>{item.value}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginTop: 1 }}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
              <MaterialCommunityIcons name="safe-square-outline" size={90} color="white" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {showShare && (
        <View style={{ borderRadius: 16, overflow: 'hidden', marginTop: 12, elevation: 6 }}>
          <LinearGradient colors={isDark ? VIOLET_DARK : VIOLET} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="handshake" size={16} color="white" />
                <Text style={{ color: 'white', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 6 }}>Revenue Share</Text>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 }}>
                <Text style={{ color: 'white', fontSize: 8, fontWeight: '900', textTransform: 'uppercase' }}>{selectedBranch?.name || 'Branch'}</Text>
              </View>
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ alignItems: 'center', flex: 1, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.1)' }}>
                  <Text style={{ color: 'white', fontSize: 15, fontWeight: '900' }} numberOfLines={1}>{rupee(sharedAdminAmount)}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginTop: 1 }}>School ({sharePct}%)</Text>
                </View>
                <View style={{ alignItems: 'center', flex: 1, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.1)' }}>
                  <Text style={{ color: 'white', fontSize: 15, fontWeight: '900' }} numberOfLines={1}>{rupee(sharedMasterAmount)}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginTop: 1 }}>Master ({100 - sharePct}%)</Text>
                </View>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ color: '#FDE68A', fontSize: 15, fontWeight: '900' }} numberOfLines={1}>{rupee(masterShareAmount)}</Text>
                  <Text style={{ color: 'rgba(253,230,138,0.7)', fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginTop: 1 }}>Master Total</Text>
                </View>
              </View>
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 8, fontWeight: '700', marginTop: 8 }}>
              Admission fees go 100% to Master Admin. All other income & expenses are shared.
            </Text>
          </LinearGradient>
        </View>
      )}

      <View style={{ paddingVertical: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 4 }}>
          <Text style={{ fontSize: 20, fontWeight: '900', letterSpacing: -0.5, color: isDark ? '#FFFFFF' : '#111827' }}>Timeline</Text>
          <TouchableOpacity onPress={handlePrint} disabled={pdfLoading} activeOpacity={0.8}
            style={{ backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF', borderRadius: 14, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: isDark ? '#262626' : '#F3F4F6', flexDirection: 'row', alignItems: 'center', elevation: 3 }}>
            {pdfLoading ? <ActivityIndicator size="small" color="#D97706" /> : <><MaterialCommunityIcons name="printer-outline" size={14} color="#D97706" /><Text style={{ color: '#D97706', fontWeight: '900', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, marginLeft: 6 }}>PDF</Text></>}
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          {([
            { key: 'today' as TimelinePreset, label: 'Today', icon: 'calendar-today' },
            { key: 'week' as TimelinePreset, label: '7 Days', icon: 'calendar-week' },
            { key: 'month' as TimelinePreset, label: 'This Month', icon: 'calendar-month' },
            { key: 'all' as TimelinePreset, label: 'All', icon: 'calendar-range' },
          ]).map(p => (
            <TouchableOpacity key={p.key} onPress={() => applyPreset(p.key)} activeOpacity={0.9}
              style={{ flex: 1, backgroundColor: activePreset === p.key ? brandColor : (isDark ? '#1e1e1e' : '#FFFFFF'), borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: activePreset === p.key ? brandColor : (isDark ? '#262626' : '#F3F4F6'), elevation: activePreset === p.key ? 3 : 0 }}>
              <MaterialCommunityIcons name={p.icon as any} size={16} color={activePreset === p.key ? 'white' : (isDark ? '#9CA3AF' : '#6B7280')} />
              <Text style={{ fontWeight: '900', fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.5, color: activePreset === p.key ? 'white' : (isDark ? '#9CA3AF' : '#6B7280'), marginTop: 4 }}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <DatePicker label="FROM" value={fromDate} onChange={setFromDate} theme={isDark ? 'dark' : 'light'} />
          <DatePicker label="TO" value={toDate} onChange={setToDate} theme={isDark ? 'dark' : 'light'} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {(['all', 'income', 'expense'] as const).map(f => (
            <TouchableOpacity key={f} onPress={() => setTypeFilter(f)}
              style={{ flex: 1, backgroundColor: typeFilter === f ? brandColor : (isDark ? '#1e1e1e' : '#FFFFFF'), borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: typeFilter === f ? brandColor : (isDark ? '#262626' : '#F3F4F6') }}>
              <Text style={{ fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: typeFilter === f ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#6B7280') }}>{f}</Text>
            </TouchableOpacity>
          ))}
          {(fromDate || toDate || typeFilter !== 'all') && (
            <TouchableOpacity onPress={() => { setFromDate(''); setToDate(''); setTypeFilter('all'); }}
              style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' }}>
              <MaterialCommunityIcons name="refresh" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={{ paddingVertical: 4 }}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('pettyCash')}
          style={{ borderRadius: 16, overflow: 'hidden', elevation: 6 }}
        >
          <LinearGradient colors={isDark ? EMERALD_DARK : EMERALD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                  <MaterialCommunityIcons name="wallet-outline" size={18} color="white" />
                </View>
                <View>
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: -0.5 }}>Petty Cash</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 1 }}>{selectedBranch?.name || 'Branch Account'}</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="arrow-right" size={18} color="white" />
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {[
                  { label: 'Balance', value: pettyCashBalance !== null ? rupee(pettyCashBalance) : '—', color: '#A7F3D0' },
                  { label: 'Used', value: rupee(pettyCashUsed), color: '#FCA5A5' },
                  { label: 'Added', value: rupee(pettyCashAdded), color: '#FDE68A' },
                ].map((item, i) => (
                  <View key={item.label} style={{ alignItems: 'center', flex: 1, borderRightWidth: i < 2 ? 1 : 0, borderRightColor: 'rgba(255,255,255,0.1)' }}>
                    <Text style={{ color: 'white', fontSize: 15, fontWeight: '900' }} numberOfLines={1}>{item.value}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginTop: 1 }}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
            {pettyCashPending > 0 && (
              <Text style={{ color: '#FDE68A', fontSize: 9, fontWeight: '800', marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                {rupee(pettyCashPending)} pending approval
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHistory = () => (
    <View style={{ paddingHorizontal: 24 }}>
      <View style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontWeight: '900', fontSize: 18, color: isDark ? '#FFFFFF' : '#111827' }}>Transactions</Text>
            <Text style={{ fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 4 }}>{historyFiltered.length} entries</Text>
          </View>
          {isSelectMode ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={exitSelectMode} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: isDark ? '#1e1e1e' : '#F3F4F6', borderWidth: 1, borderColor: isDark ? '#262626' : '#E5E7EB' }}>
                <Text style={{ fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: isDark ? '#9CA3AF' : '#6B7280' }}>Cancel</Text>
              </TouchableOpacity>
              {selectedIds.size > 0 && (
                <TouchableOpacity onPress={handleBatchDelete} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: '#EF4444' }}>
                  <Text style={{ fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#FFFFFF' }}>Delete {selectedIds.size}</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity onPress={enterSelectMode} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: isDark ? '#1e1e1e' : '#F3F4F6', borderWidth: 1, borderColor: isDark ? '#262626' : '#E5E7EB' }}>
              <MaterialCommunityIcons name="checkbox-multiple-marked-outline" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {historyFiltered.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 60, opacity: 0.4 }}>
          <MaterialCommunityIcons name="database-off-outline" size={60} color={isDark ? '#4B5563' : '#9CA3AF'} />
          <Text style={{ fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 2, color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 16 }}>No Data</Text>
        </View>
      ) : (
        historyFiltered.map(item => <TxItem key={item.id} item={item} onDelete={handleDelete} onEdit={handleEdit} isSelectMode={isSelectMode} isSelected={selectedIds.has(item.id)} onToggleSelect={toggleSelect} isMasterAdmin={isMasterAdmin} onApprove={handleApprove} onReject={handleReject} isDark={isDark} />)
      )}
    </View>
  );

  const renderPending = () => (
    <View style={{ paddingHorizontal: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <View>
          <Text style={{ fontWeight: '900', fontSize: 18, color: isDark ? '#FFFFFF' : '#111827' }}>Pending Requests</Text>
          <Text style={{ fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 4 }}>
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
          <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={60} color={isDark ? '#4B5563' : '#9CA3AF'} />
          <Text style={{ fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 2, color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 16 }}>No Pending Requests</Text>
        </View>
      ) : (
        transactions.filter(t => t.status === 'pending').map(item => (
          <TxItem key={item.id} item={item} onDelete={handleDelete} onEdit={handleEdit} isMasterAdmin={isMasterAdmin} onApprove={handleApprove} onReject={handleReject} isDark={isDark} />
        ))
      )}
    </View>
  );

  const renderEntry = () => (
    <View style={{ paddingHorizontal: 24 }}>
      <Text style={{ fontWeight: '900', fontSize: 18, color: isDark ? '#FFFFFF' : '#111827', marginBottom: 16 }}>{editingItem ? (isAdmin ? 'Edit Request' : 'Edit Entry') : (isAdmin ? 'New Request' : 'New Entry')}</Text>
      <View style={{ backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF', borderRadius: 24, padding: 20, elevation: 5, borderWidth: 1, borderColor: isDark ? '#262626' : '#F3F4F6' }}>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          <TouchableOpacity onPress={() => setEntryType('income')}
            style={{ flex: 1, backgroundColor: entryType === 'income' ? '#D1FAE5' : (isDark ? '#262626' : '#F9FAFB'), borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: entryType === 'income' ? '#10B981' : (isDark ? '#3a3a38' : '#E5E7EB') }}>
            <MaterialCommunityIcons name={entryType === 'income' ? 'arrow-down-bold-circle' : 'arrow-down-bold-circle-outline'} size={18} color={entryType === 'income' ? '#065F46' : (isDark ? '#9CA3AF' : '#6B7280')} />
            <Text style={{ fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: entryType === 'income' ? '#065F46' : (isDark ? '#9CA3AF' : '#6B7280'), marginTop: 4 }}>Income</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setEntryType('expense')}
            style={{ flex: 1, backgroundColor: entryType === 'expense' ? '#FEE2E2' : (isDark ? '#262626' : '#F9FAFB'), borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: entryType === 'expense' ? '#EF4444' : (isDark ? '#3a3a38' : '#E5E7EB') }}>
            <MaterialCommunityIcons name={entryType === 'expense' ? 'arrow-up-bold-circle' : 'arrow-up-bold-circle-outline'} size={18} color={entryType === 'expense' ? '#991B1B' : (isDark ? '#9CA3AF' : '#6B7280')} />
            <Text style={{ fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: entryType === 'expense' ? '#991B1B' : (isDark ? '#9CA3AF' : '#6B7280'), marginTop: 4 }}>Expense</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: 8 }}>Description</Text>
          <View style={{ backgroundColor: isDark ? '#262626' : '#F9FAFB', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: isDark ? '#3a3a38' : '#E5E7EB', flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="text-box-outline" size={20} color={brandColor} style={{ marginRight: 12 }} />
            <TextInput value={name} onChangeText={setName} placeholder="e.g. Term Fees, Salary..." placeholderTextColor={'#9CA3AF'}
              style={{ flex: 1, fontWeight: '900', fontSize: 15, color: isDark ? '#FFFFFF' : '#111827' }} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: 8 }}>Amount</Text>
            <View style={{ backgroundColor: isDark ? '#262626' : '#F9FAFB', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: isDark ? '#3a3a38' : '#E5E7EB' }}>
              <TextInput value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="numeric" placeholderTextColor={'#CBD5E0'}
                style={{ fontWeight: '900', fontSize: 18, color: entryType === 'income' ? '#10B981' : '#EF4444' }} />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: 8 }}>Category</Text>
            <TouchableOpacity onPress={() => setShowCategoryModal(true)}
              style={{ backgroundColor: isDark ? '#262626' : '#F9FAFB', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: isDark ? '#3a3a38' : '#E5E7EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: category ? (isDark ? '#FFFFFF' : '#111827') : '#9CA3AF' }}>{category || 'SELECT'}</Text>
              <MaterialCommunityIcons name="chevron-down" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: 8 }}>Payment Method</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {paymentMethods.map(m => (
              <TouchableOpacity key={m} onPress={() => { setPaymentMethod(m); if (m === 'Petty Cash') showPettyCashInfo(); }}
                style={{ flex: 1, backgroundColor: paymentMethod === m ? '#10B981' : (isDark ? '#262626' : '#F9FAFB'), borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: paymentMethod === m ? '#10B981' : (isDark ? '#3a3a38' : '#E5E7EB') }}>
                <MaterialCommunityIcons name={m === 'Cash' ? 'cash' : m === 'Bank' ? 'bank' : m === 'UPI' ? 'qrcode' : 'wallet-outline'} size={16} color={paymentMethod === m ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#6B7280')} />
                <Text style={{ fontWeight: '800', fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.5, color: paymentMethod === m ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#6B7280'), marginTop: 4 }}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {isPettyCash && (
            <View style={{ marginTop: 8, backgroundColor: pettyCashBalance !== null ? (balanceOk ? '#FEE2E2' : '#DCFCE7') : (isDark ? '#262626' : '#F3F4F6'), borderRadius: 12, padding: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '700', fontSize: 12, color: isDark ? '#FFF' : '#374151' }}>Petty Cash Available</Text>
                <Text style={{ fontWeight: '900', fontSize: 14, color: pettyCashBalance !== null ? '#10B981' : '#9CA3AF' }}>
                  {pettyCashBalance !== null ? `₹${pettyCashBalance.toLocaleString('en-IN')}` : '—'}
                </Text>
              </View>
              {pettyCashPending > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                  <Text style={{ fontWeight: '700', fontSize: 12, color: isDark ? '#FBBF24' : '#B45309' }}>Pending approval</Text>
                  <Text style={{ fontWeight: '900', fontSize: 14, color: '#F59E0B' }}>-₹{pettyCashPending.toLocaleString('en-IN')}</Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={{ fontWeight: '700', fontSize: 12, color: isDark ? '#FFF' : '#374151' }}>Balance after this</Text>
                <Text style={{ fontWeight: '900', fontSize: 14, color: balanceOk ? '#EF4444' : '#10B981' }}>
                  {pettyCashAvailable !== null ? `₹${Math.max(0, pettyCashAvailable).toLocaleString('en-IN')}` : '—'}
                </Text>
              </View>
              {balanceOk && (
                <View style={{ backgroundColor: '#FEE2E2', borderRadius: 8, padding: 8, marginTop: 8 }}>
                  <Text style={{ color: '#991B1B', fontWeight: '800', fontSize: 10, textAlign: 'center' }}>Insufficient Petty Cash Balance</Text>
                </View>
              )}
              {isAdmin && (
                <Text style={{ color: '#9CA3AF', fontWeight: '700', fontSize: 9, marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Deducted after master admin approves
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={{ marginBottom: 20 }}>
          <DatePicker label="Date" value={entryDate} onChange={setEntryDate} theme={isDark ? 'dark' : 'light'} />
        </View>

        <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting} activeOpacity={0.9} style={{ borderRadius: 16, overflow: 'hidden', elevation: 8 }}>
          <LinearGradient colors={isDark ? AMBER_DARK : AMBER} style={{ paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
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
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFFFFF' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: Math.max(insets.top, 50), paddingBottom: 100 }}
      >
        <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ backgroundColor: isDark ? '#1e1e1e' : '#F3F4F6', width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? '#262626' : '#E5E7EB', marginBottom: 16, elevation: 2 }}
              >
                <MaterialCommunityIcons name="arrow-left" size={22} color={isDark ? '#FFFFFF' : '#374151'} />
              </TouchableOpacity>
              <Text style={{ fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: isDark ? '#D1D5DB' : '#6B7280' }}>
                TN HAPPYKIDS
              </Text>
              <Text style={{ fontSize: 30, fontWeight: '900', letterSpacing: -0.5, marginTop: 4, color: isDark ? '#FFFFFF' : '#111827' }}>
                Finance
              </Text>
              <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100, marginTop: 12, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.1)', flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="cash-multiple" size={14} color="#F59E0B" />
                <Text style={{ color: '#F59E0B', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginLeft: 6 }}>Income & Expense</Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => { setEditingItem(null); setActiveTab('entry'); }}
              style={{ backgroundColor: '#FDE047', width: 80, height: 80, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FFFFFF', transform: [{ rotate: '3deg' }], overflow: 'hidden', elevation: 6 }}
            >
              <MaterialCommunityIcons name="bank" size={36} color="#92400E" />
              <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: '#059669', padding: 4, borderRadius: 10, borderWidth: 2, borderColor: '#FFFFFF' }}>
                <MaterialCommunityIcons name="wallet" size={12} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          {!isAdmin && (
            <View style={{ marginTop: 16 }}>
              <BranchFilter selectedBranchId={branchFilterId} onSelect={setBranchFilterId} />
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            {([
              { key: 'history' as const, label: 'Ledger', icon: 'file-document-multiple-outline', badge: undefined },
              { key: 'pending' as const, label: 'Pending', icon: 'clock-outline', badge: pendingCount > 0 ? pendingCount : undefined },
              { key: 'entry' as const, label: isAdmin ? 'Request' : 'Entry', icon: 'plus-circle-outline', badge: undefined },
            ]).map(tab => (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.9}
                onPress={() => { setActiveTab(tab.key); }}
                style={{
                  flex: 1, backgroundColor: activeTab === tab.key ? '#F59E0B' : (isDark ? '#1e1e1e' : '#F3F4F6'),
                  borderRadius: 14, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
                  borderWidth: 1, borderColor: activeTab === tab.key ? '#F59E0B' : (isDark ? '#262626' : '#E5E7EB'),
                  elevation: activeTab === tab.key ? 4 : 0,
                }}
              >
                <MaterialCommunityIcons name={tab.icon as any} size={16} color={activeTab === tab.key ? 'white' : (isDark ? '#9CA3AF' : '#6B7280')} />
                <Text style={{ fontWeight: '900', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, color: activeTab === tab.key ? 'white' : (isDark ? '#9CA3AF' : '#6B7280'), marginLeft: 5 }}>
                  {tab.label}{tab.badge ? ` (${tab.badge})` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {activeTab === 'history' ? (
          <>
            {renderDashboard()}
            {renderHistory()}
          </>
        ) : activeTab === 'pending' ? renderPending() : renderEntry()}
      </ScrollView>

      <PremiumPopup visible={statusModal.visible} title={statusModal.title} message={statusModal.message} type={statusModal.type} onClose={() => setStatusModal({ ...statusModal, visible: false })} buttonText="OK" />
    </View>
  );
}
