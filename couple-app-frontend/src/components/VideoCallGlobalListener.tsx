import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { videoCallSocket } from "../api/videoCallSocket";
import { buildVideoCallWsUrl } from "../api/buildVideoCallWsUrl";

const VideoCallGlobalListener: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    videoCallSocket.connect(buildVideoCallWsUrl(token));

    const unsubscribeIncoming =
      videoCallSocket.onIncomingCallEvent(() => {
        if (location.pathname !== "/video-call") {
          navigate("/video-call");
        }
      });

    return () => {
      unsubscribeIncoming();
    };
  }, [user, navigate, location.pathname]);

  return null;
};

export default VideoCallGlobalListener;
