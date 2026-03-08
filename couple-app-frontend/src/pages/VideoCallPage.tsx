import React, { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { api } from "../lib/api";
import { VideoCallView } from "../components/VideoCallView";

const VideoCallPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [partnerId, setPartnerId] = useState<number | null>(null);
  const [partnerName, setPartnerName] = useState<string>("");
  const [partnerEmail, setPartnerEmail] = useState<string>("");
  const [loadingPartner, setLoadingPartner] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPartnerId = async () => {
      if (!user) {
        setLoadingPartner(false);
        return;
      }

      try {
        const response = await api.get("/couples/me");
        const couple = response.data;
        const currentUserId = Number.parseInt(user.id, 10);

        if (!couple.user1_id || !couple.user2_id) {
          throw new Error("Couple data is incomplete.");
        }

        const resolvedPartnerId =
          couple.user1_id === currentUserId ? couple.user2_id : couple.user1_id;

        // Fetch partner details
        const partnerResponse = await api.get(`/users/${resolvedPartnerId}`);
        const partner = partnerResponse.data;

        setPartnerId(resolvedPartnerId);
        setPartnerName(partner.full_name);
        setPartnerEmail(partner.email);
        setError(null);
      } catch (fetchError) {
        console.error("Error fetching couple data:", fetchError);
        setError("You need to be in a couple to use the video call feature.");
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
        Loading video call...
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
        <div>{error || "You need to be in a couple to use the video call feature."}</div>
        <div style={{ fontSize: 14, marginTop: 10, color: "#666" }}>
          Connect with your partner to start calling.
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh" }}>
      <VideoCallView
        token={token}
        partnerId={partnerId}
        partnerName={partnerName}
        partnerEmail={partnerEmail}
      />
    </div>
  );
};

export default VideoCallPage;
