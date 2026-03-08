/**
 * src/hooks/useVideoCall.ts
 *
 * React hook that manages the full video call lifecycle.
 */

import { useEffect, useRef, useState } from "react";

import { webrtcService } from "../api/webRTCservice";
import { videoCallSocket } from "../api/videoCallSocket";
import { videoCallApi } from "../api/videoCallApi";
import { webrtcReconnectService } from "../api/webrtcReconnectService";
import { callRingtoneService } from "../api/callRingtoneService";
import { buildVideoCallWsUrl } from "../api/buildVideoCallWsUrl";

export type CallState =
  | "idle"
  | "ringing"
  | "calling"
  | "connecting"
  | "in_call"
  | "ended";

type IncomingCall = {
  callId: string;
  callerId: number;
};

export function useVideoCall(token: string) {
  const [callState, setCallState] =
    useState<CallState>("idle");
  const [activeCallId, setActiveCallId] =
    useState<string | null>(null);
  const [incomingCall, setIncomingCall] =
    useState<IncomingCall | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const [localStream, setLocalStream] =
    useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] =
    useState<MediaStream | null>(null);

  const stopMediaStream = (
    stream: MediaStream | null
  ) => {
    stream?.getTracks().forEach((track) => track.stop());
  };

  const ensureOutgoingPreview = async () => {
    if (localStreamRef.current) {
      return;
    }

    try {
      const previewStream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

      localStreamRef.current = previewStream;
      setLocalStream(previewStream);
      webrtcService.setLocalPreviewStream(previewStream);
    } catch (error) {
      console.warn(
        "Unable to start local preview before call is accepted:",
        error
      );
    }
  };

  const cleanup = () => {
    stopMediaStream(localStreamRef.current);
    stopMediaStream(remoteStreamRef.current);
    webrtcService.cleanup();
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setIncomingCall(null);
    setActiveCallId(null);
    setCallState("idle");
  };

  const setupWebRTC = async (
    callId: string,
    shouldCreateOffer: boolean
  ) => {
    const { iceServers } =
      await videoCallApi.getIceServers(token);

    await webrtcService.init(
      { iceServers },
      callId,
      (payload: Record<string, unknown>) =>
        videoCallSocket.send(payload),
      (incomingRemoteStream) => {
        remoteStreamRef.current = incomingRemoteStream;
        setRemoteStream(incomingRemoteStream);
      }
    );

    localStreamRef.current = await webrtcService.startLocalMedia();
    setLocalStream(localStreamRef.current);

    remoteStreamRef.current = webrtcService.getRemoteStream();
    if (remoteStreamRef.current) {
      setRemoteStream(remoteStreamRef.current);
    }

    webrtcReconnectService.attach();
    setActiveCallId(callId);
    setCallState("in_call");

    if (shouldCreateOffer) {
      await webrtcService.createOffer();
    }
  };

  useEffect(() => {
    const wsUrl = buildVideoCallWsUrl(token);
    videoCallSocket.connect(wsUrl);

    const unsubscribeIncoming =
      videoCallSocket.onIncomingCallEvent(
        ({ callId, callerId }) => {
          setIncomingCall({ callId, callerId });
          setCallState("ringing");
          callRingtoneService.start();
        }
      );

    const unsubscribeAccepted =
      videoCallSocket.onCallAcceptedEvent(
        async ({ callId }) => {
          setCallState("connecting");
          setActiveCallId(callId);
          try {
            await setupWebRTC(callId, true);
          } catch (error) {
            console.error(
              "Failed to initialize video on caller side:",
              error
            );
            cleanup();
          }
        }
      );

    const unsubscribeEnded =
      videoCallSocket.onCallEndedEvent(() => {
        callRingtoneService.stop();
        cleanup();
      });

    return () => {
      unsubscribeIncoming();
      unsubscribeAccepted();
      unsubscribeEnded();
      callRingtoneService.stop();
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCall = (calleeId: number) => {
    setCallState("calling");
    videoCallSocket.connect(buildVideoCallWsUrl(token));
    videoCallSocket.initiateCall(calleeId);
    void ensureOutgoingPreview();
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    callRingtoneService.stop();
    setCallState("connecting");
    setActiveCallId(incomingCall.callId);
    videoCallSocket.acceptCall(incomingCall.callId);
    await setupWebRTC(incomingCall.callId, false);
  };

  const rejectCall = () => {
    if (!incomingCall) return;
    callRingtoneService.stop();
    videoCallSocket.rejectCall(incomingCall.callId);
    cleanup();
  };

  const endCall = () => {
    if (!activeCallId) return;
    callRingtoneService.stop();
    videoCallSocket.endCall(activeCallId);
    cleanup();
  };

  return {
    callState,
    incomingCall,
    localStream,
    remoteStream,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
  };
}
