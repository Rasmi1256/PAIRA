import { useEffect, useRef, useState } from "react";
import { getConversation, getMessages } from "../api/chat";
import type { ChatMessage, IncomingWSMessage } from "../types/chat";

export type { ChatMessage } from "../types/chat";

const WS_BASE = "ws://localhost:8000/ws/chat";

export function useChat(token: string, userId: number, partnerId: number) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUser, setTypingUser] = useState<number | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -------------------------
  // INIT CONVERSATION
  // -------------------------
  useEffect(() => {
    async function initConversation() {
      try {
        const conv = await getConversation();
        setConversationId(conv.conversation_id);
      } catch (err) {
        console.error("Failed to load conversation", err);
      }
    }
    initConversation();
  }, [token]);

  // -------------------------
  // LOAD MESSAGES + WS CONNECT
  // -------------------------
  useEffect(() => {
    if (!conversationId) return;

    async function loadMessages() {
      try {
        const msgs = await getMessages(conversationId!);

        // --- FIX STARTS HERE ---
        // Map backend `is_read` to frontend `status`
        const formattedMsgs = msgs.map((m: any) => ({
          ...m,
          status: m.is_read ? "seen" : "delivered",
        }));
        setMessages(formattedMsgs);
        // --- FIX ENDS HERE ---

      } catch (err) {
        console.error("Failed to load messages", err);
      }
    }

    loadMessages();

    // Initialize WebSocket
    const ws = new WebSocket(`${WS_BASE}/${conversationId}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WS Connected");
    };

    ws.onmessage = (e) => {
      const data: IncomingWSMessage = JSON.parse(e.data);

      if (data.type === "typing") {
        if (data.status === "start" && data.user_id !== userId) {
          setTypingUser(data.user_id ?? null);
        } else if (data.status === "stop") {
          setTypingUser(null);
        }
        return;
      }

      if (data.type === "message") {
        setMessages((prev) => [
          ...prev,
          {
            id: data.id!,
            sender_id: data.sender_id!,
            receiver_id: data.receiver_id!,
            message_text: data.message_text,
            media: data.media,
            created_at: data.created_at!,
            status: "delivered", // Real-time messages start as delivered
          },
        ]);
        return;
      }

      if (data.type === "delivered") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === (data as any).message_id
              ? { ...m, status: "delivered" }
              : m
          )
        );
        return;
      }

      if (data.type === "seen") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.message_id ? { ...m, status: "seen" } : m
          )
        );
        return;
      }
    };

    ws.onclose = () => console.log("WS closed");
    ws.onerror = () => console.error("WS error");

    return () => {
      ws.close();
    };
  }, [conversationId, token, userId]);

  // -------------------------
  // SEND MESSAGE
  // -------------------------
  function sendMessage(text: string, mediaId?: number) {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (!text.trim() && !mediaId) return;

    wsRef.current.send(
      JSON.stringify({
        event: "message",
        receiver_id: partnerId,
        message_text: text || undefined,
        media_id: mediaId,
      })
    );
  }

  // -------------------------
  // TYPING
  // -------------------------
  function sendTypingStart() {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({ event: "typing_start" }));

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ event: "typing_stop" }));
      }
    }, 1500);
  }

  // -------------------------
  // SEEN
  // -------------------------
  function sendSeen(messageId: string) {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(
      JSON.stringify({
        event: "seen",
        message_id: messageId,
      })
    );
  }

  return {
    messages,
    typingUser,
    sendMessage,
    sendTypingStart,
    sendSeen,
  };
}