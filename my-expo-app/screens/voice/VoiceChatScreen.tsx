import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, FlatList, Alert, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform, Image, Linking, Animated, Keyboard,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api, { getMediaUrl } from '../../services/api';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
}

interface ContactUser {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  phone?: string;
  father_phone?: string;
  mother_phone?: string;
  guardian_phone?: string;
}

interface Conversation {
  user: ContactUser;
  last_message: { id: string; audio_url: string; message?: string; duration: number; from_me: boolean; created_at: string };
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  audio_url: string;
  message?: string;
  duration: number;
  from_me: boolean;
  is_read: boolean;
  created_at: string;
}

const PINK = '#EC4899';
const CYAN = '#06B6D4';

const roleLabel = (role: string) => {
  switch (role) {
    case 'nanny': return 'Nanny';
    case 'admin': return 'School Admin';
    case 'master_admin': return 'Master Admin';
    case 'student': return 'Parent';
    case 'teacher': return 'Teacher';
    default: return role;
  }
};

const roleColor = (role: string) => {
  switch (role) {
    case 'nanny': return '#06B6D4';
    case 'admin': return '#7C3AED';
    case 'master_admin': return '#EF4444';
    case 'student': return '#3B82F6';
    case 'teacher': return '#F59E0B';
    default: return '#6B7280';
  }
};

const roleIcon = (role: string) => {
  switch (role) {
    case 'nanny': return 'baby-face-outline';
    case 'student': return 'account-heart-outline';
    default: return 'shield-account-outline';
  }
};

