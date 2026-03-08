export interface VoiceMessage {
  id: number;
  couple_id: number;
  sender_id: number;
  receiver_id: number;
  audio_path: string;
  duration_seconds: number;
  listened_at: string | null;
  created_at: string;
}

export interface VoiceMessageCreate {
  receiver_id: number;
  audio_file: File;
}

export interface VoiceMessageUpdate {
  listened_at: string;
}
