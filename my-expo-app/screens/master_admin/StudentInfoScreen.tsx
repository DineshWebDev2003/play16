import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BranchFilter from '../../components/BranchFilter';
import { getMediaUrl } from '../../services/api';

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}
interface Props { navigation: NavigationProps; }

export default function StudentInfoScreen({ navigation }: Props) {
  const { user, users, branches, fetchData } = useAuth();
  const insets = useSafeAreaInsets();
  const isDark = false;
  const isMasterAdmin = user?.role === 'master_admin';
  const [branchFilterId, setBranchFilterId] = useState<string | null>(isMasterAdmin ? null : (user?.branch_id?.toString() || null));
  const [refreshing, setRefreshing] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const students = useMemo(() =>
    users.filter(u =>
      u.role === 'student' &&
      u.status === 'active' &&
      (!branchFilterId || u.branch_id?.toString() === branchFilterId)
    ).sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [users, branchFilterId]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const selectedBranch = useMemo(() =>
    branches.find(b => b.id?.toString() === branchFilterId),
    [branches, branchFilterId]
  );

  const paginatedStudents = useMemo(() =>
    students.slice(0, page * PAGE_SIZE),
    [students, page]
  );

  const hasMore = paginatedStudents.length < students.length;

  const loadMore = useCallback(() => {
    if (hasMore) setPage(p => p + 1);
  }, [hasMore]);

  // Reset page when branch changes
  useEffect(() => { setPage(1); }, [branchFilterId]);

  const generateStudentHtml = useCallback((s: any, index: number, total: number, singleMode?: boolean) => {
    const branch = branches.find(b => b.id?.toString() === s.branch_id?.toString());
    const photoUrl = getMediaUrl(s.studentPhoto);
    const photoHtml = photoUrl
      ? `<img src="${photoUrl}" onerror="this.style.display='none'" style="width:100px;height:100px;border-radius:20px;object-fit:cover;border:3px solid #DBEAFE;" />`
      : `<div style="width:100px;height:100px;border-radius:20px;background:#3B82F6;display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:36px;">${(s.name?.[0] || '?').toUpperCase()}</div>`;

    if (singleMode) {
      return `
        <div style="max-width:700px;margin:0 auto;">
          <div class="report-header">
            <h1>🎓 Student Profile</h1>
            <div class="sub">${branch ? branch.name : '---'}</div>
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
                  ].map(([l, v]) => `<tr><td style="padding:8px 4px;border-bottom:1px solid #F3F4F6;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#6B7280;width:140px;">${l}</td><td style="padding:8px 4px;border-bottom:1px solid #F3F4F6;font-size:14px;font-weight:700;color:#111827;">${v}</td></tr>`).join('')}
                </table>
              </div>
            </div>
          </div>
          <div style="background:white;border-radius:20px;padding:24px;box-shadow:0 4px 16px rgba(0,0,0,0.06);margin-bottom:20px;">
            <h3 style="font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;color:#6B7280;margin-bottom:16px;">👨‍👩‍👧 Parent / Guardian Details</h3>
            <table style="width:100%;border-collapse:collapse;">
              ${[
                ['Father Name', s.fatherName || '---'],
                ['Mother Name', s.motherName || '---'],
                ['Father Phone', s.fatherPhone || '---'],
                ['Mother Phone', s.motherPhone || '---'],
                ['Guardian Phone', s.guardianPhone || '---'],
                ['Address', s.address || '---'],
              ].map(([l, v]) => `<tr><td style="padding:8px 4px;border-bottom:1px solid #F3F4F6;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#6B7280;width:140px;">${l}</td><td style="padding:8px 4px;border-bottom:1px solid #F3F4F6;font-size:13px;font-weight:600;color:#111827;">${v}</td></tr>`).join('')}
            </table>
          </div>
          <div class="footer" style="margin-top:20px;">
            TN HAPPYKIDS • Individual Student Report • Generated ${(() => { const d = new Date(); return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`; })()}
          </div>
        </div>`;
    }

    const tablePhotoHtml = photoUrl
      ? `<div class="photo-cell"><img src="${photoUrl}" onerror="this.style.display='none'" /></div>`
      : `<div class="photo-cell avatar">${(s.name?.[0] || '?').toUpperCase()}</div>`;
    return `<tr>
      <td class="num">${index}</td>
      <td>${tablePhotoHtml}</td>
      <td><strong>${s.name || '---'}</strong></td>
      <td>${s.studentId || s.id}</td>
      <td>${branch ? branch.name : '---'}</td>
      <td>${s.gender || '---'}</td>
      <td>${s.category || '---'}</td>
      <td>${s.fatherName || '---'}</td>
      <td>${s.fatherPhone || s.guardianPhone || '---'}</td>
      <td>${s.address ? s.address.substring(0, 30) : '---'}</td>
    </tr>`;
  }, [branches]);


  const generateFullReportHtml = useCallback((studentList: any[]) => {
    const branchName = selectedBranch?.name || 'All Branches';
    const rows = studentList.map((s, i) => generateStudentHtml(s, i + 1, studentList.length)).join('');
    return `
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
            .summary { display: flex; justify-content: center; gap: 20px; margin-bottom: 30px; }
            .summary-item { background: white; border-radius: 16px; padding: 16px 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center; min-width: 120px; }
            .summary-item .num { font-size: 24px; font-weight: 900; color: #1E40AF; }
            .summary-item .lbl { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #6B7280; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
            th { background: #1E40AF; color: white; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; padding: 14px 10px; text-align: left; }
            td { padding: 12px 10px; font-size: 12px; border-bottom: 1px solid #F3F4F6; vertical-align: middle; }
            tr:last-child td { border-bottom: none; }
            tr:nth-child(even) { background: #FAFAFA; }
            .photo-cell { width: 44px; height: 44px; border-radius: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
            .photo-cell img { width: 44px; height: 44px; object-fit: cover; border-radius: 12px; }
            .photo-cell.avatar { background: #3B82F6; color: white; font-weight: 900; font-size: 16px; }
            .num { font-weight: 600; color: #9CA3AF; width: 30px; }
            .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 20px; }
            @media print { body { background: white; } .report-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; } th { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="report-header">
            <div class="brand">TN HAPPYKIDS</div>
            <h1>📋 Student Information Report</h1>
            <div class="sub">${branchName}</div>
            <div class="meta">Generated: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })} • ${studentList.length} Student(s)</div>
          </div>
          <div class="summary">
            <div class="summary-item"><div class="num">${studentList.length}</div><div class="lbl">Total Students</div></div>
            <div class="summary-item"><div class="num">${studentList.filter(s2 => s2.gender?.toLowerCase() === 'male').length}</div><div class="lbl">Boys</div></div>
            <div class="summary-item"><div class="num">${studentList.filter(s2 => s2.gender?.toLowerCase() === 'female').length}</div><div class="lbl">Girls</div></div>
          </div>
          <table>
            <thead><tr>
              <th>#</th><th>Photo</th><th>Name</th><th>ID</th><th>Branch</th><th>Gender</th><th>Category</th><th>Father</th><th>Phone</th><th>Address</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="footer">
            TN HAPPYKIDS • Computer Generated Report • ${(() => { const d = new Date(); return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`; })()}
          </div>
        </body>
      </html>`;
  }, [selectedBranch, generateStudentHtml]);

  const generateSingleReportHtml = useCallback((s: any) => {
    return `
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
            table { width: 100%; border-collapse: collapse; }
            td.label { padding: 8px 4px; border-bottom: 1px solid #F3F4F6; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #6B7280; width: 140px; }
            td.value { padding: 8px 4px; border-bottom: 1px solid #F3F4F6; font-size: 14px; font-weight: 700; color: #111827; }
            .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 20px; }
            @media print { body { background: white; } .report-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="report-header">
            <div class="brand">TN HAPPYKIDS</div>
            <h1>🎓 Student Profile</h1>
            <div class="sub">${selectedBranch?.name || '---'}</div>
            <div class="meta">ID: ${s.studentId || s.id} • ${s.gender || '---'} • ${s.category || '---'}</div>
          </div>
          ${generateStudentHtml(s, 1, 1, true)}
          <div class="footer">
            TN HAPPYKIDS • Individual Student Report • ${(() => { const d = new Date(); return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`; })()}
          </div>
        </body>
      </html>`;
  }, [generateStudentHtml, selectedBranch]);

  const handleExportPdf = useCallback(async (singleStudent?: any) => {
    const targetList = singleStudent ? [singleStudent] : students;
    if (targetList.length === 0) {
      Alert.alert('No Data', 'No students to export.');
      return;
    }
    setPdfLoading(true);
    try {
      const branchName = singleStudent
        ? (branches.find(b => b.id?.toString() === singleStudent.branch_id?.toString())?.name || 'Student')
        : (selectedBranch?.name || 'All_Branches');
      const dateStr = new Date().toISOString().split('T')[0];
      const html = singleStudent ? generateSingleReportHtml(singleStudent) : generateFullReportHtml(students);

      const { uri } = await Print.printToFileAsync({ html });
      const fileName = singleStudent
        ? `${(singleStudent.name || 'Student').replace(/[^a-z0-9]/gi, '_')}_${dateStr}.pdf`
        : `Students_${branchName.replace(/\s+/g, '_')}_${dateStr}.pdf`;
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: singleStudent ? 'Share Student Profile' : 'Share Student Report' });
    } catch (e) {
      console.error('PDF Error:', e);
      Alert.alert('Error', `Failed to generate PDF: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setPdfLoading(false);
    }
  }, [students, selectedBranch, branches, generateFullReportHtml, generateSingleReportHtml]);

  return (
    <View style={{ flex: 1 }} className="bg-white dark:bg-gray-900">
      <View style={{ paddingTop: Math.max(insets.top, 20), paddingHorizontal: 24, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <TouchableOpacity onPress={() => navigation.goBack()}
            style={{ backgroundColor: '#FFFFFF', width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' }}>
            <MaterialCommunityIcons name="arrow-left" size={22} color='#111827' />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: '#6B7280' }}>Master Admin</Text>
            <Text style={{ fontSize: 24, fontWeight: '900', letterSpacing: -0.5, color: '#111827' }}>Student Info</Text>
          </View>
          <TouchableOpacity
            onPress={handleExportPdf}
            disabled={pdfLoading}
            style={{ backgroundColor: pdfLoading ? '#9CA3AF' : '#3B82F6', width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
          >
            {pdfLoading ? <ActivityIndicator color="white" /> : <MaterialCommunityIcons name="file-pdf-box" size={24} color="white" />}
          </TouchableOpacity>
        </View>
        {isMasterAdmin && <BranchFilter selectedBranchId={branchFilterId} onSelect={setBranchFilterId} />}
      </View>

      <ScrollView
        style={{ flex: 1, paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" colors={['#F59E0B']} />}
      >
        <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: '#6B7280', marginBottom: 12 }}>
          {students.length} Student(s)
        </Text>

        {students.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40, opacity: 0.4 }}>
            <MaterialCommunityIcons name="account-off-outline" size={50} color='#9CA3AF' />
            <Text style={{ fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 2, color: '#9CA3AF', marginTop: 12 }}>No Students Found</Text>
          </View>
        ) : (
          <>
            {paginatedStudents.map(student => {
              const branch = branches.find(b => b.id?.toString() === student.branch_id?.toString());
              return (
                <TouchableOpacity
                  key={student.id}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('studentDetail', { studentId: student.id })}
                  style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 10, elevation: 4, borderWidth: 1, borderColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center' }}
                >
                  <View style={{ backgroundColor: '#3B82F6', width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                    <Text style={{ color: 'white', fontWeight: '900', fontSize: 18 }}>{student.name?.[0]?.toUpperCase() || '?'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '900', fontSize: 15, color: '#111827' }}>{student.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', gap: 6 }}>
                      <View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                        <Text style={{ fontSize: 9, fontWeight: '900', color: '#6B7280' }}>ID: {student.studentId || student.id}</Text>
                      </View>
                      {branch && (
                        <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                          <Text style={{ fontSize: 9, fontWeight: '900', color: '#92400E' }}>{branch.name}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleExportPdf(student)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}
                  >
                    <MaterialCommunityIcons name="file-pdf-box" size={18} color="#EF4444" />
                  </TouchableOpacity>
                  <MaterialCommunityIcons name="chevron-right" size={22} color='#9CA3AF' />
                </TouchableOpacity>
              );
            })}
            {hasMore && (
              <TouchableOpacity
                onPress={loadMore}
                activeOpacity={0.8}
                style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed' }}
              >
                <MaterialCommunityIcons name="chevron-double-down" size={22} color='#6B7280' />
                <Text style={{ fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#6B7280', marginTop: 4 }}>
                  Load More ({students.length - paginatedStudents.length} remaining)
                </Text>
              </TouchableOpacity>
            )}
            {!hasMore && students.length > PAGE_SIZE && (
              <Text style={{ textAlign: 'center', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: '#9CA3AF', paddingVertical: 12 }}>
                All {students.length} students loaded
              </Text>
            )}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}
