import React, { useState, useRef } from 'react';
import { FaPlay, FaPause, FaMicrophone } from 'react-icons/fa';
import type { VoiceMessage } from '../../types/voice_message';


// --- CONFIGURATION ---
// We need the root URL of your backend.
// If your VITE_API_BASE_URL includes "/api/v1", we strip it to get the root.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '')
  : 'http://localhost:8000';

interface VoiceMessageBubbleProps {
  voiceMessage: VoiceMessage;
  isOwn: boolean;
  onMarkAsListened: (id: number) => void;
  onDelete: (id: number) => void;
}

const VoiceMessageBubble: React.FC<VoiceMessageBubbleProps> = ({
  voiceMessage,
  isOwn,
  onMarkAsListened,
  onDelete,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioSrc, setAudioSrc] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- CRITICAL FIX: Smart URL Handler ---
  const getAudioUrl = async (path: string) => {
    if (!path) return '';

    // 1. If it's already a Signed URL (contains params like Signature), play it directly.
    if (path.includes('AWSAccessKeyId') || path.includes('Signature')) {
      return path;
    }

    // Get the auth token for the backend request
    const token = localStorage.getItem('token') || '';

    // 2. If it's a raw S3 URL (e.g. "https://bucket.../folder/file.wav"), extract the Key.
    if (path.includes('amazonaws.com')) {
      try {
        const urlObj = new URL(path);
        // Extract key from pathname (remove leading slash)
        // e.g. "/gallery/17/file.wav" -> "gallery/17/file.wav"
        const key = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;

        const encodedKey = encodeURIComponent(key);
        const response = await fetch(`${API_BASE_URL}/api/v1/uploads/signed-url?key=${encodedKey}&token=${token}`);
        if (response.ok) {
          const data = await response.json();
          return data.signed_url;
        } else {
          console.error("Failed to get signed URL:", response.status);
          return path;
        }
      } catch (e) {
        console.error("Error parsing S3 URL, falling back to original:", e);
        return path;
      }
    }

    // 3. If it's a relative path/key (e.g. "uploads/voice/abc.wav"), sign it.
    if (!path.startsWith('http')) {
      const encodedKey = encodeURIComponent(path);
      const response = await fetch(`${API_BASE_URL}/api/v1/uploads/signed-url?key=${encodedKey}&token=${token}`);
      if (response.ok) {
        const data = await response.json();
        return data.signed_url;
      } else {
        console.error("Failed to get signed URL:", response.status);
        return path;
      }
    }

    // 4. Fallback for other external URLs
    return path;
  };

  React.useEffect(() => {
    const loadAudioUrl = async () => {
      const url = await getAudioUrl(voiceMessage.audio_path);
      setAudioSrc(url);
    };
    loadAudioUrl();
  }, [voiceMessage.audio_path]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    if (audioRef.current) {
      try {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          // Explicitly load if the source changed or hasn't loaded
          if (audioRef.current.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
             audioRef.current.load();
          }
          await audioRef.current.play();
          if (!voiceMessage.listened_at) {
            onMarkAsListened(voiceMessage.id);
          }
        }
        setIsPlaying(!isPlaying);
      } catch (error) {
        console.error('Error playing audio:', error);
        console.error('Failed URL:', audioSrc);
        alert('Unable to play audio. Check console for URL details.');
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    const error = e.currentTarget.error;
    console.error('Audio Tag Error:', {
      code: error?.code, // 1=Aborted, 2=Network, 3=Decode, 4=SourceNotSupported
      message: error?.message,
      src: audioSrc
    });
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 relative group`}>
      {isOwn && (
        <button
          onClick={() => onDelete(voiceMessage.id)}
          className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
          title="Delete voice message"
        >
          🗑️
        </button>
      )}
      <div
        className={`max-w-xs px-4 py-2 rounded-lg ${
          isOwn
            ? 'bg-pink-500 text-white'
            : 'bg-gray-200 text-gray-800'
        }`}
      >
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePlayPause}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 shadow-lg hover:scale-105 ${
              isPlaying
                ? 'bg-gradient-to-r from-red-500 to-orange-500 animate-pulse'
                : 'bg-gradient-to-r from-blue-500 to-purple-600'
            }`}
          >
            {isPlaying ? <FaPause size={14} /> : <FaPlay size={14} />}
          </button>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <FaMicrophone size={14} />
              <span className="text-sm">
                {formatTime(currentTime)} / {formatTime(voiceMessage.duration_seconds)}
              </span>
            </div>
            <div className="w-full bg-white bg-opacity-20 rounded-full h-1 mt-1">
              <div
                className="bg-white h-1 rounded-full transition-all duration-100"
                style={{
                  width: `${(currentTime / voiceMessage.duration_seconds) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
        <audio
          ref={audioRef}
          src={audioSrc}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onError={handleAudioError}
          preload="metadata"
        />
      </div>
    </div>
  );
};

export default VoiceMessageBubble;