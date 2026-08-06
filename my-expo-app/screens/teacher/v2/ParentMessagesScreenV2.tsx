import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Modal, Alert, Linking, Keyboard, Image, RefreshControl, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
}

interface Message {
  id: string;
  text: string;
  sentByMe: boolean;
  time: string;
  attachment?: { uri: string; name: string; type: string };
}

interface ChatContact {
  id: string;
  name: string;
  studentName: string;
  classTag: string;
  phone: string;
  lastMessage: string;
  time: string;
  unread: number;
  messages: Message[];
}

const TEXT_PRIMARY = '#1F2D28';
const TEXT_MUTED = '#7A8A82';
const TEXT_SECONDARY = '#4A5B53';
const ACCENT = '#F59E0B';
const ACCENT_PINK = '#DB2777';
const BORDER_RADIUS = 22;

const randomTime = () => {
  const h = Math.floor(Math.random() * 12) + 8;
  const m = Math.floor(Math.random() * 60).toString().padStart(2, '0');
  return `${h > 12 ? h - 12 : h}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
};

const sampleChats: ChatContact[] = [
  {
    id: '1', name: 'Priya Ravi', studentName: 'Arun Kumar', classTag: 'Batch A', phone: '+919876543210',
    lastMessage: 'Thank you for the update sir', time: '10:32 AM', unread: 2,
    messages: [
      { id: 'm1', text: 'Good morning sir, how is Arun doing in mathematics?', sentByMe: false, time: '9:15 AM' },
      { id: 'm2', text: 'Arun is doing well! He scored 85/100 in the last test.', sentByMe: true, time: '9:20 AM' },
      { id: 'm3', text: "That's great to hear!", sentByMe: false, time: '9:22 AM' },
      { id: 'm4', text: 'Yes, he is improving steadily.', sentByMe: true, time: '9:25 AM' },
      { id: 'm5', text: 'Thank you for the update sir', sentByMe: false, time: '10:32 AM' },
    ],
  },
  {
    id: '2', name: 'Suresh Babu', studentName: 'Meena Suresh', classTag: 'Batch B', phone: '+919812345678',
    lastMessage: 'When is the next exam?', time: 'Yesterday', unread: 0,
    messages: [
      { id: 'm6', text: 'When is the next exam for science?', sentByMe: false, time: 'Yesterday' },
      { id: 'm7', text: 'The science exam is scheduled for next Monday.', sentByMe: true, time: 'Yesterday' },
      { id: 'm8', text: 'Please make sure Meena completes her revision.', sentByMe: true, time: 'Yesterday' },
    ],
  },
  {
    id: '3', name: 'Lakshmi Devi', studentName: 'Karthik L', classTag: 'Batch A', phone: '+919834567891',
    lastMessage: 'Received the homework', time: 'Yesterday', unread: 0,
    messages: [
      { id: 'm9', text: 'Received the homework for this week.', sentByMe: false, time: 'Yesterday' },
      { id: 'm10', text: 'Great! Please ensure Karthik completes it by Friday.', sentByMe: true, time: 'Yesterday' },
    ],
  },
  {
    id: '4', name: 'Rajesh Kannan', studentName: 'Divya R', classTag: 'Batch C', phone: '+919856789012',
    lastMessage: 'Will check the progress', time: '2 days ago', unread: 1,
    messages: [
      { id: 'm11', text: 'Can you share Divya\'s progress report?', sentByMe: false, time: '2 days ago' },
      { id: 'm12', text: 'Sure, I will post it in the Progress section.', sentByMe: true, time: '2 days ago' },
      { id: 'm13', text: 'Will check the progress', sentByMe: false, time: '2 days ago' },
    ],
  },
  {
    id: '5', name: 'Meena Akash', studentName: 'Akash M', classTag: 'Batch B', phone: '+919878901234',
    lastMessage: 'Noted, thank you!', time: '3 days ago', unread: 0,
    messages: [
      { id: 'm14', text: 'Akash has been very attentive in class lately.', sentByMe: true, time: '3 days ago' },
      { id: 'm15', text: 'Noted, thank you!', sentByMe: false, time: '3 days ago' },
    ],
  },
];

const avatarColors = ['#06D6A0', '#118AB2', '#FFD166', '#EF476F', '#073B4C', '#F9844A'];
const waTeal = '#EC4899';
const waLightGreen = '#FCE7F3';

const emojis = ['😀','😃','😄','😁','😅','😂','🤣','😊','😇','🙂','😉','😌','😍','🥰','😘','😗','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥴','😵','🤯','🤠','🥳','🥺','😢','😭','😤','😠','😡','🤬','👋','✋','👌','👍','👎','✊','👊','🤛','🤜','👏','🙌','🤲','🤝','🙏','💪','❤️','🧡','💛','💚','💙','💜','🖤','💔','🔥','⭐','✨','💯','🎉','🎊','🙏','🚀','💡','📚','✅','❌','➕','➖','➗','✖️','❤️','💔','💕','💞','💗','💖','💘','💝'];

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

export default function ParentMessagesScreenV2({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const [contacts, setContacts] = useState<ChatContact[]>(sampleChats);
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = searchQuery === '' || c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = classFilter === 'All' || c.classTag === classFilter;
    return matchesSearch && matchesClass;
  });

  const classTags = ['All', ...new Set(contacts.map(c => c.classTag))];

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const openChat = (contact: ChatContact) => {
    setSelectedContact(contact);
    setInputText('');
    setAttachedFile(null);
    setShowEmojiPicker(false);
    setShowAttachmentPicker(false);
    setIsRecording(false);
  };

  const closeChat = () => {
    setSelectedContact(null);
  };

  const handleSend = () => {
    const contact = selectedContact;
    if (!contact) return;
    if (!inputText.trim() && !attachedFile) return;
    const newMsg: Message = {
      id: `m${Date.now()}`,
      text: inputText.trim() || (attachedFile ? `📎 ${attachedFile.name}` : ''),
      sentByMe: true,
      time: randomTime(),
    };
    if (attachedFile) newMsg.attachment = attachedFile;
    const updated = { ...contact, messages: [...contact.messages, newMsg], lastMessage: newMsg.text, unread: 0 };
    setContacts(prev => prev.map(c => c.id === contact.id ? updated : c));
    setSelectedContact(updated);
    setInputText('');
    setAttachedFile(null);
  };

  const handlePickDocument = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], copyToCacheDirectory: true });
      if (!r.canceled && r.assets?.[0]) {
        setAttachedFile({ uri: r.assets[0].uri, name: r.assets[0].name, type: r.assets[0].mimeType || 'application/octet-stream' });
        setShowAttachmentPicker(false);
      }
    } catch {}
  };

  const pickImage = async () => {
    try {
      const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6 });
      if (!r.canceled && r.assets?.[0]) {
        setAttachedFile({ uri: r.assets[0].uri, name: r.assets[0].fileName || 'image.jpg', type: r.assets[0].mimeType || 'image/jpeg' });
        setShowAttachmentPicker(false);
      }
    } catch {}
  };

  const toggleRecording = () => {
    if (isRecording) {
      Alert.alert('Audio', 'Recording stopped. Audio feature coming soon.');
      setIsRecording(false);
    } else {
      setIsRecording(true);
      setTimeout(() => setIsRecording(false), 3000);
      Alert.alert('Audio', 'Recording audio... (mock)');
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return 'file-pdf-box';
    if (type.includes('image')) return 'file-image';
    if (type.includes('word') || type.includes('document')) return 'file-word';
    return 'file';
  };
  const getFileColor = (type: string) => {
    if (type.includes('pdf')) return '#EF4444';
    if (type.includes('image')) return '#8B5CF6';
    if (type.includes('word')) return '#3B82F6';
    return '#6B7280';
  };

  if (selectedContact) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
        <AuroraBackground />

        <View style={{ paddingTop: Math.max(insets.top, 20), paddingHorizontal: 20, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <TouchableOpacity
                onPress={closeChat}
                activeOpacity={0.7}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.92)',
                  width: 50, height: 50, borderRadius: 16,
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
                  alignItems: 'center', justifyContent: 'center',
                  marginRight: 14,
                }}
              >
                <MaterialCommunityIcons name="arrow-left" size={24} color={TEXT_PRIMARY} />
              </TouchableOpacity>
              <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: avatarColors[parseInt(selectedContact.id) % avatarColors.length] }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>{selectedContact.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</Text>
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ color: TEXT_PRIMARY, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 }} numberOfLines={1}>{selectedContact.name}</Text>
                <Text style={{ color: ACCENT_PINK, fontSize: 12, fontWeight: '600', marginTop: 2 }} numberOfLines={1}>{selectedContact.studentName} · {selectedContact.classTag}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => { if (selectedContact?.phone) Linking.openURL(`tel:${selectedContact.phone}`); }}
              activeOpacity={0.7}
              style={{ backgroundColor: 'rgba(245,158,11,0.12)', width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
            >
              <MaterialCommunityIcons name="phone" size={22} color={ACCENT} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
        >
          {selectedContact.messages.map((msg) => (
            <View key={msg.id} style={{ marginBottom: 8, flexDirection: 'row', justifyContent: msg.sentByMe ? 'flex-end' : 'flex-start' }}>
              <View
                style={{
                  maxWidth: '80%',
                  backgroundColor: msg.sentByMe ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.92)',
                  borderWidth: 1,
                  borderColor: msg.sentByMe ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.6)',
                  borderRadius: 18,
                  borderTopRightRadius: msg.sentByMe ? 4 : 18,
                  borderTopLeftRadius: msg.sentByMe ? 18 : 4,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                {msg.attachment && (
                  <TouchableOpacity onPress={() => Alert.alert('File', msg.attachment!.name)} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6, marginBottom: 4, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' }}>
                    <View style={{ width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: getFileColor(msg.attachment.type) }}>
                      <MaterialCommunityIcons name={getFileIcon(msg.attachment.type) as any} size={18} color="white" />
                    </View>
                    <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: TEXT_SECONDARY, marginLeft: 8 }} numberOfLines={1}>{msg.attachment.name}</Text>
                  </TouchableOpacity>
                )}
                <Text style={{ color: TEXT_PRIMARY, fontSize: 15, lineHeight: 20 }}>{msg.text}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 2 }}>
                  <Text style={{ fontSize: 10, color: TEXT_MUTED }}>{msg.time}</Text>
                  {msg.sentByMe && <MaterialCommunityIcons name="check" size={14} color="#8696A0" style={{ marginLeft: 2 }} />}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {attachedFile && (
          <View style={{ marginHorizontal: 12, marginBottom: 6, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)' }}>
            <View style={{ width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: getFileColor(attachedFile.type) }}>
              <MaterialCommunityIcons name={getFileIcon(attachedFile.type) as any} size={18} color="white" />
            </View>
            <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: TEXT_SECONDARY, marginLeft: 8 }} numberOfLines={1}>{attachedFile.name}</Text>
            <TouchableOpacity onPress={() => setAttachedFile(null)}>
              <MaterialCommunityIcons name="close-circle" size={18} color={ACCENT} />
            </TouchableOpacity>
          </View>
        )}

        <View style={{ paddingHorizontal: 12, paddingVertical: 6, paddingBottom: Math.max(insets.bottom, 8) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 26, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', height: 48 }}>
            <TouchableOpacity onPress={() => { Keyboard.dismiss(); setTimeout(() => setShowEmojiPicker(true), 100); }}>
              <MaterialCommunityIcons name="emoticon-happy-outline" size={22} color={ACCENT} />
            </TouchableOpacity>
            <TouchableOpacity style={{ marginLeft: 10 }} onPress={() => setShowAttachmentPicker(true)}>
              <MaterialCommunityIcons name="paperclip" size={20} color={ACCENT} />
            </TouchableOpacity>
            <TextInput
              style={{ flex: 1, fontSize: 15, color: TEXT_PRIMARY, marginHorizontal: 10 }}
              placeholder="Type a message"
              placeholderTextColor={TEXT_MUTED}
              value={inputText}
              onChangeText={setInputText}
            />
            {inputText.trim().length > 0 || attachedFile ? (
              <TouchableOpacity onPress={handleSend} style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: waTeal }}>
                <MaterialCommunityIcons name="send" size={18} color="white" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={toggleRecording}>
                <MaterialCommunityIcons name={isRecording ? 'stop-circle' : 'microphone'} size={24} color={isRecording ? '#EF4444' : ACCENT} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Modal visible={showEmojiPicker} transparent animationType="none">
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} activeOpacity={1} onPress={() => { Keyboard.dismiss(); setShowEmojiPicker(false); }} />
            <View style={{ backgroundColor: 'rgba(255,255,255,0.98)', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: Math.max(insets.bottom, 12), maxHeight: 260 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: TEXT_SECONDARY }}>Emojis</Text>
                <TouchableOpacity onPress={() => { Keyboard.dismiss(); setShowEmojiPicker(false); }}>
                  <MaterialCommunityIcons name="close" size={18} color={TEXT_MUTED} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={true} style={{ paddingHorizontal: 8, paddingBottom: 8 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {emojis.map((emoji, idx) => (
                    <TouchableOpacity key={idx} onPress={() => { setInputText(prev => prev + emoji); }}
                      style={{ width: '12.5%', height: 36, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 20 }}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal visible={showAttachmentPicker} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} activeOpacity={1} onPress={() => setShowAttachmentPicker(false)} />
            <View style={{ backgroundColor: 'rgba(255,255,255,0.98)', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Math.max(insets.bottom, 24) }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY }}>Attach File</Text>
                <TouchableOpacity onPress={() => setShowAttachmentPicker(false)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(245,158,11,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name="close" size={20} color={ACCENT} />
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                <TouchableOpacity onPress={pickImage} style={{ alignItems: 'center' }}>
                  <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(139,92,246,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <MaterialCommunityIcons name="image" size={30} color="#8B5CF6" />
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: TEXT_SECONDARY }}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handlePickDocument} style={{ alignItems: 'center' }}>
                  <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(239,68,68,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <MaterialCommunityIcons name="file-pdf-box" size={30} color="#EF4444" />
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: TEXT_SECONDARY }}>Document</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleRecording} style={{ alignItems: 'center' }}>
                  <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(236,72,153,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <MaterialCommunityIcons name="microphone" size={30} color="#EC4899" />
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: TEXT_SECONDARY }}>Audio</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#F7F9F6' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AuroraBackground />

      <View style={{ paddingTop: Math.max(insets.top, 20), paddingHorizontal: 20, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            style={{
              backgroundColor: 'rgba(255,255,255,0.92)',
              width: 50, height: 50, borderRadius: 16,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={TEXT_PRIMARY} />
          </TouchableOpacity>
          <View style={{ backgroundColor: 'rgba(245,158,11,0.12)', width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
            <Image source={require('../../../assets/icons/discussion (1).png')} style={{ width: 30, height: 30 }} resizeMode="contain" />
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: TEXT_PRIMARY, fontSize: 26, fontWeight: '700', letterSpacing: -0.5 }}>Parent Messages</Text>
            <Text style={{ color: ACCENT_PINK, fontSize: 14, fontWeight: '800' }}>Conversations</Text>
          </View>
          <View style={{ backgroundColor: 'rgba(236,72,153,0.12)', width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="message-text-outline" size={24} color="#EC4899" />
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, paddingVertical: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 16, paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', height: 46 }}>
          <MaterialCommunityIcons name="magnify" size={18} color={TEXT_MUTED} />
          <TextInput
            style={{ flex: 1, fontSize: 15, color: TEXT_PRIMARY, marginLeft: 10 }}
            placeholder="Search conversations..."
            placeholderTextColor={TEXT_MUTED}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={16} color={TEXT_MUTED} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row' }}>
            {classTags.map(tag => (
              <TouchableOpacity
                key={tag}
                activeOpacity={0.7}
                onPress={() => setClassFilter(tag)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  marginRight: 8,
                  backgroundColor: classFilter === tag ? 'rgba(245,158,11,0.16)' : 'rgba(255,255,255,0.92)',
                  borderWidth: 1,
                  borderColor: classFilter === tag ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.6)',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: classFilter === tag ? ACCENT : TEXT_SECONDARY }}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" colors={['#F59E0B']} />}
      >
        {filteredContacts.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 80 }}>
            <MaterialCommunityIcons name="account-search" size={64} color="#D1D5DB" />
            <Text style={{ color: TEXT_MUTED, fontWeight: '700', fontSize: 16, marginTop: 16 }}>No conversations found</Text>
            <Text style={{ color: TEXT_MUTED, fontSize: 14, marginTop: 4 }}>Try a different search or filter</Text>
          </View>
        ) : (
          <View style={{ backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: BORDER_RADIUS, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', overflow: 'hidden' }}>
            {filteredContacts.map((contact, idx) => (
              <TouchableOpacity
                key={contact.id}
                activeOpacity={0.6}
                onPress={() => openChat(contact)}
                style={{ paddingHorizontal: 16, paddingVertical: 14, backgroundColor: contact.unread > 0 ? 'rgba(245,158,11,0.08)' : 'transparent' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: avatarColors[idx % avatarColors.length] }}>
                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>{contact.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ flex: 1, fontSize: 16, fontWeight: contact.unread > 0 ? '700' : '500', color: TEXT_PRIMARY }} numberOfLines={1}>{contact.name}</Text>
                      <Text style={{ fontSize: 12, color: TEXT_MUTED }}>{contact.time}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <View style={{ backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: ACCENT }}>{contact.classTag}</Text>
                      </View>
                      <Text style={{ flex: 1, fontSize: 14, fontWeight: contact.unread > 0 ? '500' : '400', color: contact.unread > 0 ? TEXT_PRIMARY : TEXT_MUTED }} numberOfLines={1}>{contact.lastMessage}</Text>
                      {contact.unread > 0 && (
                        <View style={{ width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 8, backgroundColor: waTeal }}>
                          <Text style={{ color: 'white', fontSize: 11, fontWeight: '700' }}>{contact.unread}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                {idx < filteredContacts.length - 1 && <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginLeft: 60, marginTop: 12 }} />}
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
