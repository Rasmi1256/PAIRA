import { useState, useRef, useEffect } from "react";
import { useChat } from "../../hooks/useChat";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import SharedGallery from "./SharedGallery"; // <--- Import the Gallery
import VoiceRecorder from "./VoiceRecorder";
import VoiceMessageBubble from "./VoiceMessageBubble";
import { api } from "../../lib/api";
import { deleteMessage } from "../../api/chat";
import { voiceMessageApi } from "../../api/voice_message";
import type { VoiceMessage } from "../../types/voice_message";

interface Props {
  token: string;
  userId: number;
  partnerId: number;
}

export default function ChatRoom({ token, userId, partnerId }: Props) {
  // 1. Destructure sendReaction and removeMessage
  const { messages, typingUser, sendMessage, sendTypingStart, sendSeen, sendReaction } =
    useChat(token, userId, partnerId);

  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showGallery, setShowGallery] = useState(false); // <--- State for Gallery
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [voiceMessages, setVoiceMessages] = useState<VoiceMessage[]>([]);
  const [galleryRefreshTrigger, _setGalleryRefreshTrigger] = useState(0); // <--- Trigger for gallery refresh
  
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 2. Connect the real reaction function
  const handleReact = (messageId: number, emoji: string) => {
    sendReaction(messageId, emoji);
  };

  // Handle message deletion
  const handleDelete = async (messageId: number) => {
    try {
      await deleteMessage(messageId);
      // Refresh messages after deletion
      // The useChat hook should handle this via WebSocket or we can trigger a refresh
    } catch (error) {
      console.error('Failed to delete message:', error);
      alert('Failed to delete message. Please try again.');
    }
  };

  const submit = async () => {
    if (selectedFile) {
      setUploading(true);
      try {
        const uploadResponse = await api.post('/uploads/presigned-url', {
          fileName: selectedFile.name,
        });

        const { presignedUrl, key } = uploadResponse.data;

        const s3Response = await fetch(presignedUrl, {
          method: 'PUT',
          body: selectedFile,
          headers: {
            'Content-Type': selectedFile.type,
          },
        });

        if (!s3Response.ok) throw new Error('Failed to upload to S3');

        const completeResponse = await api.post('/uploads/complete', {
          key,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
        });

        const media = completeResponse.data;

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

    if (lastMessage.sender_id !== userId && lastMessage.status !== "seen") {
      sendSeen(String(lastMessage.id)); // Ensure ID is string
    }
  }, [messages, sendSeen, userId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image, video, or GIF file.');
        return;
      }
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

  const handleVoiceRecordingComplete = async (audioBlob: Blob) => {
    try {
      const audioFile = new File([audioBlob], 'voice_message.wav', { type: 'audio/wav' });
      await voiceMessageApi.createVoiceMessage({
        receiver_id: partnerId,
        audio_file: audioFile,
      });
      setShowVoiceRecorder(false);
      // Refresh voice messages
      const messages = await voiceMessageApi.getVoiceMessages();
      setVoiceMessages(messages);
    } catch (error) {
      console.error('Failed to send voice message:', error);
      alert('Failed to send voice message. Please try again.');
    }
  };

  const handleMarkAsListened = async (voiceMessageId: number) => {
    try {
      await voiceMessageApi.updateVoiceMessage(voiceMessageId, {
        listened_at: new Date().toISOString(),
      });
      // Update local state
      setVoiceMessages(prev =>
        prev.map(vm =>
          vm.id === voiceMessageId
            ? { ...vm, listened_at: new Date().toISOString() }
            : vm
        )
      );
    } catch (error) {
      console.error('Failed to mark as listened:', error);
    }
  };

  const handleDeleteVoiceMessage = async (voiceMessageId: number) => {
    try {
      await voiceMessageApi.deleteVoiceMessage(voiceMessageId);
      // Remove from local state
      setVoiceMessages(prev => prev.filter(vm => vm.id !== voiceMessageId));
    } catch (error) {
      console.error('Failed to delete voice message:', error);
      alert('Failed to delete voice message. Please try again.');
    }
  };

  useEffect(() => {
    const loadVoiceMessages = async () => {
      try {
        const messages = await voiceMessageApi.getVoiceMessages();
        setVoiceMessages(messages);
      } catch (error) {
        console.error('Failed to load voice messages:', error);
      }
    };
    loadVoiceMessages();
  }, []);

  return (
    <div style={styles.wrapper}>
      {/* 3. Add Header with Gallery Button */}
      <div style={styles.header}>
        <h3 style={{ margin: 0 }}>Chat</h3>
        <button style={styles.galleryButton} onClick={() => setShowGallery(true)}>
          🖼️ Gallery
        </button>
      </div>

      <div style={styles.chatBox}>
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            msg={m}
            userId={userId}
            token={token}
            onReact={handleReact}
            onDelete={handleDelete}
          />
        ))}

        {voiceMessages.map((vm) => (
          <VoiceMessageBubble
            key={vm.id}
            voiceMessage={vm}
            isOwn={vm.sender_id === userId}
            onMarkAsListened={handleMarkAsListened}
            onDelete={handleDeleteVoiceMessage}
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

        <button
          style={styles.voiceButton}
          onClick={() => setShowVoiceRecorder(true)}
          disabled={uploading}
        >
          🎤
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

      {/* 4. Render Gallery Overlay */}
      {showGallery && (
        <SharedGallery
            conversationId={messages.length > 0 ? String(messages[0].id) : "0"}
            token={token}
            onClose={() => setShowGallery(false)}
            refreshTrigger={galleryRefreshTrigger}
        />
      )}

      {/* Voice Recorder Overlay */}
      {showVoiceRecorder && (
        <VoiceRecorder
          onRecordingComplete={handleVoiceRecordingComplete}
          onCancel={() => setShowVoiceRecorder(false)}
        />
      )}
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
    border: "1px solid #ddd", // Added border for clarity
    borderRadius: 8,
    overflow: "hidden"
  },
  
  // New Header Style
  header: {
    padding: "10px 15px",
    background: "#fff",
    borderBottom: "1px solid #ddd",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 5
  },

  galleryButton: {
    padding: "6px 12px",
    borderRadius: 6,
    border: "1px solid #ddd",
    background: "#f9f9f9",
    cursor: "pointer",
    fontSize: 14
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
    background: "#fff"
  },

  attachButton: {
    padding: "10px",
    borderRadius: 6,
    border: "1px solid gray",
    background: "#fff",
    cursor: "pointer",
  },

  voiceButton: {
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

