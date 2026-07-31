import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';

interface Props { navigation: { navigate: (s: string) => void; goBack: () => void } }

const subjects = ['Mathematics', 'Science', 'English', 'Tamil', 'Social Science'];

export default function TuitionPostProgressScreen({ navigation }: Props) {
  const { user, users } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const tuitionStudents = useMemo(() =>
    users.filter(u => u.role === 'tuition_student' && u.status === 'active'),
  [users]);

  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedStudent) { Alert.alert('Required', 'Select a student.'); return; }
    setSubmitting(true);
    try {
      const progressData = subjects.map(s => ({
        subject: s,
        marks: marks[s] || null,
        grade: grades[s] || null,
      }));
      await api.post('/progress', {
        student_id: selectedStudent.id,
        teacher_id: user?.id,
        progress: progressData,
        comments,
      });
      Alert.alert('Success', 'Progress posted.');
      setSelectedStudent(null);
      setMarks({});
      setGrades({});
      setComments('');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to post progress.');
    }
    setSubmitting(false);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFF8F0' }}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <TouchableOpacity onPress={() => navigation.goBack()}
              style={{ backgroundColor: isDark ? '#2a2a28' : '#FFFFFF', borderWidth: 2, borderColor: isDark ? '#3a3a38' : 'rgba(245,158,11,0.3)', width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.7}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={isDark ? '#FFFFFF' : '#1F2937'} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ backgroundColor: '#F59E0B', padding: 8, borderRadius: 12 }}>
                <MaterialCommunityIcons name="chart-line" size={22} color="white" />
              </View>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#F59E0B', marginLeft: 10 }}>Post Progress</Text>
            </View>
          </View>

          <View style={{ backgroundColor: isDark ? '#2a2a28' : '#FFFFFF', borderWidth: 2, borderColor: isDark ? '#3a3a38' : 'rgba(245,158,11,0.2)', borderRadius: 24, padding: 20, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <MaterialCommunityIcons name="account-school" size={18} color="#F59E0B" />
              </View>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '900', color: isDark ? '#FFFFFF' : '#111827' }}>Select Student</Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: isDark ? '#6B7280' : '#9CA3AF' }}>Choose who to post progress for</Text>
              </View>
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setShowStudentPicker(true)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderRadius: 16, borderWidth: 2, backgroundColor: selectedStudent ? '#F59E0B' : (isDark ? '#1e1e1c' : 'rgba(245,158,11,0.05)'), borderColor: selectedStudent ? '#F59E0B' : (isDark ? '#3a3a38' : 'rgba(245,158,11,0.2)') }}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: selectedStudent ? 'rgba(255,255,255,0.2)' : (isDark ? '#2a2a28' : 'rgba(245,158,11,0.15)'), alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <MaterialCommunityIcons name="account" size={20} color={selectedStudent ? 'white' : '#F59E0B'} />
              </View>
              <Text style={{ flex: 1, fontWeight: '700', fontSize: 14, color: selectedStudent ? 'white' : (isDark ? '#D1D5DB' : '#374151') }}>
                {selectedStudent ? selectedStudent.name : 'Tap to select student'}
              </Text>
              {selectedStudent ? (
                <TouchableOpacity onPress={() => setSelectedStudent(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <MaterialCommunityIcons name="close-circle" size={20} color="white" />
                </TouchableOpacity>
              ) : (
                <MaterialCommunityIcons name="chevron-down" size={20} color={isDark ? '#6B7280' : '#9CA3AF'} />
              )}
            </TouchableOpacity>
          </View>

          {selectedStudent && (
            <View style={{ backgroundColor: isDark ? '#2a2a28' : '#FFFFFF', borderWidth: 2, borderColor: isDark ? '#3a3a38' : 'rgba(245,158,11,0.2)', borderRadius: 24, padding: 20, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <MaterialCommunityIcons name="book-education" size={18} color="#F59E0B" />
                </View>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: isDark ? '#FFFFFF' : '#111827' }}>Subject Marks & Grades</Text>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: isDark ? '#6B7280' : '#9CA3AF' }}>Enter marks or grade per subject</Text>
                </View>
              </View>
              {subjects.map(s => (
                <View key={s} style={{ marginBottom: 16, padding: 16, borderRadius: 16, backgroundColor: isDark ? '#1e1e1c' : 'rgba(245,158,11,0.05)', borderWidth: 2, borderColor: isDark ? '#3a3a38' : 'rgba(245,158,11,0.15)' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 12, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <MaterialCommunityIcons name="book" size={16} color="white" />
                    </View>
                    <Text style={{ fontWeight: '900', fontSize: 14, color: isDark ? '#FFFFFF' : '#111827' }}>{s}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: 4, marginLeft: 4 }}>MARKS</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#2a2a28' : '#FFFFFF', borderWidth: 2, borderColor: isDark ? '#3a3a38' : 'rgba(245,158,11,0.2)', borderRadius: 16, paddingHorizontal: 12, height: 44 }}>
                        <MaterialCommunityIcons name="numeric" size={16} color="#F59E0B" />
                        <TextInput style={{ flex: 1, fontWeight: '700', fontSize: 14, marginLeft: 8, color: isDark ? '#FFFFFF' : '#111827' }}
                          value={marks[s] || ''} onChangeText={t => setMarks(prev => ({ ...prev, [s]: t }))}
                          placeholder="e.g. 85" placeholderTextColor="#9CA3AF" keyboardType="numeric" />
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: 4, marginLeft: 4 }}>GRADE</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#2a2a28' : '#FFFFFF', borderWidth: 2, borderColor: isDark ? '#3a3a38' : 'rgba(245,158,11,0.2)', borderRadius: 16, paddingHorizontal: 12, height: 44 }}>
                        <MaterialCommunityIcons name="school" size={16} color="#F59E0B" />
                        <TextInput style={{ flex: 1, fontWeight: '700', fontSize: 14, marginLeft: 8, color: isDark ? '#FFFFFF' : '#111827' }}
                          value={grades[s] || ''} onChangeText={t => setGrades(prev => ({ ...prev, [s]: t }))}
                          placeholder="e.g. A+" placeholderTextColor="#9CA3AF" />
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {selectedStudent && (
            <View style={{ backgroundColor: isDark ? '#2a2a28' : '#FFFFFF', borderWidth: 2, borderColor: isDark ? '#3a3a38' : 'rgba(245,158,11,0.2)', borderRadius: 24, padding: 20, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <MaterialCommunityIcons name="comment-text" size={18} color="#F59E0B" />
                </View>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: isDark ? '#FFFFFF' : '#111827' }}>Comments</Text>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: isDark ? '#6B7280' : '#9CA3AF' }}>Overall remarks (optional)</Text>
                </View>
              </View>
              <View style={{ backgroundColor: isDark ? '#1e1e1c' : 'rgba(245,158,11,0.05)', borderWidth: 2, borderColor: isDark ? '#3a3a38' : 'rgba(245,158,11,0.15)', borderRadius: 16, paddingHorizontal: 16, paddingTop: 14 }}>
                <TextInput style={{ fontWeight: '600', fontSize: 14, lineHeight: 20, paddingBottom: 12, color: isDark ? '#D1D5DB' : '#374151' }}
                  placeholder="Write your remarks about the student's progress..." placeholderTextColor="#9CA3AF"
                  multiline numberOfLines={4} textAlignVertical="top" value={comments} onChangeText={setComments} />
              </View>
            </View>
          )}

          {selectedStudent && (
            <TouchableOpacity onPress={handleSubmit} disabled={submitting}
              style={{ paddingVertical: 16, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginBottom: 40, backgroundColor: '#F59E0B' }} activeOpacity={0.8}>
              {submitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <><MaterialCommunityIcons name="send" size={22} color="#FFF" /><Text style={{ color: 'white', fontWeight: '900', fontSize: 16, marginLeft: 10 }}>Post Progress</Text></>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal transparent visible={showStudentPicker} onRequestClose={() => setShowStudentPicker(false)} animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowStudentPicker(false)} />
          <View style={{ backgroundColor: isDark ? '#1c1c14' : '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '60%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#FFFFFF' : '#111827' }}>Select Student</Text>
              <TouchableOpacity onPress={() => setShowStudentPicker(false)} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="close" size={22} color="#EF4444" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {tuitionStudents.length === 0 ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <MaterialCommunityIcons name="account-group-outline" size={48} color="#9CA3AF" />
                  <Text style={{ color: isDark ? '#6B7280' : '#9CA3AF', fontWeight: '700', fontSize: 14, marginTop: 12 }}>No students available</Text>
                </View>
              ) : tuitionStudents.map(st => (
                <TouchableOpacity key={st.id} activeOpacity={0.7} onPress={() => { setSelectedStudent(st); setShowStudentPicker(false); }}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 8, backgroundColor: isDark ? '#2a2a28' : 'rgba(245,158,11,0.05)', borderWidth: 2, borderColor: isDark ? '#3a3a38' : 'rgba(245,158,11,0.15)' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <MaterialCommunityIcons name="school" size={20} color="white" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '900', fontSize: 14, color: isDark ? '#FFFFFF' : '#111827' }}>{st.name}</Text>
                    <Text style={{ fontWeight: '700', fontSize: 12, color: isDark ? '#6B7280' : '#9CA3AF' }}>@{st.username}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#F59E0B" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
