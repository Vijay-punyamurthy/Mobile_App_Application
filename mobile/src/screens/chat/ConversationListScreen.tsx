import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { Conversation } from '../../types';

export const ConversationListScreen = ({ navigation }: any) => {
  const { conversations, isLoading, fetchConversations, setupWebSocketListeners } = useChatStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchConversations();
    const cleanup = setupWebSocketListeners();
    return cleanup;
  }, []);

  const getOtherParticipant = (convo: Conversation) => {
    if (!convo.participants || convo.participants.length === 0) return null;
    const other = convo.participants.find((p) => p.user_id !== user?.id);
    return other?.user || null;
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity
          style={styles.newChatBtn}
          onPress={() => navigation.navigate('MeetingRooms')}
        >
          <Ionicons name="videocam-outline" size={20} color="#0284c7" />
          <Text style={styles.newChatText}>Rooms</Text>
        </TouchableOpacity>
      </View>

      {isLoading && conversations.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0284c7" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={54} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Conversations Yet</Text>
              <Text style={styles.emptySub}>
                Browse marketplace listings and tap "Contact Seller" to start a direct inquiry.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const peer = getOtherParticipant(item);
            const peerName = peer?.profile?.full_name || peer?.email || 'Land Seller';
            const avatar = peer?.profile?.avatar_url;

            return (
              <TouchableOpacity
                style={styles.convoItem}
                onPress={() =>
                  navigation.navigate('ChatDetail', {
                    conversationId: item.id,
                    peerUser: peer,
                    title: peerName,
                  })
                }
              >
                <View style={styles.avatarWrap}>
                  {avatar ? (
                    <Image source={{ uri: avatar }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarLetter}>{peerName.charAt(0)}</Text>
                    </View>
                  )}
                  <View style={styles.onlineDot} />
                </View>

                <View style={styles.convoContent}>
                  <View style={styles.topRow}>
                    <Text style={styles.peerName} numberOfLines={1}>
                      {peerName}
                    </Text>
                    <Text style={styles.timestamp}>{formatTime(item.last_message?.created_at)}</Text>
                  </View>

                  <View style={styles.bottomRow}>
                    <Text style={styles.lastMsg} numberOfLines={1}>
                      {item.last_message?.content || 'Started conversation'}
                    </Text>
                    {item.property_id && (
                      <View style={styles.propTag}>
                        <Ionicons name="pin" size={10} color="#0284c7" />
                        <Text style={styles.propTagText}>Listing #{item.property_id}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
    gap: 4,
  },
  newChatText: {
    color: '#0284c7',
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    paddingVertical: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  convoItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0284c7',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  convoContent: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  peerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  timestamp: {
    fontSize: 11,
    color: '#94a3b8',
    marginLeft: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMsg: {
    fontSize: 13,
    color: '#64748b',
    flex: 1,
    marginRight: 8,
  },
  propTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  propTagText: {
    color: '#0284c7',
    fontSize: 10,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginTop: 14,
  },
  emptySub: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
