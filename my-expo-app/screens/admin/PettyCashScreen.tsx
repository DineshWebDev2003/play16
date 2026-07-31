import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Modal, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';

interface Props { navigation: { navigate: (s: string) => void; goBack: () => void } }

export default function PettyCashScreen({ navigation }: Props) {
  const { user, branches } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isMaster = user?.role === 'master_admin';
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [pendingAmount, setPendingAmount] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [branchId, setBranchId] = useState<string | null>(isMaster ? null : (user?.branch_id?.toString() || null));
  const [showBranchPicker, setShowBranchPicker] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [addReason, setAddReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'add' | 'history'>('add');
  const [editEntry, setEditEntry] = useState<any>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editReason, setEditReason] = useState('');

  const loadData = useCallback(async () => {
    try {
      const bid = branchId || (branches[0]?.id?.toString());
      if (!bid) { setBalance(0); setTransactions([]); return; }
      const [balRes, txRes] = await Promise.all([
        api.get(`/petty-cash/balance?branch_id=${bid}`),
        api.get(`/petty-cash/transactions?branch_id=${bid}`),
      ]);
      setBalance(balRes.data?.balance ?? balRes.data?.data?.balance ?? 0);
      setPendingAmount(balRes.data?.pending ?? balRes.data?.data?.pending ?? 0);
      const txs = txRes.data?.data || (Array.isArray(txRes.data) ? txRes.data : []);
      setTransactions(txs);
    } catch { setBalance(0); setPendingAmount(0); setTransactions([]); }
  }, [branchId, branches]);

  useEffect(() => {
    (async () => { setLoading(true); await loadData(); setLoading(false); })();
  }, [branchId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await loadData(); setRefreshing(false);
  }, [loadData]);

  const canAdd = isMaster && !!branchId;

  const handleAdd = useCallback(async () => {
    const amt = parseFloat(addAmount);
    if (!amt || amt <= 0) { Alert.alert('Invalid', 'Enter a valid amount.'); return; }
    setSubmitting(true);
    try {
      await api.post('/petty-cash/add', {
        amount: amt,
        reason: addReason.trim() || undefined,
        branch_id: branchId,
      });
      await loadData();
      setAddAmount(''); setAddReason(''); setShowAddModal(false);
      Alert.alert('Success', `₹${amt.toLocaleString()} added to Petty Cash.`);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to add.');
    }
    setSubmitting(false);
  }, [addAmount, addReason, branchId, loadData]);

  const openEdit = (entry: any) => {
    setEditEntry(entry);
    setEditAmount(Math.abs(entry.amount).toString());
    setEditReason(entry.reason || entry.expense_name || '');
  };

  const handleSaveEdit = useCallback(async () => {
    if (!editEntry) return;
    const amt = parseFloat(editAmount);
    if (!amt || amt <= 0) { Alert.alert('Invalid', 'Enter a valid amount.'); return; }
    setSubmitting(true);
    try {
      await api.put(`/petty-cash/${editEntry.id}`, {
        amount: amt,
        reason: editReason.trim(),
      });
      await loadData();
      setEditEntry(null); setEditAmount(''); setEditReason('');
      Alert.alert('Success', 'Entry updated.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update.');
    }
    setSubmitting(false);
  }, [editEntry, editAmount, editReason, loadData]);

  const handleDelete = useCallback((entry: any) => {
    Alert.alert('Delete Entry?', `Remove this ${entry.type === 'credit' ? 'credit' : 'debit'} of ₹${Math.abs(entry.amount).toLocaleString('en-IN')}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/petty-cash/${entry.id}`);
            await loadData();
            Alert.alert('Deleted', 'Entry removed.');
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Failed to delete.');
          }
        },
      },
    ]);
  }, [loadData]);

  const formatDate = (d: string) => {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const branchName = branchId ? branches.find(b => b.id?.toString() === branchId)?.name || 'Selected Branch' : 'Select a branch';

  const renderTabs = () => (
    <View style={{ flexDirection: 'row', backgroundColor: isDark ? '#2a2a28' : '#F3F4F6', borderRadius: 14, padding: 4, marginHorizontal: 24, marginBottom: 20 }}>
      {(['add', 'history'] as const).map(tab => {
        const active = activeTab === tab;
        return (
          <TouchableOpacity key={tab} activeOpacity={0.8} onPress={() => setActiveTab(tab)}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: active ? (isDark ? '#10B981' : '#10B981') : 'transparent' }}>
            <MaterialCommunityIcons name={tab === 'add' ? 'wallet-plus' : 'swap-horizontal-bold'} size={16} color={active ? 'white' : (isDark ? '#9CA3AF' : '#6B7280')} />
            <Text style={{ fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginLeft: 6, color: active ? 'white' : (isDark ? '#9CA3AF' : '#6B7280') }}>
              {tab === 'add' ? 'Add' : 'History'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFF8F0' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color="#10B981" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFFFFF' }}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" colors={['#10B981']} />}>
        <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: isDark ? '#6B7280' : '#9CA3AF' }}>Finance</Text>
              <Text style={{ fontSize: 28, fontWeight: '900', letterSpacing: -1, marginTop: 2, color: isDark ? '#FFFFFF' : '#111827' }}>Petty Cash</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ backgroundColor: '#10B981', width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Branch Selector (Master Admin) */}
        {isMaster && (
          <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
            <TouchableOpacity onPress={() => setShowBranchPicker(true)}
              style={{ backgroundColor: isDark ? '#2a2a28' : '#F3F4F6', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: branchId ? '#10B981' : (isDark ? '#3a3a38' : '#E5E7EB') }}>
              <MaterialCommunityIcons name="domain" size={20} color="#10B981" />
              <Text style={{ flex: 1, fontWeight: '700', fontSize: 15, color: branchId ? (isDark ? '#FFF' : '#111') : '#9CA3AF', marginLeft: 10 }}>
                {branchName}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={isDark ? '#6B7280' : '#9CA3AF'} />
            </TouchableOpacity>
            {!branchId && (
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#10B981', marginTop: 6, marginLeft: 4 }}>Select a branch to enable Add Petty Cash</Text>
            )}
          </View>
        )}

        {renderTabs()}

        {activeTab === 'add' && (
          <>
            {/* Balance Card */}
            <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
              <View style={{
                backgroundColor: isDark ? '#0a2a1a' : '#DCFCE7',
                borderRadius: 24, padding: 24, alignItems: 'center',
                borderWidth: 1, borderColor: isDark ? '#10B981' : '#A7F3D0',
              }}>
                <MaterialCommunityIcons name="wallet-outline" size={40} color="#10B981" />
                <Text style={{ color: isDark ? '#6EE7B7' : '#065F46', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginTop: 8 }}>Current Balance</Text>
                <Text style={{ color: isDark ? '#FFFFFF' : '#065F46', fontSize: 42, fontWeight: '900', letterSpacing: -1, marginTop: 4 }}>₹{balance.toLocaleString('en-IN')}</Text>
                {pendingAmount > 0 && (
                  <View style={{ backgroundColor: isDark ? '#2a2a28' : '#FEF3C7', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <MaterialCommunityIcons name="clock-outline" size={14} color="#F59E0B" />
                    <Text style={{ color: '#B45309', fontWeight: '800', fontSize: 11, marginLeft: 6 }}>
                      ₹{pendingAmount.toLocaleString('en-IN')} pending approval
                    </Text>
                  </View>
                )}
                {isMaster && (
                  <TouchableOpacity
                    onPress={() => { if (canAdd) setShowAddModal(true); }}
                    disabled={!canAdd}
                    activeOpacity={0.85}
                    style={{ backgroundColor: canAdd ? '#10B981' : (isDark ? '#3a3a38' : '#D1D5DB'), borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
                    <MaterialCommunityIcons name="plus" size={20} color={canAdd ? 'white' : '#9CA3AF'} />
                    <Text style={{ color: canAdd ? 'white' : '#9CA3AF', fontWeight: '900', fontSize: 13, marginLeft: 6 }}>Add Petty Cash</Text>
                  </TouchableOpacity>
                )}
                {!isMaster && (
                  <Text style={{ color: isDark ? '#6EE7B7' : '#065F46', fontSize: 11, fontWeight: '700', marginTop: 12 }}>Read only — managed by master admin</Text>
                )}
              </View>
            </View>
          </>
        )}

        {activeTab === 'history' && (
          <View style={{ paddingHorizontal: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#FFF' : '#111' }}>Transaction History</Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#6B7280' : '#9CA3AF' }}>{transactions.length} entries</Text>
            </View>
            {transactions.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 48, backgroundColor: isDark ? '#2a2a28' : '#F9FAFB', borderRadius: 24 }}>
                <MaterialCommunityIcons name="swap-horizontal-bold" size={48} color={isDark ? '#4B5563' : '#9CA3AF'} />
                <Text style={{ fontWeight: '700', fontSize: 14, color: isDark ? '#D1D5DB' : '#6B7280', marginTop: 12 }}>No transactions yet</Text>
              </View>
            ) : (
              transactions.map((tx: any, idx: number) => {
                const isCredit = tx.type === 'credit';
                const isPending = tx.status === 'pending';
                return (
                  <View key={tx.id || idx} style={{
                    backgroundColor: isDark ? '#2a2a28' : '#FFFFFF',
                    borderRadius: 16, padding: 14, marginBottom: 8,
                    borderWidth: 1, borderColor: isPending ? (isDark ? '#78350f' : '#FDE68A') : (isDark ? '#3a3a38' : '#F3F4F6'),
                    borderLeftWidth: 4, borderLeftColor: isPending ? '#F59E0B' : (isCredit ? '#10B981' : '#EF4444'),
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: isPending ? '#FEF3C7' : (isCredit ? '#DCFCE7' : '#FEE2E2'), alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                          <MaterialCommunityIcons name={isPending ? 'clock-outline' : (isCredit ? 'arrow-down-bold' : 'arrow-up-bold')} size={18} color={isPending ? '#F59E0B' : (isCredit ? '#10B981' : '#EF4444')} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: '900', fontSize: 14, color: isDark ? '#FFF' : '#111' }} numberOfLines={1}>{tx.reason || tx.expense_name || tx.name || (isCredit ? 'Cash Added' : 'Expense')}</Text>
                          <Text style={{ fontSize: 10, fontWeight: '600', color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 2 }}>{formatDate(tx.created_at || tx.date)}</Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        {isPending && (
                          <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 3 }}>
                            <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', color: '#B45309' }}>Pending</Text>
                          </View>
                        )}
                        <Text style={{ fontWeight: '900', fontSize: 16, color: isPending ? '#F59E0B' : (isCredit ? '#10B981' : '#EF4444') }}>
                          {isPending ? '-' : (isCredit ? '+' : '-')}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                        </Text>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 1, textTransform: 'uppercase' }}>{isPending ? 'Pending' : (isCredit ? 'Credit' : 'Debit')}</Text>
                      </View>
                    </View>
                    {tx.created_by_name && (
                      <Text style={{ fontSize: 10, fontWeight: '600', color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 6 }}>By: {tx.created_by_name}</Text>
                    )}
                    {isMaster && !isPending && (
                      <View style={{ flexDirection: 'row', marginTop: 10, gap: 8 }}>
                        <TouchableOpacity onPress={() => openEdit(tx)} activeOpacity={0.8}
                          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF', borderRadius: 10, paddingVertical: 8 }}>
                          <MaterialCommunityIcons name="pencil-outline" size={15} color="#3B82F6" />
                          <Text style={{ color: '#3B82F6', fontWeight: '800', fontSize: 12, marginLeft: 6, textTransform: 'uppercase' }}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(tx)} activeOpacity={0.8}
                          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', borderRadius: 10, paddingVertical: 8 }}>
                          <MaterialCommunityIcons name="trash-can-outline" size={15} color="#EF4444" />
                          <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 12, marginLeft: 6, textTransform: 'uppercase' }}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        <View style={{ height: 128 }} />
      </ScrollView>

      {/* Branch Picker Modal */}
      <Modal transparent visible={showBranchPicker} onRequestClose={() => setShowBranchPicker(false)} animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowBranchPicker(false)} />
          <View style={{ backgroundColor: isDark ? '#1c1c14' : '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 }}>
            <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: isDark ? '#3a3a38' : '#F3F4F6' }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#FFF' : '#111' }}>Select Branch</Text>
            </View>
            <ScrollView style={{ padding: 24 }} showsVerticalScrollIndicator={false}>
              {branches.map((b: any) => (
                <TouchableOpacity key={b.id} onPress={() => { setBranchId(b.id?.toString() || null); setShowBranchPicker(false); }}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: isDark ? '#2a2a28' : '#F3F4F6' }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: branchId === b.id?.toString() ? '#10B981' : (isDark ? '#6B7280' : '#D1D5DB'), alignItems: 'center', justifyContent: 'center' }}>
                    {branchId === b.id?.toString() && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981' }} />}
                  </View>
                  <Text style={{ fontWeight: '800', fontSize: 15, color: isDark ? '#FFF' : '#111', marginLeft: 14 }}>{b.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Petty Cash Modal */}
      <Modal transparent visible={showAddModal} onRequestClose={() => { setShowAddModal(false); setAddAmount(''); setAddReason(''); }} animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => { setShowAddModal(false); setAddAmount(''); setAddReason(''); }} />
          <View style={{ backgroundColor: isDark ? '#1c1c14' : '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 }}>
            <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: isDark ? '#3a3a38' : '#F3F4F6' }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#FFF' : '#111' }}>Add Petty Cash</Text>
              <TouchableOpacity onPress={() => { setShowAddModal(false); setAddAmount(''); setAddReason(''); }} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="close" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 24 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Amount</Text>
              <TextInput value={addAmount} onChangeText={setAddAmount} placeholder="0" keyboardType="numeric" placeholderTextColor="#9CA3AF"
                style={{ backgroundColor: isDark ? '#1e1e1c' : '#F9FAFB', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontWeight: '900', fontSize: 24, color: '#10B981', borderWidth: 1, borderColor: isDark ? '#3a3a38' : '#E5E7EB', marginBottom: 16 }} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Reason (optional)</Text>
              <TextInput value={addReason} onChangeText={setAddReason} placeholder="e.g. Monthly Petty Cash" placeholderTextColor="#9CA3AF"
                style={{ backgroundColor: isDark ? '#1e1e1c' : '#F9FAFB', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontWeight: '600', fontSize: 14, color: isDark ? '#D1D5DB' : '#374151', borderWidth: 1, borderColor: isDark ? '#3a3a38' : '#E5E7EB', marginBottom: 24 }} />
              <TouchableOpacity onPress={handleAdd} disabled={submitting}
                style={{ backgroundColor: submitting ? '#D1D5DB' : '#10B981', paddingVertical: 16, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
                {submitting ? <ActivityIndicator color="white" /> : <><MaterialCommunityIcons name="wallet-plus" size={20} color="white" /><Text style={{ color: 'white', fontWeight: '900', fontSize: 15, marginLeft: 8 }}>Add to Petty Cash</Text></>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Entry Modal */}
      <Modal transparent visible={!!editEntry} onRequestClose={() => setEditEntry(null)} animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setEditEntry(null)} />
          <View style={{ backgroundColor: isDark ? '#1c1c14' : '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 }}>
            <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: isDark ? '#3a3a38' : '#F3F4F6' }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#FFF' : '#111' }}>Edit Entry</Text>
              <TouchableOpacity onPress={() => setEditEntry(null)} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="close" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 24 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: editEntry?.type === 'credit' ? '#DCFCE7' : '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                  <MaterialCommunityIcons name={editEntry?.type === 'credit' ? 'arrow-down-bold' : 'arrow-up-bold'} size={18} color={editEntry?.type === 'credit' ? '#10B981' : '#EF4444'} />
                </View>
                <Text style={{ fontWeight: '900', fontSize: 15, color: isDark ? '#FFF' : '#111' }}>
                  {editEntry?.type === 'credit' ? 'Credit Entry' : 'Debit Entry'}
                </Text>
              </View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Amount</Text>
              <TextInput value={editAmount} onChangeText={setEditAmount} placeholder="0" keyboardType="numeric" placeholderTextColor="#9CA3AF"
                style={{ backgroundColor: isDark ? '#1e1e1c' : '#F9FAFB', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontWeight: '900', fontSize: 24, color: '#10B981', borderWidth: 1, borderColor: isDark ? '#3a3a38' : '#E5E7EB', marginBottom: 16 }} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Reason</Text>
              <TextInput value={editReason} onChangeText={setEditReason} placeholder="e.g. Monthly Petty Cash" placeholderTextColor="#9CA3AF"
                style={{ backgroundColor: isDark ? '#1e1e1c' : '#F9FAFB', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontWeight: '600', fontSize: 14, color: isDark ? '#D1D5DB' : '#374151', borderWidth: 1, borderColor: isDark ? '#3a3a38' : '#E5E7EB', marginBottom: 24 }} />
              <TouchableOpacity onPress={handleSaveEdit} disabled={submitting}
                style={{ backgroundColor: submitting ? '#D1D5DB' : '#10B981', paddingVertical: 16, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
                {submitting ? <ActivityIndicator color="white" /> : <><MaterialCommunityIcons name="content-save" size={20} color="white" /><Text style={{ color: 'white', fontWeight: '900', fontSize: 15, marginLeft: 8 }}>Save Changes</Text></>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
