export interface ChatConversationResponse {
  conversation_id: number;
}

export interface ChatMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  message_text: string;
  created_at: string;
}

export interface IncomingWSMessage {
  type: "message" | "typing";
  id?: number;
  sender_id?: number;
  receiver_id?: number;
  message_text?: string;
  created_at?: string;
  user_id?: number;
  status?: "start" | "stop";
}
