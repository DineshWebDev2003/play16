import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, ScrollView,
  Alert, StatusBar, Modal
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import RazorpayCheckout from 'react-native-razorpay';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
}

export default function PayGatewayScreen({ navigation }: Props) {
  const { user, logout, updateProfile, refreshFees } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = theme === 'dark';

  const [processing, setProcessing] = useState(false);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [payMode, setPayMode] = useState<'live' | 'mock'>('mock');
  const [merchantName, setMerchantName] = useState('');
  const [liveOrder, setLiveOrder] = useState<{ order_id: string; key_id: string; amount: number; currency: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const studentFee = parseFloat(user?.fees || '');
        let admissionAmount = !isNaN(studentFee) && studentFee > 0 ? studentFee : 0;
        if (!admissionAmount) {
          const res = await api.get('/fee-structures');
          const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
          const admission = list.find((s: any) =>
            (s.name || '').toLowerCase().includes('admission')
          );
          if (admission) admissionAmount = parseFloat(admission.amount || 0) || 0;
        }
        setAmount(admissionAmount);

        // Determine if real Razorpay is configured (env or branch settings)
        try {
          const cfg = await api.get('/payment/razorpay-config');
          if (cfg.data?.mode === 'live') {
            setPayMode('live');
            setMerchantName(cfg.data?.merchant_name || 'Tuition Payment');
          }
        } catch {
          // default to mock
        }
      } catch (e) {
        console.error('Load admission amount error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.fees]);

  const mockRazorpayCheckout = useCallback(async () => {
    setProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2500));
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      try {
        await api.post('/fees', {
          student_id: user.id,
          student_name: user.name,
          type: 'Admission',
          amount,
          status: 'paid',
          date: today,
          due_date: today,
          paid_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
          payment_method: 'Razorpay (Sandbox)',
          payer_name: user.parentName || user.name,
          payer_phone: user.guardianPhone || user.phone || '',
          branch_id: user.branch_id || undefined,
        });
      } catch (feeErr) {
        console.error('Fee record creation error:', feeErr);
      }

      setCheckoutVisible(false);
      setProcessing(false);
      setSuccessVisible(true);
    } catch (e) {
      console.error('Checkout error:', e);
      setProcessing(false);
      setCheckoutVisible(false);
      Alert.alert('Payment Failed', 'Something went wrong. Please try again.');
    }
  }, [user, amount]);

  const onPay = useCallback(async () => {
    if (amount <= 0) {
      Alert.alert('Amount Missing', 'No admission fee has been configured for this account. Please contact the school admin.');
      return;
    }

    if (payMode === 'mock') {
      setCheckoutVisible(true);
      return;
    }

    // Live Razorpay flow
    if (!user) return;
    setProcessing(true);
    try {
      const res = await api.post('/payment/razorpay/order', { amount, currency: 'INR' });
      if (res.data?.order_id) {
        setLiveOrder({
          order_id: res.data.order_id,
          key_id: res.data.key_id,
          amount: res.data.amount,
          currency: res.data.currency || 'INR',
        });
        setCheckoutVisible(true);
      } else {
        Alert.alert('Payment Error', 'Could not start payment. Please try again.');
      }
    } catch (e) {
      console.error('Razorpay order error:', e);
      Alert.alert('Payment Error', 'Could not reach payment gateway. Please try again.');
    } finally {
      setProcessing(false);
    }
  }, [amount, payMode, user]);

  // When a live order is created, open the native Razorpay checkout automatically
  useEffect(() => {
    if (payMode === 'live' && checkoutVisible && liveOrder) {
      openRazorpay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payMode, checkoutVisible, liveOrder]);

  const openRazorpay = useCallback(async () => {
    if (!liveOrder || !user) return;
    setProcessing(true);
    try {
      const options = {
        key: liveOrder.key_id,
        amount: liveOrder.amount,
        currency: liveOrder.currency,
        order_id: liveOrder.order_id,
        name: merchantName || 'Tuition Payment',
        description: 'Admission Fee',
        prefill: {
          name: user.name,
          email: user.email || '',
          contact: ((user.phone || user.guardianPhone || '').replace(/\D/g, '')) || '',
        },
        theme: { color: '#F59E0B' },
      };
      const data = await RazorpayCheckout.open(options);
      setProcessing(false);

      // Verify signature on the server
      await api.post('/payment/razorpay/verify', {
        razorpay_order_id: data.razorpay_order_id,
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_signature: data.razorpay_signature,
        student_id: user.id,
        amount,
        payer_name: user.parentName || user.name,
        payer_phone: user.guardianPhone || user.phone || '',
        branch_id: user.branch_id || undefined,
      });

      setCheckoutVisible(false);
      setSuccessVisible(true);
    } catch (e: any) {
      console.error('Razorpay payment error:', e);
      setCheckoutVisible(false);
      Alert.alert(
        e?.code === 'PAYMENT_CANCELLED' ? 'Payment Cancelled' : 'Payment Failed',
        e?.code === 'PAYMENT_CANCELLED' ? 'You cancelled the payment.' : 'The payment did not complete. Please try again.'
      );
    } finally {
      setProcessing(false);
    }
  }, [liveOrder, user, amount, merchantName]);

  const onDone = useCallback(async () => {
    setSuccessVisible(false);
    try { await updateProfile({ status: 'active', pay_to_active: false }); } catch {}
    try { await refreshFees(); } catch {}
    navigation.navigate('home' as any);
  }, [updateProfile, refreshFees, navigation]);

  const textPrimary = isDark ? '#FFFFFF' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#6B7280';

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#F8F6F0' }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#1c1c14' : '#F8F6F0'} />
      <LinearGradient
        colors={isDark ? ['#1c1c14', '#2d2d24'] : ['#FFFBEB', '#FEF3C7']}
        style={{ paddingTop: Math.max(insets.top, 20), paddingBottom: 30, paddingHorizontal: 24 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ width: 44 }} />
          <Text style={{ fontSize: 16, fontWeight: '900', letterSpacing: 1, color: textPrimary }}>PAYMENT</Text>
          <TouchableOpacity onPress={() => logout()} style={{ padding: 6 }}>
            <MaterialCommunityIcons name="logout" size={22} color={textSecondary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', marginTop: 12 }}>
          <View style={{
            backgroundColor: isDark ? '#2d2d24' : '#FFFFFF',
            borderRadius: 90, width: 120, height: 120,
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 4, borderColor: '#F59E0B',
          }}>
            <MaterialCommunityIcons name="lock-clock" size={52} color="#F59E0B" />
          </View>
          <Text style={{ fontSize: 24, fontWeight: '900', color: textPrimary, marginTop: 20, textAlign: 'center' }}>
            Welcome, {user?.name}!
          </Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: textSecondary, marginTop: 6, textAlign: 'center' }}>
            Your admission is pending payment.{'\n'}Pay now to activate your account and access the app.
          </Text>
        </View>

        <View style={{
          marginTop: 28, backgroundColor: isDark ? '#2d2d24' : '#FFFFFF',
          borderRadius: 24, padding: 20,
          borderWidth: 1, borderColor: isDark ? '#333' : '#E5E7EB',
          elevation: 4,
        }}>
          <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', color: textSecondary }}>
            Admission Fee
          </Text>
          {loading ? (
            <ActivityIndicator size="small" color="#F59E0B" style={{ marginVertical: 16 }} />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 6 }}>
              <Text style={{ fontSize: 40, fontWeight: '900', color: textPrimary }}>₹{amount.toLocaleString('en-IN')}</Text>
            </View>
          )}
          <View style={{ height: 1, backgroundColor: isDark ? '#333' : '#F3F4F6', marginVertical: 16 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: textSecondary }}>Student ID</Text>
            <Text style={{ fontSize: 12, fontWeight: '900', color: textPrimary }}>{user?.studentId || '---'}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: textSecondary }}>Branch</Text>
            <Text style={{ fontSize: 12, fontWeight: '900', color: textPrimary }}>{user?.branch?.name || '---'}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: textSecondary }}>Status</Text>
            <Text style={{ fontSize: 12, fontWeight: '900', color: '#F59E0B' }}>Pending Payment</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={onPay}
          activeOpacity={0.85}
          disabled={processing}
          style={{
            marginTop: 28, height: 60, borderRadius: 20, overflow: 'hidden',
            elevation: 8, shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12,
          }}
        >
          <LinearGradient
            colors={['#FBBF24', '#F59E0B']}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
          >
            {processing ? <ActivityIndicator color="#FFFFFF" /> : <MaterialCommunityIcons name="credit-card-check-outline" size={22} color="#FFFFFF" />}
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '900', marginLeft: 10, letterSpacing: 1 }}>
              {processing ? 'STARTING PAYMENT...' : `PAY ₹${amount.toLocaleString('en-IN')}`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={{ fontSize: 10, fontWeight: '600', color: textSecondary, textAlign: 'center', marginTop: 12 }}>
          {payMode === 'live'
            ? 'Secure payments powered by Razorpay'
            : 'DEMO PAYMENT — displaying how the live flow works. No real money moves.'}
        </Text>
      </ScrollView>

      <Modal
        visible={checkoutVisible && payMode === 'mock'}
        onRequestClose={() => !processing && setCheckoutVisible(false)}
        transparent
        animationType="slide"
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Math.max(insets.bottom, 20) }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: textPrimary, textAlign: 'center' }}>Razorpay Checkout</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: textSecondary, textAlign: 'center', marginTop: 4 }}>Admission Fee · {user?.name}</Text>
            <View style={{ alignItems: 'center', marginVertical: 20 }}>
              <Text style={{ fontSize: 38, fontWeight: '900', color: '#F59E0B' }}>₹{amount.toLocaleString('en-IN')}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#2d2d24' : '#F3F4F6', borderRadius: 14, padding: 14, marginBottom: 16 }}>
              <MaterialCommunityIcons name="credit-card" size={22} color="#F59E0B" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: textSecondary }}>Card / UPI / NetBanking</Text>
                <Text style={{ fontSize: 13, fontWeight: '900', color: textPrimary }}>•••• •••• •••• 4242</Text>
              </View>
              <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
            </View>
            <TouchableOpacity
              onPress={mockRazorpayCheckout}
              disabled={processing}
              style={{
                height: 56, borderRadius: 16, backgroundColor: '#3395FF',
                alignItems: 'center', justifyContent: 'center',
                flexDirection: 'row',
              }}
            >
              {processing ? <ActivityIndicator color="#fff" /> : <MaterialCommunityIcons name="lock" size={18} color="#fff" />}
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15, marginLeft: 8 }}>
                {processing ? 'Processing...' : `Pay ₹${amount.toLocaleString('en-IN')}`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { if (!processing) setCheckoutVisible(false); }} style={{ alignItems: 'center', paddingVertical: 12, marginTop: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: textSecondary }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={successVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{
            backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF', borderRadius: 28, padding: 32,
            alignItems: 'center', width: '100%',
          }}>
            <View style={{ backgroundColor: '#D1FAE5', borderRadius: 60, width: 90, height: 90, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="check-bold" size={44} color="#10B981" />
            </View>
            <Text style={{ fontSize: 22, fontWeight: '900', color: textPrimary, marginTop: 20 }}>Payment Successful!</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: textSecondary, marginTop: 8, textAlign: 'center' }}>
              ₹{amount.toLocaleString('en-IN')} received. Your admission is now complete.{'\n'}Your account has been activated.
            </Text>
            <TouchableOpacity
              onPress={onDone}
              style={{ marginTop: 24, height: 54, borderRadius: 16, backgroundColor: '#F59E0B', width: '100%', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>Start Exploring</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}