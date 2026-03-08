/**
 * src/components/VideoCallView.tsx
 *
 * UI component for video calling
 * (mic, camera, screen sharing + call timer).
 */

import { useEffect, useRef, useState } from "react";
import { useVideoCall } from "../hooks/useVideoCall";
import { webrtcControls } from "../api/webrtcControls";
import { screenShareService } from "../api/screenShareService";
import { useCallTimer } from "../hooks/useCallTimer";
import { pictureInPictureService } from "../api/pictureInPictureService";
import { callRingtoneService } from "../api/callRingtoneService";
import IncomingCallModal from "./IncomingCallModal";

type VideoCallViewProps = {
  token: string;
  partnerId: number;
  partnerName: string;
  partnerEmail: string;
};

export function VideoCallView({
  token,
  partnerId,
  partnerName,
  partnerEmail,
}: VideoCallViewProps) {
  const {
    callState,
    incomingCall,
    localStream,
    remoteStream,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
  } = useVideoCall(token);

  const callTimer = useCallTimer(callState === "in_call");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] =
    useState(false);
  const [customRingtoneName, setCustomRingtoneName] =
    useState<string | null>(() =>
      callRingtoneService.getCurrentRingtoneName()
    );

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      void localVideoRef.current.play().catch(() => {
        // Browser may block autoplay in some environments.
      });
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      void remoteVideoRef.current.play().catch(() => {
        // Browser may block autoplay; user interaction can resume playback.
      });
    }
  }, [remoteStream]);

  useEffect(() => {
    if (callState !== "in_call") {
      void pictureInPictureService.exit();
    }
  }, [callState]);

  const toggleMute = () => {
    webrtcControls.toggleAudio(localStream);
    setIsMuted((prev) => !prev);
  };

  const toggleCamera = () => {
    webrtcControls.toggleVideo(localStream);
    setIsCameraOff((prev) => !prev);
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      await screenShareService.start();
      setIsScreenSharing(true);
    } else {
      await screenShareService.stop();
      setIsScreenSharing(false);
    }
  };

  const togglePiP = async () => {
    if (!pictureInPictureService.isActive()) {
      await pictureInPictureService.enter(
        remoteVideoRef.current
      );
    } else {
      await pictureInPictureService.exit();
    }
  };

  const handleEndCall = () => {
    endCall();
    callTimer.reset();
    setIsScreenSharing(false);
  };

  const handleChooseRingtone = async () => {
    try {
      const selectedName =
        await callRingtoneService.chooseCustomRingtone();

      if (selectedName) {
        setCustomRingtoneName(selectedName);
      }
    } catch (error) {
      console.error(
        "Failed to set custom ringtone:",
        error
      );
      alert(
        "Could not set ringtone. Try a smaller audio file."
      );
    }
  };

  const handleResetRingtone = () => {
    callRingtoneService.clearCustomRingtone();
    setCustomRingtoneName(null);
  };

  const getOverlayText = () => {
    if (callState === "calling") {
      return "Calling partner...";
    }
    if (callState === "connecting") {
      return "Connecting video...";
    }
    if (callState === "ringing") {
      return "Incoming call...";
    }
    if (callState === "idle") {
      return "Tap Call to start.";
    }
    return "Waiting for video stream...";
  };

  return (
    <div style={styles.container}>
      <div style={styles.videoContainer}>
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={styles.remoteVideo}
        />
        {!remoteStream && (
          <div style={styles.overlayText}>{getOverlayText()}</div>
        )}

        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          style={styles.localVideo}
        />

        {callState === "in_call" && (
          <div style={styles.timer}>{callTimer.formatted}</div>
        )}
      </div>

      <div style={styles.controls}>
        {callState === "idle" && (
          <>
            <button onClick={() => startCall(partnerId)}>
              Call
            </button>
            <button onClick={handleChooseRingtone}>
              Set Ringtone
            </button>
            {customRingtoneName && (
              <button onClick={handleResetRingtone}>
                Reset Ringtone
              </button>
            )}
          </>
        )}

        {callState === "ringing" && incomingCall && (
          <IncomingCallModal
            isOpen={true}
            callerName={partnerName}
            callerEmail={partnerEmail}
            onAccept={acceptCall}
            onReject={rejectCall}
          />
        )}

        {callState === "in_call" && (
          <>
            <button onClick={toggleMute}>
              {isMuted ? "Unmute" : "Mute"}
            </button>

            <button onClick={toggleCamera}>
              {isCameraOff ? "Camera On" : "Camera Off"}
            </button>

            <button onClick={toggleScreenShare}>
              {isScreenSharing
                ? "Stop Sharing"
                : "Share Screen"}
            </button>

            {pictureInPictureService.isSupported() && (
              <button onClick={togglePiP}>PiP</button>
            )}

            <button
              onClick={handleEndCall}
              style={styles.endButton}
            >
              End
            </button>
          </>
        )}
      </div>

      <div style={styles.status}>
        <small>State: {callState}</small>
        <br />
        <small>
          Ringtone:{" "}
          {customRingtoneName || "Default incoming-call.mp3"}
        </small>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: "#000",
    color: "#fff",
  },
  videoContainer: {
    position: "relative",
    flex: 1,
  },
  remoteVideo: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  localVideo: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 120,
    height: 160,
    borderRadius: 8,
    objectFit: "cover",
    border: "2px solid #fff",
    background: "#000",
  },
  timer: {
    position: "absolute",
    top: 12,
    left: 12,
    background: "rgba(0,0,0,0.6)",
    padding: "4px 8px",
    borderRadius: 6,
    fontSize: 14,
  },
  overlayText: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    color: "#d1d5db",
    background: "rgba(0, 0, 0, 0.35)",
  },
  controls: {
    display: "flex",
    gap: 8,
    justifyContent: "center",
    padding: 12,
    flexWrap: "wrap",
  },
  endButton: {
    background: "red",
    color: "white",
  },
  status: {
    textAlign: "center",
    paddingBottom: 8,
    opacity: 0.6,
  },
};
