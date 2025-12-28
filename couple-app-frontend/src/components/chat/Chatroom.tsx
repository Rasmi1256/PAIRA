import { useState, useRef, useEffect } from "react";
import { useChat } from "../../hooks/useChat";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import { api } from "../../lib/api";

interface Props {
  token: string;
  userId: number;
  partnerId: number;
}

export default function ChatRoom({ token, userId, partnerId }: Props) {
  const { messages, typingUser, sendMessage, sendTypingStart, sendSeen } =
    useChat(token, userId, partnerId);

  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const submit = async () => {
    if (selectedFile) {
      setUploading(true);
      try {
        // Get presigned URL
        const uploadResponse = await api.post('/uploads/presigned-url', {
          fileName: selectedFile.name,
        });

        const { presignedUrl, key } = uploadResponse.data;

        // Upload to S3
        const s3Response = await fetch(presignedUrl, {
          method: 'PUT',
          body: selectedFile,
          headers: {
            'Content-Type': selectedFile.type,
          },
        });

        if (!s3Response.ok) throw new Error('Failed to upload to S3');

        // Complete upload
        const completeResponse = await api.post('/uploads/complete', {
          key,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
        });

        const media = completeResponse.data;

        // Send message with media
        sendMessage(input, media.id);
        setInput("");
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        console.error('Upload failed:', error);
        alert('Failed to upload file. Please try again.');
      } finally {
        setUploading(false);
      }
    } else {
      sendMessage(input);
      setInput("");
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  useEffect(() => {
    if (!messages.length || !sendSeen) return;

    const lastMessage = messages[messages.length - 1];

    // If last message belongs to partner and is not marked as seen -> mark seen
    if (lastMessage.sender_id !== userId && lastMessage.status !== "seen") {
      // Send seen event
      sendSeen(lastMessage.id);
    }
  }, [messages, sendSeen, userId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image, video, or GIF file.');
        return;
      }

      // Validate file size (e.g., max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        alert('File size must be less than 50MB.');
        return;
      }

      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.chatBox}>
        {messages.map((m) => (
          <MessageBubble 
            key={m.id} 
            msg={m} 
            userId={userId} 
            token={token}  // <--- KEY CHANGE: Passing token to bubble
          />
        ))}

        {typingUser && <TypingIndicator />}

        <div ref={bottomRef}></div>
      </div>

      {selectedFile && (
        <div style={styles.preview}>
          <span>{selectedFile.name}</span>
          <button onClick={removeFile}>✕</button>
        </div>
      )}

      <div style={styles.inputBox}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.gif"
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />
        <button
          style={styles.attachButton}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          📎
        </button>

        <input
          style={styles.input}
          value={input}
          placeholder="Type a message..."
          onChange={(e) => {
            setInput(e.target.value);
            sendTypingStart();
          }}
          onKeyDown={(e) => e.key === "Enter" && !uploading && submit()}
        />

        <button
          style={styles.button}
          onClick={submit}
          disabled={uploading || (!input.trim() && !selectedFile)}
        >
          {uploading ? "Uploading..." : "Send"}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    width: "100%",
    maxWidth: 600,
    margin: "auto",
    height: "90vh",
    display: "flex",
    flexDirection: "column",
  },

  chatBox: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: 10,
    overflowY: "auto",
    background: "#f4f4f4",
  },

  inputBox: {
    display: "flex",
    padding: 10,
    gap: 10,
    borderTop: "1px solid #ddd",
    alignItems: "center",
  },

  attachButton: {
    padding: "10px",
    borderRadius: 6,
    border: "1px solid gray",
    background: "#fff",
    cursor: "pointer",
  },

  input: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    border: "1px solid gray",
  },

  button: {
    padding: "10px 14px",
    borderRadius: 6,
    border: "none",
    background: "#4CAF50",
    color: "white",
    cursor: "pointer",
  },

  preview: {
    padding: 10,
    background: "#e0e0e0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
};
