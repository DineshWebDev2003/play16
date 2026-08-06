import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, Linking, Alert,
  RefreshControl, ActivityIndicator, StyleSheet, Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

interface StudentDetailScreenV2Props {
  navigation: NavigationProps;
  route: { params: { studentId: string } };
}

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const ACCENT = '#F59E0B';
const BORDER_RADIUS = 22;

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

// ─── Aurora Glass background ────────────────────────────────────────────────────
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

export default function StudentDetailScreenV2({ navigation, route }: StudentDetailScreenV2Props) {
  const { users, user, branches, fees: allFees, fetchData } = useAuth();
  const insets = useSafeAreaInsets();
  const { studentId } = route.params;
  const [refreshing, setRefreshing] = React.useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

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

  const student = users.find(u => u.id === studentId);

  const handleExportPdf = useCallback(async () => {
    if (!student) return;
    setPdfLoading(true);
    try {
      const s = student;
      const branchName = branches.find(b => b.id?.toString() === s.branch_id?.toString())?.name || '---';
      const photoUrl = s.avatar || null;
      const photoHtml = photoUrl
        ? `<img src="${photoUrl}" onerror="this.style.display='none'" style="width:100px;height:100px;border-radius:20px;object-fit:cover;border:3px solid #DBEAFE;" />`
        : `<div style="width:100px;height:100px;border-radius:20px;background:#3B82F6;display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:36px;">${(s.name?.[0] || '?').toUpperCase()}</div>`;

      const parentPhoto = (url: string | undefined, name: string) => url
        ? `<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;"><img src="${url}" onerror="this.style.display='none'" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" /><span style="font-size:13px;font-weight:700;color:#111827;">${name}</span></div>`
        : '';

      const html = `
        <html>
          <head>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&display=swap');
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Inter', -apple-system, sans-serif; padding: 30px; color: #1F2937; background: #F8F6F0; }
              .report-header { text-align: center; margin-bottom: 40px; padding: 30px; background: linear-gradient(135deg, #1E40AF, #3B82F6); border-radius: 24px; color: white; }
              .brand { font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 4px; opacity: 0.9; margin-bottom: 6px; }
              .report-header h1 { font-size: 28px; font-weight: 900; letter-spacing: -0.5px; }
              .report-header .sub { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 3px; opacity: 0.8; margin-top: 6px; }
              .report-header .meta { font-size: 12px; font-weight: 600; opacity: 0.7; margin-top: 10px; }
              table { width: 100%; border-collapse: collapse; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
              td.label { padding: 8px 4px; border-bottom: 1px solid #F3F4F6; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #6B7280; width: 140px; }
              td.value { padding: 8px 4px; border-bottom: 1px solid #F3F4F6; font-size: 14px; font-weight: 700; color: #111827; }
              .section-title { font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; color: #6B7280; margin-bottom: 16px; }
              .photo-grid { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
              .photo-item { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid #DBEAFE; }
              .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 20px; }
              @media print { body { background: white; } .report-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
            </style>
          </head>
          <body>
            <div class="report-header">
              <div class="brand">TN HAPPYKIDS</div>
              <h1>🎓 Student Profile</h1>
              <div class="sub">${branchName}</div>
              <div class="meta">ID: ${s.studentId || s.id} • ${s.gender || '---'} • ${s.category || '---'}</div>
            </div>
            <div style="display:flex;gap:24px;margin-bottom:30px;flex-wrap:wrap;">
              <div style="flex-shrink:0;">${photoHtml}</div>
              <div style="flex:1;min-width:200px;">
                <div style="background:white;border-radius:20px;padding:24px;box-shadow:0 4px 16px rgba(0,0,0,0.06);">
                  <h2 style="font-size:22px;font-weight:900;margin-bottom:16px;">${s.name || '---'}</h2>
                  <table style="width:100%;border-collapse:collapse;">
                    ${[
                      ['Student ID', s.studentId || s.id],
                      ['Date of Birth', s.date_of_birth || '---'],
                      ['Gender', s.gender || '---'],
                      ['Blood Group', s.bloodGroup || '---'],
                      ['Category', s.category || '---'],
                      ['Admission Date', s.admissionDate || '---'],
                      ['Monthly Fees', s.fees ? '₹' + parseInt(s.fees).toLocaleString('en-IN') : '---'],
                      ['Fee Due Day', s.fee_due_day ? 'Day ' + s.fee_due_day + ' of every month' : '---'],
                    ].map(([l, v]) => `<tr><td class="label">${l}</td><td class="value">${v}</td></tr>`).join('')}
                  </table>
                </div>
              </div>
            </div>
            <div style="background:white;border-radius:20px;padding:24px;box-shadow:0 4px 16px rgba(0,0,0,0.06);margin-bottom:20px;">
              <div class="section-title">👨‍👩‍👧 Parent / Guardian Details</div>
              <div class="photo-grid">
                ${s.fatherPhoto ? `<img src="${s.fatherPhoto}" class="photo-item" />` : ''}
                ${s.motherPhoto ? `<img src="${s.motherPhoto}" class="photo-item" />` : ''}
                ${s.guardianPhoto ? `<img src="${s.guardianPhoto}" class="photo-item" />` : ''}
              </div>
              <table style="width:100%;border-collapse:collapse;">
                ${[
                  ['Father Name', s.fatherName || '---'],
                  ['Mother Name', s.motherName || '---'],
                  ['Father Phone', s.fatherPhone || '---'],
                  ['Mother Phone', s.motherPhone || '---'],
                  ['Guardian Phone', s.guardianPhone || '---'],
                  ['Address', s.address || '---'],
                ].map(([l, v]) => `<tr><td class="label">${l}</td><td class="value">${v}</td></tr>`).join('')}
              </table>
            </div>
            <div class="footer">
              TN HAPPYKIDS • Individual Student Report • Generated ${(() => { const d = new Date(); return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`; })()}
            </div>
          </body>
        </html>`;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Student Profile' });
    } catch (e) {
      console.error('PDF Error:', e);
      Alert.alert('Error', `Failed to generate PDF: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setPdfLoading(false);
    }
  }, [student, branches]);

  const { financialStatus, totalPending } = React.useMemo(() => {
    if (!student) return { financialStatus: null, totalPending: 0 };

    const dbId = student.id?.toString();
    const schoolId = student.studentId?.toString();
    const todayStr = new Date().toISOString().split('T')[0];

    const d = new Date();
    const monthYearCode = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    const studentFees = allFees.filter(f =>
      (f.student_id?.toString() === dbId || f.student_id?.toString() === schoolId)
    );

    const unpaidFees = studentFees.filter(f => f.status === 'unpaid');
    const currentMonthPaid = studentFees.find(f =>
       f.date?.includes(monthYearCode) && f.status === 'paid'
    );
    const currentMonthBilled = studentFees.find(f => f.date?.includes(monthYearCode));

    let hasAnyOverdue = unpaidFees.some(f => f.due_date && f.due_date < todayStr);

    if (!hasAnyOverdue && !currentMonthPaid && !currentMonthBilled) {
       const dueDayNum = parseInt(student.fee_due_day || '5');
       if (new Date().getDate() > dueDayNum) {
          hasAnyOverdue = true;
       }
    }

    const isPending = unpaidFees.length > 0 || (!currentMonthPaid && (student.fees && parseInt(student.fees) > 0));

    const dbUnpaidAmount = unpaidFees.reduce((sum, f) => sum + (f.amount || 0), 0);
    let extra = 0;
    if (!currentMonthBilled && student.fees && parseInt(student.fees) > 0) {
       extra = parseInt(student.fees);
    }
    const total = dbUnpaidAmount + extra;

    return {
      financialStatus: {
        isOverdue: hasAnyOverdue,
        isPending,
        isPaid: !isPending && currentMonthPaid,
        title: hasAnyOverdue ? 'Overdue Balance' : (isPending ? 'Pending Dues' : 'Account Clear')
      },
      totalPending: total
    };
  }, [student, allFees]);

  if (!student) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F7F9F6', alignItems: 'center', justifyContent: 'center' }}>
        <AuroraBackground />
        <View style={{ alignItems: 'center', paddingHorizontal: 40 }}>
          <MaterialCommunityIcons name="account-search-outline" size={80} color="#E5E7EB" />
          <Text style={{ fontSize: 18, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 16, textAlign: 'center' }}>Student not found</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginTop: 32, backgroundColor: '#DB2777', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 24 }}
          >
            <Text style={{ color: 'white', fontWeight: '900' }}>BACK TO LIST</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const branch = branches.find(b => b.id?.toString() === student.branch_id?.toString());

  const InfoRow = ({ label, value, icon, iconColor, isPhone, photo }: { label: string; value?: string; icon: string; iconColor: string; isPhone?: boolean; photo?: string }) => (
    <View style={{ marginBottom: 20, width: '100%' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
          width: 48, height: 48, borderRadius: 16,
          backgroundColor: iconColor + '14',
          alignItems: 'center', justifyContent: 'center',
          marginRight: 14, overflow: 'hidden'
        }}>
          {photo ? (
            <Image source={{ uri: photo }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <MaterialCommunityIcons name={icon as any} size={22} color={iconColor} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: TEXT_MUTED, marginBottom: 2 }}>{label}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: TEXT_PRIMARY, flex: 1, marginRight: 8 }}>
              {value || 'Not provided'}
            </Text>
            {isPhone && value && (
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${value}`)}
                style={{ backgroundColor: '#22C55E', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
              >
                <MaterialCommunityIcons name="phone" size={18} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );

  const feeColor = financialStatus?.isOverdue ? '#EF4444' : (financialStatus?.isPending ? '#F59E0B' : '#22C55E');
  const feeIcon = financialStatus?.isOverdue ? 'cash-remove' : (financialStatus?.isPending ? 'cash-clock' : 'cash-check');

  const QuickPill = ({ label, color }: { label: string; color: string }) => (
    <View style={{ backgroundColor: color + '14', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
      <Text style={{ fontSize: 10, fontWeight: '800', color, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#F59E0B"
            colors={['#F59E0B']}
          />
        }
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: Math.max(insets.top, 20) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ backgroundColor: 'rgba(255,255,255,0.92)', width: 50, height: 50, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={TEXT_PRIMARY} />
            </TouchableOpacity>
            {user?.role !== 'teacher' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TouchableOpacity
                  onPress={handleExportPdf}
                  disabled={pdfLoading}
                  style={{ backgroundColor: 'rgba(255,255,255,0.92)', width: 50, height: 50, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}
                  activeOpacity={0.7}
                >
                  {pdfLoading ? <ActivityIndicator color="#EF4444" /> : <MaterialCommunityIcons name="file-pdf-box" size={22} color="#EF4444" />}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigation.navigate('profile', { studentId: student.id })}
                  style={{ backgroundColor: '#F59E0B', paddingHorizontal: 20, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="pencil" size={16} color="#92400E" />
                  <Text style={{ color: '#92400E', fontWeight: '900', marginLeft: 6, textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 }}>Edit</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Profile Section */}
        <View style={{ alignItems: 'center', paddingHorizontal: 20, marginTop: 24 }}>
          <View style={{ position: 'relative', marginBottom: 20 }}>
            <View style={{
              width: 140, height: 140, borderRadius: 70,
              backgroundColor: '#EC4899',
              borderWidth: 4, borderColor: 'rgba(255,255,255,0.9)',
              alignItems: 'center', justifyContent: 'center',
              elevation: 8, overflow: 'hidden'
            }}>
              {student.avatar ? (
                <Image source={{ uri: student.avatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <MaterialCommunityIcons name="account" size={70} color="white" />
              )}
            </View>
            <View style={{
              position: 'absolute', bottom: 4, right: 4,
              backgroundColor: '#22C55E', width: 40, height: 40, borderRadius: 20,
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)',
            }}>
              <MaterialCommunityIcons name="check-decagram" size={20} color="white" />
            </View>
          </View>

          <Text style={{ fontSize: 26, fontWeight: '900', letterSpacing: -0.5, color: TEXT_PRIMARY, textAlign: 'center' }}>{student.name}</Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
              <Text style={{ fontSize: 10, fontWeight: '900', color: TEXT_MUTED, letterSpacing: 1, textTransform: 'uppercase' }}>{student.studentId || student.id}</Text>
            </View>
            {branch && (
              <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 }}>
                <Text style={{ fontSize: 10, fontWeight: '900', color: '#92400E', letterSpacing: 1, textTransform: 'uppercase' }}>{branch.name}</Text>
              </View>
            )}
          </View>

          {/* Fee Status Badge */}
          <View style={{
            marginTop: 12,
            backgroundColor: feeColor + '1F',
            paddingHorizontal: 20, paddingVertical: 8, borderRadius: 24,
            flexDirection: 'row', alignItems: 'center'
          }}>
            <MaterialCommunityIcons name={feeIcon} size={16} color={feeColor} />
            <Text style={{ fontSize: 11, fontWeight: '900', color: feeColor, marginLeft: 6, letterSpacing: 1, textTransform: 'uppercase' }}>
              {financialStatus?.isOverdue ? 'Overdue' : (financialStatus?.isPending ? 'Pending' : 'Clear')}
            </Text>
          </View>

          {/* Quick Pills */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            <QuickPill label={student.gender || '---'} color="#3B82F6" />
            <QuickPill label={student.bloodGroup || '---'} color="#EF4444" />
            <QuickPill label={student.category || '---'} color="#8B5CF6" />
          </View>
        </View>

        {/* Financial Summary Card */}
        <View style={{ marginHorizontal: 20, marginTop: 24 }}>
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.92)',
            borderRadius: BORDER_RADIUS,
            padding: 20,
            borderWidth: 1, borderColor: feeColor + '40',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: feeColor }}>{financialStatus?.title}</Text>
                <Text style={{ fontSize: 28, fontWeight: '900', color: TEXT_PRIMARY, letterSpacing: -0.5, marginTop: 4 }}>
                  ₹{totalPending.toLocaleString('en-IN')}
                </Text>
                <Text style={{ fontSize: 10, color: TEXT_MUTED, fontWeight: '600', marginTop: 2 }}>Total outstanding</Text>
              </View>
              <View style={{
                width: 56, height: 56, borderRadius: 20,
                backgroundColor: feeColor,
                alignItems: 'center', justifyContent: 'center'
              }}>
                <MaterialCommunityIcons name={feeIcon} size={28} color="white" />
              </View>
            </View>
          </View>
        </View>

        {/* Info Sections */}
        <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
          {/* General Info */}
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.92)',
            borderRadius: BORDER_RADIUS,
            padding: 22,
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
            marginBottom: 20,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <View style={{ width: 4, height: 20, backgroundColor: '#EC4899', borderRadius: 4, marginRight: 10 }} />
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#EC4899', textTransform: 'uppercase', letterSpacing: 1.5 }}>General Info</Text>
            </View>
            <InfoRow label="Category" value={student.category} icon="school" iconColor="#3B82F6" />
            <InfoRow label="Date of Birth" value={student.date_of_birth} icon="cake-variant" iconColor="#EC4899" />
            <InfoRow label="Blood Group" value={student.bloodGroup} icon="water" iconColor="#EF4444" />
            <InfoRow label="Admission Date" value={student.admissionDate} icon="calendar-star" iconColor="#F59E0B" />
            <InfoRow label="Monthly Fees" value={student.fees ? `₹${parseInt(student.fees).toLocaleString('en-IN')}` : undefined} icon="cash-multiple" iconColor="#10B981" />
            <InfoRow label="Due Day" value={student.fee_due_day ? `Day ${student.fee_due_day} of every month` : undefined} icon="calendar-clock" iconColor="#FBBF24" />
            <InfoRow label="Address" value={student.address} icon="map-marker" iconColor="#F59E0B" />
          </View>

          {/* Family & Contacts */}
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.92)',
            borderRadius: BORDER_RADIUS,
            padding: 22,
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <View style={{ width: 4, height: 20, backgroundColor: '#3B82F6', borderRadius: 4, marginRight: 10 }} />
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#3B82F6', textTransform: 'uppercase', letterSpacing: 1.5 }}>Family & Contacts</Text>
            </View>

            <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: TEXT_MUTED, marginBottom: 14, marginLeft: 2 }}>Paternal</Text>
            <InfoRow label="Father Name" value={student.fatherName} icon="account-tie" iconColor={TEXT_MUTED} photo={student.fatherPhoto} />
            <InfoRow label="Father Phone" value={student.fatherPhone} icon="phone" iconColor="#22C55E" isPhone />

            <View style={{ height: 1, backgroundColor: 'rgba(122,138,130,0.2)', marginVertical: 8 }} />

            <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: TEXT_MUTED, marginBottom: 14, marginLeft: 2 }}>Maternal</Text>
            <InfoRow label="Mother Name" value={student.motherName} icon="account-outline" iconColor={TEXT_MUTED} photo={student.motherPhoto} />
            <InfoRow label="Mother Phone" value={student.motherPhone} icon="phone" iconColor="#22C55E" isPhone />

            <View style={{ height: 1, backgroundColor: 'rgba(122,138,130,0.2)', marginVertical: 8 }} />

            <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: TEXT_MUTED, marginBottom: 14, marginLeft: 2 }}>Guardian</Text>
            <InfoRow label="Guardian Name" value={student.parentName} icon="account-group" iconColor={TEXT_MUTED} photo={student.guardianPhoto} />
            <InfoRow label="Guardian Phone" value={student.guardianPhone} icon="phone" iconColor="#22C55E" isPhone />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
