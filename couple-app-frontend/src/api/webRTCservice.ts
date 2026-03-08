/**
 * src/services/webrtcService.ts
 *
 * This file encapsulates ALL WebRTC-related logic.
 *
 * DESIGN GOALS:
 * - No React imports
 * - No DOM manipulation
 * - No backend business logic
 * - One RTCPeerConnection per call
 *
 * UI components should ONLY call methods from this service.
 */

export type WebRTCConfig = {
  iceServers: RTCIceServer[];
};

export type SignalSender = (
  payload: Record<string, unknown>
) => void;
export type RemoteStreamListener = (
  stream: MediaStream
) => void;

class WebRTCService {
  // --------------------------------------------------
  // PRIVATE STATE
  // --------------------------------------------------

  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private localTracksAttached = false;

  private sendSignal: SignalSender | null = null;
  private onRemoteStream: RemoteStreamListener | null = null;
  private callId: string | null = null;

  // --------------------------------------------------
  // INITIALIZATION
  // --------------------------------------------------

  /**
   * Initializes WebRTC for a new call.
   *
   * @param config ICE server configuration from backend
   * @param callId UUID of the call
   * @param sendSignal function used to send signaling messages via WebSocket
   */
  async init(
    config: WebRTCConfig,
    callId: string,
    sendSignal: SignalSender,
    onRemoteStream?: RemoteStreamListener
  ): Promise<void> {
    this.callId = callId;
    this.sendSignal = sendSignal;
    this.onRemoteStream = onRemoteStream || null;

    // Create RTCPeerConnection
    this.peerConnection = new RTCPeerConnection({
      iceServers: config.iceServers,
    });
    this.localTracksAttached = false;

    // --------------------------------------------------
    // ICE CANDIDATES
    // --------------------------------------------------
    // Fired whenever the browser finds a new network path
    this.peerConnection.onicecandidate = (event) => {
      if (!event.candidate) return;

      this.sendSignal?.({
        type: "ice_candidate",
        call_id: this.callId,
        candidate: event.candidate,
      });
    };

    // --------------------------------------------------
    // REMOTE TRACKS
    // --------------------------------------------------
    // Fired when remote audio/video arrives
    this.peerConnection.ontrack = (event) => {
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }

      this.remoteStream.addTrack(event.track);
      this.onRemoteStream?.(this.remoteStream);
    };
  }

  // --------------------------------------------------
  // MEDIA
  // --------------------------------------------------

  /**
   * Requests camera + microphone access
   * and attaches tracks to the peer connection.
   */
  async startLocalMedia(): Promise<MediaStream> {
    if (!this.peerConnection) {
      throw new Error("WebRTC not initialized");
    }

    if (!this.localStream) {
      this.localStream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
    }

    if (!this.localTracksAttached) {
      // Attach tracks to PeerConnection once per call.
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });
      this.localTracksAttached = true;
    }

    return this.localStream;
  }

  setLocalPreviewStream(stream: MediaStream): void {
    this.localStream = stream;
  }

  /**
   * Returns the remote media stream (for UI rendering)
   */
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  // --------------------------------------------------
  // OFFER / ANSWER
  // --------------------------------------------------

  /**
   * Creates and sends an SDP offer (caller side)
   */
  async createOffer(): Promise<void> {
    if (!this.peerConnection) {
      throw new Error("PeerConnection not initialized");
    }

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    this.sendSignal?.({
      type: "webrtc_offer",
      call_id: this.callId,
      sdp: offer,
    });
  }

  /**
   * Handles an incoming SDP offer (callee side)
   */
  async handleOffer(sdp: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error("PeerConnection not initialized");
    }

    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(sdp)
    );

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    this.sendSignal?.({
      type: "webrtc_answer",
      call_id: this.callId,
      sdp: answer,
    });
  }

  /**
   * Handles an incoming SDP answer (caller side)
   */
  async handleAnswer(sdp: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error("PeerConnection not initialized");
    }

    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(sdp)
    );
  }

  // --------------------------------------------------
  // ICE
  // --------------------------------------------------

  /**
   * Adds a received ICE candidate
   */
  async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) return;

    await this.peerConnection.addIceCandidate(
      new RTCIceCandidate(candidate)
    );
  }

  // --------------------------------------------------
  // CLEANUP
  // --------------------------------------------------

  /**
   * Ends the call and cleans all resources
   */
  cleanup(): void {
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.remoteStream?.getTracks().forEach((t) => t.stop());

    this.peerConnection?.close();

    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.localTracksAttached = false;
    this.callId = null;
    this.sendSignal = null;
    this.onRemoteStream = null;
  }
}

// --------------------------------------------------
// SINGLETON EXPORT
// --------------------------------------------------

export const webrtcService = new WebRTCService();
