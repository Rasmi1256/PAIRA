/**
 * src/services/webrtcControls.ts
 *
 * Media controls for WebRTC calls.
 *
 * RESPONSIBILITIES:
 * - Mute / unmute microphone
 * - Enable / disable camera
 * - Reflect current media state
 *
 * DESIGN:
 * - Does NOT own PeerConnection
 * - Operates on MediaStream tracks
 */

type MediaState = {
  audioEnabled: boolean;
  videoEnabled: boolean;
};

class WebRTCControls {
  // --------------------------------------------------
  // STATE
  // --------------------------------------------------

  private state: MediaState = {
    audioEnabled: true,
    videoEnabled: true,
  };

  // --------------------------------------------------
  // AUDIO CONTROLS
  // --------------------------------------------------

  /**
   * Mutes the microphone.
   */
  muteAudio(stream: MediaStream | null): void {
    if (!stream) return;

    stream.getAudioTracks().forEach((track) => {
      track.enabled = false;
    });

    this.state.audioEnabled = false;
  }

  /**
   * Unmutes the microphone.
   */
  unmuteAudio(stream: MediaStream | null): void {
    if (!stream) return;

    stream.getAudioTracks().forEach((track) => {
      track.enabled = true;
    });

    this.state.audioEnabled = true;
  }

  /**
   * Toggles microphone state.
   */
  toggleAudio(stream: MediaStream | null): void {
    if (this.state.audioEnabled) {
      this.muteAudio(stream);
    } else {
      this.unmuteAudio(stream);
    }
  }

  // --------------------------------------------------
  // VIDEO CONTROLS
  // --------------------------------------------------

  /**
   * Turns camera off.
   */
  disableVideo(stream: MediaStream | null): void {
    if (!stream) return;

    stream.getVideoTracks().forEach((track) => {
      track.enabled = false;
    });

    this.state.videoEnabled = false;
  }

  /**
   * Turns camera on.
   */
  enableVideo(stream: MediaStream | null): void {
    if (!stream) return;

    stream.getVideoTracks().forEach((track) => {
      track.enabled = true;
    });

    this.state.videoEnabled = true;
  }

  /**
   * Toggles camera state.
   */
  toggleVideo(stream: MediaStream | null): void {
    if (this.state.videoEnabled) {
      this.disableVideo(stream);
    } else {
      this.enableVideo(stream);
    }
  }

  // --------------------------------------------------
  // STATE ACCESS
  // --------------------------------------------------

  getState(): MediaState {
    return { ...this.state };
  }
}

// --------------------------------------------------
// SINGLETON EXPORT
// --------------------------------------------------

export const webrtcControls = new WebRTCControls();
