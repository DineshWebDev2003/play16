import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform, Image, Modal, StyleSheet, Dimensions, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, User } from '../../../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
  route: { params?: any };
}

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const ACCENT = '#F59E0B';
const BORDER_RADIUS = 22;

const GLASS_CARD = {
  backgroundColor: 'rgba(255,255,255,0.92)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.6)',
  borderRadius: BORDER_RADIUS,
};

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

const styles = StyleSheet.create({
  input: { flex: 1, height: 52, marginLeft: 12, fontWeight: '700', color: TEXT_PRIMARY, fontSize: 15 },
  fieldLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, color: TEXT_MUTED, marginBottom: 8, marginLeft: 4 },
  fieldBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(247,249,246,0.9)', borderRadius: 16, paddingHorizontal: 14, height: 52, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  primaryButton: { backgroundColor: ACCENT, paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 16 },
  secondaryButton: { flex: 1, backgroundColor: 'rgba(122,138,130,0.15)', paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  nextButton: { backgroundColor: ACCENT },
  finishButton: { backgroundColor: '#10B981' },
  stepHeading: { color: ACCENT, fontWeight: '700', fontSize: 15, marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1 },
  sectionLabel: { color: TEXT_MUTED, fontWeight: '700', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20 },
  pickerInput: { height: 52, backgroundColor: 'rgba(247,249,246,0.9)', borderRadius: 14, textAlign: 'center', fontSize: 16, fontWeight: '700', color: TEXT_PRIMARY, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
});

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
      onConfirm(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      onClose();
    } else {
      Alert.alert('Oops!', 'Please fill Day, Month, and Year! 🎈');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{ ...GLASS_CARD, backgroundColor: '#FFFFFF', width: '100%', padding: 24 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: TEXT_PRIMARY, marginBottom: 4, letterSpacing: -0.5 }}>{title}</Text>
          <Text style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 24, fontWeight: '600' }}>Enter details below to update date</Text>

          <View style={{ flexDirection: 'row', marginBottom: 24 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: TEXT_MUTED, marginBottom: 8, marginLeft: 4 }}>Day</Text>
              <TextInput style={styles.pickerInput} placeholder="DD" keyboardType="numeric" maxLength={2} value={day} onChangeText={setDay} placeholderTextColor="#9CA3AF" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: TEXT_MUTED, marginBottom: 8, marginLeft: 4 }}>Month</Text>
              <TextInput style={styles.pickerInput} placeholder="MM" keyboardType="numeric" maxLength={2} value={month} onChangeText={setMonth} placeholderTextColor="#9CA3AF" />
            </View>
            <View style={{ flex: 1.5, marginLeft: 12 }}>
              <Text style={{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: TEXT_MUTED, marginBottom: 8, marginLeft: 4 }}>Year</Text>
              <TextInput style={styles.pickerInput} placeholder="YYYY" keyboardType="numeric" maxLength={4} value={year} onChangeText={setYear} placeholderTextColor="#9CA3AF" />
            </View>
          </View>

          <TouchableOpacity onPress={save} style={{ backgroundColor: ACCENT, paddingVertical: 16, borderRadius: 16, alignItems: 'center' }}>
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>Save Selection</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={{ marginTop: 12, paddingVertical: 12, alignItems: 'center' }}>
            <Text style={{ color: TEXT_MUTED, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 10 }}>Nevermind, Keep Old</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function ProfileScreenV2({ navigation, route }: Props) {
  const { user, users, updateProfile, updateUser, fees: allFees } = useAuth();

  const scrollRef = useRef<ScrollView>(null);
  const studentId = route?.params?.studentId;
  const targetUser = studentId ? users.find(u => u.id === studentId) : user;

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

  const fsColor = financialSummary?.status === 'overdue' ? '#EF4444' : (financialSummary?.status === 'pending' ? ACCENT : '#10B981');
  const fsIcon = financialSummary?.status === 'overdue' ? 'cash-remove' : (financialSummary?.status === 'pending' ? 'cash-clock' : 'cash-check');

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
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState<'dob' | 'admission'>('dob');

  const [isRefreshing, setIsRefreshing] = useState(false);

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
      setEmail(targetUser.email || '');
      setPhone(targetUser.phone || '');
    }
  }, [targetUser]);

  useEffect(() => {
    if (studentId) {
      setIsEditing(true);
    }
  }, [studentId]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  }, []);

  const handleUpdate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    const updatedData: Partial<User> & { password?: string } = {
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
      admissionDate: (admissionDate || null) as any,
      date_of_birth: (dateOfBirth || null) as any,
      avatar,
      fatherPhoto,
      motherPhoto,
      guardianPhoto,
    };

    if (email) updatedData.email = email;
    if (phone) updatedData.phone = phone;
    if (newPassword.trim()) updatedData.password = newPassword.trim();

    const success = studentId
      ? ((await updateUser(studentId, updatedData)) as unknown as boolean)
      : ((await updateProfile(updatedData)) as unknown as boolean);

    if (success) {
      Alert.alert('Success', studentId ? 'Student record updated! ✨' : 'Profile updated! ✨');
      setIsEditing(false);
      setCurrentStep(1);
      setNewPassword('');
      if (studentId) {
        navigation.goBack();
      }
    }
  };

  const renderInputField = (label: string, value: string, setValue: (val: string) => void, icon: string, placeholder: string, multiline: boolean = false, keyboardType: any = 'default') => (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.fieldBox, multiline && { alignItems: 'flex-start', paddingVertical: 12 }]}>
        <MaterialCommunityIcons name={icon as any} size={20} color="#9CA3AF" style={multiline ? { marginTop: 8 } : {}} />
        <TextInput
          style={[styles.input, multiline && { height: 96, paddingTop: 4 }]}
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          editable={isEditing}
          multiline={multiline}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
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
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, color: TEXT_MUTED, marginBottom: 10, marginLeft: 4 }}>{title}</Text>
      <TouchableOpacity
        activeOpacity={0.9}
        style={{ position: 'relative' }}
        onPress={() => isEditing && setter && pickImage(setter)}
      >
        <View style={{ width: 112, height: 112, borderRadius: 24, backgroundColor: 'rgba(247,249,246,0.9)', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons
                name="account-circle-outline"
                size={44}
                color="#D1D5DB"
              />
              <Text style={{ fontSize: 8, fontWeight: '700', textTransform: 'uppercase', marginTop: 4, color: '#9CA3AF' }}>
                Upload
              </Text>
            </View>
          )}
        </View>

        {isEditing && (
          <View style={{ position: 'absolute', bottom: -4, right: -4, backgroundColor: ACCENT, width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' }}>
            <MaterialCommunityIcons name="camera-flip-outline" size={15} color="white" />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderProgressBar = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
      {[1, 2, 3].map((step) => (
        <React.Fragment key={step}>
          <View style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: currentStep === step ? ACCENT : (currentStep > step ? '#10B981' : 'rgba(122,138,130,0.18)'),
          }}>
            {currentStep > step ? (
              <MaterialCommunityIcons name="check" size={18} color="white" />
            ) : (
              <Text style={{ fontWeight: '700', color: currentStep === step ? 'white' : TEXT_MUTED }}>{step}</Text>
            )}
          </View>
          {step < 3 && (
            <View style={{ width: 40, height: 4, marginHorizontal: 8, borderRadius: 2, backgroundColor: currentStep > step ? '#10B981' : 'rgba(122,138,130,0.18)' }} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const renderDetailItem = (label: string, value: string | undefined, icon: string) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: 'rgba(247,249,246,0.9)', padding: 14, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
      <View style={{ backgroundColor: 'rgba(245,158,11,0.15)', padding: 10, borderRadius: 12, marginRight: 14 }}>
        <MaterialCommunityIcons name={icon as any} size={20} color="#D97706" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, color: TEXT_MUTED, marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontSize: 15, fontWeight: '700', color: TEXT_PRIMARY }}>{value || 'Not provided'}</Text>
      </View>
    </View>
  );

  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#F59E0B" colors={['#F59E0B']} />}
        >
          <View style={{ paddingTop: Math.max(insets.top, 20), paddingHorizontal: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                activeOpacity={0.85}
                style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}
              >
                <MaterialCommunityIcons name="arrow-left" size={24} color={TEXT_PRIMARY} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 26, fontWeight: '700', color: TEXT_PRIMARY, letterSpacing: -0.5 }}>
                  {studentId ? 'Edit Record' : 'My Profile'}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#DB2777', marginTop: 2 }}>
                  {studentId ? 'Student Records' : 'Your Details'}
                </Text>
              </View>
              <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name={studentId ? 'account-edit-outline' : 'card-account-details-outline'} size={26} color="#D97706" />
              </View>
            </View>

            {isEditing && targetUser?.role === 'student' && renderProgressBar()}

            <View style={GLASS_CARD}>
              <View style={{ padding: 20 }}>
                {!isEditing ? (
                  <View>
                    <View style={{ alignItems: 'center', marginBottom: 20 }}>
                      {renderPhotoCard(targetUser?.role === 'student' ? 'Student Account' : 'Profile Picture', avatar)}
                      <Text style={{ fontSize: 22, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 14, letterSpacing: -0.3 }}>{targetUser?.name}</Text>
                      <View style={{ backgroundColor: 'rgba(16,185,129,0.12)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100, marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 8 }} />
                        <Text style={{ color: '#10B981', fontWeight: '700', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5 }}>Verified Record</Text>
                      </View>
                    </View>

                    {targetUser?.role !== 'student' && (
                      <View style={{ marginBottom: 24 }}>
                        {targetUser?.email ? renderDetailItem('Email', targetUser?.email, 'email') : null}
                        {targetUser?.phone ? renderDetailItem('Mobile Number', targetUser?.phone, 'phone') : null}
                      </View>
                    )}

                    {financialSummary && (
                      <View style={{ marginBottom: 28, backgroundColor: 'rgba(247,249,246,0.9)', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <View>
                            <Text style={{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, color: fsColor }}>
                              {financialSummary.title}
                            </Text>
                            <Text style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 4 }}>
                              ₹{financialSummary.total.toLocaleString()}
                            </Text>
                          </View>
                          <View style={{ width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: fsColor }}>
                            <MaterialCommunityIcons
                              name={fsIcon as any}
                              size={24}
                              color="white"
                            />
                          </View>
                        </View>
                      </View>
                    )}

                    {targetUser?.role === 'student' && (
                      <View style={{ marginBottom: 28 }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: TEXT_PRIMARY, marginBottom: 14 }}>Identity Records</Text>
                        {renderDetailItem('Date of Birth', targetUser?.date_of_birth, 'calendar-heart')}
                        {renderDetailItem('Blood Group', targetUser?.bloodGroup, 'water')}
                        {renderDetailItem('Contact Number', targetUser?.phone, 'phone')}
                        {renderDetailItem('Home Address', targetUser?.address, 'map-marker')}
                      </View>
                    )}

                    {targetUser?.role === 'student' && (
                      <View style={{ marginBottom: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(122,138,130,0.15)' }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: TEXT_PRIMARY, marginBottom: 14 }}>Family & Guardian</Text>
                        {renderDetailItem("Father's Name", targetUser?.fatherName, 'account-tie')}
                        {renderDetailItem("Father's Contact", targetUser?.fatherPhone, 'phone')}
                        {renderDetailItem("Mother's Name", targetUser?.motherName, 'face-woman')}
                        {renderDetailItem("Mother's Contact", targetUser?.motherPhone, 'phone')}
                        {renderDetailItem("Guardian Name", targetUser?.parentName, 'account-group')}
                        {renderDetailItem("Guardian Contact", targetUser?.guardianPhone, 'phone-check')}
                      </View>
                    )}

                    {targetUser?.role === 'student' ? (
                      <TouchableOpacity
                        onPress={() => setIsEditing(true)}
                        style={styles.primaryButton}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <MaterialCommunityIcons name="pencil-box-multiple-outline" size={18} color="white" />
                          <Text style={{ color: 'white', fontWeight: '700', fontSize: 15, marginLeft: 8 }}>Edit Full Student Profile</Text>
                        </View>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={() => setIsEditing(true)}
                        style={styles.primaryButton}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <MaterialCommunityIcons name="pencil-box-multiple-outline" size={18} color="white" />
                          <Text style={{ color: 'white', fontWeight: '700', fontSize: 15, marginLeft: 8 }}>Edit Profile Settings</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : targetUser?.role === 'student' ? (
                  <View>
                    {currentStep === 1 && (
                      <View>
                        <Text style={styles.stepHeading}>Step 1: Personal Info</Text>
                        <View style={{ alignItems: 'center', marginBottom: 24 }}>
                          {renderPhotoCard('Account Profile', avatar, setAvatar)}
                        </View>
                        {renderInputField('Student Name', name, setName, 'account', 'Full Name')}

                        <View style={{ marginBottom: 20 }}>
                          <Text style={styles.fieldLabel}>Date of Birth</Text>
                          <TouchableOpacity
                            disabled={!isEditing}
                            onPress={() => { setPickerType('dob'); setPickerVisible(true); }}
                            style={styles.fieldBox}
                          >
                            <MaterialCommunityIcons name="cake" size={20} color="#9CA3AF" />
                            <Text style={{ flex: 1, marginLeft: 12, fontWeight: '700', fontSize: 15, color: dateOfBirth ? TEXT_PRIMARY : '#9CA3AF' }}>
                              {dateOfBirth || 'Select Birthday'}
                            </Text>
                            <MaterialCommunityIcons name="calendar-edit" size={20} color="#9CA3AF" />
                          </TouchableOpacity>
                        </View>

                        <View style={{ marginBottom: 20 }}>
                          <Text style={styles.fieldLabel}>Blood Group</Text>
                          <TouchableOpacity
                            onPress={() => setShowBloodGroupPicker(true)}
                            style={styles.fieldBox}
                          >
                            <MaterialCommunityIcons name="water" size={20} color="#EF4444" />
                            <Text style={{ flex: 1, marginLeft: 12, fontWeight: '700', fontSize: 15, color: bloodGroup ? TEXT_PRIMARY : '#9CA3AF' }}>
                              {bloodGroup || 'Select Blood Group'}
                            </Text>
                            <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
                          </TouchableOpacity>
                        </View>

                        {user?.role === 'admin' && (
                          <View style={{ paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(122,138,130,0.15)', marginTop: 16 }}>
                            <Text style={styles.sectionLabel}>Admin Controls</Text>
                            <View style={{ marginBottom: 20 }}>
                              <Text style={styles.fieldLabel}>Admission Date</Text>
                              <TouchableOpacity
                                disabled={!isEditing}
                                onPress={() => { setPickerType('admission'); setPickerVisible(true); }}
                                style={styles.fieldBox}
                              >
                                <MaterialCommunityIcons name="calendar" size={20} color="#9CA3AF" />
                                <Text style={{ flex: 1, marginLeft: 12, fontWeight: '700', fontSize: 15, color: admissionDate ? TEXT_PRIMARY : '#9CA3AF' }}>
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
                        <Text style={styles.stepHeading}>Step 2: Family Info</Text>

                        <View style={{ marginBottom: 32, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(122,138,130,0.15)' }}>
                          <Text style={styles.sectionLabel}>Father Information</Text>
                          <View style={{ marginBottom: 24, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(122,138,130,0.08)', padding: 14, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
                            <View style={{ marginRight: 16 }}>
                              {renderPhotoCard('Father Photo', fatherPhoto, setFatherPhoto)}
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 9, fontWeight: '700', color: TEXT_MUTED, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Verification Required</Text>
                              <Text style={{ fontSize: 12, color: TEXT_SECONDARY, fontWeight: '700', lineHeight: 16 }}>Please upload a clear portrait for the student's records.</Text>
                            </View>
                          </View>
                          {renderInputField("Father's Name", fatherName, setFatherName, 'account-tie', 'Father Name')}
                          {renderInputField("Father's Phone", fatherPhone, setFatherPhone, 'phone', 'Father Number')}
                        </View>

                        <View style={{ marginBottom: 32, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(122,138,130,0.15)' }}>
                          <Text style={styles.sectionLabel}>Mother Information</Text>
                          <View style={{ marginBottom: 24, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(122,138,130,0.08)', padding: 14, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
                            <View style={{ marginRight: 16 }}>
                              {renderPhotoCard('Mother Photo', motherPhoto, setMotherPhoto)}
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 9, fontWeight: '700', color: TEXT_MUTED, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Identity Photo</Text>
                              <Text style={{ fontSize: 12, color: TEXT_SECONDARY, fontWeight: '700', lineHeight: 16 }}>Clear facial photo preferred for security verification.</Text>
                            </View>
                          </View>
                          {renderInputField("Mother's Name", motherName, setMotherName, 'face-woman', 'Mother Name')}
                          {renderInputField("Mother's Phone", motherPhone, setMotherPhone, 'phone', 'Mother Number')}
                        </View>

                        <View style={{ marginBottom: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(122,138,130,0.15)' }}>
                          <Text style={styles.sectionLabel}>Guardian Information</Text>
                          <View style={{ marginBottom: 24, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(122,138,130,0.08)', padding: 14, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
                            <View style={{ marginRight: 16 }}>
                              {renderPhotoCard('Guardian Photo', guardianPhoto, setGuardianPhoto)}
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 9, fontWeight: '700', color: TEXT_MUTED, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Optional Record</Text>
                              <Text style={{ fontSize: 12, color: TEXT_SECONDARY, fontWeight: '700', lineHeight: 16 }}>Required if primary parents are not reachable.</Text>
                            </View>
                          </View>
                          {renderInputField('Guardian Name', guardianName, setGuardianName, 'account-group', 'Guardian Name')}
                          {renderInputField('Guardian Phone', guardianPhone, setGuardianPhone, 'phone', 'Guardian Number')}
                        </View>
                      </View>
                    )}

                    {currentStep === 3 && (
                      <View>
                        <Text style={styles.stepHeading}>Step 3: Contact & Security</Text>
                        {renderInputField('Residential Address', address, setAddress, 'map-marker', 'Full Address', true)}
                        {!studentId && (
                          <View style={{ marginTop: 12 }}>
                            <Text style={styles.sectionLabel}>Account Security</Text>
                            {renderInputField('New Password', newPassword, setNewPassword, 'key-outline', 'Enter new password')}
                          </View>
                        )}
                        {studentId && (
                          <View style={{ marginTop: 16, paddingVertical: 24, alignItems: 'center', backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' }}>
                            <MaterialCommunityIcons name="shield-check" size={40} color="#D97706" />
                            <Text style={{ color: '#92400E', fontWeight: '700', textAlign: 'center', marginTop: 12 }}>Professional Record Management</Text>
                            <Text style={{ color: '#B45309', fontSize: 12, textAlign: 'center', paddingHorizontal: 24, marginTop: 4 }}>Changes are synced with the central student database instantly.</Text>
                          </View>
                        )}
                      </View>
                    )}

                    <View style={{ flexDirection: 'row', marginTop: 24 }}>
                      {currentStep > 1 ? (
                        <TouchableOpacity
                          onPress={() => setCurrentStep(prev => prev - 1)}
                          style={styles.secondaryButton}
                        >
                          <Text style={{ color: TEXT_SECONDARY, fontWeight: '700', fontSize: 15 }}>Back</Text>
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
                          style={styles.secondaryButton}
                        >
                          <Text style={{ color: TEXT_SECONDARY, fontWeight: '700', fontSize: 15 }}>Cancel</Text>
                        </TouchableOpacity>
                      )}

                      <View style={{ width: 12 }} />

                      {currentStep < totalSteps ? (
                        <TouchableOpacity
                          onPress={() => {
                            setCurrentStep(prev => prev + 1);
                            scrollRef.current?.scrollTo({ y: 0, animated: true });
                          }}
                          style={[styles.secondaryButton, styles.nextButton]}
                        >
                          <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>Next</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          onPress={handleUpdate}
                          style={[styles.secondaryButton, styles.finishButton]}
                        >
                          <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>Finish</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ) : (
                  <View>
                    <Text style={styles.stepHeading}>Profile Settings</Text>
                    <View style={{ alignItems: 'center', marginBottom: 24 }}>
                      {renderPhotoCard('Profile Picture', avatar, setAvatar)}
                    </View>
                    {renderInputField('Full Name', name, setName, 'account', 'Your full name')}
                    {renderInputField('Email (Gmail)', email, setEmail, 'email', 'your@gmail.com', false, 'email-address')}
                    {renderInputField('Mobile Number', phone, setPhone, 'phone', 'Your mobile number', false, 'phone-pad')}
                    <View style={{ paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(122,138,130,0.15)', marginTop: 16 }}>
                      <Text style={styles.sectionLabel}>Account Security</Text>
                      {renderInputField('New Password', newPassword, setNewPassword, 'key-outline', 'Enter new password (optional)')}
                    </View>
                    <View style={{ flexDirection: 'row', marginTop: 24 }}>
                      <TouchableOpacity
                        onPress={() => { setIsEditing(false); setNewPassword(''); }}
                        style={styles.secondaryButton}
                      >
                        <Text style={{ color: TEXT_SECONDARY, fontWeight: '700', fontSize: 15 }}>Cancel</Text>
                      </TouchableOpacity>
                      <View style={{ width: 12 }} />
                      <TouchableOpacity
                        onPress={handleUpdate}
                        style={[styles.secondaryButton, styles.finishButton]}
                      >
                        <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
          <View style={{ height: 32 }} />
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
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <View style={{ ...GLASS_CARD, backgroundColor: '#FFFFFF', width: '100%', padding: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY, marginBottom: 20 }}>Select Blood Group</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {bloodGroups.map((group) => (
                <TouchableOpacity
                  key={group}
                  onPress={() => {
                    setBloodGroup(group);
                    setShowBloodGroupPicker(false);
                  }}
                  style={{
                    width: '48%',
                    paddingVertical: 16,
                    borderRadius: 16,
                    marginBottom: 12,
                    alignItems: 'center',
                    backgroundColor: bloodGroup === group ? ACCENT : 'rgba(122,138,130,0.12)',
                  }}
                >
                  <Text style={{ fontWeight: '700', color: bloodGroup === group ? 'white' : TEXT_PRIMARY }}>{group}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              onPress={() => setShowBloodGroupPicker(false)}
              style={{ marginTop: 12, backgroundColor: 'rgba(122,138,130,0.15)', paddingVertical: 12, borderRadius: 16, alignItems: 'center' }}
            >
              <Text style={{ color: TEXT_SECONDARY, fontWeight: '700' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
