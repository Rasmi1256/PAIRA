/**
 * src/services/callRingtoneService.ts
 *
 * Handles ringtone audio + vibration for incoming calls.
 *
 * RESPONSIBILITIES:
 * - Play looping ringtone
 * - Stop ringtone cleanly
 * - Trigger device vibration (if supported)
 *
 * DESIGN:
 * - No React
 * - No WebRTC
 * - No backend dependency
 */

class CallRingtoneService {
  // --------------------------------------------------
  // STATE
  // --------------------------------------------------

  private audio: HTMLAudioElement | null = null;
  private vibrating = false;
  private readonly defaultRingtoneSrc =
    "/sounds/incoming-call.mp3";
  private readonly ringtoneSrcStorageKey =
    "video_call_custom_ringtone_src";
  private readonly ringtoneNameStorageKey =
    "video_call_custom_ringtone_name";

  // --------------------------------------------------
  // START RINGING
  // --------------------------------------------------

  start(): void {
    // Avoid double start
    if (this.audio) return;

    // -------------------------------
    // AUDIO
    // -------------------------------
    this.audio = new Audio(this.getRingtoneSrc());
    this.audio.loop = true;
    this.audio.volume = 1.0;

    // Some browsers require user interaction
    this.audio
      .play()
      .catch(() => {
        console.warn(
          "Autoplay blocked — user interaction required"
        );
      });

    // -------------------------------
    // VIBRATION (MOBILE)
    // -------------------------------
    if ("vibrate" in navigator) {
      navigator.vibrate([500, 500, 500, 500]);
      this.vibrating = true;
    }
  }

  // --------------------------------------------------
  // STOP RINGING
  // --------------------------------------------------

  stop(): void {
    // Stop audio
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }

    // Stop vibration
    if (this.vibrating && "vibrate" in navigator) {
      navigator.vibrate(0);
      this.vibrating = false;
    }
  }

  getCurrentRingtoneName(): string | null {
    try {
      return localStorage.getItem(this.ringtoneNameStorageKey);
    } catch {
      return null;
    }
  }

  async chooseCustomRingtone(): Promise<string | null> {
    const selectedFile = await this.pickAudioFile();
    if (!selectedFile) {
      return null;
    }

    const dataUrl = await this.fileToDataUrl(selectedFile);

    try {
      localStorage.setItem(
        this.ringtoneSrcStorageKey,
        dataUrl
      );
      localStorage.setItem(
        this.ringtoneNameStorageKey,
        selectedFile.name
      );
    } catch {
      throw new Error(
        "Unable to store ringtone. Try a smaller audio file."
      );
    }

    return selectedFile.name;
  }

  clearCustomRingtone(): void {
    try {
      localStorage.removeItem(this.ringtoneSrcStorageKey);
      localStorage.removeItem(this.ringtoneNameStorageKey);
    } catch {
      // Ignore storage errors and continue with default ringtone.
    }
  }

  private getRingtoneSrc(): string {
    try {
      const storedRingtone = localStorage.getItem(
        this.ringtoneSrcStorageKey
      );
      return storedRingtone || this.defaultRingtoneSrc;
    } catch {
      return this.defaultRingtoneSrc;
    }
  }

  private pickAudioFile(): Promise<File | null> {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "audio/*";
      input.style.display = "none";

      input.onchange = () => {
        const file = input.files?.[0] || null;
        input.remove();
        resolve(file);
      };

      input.oncancel = () => {
        input.remove();
        resolve(null);
      };

      document.body.appendChild(input);
      input.click();
    });
  }

  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }
        reject(new Error("Invalid ringtone file."));
      };
      reader.onerror = () =>
        reject(new Error("Failed to read ringtone file."));
      reader.readAsDataURL(file);
    });
  }
}

// --------------------------------------------------
// SINGLETON EXPORT
// --------------------------------------------------

export const callRingtoneService =
  new CallRingtoneService();
