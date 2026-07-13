import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, Alert, Modal, Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function MyFeesScreen({ navigation }: any) {
  const { user, transactions, fees, feeStructures, refreshFees, fetchData } = useAuth();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh data when this screen mounts
  useEffect(() => {
    refreshFees();
    fetchData();
  }, []);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([refreshFees(), fetchData()]);
    setIsRefreshing(false);
  }, []);

  const studentTransactions = useMemo(() => {
    if (!user) return [];
    const dbId = user.id?.toString();
    const schoolId = user.studentId?.toString();

    return transactions
      .filter(t => 
        (t.student_id?.toString() === dbId || t.name.includes(user.name)) && 
        t.category === 'Fees' &&
        t.type === 'income'
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, user]);

  const studentFinancials = useMemo(() => {
    if (!user) return { paid: 0, pending: 0 };
    
    const dbId = user.id?.toString();
    const schoolId = user.studentId?.toString();
    
    // Aggregate all fee records from DB
    const myFeesList = fees.filter(f => 
      (f.student_id?.toString() === dbId || f.student_id?.toString() === schoolId)
    );
    
    // Source of Truth for "Paid": Sum of all fee transactions
    const paidSum = studentTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      
    // Source of Truth for "Pending": Sum of all unpaid fee records
    const pendingSum = myFeesList
      .filter(f => f.status === 'unpaid')
      .reduce((sum, f) => sum + (f.amount || 0), 0);
      
    return { paid: paidSum, pending: pendingSum };
  }, [user, fees, studentTransactions]);

  const generateInvoiceHtml = (tx: any) => `
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
          <div class="title">CHITHODE HAPPYKIDS</div>
          <div class="subtitle">Official Fee Receipt</div>
        </div>
        <div class="receipt-box">
          <div class="row"><span class="label">Date</span><span class="value">${tx.date}</span></div>
          <div class="row"><span class="label">Student</span><span class="value">${user?.name}</span></div>
          <div class="row"><span class="label">Payment For</span><span class="value">${tx.name}</span></div>
        </div>
        <div class="amount-box">
            <div class="amount-value" style="font-size: 32px; font-weight: 900; color: #F59E0B;">₹${tx.amount.toLocaleString()}</div>
        </div>
        <div class="footer">Issued on ${new Date().toLocaleDateString()}</div>
      </body>
    </html>
  `;

  const handleDownload = async (tx: any) => {
    try {
      setPdfLoading(true);
      const html = generateInvoiceHtml(tx);
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (e) {
      Alert.alert('Error', 'Failed to generate invoice.');
    } finally {
      setPdfLoading(false);
    }
  };

  const renderDashboard = () => (
    <View className="px-6">
      <View className="mb-8 bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm">
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">GLOBAL BALANCE</Text>
            <Text className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">₹{studentFinancials.pending.toLocaleString()}</Text>
          </View>
          <View className="w-14 h-14 rounded-2xl bg-amber-500 items-center justify-center">
            <MaterialCommunityIcons name="wallet-outline" size={28} color="white" />
          </View>
        </View>

        <View className="flex-row gap-3 pt-5 border-t border-gray-100 dark:border-gray-700">
          <View className="flex-1 bg-emerald-50 dark:bg-emerald-900/30 p-4 rounded-2xl items-center">
            <MaterialCommunityIcons name="check-decagram" size={20} color="#10B981" />
            <Text className="text-emerald-600 dark:text-emerald-400 font-bold text-lg mt-1">₹{studentFinancials.paid.toLocaleString()}</Text>
            <Text className="text-[8px] font-bold text-emerald-600/60 dark:text-emerald-400/60 uppercase tracking-widest mt-1">TOTAL PAID</Text>
          </View>
          <View className="flex-1 bg-amber-50 dark:bg-amber-900/30 p-4 rounded-2xl items-center">
            <MaterialCommunityIcons name="calendar-clock" size={20} color="#F59E0B" />
            <Text className="text-amber-600 dark:text-amber-400 font-bold text-lg mt-1">Day {user?.fee_due_day || '5'}</Text>
            <Text className="text-[8px] font-bold text-amber-600/60 dark:text-amber-400/60 uppercase tracking-widest mt-1">DUE DATE</Text>
          </View>
        </View>
      </View>

      <View className="mb-6">
        <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4 px-1">Fee Architecture</Text>
        {feeStructures
          .filter(fs => fs.category === user?.category)
          .map((fs, idx) => (
            <View 
              key={idx}
              className="bg-white dark:bg-gray-800 p-5 rounded-2xl mb-3 flex-row items-center justify-between shadow-sm"
            >
              <View className="flex-row items-center">
                <View className="bg-indigo-100 dark:bg-indigo-900/40 w-10 h-10 rounded-xl items-center justify-center mr-3">
                  <MaterialCommunityIcons name="layers-triple-outline" size={20} color="#6366F1" />
                </View>
                <View>
                  <Text className="font-bold text-gray-900 dark:text-white text-sm">{fs.name}</Text>
                  <Text className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">{fs.frequency}</Text>
                </View>
              </View>
              <Text className="font-bold text-gray-900 dark:text-white text-lg">₹{fs.amount.toLocaleString()}</Text>
            </View>
          ))}
      </View>
    </View>
  );

  const renderHistory = () => (
    <View className="px-6">
      {studentTransactions.length === 0 ? (
        <View className="items-center py-24">
          <MaterialCommunityIcons name="history" size={64} color="#D1D5DB" />
          <Text className="font-bold text-gray-400 tracking-widest mt-4 text-xs text-center uppercase">No Transaction Logs</Text>
          <Text className="text-gray-300 text-xs mt-2">Payments you make will appear here</Text>
        </View>
      ) : (
        studentTransactions.map((tx, idx) => (
          <TouchableOpacity 
            key={idx}
            activeOpacity={0.95}
            onPress={() => handleDownload(tx)}
            className="bg-white dark:bg-gray-800 p-5 mb-4 rounded-2xl shadow-sm"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="bg-emerald-500 w-12 h-12 rounded-xl items-center justify-center mr-4">
                  <MaterialCommunityIcons name="hand-coin-outline" size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-gray-900 dark:text-white text-base" numberOfLines={1}>{tx.name}</Text>
                  <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{tx.date}</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="font-bold text-xl text-emerald-600 dark:text-emerald-400">+ ₹{tx.amount.toLocaleString()}</Text>
                <View className="bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-lg mt-1">
                  <Text className="text-[8px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">PAID</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-1">
        <View style={{ paddingTop: Math.max(insets.top, 20) }} className="px-6 pb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl items-center justify-center mb-4"
              >
                <MaterialCommunityIcons name="arrow-left" size={22} color="#374151" />
              </TouchableOpacity>
              <Text className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Finance</Text>
              <Text className="text-lg font-bold text-amber-500 mt-[-2px]">Dashboard</Text>
            </View>
            <View className="bg-amber-500 w-16 h-16 rounded-2xl items-center justify-center">
               <MaterialCommunityIcons name="bank" size={32} color="white" />
            </View>
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="flex-row gap-3 mb-6 px-6">
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => setActiveTab('dashboard')}
              className={`flex-1 py-4 rounded-2xl items-center justify-center ${activeTab === 'dashboard' ? 'bg-amber-500' : 'bg-gray-100 dark:bg-gray-800'}`}
            >
              <Text className={`font-bold text-xs uppercase tracking-widest ${activeTab === 'dashboard' ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>WALLETS</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => setActiveTab('history')}
              className={`flex-1 py-4 rounded-2xl items-center justify-center ${activeTab === 'history' ? 'bg-amber-500' : 'bg-gray-100 dark:bg-gray-800'}`}
            >
              <Text className={`font-bold text-xs uppercase tracking-widest ${activeTab === 'history' ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>HISTORY</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'dashboard' ? renderDashboard() : renderHistory()}
          <View className="h-32" />
        </ScrollView>
      </View>

      {pdfLoading && (
        <View className="absolute inset-0 bg-black/60 items-center justify-center z-50">
           <View className="bg-white dark:bg-[#1a1a18] p-10 rounded-[40px] items-center shadow-2xl">
              <ActivityIndicator color="#F59E0B" size="large" />
              <Text className="text-gray-900 dark:text-white font-black mt-6 uppercase tracking-[4px] text-[10px]">Encrypting Invoice...</Text>
           </View>
        </View>
      )}
    </View>
  );
}
