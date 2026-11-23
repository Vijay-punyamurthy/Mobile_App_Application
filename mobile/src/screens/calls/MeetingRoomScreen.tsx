import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useCallStore } from '../../store/callStore';
import { wsClient } from '../../services/websocket';
import { MeetingRoom } from '../../types';

export const MeetingRoomScreen = ({ navigation }: any) => {
  const [meetings, setMeetings] = useState<MeetingRoom[]>([]);
  const [roomCode, setRoomCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuthStore();
  const { initiateCall } = useCallStore();

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const data = await api.getMeetings();
      setMeetings(data);
    } catch (e) {
      console.warn('Failed to load meetings:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async () => {
    if (!newTitle.trim()) return;
    try {
      setIsCreating(true);
      const created = await api.createMeeting(newTitle.trim());
      setMeetings([created, ...meetings]);
      setNewTitle('');
    } catch (e) {
      console.warn('Error creating meeting:', e);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinByCode = (code: string, title?: string) => {
    if (!code.trim()) return;
    wsClient.send({
      type: 'room:join',
      room_id: code.trim(),
    });
    // Launch virtual inspection room using WebRTC
    initiateCall(999, `Meeting: ${title || code}`, 'video');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Virtual Inspection Rooms</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.cardSection}>
        <Text style={styles.cardTitle}>Join by Meeting Code</Text>
        <View style={styles.joinRow}>
          <TextInput
            style={styles.joinInput}
            placeholder="e.g. land-inspection-live"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            value={roomCode}
            onChangeText={setRoomCode}
          />
          <TouchableOpacity
            style={[styles.joinBtn, !roomCode.trim() && styles.joinBtnDisabled]}
            onPress={() => handleJoinByCode(roomCode)}
            disabled={!roomCode.trim()}
          >
            <Text style={styles.joinBtnText}>Join</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardSection}>
        <Text style={styles.cardTitle}>Schedule Virtual Land Inspection</Text>
        <View style={styles.createRow}>
          <TextInput
            style={styles.createInput}
            placeholder="Room Title (e.g. Survey Review with Broker)"
            placeholderTextColor="#94a3b8"
            value={newTitle}
            onChangeText={setNewTitle}
          />
          <TouchableOpacity
            style={styles.createBtn}
            onPress={handleCreateMeeting}
            disabled={isCreating}
          >
            {isCreating ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.createBtnText}>Create</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.listSection}>
        <Text style={styles.listSectionTitle}>Active & Scheduled Meeting Rooms</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#0284c7" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={meetings}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.meetingItem}>
                <View style={styles.meetingInfo}>
                  <Text style={styles.meetingTitle}>{item.title}</Text>
                  <Text style={styles.meetingCode}>Code: {item.code}</Text>
                  <Text style={styles.meetingHost}>
                    Host: {item.host?.profile?.full_name || item.host?.email || 'Host'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.enterBtn}
                  onPress={() => handleJoinByCode(item.code, item.title)}
                >
                  <Ionicons name="videocam" size={16} color="#ffffff" />
                  <Text style={styles.enterBtnText}>Enter</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  cardSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },
  joinRow: {
    flexDirection: 'row',
    gap: 10,
  },
  joinInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0f172a',
  },
  joinBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 18,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
  joinBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  createRow: {
    flexDirection: 'row',
    gap: 10,
  },
  createInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0f172a',
  },
  createBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  listSection: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  listSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
  },
  meetingItem: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  meetingInfo: {
    flex: 1,
  },
  meetingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  meetingCode: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#0284c7',
    fontWeight: '600',
  },
  meetingHost: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  enterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  enterBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
