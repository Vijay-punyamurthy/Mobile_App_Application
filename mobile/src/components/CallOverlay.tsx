import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCallStore } from '../store/callStore';

export const CallOverlay: React.FC = () => {
  const {
    callStatus,
    callType,
    peerUser,
    incomingCallData,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    durationSeconds,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
    setupSignalingListeners,
  } = useCallStore();

  const localVideoRef = useRef<any>(null);
  const remoteVideoRef = useRef<any>(null);

  // Setup WebRTC and WebSocket signaling listeners on mount
  useEffect(() => {
    const cleanup = setupSignalingListeners();
    return cleanup;
  }, []);

  // WebRTC DOM video element binding (when running on Web / Expo Web)
  useEffect(() => {
    if (Platform.OS === 'web') {
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
      }
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    }
  }, [localStream, remoteStream, callStatus]);

  if (callStatus === 'idle') return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- 1. Incoming Call Screen ---
  if (callStatus === 'incoming' && incomingCallData) {
    return (
      <View style={styles.overlayContainer}>
        <View style={styles.incomingModal}>
          <View style={styles.avatarLarge}>
            {incomingCallData.callerAvatar ? (
              <Image source={{ uri: incomingCallData.callerAvatar }} style={styles.avatarImg} />
            ) : (
              <Ionicons name="person" size={50} color="#94a3b8" />
            )}
          </View>

          <Text style={styles.callerName}>{incomingCallData.callerName}</Text>
          <Text style={styles.callTypeSubtitle}>
            Incoming LandConnect {incomingCallData.callType === 'video' ? 'Video' : 'Audio'} Call...
          </Text>

          <View style={styles.incomingActions}>
            <TouchableOpacity style={[styles.actionBtn, styles.declineBtn]} onPress={rejectCall}>
              <Ionicons name="call" size={28} color="#ffffff" style={{ transform: [{ rotate: '135deg' }] }} />
              <Text style={styles.actionBtnText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={acceptCall}>
              <Ionicons name="call" size={28} color="#ffffff" />
              <Text style={styles.actionBtnText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // --- 2. Outgoing / Calling Screen ---
  if (callStatus === 'outgoing') {
    return (
      <View style={styles.overlayContainer}>
        <View style={styles.centeredCallCard}>
          <View style={styles.avatarLarge}>
            {peerUser?.avatar ? (
              <Image source={{ uri: peerUser.avatar }} style={styles.avatarImg} />
            ) : (
              <Ionicons name="person" size={50} color="#94a3b8" />
            )}
          </View>

          <Text style={styles.callerName}>{peerUser?.name || 'Contact'}</Text>
          <Text style={styles.callingStatusText}>Calling via WebRTC...</Text>

          <View style={styles.outgoingControls}>
            <TouchableOpacity style={[styles.actionBtn, styles.declineBtn]} onPress={endCall}>
              <Ionicons name="call" size={28} color="#ffffff" style={{ transform: [{ rotate: '135deg' }] }} />
              <Text style={styles.actionBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // --- 3. Active / Connected Call Screen ---
  return (
    <View style={styles.overlayContainer}>
      {/* Remote Video Stream or Audio Avatar */}
      <View style={styles.mediaContainer}>
        {callType === 'video' && remoteStream ? (
          Platform.OS === 'web' ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                backgroundColor: '#0f172a',
              }}
            />
          ) : (
            <View style={styles.videoPlaceholder}>
              <Ionicons name="videocam" size={60} color="#38bdf8" />
              <Text style={styles.feedNotice}>WebRTC Remote Video Stream Active</Text>
            </View>
          )
        ) : (
          <View style={styles.audioCallAvatar}>
            <View style={styles.avatarLarge}>
              {peerUser?.avatar ? (
                <Image source={{ uri: peerUser.avatar }} style={styles.avatarImg} />
              ) : (
                <Ionicons name="person" size={60} color="#94a3b8" />
              )}
            </View>
            <Text style={styles.callerName}>{peerUser?.name}</Text>
            <Text style={styles.callDuration}>{formatDuration(durationSeconds)}</Text>
            <Text style={styles.encryptedBadge}>🔒 End-to-End Encrypted WebRTC Stream</Text>
          </View>
        )}

        {/* Local Stream (Picture-in-Picture for Video) */}
        {callType === 'video' && (
          <View style={styles.pipContainer}>
            {localStream ? (
              Platform.OS === 'web' ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 12,
                    transform: 'scaleX(-1)',
                  }}
                />
              ) : (
                <View style={styles.pipPlaceholder}>
                  <Text style={styles.pipText}>You</Text>
                </View>
              )
            ) : (
              <View style={styles.pipPlaceholder}>
                <Ionicons name="videocam-off" size={24} color="#94a3b8" />
              </View>
            )}
          </View>
        )}
      </View>

      {/* Top Bar with Name & Duration */}
      <View style={styles.topCallBar}>
        <View>
          <Text style={styles.topPeerName}>{peerUser?.name}</Text>
          <Text style={styles.topTimer}>{formatDuration(durationSeconds)}</Text>
        </View>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      {/* Floating Bottom Control Bar */}
      <View style={styles.controlsBar}>
        <TouchableOpacity
          style={[styles.controlBtn, isMuted && styles.controlBtnInactive]}
          onPress={toggleMute}
        >
          <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={24} color="#ffffff" />
        </TouchableOpacity>

        {callType === 'video' && (
          <TouchableOpacity
            style={[styles.controlBtn, isCameraOff && styles.controlBtnInactive]}
            onPress={toggleCamera}
          >
            <Ionicons name={isCameraOff ? 'videocam-off' : 'videocam'} size={24} color="#ffffff" />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[styles.controlBtn, styles.endCallBtn]} onPress={endCall}>
          <Ionicons name="call" size={28} color="#ffffff" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  incomingModal: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '85%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  centeredCallCard: {
    alignItems: 'center',
    width: '100%',
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#38bdf8',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  callerName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
    textAlign: 'center',
  },
  callTypeSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 28,
    textAlign: 'center',
  },
  callingStatusText: {
    fontSize: 14,
    color: '#38bdf8',
    marginBottom: 32,
    fontWeight: '600',
  },
  incomingActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  outgoingControls: {
    marginTop: 20,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  acceptBtn: {
    backgroundColor: '#10b981',
  },
  declineBtn: {
    backgroundColor: '#ef4444',
  },
  mediaContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0f172a',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedNotice: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  audioCallAvatar: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callDuration: {
    fontSize: 24,
    fontWeight: '700',
    color: '#38bdf8',
    marginTop: 8,
  },
  encryptedBadge: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 12,
  },
  pipContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 100,
    height: 140,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#38bdf8',
    backgroundColor: '#1e293b',
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  pipPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pipText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  topCallBar: {
    position: 'absolute',
    top: 48,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  topPeerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  topTimer: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginRight: 5,
  },
  liveText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  controlsBar: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    zIndex: 10,
  },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(51, 65, 85, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  controlBtnInactive: {
    backgroundColor: '#dc2626',
    borderColor: '#ef4444',
  },
  endCallBtn: {
    backgroundColor: '#ef4444',
    borderColor: '#dc2626',
    width: 64,
    height: 64,
    borderRadius: 32,
  },
});
