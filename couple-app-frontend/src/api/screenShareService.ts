/**
 * src/services/screenShareService.ts
 *
 * Handles screen sharing for an active WebRTC call.
 *
 * RESPONSIBILITIES:
 * - Replace video track with screen track
 * - Restore camera track when screen sharing stops
 *
 * IMPORTANT:
 * - Assumes WebRTCService already created RTCPeerConnection
 * - Uses RTCRtpSender.replaceTrack (no renegotiation)
 */

import { webrtcService } from "./webRTCservice";

class ScreenShareService {
  // --------------------------------------------------
  // STATE
  // --------------------------------------------------

  private screenStream: MediaStream | null = null;
  private cameraTrack: MediaStreamTrack | null = null;

  // --------------------------------------------------
  // START SCREEN SHARE
  // --------------------------------------------------

  async start(): Promise<void> {
    const pc = (webrtcService as any).peerConnection as RTCPeerConnection | null;
    const localStream = (webrtcService as any).localStream as MediaStream | null;

    if (!pc || !localStream) {
      throw new Error("WebRTC not initialized or local stream missing");
    }

    // Save current camera track
    this.cameraTrack = localStream.getVideoTracks()[0] || null;

    // Request screen
    this.screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
    });

    const screenTrack = this.screenStream.getVideoTracks()[0];

    // Replace video track being sent
    const sender = pc
      .getSenders()
      .find((s) => s.track?.kind === "video");

    if (!sender) {
      throw new Error("No video sender found");
    }

    await sender.replaceTrack(screenTrack);

    // When user stops sharing via browser UI
    screenTrack.onended = () => {
      this.stop();
    };
  }

  // --------------------------------------------------
  // STOP SCREEN SHARE
  // --------------------------------------------------

  async stop(): Promise<void> {
    const pc = (webrtcService as any).peerConnection as RTCPeerConnection | null;

    if (!pc || !this.cameraTrack) {
      return;
    }

    const sender = pc
      .getSenders()
      .find((s) => s.track?.kind === "video");

    if (!sender) return;

    await sender.replaceTrack(this.cameraTrack);

    this.screenStream?.getTracks().forEach((t) => t.stop());

    this.screenStream = null;
  }
}

// --------------------------------------------------
// SINGLETON EXPORT
// --------------------------------------------------

export const screenShareService = new ScreenShareService();
