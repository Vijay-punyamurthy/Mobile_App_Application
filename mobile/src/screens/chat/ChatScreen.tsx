import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useCallStore } from '../../store/callStore';

export const ChatScreen = ({ route, navigation }: any) => {
  const { conversationId, peerUser, title } = route.params;
  const { messages, openConversation, sendMessage, setupWebSocketListeners } = useChatStore();
  const { user } = useAuthStore();
  const { initiateCall } = useCallStore();

  const [inputContent, setInputContent] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    openConversation(conversationId);
    const cleanup = setupWebSocketListeners();
    return cleanup;
  }, [conversationId]);

  const handleSend = async () => {
    if (!inputContent.trim()) return;
    const text = inputContent.trim();
    setInputContent('');
    try {
      await sendMessage(text);
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (e) {
      console.warn('Failed to send:', e);
    }
  };

  const handleAudioCall = () => {
    if (peerUser) {
      initiateCall(
        peerUser.id,
        peerUser.profile?.full_name || title,
        'audio',
        peerUser.profile?.avatar_url
      );
    }
  };

  const handleVideoCall = () => {
    if (peerUser) {
      initiateCall(
        peerUser.id,
        peerUser.profile?.full_name || title,
        'video',
        peerUser.profile?.avatar_url
      );
    }
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* WhatsApp-Style Header with Audio & Video Call Actions */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>

        <View style={styles.peerInfo}>
          <Text style={styles.peerTitle} numberOfLines={1}>
            {title || 'Land Contact'}
          </Text>
          <Text style={styles.onlineStatus}>🟢 Active Now</Text>
        </View>

        <View style={styles.callActions}>
          <TouchableOpacity style={styles.callIconBtn} onPress={handleAudioCall}>
            <Ionicons name="call" size={20} color="#0284c7" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.callIconBtn, styles.videoBtn]} onPress={handleVideoCall}>
            <Ionicons name="videocam" size={22} color="#059669" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages Feed */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const isMe = item.sender_id === user?.id;
          return (
            <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
              <Text style={[styles.msgText, isMe ? styles.myMsgText : styles.theirMsgText]}>
                {item.content}
              </Text>
              <View style={styles.bubbleMeta}>
                <Text style={[styles.timeText, isMe && styles.myTimeText]}>
                  {formatTime(item.created_at)}
                </Text>
                {isMe && <Ionicons name="checkmark-done" size={14} color="#38bdf8" style={{ marginLeft: 3 }} />}
              </View>
            </View>
          );
        }}
      />

      {/* Message Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Type message or negotiation inquiry..."
          placeholderTextColor="#94a3b8"
          value={inputContent}
          onChangeText={setInputContent}
          multiline
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !inputContent.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!inputContent.trim()}
        >
          <Ionicons name="send" size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#efeae2', // Classic soft WhatsApp-inspired wallpaper tone
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    marginRight: 10,
    padding: 4,
  },
  peerInfo: {
    flex: 1,
  },
  peerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  onlineStatus: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
  },
  callActions: {
    flexDirection: 'row',
    gap: 8,
  },
  callIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  videoBtn: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  myBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#0284c7',
    borderBottomRightRadius: 2,
  },
  theirBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 2,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
  },
  myMsgText: {
    color: '#ffffff',
  },
  theirMsgText: {
    color: '#0f172a',
  },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 3,
  },
  timeText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  myTimeText: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
    color: '#0f172a',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0284c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
});
