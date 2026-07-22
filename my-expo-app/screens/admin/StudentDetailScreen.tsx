import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Linking, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

interface StudentDetailScreenProps {
  navigation: NavigationProps;
  route: { params: { studentId: string } };
}

export default function StudentDetailScreen({ navigation, route }: StudentDetailScreenProps) {
  const { users, user, branches, fees: allFees, fetchData } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { studentId } = route.params;
  const [refreshing, setRefreshing] = React.useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const bg = isDark ? '#1c1c14' : '#FFFFFF';
  const cardBg = isDark ? '#2a2a28' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#000000';
  const textSecondary = isDark ? '#9CA3AF' : '#6B7280';
  const border = isDark ? '#3a3a38' : '#F3F4F6';

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

  const student = users.find(u => u.id === studentId);

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
      <SafeAreaView style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', paddingHorizontal: 40 }}>
          <MaterialCommunityIcons name="account-search-outline" size={80} color={textSecondary} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: textPrimary, marginTop: 16, textAlign: 'center' }}>Student not found</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginTop: 32, backgroundColor: '#EC4899', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 24, elevation: 6 }}
          >
            <Text style={{ color: 'white', fontWeight: '900' }}>BACK TO LIST</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const branch = branches.find(b => b.id?.toString() === student.branch_id?.toString());

  const InfoRow = ({ label, value, icon, iconColor, isPhone, photo }: { label: string; value?: string; icon: string; iconColor: string; isPhone?: boolean; photo?: string }) => (
    <View style={{ marginBottom: 20, width: '100%' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
          width: 48, height: 48, borderRadius: 16,
          backgroundColor: isDark ? '#333' : '#F3F4F6',
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
          <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: textSecondary, marginBottom: 2 }}>{label}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: textPrimary, flex: 1, marginRight: 8 }}>
              {value || 'Not provided'}
            </Text>
            {isPhone && value && (
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${value}`)}
                style={{ backgroundColor: '#22C55E', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', elevation: 4 }}
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
  const feeBg = financialStatus?.isOverdue ? '#FEF2F2' : (financialStatus?.isPending ? '#FFFBEB' : '#F0FDF4');
  const feeIcon = financialStatus?.isOverdue ? 'cash-remove' : (financialStatus?.isPending ? 'cash-clock' : 'cash-check');

  const QuickPill = ({ label, color }: { label: string; color: string }) => (
    <View style={{ backgroundColor: color + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: color + '30' }}>
      <Text style={{ fontSize: 10, fontWeight: '800', color, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#F59E0B"
            colors={['#F59E0B']}
            progressBackgroundColor={isDark ? '#1c1c14' : '#FFFFFF'}
          />
        }
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ backgroundColor: cardBg, width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: border }}
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color={textPrimary} />
            </TouchableOpacity>
            {user?.role !== 'teacher' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TouchableOpacity
                  onPress={handleExportPdf}
                  disabled={pdfLoading}
                  style={{ backgroundColor: isDark ? '#333' : '#FEF2F2', width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? '#3a3a38' : '#FECACA' }}
                >
                  {pdfLoading ? <ActivityIndicator color="#EF4444" /> : <MaterialCommunityIcons name="file-pdf-box" size={20} color="#EF4444" />}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigation.navigate('profile', { studentId: student.id })}
                  style={{ backgroundColor: '#F59E0B', paddingHorizontal: 20, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', elevation: 4, flexDirection: 'row' }}
                >
                  <MaterialCommunityIcons name="pencil" size={16} color="#92400E" />
                  <Text style={{ color: '#92400E', fontWeight: '900', marginLeft: 6, textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 }}>Edit</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Profile Section */}
        <View style={{ alignItems: 'center', paddingHorizontal: 24, marginTop: 24 }}>
          <View style={{ position: 'relative', marginBottom: 20 }}>
            <View style={{
              width: 140, height: 140, borderRadius: 70,
              backgroundColor: '#EC4899',
              borderWidth: 4, borderColor: isDark ? '#2a2a28' : 'white',
              alignItems: 'center', justifyContent: 'center',
              elevation: 12, overflow: 'hidden'
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
              borderWidth: 3, borderColor: isDark ? '#2a2a28' : 'white',
              elevation: 6
            }}>
              <MaterialCommunityIcons name="check-decagram" size={20} color="white" />
            </View>
          </View>

          <Text style={{ fontSize: 26, fontWeight: '900', letterSpacing: -0.5, color: textPrimary, textAlign: 'center' }}>{student.name}</Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <View style={{ backgroundColor: isDark ? '#333' : '#F3F4F6', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 }}>
              <Text style={{ fontSize: 10, fontWeight: '900', color: textSecondary, letterSpacing: 1, textTransform: 'uppercase' }}>{student.studentId || student.id}</Text>
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
            backgroundColor: financialStatus?.isOverdue ? '#FEE2E2' : (financialStatus?.isPending ? '#FEF3C7' : '#DCFCE7'),
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
        <View style={{ marginHorizontal: 24, marginTop: 24 }}>
          <View style={{
            backgroundColor: cardBg, borderRadius: 24,
            padding: 20, borderWidth: 1, borderColor: feeColor + '40',
            elevation: 6
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: feeColor }}>{financialStatus?.title}</Text>
                <Text style={{ fontSize: 28, fontWeight: '900', color: textPrimary, letterSpacing: -0.5, marginTop: 4 }}>
                  ₹{totalPending.toLocaleString('en-IN')}
                </Text>
                <Text style={{ fontSize: 10, color: textSecondary, fontWeight: '600', marginTop: 2 }}>Total outstanding</Text>
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
        <View style={{ paddingHorizontal: 24, marginTop: 28, paddingBottom: 40 }}>
          {/* General Info */}
          <View style={{
            backgroundColor: cardBg, borderRadius: 28,
            padding: 24, borderWidth: 1, borderColor: border,
            elevation: 4, marginBottom: 20
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
            backgroundColor: cardBg, borderRadius: 28,
            padding: 24, borderWidth: 1, borderColor: border,
            elevation: 4
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <View style={{ width: 4, height: 20, backgroundColor: '#3B82F6', borderRadius: 4, marginRight: 10 }} />
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#3B82F6', textTransform: 'uppercase', letterSpacing: 1.5 }}>Family & Contacts</Text>
            </View>

            <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: textSecondary, marginBottom: 14, marginLeft: 2 }}>Paternal</Text>
            <InfoRow label="Father Name" value={student.fatherName} icon="account-tie" iconColor={textSecondary} photo={student.fatherPhoto} />
            <InfoRow label="Father Phone" value={student.fatherPhone} icon="phone" iconColor="#22C55E" isPhone />

            <View style={{ height: 1, backgroundColor: border, marginVertical: 8 }} />

            <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: textSecondary, marginBottom: 14, marginLeft: 2 }}>Maternal</Text>
            <InfoRow label="Mother Name" value={student.motherName} icon="account-outline" iconColor={textSecondary} photo={student.motherPhoto} />
            <InfoRow label="Mother Phone" value={student.motherPhone} icon="phone" iconColor="#22C55E" isPhone />

            <View style={{ height: 1, backgroundColor: border, marginVertical: 8 }} />

            <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: textSecondary, marginBottom: 14, marginLeft: 2 }}>Guardian</Text>
            <InfoRow label="Guardian Name" value={student.parentName} icon="account-group" iconColor={textSecondary} photo={student.guardianPhoto} />
            <InfoRow label="Guardian Phone" value={student.guardianPhone} icon="phone" iconColor="#22C55E" isPhone />
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
