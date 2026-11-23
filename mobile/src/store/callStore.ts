import { create } from 'zustand';
import { api } from '../services/api';
import { wsClient } from '../services/websocket';
import { webrtcManager } from '../services/webrtc';

export type CallStatus = 'idle' | 'outgoing' | 'incoming' | 'connected' | 'ended';

interface PeerInfo {
  id: number;
  name: string;
  avatar?: string;
}

interface CallStoreState {
  callStatus: CallStatus;
  callType: 'audio' | 'video';
  roomId: string | null;
  peerUser: PeerInfo | null;
  incomingCallData: {
    callerId: number;
    callerName: string;
    callerAvatar?: string;
    roomId: string;
    callType: 'audio' | 'video';
  } | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  durationSeconds: number;
  timerInterval: any;

  initiateCall: (targetUserId: number, targetName: string, callType: 'audio' | 'video', targetAvatar?: string) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleCamera: () => void;
  setupSignalingListeners: () => () => void;
}

export const useCallStore = create<CallStoreState>((set, get) => ({
  callStatus: 'idle',
  callType: 'video',
  roomId: null,
  peerUser: null,
  incomingCallData: null,
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isCameraOff: false,
  durationSeconds: 0,
  timerInterval: null,

  initiateCall: async (targetUserId: number, targetName: string, callType: 'audio' | 'video', targetAvatar?: string) => {
    const roomId = `room-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    set({
      callStatus: 'outgoing',
      callType,
      roomId,
      peerUser: { id: targetUserId, name: targetName, avatar: targetAvatar },
      durationSeconds: 0,
    });

    try {
      // 1. Acquire local camera / mic
      const stream = await webrtcManager.acquireLocalMedia(callType);
      set({ localStream: stream });

      // 2. Notify backend & receiver
      await api.initiateCall(targetUserId, callType, roomId);
    } catch (e: any) {
      console.error('Call initiation error:', e);
      get().endCall();
    }
  },

  acceptCall: async () => {
    const incoming = get().incomingCallData;
    if (!incoming) return;

    const { callerId, callerName, callerAvatar, roomId, callType } = incoming;

    set({
      callStatus: 'connected',
      callType,
      roomId,
      peerUser: { id: callerId, name: callerName, avatar: callerAvatar },
      incomingCallData: null,
      durationSeconds: 0,
    });

    // Notify backend & caller that call was accepted
    await api.updateCallStatus(roomId, 'answered');
    wsClient.send({
      type: 'call:accept',
      target_id: callerId,
      room_id: roomId,
    });

    // Acquire local media
    const stream = await webrtcManager.acquireLocalMedia(callType);
    set({ localStream: stream });

    // Start timer
    const interval = setInterval(() => {
      set((s) => ({ durationSeconds: s.durationSeconds + 1 }));
    }, 1000);
    set({ timerInterval: interval });
  },

  rejectCall: async () => {
    const incoming = get().incomingCallData;
    if (!incoming) return;

    const { callerId, roomId } = incoming;
    await api.updateCallStatus(roomId, 'rejected');
    wsClient.send({
      type: 'call:reject',
      target_id: callerId,
      room_id: roomId,
    });

    set({ incomingCallData: null, callStatus: 'idle' });
  },

  endCall: async () => {
    const { roomId, peerUser, timerInterval, durationSeconds } = get();

    if (timerInterval) {
      clearInterval(timerInterval);
    }

    if (roomId) {
      try {
        await api.updateCallStatus(roomId, 'ended', durationSeconds);
      } catch (e) {
        console.warn('Error updating call status on end:', e);
      }

      if (peerUser) {
        wsClient.send({
          type: 'call:end',
          target_id: peerUser.id,
          room_id: roomId,
        });
      }
    }

    webrtcManager.cleanup();

    set({
      callStatus: 'ended',
      localStream: null,
      remoteStream: null,
      timerInterval: null,
      isMuted: false,
      isCameraOff: false,
    });

    setTimeout(() => {
      set({ callStatus: 'idle', roomId: null, peerUser: null });
    }, 1200);
  },

  toggleMute: () => {
    const current = get().isMuted;
    webrtcManager.toggleMute(!current);
    set({ isMuted: !current });
  },

  toggleCamera: () => {
    const current = get().isCameraOff;
    webrtcManager.toggleVideo(!current);
    set({ isCameraOff: !current });
  },

  setupSignalingListeners: () => {
    webrtcManager.initialize({
      onLocalStream: (stream) => {
        set({ localStream: stream });
      },
      onRemoteStream: (stream) => {
        set({ remoteStream: stream });
      },
      onConnectionStateChange: (state) => {
        console.log('Peer connection state updated:', state);
        if (state === 'connected') {
          const timer = setInterval(() => {
            set((s) => ({ durationSeconds: s.durationSeconds + 1 }));
          }, 1000);
          set({ timerInterval: timer, callStatus: 'connected' });
        } else if (state === 'disconnected' || state === 'failed') {
          get().endCall();
        }
      },
    });

    // 1. Incoming Call
    const unsub1 = wsClient.subscribe('call:incoming', (data: any) => {
      console.log('Incoming call received:', data);
      set({
        incomingCallData: {
          callerId: data.caller_id,
          callerName: data.caller_name,
          callerAvatar: data.caller_avatar,
          roomId: data.room_id,
          callType: data.call_type,
        },
        callStatus: 'incoming',
      });
    });

    // 2. Call Accepted by peer
    const unsub2 = wsClient.subscribe('call:accepted', async (data: any) => {
      console.log('Call accepted by peer! Starting WebRTC SDP offer...', data);
      const { peerUser, roomId, callType } = get();
      if (peerUser && roomId) {
        set({ callStatus: 'connected' });
        await webrtcManager.startCallOffer(peerUser.id, roomId, callType);
      }
    });

    // 3. Call Rejected by peer
    const unsub3 = wsClient.subscribe('call:rejected', () => {
      console.log('Call was rejected by peer');
      get().endCall();
    });

    // 4. Call Ended by peer
    const unsub4 = wsClient.subscribe('call:ended', () => {
      console.log('Call ended by peer');
      get().endCall();
    });

    // 5. WebRTC SDP Offer received
    const unsub5 = wsClient.subscribe('rtc:offer', async (data: any) => {
      console.log('WebRTC SDP Offer received from sender:', data.sender_id);
      await webrtcManager.handleIncomingOffer(data.sender_id, data.room_id, data.sdp, get().callType);
    });

    // 6. WebRTC SDP Answer received
    const unsub6 = wsClient.subscribe('rtc:answer', async (data: any) => {
      console.log('WebRTC SDP Answer received');
      await webrtcManager.handleIncomingAnswer(data.sdp);
    });

    // 7. WebRTC ICE Candidate received
    const unsub7 = wsClient.subscribe('rtc:ice', async (data: any) => {
      await webrtcManager.handleIncomingIce(data.candidate);
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
      unsub6();
      unsub7();
    };
  },
}));
