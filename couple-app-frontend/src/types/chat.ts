// src/types/chat.ts

export interface Reaction {
  id: number;
  user_id: number;
  emoji: string;
}

export interface ChatMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  message_text: string | null;
  media?: {
    id: number;
    key: string;
    file_name: string;
    file_type: string;
    file_size: number;
    signed_url?: string;
  } | null;
  is_read?: boolean;
  created_at: string;
  status?: "sent" | "delivered" | "seen";

  // Reaction support
  reactions?: Reaction[];
}

export interface IncomingWSMessage {
  type: "message" | "typing" | "online_status" | "delivered" | "seen" | "reaction_update";
  
  // Standard Message Fields
  id?: number;
  sender_id?: number;
  receiver_id?: number;
  message_text?: string;
  media?: any;
  created_at?: string;

  // Status / Typing Fields
  user_id?: number;
  status?: string;
  message_id?: string | number; // ID of the message being updated

  // Reaction Fields (The missing properties)
  action?: "add" | "remove";
  reaction_id?: number;
  emoji?: string;
  
  // Allow any other extra fields from backend to prevent crashes
  [key: string]: any;
}

