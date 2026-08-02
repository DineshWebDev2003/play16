import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, Alert, Modal, Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const AMBER = ['#F59E0B', '#D97706'] as [string, string];
const AMBER_DARK = ['#92400E', '#78350F'] as [string, string];
const EMERALD = ['#10B981', '#059669'] as [string, string];
const EMERALD_DARK = ['#064e3b', '#022c22'] as [string, string];
const VIOLET = ['#8B5CF6', '#7C3AED'] as [string, string];
const VIOLET_DARK = ['#5b21b6', '#2e1065'] as [string, string];
const BLUE = ['#3B82F6', '#2563EB'] as [string, string];
const BLUE_DARK = ['#1e40af', '#1e1b4b'] as [string, string];

export default function MyFeesScreen({ navigation }: any) {
  const { user, fees, feeStructures, refreshFees, fetchData } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    refreshFees();
    fetchData();
  }, []);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([refreshFees(), fetchData()]);
    setIsRefreshing(false);
  }, []);

  const myFeesList = useMemo(() => {
    if (!user) return [];
    const dbId = user.id?.toString();
    const schoolId = user.studentId?.toString();
    return fees.filter(f =>
      (f.student_id?.toString() === dbId || f.student_id?.toString() === schoolId)
    );
  }, [user, fees]);

  const studentFinancials = useMemo(() => {
    if (!user) return { paid: 0, pending: 0 };
    const paidSum = myFeesList
      .filter(f => f.status === 'paid')
      .reduce((sum, f) => sum + (f.amount || 0), 0);
    const pendingSum = myFeesList
      .filter(f => f.status === 'unpaid')
      .reduce((sum, f) => sum + (f.amount || 0), 0);
    return { paid: paidSum, pending: pendingSum };
  }, [myFeesList]);

  const generateInvoiceHtml = (feeRecord: any) => `
    <html>
      <head>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #1F2937; line-height: 1.5; }
          .header { text-align: center; margin-bottom: 50px; }
          .logo { background: #F59E0B; color: white; width: 60px; height: 60px; border-radius: 15px; display: inline-flex; align-items: center; justify-content: center; font-weight: 900; font-size: 24px; margin-bottom: 10px; }
          .title { font-size: 28px; font-weight: 900; color: #111827; letter-spacing: -1px; }
          .subtitle { color: #F59E0B; font-weight: 700; text-transform: uppercase; font-size: 12px; letter-spacing: 2px; }
          .receipt-box { border: 2px solid #F3F4F6; border-radius: 24px; padding: 30px; margin-top: 30px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
          .row { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px dashed #E5E7EB; padding-bottom: 10px; }
          .label { font-size: 10px; font-weight: 900; color: #9CA3AF; text-transform: uppercase; letter-spacing: 1px; }
          .value { font-size: 14px; font-weight: 700; color: #1F2937; }
          .amount-box { background: #FDF2F8; border: 1px solid #FBCFE8; padding: 20px; border-radius: 20px; text-align: center; margin-top: 40px; }
          .paid-stamp { border: 3px solid #10B981; color: #10B981; display: inline-block; padding: 5px 20px; border-radius: 10px; font-weight: 900; transform: rotate(-10deg); position: absolute; top: 100px; right: 80px; font-size: 24px; opacity: 0.5; }
          .footer { margin-top: 80px; text-align: center; font-size: 10px; color: #9CA3AF; border-top: 1px solid #F3F4F6; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="paid-stamp">PAID</div>
        <div class="header">
          <div class="logo">H</div>
          <div class="title">TN HAPPYKIDS</div>
          <div class="subtitle">${user?.branch?.name || 'School'} — Official Fee Receipt</div>
        </div>
        <div class="receipt-box">
          <div class="row"><span class="label">Date</span><span class="value">${feeRecord.date}</span></div>
          <div class="row"><span class="label">Student</span><span class="value">${user?.name}</span></div>
          <div class="row"><span class="label">Payment For</span><span class="value">${feeRecord.type || feeRecord.student_name || 'School Fee'}</span></div>
        </div>
        <div class="amount-box">
            <div class="amount-value" style="font-size: 32px; font-weight: 900; color: #F59E0B;">₹${(Number(feeRecord.amount) || 0).toLocaleString()}</div>
        </div>
        <div class="footer">Issued on ${new Date().toLocaleDateString()}</div>
      </body>
    </html>
  `;

  const paidFeeRecords = useMemo(() =>
    myFeesList.filter(f => f.status === 'paid')
      .sort((a, b) => b.date.localeCompare(a.date)),
    [myFeesList]
  );

  const handleDownload = async (feeRecord: any) => {
    try {
      setPdfLoading(true);
      const html = generateInvoiceHtml(feeRecord);
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (e) {
      Alert.alert('Error', 'Failed to generate invoice.');
    } finally {
      setPdfLoading(false);
    }
  };

  const studentFeeStructures = feeStructures.filter(fs => fs.category === user?.category);

  const renderDashboard = () => (
    <View style={{ paddingHorizontal: 24 }}>
      <View style={{ paddingVertical: 4 }}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {}}
          style={{ borderRadius: 16, overflow: 'hidden', elevation: 15 }}
        >
          <LinearGradient
            colors={studentFinancials.pending > 0 ? (isDark ? AMBER_DARK : AMBER) : (isDark ? EMERALD_DARK : EMERALD)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 12 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                  <MaterialCommunityIcons name="wallet-outline" size={18} color="white" />
                </View>
                <View>
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: -0.5 }}>Global Balance</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 1 }}>Student Wallet</Text>
                </View>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 }}>
                <Text style={{ color: 'white', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>
                  {studentFinancials.pending > 0 ? 'Pending' : 'Clear'}
                </Text>
              </View>
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {[
                  { label: 'Pending', value: `₹${studentFinancials.pending.toLocaleString('en-IN')}`, icon: 'clock-alert-outline', color: '#FDE68A' },
                  { label: 'Paid', value: `₹${studentFinancials.paid.toLocaleString('en-IN')}`, icon: 'check-decagram', color: '#6EE7B7' },
                  { label: 'Due Day', value: `Day ${user?.fee_due_day || '5'}`, icon: 'calendar-clock', color: '#93C5FD' },
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

      <View style={{ paddingVertical: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 4 }}>
          <Text style={{ fontSize: 20, fontWeight: '900', letterSpacing: -0.5, color: isDark ? '#FFFFFF' : '#111827' }}>Fee Architecture 🏗️</Text>
          <View style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)' }}>
            <Text style={{ color: '#8B5CF6', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Structure</Text>
          </View>
        </View>

        {studentFeeStructures.length > 0 ? (
          studentFeeStructures.map((fs, idx) => (
            <View
              key={idx}
              style={{
                backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF',
                borderRadius: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                borderWidth: 1, borderColor: isDark ? '#262626' : '#F3F4F6', elevation: 4, padding: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <MaterialCommunityIcons name="layers-triple-outline" size={20} color="#6366F1" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: isDark ? '#FFFFFF' : '#111827' }} numberOfLines={1}>{fs.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <View style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100 }}>
                      <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: '#6366F1' }}>{fs.frequency}</Text>
                    </View>
                  </View>
                </View>
              </View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#FFFFFF' : '#111827' }}>₹{fs.amount.toLocaleString()}</Text>
            </View>
          ))
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 40, opacity: 0.5 }}>
            <MaterialCommunityIcons name="layers-triple-outline" size={56} color={isDark ? '#4B5563' : '#9CA3AF'} />
            <Text style={{ fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 12 }}>
              No fee structure configured
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderHistory = () => (
    <View style={{ paddingHorizontal: 24 }}>
      {paidFeeRecords.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 100, opacity: 0.5 }}>
          <MaterialCommunityIcons name="history" size={72} color={isDark ? '#4B5563' : '#9CA3AF'} />
          <Text style={{ fontWeight: '900', fontSize: 14, textTransform: 'uppercase', letterSpacing: 2, color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 16 }}>
            No Payment History
          </Text>
          <Text style={{ fontSize: 12, color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 8, fontWeight: '600' }}>
            Your paid fee records will appear here
          </Text>
        </View>
      ) : (
        paidFeeRecords.map((fee, idx) => (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.95}
            onPress={() => handleDownload(fee)}
            style={{
              backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF',
              borderRadius: 16, marginBottom: 12, overflow: 'hidden',
              borderWidth: 1, borderColor: isDark ? '#262626' : '#F3F4F6', elevation: 4,
            }}
          >
            <LinearGradient
              colors={isDark ? EMERALD_DARK : EMERALD}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 16 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <MaterialCommunityIcons name="hand-coin-outline" size={22} color="white" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: 'white', fontSize: 15, fontWeight: '900' }} numberOfLines={1}>{fee.type || 'School Fee'}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '700', marginTop: 3, textTransform: 'uppercase', letterSpacing: 1 }}>{fee.date}</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: 'white', fontSize: 20, fontWeight: '900' }}>₹{(Number(fee.amount) || 0).toLocaleString()}</Text>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100, marginTop: 4, flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="download" size={10} color="white" />
                    <Text style={{ color: 'white', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 4 }}>Receipt</Text>
                  </View>
                </View>
              </View>
              <View style={{ position: 'absolute', bottom: -12, right: -12, opacity: 0.1 }}>
                <MaterialCommunityIcons name="receipt" size={80} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFFFFF' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <View />
        }
      >
        <View style={{ paddingTop: Math.max(insets.top, 50), paddingHorizontal: 24, paddingBottom: 24 }}>
          {/* ── Modern Header ── */}
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
              <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100, marginTop: 12, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.1)' }}>
                <Text style={{ color: '#F59E0B', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>
                  {activeTab === 'dashboard' ? 'Wallet Dashboard' : 'Payment History'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('profile')}
              style={{ backgroundColor: '#FDE047', width: 80, height: 80, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FFFFFF', transform: [{ rotate: '3deg' }], overflow: 'hidden' }}
            >
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <MaterialCommunityIcons name="bank" size={36} color="#92400E" />
              )}
              <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: '#7C3AED', padding: 4, borderRadius: 10, borderWidth: 2, borderColor: '#FFFFFF' }}>
                <MaterialCommunityIcons name="lock-outline" size={12} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Tab Switch ── */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            {([
              { key: 'dashboard' as const, label: 'Wallets', icon: 'wallet-outline' },
              { key: 'history' as const, label: 'History', icon: 'history' },
            ]).map(tab => (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.9}
                onPress={() => setActiveTab(tab.key)}
                style={{
                  flex: 1, backgroundColor: activeTab === tab.key ? '#F59E0B' : (isDark ? '#1e1e1e' : '#F3F4F6'),
                  borderRadius: 14, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
                  borderWidth: 1, borderColor: activeTab === tab.key ? '#F59E0B' : (isDark ? '#262626' : '#E5E7EB'),
                  elevation: activeTab === tab.key ? 4 : 0,
                }}
              >
                <MaterialCommunityIcons name={tab.icon as any} size={18} color={activeTab === tab.key ? 'white' : (isDark ? '#9CA3AF' : '#6B7280')} />
                <Text style={{ fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: activeTab === tab.key ? 'white' : (isDark ? '#9CA3AF' : '#6B7280'), marginLeft: 6 }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {activeTab === 'dashboard' ? renderDashboard() : renderHistory()}
        <View style={{ height: 128 }} />
      </ScrollView>

      {pdfLoading && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <View style={{ backgroundColor: isDark ? '#1a1a18' : '#FFFFFF', padding: 40, borderRadius: 40, alignItems: 'center', elevation: 24 }}>
            <ActivityIndicator color="#F59E0B" size="large" />
            <Text style={{ color: isDark ? '#FFFFFF' : '#111827', fontWeight: '900', marginTop: 24, textTransform: 'uppercase', letterSpacing: 4, fontSize: 10 }}>
              Encrypting Invoice...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
