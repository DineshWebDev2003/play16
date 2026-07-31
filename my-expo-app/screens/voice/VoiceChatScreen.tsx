import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, FlatList, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api, { getMediaUrl } from '../../services/api';
import { Audio } from 'expo-av';

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
}

interface Conversation {
  user: { id: string; name: string; role: string; avatar?: string };
  last_message: { id: string; audio_url: string; duration: number; from_me: boolean; created_at: string };
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  audio_url: string;
  duration: number;
  from_me: boolean;
  created_at: string;
}

const PINK = '#EC4899';

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

export default function VoiceChatScreen({ navigation }: Props) {
  const { user, users } = useAuth();
  const insets = useSafeAreaInsets();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeContact, setActiveContact] = useState<Conversation['user'] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRecipientPicker, setShowRecipientPicker] = useState(false);

  // Recording state
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recordTimer = useRef<any>(null);

  // Playback state
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

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
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
      recordTimer.current && clearInterval(recordTimer.current);
    };
  }, []);

  const openChat = async (contact: Conversation['user']) => {
    setActiveContact(contact);
    setMessages([]);
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

  // ── Chat thread view ──
  if (activeContact) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FDF2F8' }}>
        <View style={{ paddingTop: Math.max(insets.top, 20) }} className="px-4 py-3 bg-white shadow-sm">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <TouchableOpacity onPress={closeChat} className="mr-3" activeOpacity={0.7}>
                <MaterialCommunityIcons name="arrow-left" size={26} color="#1F2937" />
              </TouchableOpacity>
              <View style={{ backgroundColor: roleColor(activeContact.role) }} className="w-11 h-11 rounded-full items-center justify-center">
                <MaterialCommunityIcons
                  name={activeContact.role === 'nanny' ? 'baby-face-outline' : activeContact.role === 'student' ? 'account-heart-outline' : 'shield-account-outline'}
                  size={20} color="white"
                />
              </View>
              <View className="ml-3 flex-1">
                <Text className="font-black text-gray-900">{activeContact.name}</Text>
                <Text className="text-[9px] font-bold uppercase tracking-widest" style={{ color: roleColor(activeContact.role) }}>
                  {roleLabel(activeContact.role)}
                </Text>
              </View>
            </View>
            {isRecording && (
              <TouchableOpacity onPress={cancelRecording} className="mr-2" activeOpacity={0.8}>
                <View style={{ backgroundColor: '#FEE2E2' }} className="w-10 h-10 rounded-full items-center justify-center">
                  <MaterialCommunityIcons name="close" size={20} color="#EF4444" />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <FlatList
          data={messages}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <ActivityIndicator color={PINK} />
              </View>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <MaterialCommunityIcons name="microphone-message" size={48} color="#F9A8D4" />
                <Text className="text-[10px] font-black text-pink-300 uppercase tracking-widest mt-3">
                  No messages yet — record the first one
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <View style={{ alignItems: item.from_me ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
              <View
                style={{
                  backgroundColor: item.from_me ? PINK : '#FFFFFF',
                  borderRadius: 18,
                  borderBottomRightRadius: item.from_me ? 6 : 18,
                  borderBottomLeftRadius: item.from_me ? 18 : 6,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  maxWidth: '85%',
                  borderWidth: 1,
                  borderColor: item.from_me ? PINK : '#FCE7F3',
                }}
              >
                <TouchableOpacity onPress={() => togglePlay(item)} activeOpacity={0.8}>
                  <View
                    style={{ backgroundColor: item.from_me ? 'rgba(255,255,255,0.25)' : '#FDF2F8' }}
                    className="w-9 h-9 rounded-full items-center justify-center"
                  >
                    <MaterialCommunityIcons
                      name={playingId === String(item.id) ? 'stop' : 'play'}
                      size={18}
                      color={item.from_me ? 'white' : PINK}
                    />
                  </View>
                </TouchableOpacity>
                <View className="ml-3">
                  <Text className="text-xs font-black tracking-wider" style={{ color: item.from_me ? 'white' : '#1F2937' }}>
                    ▸▸▸ {formatDuration(item.duration)}
                  </Text>
                  <Text className="text-[8px] font-bold mt-1" style={{ color: item.from_me ? 'rgba(255,255,255,0.7)' : '#9CA3AF' }}>
                    {formatTime(item.created_at)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />

        {/* Record bar */}
        <View className="px-4 pb-4" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <View className="flex-row items-center bg-white rounded-[22px] px-4 py-3 shadow-sm border border-pink-100">
            {isRecording ? (
              <>
                <View className="flex-row items-center flex-1">
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(239,68,68,0.4)' }} />
                  </View>
                  <Text className="ml-3 font-black text-gray-900 text-sm">Recording… {recordSeconds}s</Text>
                </View>
                <TouchableOpacity onPress={stopRecording} activeOpacity={0.9} style={{ backgroundColor: PINK }} className="w-12 h-12 rounded-full items-center justify-center">
                  <MaterialCommunityIcons name="send" size={20} color="white" />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View className="flex-1">
                  <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Voice Message</Text>
                  <Text className="text-xs font-bold text-gray-300 mt-0.5">Hold the mic to record</Text>
                </View>
                <TouchableOpacity
                  onPressIn={startRecording}
                  onPressOut={stopRecording}
                  delayLongPress={120}
                  activeOpacity={0.9}
                  disabled={sending}
                  style={{ backgroundColor: sending ? '#F9A8D4' : PINK }}
                  className="w-14 h-14 rounded-full items-center justify-center"
                >
                  {sending ? <ActivityIndicator color="white" /> : <MaterialCommunityIcons name="microphone" size={24} color="white" />}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    );
  }

  // ── Conversation list view ──
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

  const contactFromUser = (u: any): Conversation['user'] => ({
    id: String(u.id),
    name: u.name,
    role: u.role,
    avatar: u.avatar,
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ paddingTop: Math.max(insets.top, 20) }} className="px-6 pb-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-12 h-12 rounded-[14px] bg-gray-100 items-center justify-center">
            <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
          </TouchableOpacity>
          <View className="flex-row items-center">
            <View style={{ backgroundColor: '#FDF2F8' }} className="rounded-full px-3 py-1 mr-2">
              <Text className="text-[9px] font-black uppercase tracking-[2px] text-pink-500">Voice Inbox</Text>
            </View>
          </View>
          <TouchableOpacity onPress={fetchConversations} className="w-12 h-12 rounded-[14px] bg-gray-50 items-center justify-center">
            <MaterialCommunityIcons name="refresh" size={22} color="#111827" />
          </TouchableOpacity>
        </View>
        <View className="mt-5">
          <Text className="text-3xl font-black tracking-tighter text-gray-900">Voice</Text>
          <Text className="text-lg font-black text-pink-500 mt-[-4px]">Messages</Text>
        </View>

        {/* Recipient dropdown */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setShowRecipientPicker(true)}
          style={{ backgroundColor: PINK }}
          className="mt-5 rounded-[16px] px-5 py-4 flex-row items-center justify-between"
        >
          <View className="flex-row items-center">
            <MaterialCommunityIcons name="microphone-plus" size={22} color="white" />
            <Text className="text-white font-black text-sm ml-3">New Voice Message</Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-[9px] font-black uppercase tracking-widest text-white/80 mr-1">Select</Text>
            <MaterialCommunityIcons name="chevron-down" size={18} color="white" />
          </View>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showRecipientPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRecipientPicker(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '80%', paddingBottom: Math.max(insets.bottom, 16) }}>
            <View className="px-6 pt-5 pb-2 flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-black tracking-tighter text-gray-900">Select</Text>
                <Text className="text-sm font-black text-pink-500">Recipient</Text>
              </View>
              <TouchableOpacity onPress={() => setShowRecipientPicker(false)} className="w-11 h-11 rounded-2xl bg-gray-100 items-center justify-center" activeOpacity={0.8}>
                <MaterialCommunityIcons name="close" size={22} color="#111827" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={recipientGroups}
              keyExtractor={g => g.group}
              style={{ maxHeight: '78%' }}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View className="mb-4">
                  <Text className="text-[9px] font-black uppercase tracking-[3px] text-gray-400 mb-2">
                    {getContactLabel(item.group)} · {item.items.length}
                  </Text>
                  {item.items.map(contact => (
                    <TouchableOpacity
                      key={contact.id}
                      activeOpacity={0.9}
                      onPress={() => {
                        setShowRecipientPicker(false);
                        openChat(contactFromUser(contact));
                      }}
                      style={{ backgroundColor: '#F9FAFB', borderRadius: 18, marginBottom: 8, padding: 12 }}
                      className="flex-row items-center"
                    >
                      <View style={{ backgroundColor: roleColor(contact.role) }} className="w-11 h-11 rounded-full items-center justify-center">
                        <MaterialCommunityIcons
                          name={contact.role === 'nanny' ? 'baby-face-outline' : contact.role === 'student' ? 'account-heart-outline' : 'shield-account-outline'}
                          size={20} color="white"
                        />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="font-black text-sm text-gray-900">{contact.name}</Text>
                        <Text className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: roleColor(contact.role) }}>
                          {roleLabel(contact.role)}
                        </Text>
                      </View>
                      <MaterialCommunityIcons name="microphone-message" size={18} color={PINK} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {conversations.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 80 }}>
            <MaterialCommunityIcons name="microphone-message" size={64} color="#F9A8D4" />
            <Text className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-4">No conversations yet</Text>
            <Text className="text-[10px] font-bold text-gray-300 mt-1">Record a message to get started</Text>
          </View>
        )}

        {contactGroups.map(group => {
          const groupConvs = conversations.filter(c => c.user.role === group);
          if (groupConvs.length === 0) return null;
          return (
            <View key={group} className="mb-4">
              <View className="px-6 mb-2">
                <Text className="text-[9px] font-black uppercase tracking-[3px] text-gray-400">
                  {getContactLabel(group)} · {groupConvs.length}
                </Text>
              </View>
              {groupConvs.map(conv => (
                <TouchableOpacity
                  key={conv.user.id}
                  activeOpacity={0.9}
                  onPress={() => openChat(conv.user)}
                  style={{ backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}
                  className="px-6 py-4 flex-row items-center"
                >
                  <View style={{ backgroundColor: roleColor(conv.user.role) }} className="w-12 h-12 rounded-full items-center justify-center">
                    <MaterialCommunityIcons
                      name={conv.user.role === 'nanny' ? 'baby-face-outline' : conv.user.role === 'student' ? 'account-heart-outline' : 'shield-account-outline'}
                      size={22} color="white"
                    />
                  </View>
                  <View className="ml-4 flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="font-black text-gray-900">{conv.user.name}</Text>
                      <Text className="text-[9px] font-bold text-gray-400">
                        {conv.last_message?.created_at ? formatTime(conv.last_message.created_at) : ''}
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between mt-1">
                      <Text className="text-xs font-bold text-gray-400 flex-1 mr-3" numberOfLines={1}>
                        {conv.last_message?.from_me ? 'You: ' : ''}🎤 Voice message
                      </Text>
                      {conv.unread_count > 0 && (
                        <View style={{ backgroundColor: PINK }} className="min-w-[20px] h-5 rounded-full items-center justify-center px-1.5">
                          <Text className="text-[9px] font-black text-white">{conv.unread_count}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#D1D5DB" />
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
