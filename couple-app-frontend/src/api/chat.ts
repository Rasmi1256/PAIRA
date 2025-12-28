import type { ChatConversationResponse, ChatMessage } from "../types/chat";
import { api } from "../lib/api";

export async function getConversation(): Promise<ChatConversationResponse> {
  const res = await api.get("/chat/conversation");
  return res.data;
}

export async function getMessages(
  conversationId: number
): Promise<ChatMessage[]> {
  const res = await api.get(`/chat/messages/${conversationId}`);
  return res.data;
}
