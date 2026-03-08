/**
 * src/services/webrtcReconnectService.ts
 *
 * Handles WebRTC connection drops and recovery.
 *
 * RESPONSIBILITIES:
 * - Monitor RTCPeerConnection state
 * - Detect ICE / network failure
 * - Trigger ICE restart safely
 *
 * DESIGN:
 * - No UI logic
 * - No backend logic
 * - Works with existing webrtcService
 */

import { webrtcService } from "./webRTCservice";

type ReconnectState =
  | "connected"
  | "reconnecting"
  | "failed";

class WebRTCReconnectService {
  // --------------------------------------------------
  // STATE
  // --------------------------------------------------

  private state: ReconnectState = "connected";
  private retryCount = 0;
  private readonly MAX_RETRIES = 3;

  // --------------------------------------------------
  // INIT LISTENERS
  // --------------------------------------------------

  /**
   * Attach listeners to the active RTCPeerConnection.
   * Should be called AFTER WebRTC init.
   */
  attach(): void {
    const pc = (webrtcService as any)
      .peerConnection as RTCPeerConnection | null;

    if (!pc) return;

    // Overall connection state (modern browsers)
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") {
        this.tryReconnect();
      }
    };

    // ICE-specific state (very important)
    pc.oniceconnectionstatechange = () => {
      switch (pc.iceConnectionState) {
        case "disconnected":
        case "failed":
          this.tryReconnect();
          break;

        case "connected":
        case "completed":
          this.state = "connected";
          this.retryCount = 0;
          break;
      }
    };
  }

  // --------------------------------------------------
  // RECONNECT LOGIC
  // --------------------------------------------------

  private async tryReconnect(): Promise<void> {
    if (this.state === "reconnecting") return;

    if (this.retryCount >= this.MAX_RETRIES) {
      this.state = "failed";
      console.error("WebRTC reconnection failed");
      return;
    }

    this.state = "reconnecting";
    this.retryCount += 1;

    console.warn(
      `WebRTC reconnect attempt ${this.retryCount}`
    );

    await this.restartIce();
  }

  /**
   * Performs ICE restart (best practice).
   */
  private async restartIce(): Promise<void> {
    const pc = (webrtcService as any)
      .peerConnection as RTCPeerConnection | null;

    if (!pc) return;

    try {
      const offer = await pc.createOffer({
        iceRestart: true,
      });

      await pc.setLocalDescription(offer);

      // Send updated offer through signaling
      (webrtcService as any).sendSignal?.({
        type: "webrtc_offer",
        call_id: (webrtcService as any).callId,
        sdp: offer,
      });
    } catch (err) {
      console.error("ICE restart failed", err);
    }
  }

  // --------------------------------------------------
  // STATE ACCESS
  // --------------------------------------------------

  getState(): ReconnectState {
    return this.state;
  }
}

// --------------------------------------------------
// SINGLETON EXPORT
// --------------------------------------------------

export const webrtcReconnectService =
  new WebRTCReconnectService();
