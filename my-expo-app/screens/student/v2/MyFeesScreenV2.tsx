import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions, Image, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
}

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const ACCENT = '#F59E0B';
const BORDER_RADIUS = 28;

const AMBER = ['#F59E0B', '#D97706'] as [string, string];
const EMERALD = ['#10B981', '#059669'] as [string, string];

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

export default function MyFeesScreenV2({ navigation }: Props) {
  const { user, fees, feeStructures, refreshFees, fetchData } = useAuth();
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
        <View style={{ borderRadius: BORDER_RADIUS, overflow: 'hidden' }}>
          <LinearGradient
            colors={studentFinancials.pending > 0 ? AMBER : EMERALD}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 16 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Image source={require('../../../assets/icons/wallet.png')} style={{ width: 24, height: 24 }} resizeMode="contain" />
                </View>
                <View>
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '800', letterSpacing: -0.5 }}>Global Balance</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 2 }}>Student Wallet</Text>
                </View>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100 }}>
                <Text style={{ color: 'white', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {studentFinancials.pending > 0 ? 'Pending' : 'Clear'}
                </Text>
              </View>
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {[
                  { label: 'Pending', value: `₹${studentFinancials.pending.toLocaleString('en-IN')}`, icon: 'clock-alert-outline', color: '#FDE68A' },
                  { label: 'Paid', value: `₹${studentFinancials.paid.toLocaleString('en-IN')}`, icon: 'check-decagram', color: '#6EE7B7' },
                  { label: 'Due Day', value: `Day ${user?.fee_due_day || '5'}`, icon: 'calendar-clock', color: '#93C5FD' },
                ].map((item, i) => (
                  <View key={item.label} style={{ alignItems: 'center', flex: 1, borderRightWidth: i < 2 ? 1 : 0, borderRightColor: 'rgba(255,255,255,0.14)' }}>
                    <MaterialCommunityIcons name={item.icon as any} size={20} color="#FFFFFF" style={{ marginBottom: 4 }} />
                    <Text style={{ color: 'white', fontSize: 15, fontWeight: '900' }} numberOfLines={1}>{item.value}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
              <MaterialCommunityIcons name="safe-square-outline" size={90} color="white" />
            </View>
          </LinearGradient>
        </View>
      </View>

      <View style={{ paddingVertical: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 4 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', letterSpacing: -0.3, color: TEXT_PRIMARY }}>Fee Architecture 🏗️</Text>
          <View style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)' }}>
            <Text style={{ color: '#8B5CF6', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Structure</Text>
          </View>
        </View>

        {studentFeeStructures.length > 0 ? (
          studentFeeStructures.map((fs, idx) => (
            <View
              key={idx}
              style={{
                backgroundColor: 'rgba(255,255,255,0.92)',
                borderRadius: 22, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', padding: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <MaterialCommunityIcons name="layers-triple-outline" size={20} color="#6366F1" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: TEXT_PRIMARY }} numberOfLines={1}>{fs.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <View style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100 }}>
                      <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: '#6366F1' }}>{fs.frequency}</Text>
                    </View>
                  </View>
                </View>
              </View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: TEXT_PRIMARY }}>₹{fs.amount.toLocaleString()}</Text>
            </View>
          ))
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 40, opacity: 0.5 }}>
            <MaterialCommunityIcons name="layers-triple-outline" size={56} color={TEXT_MUTED} />
            <Text style={{ fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, color: TEXT_MUTED, marginTop: 12 }}>
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
          <MaterialCommunityIcons name="history" size={72} color={TEXT_MUTED} />
          <Text style={{ fontWeight: '900', fontSize: 14, textTransform: 'uppercase', letterSpacing: 2, color: TEXT_MUTED, marginTop: 16 }}>
            No Payment History
          </Text>
          <Text style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 8, fontWeight: '600' }}>
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
              borderRadius: 22, marginBottom: 12, overflow: 'hidden',
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
            }}
          >
            <LinearGradient
              colors={EMERALD}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 16 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <MaterialCommunityIcons name="hand-coin-outline" size={22} color="white" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: 'white', fontSize: 15, fontWeight: '800' }} numberOfLines={1}>{fee.type || 'School Fee'}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 9, fontWeight: '700', marginTop: 3, textTransform: 'uppercase', letterSpacing: 1 }}>{fee.date}</Text>
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
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#F59E0B" colors={['#F59E0B']} />}
      >
        <View style={{ paddingTop: Math.max(insets.top, 20), paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                backgroundColor: 'rgba(255,255,255,0.92)',
                width: 50, height: 50, borderRadius: 16,
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={TEXT_PRIMARY} />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('profile')}
              style={{
                width: 52, height: 52, borderRadius: 26,
                backgroundColor: 'rgba(255,255,255,0.92)',
                borderWidth: 2, borderColor: '#FFFFFF',
                shadowColor: '#000000', shadowOpacity: 0.1, shadowRadius: 14,
                shadowOffset: { width: 0, height: 6 }, elevation: 8,
                alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              }}
            >
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <MaterialCommunityIcons name="bank" size={24} color="#92400E" />
              )}
              <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: '#7C3AED', padding: 4, borderRadius: 10, borderWidth: 2, borderColor: '#FFFFFF' }}>
                <MaterialCommunityIcons name="lock-outline" size={10} color="white" />
              </View>
            </TouchableOpacity>
          </View>
          <View>
            <Text style={{ fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, color: TEXT_MUTED }}>
              TN HAPPYKIDS
            </Text>
            <Text style={{ fontSize: 26, fontWeight: '700', letterSpacing: -0.5, marginTop: 2, color: TEXT_PRIMARY }}>
              Finance
            </Text>
            <Text style={{ color: '#DB2777', fontSize: 14, fontWeight: '800', marginTop: 2 }}>
              {activeTab === 'dashboard' ? 'Student Wallet' : 'Payment Records'}
            </Text>
          </View>

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
                  flex: 1, backgroundColor: activeTab === tab.key ? ACCENT : 'rgba(255,255,255,0.92)',
                  borderRadius: 16, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
                  borderWidth: 1, borderColor: activeTab === tab.key ? ACCENT : 'rgba(255,255,255,0.6)',
                }}
              >
                <MaterialCommunityIcons name={tab.icon as any} size={18} color={activeTab === tab.key ? 'white' : TEXT_MUTED} />
                <Text style={{ fontWeight: '800', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: activeTab === tab.key ? 'white' : TEXT_MUTED, marginLeft: 6 }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ paddingTop: 20 }}>
          {activeTab === 'dashboard' ? renderDashboard() : renderHistory()}
        </View>
      </ScrollView>

      {pdfLoading && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <View style={{ backgroundColor: '#FFFFFF', padding: 40, borderRadius: 40, alignItems: 'center', elevation: 24 }}>
            <ActivityIndicator color="#F59E0B" size="large" />
            <Text style={{ color: TEXT_PRIMARY, fontWeight: '900', marginTop: 24, textTransform: 'uppercase', letterSpacing: 4, fontSize: 10 }}>
              Encrypting Invoice...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
