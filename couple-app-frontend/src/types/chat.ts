export interface ChatConversationResponse {
  conversation_id: number;
}

export interface Media {
  id: number;
  key: string;
  file_name: string;
  file_type: string;
  file_size: number;
}

export interface ChatMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  message_text?: string;
  media?: Media;
  created_at: string;
  is_read?: boolean;
  status?: "sent" | "delivered" | "seen";
}

export interface IncomingWSMessage {
  type: "message" | "typing" | "delivered" | "seen";
  id?: number;
  sender_id?: number;
  receiver_id?: number;
  message_text?: string;
  media?: Media;
  created_at?: string;
  user_id?: number;
  status?: "start" | "stop";
  message_id?: number;
}

export type MessageStatus = "sent" | "delivered" | "seen";
