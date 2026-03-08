import { useEffect, useState } from "react";
import { api } from "../../lib/api";

interface Props {
  conversationId: string | number;
  token: string;
  onClose: () => void;
  refreshTrigger?: number; // Optional prop to trigger refresh
}

interface MediaItem {
  id: number;
  media: {
    key: string;
    file_type: string;
    signed_url?: string;
  } | null; // Allow null here for safety
}

export default function SharedGallery({ conversationId, token, onClose, refreshTrigger: _refreshTrigger }: Props) {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) return;

    api.get(`/chat/conversations/${conversationId}/media`)
      .then((res) => {
        setMediaList(res.data);
      })
      .catch((err) => console.error("Failed to load gallery:", err))
      .finally(() => setLoading(false));
  }, [conversationId]);

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={{ margin: 0 }}>Shared Media</h3>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>
        
        <div style={styles.grid}>
          {loading ? (
            <p style={{ padding: 20, textAlign: "center" }}>Loading...</p>
          ) : mediaList.length === 0 ? (
            <p style={{ padding: 20, textAlign: "center", color: "#666" }}>No media shared yet.</p>
          ) : (
            mediaList.map((msg) => {
               // --- SAFETY CHECK START ---
               if (!msg.media) return null;
               // --- SAFETY CHECK END ---

               const url = msg.media.signed_url || `http://localhost:8000/api/v1/uploads/signed-url?key=${msg.media.key}&token=${token}`;

               return (
                 <div key={msg.id} style={styles.gridItem}>
                   {msg.media.file_type.startsWith("video") ? (
                      <video src={url} style={styles.thumb} controls />
                   ) : (
                      <img src={url} style={styles.thumb} alt="media" />
                   )}
                 </div>
               );
            })
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.8)", zIndex: 100,
    display: "flex", justifyContent: "center", alignItems: "center"
  },
  modal: {
    background: "white", width: "90%", maxWidth: 600, maxHeight: "80vh",
    borderRadius: 12, display: "flex", flexDirection: "column",
    overflow: "hidden", boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
  },
  header: {
    padding: "15px 20px", borderBottom: "1px solid #eee",
    display: "flex", justifyContent: "space-between", alignItems: "center"
  },
  closeBtn: {
    background: "none", border: "none", fontSize: 24, cursor: "pointer"
  },
  grid: {
    padding: 20, overflowY: "auto",
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
    gap: 10
  },
  gridItem: {
    height: 100, background: "#f0f0f0", borderRadius: 8, overflow: "hidden",
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  thumb: {
    width: "100%", height: "100%", objectFit: "cover"
  }
};
