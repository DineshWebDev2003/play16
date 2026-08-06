import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, TextInput, Image, StyleSheet, Dimensions, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import GlassDropdown from './GlassDropdown';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const BORDER_RADIUS = 22;

const WALLET_ICON = require('../../../assets/icons/wallet.png');

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

// ─── Aurora Glass background layer ─────────────────────────────────────────────
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

// ─── Glass confirm popup ───────────────────────────────────────────────────────
function ConfirmPopup({ visible, title, message, onCancel, onConfirm }: {
  visible: boolean; title: string; message: string; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: 'rgba(31,45,40,0.4)', justifyContent: 'center', paddingHorizontal: 20 }}>
        <View style={{ borderRadius: BORDER_RADIUS, backgroundColor: 'rgba(255,255,255,0.98)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', padding: 24, alignItems: 'center' }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(239,68,68,0.12)', alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="trash-can-outline" size={32} color="#EF4444" />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY, marginTop: 16, textAlign: 'center' }}>{title}</Text>
          <Text style={{ fontSize: 13, fontWeight: '500', color: TEXT_SECONDARY, marginTop: 8, textAlign: 'center', lineHeight: 19 }}>{message}</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 20, alignSelf: 'stretch' }}>
            <TouchableOpacity onPress={onCancel} activeOpacity={0.8} style={{ flex: 1, height: 50, borderRadius: 16, backgroundColor: 'rgba(247,249,246,0.95)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: TEXT_SECONDARY }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} activeOpacity={0.85} style={{ flex: 1, height: 50, borderRadius: 16, overflow: 'hidden' }}>
              <LinearGradient colors={['#EF4444', '#DC2626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: '#FFFFFF' }}>Delete</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────
interface Props { navigation: { navigate: (s: string, params?: any) => void; goBack: () => void } }

export default function PettyCashScreenV2({ navigation }: Props) {
  const { user, branches } = useAuth();
  const insets = useSafeAreaInsets();
  const isMaster = user?.role === 'master_admin';

  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [pendingAmount, setPendingAmount] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [branchId, setBranchId] = useState<string | null>(isMaster ? null : (user?.branch_id?.toString() || null));
  const [activeTab, setActiveTab] = useState<'add' | 'history'>('add');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [addReason, setAddReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editEntry, setEditEntry] = useState<any>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editReason, setEditReason] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

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
  }, [branchId, loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await loadData(); setRefreshing(false);
  }, [loadData]);

  const canAdd = isMaster && !!branchId;

  const handleAdd = useCallback(async () => {
    const amt = parseFloat(addAmount);
    if (!amt || amt <= 0) return;
    setSubmitting(true);
    try {
      await api.post('/petty-cash/add', {
        amount: amt,
        reason: addReason.trim() || undefined,
        branch_id: branchId,
      });
      await loadData();
      setAddAmount(''); setAddReason(''); setShowAddModal(false);
    } catch {}
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
    if (!amt || amt <= 0) return;
    setSubmitting(true);
    try {
      await api.put(`/petty-cash/${editEntry.id}`, {
        amount: amt,
        reason: editReason.trim(),
      });
      await loadData();
      setEditEntry(null); setEditAmount(''); setEditReason('');
    } catch {}
    setSubmitting(false);
  }, [editEntry, editAmount, editReason, loadData]);

  const handleDelete = useCallback(async (entry: any) => {
    setConfirmDelete(null);
    try {
      await api.delete(`/petty-cash/${entry.id}`);
      await loadData();
    } catch {}
  }, [loadData]);

  const formatDate = (d: string) => {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const branchName = branchId ? branches.find(b => b.id?.toString() === branchId)?.name || 'Selected Branch' : 'Select a branch';

  const inp = { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, fontWeight: '700' as const, color: TEXT_PRIMARY, backgroundColor: 'rgba(247,249,246,0.95)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F7F9F6', alignItems: 'center', justifyContent: 'center' }}>
        <AuroraBackground />
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" colors={['#10B981']} />}
      >
        {/* ── Header ── */}
        <View style={{ paddingTop: Math.max(insets.top, 56), paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY }}>‹</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontSize: 12, fontWeight: '400', color: TEXT_MUTED }}>Finance</Text>
              <Text style={{ fontSize: 22, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 2, letterSpacing: -0.5 }}>Petty Cash</Text>
            </View>
            <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
              <Image source={WALLET_ICON} style={{ width: 46, height: 46 }} resizeMode="contain" />
            </View>
          </View>

          {/* Branch picker (master admin) */}
          {isMaster && (
            <View style={{ marginTop: 20 }}>
              <GlassDropdown selectedBranchId={branchId} onSelect={setBranchId} icon={WALLET_ICON} />
              {!branchId && (
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#10B981', marginTop: 6, marginLeft: 4 }}>Select a branch to enable Add Petty Cash</Text>
              )}
            </View>
          )}
        </View>

        {/* ── Tabs ── */}
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 24, marginHorizontal: 20, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', padding: 6 }}>
          {(['add', 'history'] as const).map(tab => {
            const active = activeTab === tab;
            return (
              <TouchableOpacity key={tab} activeOpacity={0.8} onPress={() => setActiveTab(tab)}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 14, backgroundColor: active ? 'rgba(245,158,11,0.15)' : 'transparent' }}>
                <MaterialCommunityIcons name={tab === 'add' ? 'wallet-plus' : 'swap-horizontal-bold'} size={16} color={active ? '#D97706' : TEXT_MUTED} />
                <Text style={{ fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginLeft: 6, color: active ? '#D97706' : TEXT_MUTED }}>
                  {tab === 'add' ? 'Add' : 'History'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Add tab ── */}
        {activeTab === 'add' && (
          <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
            <View style={{ borderRadius: BORDER_RADIUS, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', padding: 24, alignItems: 'center' }}>
              <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(16,185,129,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                <Image source={WALLET_ICON} style={{ width: 54, height: 54 }} resizeMode="contain" />
              </View>
              <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginTop: 12 }}>Current Balance</Text>
              <Text style={{ color: TEXT_PRIMARY, fontSize: 40, fontWeight: '900', letterSpacing: -1, marginTop: 4 }}>₹{balance.toLocaleString('en-IN')}</Text>

              {pendingAmount > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6, marginTop: 8 }}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color="#D97706" />
                  <Text style={{ color: '#D97706', fontWeight: '800', fontSize: 11, marginLeft: 6 }}>
                    ₹{pendingAmount.toLocaleString('en-IN')} pending approval
                  </Text>
                </View>
              )}

              {isMaster ? (
                <TouchableOpacity
                  onPress={() => { if (canAdd) setShowAddModal(true); }}
                  disabled={!canAdd}
                  activeOpacity={0.85}
                  style={{ marginTop: 18, height: 52, borderRadius: 16, alignSelf: 'stretch', overflow: 'hidden' }}
                >
                  <LinearGradient colors={canAdd ? ['#10B981', '#059669'] : ['#D1D5DB', '#9CA3AF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
                    <MaterialCommunityIcons name="plus" size={20} color="white" />
                    <Text style={{ color: 'white', fontWeight: '900', fontSize: 13, marginLeft: 6 }}>Add Petty Cash</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '700', marginTop: 12 }}>Read only — managed by master admin</Text>
              )}
            </View>
          </View>
        )}

        {/* ── History tab ── */}
        {activeTab === 'history' && (
          <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: TEXT_PRIMARY }}>Transaction History</Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: TEXT_MUTED }}>{transactions.length} entries</Text>
            </View>

            {transactions.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 48, borderRadius: BORDER_RADIUS, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
                <Image source={WALLET_ICON} style={{ width: 56, height: 56, opacity: 0.25 }} resizeMode="contain" />
                <Text style={{ fontWeight: '700', fontSize: 14, color: TEXT_MUTED, marginTop: 12 }}>No transactions yet</Text>
              </View>
            ) : (
              transactions.map((tx: any, idx: number) => {
                const isCredit = tx.type === 'credit';
                const isPending = tx.status === 'pending';
                return (
                  <View key={tx.id || idx} style={{ borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: isPending ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.6)', padding: 14, marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: isPending ? 'rgba(245,158,11,0.12)' : (isCredit ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)'), alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                          <MaterialCommunityIcons name={isPending ? 'clock-outline' : (isCredit ? 'arrow-down-bold' : 'arrow-up-bold')} size={18} color={isPending ? '#D97706' : (isCredit ? '#059669' : '#DC2626')} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: '900', fontSize: 14, color: TEXT_PRIMARY }} numberOfLines={1}>{tx.reason || tx.expense_name || tx.name || (isCredit ? 'Cash Added' : 'Expense')}</Text>
                          <Text style={{ fontSize: 10, fontWeight: '600', color: TEXT_MUTED, marginTop: 2 }}>{formatDate(tx.created_at || tx.date)}</Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        {isPending && (
                          <View style={{ backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 3 }}>
                            <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', color: '#D97706' }}>Pending</Text>
                          </View>
                        )}
                        <Text style={{ fontWeight: '900', fontSize: 16, color: isPending ? '#D97706' : (isCredit ? '#059669' : '#DC2626') }}>
                          {isPending ? '-' : (isCredit ? '+' : '-')}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                        </Text>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: TEXT_MUTED, marginTop: 1, textTransform: 'uppercase' }}>{isPending ? 'Pending' : (isCredit ? 'Credit' : 'Debit')}</Text>
                      </View>
                    </View>

                    {tx.created_by_name && (
                      <Text style={{ fontSize: 10, fontWeight: '600', color: TEXT_MUTED, marginTop: 6 }}>By: {tx.created_by_name}</Text>
                    )}

                    {isMaster && !isPending && (
                      <View style={{ flexDirection: 'row', marginTop: 10, gap: 8 }}>
                        <TouchableOpacity onPress={() => openEdit(tx)} activeOpacity={0.8} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: 12, paddingVertical: 9 }}>
                          <MaterialCommunityIcons name="pencil-outline" size={15} color="#3B82F6" />
                          <Text style={{ color: '#3B82F6', fontWeight: '800', fontSize: 11, marginLeft: 6, textTransform: 'uppercase' }}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setConfirmDelete(tx)} activeOpacity={0.8} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 12, paddingVertical: 9 }}>
                          <MaterialCommunityIcons name="trash-can-outline" size={15} color="#EF4444" />
                          <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 11, marginLeft: 6, textTransform: 'uppercase' }}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Add Petty Cash modal ── */}
      <Modal visible={showAddModal} animationType="slide" transparent={false} onRequestClose={() => { setShowAddModal(false); setAddAmount(''); setAddReason(''); }}>
        <View style={{ flex: 1, backgroundColor: '#F7F9F6', paddingTop: insets.top }}>
          <AuroraBackground />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <View style={{ paddingHorizontal: 20, paddingTop: 8, flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => { setShowAddModal(false); setAddAmount(''); setAddReason(''); }} style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="close" size={22} color={TEXT_PRIMARY} />
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ fontSize: 12, fontWeight: '400', color: TEXT_MUTED }}>Finance · {branchName}</Text>
                <Text style={{ fontSize: 22, fontWeight: '700', color: TEXT_PRIMARY, letterSpacing: -0.5 }}>Add Petty Cash</Text>
              </View>
              <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                <Image source={WALLET_ICON} style={{ width: 46, height: 46 }} resizeMode="contain" />
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
              <Text style={{ fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', color: TEXT_MUTED, marginBottom: 8 }}>Amount *</Text>
              <TextInput
                style={{ borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 24, fontWeight: '900' as const, color: '#059669', backgroundColor: 'rgba(247,249,246,0.95)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', marginBottom: 20 }}
                value={addAmount}
                onChangeText={setAddAmount}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />

              <Text style={{ fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', color: TEXT_MUTED, marginBottom: 8 }}>Reason (optional)</Text>
              <TextInput
                style={{ ...inp, marginBottom: 28 }}
                value={addReason}
                onChangeText={setAddReason}
                placeholder="e.g. Monthly Petty Cash"
                placeholderTextColor="#9CA3AF"
              />

              <TouchableOpacity onPress={handleAdd} disabled={submitting} activeOpacity={0.85} style={{ height: 56, borderRadius: 18, overflow: 'hidden' }}>
                <LinearGradient colors={submitting ? ['#D1D5DB', '#9CA3AF'] : ['#10B981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="wallet-plus" size={20} color="white" />
                      <Text style={{ color: 'white', fontWeight: '900', fontSize: 14, marginLeft: 8 }}>Add to Petty Cash</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── Edit Entry modal ── */}
      <Modal visible={!!editEntry} animationType="slide" transparent={false} onRequestClose={() => setEditEntry(null)}>
        <View style={{ flex: 1, backgroundColor: '#F7F9F6', paddingTop: insets.top }}>
          <AuroraBackground />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <View style={{ paddingHorizontal: 20, paddingTop: 8, flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => setEditEntry(null)} style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="close" size={22} color={TEXT_PRIMARY} />
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ fontSize: 12, fontWeight: '400', color: TEXT_MUTED }}>Finance · {branchName}</Text>
                <Text style={{ fontSize: 22, fontWeight: '700', color: TEXT_PRIMARY, letterSpacing: -0.5 }}>Edit Entry</Text>
              </View>
              <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                <Image source={WALLET_ICON} style={{ width: 46, height: 46 }} resizeMode="contain" />
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: editEntry?.type === 'credit' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                  <MaterialCommunityIcons name={editEntry?.type === 'credit' ? 'arrow-down-bold' : 'arrow-up-bold'} size={18} color={editEntry?.type === 'credit' ? '#059669' : '#DC2626'} />
                </View>
                <Text style={{ fontWeight: '900', fontSize: 15, color: TEXT_PRIMARY }}>
                  {editEntry?.type === 'credit' ? 'Credit Entry' : 'Debit Entry'}
                </Text>
              </View>

              <Text style={{ fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', color: TEXT_MUTED, marginBottom: 8 }}>Amount *</Text>
              <TextInput
                style={{ borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 24, fontWeight: '900' as const, color: '#059669', backgroundColor: 'rgba(247,249,246,0.95)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', marginBottom: 20 }}
                value={editAmount}
                onChangeText={setEditAmount}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />

              <Text style={{ fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', color: TEXT_MUTED, marginBottom: 8 }}>Reason</Text>
              <TextInput
                style={{ ...inp, marginBottom: 28 }}
                value={editReason}
                onChangeText={setEditReason}
                placeholder="e.g. Monthly Petty Cash"
                placeholderTextColor="#9CA3AF"
              />

              <TouchableOpacity onPress={handleSaveEdit} disabled={submitting} activeOpacity={0.85} style={{ height: 56, borderRadius: 18, overflow: 'hidden' }}>
                <LinearGradient colors={submitting ? ['#D1D5DB', '#9CA3AF'] : ['#10B981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="content-save" size={20} color="white" />
                      <Text style={{ color: 'white', fontWeight: '900', fontSize: 14, marginLeft: 8 }}>Save Changes</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── Delete confirm ── */}
      <ConfirmPopup
        visible={!!confirmDelete}
        title="Delete Entry?"
        message={confirmDelete ? `Remove this ${confirmDelete.type === 'credit' ? 'credit' : 'debit'} of ₹${Math.abs(confirmDelete.amount).toLocaleString('en-IN')}?` : ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
      />
    </View>
  );
}
