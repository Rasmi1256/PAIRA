/**
 * src/services/videoCallApi.ts
 *
 * REST API client for video calling.
 *
 * RESPONSIBILITIES:
 * - Fetch ICE server configuration
 * - Fetch video call history
 *
 * DESIGN RULES:
 * - No WebRTC logic
 * - No WebSocket logic
 * - No UI logic
 */

export type IceServerConfig = {
  iceServers: RTCIceServer[];
};

export type VideoCallHistoryItem = {
  id: string;
  caller_id: number;
  callee_id: number;
  status: "ringing" | "active" | "ended" | "rejected" | "missed";
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
};

class VideoCallApi {
  // --------------------------------------------------
  // CONFIG
  // --------------------------------------------------

  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------

  private async request<T>(
    url: string,
    token: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `API error (${response.status}): ${text}`
      );
    }

    return response.json() as Promise<T>;
  }

  // --------------------------------------------------
  // ICE SERVERS
  // --------------------------------------------------

  /**
   * Fetches ICE (STUN/TURN) configuration.
   *
   * This should be called:
   * - Once on app start
   * - Or once before first call
   */
  async getIceServers(token: string): Promise<IceServerConfig> {
    return this.request<IceServerConfig>(
      "/api/v1/ice/servers",
      token
    );
  }

  // --------------------------------------------------
  // CALL HISTORY
  // --------------------------------------------------

  /**
   * Fetches video call history for the current user.
   *
   * @param limit number of records (default 20)
   * @param offset pagination offset
   */
  async getCallHistory(
    token: string,
    limit = 20,
    offset = 0
  ): Promise<VideoCallHistoryItem[]> {
    return this.request<VideoCallHistoryItem[]>(
      `/api/v1/video-calls/history?limit=${limit}&offset=${offset}`,
      token
    );
  }
}

// --------------------------------------------------
// SINGLETON EXPORT
// --------------------------------------------------
// Base URL should come from environment config
// --------------------------------------------------

export const videoCallApi = new VideoCallApi(
  import.meta.env.VITE_API_BASE_URL
);
