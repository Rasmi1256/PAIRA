import { useState } from "react";
import type { ChatMessage } from "../../types/chat";

interface Props {
  msg: ChatMessage;
  userId: number;
  token: string;
  onReact: (messageId: number, emoji: string) => void;
  onDelete: (messageId: number) => void;
}

const AVAILABLE_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

export default function MessageBubble({ msg, userId, token, onReact, onDelete }: Props) {
  const isMine = msg.sender_id === userId;
  const [showReactions, setShowReactions] = useState(false);

  const getStatusIcon = () => {
    if (!isMine) return null;
    if (msg.status === "seen") return "✓✓";
    if (msg.status === "delivered") return "✓";
    return "•";
  };

  const renderMedia = () => {
    if (!msg.media) return null;
    return <MediaContent media={msg.media} token={token} />;
  };

  return (
    <div
      style={{
        alignSelf: isMine ? "flex-end" : "flex-start",
        maxWidth: "70%",
        position: "relative",
        marginBottom: 24,
      }}
      onMouseEnter={() => setShowReactions(true)}
      onMouseLeave={() => setShowReactions(false)}
    >
      {/* Reaction Picker and Delete Button */}
      {showReactions && (
        <div style={styles.reactionPicker}>
          {AVAILABLE_REACTIONS.map((emoji) => (
            <span
              key={emoji}
              onClick={() => {
                onReact(msg.id, emoji);
                setShowReactions(false);
              }}
              style={styles.reactionOption}
            >
              {emoji}
            </span>
          ))}
          {isMine && (
            <span
              onClick={() => {
                onDelete(msg.id);
                setShowReactions(false);
              }}
              style={{ ...styles.reactionOption, color: "red", fontSize: 16 }}
              title="Delete message"
            >
              🗑️
            </span>
          )}
        </div>
      )}

      {/* Message Bubble */}
      <div
        style={{
          background: isMine ? "#DCF8C6" : "#fff",
          padding: "10px 14px",
          borderRadius: 10,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
        }}
      >
        {renderMedia()}
        {msg.message_text && <div>{msg.message_text}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 10, color: "#999" }}>
            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isMine && (
            <span style={{ fontSize: 12, color: msg.status === "seen" ? "#34B7F1" : "gray" }}>
              {getStatusIcon()}
            </span>
          )}
        </div>
      </div>

      {/* Reaction Display */}
      {msg.reactions && msg.reactions.length > 0 && (
        <div style={styles.reactionsContainer}>
          {msg.reactions.map((r, i) => (
            <span key={i} title={`User ${r.user_id}`}>
              {r.emoji}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Media Component
function MediaContent({ media, token }: { media: any; token: string }) {
  const mediaUrl = media.signed_url || `http://localhost:8000/api/v1/uploads/signed-url?key=${media.key}&token=${token}`;

  if (media.file_type.startsWith("image/")) {
    return <img src={mediaUrl} alt="shared" style={{ maxWidth: "100%", borderRadius: 8 }} />;
  }
  if (media.file_type.startsWith("video/")) {
    return <video src={mediaUrl} controls style={{ maxWidth: "100%", borderRadius: 8 }} />;
  }
  return null;
}

const styles: Record<string, React.CSSProperties> = {
  reactionPicker: {
    position: "absolute",
    top: -40,
    left: 0,
    background: "white",
    borderRadius: 24,
    padding: "6px 12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    display: "flex",
    gap: 8,
    zIndex: 10,
    cursor: "pointer",
  },
  reactionOption: {
    fontSize: 20,
    transition: "transform 0.2s",
  },
  reactionsContainer: {
    position: "absolute",
    bottom: -18,
    right: 0,
    background: "white",
    borderRadius: 12,
    padding: "2px 6px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
    display: "flex",
    gap: 2,
    fontSize: 12,
    border: "1px solid #eee",
    zIndex: 5,
  },
};
