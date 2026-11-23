import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useCallStore } from '../../store/callStore';
import { CallRecord } from '../../types';

export const CallHistoryScreen = ({ navigation }: any) => {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const { initiateCall } = useCallStore();

  useEffect(() => {
    loadCallHistory();
  }, []);

  const loadCallHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getCallHistory();
      setCalls(data);
    } catch (e) {
      console.warn('Failed to load call history:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (secs: number) => {
    if (!secs) return '0s';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Call History</Text>
        <TouchableOpacity style={styles.roomsBtn} onPress={() => navigation.navigate('MeetingRooms')}>
          <Ionicons name="people" size={16} color="#0284c7" />
          <Text style={styles.roomsBtnText}>Meeting Rooms</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0284c7" />
        </View>
      ) : (
        <FlatList
          data={calls}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="call-outline" size={54} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Calls Recorded</Text>
              <Text style={styles.emptySub}>
                All audio and video call sessions are logged here with timestamps and duration.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isCaller = item.caller_id === user?.id;
            const peer = isCaller ? item.receiver : item.caller;
            const peerName = peer?.profile?.full_name || peer?.email || 'Contact';

            return (
              <View style={styles.callRow}>
                <View
                  style={[
                    styles.iconCircle,
                    item.status === 'answered' ? styles.circleSuccess : styles.circleMissed,
                  ]}
                >
                  <Ionicons
                    name={item.call_type === 'video' ? 'videocam' : 'call'}
                    size={20}
                    color={item.status === 'answered' ? '#059669' : '#ef4444'}
                  />
                </View>

                <View style={styles.callInfo}>
                  <Text style={styles.peerName}>{peerName}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons
                      name={isCaller ? 'arrow-up-outline' : 'arrow-down-outline'}
                      size={12}
                      color={isCaller ? '#0284c7' : '#059669'}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.statusText}>
                      {item.status.toUpperCase()} • {formatDuration(item.duration_seconds)}
                    </Text>
                  </View>
                  <Text style={styles.dateText}>{formatDate(item.started_at)}</Text>
                </View>

                <TouchableOpacity
                  style={styles.callbackBtn}
                  onPress={() =>
                    initiateCall(
                      peer ? peer.id : isCaller ? item.receiver_id : item.caller_id,
                      peerName,
                      item.call_type,
                      peer?.profile?.avatar_url
                    )
                  }
                >
                  <Ionicons
                    name={item.call_type === 'video' ? 'videocam-outline' : 'call-outline'}
                    size={18}
                    color="#0284c7"
                  />
                </TouchableOpacity>
              </View>
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
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  roomsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
    gap: 4,
  },
  roomsBtnText: {
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
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  circleSuccess: {
    backgroundColor: '#ecfdf5',
  },
  circleMissed: {
    backgroundColor: '#fef2f2',
  },
  callInfo: {
    flex: 1,
  },
  peerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  dateText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  callbackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd',
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
