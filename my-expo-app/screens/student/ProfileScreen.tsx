import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform, Image, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, User } from '../../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface ProfileScreenProps {
  navigation: NavigationProps;
  route?: { params?: { studentId?: string } };
}

// ─── Custom Date Picker Modal ──────────────────────────────────────────────────
function DatePickerModal({ visible, initialValue, onConfirm, onClose, title }: any) {
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');

  useEffect(() => {
    if (visible) {
      const parts = initialValue ? initialValue.split('-') : ['', '', ''];
      setYear(parts[0] || '');
      setMonth(parts[1] || '');
      setDay(parts[2] || '');
    }
  }, [visible, initialValue]);

  const save = () => {
    if (day && month && year) {
      onConfirm(`${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`);
      onClose();
    } else {
      Alert.alert('Oops!', 'Please fill Day, Month, and Year! 🎈');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/60 items-center justify-center p-6">
        <View className="bg-white dark:bg-gray-800 w-full rounded-3xl p-6 shadow-lg">
          <Text className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">{title}</Text>
          <Text className="text-xs text-gray-400 mb-6 font-bold">Enter details below to update date</Text>
          
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1">
              <Text className="text-[10px] font-black uppercase text-gray-400 mb-2 ml-1">Day</Text>
              <TextInput className="h-14 bg-gray-50 dark:bg-gray-700 rounded-xl text-center text-lg font-bold text-gray-900 dark:text-white"
                placeholder="DD" keyboardType="numeric" maxLength={2} value={day} onChangeText={setDay} placeholderTextColor="#9CA3AF" />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-black uppercase text-gray-400 mb-2 ml-1">Month</Text>
              <TextInput className="h-14 bg-gray-50 dark:bg-gray-700 rounded-xl text-center text-lg font-bold text-gray-900 dark:text-white"
                placeholder="MM" keyboardType="numeric" maxLength={2} value={month} onChangeText={setMonth} placeholderTextColor="#9CA3AF" />
            </View>
            <View className="flex-[1.5]">
              <Text className="text-[10px] font-black uppercase text-gray-400 mb-2 ml-1">Year</Text>
              <TextInput className="h-14 bg-gray-50 dark:bg-gray-700 rounded-xl text-center text-lg font-bold text-gray-900 dark:text-white"
                placeholder="YYYY" keyboardType="numeric" maxLength={4} value={year} onChangeText={setYear} placeholderTextColor="#9CA3AF" />
            </View>
          </View>

          <TouchableOpacity onPress={save} className="bg-amber-500 py-4 rounded-2xl items-center active:scale-95">
            <Text className="text-white font-bold text-base">Save Selection</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} className="mt-3 py-3 items-center">
            <Text className="text-gray-400 font-bold uppercase tracking-widest text-[11px]">Nevermind, Keep Old</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function ProfileScreen({ navigation, route }: ProfileScreenProps) {
  const { user, users, updateProfile, updateUser, fees: allFees } = useAuth();
  
  const scrollRef = useRef<ScrollView>(null);
  const studentId = route?.params?.studentId;
  const targetUser = studentId ? users.find(u => u.id === studentId) : user;

  // ── Unified Financial Status Logic ──
  const financialSummary = React.useMemo(() => {
    if (!targetUser || targetUser.role !== 'student') return null;
    
    const dbId = targetUser.id?.toString();
    const schoolId = targetUser.studentId?.toString();
    const todayStr = new Date().toISOString().split('T')[0];
    const monthYearCode = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    const myFeesList = allFees.filter(f => (f.student_id?.toString() === dbId || f.student_id?.toString() === schoolId));
    const unpaidFees = myFeesList.filter(f => f.status === 'unpaid');
    const currentMonthPaid = myFeesList.find(f => f.date?.includes(monthYearCode) && f.status === 'paid');
    const currentMonthBilled = myFeesList.find(f => f.date?.includes(monthYearCode));

    let isOverdue = unpaidFees.some(f => f.due_date && f.due_date < todayStr);
    if (!isOverdue && !currentMonthPaid && !currentMonthBilled) {
      const dueDayNum = parseInt(targetUser.fee_due_day || '5');
      if (new Date().getDate() > dueDayNum) isOverdue = true;
    }

    const isPending = unpaidFees.length > 0 || (!currentMonthPaid && (targetUser.fees && parseInt(targetUser.fees) > 0));
    
    const dbUnpaidAmount = unpaidFees.reduce((sum, f) => sum + (f.amount || 0), 0);
    let extra = 0;
    if (!currentMonthBilled && targetUser.fees && parseInt(targetUser.fees) > 0) {
       extra = parseInt(targetUser.fees);
    }
    const totalAmount = dbUnpaidAmount + extra;

    return {
      status: isOverdue ? 'overdue' : (isPending ? 'pending' : 'paid'),
      total: totalAmount,
      title: isOverdue ? 'Balance Overdue' : (isPending ? 'Fees Pending' : 'Financials Secure')
    };
  }, [targetUser, allFees]);

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [showBloodGroupPicker, setShowBloodGroupPicker] = useState(false);

  const bloodGroups = ['A+ve', 'A-ve', 'B+ve', 'B-ve', 'O+ve', 'O-ve', 'AB+ve', 'AB-ve'];

  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [fatherPhone, setFatherPhone] = useState('');
  const [motherName, setMotherName] = useState('');
  const [motherPhone, setMotherPhone] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [address, setAddress] = useState('');
  const [fees, setFees] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [admissionDate, setAdmissionDate] = useState('');
  const [avatar, setAvatar] = useState('');
  const [fatherPhoto, setFatherPhoto] = useState('');
  const [motherPhoto, setMotherPhoto] = useState('');
  const [guardianPhoto, setGuardianPhoto] = useState('');
  
  const [newPassword, setNewPassword] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // Date Picker Modal State
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState<'dob' | 'admission'>('dob');

  // Sync state when targetUser changes
  useEffect(() => {
    if (targetUser) {
      setName(targetUser.name || '');
      setFatherName(targetUser.fatherName || '');
      setFatherPhone(targetUser.fatherPhone || '');
      setMotherName(targetUser.motherName || '');
      setMotherPhone(targetUser.motherPhone || '');
      setGuardianName(targetUser.parentName || '');
      setGuardianPhone(targetUser.guardianPhone || '');
      setBloodGroup(targetUser.bloodGroup || '');
      setAddress(targetUser.address || '');
      setFees(targetUser.fees || '');
      setAdmissionDate(targetUser.admissionDate || '');
      setDateOfBirth(targetUser.date_of_birth || '');
      setAvatar(targetUser.avatar || '');
      setFatherPhoto(targetUser.fatherPhoto || '');
      setMotherPhoto(targetUser.motherPhoto || '');
      setGuardianPhoto(targetUser.guardianPhoto || '');
    }
  }, [targetUser]);

  // If redirected for specific student, start in edit mode
  useEffect(() => {
    if (studentId) {
      setIsEditing(true);
    }
  }, [studentId]);

  const handleUpdate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    const updatedData: Partial<User> = {
      name,
      fatherName,
      fatherPhone,
      motherName,
      motherPhone,
      parentName: guardianName,
      guardianPhone,
      bloodGroup,
      address,
      fees,
      admissionDate: admissionDate || null,
      date_of_birth: dateOfBirth || null,
      avatar,
      fatherPhoto,
      motherPhoto,
      guardianPhoto,
    };

    const success = studentId 
      ? await updateUser(studentId, updatedData) 
      : await updateProfile(updatedData);
    
    if (success) {
      Alert.alert('Success', studentId ? 'Student record updated! ✨' : 'Profile updated! ✨');
      setIsEditing(false);
      setCurrentStep(1);
      if (studentId) {
        navigation.goBack();
      }
    }
  };

  const renderInputField = (label: string, value: string, setValue: (val: string) => void, icon: string, placeholder: string, multiline: boolean = false) => (
    <View className="mb-5">
      <Text className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 ml-1">{label}</Text>
      <View className={`flex-row items-center bg-gray-50 dark:bg-gray-700 rounded-2xl px-4 ${multiline ? 'items-start py-4' : ''}`}>
        <MaterialCommunityIcons name={icon as any} size={20} color="#9CA3AF" style={multiline ? { marginTop: 4 } : {}} />
        <TextInput
          className={`flex-1 ${multiline ? 'h-24 pt-1' : 'h-14'} ml-3 font-bold text-gray-900 dark:text-white`}
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          editable={isEditing}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
    </View>
  );

  const pickImage = async (setter: (uri: string) => void) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload photos! 📸');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setter(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const renderPhotoCard = (title: string, photoUri?: string, setter?: (uri: string) => void) => (
    <View className="items-center mr-6">
      <Text className="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500 mb-3 ml-1 tracking-widest">{title}</Text>
      <TouchableOpacity 
        activeOpacity={0.9}
        className="relative"
        onPress={() => isEditing && setter && pickImage(setter)}
      >
        <View className="w-28 h-28 rounded-3xl bg-gray-100 dark:bg-gray-700 overflow-hidden shadow-md">
          {photoUri ? (
            <Image 
              source={{ uri: photoUri }} 
              className="w-full h-full" 
              resizeMode="cover" 
            />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <MaterialCommunityIcons 
                name="account-circle-outline" 
                size={40} 
                color="#D1D5DB" 
              />
              <Text className="text-[9px] font-bold uppercase mt-1 text-gray-400 dark:text-gray-500">
                Upload
              </Text>
            </View>
          )}
        </View>
        
        {isEditing && (
          <View className="absolute -bottom-1 -right-1 bg-amber-500 w-8 h-8 rounded-xl items-center justify-center shadow-md">
            <MaterialCommunityIcons name="camera-flip-outline" size={16} color="white" />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderProgressBar = () => (
    <View className="flex-row items-center justify-center mb-8">
      {[1, 2, 3].map((step) => (
        <React.Fragment key={step}>
          <View className={`w-9 h-9 rounded-full items-center justify-center ${
            currentStep === step ? 'bg-amber-500' : 
            currentStep > step ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
          }`}>
            {currentStep > step ? (
              <MaterialCommunityIcons name="check" size={18} color="white" />
            ) : (
              <Text className={`font-bold ${currentStep === step ? 'text-white' : 'text-gray-400'}`}>{step}</Text>
            )}
          </View>
          {step < 3 && (
            <View className={`w-10 h-1 mx-2 rounded-full ${
              currentStep > step ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
            }`} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const renderDetailItem = (label: string, value: string | undefined, icon: string) => (
    <View className="flex-row items-center mb-3 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl">
      <View className="bg-amber-100 dark:bg-amber-900/40 p-3 rounded-xl mr-4">
        <MaterialCommunityIcons name={icon as any} size={20} color="#D97706" />
      </View>
      <View className="flex-1">
        <Text className="text-[9px] font-bold uppercase text-gray-400 dark:text-gray-500 mb-0.5 tracking-widest">{label}</Text>
        <Text className="text-base font-bold text-gray-900 dark:text-white">{value || 'Not provided'}</Text>
      </View>
    </View>
  );

  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView ref={scrollRef} className="flex-1" showsVerticalScrollIndicator={false}>
          <View style={{ paddingTop: Math.max(insets.top, 20) }} className="px-6 pb-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <TouchableOpacity 
                  onPress={() => navigation.goBack()} 
                  className="mb-4 bg-gray-100 dark:bg-gray-800 w-10 h-10 rounded-xl items-center justify-center"
                >
                  <MaterialCommunityIcons name="arrow-left" size={22} color="#374151" />
                </TouchableOpacity>
                <Text className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{studentId ? 'Edit' : 'My'}</Text>
                <Text className="text-lg font-bold text-amber-500 tracking-tight">{studentId ? 'Record' : 'Profile'}</Text>
              </View>
              <View className="bg-amber-100 dark:bg-gray-800 w-14 h-14 rounded-2xl items-center justify-center">
                <MaterialCommunityIcons name={studentId ? "account-edit-outline" : "card-account-details-outline"} size={28} color="#D97706" />
              </View>
            </View>
          </View>

          <View className="px-6 mt-2">
            {isEditing && renderProgressBar()}

            <View className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm mb-6">
              
              {!isEditing ? (
                <View>
                   <View className="items-center mb-6">
                      {renderPhotoCard('Student Account', avatar)}
                       <Text className="text-2xl font-bold text-gray-900 dark:text-white mt-4 tracking-tight">{targetUser?.name}</Text>
                       <View className="bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full mt-2 flex-row items-center">
                         <View className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2" />
                         <Text className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-widest">Verified Record</Text>
                       </View>
                    </View>

                    {financialSummary && (
                       <View className="mb-8 bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-5">
                          <View className="flex-row items-center justify-between">
                             <View>
                                <Text className={`text-[9px] font-bold uppercase tracking-widest ${financialSummary.status === 'overdue' ? 'text-red-600' : (financialSummary.status === 'pending' ? 'text-amber-600' : 'text-emerald-600')}`}>
                                  {financialSummary.title}
                                </Text>
                                <Text className="text-xl font-bold text-gray-900 dark:text-white tracking-tight mt-1">
                                  ₹{financialSummary.total.toLocaleString()}
                                </Text>
                             </View>
                             <View className={`w-12 h-12 rounded-xl items-center justify-center ${financialSummary.status === 'overdue' ? 'bg-red-500' : (financialSummary.status === 'pending' ? 'bg-amber-500' : 'bg-emerald-500')}`}>
                                <MaterialCommunityIcons 
                                  name={financialSummary.status === 'overdue' ? 'cash-remove' : (financialSummary.status === 'pending' ? 'cash-clock' : 'cash-check')} 
                                  size={24} 
                                  color="white" 
                                />
                             </View>
                          </View>
                       </View>
                    )}

                    {targetUser?.role === 'student' && (
                     <View className="mb-8">
                       <Text className="text-sm font-bold text-gray-900 dark:text-white mb-4">Identity Records</Text>
                      {renderDetailItem('Date of Birth', targetUser?.date_of_birth, 'calendar-heart')}
                      {renderDetailItem('Blood Group', targetUser?.bloodGroup, 'water')}
                      {renderDetailItem('Contact Number', targetUser?.phone, 'phone')}
                      {renderDetailItem('Home Address', targetUser?.address, 'map-marker')}
                    </View>
                    )}

                    {targetUser?.role === 'student' && (
                     <View className="mb-6 pt-5 border-t border-gray-100 dark:border-gray-700">
                       <Text className="text-sm font-bold text-gray-900 dark:text-white mb-4">Family & Guardian</Text>
                      {renderDetailItem("Father's Name", targetUser?.fatherName, 'account-tie')}
                      {renderDetailItem("Father's Contact", targetUser?.fatherPhone, 'phone')}
                      {renderDetailItem("Mother's Name", targetUser?.motherName, 'face-woman')}
                      {renderDetailItem("Mother's Contact", targetUser?.motherPhone, 'phone')}
                      {renderDetailItem("Guardian Name", targetUser?.parentName, 'account-group')}
                      {renderDetailItem("Guardian Contact", targetUser?.guardianPhone, 'phone-check')}
                    </View>
                    )}

                   {targetUser?.role === 'student' && (
                    <TouchableOpacity 
                     onPress={() => setIsEditing(true)}
                     className="bg-amber-500 py-4 rounded-2xl items-center active:scale-95 mt-4"
                    >
                      <View className="flex-row items-center">
                        <MaterialCommunityIcons name="pencil-box-multiple-outline" size={18} color="white" />
                        <Text className="text-white font-bold text-base ml-2">Edit Full Student Profile</Text>
                      </View>
                    </TouchableOpacity>
                   )}
                </View>
              ) : targetUser?.role === 'student' ? (
                <View>
                   {currentStep === 1 && (
                     <View>
                       <Text className="text-amber-500 font-bold text-base mb-6 uppercase tracking-wider">Step 1: Personal Info</Text>
                       <View className="items-center mb-6">
                         {renderPhotoCard('Account Profile', avatar, setAvatar)}
                       </View>
                       {renderInputField('Student Name', name, setName, 'account', 'Full Name')}
                       
                       <View className="mb-5">
                         <Text className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 ml-1">Date of Birth</Text>
                         <TouchableOpacity 
                           disabled={!isEditing}
                           onPress={() => { setPickerType('dob'); setPickerVisible(true); }}
                           className="flex-row items-center bg-gray-50 dark:bg-gray-700 rounded-2xl px-4 h-14"
                         >
                           <MaterialCommunityIcons name="cake" size={20} color="#9CA3AF" />
                           <Text className={`flex-1 ml-3 font-bold ${dateOfBirth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                             {dateOfBirth || 'Select Birthday'}
                           </Text>
                           <MaterialCommunityIcons name="calendar-edit" size={20} color="#9CA3AF" />
                         </TouchableOpacity>
                       </View>
                       
                       <View className="mb-5">
                         <Text className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 ml-1">Blood Group</Text>
                         <TouchableOpacity 
                           onPress={() => setShowBloodGroupPicker(true)}
                           className="flex-row items-center bg-gray-50 dark:bg-gray-700 rounded-2xl px-4 h-14"
                         >
                           <MaterialCommunityIcons name="water" size={20} color="#EF4444" />
                           <Text className={`flex-1 ml-3 font-bold ${bloodGroup ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                             {bloodGroup || 'Select Blood Group'}
                           </Text>
                           <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
                         </TouchableOpacity>
                       </View>

                       {user?.role === 'admin' && (
                         <View className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-4">
                           <Text className="text-gray-400 font-bold text-[10px] uppercase mb-5 tracking-widest">Admin Controls</Text>
                            <View className="mb-5">
                              <Text className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 ml-1">Admission Date</Text>
                              <TouchableOpacity 
                                disabled={!isEditing}
                                onPress={() => { setPickerType('admission'); setPickerVisible(true); }}
                                className="flex-row items-center bg-gray-50 dark:bg-gray-700 rounded-2xl px-4 h-14"
                              >
                                <MaterialCommunityIcons name="calendar" size={20} color="#9CA3AF" />
                                <Text className={`flex-1 ml-3 font-bold ${admissionDate ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                                  {admissionDate || 'Select Date'}
                                </Text>
                                <MaterialCommunityIcons name="calendar-edit" size={20} color="#9CA3AF" />
                              </TouchableOpacity>
                            </View>
                           {renderInputField('Monthly Fees', fees, setFees, 'cash', 'e.g. 15000')}
                         </View>
                       )}
                     </View>
                   )}

                   {currentStep === 2 && (
                     <View>
                       <Text className="text-amber-500 font-bold text-base mb-6 uppercase tracking-wider">Step 2: Family Info</Text>

                       <View className="mb-10 pt-4 border-t border-gray-100 dark:border-gray-700">
                         <Text className="text-gray-400 font-bold text-[10px] uppercase mb-5 tracking-widest">Father Information</Text>
                         <View className="mb-6 items-center flex-row bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl">
                           {renderPhotoCard('Father Photo', fatherPhoto, setFatherPhoto)}
                           <View className="flex-1 ml-4 pr-2">
                             <Text className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-tight">Verification Required</Text>
                             <Text className="text-xs text-gray-900 dark:text-white font-bold leading-tight">Please upload a clear portrait for the student's records.</Text>
                           </View>
                         </View>
                         {renderInputField("Father's Name", fatherName, setFatherName, 'account-tie', 'Father Name')}
                         {renderInputField("Father's Phone", fatherPhone, setFatherPhone, 'phone', 'Father Number')}
                       </View>

                       <View className="mb-10 pt-4 border-t border-gray-100 dark:border-gray-700">
                         <Text className="text-gray-400 font-bold text-[10px] uppercase mb-5 tracking-widest">Mother Information</Text>
                         <View className="mb-6 items-center flex-row bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl">
                           {renderPhotoCard('Mother Photo', motherPhoto, setMotherPhoto)}
                           <View className="flex-1 ml-4 pr-2">
                             <Text className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-tight">Identity Photo</Text>
                             <Text className="text-xs text-gray-900 dark:text-white font-bold leading-tight">Clear facial photo preferred for security verification.</Text>
                           </View>
                         </View>
                         {renderInputField("Mother's Name", motherName, setMotherName, 'face-woman', 'Mother Name')}
                         {renderInputField("Mother's Phone", motherPhone, setMotherPhone, 'phone', 'Mother Number')}
                       </View>

                       <View className="mb-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                         <Text className="text-gray-400 font-bold text-[10px] uppercase mb-5 tracking-widest">Guardian Information</Text>
                         <View className="mb-6 items-center flex-row bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl">
                           {renderPhotoCard('Guardian Photo', guardianPhoto, setGuardianPhoto)}
                           <View className="flex-1 ml-4 pr-2">
                             <Text className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-tight">Optional Record</Text>
                             <Text className="text-xs text-gray-900 dark:text-white font-bold leading-tight">Required if primary parents are not reachable.</Text>
                           </View>
                         </View>
                         {renderInputField('Guardian Name', guardianName, setGuardianName, 'account-group', 'Guardian Name')}
                         {renderInputField('Guardian Phone', guardianPhone, setGuardianPhone, 'phone', 'Guardian Number')}
                       </View>
                     </View>
                   )}

                   {currentStep === 3 && (
                     <View>
                       <Text className="text-amber-500 font-bold text-base mb-6 uppercase tracking-wider">Step 3: Contact & Security</Text>
                       {renderInputField('Residential Address', address, setAddress, 'map-marker', 'Full Address', true)}
                       {!studentId && (
                         <View className="mt-4">
                           <Text className="text-amber-500 font-bold text-base mb-6 uppercase tracking-wider">Account Security</Text>
                           {renderInputField('New Password', newPassword, setNewPassword, 'key-outline', 'Enter new password')}
                         </View>
                       )}
                       {studentId && (
                          <View className="mt-4 py-6 items-center bg-amber-50 dark:bg-amber-900/20 rounded-2xl">
                            <MaterialCommunityIcons name="shield-check" size={40} color="#D97706" />
                            <Text className="text-amber-800 dark:text-amber-300 font-bold text-center mt-3">Professional Record Management</Text>
                            <Text className="text-amber-700 dark:text-amber-400 text-xs text-center px-6 mt-1">Changes are synced with the central student database instantly.</Text>
                          </View>
                       )}
                     </View>
                   )}

                   <View className="flex-row gap-3 mt-6">
                     {currentStep > 1 ? (
                       <TouchableOpacity 
                         onPress={() => setCurrentStep(prev => prev - 1)}
                         className="flex-1 bg-gray-200 dark:bg-gray-700 py-4 rounded-2xl items-center"
                       >
                         <Text className="text-gray-600 dark:text-gray-300 font-bold text-base">Back</Text>
                       </TouchableOpacity>
                     ) : (
                       <TouchableOpacity 
                        onPress={() => {
                          if (studentId) {
                            navigation.goBack();
                          } else {
                            setIsEditing(false);
                            setCurrentStep(1);
                          }
                        }}
                        className="flex-1 bg-gray-200 dark:bg-gray-700 py-4 rounded-2xl items-center"
                      >
                        <Text className="text-gray-600 dark:text-gray-300 font-bold text-base">Cancel</Text>
                      </TouchableOpacity>
                     )}

                     {currentStep < totalSteps ? (
                       <TouchableOpacity 
                         onPress={() => {
                           setCurrentStep(prev => prev + 1);
                           scrollRef.current?.scrollTo({ y: 0, animated: true });
                         }}
                         className="flex-1 bg-amber-500 py-4 rounded-2xl items-center active:scale-95"
                       >
                         <Text className="text-white font-bold text-base">Next</Text>
                       </TouchableOpacity>
                     ) : (
                       <TouchableOpacity 
                         onPress={handleUpdate}
                         className="flex-1 bg-emerald-500 py-4 rounded-2xl items-center active:scale-95"
                       >
                         <Text className="text-white font-bold text-base">Finish</Text>
                       </TouchableOpacity>
                     )}
                    </View>
                 </View>
               ) : (
                 <View className="p-4 items-center">
                   <MaterialCommunityIcons name="account-lock" size={40} color="#9CA3AF" />
                   <Text className="text-gray-400 font-bold text-center mt-4">Student profile editing is not available for this account.</Text>
                 </View>
               )}
             </View>

          </View>
          <View className="h-32" />
        </ScrollView>
      </KeyboardAvoidingView>

      <DatePickerModal 
        visible={pickerVisible}
        title={pickerType === 'dob' ? 'Student Birthday' : 'Admission Date'}
        initialValue={pickerType === 'dob' ? dateOfBirth : admissionDate}
        onConfirm={pickerType === 'dob' ? setDateOfBirth : setAdmissionDate}
        onClose={() => setPickerVisible(false)}
      />

      {showBloodGroupPicker && (
         <View className="absolute inset-0 z-[999] items-center justify-center p-6 bg-black/60">
            <View className="bg-white dark:bg-gray-800 w-full rounded-3xl p-6 shadow-lg">
              <Text className="text-xl font-bold text-gray-900 dark:text-white mb-5">Select Blood Group</Text>
              <View className="flex-row flex-wrap justify-between">
                {bloodGroups.map((group) => (
                  <TouchableOpacity
                    key={group}
                    onPress={() => {
                      setBloodGroup(group);
                      setShowBloodGroupPicker(false);
                    }}
                    className={`w-[48%] py-4 rounded-2xl mb-3 items-center ${
                      bloodGroup === group ? 'bg-amber-500' : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                  >
                    <Text className={`font-bold ${bloodGroup === group ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{group}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity 
                onPress={() => setShowBloodGroupPicker(false)}
                className="mt-3 bg-gray-200 dark:bg-gray-700 py-3 rounded-2xl items-center"
              >
                <Text className="text-gray-600 dark:text-gray-300 font-bold">Close</Text>
              </TouchableOpacity>
            </View>
         </View>
      )}
    </View>
  );
}
