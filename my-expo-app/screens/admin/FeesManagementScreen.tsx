import React, { useState, useCallback, memo, useMemo, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  View, Text, ScrollView, Pressable, TextInput, Alert, Modal, 
  ActivityIndicator, FlatList, TouchableOpacity, Image, Platform,
  KeyboardAvoidingView, RefreshControl
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, FeeRecord } from '../../contexts/AuthContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import BranchFilter from '../../components/BranchFilter';
import api from '../../services/api';

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'N/A';
  try {
    // Check if it's YYYY-MM-DD format
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

// ─── CONSTANTS ───
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

// ─── MEMOIZED SUB-COMPONENTS ───

const MonthDropdown = memo(({ activeMonth, activeYear, onSelectMonth, onSelectYear }: any) => {
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
  
  return (
    <View className="mb-4">
      <View className="flex-row gap-3 px-6">
        {/* Month Picker */}
        <Pressable 
          onPress={() => setIsMonthOpen(true)}
          className={`flex-1 flex-row items-center justify-between px-5 py-4 rounded-3xl border bg-white border-gray-100`}
        >
          <Text className={`font-black uppercase tracking-widest text-gray-900`}>{activeMonth.name}</Text>
          <MaterialCommunityIcons name="chevron-down" size={22} color="#F59E0B" />
        </Pressable>

        {/* Year Picker */}
        <Pressable 
          onPress={() => setIsYearOpen(true)}
          className={`w-[130px] flex-row items-center justify-between px-5 py-4 rounded-3xl border bg-white border-gray-100`}
        >
          <Text className={`font-black tracking-widest text-gray-900`}>{activeYear.code}</Text>
          <MaterialCommunityIcons name="chevron-down" size={22} color="#F59E0B" />
        </Pressable>
      </View>

      {/* Month Selection Modal */}
      <Modal visible={isMonthOpen} transparent animationType="fade">
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={() => setIsMonthOpen(false)} 
          className="flex-1 bg-black/60 items-center justify-center px-6"
        >
          <View className="bg-white w-full rounded-[40px] p-8 shadow-2xl">
            <Text className="text-xl font-black text-gray-900 mb-6 text-center">Select Month 📅</Text>
            <View className="flex-row flex-wrap justify-between">
              {MONTH_DATA.map(m => (
                <Pressable 
                  key={m.code}
                  onPress={() => { onSelectMonth(m); setIsMonthOpen(false); }}
                  className={`w-[31%] py-5 rounded-2xl mb-3 items-center ${activeMonth.code === m.code ? 'bg-brand-pink' : 'bg-gray-50'}`}
                >
                  <Text className={`text-[11px] font-black uppercase ${activeMonth.code === m.code ? 'text-white' : 'text-gray-400'}`}>{m.name.substring(0,3)}</Text>
                </Pressable>
              ))}
            </View>
            <TouchableOpacity 
              onPress={() => setIsMonthOpen(false)}
              className="mt-4 py-4 rounded-3xl bg-gray-100 items-center"
            >
              <Text className="font-black text-gray-400 uppercase tracking-widest text-[10px]">Cancel Selection</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Year Selection Modal */}
      <Modal visible={isYearOpen} transparent animationType="fade">
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={() => setIsYearOpen(false)} 
          className="flex-1 bg-black/60 items-center justify-center px-6"
        >
          <View className="bg-white w-[300px] rounded-[40px] p-8 shadow-2xl items-center">
            <Text className="text-xl font-black text-gray-900 mb-6 text-center">Select Year 🔢</Text>
            <ScrollView className="w-full max-h-[350px] mb-4" showsVerticalScrollIndicator={false}>
              {YEAR_DATA.map(y => (
                <TouchableOpacity 
                  key={y.code}
                  onPress={() => { onSelectYear(y); setIsYearOpen(false); }}
                  className={`w-full py-4 rounded-2xl mb-3 items-center ${activeYear.code === y.code ? 'bg-brand-pink' : 'bg-gray-50'}`}
                >
                  <Text className={`font-black ${activeYear.code === y.code ? 'text-white' : 'text-gray-900'}`}>{y.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              onPress={() => setIsYearOpen(false)}
              className="w-full py-4 rounded-3xl bg-gray-100 items-center"
            >
              <Text className="font-black text-gray-400 uppercase tracking-widest text-[10px]">Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
});

const SummaryCard = memo(({ label, value, icon, color }: any) => (
  <View 
    className="bg-white border-gray-100 p-5 rounded-[22px] border flex-row items-center mr-4 min-w-[170px] shadow-xl"
  >
    <View style={{ backgroundColor: color }} className="w-12 h-12 rounded-[18px] items-center justify-center mr-4">
      <MaterialCommunityIcons name={icon} size={22} color="white" />
    </View>
    <View>
      <Text className="text-[8px] font-black tracking-widest leading-loose text-gray-500 uppercase">{label}</Text>
      <Text className="text-xl font-black tracking-tighter text-gray-900">{value}</Text>
    </View>
  </View>
));

const FeeEditorModal = memo(({ visible, onClose, item, onSave, students, structures }: any) => {
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
      <View className="flex-1 bg-white">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* ── Solid Background ── */}
            <View className="absolute top-0 left-0 right-0 h-[200px] bg-pink-50" />

            {/* Header */}
            <View style={{ paddingTop: Math.max(useSafeAreaInsets().top, 20) }} className="px-6 pb-6 flex-row items-center justify-between">
                <View className="flex-1">
                    <TouchableOpacity onPress={onClose} 
                        className="bg-white border-brand-pink/20 w-14 h-14 rounded-2xl items-center justify-center shadow-xl border mb-6"
                    >
                        <MaterialCommunityIcons name="close" size={28} color="#F59E0B" />
                    </TouchableOpacity>
                    <Text className="text-4xl font-black text-gray-900 tracking-tighter">
                        {item?.id === 'NEW' ? 'Fee' : 'Update'}
                    </Text>
                    <Text className="text-2xl font-black text-brand-pink mt-[-4px]">
                        {item?.id === 'NEW' ? 'Entry 🏛️' : 'Record 💎'}
                    </Text>
                </View>
                <View className="bg-brand-pink w-24 h-24 rounded-2xl items-center justify-center shadow-2xl border-4 border-white rotate-3 overflow-hidden">
                    <MaterialCommunityIcons name={item?.id === 'NEW' ? "cash-plus" : "file-edit-outline"} size={48} color="white" />
                </View>
            </View>

            <View className="px-6">
              {/* Student Selection */}
              <View className="mb-8">
                <Text className="text-[10px] font-black mb-4 uppercase tracking-[3px] text-gray-400 opacity-60">Student Detail</Text>
                <TouchableOpacity 
                  onPress={() => item?.id === 'NEW' && setShowStudentPicker(!showStudentPicker)} 
                  className={`p-6 rounded-[32px] border-2 flex-row justify-between items-center bg-gray-50 border-gray-100 ${item?.id !== 'NEW' ? 'opacity-60' : ''}`}
                >
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons name="account-search-outline" size={24} color="#F59E0B" style={{ marginRight: 15 }} />
                    <Text className={`font-black text-base ${sName ? 'text-gray-900' : 'text-gray-400'}`}>
                        {sName || 'Select Student Vendor'}
                    </Text>
                  </View>
                  {item?.id === 'NEW' && <MaterialCommunityIcons name="chevron-right" size={24} color="#F59E0B" />}
                </TouchableOpacity>

                {showStudentPicker && (
                  <View className="mt-4 rounded-[32px] border-2 p-4 bg-white border-brand-pink/10 max-h-[300px] shadow-2xl">
                    <TextInput 
                        className="p-5 font-bold text-base text-gray-900 bg-black/5 rounded-2xl mb-4" 
                        placeholder="Search student..." 
                        placeholderTextColor="#9CA3AF"
                        value={studentSearch} 
                        onChangeText={setStudentSearch} 
                    />
                    <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                        {filteredStudents?.map((s: any) => (
                      <TouchableOpacity 
                        key={s.id} 
                        className="p-5 rounded-2xl mb-2 border border-gray-100" 
                        onPress={() => { setSName(s.name); setSid(s.studentId || s.student_id); setShowStudentPicker(false); }}
                      >
                        <Text className="font-black text-gray-900">{s.name}</Text>
                        <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{s.studentId || s.student_id}</Text>
                      </TouchableOpacity>
                    ))}</ScrollView>
                  </View>
                )}
              </View>

              {/* Category and Date Row */}
              <View className="flex-row gap-5 mb-8">
                <View className="flex-1">
                    <Text className="text-[10px] font-black mb-4 uppercase tracking-[3px] text-gray-400 opacity-60">Category</Text>
                    <TouchableOpacity 
                      onPress={() => item?.id === 'NEW' && setShowTypePicker(!showTypePicker)} 
                      className={`p-6 rounded-[32px] border-2 flex-row justify-between items-center bg-gray-50 border-gray-100 ${item?.id !== 'NEW' ? 'opacity-60' : ''}`}
                    >
                      <Text className={`font-black uppercase text-[10px] tracking-widest ${selectedType ? 'text-gray-900' : 'text-gray-400'}`}>
                        {selectedType || 'Type'}
                      </Text>
                    </TouchableOpacity>
                    {showTypePicker && item?.id === 'NEW' && (
                      <View className="absolute top-24 left-0 right-0 bg-white border border-gray-100 rounded-[32px] shadow-2xl z-50 p-3">
                        <ScrollView className="max-h-[200px]" showsVerticalScrollIndicator={false}>
                          {structures.map((s: any) => (
                            <TouchableOpacity 
                                key={s.id} 
                              onPress={() => { 
                                  const cleanType = s.name.toLowerCase().includes('admission') ? 'Admission' : s.name;
                                  setSelectedType(cleanType); 
                                  setAmount(s.amount.toString()); 
                                  setShowTypePicker(false); 
                              }} 
                                className="p-5 rounded-2xl mb-1"
                            >
                              <Text className="font-black text-[11px] uppercase tracking-widest text-gray-600">{s.name}</Text>
                              <Text className="text-[10px] font-bold text-brand-pink mt-1">₹{s.amount}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                </View>
                <View className="flex-1">
                   <Text className="text-[10px] font-black mb-4 uppercase tracking-[3px] text-gray-400 opacity-60">Due Date</Text>
                    <TouchableOpacity onPress={() => setShowPicker(true)} className="p-6 rounded-[32px] border-2 bg-gray-50 border-gray-100 flex-row justify-between items-center">
                       <Text className="font-black text-[10px] tracking-widest text-gray-900">{formatDate(dueDate)}</Text>
                       <MaterialCommunityIcons name="calendar-clock" size={22} color="#F59E0B" />
                    </TouchableOpacity>
                   {showPicker && <DateTimePicker value={new Date(dueDate)} mode="date" display="default" onChange={(_: DateTimePickerEvent, d?: Date) => { setShowPicker(false); if(d) setDueDate(d.toISOString().split('T')[0]); }} />}
                </View>
              </View>

              {/* Amount Entry */}
              <View className="mb-12">
                <Text className="text-[10px] font-black mb-4 uppercase tracking-[3px] text-gray-400 opacity-60">Fee Amount</Text>
                <View className="flex-row items-center p-4 rounded-[40px] border-2 shadow-sm bg-white border-brand-pink/10">
                   <View className="bg-brand-pink w-20 h-20 rounded-[30px] items-center justify-center shadow-lg shadow-brand-pink/30">
                     <Text className="text-4xl font-black text-white">₹</Text>
                   </View>
                   <TextInput 
                        className="flex-1 ml-6 text-5xl font-black text-gray-900 tracking-tighter" 
                        value={amount} 
                        onChangeText={setAmount} 
                        keyboardType="numeric" 
                        placeholder="0.00"
                        placeholderTextColor="#FBCFE8"
                   />
                </View>
              </View>

              {/* Save Actions */}
              <View className="flex-row gap-5">
                 <TouchableOpacity 
                    onPress={handleSave} 
                    className="flex-1 bg-brand-pink p-8 rounded-[36px] items-center justify-center flex-row shadow-2xl shadow-brand-pink/40"
                 >
                    <MaterialCommunityIcons name="check-all" size={28} color="white" />
                    <Text className="text-white font-black uppercase tracking-[3px] text-lg ml-3">Authorize</Text>
                 </TouchableOpacity>
              </View>
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
      <TouchableOpacity activeOpacity={1} onPress={onClose} className="flex-1 bg-black/70 justify-center items-center px-4">
        <TouchableOpacity activeOpacity={1} className="bg-white rounded-[32px] w-full max-w-md border-4 border-brand-pink shadow-2xl overflow-hidden">
          {/* Header */}
          <View className="bg-brand-pink p-6">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1 flex-row items-center">
                <View className="bg-white w-12 h-12 rounded-full items-center justify-center mr-3">
                  <MaterialCommunityIcons name="school" size={24} color="#EC4899" />
                </View>
                <View>
                  <Text className="text-white text-xl font-black">TN HappyKids</Text>
                  <Text className="text-white/80 text-xs font-bold uppercase tracking-widest">{payment.branch?.name || 'Official'} Invoice</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} className="bg-white/20 w-10 h-10 rounded-full items-center justify-center">
                <MaterialCommunityIcons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="max-h-[500px] p-6" showsVerticalScrollIndicator={false}>
             <View className="mb-6">
                <View className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  <View className="flex-row justify-between mb-3">
                    <Text className="text-gray-500 text-xs font-black uppercase opacity-60">Invoice No</Text>
                    <Text className="text-gray-900 font-black">{invoiceNo}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-500 text-xs font-black uppercase opacity-60">Paid Date</Text>
                    <Text className="text-gray-900 font-black">{payment.paid_at ? formatDateLocal(payment.paid_at) : formatDateLocal(payment.date)}</Text>
                  </View>
                </View>
             </View>

             <View className="mb-6">
                <Text className="text-[10px] font-black uppercase tracking-[3px] text-gray-400 mb-3 ml-1 opacity-60">Student Details</Text>
                <View className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                   <View className="flex-row items-center">
                      <View className="bg-brand-yellow w-14 h-14 rounded-2xl items-center justify-center mr-4 border-2 border-white shadow-sm">
                         <MaterialCommunityIcons name="account-school" size={30} color="#92400E" />
                      </View>
                      <View className="flex-1">
                         <Text className="font-black text-lg tracking-tighter text-gray-900" numberOfLines={1}>{payment.student_name}</Text>
                         <Text className="text-xs text-gray-500 font-bold">ID: {student?.studentId || payment.student_id}</Text>
                      </View>
                   </View>
                </View>
             </View>

             <View className="mb-4">
                <Text className="text-sm text-gray-500 uppercase font-bold tracking-wider mb-2">Payer Information</Text>
                <View className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <View className="flex-row items-center mb-2">
                    <MaterialCommunityIcons name="account-tie" size={18} color="#3B82F6" />
                    <Text className="text-gray-500 text-xs font-bold ml-2">Payer Name:</Text>
                    <Text className="text-gray-900 font-bold ml-2">{(payment as any).parent_name || (payment as any).father_name || '---'}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons name="phone" size={18} color="#10B981" />
                    <Text className="text-gray-500 text-xs font-bold ml-2">Contact Phone:</Text>
                    <Text className="text-gray-500 ml-2 font-bold">{(payment as any).phone || '---'}</Text>
                  </View>
                </View>
             </View>

             <View className="mb-8">
                <Text className="text-[10px] font-black uppercase tracking-[3px] text-gray-400 mb-3 ml-1 opacity-60">Fee Information</Text>
                <View className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex-row items-center justify-between">
                  <View>
                    <Text className="font-black uppercase text-[11px] tracking-widest text-gray-400">{payment.type}</Text>
                    <Text className="font-black text-2xl text-gray-900 tracking-tighter mt-1">₹{payment.amount?.toLocaleString()}</Text>
                    <Text className="text-[10px] font-bold text-brand-pink mt-1 uppercase tracking-widest">
                       Due: {formatDateLocal(payment.due_date)}
                    </Text>
                  </View>
                  <View className="bg-green-500/20 px-4 py-2 rounded-xl">
                    <Text className="text-green-600 font-extrabold text-[10px] uppercase tracking-widest">Cleared</Text>
                  </View>
                </View>
             </View>

             <TouchableOpacity 
                onPress={() => onDownload(payment, 'download')}
                className="bg-brand-pink py-5 rounded-[22px] items-center justify-center flex-row shadow-xl shadow-brand-pink/30 mb-2"
             >
                <MaterialCommunityIcons name="file-pdf-box" size={24} color="white" />
                <Text className="text-white font-black uppercase tracking-[2px] ml-3">Generate Receipt</Text>
             </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
});

export default function FeesManagementScreen({ navigation }: any) {
  const { user, users, fees, transactions, refreshFees, addTransaction, updateTransaction, deleteTransaction, fetchData, updateUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

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
  const [branchFilterId, setBranchFilterId] = useState<string | null>(null);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentModal, setPaymentModal] = useState({ visible: false, item: null as FeeRecord | null });
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [payerName, setPayerName] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const isMasterAdmin = user?.role === 'master_admin';
  const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other'];

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
      
      const student = users.find(u => u.id?.toString() === item.student_id?.toString() || u.studentId === item.student_id);
      const resolvedItem = {
        ...item,
        student_id: student?.studentId || item.student_id,
        parent_name: student?.parentName || student?.fatherName || '',
        due_day: student?.fee_due_day || '05',
        phone: student?.phone || student?.fatherPhone || student?.motherPhone || ''
      };

      // Generate QR code SVG for in-app verification
      const deepLink = `tnhappykids://invoice/${item.id}`;
      let qrSvg: string | undefined;
      try {
        qrSvg = await QRCode.toString(deepLink, { type: 'svg', width: 6, margin: 1 });
      } catch (qrErr) {
        console.warn('QR generation failed:', qrErr);
      }
      
      // Load splash.png as base64 for PDF logo
      let logoBase64: string | undefined;
      try {
        const asset = Asset.fromModule(require('../../assets/splash.png'));
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
        
        // Requested format: StudentName_Date.pdf
        const sanitizedName = (item.student_name || 'Student').replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
        const fileName = `${sanitizedName}_${item.date}.pdf`;
        const newUri = `${FileSystem.cacheDirectory}${fileName}`;
        
        try {
          // Idempotent delete avoids need for getInfoAsync check
          await FileSystem.deleteAsync(newUri, { idempotent: true });
          await FileSystem.moveAsync({ from: uri, to: newUri });
        } catch (fileErr) {
          console.error('File operation error:', fileErr);
          // Fallback to original if renaming fails
          await Sharing.shareAsync(uri, { 
            UTI: 'com.adobe.pdf', 
            mimeType: 'application/pdf'
          });
          return;
        }
        
        // Share/Download
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

  const filteredFees = useMemo(() => {
    let list = [...fees];
    const sq = searchQuery.toLowerCase();

    const yCode = activeYear.code;
    const mCode = activeMonth.code;
    const monthPrefix = `${yCode}-${mCode}-`;

    let baseList: any[] = [];

    if (activeTab === 'manage') {
        const todayStr = new Date().toISOString().split('T')[0];

        // Build a map: student database id -> matching monthly fee from the API
        const feeByStudentDbId = new Map<string, any>();
        list.forEach(f => {
            const isAdmission = (f.type || '').toLowerCase().includes('admission');
            if (isAdmission) return;
            const isSelectedMonth = f.due_date ? f.due_date.includes(monthPrefix) : f.date.includes(monthPrefix);
            const isOverdue = f.status === 'unpaid' && f.due_date && f.due_date < todayStr;
            if (!isSelectedMonth && !isOverdue) return;

            const matchedStudent = users.find(u =>
                (u.role === 'student' || u.role === 'active') &&
                (u.id?.toString() === f.student_id?.toString() || u.studentId === f.student_id)
            );
            if (matchedStudent) {
                // Keep the FIRST (newest) fee per student; ignore older duplicates
                if (!feeByStudentDbId.has(matchedStudent.id)) {
                    feeByStudentDbId.set(matchedStudent.id, f);
                }
            }
        });

        // Now build the final list: one entry per active student (with fee > 0)
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
        baseList = list.filter(f => 
          (f.status || '').toLowerCase() === 'paid' || 
          f.date.includes(monthPrefix)
        );
    }

    if (sq) {
        baseList = baseList.filter(f => 
            (f.student_name || '').toLowerCase().includes(sq) || 
            (f.student_id || '').toLowerCase().includes(sq)
        );
    }

    const result = baseList.filter(f => {
      const student = users.find(u => u.id?.toString() === f.student_id?.toString() || u.studentId === f.student_id);
      if (!student || student.status !== 'active') return false;
      if (isMasterAdmin && branchFilterId && student.branch_id?.toString() !== branchFilterId) return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
    return result;
  }, [fees, activeTab, activeMonth, activeYear, searchQuery, students, users, isMasterAdmin, branchFilterId]);

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
        await api.post('/fees', payload);
      } else {
        await api.put(`/fees/${updatedItem.id}`, payload);
      }
      
      const student = users.find(u => u.id?.toString() === updatedItem.student_id?.toString() || u.studentId === updatedItem.student_id);
      
      await refreshFees();
      
      // SYNC: Update the student's profile fee_due_day if the due date was changed in this record
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
      
      // Automatically post to income ledger if marked as paid
      const today = new Date().toISOString().split('T')[0];
      const isAdmission = (updatedItem.type || '').toLowerCase().includes('admission');
      const txName = isAdmission 
        ? `Admission: ${updatedItem.student_name}` 
        : `Monthly Fee: ${updatedItem.student_name}`;
      const saveStudent = users.find(u => u.id?.toString() === updatedItem.student_id?.toString() || u.studentId === updatedItem.student_id);
      const saveBranchId = saveStudent?.branch_id;

      if (updatedItem.status === 'paid') {
        try {
          const existingTx = (transactions || []).find(t => 
            t.category === 'Fees' && 
            t.type === 'income' &&
            t.student_id === updatedItem.student_id?.toString() &&
            t.name === txName
          );

          if (existingTx) {
            await updateTransaction(existingTx.id, {
              amount: updatedItem.amount,
              name: txName,
              date: today,
              branch_id: saveBranchId
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
          const existingTx = (transactions || []).find(t => 
            t.category === 'Fees' && 
            t.type === 'income' &&
            t.student_id === updatedItem.student_id?.toString() &&
            t.name === txName
          );
          if (existingTx) {
            await deleteTransaction(existingTx.id);
          }
        } catch (txErr) {
          console.error('Failed to remove from income ledger:', txErr);
        }
      }

      setIsLocalLoading(false);
      setEditModal({ visible: false, item: null });
      // Small timeout to allow state to settle before alert
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
      // Unmarking paid -> unpaid: no payment details needed, just confirm
      Alert.alert('Mark as UNPAID?', `₹${(item.amount || 0).toLocaleString()} — ${item.student_name}`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => executeToggle(item, targetStatus, '', '', '') }
      ]);
      return;
    }
    // Marking as paid: show payment details form
    setPayerName(item.student_name || '');
    setPayerPhone('');
    setPaymentMethod('Cash');
    setPaymentModal({ visible: true, item });
  };

  const executeToggle = async (item: FeeRecord, targetStatus: string, payMethod?: string, payName?: string, payPhone?: string) => {
    try {
      setIsLocalLoading(true);

      if (item.id.toString().startsWith('VIRTUAL_')) {
        const matchedStudent = users.find(u =>
            u.id?.toString() === item.student_id?.toString() ||
            u.studentId === item.student_id
        );
        const realStudentId = matchedStudent?.id || item.student_id;
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
        });
      } else {
        await api.post(`/fees/${item.id}/toggle-status`, {
          payment_method: payMethod || null,
          payer_name: payName || null,
          payer_phone: payPhone || null,
        });
      }

      // Sync income/expense ledger
      const today = new Date().toISOString().split('T')[0];
      const txName = (item.type || '').toLowerCase().includes('admission')
        ? `Admission: ${item.student_name}`
        : `Monthly Fee: ${item.student_name}`;
      const feeStudent = users.find(u => u.id?.toString() === item.student_id?.toString() || u.studentId === item.student_id);
      const feeBranchId = feeStudent?.branch_id;

      if (targetStatus === 'paid') {
        const existingTx = (transactions || []).find(t =>
          t.category === 'Fees' && t.type === 'income' &&
          t.name === txName &&
          t.student_id === item.student_id?.toString()
        );
        if (existingTx) {
          await updateTransaction(existingTx.id, { amount: item.amount, name: txName, date: today, branch_id: feeBranchId });
        } else {
          await addTransaction({
            id: Date.now().toString(),
            name: txName,
            amount: item.amount,
            category: 'Fees',
            type: 'income',
            date: today,
            student_id: item.student_id?.toString(),
            branch_id: feeBranchId
          });
        }
      } else {
        const existingTx = (transactions || []).find(t =>
          t.category === 'Fees' && t.type === 'income' && t.name === txName && t.student_id === item.student_id?.toString()
        );
        if (existingTx) {
          await deleteTransaction(existingTx.id);
        }
      }

      // fetchData is already called inside addTransaction/updateTransaction/deleteTransaction, so only call refreshFees here
      await refreshFees();
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
    
    // Find directory ID if the record has database ID
    const student = users.find(u => u.id?.toString() === item.student_id?.toString() || u.studentId === item.student_id);
    const displayId = student?.studentId || item.student_id;

    return (
      <View 
        style={{
          borderColor: isOverdue ? '#FEE2E2' : '#E5E7EB',
        }}
        className={`mx-6 rounded-[24px] border-2 mb-5 overflow-hidden shadow-lg bg-white`}
      >
        <View className={`p-5 ${isOverdue ? 'bg-red-50' : ''}`}>
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center flex-1">
              <View 
                style={{ backgroundColor: isOverdue ? '#EF4444' : (item.status === 'paid' ? '#10B981' : '#EC4899') }} 
                className="w-14 h-14 rounded-[20px] items-center justify-center mr-4 shadow-lg"
              >
                <MaterialCommunityIcons name="account-school-outline" size={28} color="white" />
              </View>
              <View className="flex-1">
                <Text className="font-black text-lg tracking-tighter text-gray-900" numberOfLines={1}>{item.student_name}</Text>
                <View className="flex-row flex-wrap items-center mt-1 gap-x-3 gap-y-1">
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons name="badge-account" size={12} color="#6B7280" />
                    <Text className="text-[10px] font-black uppercase tracking-widest ml-1 text-gray-500">
                      {displayId}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons name="calendar-clock" size={12} color={isOverdue ? '#EF4444' : '#6B7280'} />
                    <Text className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                      {formatDate(item.due_date)}
                    </Text>
                  </View>
                  {item.status === 'paid' && item.paid_at && (
                    <View className="flex-row items-center">
                      <MaterialCommunityIcons name="check-circle" size={12} color="#10B981" />
                      <Text className="text-[10px] font-black uppercase tracking-widest ml-1 text-green-500">
                        {formatDate(item.paid_at || item.date)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View 
              style={{ backgroundColor: item.status === 'paid' ? '#10B981' : '#EF4444' }}
              className="px-4 py-2 rounded-[16px] shadow-md"
            >
              <Text className="text-[10px] font-black text-white uppercase tracking-widest">
                {item.status === 'paid' ? 'PAID' : 'UNPAID'}
              </Text>
            </View>
          </View>

          <View style={{ borderTopWidth: 1, borderTopColor: '#E5E7EB' }} className="pt-4 flex-row justify-between items-center">
            <View>
              <Text className="text-[9px] font-black uppercase tracking-[3px] mb-0.5 text-gray-500">{item.type}</Text>
              <Text className="font-black text-2xl tracking-tighter text-gray-900">₹{item.amount.toLocaleString()}</Text>
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity 
                onPress={() => toggleStatus(item as any)}
                className={`w-11 h-11 rounded-[14px] items-center justify-center shadow-md ${item.status === 'paid' ? 'bg-red-500' : 'bg-green-500'}`}
              >
                <MaterialCommunityIcons name={item.status === 'paid' ? 'close' : 'check'} size={20} color="white" />
              </TouchableOpacity>
              {item.status === 'paid' && (
                <>
                  <TouchableOpacity 
                    onPress={() => handleInvoiceAction(item as any, 'view')} 
                    className="w-11 h-11 rounded-[14px] bg-white border border-gray-200 items-center justify-center shadow-md"
                  >
                    <MaterialCommunityIcons name="eye-outline" size={20} color="#EC4899" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handleInvoiceAction(item as any, 'download')} 
                    className="w-11 h-11 rounded-[14px] bg-indigo-500 items-center justify-center shadow-md shadow-indigo-500/30"
                  >
                    <MaterialCommunityIcons name="file-download-outline" size={20} color="white" />
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
    <View style={{ backgroundColor: '#FFFFFF' }}>

      {/* Header */}
      <View style={{ paddingTop: Math.max(insets.top, 20) }} className="px-6 pb-6">
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => navigation.goBack()} 
            className="w-12 h-12 rounded-[14px] bg-gray-100 items-center justify-center">
            <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
          </TouchableOpacity>
          {isMasterAdmin && (
            <BranchFilter selectedBranchId={branchFilterId} onSelect={setBranchFilterId} />
          )}
          <TouchableOpacity
            onPress={() => setSearchModalVisible(true)}
            className="w-12 h-12 rounded-[14px] bg-gray-50 items-center justify-center"
          >
            <MaterialCommunityIcons name="magnify" size={22} color="#111827" />
          </TouchableOpacity>
        </View>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[9px] font-black uppercase tracking-[4px] text-gray-500">School Finance</Text>
            <Text className="text-4xl font-black tracking-tighter mt-1 text-gray-900">Treasury</Text>
            <Text className="text-xl font-black text-pink-500 mt-[-4px]">Department ✓</Text>
          </View>
          <View style={{ backgroundColor: '#EC4899' }} className="w-24 h-24 rounded-[24px] items-center justify-center border-4 border-white shadow-xl">
            <MaterialCommunityIcons name="cash-multiple" size={44} color="white" />
          </View>
        </View>
      </View>

      {/* Summary Cards */}
      <View className="px-6 mb-6">
        <View className="flex-row items-center justify-between mb-4 px-1">
            <Text className="text-[9px] font-black uppercase tracking-[3px] text-gray-500">Financial Health</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="overflow-visible">
          <SummaryCard label="COLLECTED" value={`₹${stats.paid.toLocaleString()}`} icon="check-decagram-outline" color="#10B981" />
          <SummaryCard label="OVERDUE" value={`₹${stats.overdue.toLocaleString()}`} icon="clock-alert-outline" color="#EF4444" />
          <SummaryCard label="PENDING" value={`₹${stats.pending.toLocaleString()}`} icon="alert-circle-outline" color="#F59E0B" />
          <SummaryCard label="TOTAL RECORDS" value={stats.count} icon="file-document-outline" color="#3B82F6" />
        </ScrollView>
      </View>




      {/* Category Selection Dropdown */}
      <View className="px-6 mb-6 mt-2">
        <Text className="text-[9px] font-black uppercase tracking-[3px] mb-4 text-gray-500">Operational Ledger</Text>
        <TouchableOpacity 
          onPress={() => setIsTypeDropdownOpen(true)}
          activeOpacity={0.9}
          className="bg-white border-gray-100 p-5 rounded-[22px] border-2 shadow-xl flex-row items-center justify-between"
        >
          <View className="flex-row items-center">
            <View 
              style={{ backgroundColor: '#EC4899' }} 
              className="w-12 h-12 rounded-[16px] items-center justify-center mr-4 shadow-lg"
            >
              <MaterialCommunityIcons 
                name={activeTab === 'manage' ? 'calendar-month' : (activeTab === 'admission' ? 'account-plus' : 'history')} 
                size={22} 
                color="white" 
              />
            </View>
            <View>
              <Text className="text-[8px] font-black uppercase tracking-widest text-gray-500">Current View</Text>
              <Text className="text-lg font-black tracking-tighter text-gray-900">
                {activeTab === 'manage' ? 'Monthly Dues' : (activeTab === 'admission' ? 'Admissions' : 'Transaction Log')}
              </Text>
            </View>
          </View>
          <View style={{ backgroundColor: '#F3F4F6' }} className="w-10 h-10 rounded-[14px] items-center justify-center">
            <MaterialCommunityIcons name="chevron-down" size={22} color="#6B7280" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Action Line & Month Filter Dropdown */}
      <View className="px-6 mb-4">
        <View className="flex-row justify-between items-center mb-4 px-1">
            <Text className="text-[9px] font-black uppercase tracking-[4px] text-gray-500">{activeTab.toUpperCase()} LEDGER</Text>
            {activeTab === 'admission' && (
              <TouchableOpacity 
                  onPress={() => setEditModal({ visible: true, item: { id: 'NEW', student_id: '', student_name: '', amount: 0, type: activeTab === 'admission' ? 'Admission' : 'Monthly Fee', status: 'unpaid', date: new Date().toISOString().split('T')[0], due_date: new Date().toISOString().split('T')[0] } as any })}
                  className="bg-brand-pink w-11 h-11 rounded-[16px] items-center justify-center shadow-lg"
              >
                  <MaterialCommunityIcons name="plus" size={24} color="white" />
              </TouchableOpacity>
            )}
        </View>
        {(activeTab === 'manage' || activeTab === 'history') && (
            <MonthDropdown activeMonth={activeMonth} activeYear={activeYear} onSelectMonth={setActiveMonth} onSelectYear={setActiveYear} />
        )}
      </View>
    </View>
  ), [activeTab, activeMonth, activeYear, stats, isTypeDropdownOpen, insets]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <FlatList
        data={activeTab === 'list' ? [] : filteredFees}
        keyExtractor={(item) => item.id}
        renderItem={renderFeeItem}
        ListHeaderComponent={ListHeader}
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
            <View className="px-6">
                {feeStructures.map(f => (
                    <View key={f.id} className="p-6 rounded-[32px] border mb-4 bg-white border-gray-100">
                        <Text className="font-black text-lg text-gray-900">{f.name}</Text>
                        <Text className="text-brand-pink font-black text-2xl">₹{f.amount}</Text>
                    </View>
                ))}
            </View>
        ) : (
            <View className="px-6 py-20 items-center">
                <Text className="text-gray-400 font-bold">No records found</Text>
            </View>
        )}
        initialNumToRender={10}
        windowSize={5}
        ListFooterComponent={<View className="h-32" />}
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
        student={users.find(u => u.id?.toString() === selectedInvoice?.student_id?.toString() || u.studentId === selectedInvoice?.student_id)}
        onDownload={handleInvoiceAction}
      />
      
      {/* ── Search Modal ── */}
      <Modal visible={searchModalVisible} transparent animationType="fade" onRequestClose={() => setSearchModalVisible(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setSearchModalVisible(false)} className="flex-1 bg-black/60 items-center justify-center px-6">
          <TouchableOpacity activeOpacity={1} style={{ backgroundColor: '#FFFFFF' }} className="w-full rounded-[32px] p-6 shadow-2xl">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-lg font-black text-gray-900">Search Records</Text>
              <TouchableOpacity onPress={() => setSearchModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={{ backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }} className="flex-row items-center border-2 rounded-[20px] px-5 py-4 mb-4">
              <MaterialCommunityIcons name="magnify" size={20} color="#6B7280" />
              <TextInput
                placeholder="Search by name or ID..."
                placeholderTextColor="#9CA3AF"
                className="ml-3 flex-1 text-base font-bold text-gray-900"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>
            <Text className="text-[10px] font-bold text-gray-500 text-center">
              Results update as you type
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {isTypeDropdownOpen && (
        <Modal visible={isTypeDropdownOpen} transparent animationType="fade">
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={() => setIsTypeDropdownOpen(false)} 
            className="flex-1 bg-black/60 items-center justify-center px-6"
          >
            <View className="bg-white w-full rounded-[40px] p-8 shadow-2xl">
              <Text className="text-xl font-black text-gray-900 mb-6 text-center">Choose Ledger Category</Text>
              
              {[
                { id: 'manage', label: 'Monthly Fees', icon: 'calendar-month' },
                { id: 'admission', label: 'Admission Fees', icon: 'account-plus' },
                { id: 'history', label: 'Transaction History', icon: 'history' }
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => { setActiveTab(opt.id); setIsTypeDropdownOpen(false); }}
                  className={`flex-row items-center p-5 rounded-[24px] mb-3 ${activeTab === opt.id ? 'bg-brand-pink shadow-lg shadow-brand-pink/30' : 'bg-gray-50'}`}
                >
                  <View className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${activeTab === opt.id ? 'bg-white/20' : 'bg-brand-pink/10'}`}>
                    <MaterialCommunityIcons name={opt.icon as any} size={22} color={activeTab === opt.id ? 'white' : '#F59E0B'} />
                  </View>
                  <Text className={`font-black text-base ${activeTab === opt.id ? 'text-white' : 'text-gray-900'}`}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity 
                onPress={() => setIsTypeDropdownOpen(false)}
                className="mt-4 py-4 rounded-3xl bg-gray-100 items-center"
              >
                <Text className="font-black text-gray-500 uppercase tracking-widest text-[10px]">Cancel Selection</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* ── Payment Details Modal ── */}
      <Modal visible={paymentModal.visible} transparent animationType="fade" onRequestClose={() => setPaymentModal({ visible: false, item: null })}>
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View style={{ backgroundColor: '#FFFFFF' }} className="w-full rounded-[32px] p-6 shadow-2xl">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-lg font-black text-gray-900">Payment Details</Text>
              <TouchableOpacity onPress={() => setPaymentModal({ visible: false, item: null })}>
                <MaterialCommunityIcons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-[10px] font-black uppercase tracking-widest mb-2 text-gray-500">Payment Method</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {PAYMENT_METHODS.map(m => (
                <TouchableOpacity key={m} onPress={() => setPaymentMethod(m)}
                  className={`px-5 py-3 rounded-[16px] mr-3 ${paymentMethod === m ? 'bg-green-500' : 'bg-gray-100'}`}>
                  <Text className={`font-black text-[12px] ${paymentMethod === m ? 'text-white' : 'text-gray-700'}`}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text className="text-[10px] font-black uppercase tracking-widest mb-2 text-gray-500">Payer Name</Text>
            <TextInput
              style={{ backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }}
              className="border-2 rounded-[20px] px-5 py-4 mb-4 text-base font-bold"
              placeholderTextColor="#9CA3AF"
              placeholder="Enter payer name"
              value={payerName}
              onChangeText={setPayerName}
            />

            <Text className="text-[10px] font-black uppercase tracking-widest mb-2 text-gray-500">Phone Number</Text>
            <TextInput
              style={{ backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }}
              className="border-2 rounded-[20px] px-5 py-4 mb-6 text-base font-bold"
              placeholderTextColor="#9CA3AF"
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              value={payerPhone}
              onChangeText={setPayerPhone}
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setPaymentModal({ visible: false, item: null })}
                style={{ backgroundColor: '#F3F4F6' }}
                className="flex-1 py-4 rounded-[20px] items-center"
              >
                <Text className="font-black text-sm text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const item = paymentModal.item;
                  setPaymentModal({ visible: false, item: null });
                  if (item) executeToggle(item, 'paid', paymentMethod, payerName, payerPhone);
                }}
                className="flex-1 py-4 rounded-[20px] items-center bg-green-500"
              >
                <Text className="font-black text-sm text-white">Confirm Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {(isLocalLoading || isProcessingPdf) && (
          <View className="absolute inset-0 bg-black/40 flex items-center justify-center z-50">
             <ActivityIndicator color="#F59E0B" size="large" />
             <Text className="text-white font-black mt-4 uppercase tracking-[3px] text-[10px]">Processing Finance Document...</Text>
          </View>
      )}
    </View>
  );
}
