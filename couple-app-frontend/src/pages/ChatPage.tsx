import React, { useState, useEffect } from "react";
import { useAuth } from "../context/useAuth";
import { api } from "../lib/api";
import ChatRoom from "../components/chat/Chatroom";

const ChatPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [partnerId, setPartnerId] = useState<number | null>(null);
  const [loadingPartner, setLoadingPartner] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPartnerId = async () => {
      if (!user) {
        setLoadingPartner(false);
        return;
      }

      try {
       const response = await api.get('/couples/me', {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

        const couple = response.data;
        const currentUserId = parseInt(user.id);
        if (!couple.user1_id || !couple.user2_id) {
          throw new Error('Couple data is incomplete.');
        }
        const partnerId = couple.user1_id === currentUserId ? couple.user2_id : couple.user1_id;
        setPartnerId(partnerId);
      } catch (error) {
        console.error('Error fetching couple data:', error);
        setError('You need to be in a couple to use the chat feature.');
      } finally {
        setLoadingPartner(false);
      }
    };

    fetchPartnerId();
  }, [user]);

  if (loading || loadingPartner) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          fontWeight: 500,
        }}
      >
        Loading chat...
      </div>
    );
  }

  if (!user) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          fontWeight: 500,
        }}
      >
        Authentication required. Please login first.
      </div>
    );
  }

  if (error || !partnerId) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          fontWeight: 500,
          flexDirection: "column",
          textAlign: "center",
        }}
      >
        <div>{error || "You need to be in a couple to use the chat feature."}</div>
        <div style={{ fontSize: 14, marginTop: 10, color: "#666" }}>
          Connect with your partner to start messaging.
        </div>
      </div>
    );
  }

  // Get token from localStorage as fallback, but ideally from auth context
  const token = localStorage.getItem("token");
  if (!token) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          fontWeight: 500,
        }}
      >
        Authentication token missing. Please login again.
      </div>
    );
  }

  return (
    <div className="chat-app">
      <ChatRoom token={token} userId={parseInt(user.id)} partnerId={partnerId} />
    </div>
  );
};

export default ChatPage;
