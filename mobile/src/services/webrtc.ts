import { wsClient } from './websocket';

export interface WebRTCConfig {
  onRemoteStream?: (stream: MediaStream) => void;
  onLocalStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onError?: (error: any) => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private targetUserId: number | null = null;
  private roomId: string | null = null;
  private config: WebRTCConfig = {};
  private pendingCandidates: RTCIceCandidateInit[] = [];

  public initialize(config: WebRTCConfig) {
    this.config = config;
  }

  public async acquireLocalMedia(callType: 'audio' | 'video'): Promise<MediaStream | null> {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === 'video' ? { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } : false,
        });
        this.localStream = stream;
        if (this.config.onLocalStream) {
          this.config.onLocalStream(stream);
        }
        return stream;
      } else {
        console.warn('getUserMedia is not available in current environment');
        return null;
      }
    } catch (err: any) {
      console.warn('Microphone or Camera permission denied or not available:', err);
      // Fallback: create mock audio/video stream using canvas/audioContext if hardware blocked
      try {
        const fallbackStream = this.createSyntheticMediaStream(callType);
        this.localStream = fallbackStream;
        if (this.config.onLocalStream && fallbackStream) {
          this.config.onLocalStream(fallbackStream);
        }
        return fallbackStream;
      } catch (e) {
        if (this.config.onError) this.config.onError(err);
        return null;
      }
    }
  }

  private createSyntheticMediaStream(callType: 'audio' | 'video'): MediaStream | null {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 320, 240);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '16px sans-serif';
      ctx.fillText('LandConnect Video Feed', 40, 120);
    }
    const canvasStream = (canvas as any).captureStream ? (canvas as any).captureStream(15) : null;
    return canvasStream;
  }

  public createPeerConnection(targetUserId: number, roomId: string): RTCPeerConnection {
    this.targetUserId = targetUserId;
    this.roomId = roomId;

    if (this.peerConnection) {
      this.peerConnection.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peerConnection = pc;

    // Attach local media tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Remote track handling
    pc.ontrack = (event) => {
      console.log('📡 Remote track received:', event.track.kind);
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        if (this.config.onRemoteStream) {
          this.config.onRemoteStream(event.streams[0]);
        }
      } else {
        if (!this.remoteStream) {
          this.remoteStream = new MediaStream();
        }
        this.remoteStream.addTrack(event.track);
        if (this.config.onRemoteStream) {
          this.config.onRemoteStream(this.remoteStream);
        }
      }
    };

    // ICE Candidate gathering
    pc.onicecandidate = (event) => {
      if (event.candidate && this.targetUserId) {
        wsClient.send({
          type: 'rtc:ice',
          target_id: this.targetUserId,
          room_id: this.roomId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      console.log('WebRTC Connection state:', pc.connectionState);
      if (this.config.onConnectionStateChange) {
        this.config.onConnectionStateChange(pc.connectionState);
      }
    };

    return pc;
  }

  public async startCallOffer(targetUserId: number, roomId: string, callType: 'audio' | 'video'): Promise<void> {
    await this.acquireLocalMedia(callType);
    const pc = this.createPeerConnection(targetUserId, roomId);

    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: callType === 'video',
    });
    await pc.setLocalDescription(offer);

    wsClient.send({
      type: 'rtc:offer',
      target_id: targetUserId,
      room_id: roomId,
      sdp: offer,
    });
  }

  public async handleIncomingOffer(
    senderId: number,
    roomId: string,
    sdp: RTCSessionDescriptionInit,
    callType: 'audio' | 'video'
  ): Promise<void> {
    await this.acquireLocalMedia(callType);
    const pc = this.createPeerConnection(senderId, roomId);

    await pc.setRemoteDescription(new RTCSessionDescription(sdp));

    // Flush any pending ICE candidates
    for (const candidate of this.pendingCandidates) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
    this.pendingCandidates = [];

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    wsClient.send({
      type: 'rtc:answer',
      target_id: senderId,
      room_id: roomId,
      sdp: answer,
    });
  }

  public async handleIncomingAnswer(sdp: RTCSessionDescriptionInit): Promise<void> {
    if (this.peerConnection) {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
      for (const candidate of this.pendingCandidates) {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
      this.pendingCandidates = [];
    }
  }

  public async handleIncomingIce(candidate: RTCIceCandidateInit): Promise<void> {
    if (this.peerConnection && this.peerConnection.remoteDescription) {
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('Error adding ICE candidate:', e);
      }
    } else {
      this.pendingCandidates.push(candidate);
    }
  }

  public toggleMute(isMuted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }

  public toggleVideo(isVideoOff: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoOff;
      });
    }
  }

  public cleanup(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((t) => t.stop());
      this.remoteStream = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.targetUserId = null;
    this.roomId = null;
    this.pendingCandidates = [];
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }
}

export const webrtcManager = new WebRTCManager();
