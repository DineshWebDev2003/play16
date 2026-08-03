import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StatusBar, Modal, Switch, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import api, { fetchMaintenanceStatus } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Props { navigation: { navigate: (s: string) => void; goBack: () => void } }

export default function MaintenanceScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === 'dark';
  const [busy, setBusy] = useState<string | null>(null);
  const [termVisible, setTermVisible] = useState(false);
  const [termTitle, setTermTitle] = useState('');
  const [termLines, setTermLines] = useState<string[]>([]);
  const [termOk, setTermOk] = useState(false);
  const [maintenanceOn, setMaintenanceOn] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState('');

  React.useEffect(() => {
    (async () => {
      const status = await fetchMaintenanceStatus();
      setMaintenanceOn(!!status.enabled);
      setMaintenanceMsg(status.message || '');
    })();
  }, []);

  const textPrimary = isDark ? '#FFFFFF' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#6B7280';

  const showTerminal = (title: string, raw: string, ok: boolean) => {
    setTermTitle(title);
    setTermOk(ok);
    setTermLines([
      '$ php artisan ' + title.toLowerCase(),
      '',
      ...String(raw || '').split(/\r?\n/).map(l => l.trimEnd()),
      '',
      ok ? '✓ command finished successfully.' : '✗ command exited with an error.',
    ]);
    setTermVisible(true);
  };

  const runMigrate = async () => {
    setBusy('migrate');
    setTermLines(['$ php artisan migrate --force', '', 'Running...']);
    setTermVisible(true);
    setTermTitle('migrate --force');
    try {
      const res = await api.post('/maintenance/migrate');
      showTerminal('migrate --force', res.data?.output || res.data?.message || 'No output.', true);
    } catch (e: any) {
      showTerminal('migrate --force', e?.response?.data?.message || e?.message || 'Could not run migrations.', false);
    } finally {
      setBusy(null);
    }
  };

  const runStorageCheck = async () => {
    setBusy('storage');
    setTermLines(['$ php artisan storage:link', '', 'Checking...']);
    setTermVisible(true);
    setTermTitle('storage:link');
    try {
      const res = await api.get('/maintenance/storage-check');
      showTerminal('storage:link', res.data?.message || 'Check complete.', res.data?.linked === true);
    } catch (e: any) {
      showTerminal('storage:link', e?.response?.data?.message || e?.message || 'Storage check failed.', false);
    } finally {
      setBusy(null);
    }
  };

  const runStorageFix = async () => {
    setBusy('storage-fix');
    setTermLines(['$ php artisan storage:fix', '', 'Repairing public/storage...']);
    setTermVisible(true);
    setTermTitle('storage:fix');
    try {
      const res = await api.post('/maintenance/storage-fix');
      const msg = res.data?.message || 'Storage fixed.';
      const removed = res.data?.removed === true;
      showTerminal('storage:fix', msg, removed);
    } catch (e: any) {
      showTerminal('storage:fix', e?.response?.data?.message || e?.message || 'Storage fix failed.', false);
    } finally {
      setBusy(null);
    }
  };

  const toggleMaintenance = async (value: boolean) => {
    setBusy('maintenance');
    try {
      const res = await api.post('/maintenance/toggle', {
        enabled: value,
        message: maintenanceMsg,
      });
      setMaintenanceOn(value);
      Alert.alert('Maintenance Mode', res.data?.message || 'Updated.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Could not update maintenance mode.');
    } finally {
      setBusy(null);
    }
  };

  const card = (icon: string, title: string, desc: string, color: string, action: string, onPress: () => void, buttonLabel: string) => (
    <View style={{
      marginBottom: 16, borderRadius: 20, padding: 20,
      backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF',
      borderWidth: 1, borderColor: isDark ? '#262626' : '#F3F4F6', elevation: 3,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ backgroundColor: color, width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name={icon as any} size={24} color="#fff" />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={{ fontSize: 15, fontWeight: '900', color: textPrimary }}>{title}</Text>
          <Text style={{ fontSize: 11, fontWeight: '600', color: textSecondary, marginTop: 3 }}>{desc}</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={onPress}
        disabled={busy !== null}
        activeOpacity={0.85}
        style={{ marginTop: 16, height: 46, borderRadius: 14, backgroundColor: color, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
      >
        {busy === action ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 }}>{buttonLabel}</Text>}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#F8F6F0' }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#1c1c14' : '#F8F6F0'} />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: isDark ? '#2d2d24' : '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? '#333' : '#E5E7EB' }}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={textPrimary} />
        </TouchableOpacity>
        <Text style={{ marginLeft: 12, fontSize: 18, fontWeight: '900', color: textPrimary }}>System Maintenance</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 16, borderRadius: 18, marginBottom: 18, backgroundColor: isDark ? '#2d2d24' : '#FFFBEB', borderWidth: 1, borderColor: '#F59E0B' }}>
          <Text style={{ fontSize: 11, fontWeight: '900', color: '#B45309', textTransform: 'uppercase', letterSpacing: 1 }}>For hosts without terminal/SSH access</Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: textSecondary, marginTop: 6, lineHeight: 17 }}>
            You can run migrations and fix storage linking straight from the app — no command line needed. These actions are master-admin only and open a terminal window showing the result.
          </Text>
        </View>

        {user?.role === 'master_admin' && (
          <View style={{
            marginBottom: 16, borderRadius: 20, padding: 20,
            backgroundColor: maintenanceOn ? (isDark ? '#3a2e1c' : '#FFF7ED') : (isDark ? '#1e1e1e' : '#FFFFFF'),
            borderWidth: 1, borderColor: maintenanceOn ? '#F59E0B' : (isDark ? '#262626' : '#F3F4F6'), elevation: 3,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ backgroundColor: maintenanceOn ? '#DC2626' : '#10B981', width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name={maintenanceOn ? 'progress-wrench' : 'shield-check'} size={24} color="#fff" />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ fontSize: 15, fontWeight: '900', color: textPrimary }}>Maintenance Mode</Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: textSecondary, marginTop: 3 }}>
                  {maintenanceOn ? 'ON — all other users are blocked with the maintenance popup.' : 'OFF — everyone can use the app normally.'}
                </Text>
              </View>
              <Switch
                value={maintenanceOn}
                onValueChange={toggleMaintenance}
                disabled={busy !== null}
                trackColor={{ false: isDark ? '#3f3f3f' : '#D1D5DB', true: '#DC2626' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <TextInput
              value={maintenanceMsg}
              onChangeText={setMaintenanceMsg}
              placeholder="Optional message shown to users (e.g. 'Back by 6 PM')"
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              multiline
              style={{
                marginTop: 14, minHeight: 64, borderRadius: 12, padding: 12,
                backgroundColor: isDark ? '#262626' : '#F9FAFB',
                color: textPrimary, fontSize: 13, fontWeight: '600',
                borderWidth: 1, borderColor: isDark ? '#333' : '#E5E7EB',
                textAlignVertical: 'top',
              }}
            />
          </View>
        )}

        {card('database-sync', 'Run Database Migrations', 'Apply any pending database schema changes (equivalent to php artisan migrate --force).', '#7C3AED', 'migrate', runMigrate, 'RUN MIGRATIONS')}
        {card('folder-check', 'Check / Fix Storage Link', 'Verify uploaded files are reachable. Attempts to create public/storage. Files also auto-serve via the web route without a link.', '#0D9488', 'storage', runStorageCheck, 'CHECK STORAGE')}
        {card('broken-image', 'Fix Image 403 Errors', 'If uploaded images return 403, removes the stale public/storage entry so the web route streams files from disk. Safe; no files are deleted.', '#DC2626', 'storage-fix', runStorageFix, 'FIX STORAGE')}
      </ScrollView>

      <Modal visible={termVisible} transparent animationType="fade" onRequestClose={() => setTermVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <View style={{
            width: '100%', maxHeight: '85%',
            backgroundColor: '#0D1117', borderRadius: 16, overflow: 'hidden',
            borderWidth: 1, borderColor: termOk ? '#238636' : '#F85149',
          }}>
            {/* Title bar */}
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#161B22' }}>
              <View style={{ flexDirection: 'row' }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF5F56', marginRight: 6 }} />
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFBD2E', marginRight: 6 }} />
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#27C93F' }} />
              </View>
              <Text style={{ color: '#C9D1D9', fontSize: 12, fontFamily: 'monospace', marginLeft: 12, fontWeight: '700' }}>
                {termOk ? 'bash — success' : 'bash — error'}
              </Text>
              <View style={{ flex: 1 }} />
              {busy !== null && <ActivityIndicator color="#F59E0B" size="small" />}
              <TouchableOpacity onPress={() => setTermVisible(false)} style={{ marginLeft: 12, padding: 2 }}>
                <Text style={{ color: '#8B949E', fontSize: 16, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Terminal body */}
            <ScrollView
              showsVerticalScrollIndicator
              style={{ backgroundColor: '#0D1117', maxHeight: 360, padding: 14 }}
            >
              {termLines.map((line, i) => {
                const isCmd = line.startsWith('$ ');
                const isOk = line.startsWith('✓');
                const isErr = line.startsWith('✗');
                return (
                  <Text key={i} style={{
                    color: isErr ? '#F85149' : isOk ? '#3FB950' : isCmd ? '#58A6FF' : '#C9D1D9',
                    fontFamily: 'monospace', fontSize: 12, lineHeight: 18,
                  }}>
                    {line}
                  </Text>
                );
              })}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Text style={{ color: '#3FB950', fontFamily: 'monospace', fontSize: 12 }}>➜&nbsp;</Text>
                <Text style={{ color: '#58A6FF', fontFamily: 'monospace', fontSize: 12 }}>~</Text>
                <Text style={{ backgroundColor: '#C9D1D9', width: 8, height: 14, marginLeft: 4 }} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}