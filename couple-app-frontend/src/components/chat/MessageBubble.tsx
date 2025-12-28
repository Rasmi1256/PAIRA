import type { ChatMessage } from "../../types/chat";

interface Props {
  msg: ChatMessage;
  userId: number;
  token: string; // <--- KEY CHANGE: Added token prop
}

export default function MessageBubble({ msg, userId, token }: Props) {
  const isMine = msg.sender_id === userId;

  const getStatusIcon = () => {
    if (!isMine) return null;

    if (msg.status === "seen") return "✓✓"; // Blue ticks (handle color in CSS)
    if (msg.status === "delivered") return "✓";
    return "•"; // sent / fallback
  };

  const renderMedia = () => {
    if (!msg.media) return null;

    const { file_type, key } = msg.media;
    
    // <--- KEY CHANGE: Append token to URL so <img> tag works
    const mediaUrl = `http://localhost:8000/api/v1/uploads/signed-url?key=${key}&token=${token}`;

    if (file_type.startsWith("image/")) {
      return (
        <img
          src={mediaUrl}
          alt="Shared image"
          style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8 }}
        />
      );
    } else if (file_type.startsWith("video/")) {
      return (
        <video
          controls
          style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8 }}
        >
          <source src={mediaUrl} type={file_type} />
        </video>
      );
    } else if (file_type === "image/gif") {
      return (
        <img
          src={mediaUrl}
          alt="Shared GIF"
          style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8 }}
        />
      );
    }
    return null;
  };

  return (
    <div
      style={{
        alignSelf: isMine ? "flex-end" : "flex-start",
        background: isMine ? "#DCF8C6" : "#fff",
        padding: "10px 14px",
        borderRadius: 10,
        maxWidth: "70%",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {renderMedia()}
      {msg.message_text && <div>{msg.message_text}</div>}

      {isMine && (
        <span
          style={{
            fontSize: 12,
            color: msg.status === "seen" ? "#0084ff" : "gray",
            marginLeft: 6,
            alignSelf: "flex-end",
          }}
        >
          {getStatusIcon()}
        </span>
      )}
    </div>
  );
}
