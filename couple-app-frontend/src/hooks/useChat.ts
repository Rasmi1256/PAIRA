import { useEffect, useRef, useState } from "react";
import { getConversation, getMessages } from "../api/chat";
import type { ChatMessage, IncomingWSMessage } from "../types/chat";


export type { ChatMessage } from "../types/chat";

const WS_BASE = "ws://localhost:8000/ws/chat";

export function useChat(token: string, userId: number, partnerId: number) {
  const [conversationId, setConversationId] = useState<number | null>(null);
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

        // Map backend `is_read` to frontend `status`
        const formattedMsgs = msgs.map((m: any) => ({
          ...m,
          status: m.is_read ? "seen" : "delivered",
        }));
        setMessages(formattedMsgs);
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

      // -------------------------
      // TYPING EVENTS
      // -------------------------
      if (data.type === "typing") {
        if (data.status === "start" && data.user_id !== userId) {
          setTypingUser(data.user_id ?? null);
        } else if (data.status === "stop") {
          setTypingUser(null);
        }
        return;
      }

      // -------------------------
      // NEW MESSAGE
      // -------------------------
      // -------------------------
      // NEW MESSAGE
      // -------------------------
      if (data.type === "message") {
        setMessages((prev) => [
          ...prev,
          {
            id: data.id!,
            sender_id: data.sender_id!,
            receiver_id: data.receiver_id!,
            // Use '?? null' to ensure it matches 'string | null'
            message_text: data.message_text ?? null, 
            media: data.media ?? null,
            created_at: data.created_at!,
            status: "delivered", 
            // Explicitly cast the empty array to the correct type
            reactions: [] as any[], 
          } as ChatMessage, // <--- Add this 'as ChatMessage' to force the type
        ]);
        return;
      }
      // -------------------------
      // DELIVERED STATUS
      // -------------------------
      if (data.type === "delivered") {
        setMessages((prev) =>
          prev.map((m) =>
            // Compare as String to avoid Type Mismatch
            String(m.id) === String(data.message_id)
              ? { ...m, status: "delivered" }
              : m
          )
        );
        return;
      }

      // -------------------------
      // SEEN STATUS
      // -------------------------
      if (data.type === "seen") {
        setMessages((prev) =>
          prev.map((m) =>
            String(m.id) === String(data.message_id) 
              ? { ...m, status: "seen" } 
              : m
          )
        );
        return;
      }

      // -------------------------
      // REACTION UPDATE
      // -------------------------
      // -------------------------
      // REACTION UPDATE
      // -------------------------
      if (data.type === "reaction_update") {
        setMessages((prev) =>
          prev.map((msg) => {
            // FIX: Convert IDs to string to ensure safe comparison
            if (String(msg.id) !== String(data.message_id)) return msg;

            const currentReactions = msg.reactions || [];

            if (data.action === "add") {
              // Avoid duplicates in UI if event fires twice
              const exists = currentReactions.some(
                (r) => r.id === data.reaction_id
              );
              if (exists) return msg;

              return {
                ...msg,
                reactions: [
                  ...currentReactions,
                  { 
                    // FIX: Explicitly cast to ensure types match 'Reaction' interface
                    id: Number(data.reaction_id), 
                    user_id: Number(data.user_id), 
                    emoji: String(data.emoji) 
                  },
                ],
              };
            } else if (data.action === "remove") {
              return {
                ...msg,
                reactions: currentReactions.filter(
                  (r) => r.id !== data.reaction_id
                ),
              };
            }
            return msg;
          })
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
  // SEND REACTION
  // -------------------------
  function sendReaction(messageId: number, emoji: string) {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    wsRef.current.send(JSON.stringify({
      event: "reaction_add",
      message_id: messageId,
      emoji: emoji
    }));
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

  // -------------------------
// REMOVE MESSAGE
// -------------------------
  function removeMessage(messageId: number) {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  }

  return {
    conversationId,
    messages,
    typingUser,
    sendMessage,
    sendTypingStart,
    sendSeen,
    sendReaction,
    removeMessage, // <--- Exported
  };
}