const getContactLabel = (role: string) => {
  if (role === 'student') return 'Parents';
  if (role === 'nanny') return 'Nannies';
  return 'Staff';
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${m} ${ampm}`;
};

const Equalizer = ({ active, color }: { active: boolean; color: string }) => {
  const bar1 = useRef(new Animated.Value(0.3)).current;
  const bar2 = useRef(new Animated.Value(0.5)).current;
  const bar3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (active) {
      const anims = [bar1, bar2, bar3].map((b, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(b, { toValue: 1, duration: 260 + i * 90, useNativeDriver: true }),
            Animated.timing(b, { toValue: 0.3, duration: 260 + i * 90, useNativeDriver: true }),
          ])
        )
      );
      anims.forEach(a => a.start());
      return () => anims.forEach(a => a.stop());
    } else {
      bar1.setValue(0.3);
      bar2.setValue(0.5);
      bar3.setValue(0.3);
    }
  }, [active]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 16, marginHorizontal: 4 }}>
      {[bar1, bar2, bar3].map((b, i) => (
        <Animated.View key={i} style={{ width: 3, marginHorizontal: 1.5, borderRadius: 2, backgroundColor: color, height: 16, transform: [{ scaleY: b }] }} />
      ))}
    </View>
  );
};

export default function VoiceChatScreen({ navigation }: Props) {
  const { user, users } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeContact, setActiveContact] = useState<ContactUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRecipientPicker, setShowRecipientPicker] = useState(false);
  const [search, setSearch] = useState('');
  const [showCallPicker, setShowCallPicker] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Recording state
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recordTimer = useRef<any>(null);

  // Playback state
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Text message state
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<any>>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/voice-messages/conversations');
      setConversations(res.data || []);
    } catch (err) {
      console.error('Fetch conversations error:', err);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true }).catch(() => {});
    const kShow = Keyboard.addListener('keyboardDidShow', e => setKeyboardHeight(e.endCoordinates.height));
    const kHide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
      recordTimer.current && clearInterval(recordTimer.current);
      kShow.remove();
      kHide.remove();
    };
  }, []);

  const openChat = async (contact: ContactUser) => {
    setActiveContact(contact);
    setMessages([]);
    setDraft('');
    setLoading(true);
    try {
      const res = await api.get(`/voice-messages/with/${contact.id}`);
      setMessages(res.data || []);
      await api.post('/voice-messages/read', { sender_id: contact.id });
      await fetchConversations();
    } catch (err) {
      console.error('Fetch messages error:', err);
    } finally {
      setLoading(false);
    }
  };

  const closeChat = () => {
    soundRef.current?.unloadAsync().catch(() => {});
    setActiveContact(null);
    setMessages([]);
    setDraft('');
    fetchConversations();
  };

  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Needed', 'Microphone permission is required to record voice messages.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordSeconds(0);
      recordTimer.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
    } catch (err) {
      console.error('Start recording error:', err);
      Alert.alert('Error', 'Could not start recording.');
    }
  };

  const stopRecording = async () => {
    const recording = recordingRef.current;
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      recordTimer.current && clearInterval(recordTimer.current);
      setIsRecording(false);
      const uri = recording.getURI();
      recordingRef.current = null;
      if (uri && activeContact) {
        await sendVoice(uri);
      }
    } catch (err) {
      console.error('Stop recording error:', err);
      setIsRecording(false);
    }
  };

  const cancelRecording = async () => {
    const recording = recordingRef.current;
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      recordTimer.current && clearInterval(recordTimer.current);
      recordingRef.current = null;
      setIsRecording(false);
    } catch (err) {
      console.error('Cancel recording error:', err);
      setIsRecording(false);
    }
  };

  const sendVoice = async (uri: string) => {
    if (!activeContact) return;
    setSending(true);
    try {
      const filename = uri.split('/').pop() || 'voice.m4a';
      const formData = new FormData();
      // @ts-ignore
      formData.append('receiver_id', activeContact.id);
      formData.append('duration', String(recordSeconds || 0));
      // @ts-ignore
      formData.append('audio_file', {
        uri,
        name: filename,
        type: 'audio/m4a',
      });
      await api.post('/voice-messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await openChat(activeContact);
    } catch (err: any) {
      console.error('Send voice error:', err);
      Alert.alert('Error', err?.response?.data?.message || 'Failed to send voice message.');
    } finally {
      setSending(false);
    }
  };

  const sendText = async () => {
    const text = draft.trim();
    if (!text || !activeContact || sending) return;
    setSending(true);
    const tempId = `temp-${Date.now()}`;
    const tempMsg: Message = {
      id: tempId,
      sender_id: String(user?.id),
      receiver_id: activeContact.id,
      audio_url: '',
      message: text,
      duration: 0,
      from_me: true,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setDraft('');
    try {
      await api.post('/voice-messages', {
        receiver_id: activeContact.id,
        message: text,
      });
      const res = await api.get(`/voice-messages/with/${activeContact.id}`);
      setMessages(res.data || []);
      await fetchConversations();
    } catch (err: any) {
      console.error('Send text error:', err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      Alert.alert('Error', err?.response?.data?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = (msg: Message) => {
    if (!msg.from_me) return;
    Alert.alert(
      'Delete Message',
      'Delete this message for everyone?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/voice-messages/${msg.id}`);
              setMessages(prev => prev.filter(m => m.id !== msg.id));
              await fetchConversations();
            } catch (err) {
              console.error('Delete error:', err);
              Alert.alert('Error', 'Failed to delete message.');
            }
          },
        },
      ]
    );
  };

  const togglePlay = async (msg: Message) => {
    try {
      if (playingId === msg.id) {
        soundRef.current?.unloadAsync().catch(() => {});
        soundRef.current = null;
        setPlayingId(null);
        return;
      }
      soundRef.current?.unloadAsync().catch(() => {});
      const url = getMediaUrl(msg.audio_url);
      if (!url) return;
      const { sound } = await Audio.Sound.createAsync({ uri: url });
      soundRef.current = sound;
      setPlayingId(msg.id);
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingId(null);
        }
      });
      await sound.playAsync();
    } catch (err) {
      console.error('Play error:', err);
      setPlayingId(null);
    }
  };

  const formatDuration = (secs: number) => {
    if (!secs) return '0:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const buildCallNumbers = (contact: ContactUser | null): Array<{ label: string; number: string }> => {
    if (!contact) return [];
    const nums: Array<{ label: string; number: string }> = [];
    if (contact.phone) nums.push({ label: contact.role === 'student' ? 'Personal' : 'Phone', number: contact.phone });
    if (contact.father_phone) nums.push({ label: 'Father', number: contact.father_phone });
    if (contact.mother_phone) nums.push({ label: 'Mother', number: contact.mother_phone });
    if (contact.guardian_phone) nums.push({ label: 'Guardian', number: contact.guardian_phone });
    return nums;
  };

  const handleCall = (contact: ContactUser) => {
    const nums = buildCallNumbers(contact);
    if (nums.length === 0) {
      Alert.alert('No Number', 'No phone number available for this contact.');
      return;
    }
    if (nums.length === 1) {
      Linking.openURL(`tel:${nums[0].number}`);
      return;
    }
    setShowCallPicker(true);
  };

  const makeCall = (number: string) => {
    setShowCallPicker(false);
    Linking.openURL(`tel:${number}`);
  };

  const renderTicks = (msg: Message) => {
    if (!msg.from_me) return null;
    const color = msg.is_read ? '#34D399' : 'rgba(255,255,255,0.75)';
    return (
      <MaterialCommunityIcons
        name={msg.is_read ? 'check-all' : 'check'}
        size={12}
        color={color}
      />
    );
  };

  // ── Conversation list data (must stay above early returns for hook order) ──
  const contactGroups = ['student', 'admin', 'nanny', 'master_admin', 'teacher'];

  const recipients = useMemo(() => {
    if (!user) return [];
    return users
      .filter(u => String(u.id) !== String(user.id) && u.status === 'active')
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users, user]);

  const recipientGroups = useMemo(() => {
    return contactGroups
      .map(group => ({ group, items: recipients.filter(r => r.role === group) }))
      .filter(g => g.items.length > 0);
  }, [recipients]);

  const pickerItems = useMemo(() => {
    const items: Array<{ type: 'header'; key: string; group: string; count: number } | { type: 'contact'; key: string; contact: ContactUser }> = [];
    recipientGroups.forEach(g => {
      items.push({ type: 'header', key: `header-${g.group}`, group: g.group, count: g.items.length });
      g.items.forEach(c => {
        items.push({
          type: 'contact',
          key: `contact-${g.group}-${c.id}`,
          contact: {
            id: String(c.id),
            name: c.name,
            role: c.role,
            avatar: c.avatar,
            phone: c.phone,
            father_phone: c.fatherPhone,
            mother_phone: c.motherPhone,
            guardian_phone: c.guardianPhone,
          },
        });
      });
    });
    return items;
  }, [recipientGroups]);

  const filteredPickerItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pickerItems;
    const items: Array<{ type: 'header'; key: string; group: string; count: number } | { type: 'contact'; key: string; contact: ContactUser }> = [];
    recipientGroups.forEach(g => {
      const matched = g.items.filter(c => c.name.toLowerCase().includes(q));
      if (matched.length === 0) return;
      items.push({ type: 'header', key: `header-${g.group}`, group: g.group, count: matched.length });
      matched.forEach(c => items.push({
        type: 'contact',
        key: `contact-${g.group}-${c.id}`,
        contact: {
          id: String(c.id),
          name: c.name,
          role: c.role,
          avatar: c.avatar,
          phone: c.phone,
          father_phone: c.fatherPhone,
          mother_phone: c.motherPhone,
          guardian_phone: c.guardianPhone,
        },
      }));
    });
    return items;
  }, [search, pickerItems, recipientGroups]);

  const contactAvatarUrl = (contact: ContactUser | null) => {
    if (!contact?.avatar) return undefined;
    return getMediaUrl(contact.avatar);
  };

  const callNumbers = buildCallNumbers(activeContact);

  const renderComposerInner = () => (
    <>
      {isRecording ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#262626' : '#FFFFFF', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: isDark ? '#333' : '#FCE7F3' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(239,68,68,0.4)' }} />
            </View>
            <Text style={{ marginLeft: 10, fontWeight: '900', fontSize: 14, color: isDark ? '#FFF' : '#1F2937' }}>Recording… {recordSeconds}s</Text>
          </View>
          <TouchableOpacity onPress={cancelRecording} activeOpacity={0.9} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
          <TouchableOpacity onPress={stopRecording} activeOpacity={0.9} style={{ backgroundColor: PINK, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="send" size={18} color="white" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', backgroundColor: isDark ? '#262626' : '#FFFFFF', borderRadius: 22, paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderColor: isDark ? '#333' : '#F3F4F6' }}>
          <TouchableOpacity
            onPressIn={startRecording}
            onPressOut={stopRecording}
            delayLongPress={120}
            activeOpacity={0.9}
            disabled={sending}
            style={{ backgroundColor: sending ? '#F9A8D4' : PINK, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
          >
            {sending ? <ActivityIndicator color="white" /> : <MaterialCommunityIcons name="microphone" size={20} color="white" />}
          </TouchableOpacity>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Type a message…"
            placeholderTextColor="#9CA3AF"
            multiline
            style={{ flex: 1, marginHorizontal: 10, fontSize: 15, fontWeight: '700', color: isDark ? '#FFF' : '#111827', maxHeight: 100, paddingVertical: 8 }}
          />
          <TouchableOpacity
            onPress={sendText}
            activeOpacity={0.85}
            disabled={!draft.trim() || sending}
            style={{ backgroundColor: draft.trim() && !sending ? CYAN : (isDark ? '#333' : '#E5E7EB'), width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
          >
            <MaterialCommunityIcons name="send" size={20} color={draft.trim() && !sending ? 'white' : '#9CA3AF'} />
          </TouchableOpacity>
        </View>
      )}
      {!isRecording && (
        <Text style={{ textAlign: 'center', fontSize: 9, fontWeight: '700', color: '#9CA3AF', marginTop: 6 }}>
          Hold mic to record · Release to send · Long-press a message to delete
        </Text>
      )}
    </>
  );

  // ── Chat thread view ──
  if (activeContact) {
    return (
      <View style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FDF2F8' }}>
        {/* Header */}
        <LinearGradient
          colors={isDark ? ['#0E7490', '#155E75'] : ['#06B6D4', '#0891B2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: 16, paddingHorizontal: 16 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={closeChat} activeOpacity={0.8} style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => Alert.alert(activeContact.name, `${roleLabel(activeContact.role)}\n${activeContact.phone || 'No phone listed'}`)}
              style={{ marginLeft: 12, width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', overflow: 'hidden' }}
            >
              {contactAvatarUrl(activeContact) ? (
                <Image source={{ uri: contactAvatarUrl(activeContact) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <MaterialCommunityIcons name={roleIcon(activeContact.role)} size={24} color={roleColor(activeContact.role)} />
              )}
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: 'white', fontSize: 17, fontWeight: '900', letterSpacing: -0.5 }} numberOfLines={1}>{activeContact.name}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 2 }}>
                {roleLabel(activeContact.role)} · Chat
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleCall(activeContact)} activeOpacity={0.8} style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
              <MaterialCommunityIcons name="phone" size={22} color="white" />
            </TouchableOpacity>
            {isRecording && (
              <TouchableOpacity onPress={cancelRecording} activeOpacity={0.8} style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="close" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <ActivityIndicator color={PINK} />
              </View>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: isDark ? '#262626' : '#FDF2F8', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {contactAvatarUrl(activeContact) ? (
                    <Image source={{ uri: contactAvatarUrl(activeContact) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <MaterialCommunityIcons name={roleIcon(activeContact.role)} size={28} color={roleColor(activeContact.role)} />
                  )}
                </View>
                <Text style={{ fontSize: 15, fontWeight: '900', color: isDark ? '#FFF' : '#111827', marginTop: 12 }}>
                  Say Hello to {activeContact.name.split(' ')[0]} 👋
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF', marginTop: 6 }}>
                  Type a text or hold the mic to record
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: item.from_me ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
              {!item.from_me && (
                <View style={{ width: 30, height: 30, borderRadius: 15, marginRight: 8, backgroundColor: isDark ? '#262626' : '#FFFFFF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {contactAvatarUrl(activeContact) ? (
                    <Image source={{ uri: contactAvatarUrl(activeContact) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <MaterialCommunityIcons name={roleIcon(activeContact.role)} size={14} color={roleColor(activeContact.role)} />
                  )}
                </View>
              )}
              <TouchableOpacity
                activeOpacity={0.95}
                delayLongPress={500}
                onLongPress={() => item.from_me && deleteMessage(item)}
                style={{ maxWidth: '80%' }}
              >
                {item.audio_url ? (
                  <View
                    style={{
                      backgroundColor: item.from_me ? PINK : (isDark ? '#262626' : '#FFFFFF'),
                      borderRadius: 18,
                      borderBottomRightRadius: item.from_me ? 6 : 18,
                      borderBottomLeftRadius: item.from_me ? 18 : 6,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: item.from_me ? PINK : (isDark ? '#333' : '#FCE7F3'),
                    }}
                  >
                    <TouchableOpacity onPress={() => togglePlay(item)} activeOpacity={0.8}>
                      <View
                        style={{ backgroundColor: item.from_me ? 'rgba(255,255,255,0.25)' : '#FDF2F8', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
                      >
                        {playingId === String(item.id) ? (
                          <Equalizer active color={item.from_me ? 'white' : PINK} />
                        ) : (
                          <MaterialCommunityIcons
                            name="play"
                            size={18}
                            color={item.from_me ? 'white' : PINK}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                    <View style={{ marginLeft: 10 }}>
                      <Text style={{ fontSize: 12, fontWeight: '900', letterSpacing: 1, color: item.from_me ? 'white' : (isDark ? '#FFF' : '#1F2937') }}>
                        ▸▸▸ {formatDuration(item.duration)}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: item.from_me ? 'rgba(255,255,255,0.7)' : '#9CA3AF' }}>
                          {formatTime(item.created_at)}
                        </Text>
                        <View style={{ marginLeft: 4 }}>{renderTicks(item)}</View>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View
                    style={{
                      backgroundColor: item.from_me ? CYAN : (isDark ? '#262626' : '#FFFFFF'),
                      borderRadius: 18,
                      borderBottomRightRadius: item.from_me ? 6 : 18,
                      borderBottomLeftRadius: item.from_me ? 18 : 6,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderWidth: 1,
                      borderColor: item.from_me ? CYAN : (isDark ? '#333' : '#E0F2FE'),
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: '700', lineHeight: 21, color: item.from_me ? 'white' : (isDark ? '#FFF' : '#111827') }}>
                      {item.message}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 }}>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: item.from_me ? 'rgba(255,255,255,0.7)' : '#9CA3AF' }}>
                        {formatTime(item.created_at)}
                      </Text>
                      <View style={{ marginLeft: 4 }}>{renderTicks(item)}</View>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}
        />

        {/* Composer */}
        {Platform.OS === 'ios' ? (
          <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={0}>
            <View style={{ paddingHorizontal: 12, paddingBottom: Math.max(insets.bottom, 12), backgroundColor: isDark ? '#1c1c14' : '#FFFFFF', paddingTop: 10, borderTopWidth: 1, borderTopColor: isDark ? '#262626' : '#F3F4F6' }}>
              {renderComposerInner()}
            </View>
          </KeyboardAvoidingView>
        ) : (
          <View style={{ paddingHorizontal: 12, paddingBottom: keyboardHeight > 0 ? keyboardHeight + 8 : Math.max(insets.bottom, 12), backgroundColor: isDark ? '#1c1c14' : '#FFFFFF', paddingTop: 10, borderTopWidth: 1, borderTopColor: isDark ? '#262626' : '#F3F4F6' }}>
            {renderComposerInner()}
          </View>
        )}

        {/* Call picker modal */}
        <Modal
          visible={showCallPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCallPicker(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: isDark ? '#1c1c14' : '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: Math.max(insets.bottom, 16) }}>
              <View style={{ alignItems: 'center', paddingTop: 12 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: isDark ? '#3a3a38' : '#E5E7EB' }} />
              </View>
              <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <MaterialCommunityIcons name="phone" size={24} color="#22C55E" />
                </View>
                <View>
                  <Text style={{ fontSize: 22, fontWeight: '900', letterSpacing: -0.5, color: isDark ? '#FFF' : '#111827' }}>Call {activeContact.name.split(' ')[0]}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '900', color: '#9CA3AF' }}>Choose a number</Text>
                </View>
              </View>
              {callNumbers.map((num, i) => (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.85}
                  onPress={() => makeCall(num.number)}
                  style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, marginBottom: 8, backgroundColor: isDark ? '#262626' : '#F9FAFB', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: isDark ? '#333' : 'rgba(0,0,0,0.03)' }}
                >
                  <View style={{ backgroundColor: '#22C55E', width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <MaterialCommunityIcons name="phone" size={20} color="white" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '900', color: isDark ? '#FFF' : '#111827' }}>{num.label}</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#9CA3AF', marginTop: 2 }}>{num.number}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setShowCallPicker(false)} activeOpacity={0.8} style={{ marginHorizontal: 24, marginTop: 4, marginBottom: 8, alignItems: 'center', paddingVertical: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: '900', color: '#9CA3AF' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // ── Conversation list view ──
  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFFFFF' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingTop: Math.max(insets.top, 50), paddingHorizontal: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: isDark ? '#D1D5DB' : '#6B7280' }}>
                TN HAPPYKIDS
              </Text>
              <Text style={{ fontSize: 30, fontWeight: '900', letterSpacing: -0.5, marginTop: 4, color: isDark ? '#FFFFFF' : '#111827' }}>
                Messages
              </Text>
              <View style={{ backgroundColor: 'rgba(236, 72, 153, 0.15)', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100, marginTop: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(236, 72, 153, 0.2)' }}>
                <MaterialCommunityIcons name="message-text" size={12} color={PINK} />
                <Text style={{ color: PINK, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginLeft: 6 }}>Voice Inbox</Text>
              </View>
            </View>
            <TouchableOpacity onPress={fetchConversations} activeOpacity={0.8} style={{ backgroundColor: isDark ? '#262626' : '#F3F4F6', width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="refresh" size={22} color={isDark ? '#FFF' : '#111827'} />
            </TouchableOpacity>
          </View>

          {/* New message button */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setShowRecipientPicker(true)}
            style={{ borderRadius: 16, overflow: 'hidden', elevation: 15, marginTop: 20 }}
          >
            <LinearGradient
              colors={isDark ? ['#0E7490', '#155E75'] : ['#06B6D4', '#0891B2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <MaterialCommunityIcons name="microphone-message" size={24} color="white" />
                </View>
                <View>
                  <Text style={{ color: 'white', fontSize: 17, fontWeight: '900', letterSpacing: -0.3 }}>New Message</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 2 }}>Voice or Text</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginRight: 8 }}>Select</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Conversations */}
        {conversations.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 80 }}>
            <MaterialCommunityIcons name="message-text-outline" size={64} color={isDark ? '#3a3a38' : '#F9A8D4'} />
            <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: '#9CA3AF', marginTop: 16 }}>
              No conversations yet
            </Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF', marginTop: 6 }}>Tap New Message to start chatting</Text>
          </View>
        )}

        {contactGroups.map(group => {
          const groupConvs = conversations.filter(c => c.user.role === group);
          if (groupConvs.length === 0) return null;
          return (
            <View key={group} style={{ marginTop: 20 }}>
              <View style={{ paddingHorizontal: 24, marginBottom: 8 }}>
                <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, color: '#9CA3AF' }}>
                  {getContactLabel(group)} · {groupConvs.length}
                </Text>
              </View>
              {groupConvs.map(conv => (
                <TouchableOpacity
                  key={conv.user.id}
                  activeOpacity={0.9}
                  onPress={() => openChat(conv.user)}
                  style={{ backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF', borderBottomWidth: 1, borderBottomColor: isDark ? '#262626' : '#F3F4F6', paddingHorizontal: 24, paddingVertical: 14, flexDirection: 'row', alignItems: 'center' }}
                >
                  <View style={{ backgroundColor: roleColor(conv.user.role), width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {getMediaUrl(conv.user.avatar) ? (
                      <Image source={{ uri: getMediaUrl(conv.user.avatar) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <MaterialCommunityIcons name={roleIcon(conv.user.role)} size={22} color="white" />
                    )}
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ fontWeight: '900', fontSize: 16, color: isDark ? '#FFF' : '#111827' }}>{conv.user.name}</Text>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#9CA3AF' }}>
                        {conv.last_message?.created_at ? formatTime(conv.last_message.created_at) : ''}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#9CA3AF', flex: 1, marginRight: 12 }} numberOfLines={1}>
                        {conv.last_message?.from_me ? 'You: ' : ''}
                        {conv.last_message?.message ? conv.last_message.message : '🎤 Voice message'}
                      </Text>
                      {conv.unread_count > 0 && (
                        <View style={{ backgroundColor: PINK, minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
                          <Text style={{ fontSize: 9, fontWeight: '900', color: 'white' }}>{conv.unread_count}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={isDark ? '#3a3a38' : '#D1D5DB'} />
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
      </ScrollView>

      {/* Recipient picker modal */}
      <Modal
        visible={showRecipientPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRecipientPicker(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: isDark ? '#1c1c14' : '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '85%', paddingBottom: Math.max(insets.bottom, 16) }}>
            {/* Drag handle */}
            <View style={{ alignItems: 'center', paddingTop: 12 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: isDark ? '#3a3a38' : '#E5E7EB' }} />
            </View>

            {/* Header */}
            <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <MaterialCommunityIcons name="account-plus" size={24} color={CYAN} />
                </View>
                <View>
                  <Text style={{ fontSize: 22, fontWeight: '900', letterSpacing: -0.5, color: isDark ? '#FFF' : '#111827' }}>New Message</Text>
                  <Text style={{ fontSize: 12, fontWeight: '900', color: PINK }}>Choose a recipient</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowRecipientPicker(false)} style={{ backgroundColor: isDark ? '#262626' : '#F3F4F6', width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.8}>
                <MaterialCommunityIcons name="close" size={22} color={isDark ? '#FFF' : '#111827'} />
              </TouchableOpacity>
            </View>

            {/* Search bar */}
            <View style={{ paddingHorizontal: 24, paddingBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#262626' : '#F3F4F6', borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: isDark ? '#333' : '#E5E7EB' }}>
                <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search name…"
                  placeholderTextColor="#9CA3AF"
                  style={{ flex: 1, fontSize: 15, fontWeight: '700', color: isDark ? '#FFF' : '#111827', paddingVertical: 12, marginLeft: 10 }}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {filteredPickerItems.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 50 }}>
                <MaterialCommunityIcons name="account-search" size={48} color={isDark ? '#3a3a38' : '#E5E7EB'} />
                <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: '#9CA3AF', marginTop: 12 }}>
                  No results found
                </Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#9CA3AF', marginTop: 4 }}>Try a different name</Text>
              </View>
            )}

            <FlatList
              data={filteredPickerItems}
              keyExtractor={item => item.key}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                filteredPickerItems.length > 0 ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 4 }}>
                    <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, color: '#9CA3AF' }}>
                      Contacts · {filteredPickerItems.filter(i => i.type === 'contact').length}
                    </Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: isDark ? '#262626' : '#F3F4F6', marginLeft: 12 }} />
                  </View>
                ) : null
              }
              renderItem={({ item }) => item.type === 'header' ? (
                <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, color: '#9CA3AF', marginBottom: 8, marginTop: 16 }}>
                  {getContactLabel(item.group)} · {item.count}
                </Text>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => {
                    setShowRecipientPicker(false);
                    setSearch('');
                    setTimeout(() => openChat(item.contact), 350);
                  }}
                  style={{ backgroundColor: isDark ? '#262626' : '#F9FAFB', borderRadius: 18, marginBottom: 8, padding: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: isDark ? '#333' : 'rgba(0,0,0,0.03)' }}
                >
                  <View style={{ backgroundColor: roleColor(item.contact.role), width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {item.contact.avatar ? (
                      <Image source={{ uri: getMediaUrl(item.contact.avatar) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <MaterialCommunityIcons name={roleIcon(item.contact.role)} size={22} color="white" />
                    )}
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontWeight: '900', fontSize: 15, color: isDark ? '#FFF' : '#111827' }} numberOfLines={1}>{item.contact.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                      <View style={{ backgroundColor: roleColor(item.contact.role) + '22', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                        <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2, color: roleColor(item.contact.role) }}>
                          {roleLabel(item.contact.role)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF', width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? '#333' : '#F3F4F6' }}>
                    <MaterialCommunityIcons name="message-text" size={16} color={PINK} />
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
