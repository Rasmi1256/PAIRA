import type { IncomingWSMessage, ChatMessage } from "../types/chat";
import { api } from "../lib/api";

export async function getConversation(): Promise<IncomingWSMessage> {
  const res = await api.get("/chat/conversation");
  return res.data;
}

export async function getMessages(
  conversationId: number
): Promise<ChatMessage[]> {
  const res = await api.get(`/chat/messages/${conversationId}`);
  return res.data;
}

export async function deleteMessage(messageId: number): Promise<void> {
  await api.delete(`/chat/messages/${messageId}`);
}
