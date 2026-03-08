/**
 * src/services/videoCallSocket.ts
 *
 * This service manages the WebSocket connection used for:
 * - Call lifecycle events (incoming, accepted, rejected, ended)
 * - WebRTC signaling (offer / answer / ICE)
 * - Heartbeats (ping / pong)
 *
 * UI components should NEVER talk to WebSocket directly.
 */

import { webrtcService } from "./webRTCservice";

type SocketMessage = {
  type: string;
  [key: string]: unknown;
};

type IncomingCallHandler = (payload: {
  callId: string;
  callerId: number;
}) => void;

type IncomingCallPayload = {
  callId: string;
  callerId: number;
};

type CallAcceptedHandler = (payload: {
  callId: string;
}) => void;

type CallEndedHandler = () => void;

class VideoCallSocket {
  // --------------------------------------------------
  // PRIVATE STATE
  // --------------------------------------------------

  private socket: WebSocket | null = null;
  private heartbeatInterval: number | null = null;
  private pendingMessages: string[] = [];
  private pendingIncomingCall: IncomingCallPayload | null =
    null;

  private incomingCallHandlers =
    new Set<IncomingCallHandler>();
  private callAcceptedHandlers =
    new Set<CallAcceptedHandler>();
  private callEndedHandlers = new Set<CallEndedHandler>();

  // --------------------------------------------------
  // CONNECTION
  // --------------------------------------------------

  /**
   * Opens the WebSocket connection.
   *
   * @param url Full WS URL (including auth token)
   */
  connect(url: string): void {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return; // already connected
    }

    if (this.socket) {
      this.cleanup();
    }

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      // Start heartbeat (keeps presence alive)
      this.startHeartbeat();
      this.flushPendingMessages();
    };

    this.socket.onmessage = async (event) => {
      const message: SocketMessage = JSON.parse(event.data);
      await this.handleMessage(message);
    };

    this.socket.onclose = () => {
      this.cleanup();
    };

    this.socket.onerror = () => {
      this.cleanup();
    };
  }

  // --------------------------------------------------
  // PUBLIC EVENT REGISTRATION
  // --------------------------------------------------

  onIncomingCallEvent(handler: IncomingCallHandler) {
    this.incomingCallHandlers.add(handler);

    // Replay a pending incoming call for listeners that
    // subscribe after route navigation.
    if (this.pendingIncomingCall) {
      handler({ ...this.pendingIncomingCall });
    }

    return () => {
      this.incomingCallHandlers.delete(handler);
    };
  }

  onCallAcceptedEvent(handler: CallAcceptedHandler) {
    this.callAcceptedHandlers.add(handler);
    return () => {
      this.callAcceptedHandlers.delete(handler);
    };
  }

  onCallEndedEvent(handler: CallEndedHandler) {
    this.callEndedHandlers.add(handler);
    return () => {
      this.callEndedHandlers.delete(handler);
    };
  }

  // --------------------------------------------------
  // MESSAGE HANDLING
  // --------------------------------------------------

  private async handleMessage(message: SocketMessage): Promise<void> {
    switch (message.type) {
      // ----------------------------------------------
      // CALL LIFECYCLE
      // ----------------------------------------------

      case "incoming_call":
        this.pendingIncomingCall = {
          callId: String(message.call_id),
          callerId: Number(message.caller_id),
        };

        for (const handler of this.incomingCallHandlers) {
          handler({ ...this.pendingIncomingCall });
        }
        break;

      case "call_accepted":
        this.pendingIncomingCall = null;
        for (const handler of this.callAcceptedHandlers) {
          handler({
            callId: String(message.call_id),
          });
        }
        break;

      case "call_rejected":
      case "call_ended":
      case "call_missed":
        this.pendingIncomingCall = null;
        webrtcService.cleanup();
        for (const handler of this.callEndedHandlers) {
          handler();
        }
        break;

      // ----------------------------------------------
      // WEBRTC SIGNALING
      // ----------------------------------------------

      case "webrtc_offer":
        await webrtcService.handleOffer(
          message.sdp as RTCSessionDescriptionInit
        );
        break;

      case "webrtc_answer":
        await webrtcService.handleAnswer(
          message.sdp as RTCSessionDescriptionInit
        );
        break;

      case "ice_candidate":
        await webrtcService.handleIceCandidate(
          message.candidate as RTCIceCandidateInit
        );
        break;

      // ----------------------------------------------
      // HEARTBEAT
      // ----------------------------------------------

      case "pong":
        // Optional: can be used for debugging latency
        break;

      default:
        console.warn("Unknown WS message:", message);
    }
  }

  // --------------------------------------------------
  // SENDERS (USED BY UI)
  // --------------------------------------------------

  send(payload: Record<string, unknown>): void {
    if (!this.socket) {
      throw new Error("WebSocket not connected");
    }

    const message = JSON.stringify(payload);

    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message);
      return;
    }

    if (this.socket.readyState === WebSocket.CONNECTING) {
      this.pendingMessages.push(message);
      return;
    }

    throw new Error(
      "WebSocket is not open. Reconnect before sending."
    );
  }

  initiateCall(calleeId: number): void {
    this.send({
      type: "call_initiate",
      callee_id: calleeId,
    });
  }

  acceptCall(callId: string): void {
    this.pendingIncomingCall = null;
    this.send({
      type: "call_accept",
      call_id: callId,
    });
  }

  rejectCall(callId: string): void {
    this.pendingIncomingCall = null;
    this.send({
      type: "call_reject",
      call_id: callId,
    });
  }

  endCall(callId: string): void {
    this.pendingIncomingCall = null;
    this.send({
      type: "call_end",
      call_id: callId,
    });
  }

  // --------------------------------------------------
  // HEARTBEAT
  // --------------------------------------------------

  private startHeartbeat(): void {
    this.heartbeatInterval = window.setInterval(() => {
      try {
        this.send({ type: "ping" });
      } catch {
        // If socket is closed, onclose cleanup will stop heartbeat.
      }
    }, 10_000); // every 10 seconds
  }

  private flushPendingMessages(): void {
    if (
      !this.socket ||
      this.socket.readyState !== WebSocket.OPEN ||
      this.pendingMessages.length === 0
    ) {
      return;
    }

    for (const message of this.pendingMessages) {
      this.socket.send(message);
    }

    this.pendingMessages = [];
  }

  // --------------------------------------------------
  // CLEANUP
  // --------------------------------------------------

  private cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = null;
    this.pendingMessages = [];
    this.pendingIncomingCall = null;
    this.socket = null;
  }
}

// --------------------------------------------------
// SINGLETON EXPORT
// --------------------------------------------------

export const videoCallSocket = new VideoCallSocket();
