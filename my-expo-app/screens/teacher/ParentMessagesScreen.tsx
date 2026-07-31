import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Modal, Alert, Linking, Keyboard } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props { navigation: { navigate: (s: string) => void; goBack: () => void } }

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

export default function ParentMessagesScreen({ navigation }: Props) {
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

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = searchQuery === '' || c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = classFilter === 'All' || c.classTag === classFilter;
    return matchesSearch && matchesClass;
  });

  const classTags = ['All', ...new Set(contacts.map(c => c.classTag))];

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

  // ── Chat View ──
  if (selectedContact) {
    return (
      <View className="flex-1" style={{ backgroundColor: '#FDF2F8' }}>
        <View style={{ paddingTop: Math.max(insets.top, 20) }} className="px-4 py-3 bg-white shadow-sm">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <TouchableOpacity onPress={closeChat} className="mr-3" activeOpacity={0.7}>
                <MaterialCommunityIcons name="arrow-left" size={26} color="#1F2937" />
              </TouchableOpacity>
              <View className="w-11 h-11 rounded-full items-center justify-center" style={{ backgroundColor: avatarColors[parseInt(selectedContact.id) % avatarColors.length] }}>
                <Text className="text-white font-bold text-base">{selectedContact.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</Text>
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-lg font-bold text-gray-900">{selectedContact.name}</Text>
                <Text className="text-xs text-pink-500 font-medium">{selectedContact.studentName} · {selectedContact.classTag}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => { if (selectedContact?.phone) Linking.openURL(`tel:${selectedContact.phone}`); }} className="w-11 h-11 rounded-full bg-pink-50 items-center justify-center">
              <MaterialCommunityIcons name="phone" size={22} color="#EC4899" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 px-2 py-2" showsVerticalScrollIndicator={false}>
          {selectedContact.messages.map((msg) => (
            <View key={msg.id} className={`mb-2 flex-row ${msg.sentByMe ? 'justify-end' : 'justify-start'}`}>
              <View style={{ maxWidth: '80%', backgroundColor: msg.sentByMe ? waLightGreen : '#FFFFFF' }}
                className={`rounded-2xl px-3 py-2 ${msg.sentByMe ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
              >
                {msg.attachment && (
                  <TouchableOpacity onPress={() => Alert.alert('File', msg.attachment!.name)} className="flex-row items-center bg-white rounded-lg px-2 py-1.5 mb-1 border border-pink-100">
                    <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: getFileColor(msg.attachment.type) }}>
                      <MaterialCommunityIcons name={getFileIcon(msg.attachment.type) as any} size={18} color="white" />
                    </View>
                    <Text className="flex-1 text-xs font-medium text-gray-700 ml-2" numberOfLines={1}>{msg.attachment.name}</Text>
                  </TouchableOpacity>
                )}
                <Text className="text-[15px] leading-5 text-gray-900">{msg.text}</Text>
                <View className="flex-row items-center justify-end mt-0.5">
                  <Text className="text-[10px] text-gray-400">{msg.time}</Text>
                  {msg.sentByMe && <MaterialCommunityIcons name="check" size={14} color="#8696A0" style={{ marginLeft: 2 }} />}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {attachedFile && (
          <View className="mx-2 mb-1 bg-pink-50 rounded-lg px-3 py-2 flex-row items-center border border-pink-200">
            <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: getFileColor(attachedFile.type) }}>
              <MaterialCommunityIcons name={getFileIcon(attachedFile.type) as any} size={18} color="white" />
            </View>
            <Text className="flex-1 text-xs font-medium text-gray-700 ml-2" numberOfLines={1}>{attachedFile.name}</Text>
            <TouchableOpacity onPress={() => setAttachedFile(null)}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#EC4899" />
            </TouchableOpacity>
          </View>
        )}

        <View className="px-2 py-1.5 bg-white">
          <View className="flex-row items-center bg-pink-50 rounded-full px-3" style={{ height: 44 }}>
            <TouchableOpacity onPress={() => { Keyboard.dismiss(); setTimeout(() => setShowEmojiPicker(true), 100); }}>
              <MaterialCommunityIcons name="emoticon-happy-outline" size={22} color="#EC4899" />
            </TouchableOpacity>
            <TouchableOpacity className="ml-2" onPress={() => setShowAttachmentPicker(true)}>
              <MaterialCommunityIcons name="paperclip" size={20} color="#EC4899" />
            </TouchableOpacity>
            <TextInput className="flex-1 text-[15px] text-gray-900 mx-2"
              placeholder="Type a message" placeholderTextColor="#9CA3AF"
              value={inputText} onChangeText={setInputText}
            />
            {inputText.trim().length > 0 || attachedFile ? (
              <TouchableOpacity onPress={handleSend} className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: waTeal }}>
                <MaterialCommunityIcons name="send" size={18} color="white" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={toggleRecording}>
                <MaterialCommunityIcons name={isRecording ? 'stop-circle' : 'microphone'} size={24} color={isRecording ? '#EF4444' : '#EC4899'} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Modal visible={showEmojiPicker} transparent animationType="none">
          <View className="flex-1 justify-end">
            <TouchableOpacity className="flex-1 bg-black/30" activeOpacity={1} onPress={() => { Keyboard.dismiss(); setShowEmojiPicker(false); }} />
            <View className="bg-white" style={{ paddingBottom: Math.max(insets.bottom, 12), maxHeight: 260 }}>
              <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                <Text className="text-sm font-bold text-gray-500">Emojis</Text>
                <TouchableOpacity onPress={() => { Keyboard.dismiss(); setShowEmojiPicker(false); }}>
                  <MaterialCommunityIcons name="close" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={true} className="px-2 pb-2">
                <View className="flex-row flex-wrap">
                  {emojis.map((emoji, idx) => (
                    <TouchableOpacity key={idx} onPress={() => { setInputText(prev => prev + emoji); }}
                      className="w-[12.5%] h-9 items-center justify-center">
                      <Text className="text-xl">{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal visible={showAttachmentPicker} transparent animationType="slide">
          <View className="flex-1 justify-end">
            <TouchableOpacity className="flex-1 bg-black/30" activeOpacity={1} onPress={() => setShowAttachmentPicker(false)} />
            <View className="bg-white rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-5">
                <Text className="text-lg font-black text-gray-900">Attach File</Text>
                <TouchableOpacity onPress={() => setShowAttachmentPicker(false)} className="w-9 h-9 rounded-full bg-pink-50 items-center justify-center">
                  <MaterialCommunityIcons name="close" size={20} color="#EC4899" />
                </TouchableOpacity>
              </View>
              <View className="flex-row justify-around">
                <TouchableOpacity onPress={pickImage} className="items-center">
                  <View className="w-16 h-16 rounded-2xl bg-purple-100 items-center justify-center mb-2">
                    <MaterialCommunityIcons name="image" size={30} color="#8B5CF6" />
                  </View>
                  <Text className="text-xs font-bold text-gray-600">Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handlePickDocument} className="items-center">
                  <View className="w-16 h-16 rounded-2xl bg-red-100 items-center justify-center mb-2">
                    <MaterialCommunityIcons name="file-pdf-box" size={30} color="#EF4444" />
                  </View>
                  <Text className="text-xs font-bold text-gray-600">Document</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleRecording} className="items-center">
                  <View className="w-16 h-16 rounded-2xl bg-pink-100 items-center justify-center mb-2">
                    <MaterialCommunityIcons name="microphone" size={30} color="#EC4899" />
                  </View>
                  <Text className="text-xs font-bold text-gray-600">Audio</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // ── Contact List View ──
  return (
    <KeyboardAvoidingView className="flex-1 bg-white" behavior="padding">
      <View className="px-6 pt-4 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mb-4 bg-white border-2 border-amber-200 w-12 h-12 rounded-2xl items-center justify-center" activeOpacity={0.7}>
              <MaterialCommunityIcons name="arrow-left" size={28} color="#000" />
            </TouchableOpacity>
            <Text className="text-4xl font-black text-gray-900 tracking-tighter">Parent</Text>
            <Text className="text-2xl font-bold text-amber-400">Messages</Text>
          </View>
          <View className="bg-pink-500 w-16 h-16 rounded-3xl items-center justify-center">
            <MaterialCommunityIcons name="message-text-outline" size={32} color="white" />
          </View>
        </View>
      </View>

      <View className="px-4 py-2 bg-white">
          <View className="flex-row items-center bg-gray-100 rounded-lg px-3" style={{ height: 36 }}>
            <MaterialCommunityIcons name="magnify" size={18} color="#9CA3AF" />
            <TextInput className="flex-1 text-[15px] text-gray-900 ml-2"
              placeholder="Search conversations..." placeholderTextColor="#9CA3AF"
              value={searchQuery} onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons name="close-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View className="px-4 pb-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row">
              {classTags.map(tag => (
                <TouchableOpacity key={tag} activeOpacity={0.7} onPress={() => setClassFilter(tag)}
                  className={`px-3 py-1.5 rounded-full mr-2 ${classFilter === tag ? 'bg-pink-500' : 'bg-pink-50 border border-pink-200'}`}>
                  <Text className={`text-xs font-semibold ${classFilter === tag ? 'text-white' : 'text-pink-600'}`}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
          {filteredContacts.length === 0 ? (
            <View className="py-20 items-center">
              <MaterialCommunityIcons name="account-search" size={64} color="#D1D5DB" />
              <Text className="text-gray-400 font-bold text-base mt-4">No conversations found</Text>
              <Text className="text-gray-400 text-sm mt-1">Try a different search or filter</Text>
            </View>
          ) : (
            <View>
              {filteredContacts.map((contact, idx) => (
                <TouchableOpacity key={contact.id} activeOpacity={0.6} onPress={() => openChat(contact)}
                  className="px-4 py-3"
                  style={{ backgroundColor: contact.unread > 0 ? '#FDF2F8' : '#FFFFFF' }}
                >
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: avatarColors[idx % avatarColors.length] }}>
                      <Text className="text-white font-black text-base">{contact.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</Text>
                    </View>
                    <View className="flex-1 ml-3">
                      <View className="flex-row items-center">
                        <Text className={`flex-1 text-base ${contact.unread > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-900'}`} numberOfLines={1}>{contact.name}</Text>
                        <Text className="text-xs text-gray-400">{contact.time}</Text>
                      </View>
                      <View className="flex-row items-center mt-0.5">
                        <View className="bg-pink-100 rounded-full px-2 py-0.5 mr-2">
                          <Text className="text-[10px] font-bold text-pink-700">{contact.classTag}</Text>
                        </View>
                        {contact.unread > 0 ? (
                          <Text className="flex-1 text-sm font-medium text-gray-900" numberOfLines={1}>{contact.lastMessage}</Text>
                        ) : (
                          <Text className="flex-1 text-sm text-gray-500" numberOfLines={1}>{contact.lastMessage}</Text>
                        )}
                        {contact.unread > 0 && (
                          <View className="w-5 h-5 rounded-full items-center justify-center ml-2" style={{ backgroundColor: waTeal }}>
                            <Text className="text-white text-xs font-bold">{contact.unread}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                  {idx < filteredContacts.length - 1 && <View className="h-px bg-gray-100 ml-16 mt-3" />}
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View className="h-6" />
        </ScrollView>
      </KeyboardAvoidingView>
  );
}

