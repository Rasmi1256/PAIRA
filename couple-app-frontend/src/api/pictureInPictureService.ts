/**
 * src/services/pictureInPictureService.ts
 *
 * Handles Picture-in-Picture (PiP) for video calls.
 *
 * RESPONSIBILITIES:
 * - Enter PiP mode
 * - Exit PiP mode
 * - Detect PiP support
 *
 * DESIGN:
 * - No React
 * - No WebRTC logic
 * - Operates on HTMLVideoElement
 */

class PictureInPictureService {
  // --------------------------------------------------
  // SUPPORT CHECK
  // --------------------------------------------------

  isSupported(): boolean {
    return (
      "pictureInPictureEnabled" in document &&
      typeof (document as any).exitPictureInPicture ===
        "function"
    );
  }

  // --------------------------------------------------
  // ENTER PIP
  // --------------------------------------------------

  async enter(video: HTMLVideoElement | null): Promise<void> {
    if (!video) return;

    if (!this.isSupported()) {
      console.warn("Picture-in-Picture not supported");
      return;
    }

    try {
      // Required by spec: video must be playing
      if (video.paused) {
        await video.play();
      }

      await video.requestPictureInPicture();
    } catch (err) {
      console.error("Failed to enter PiP", err);
    }
  }

  // --------------------------------------------------
  // EXIT PIP
  // --------------------------------------------------

  async exit(): Promise<void> {
    if (
      "pictureInPictureElement" in document &&
      (document as any).pictureInPictureElement
    ) {
      try {
        await (document as any).exitPictureInPicture();
      } catch (err) {
        console.error("Failed to exit PiP", err);
      }
    }
  }

  // --------------------------------------------------
  // STATE
  // --------------------------------------------------

  isActive(): boolean {
    return Boolean(
      (document as any).pictureInPictureElement
    );
  }
}

// --------------------------------------------------
// SINGLETON EXPORT
// --------------------------------------------------

export const pictureInPictureService =
  new PictureInPictureService();
