import React, { useState, useRef, useCallback } from 'react';
import { FaMicrophone, FaStop, FaPlay, FaTrash } from 'react-icons/fa';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onCancel: () => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onCancel,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start timer
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setDuration(seconds);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [isRecording]);

  const playRecording = useCallback(() => {
    if (audioBlob && audioRef.current) {
      const url = URL.createObjectURL(audioBlob);
      audioRef.current.src = url;
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [audioBlob]);

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleSend = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Voice Message</h3>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <FaTrash size={16} />
        </button>
      </div>

      <div className="flex items-center space-x-4 mb-4">
        {!audioBlob ? (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex items-center justify-center w-12 h-12 rounded-full ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-pink-500 hover:bg-pink-600'
            } text-white transition-colors`}
          >
            {isRecording ? <FaStop size={20} /> : <FaMicrophone size={20} />}
          </button>
        ) : (
          <button
            onClick={playRecording}
            disabled={isPlaying}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors disabled:opacity-50"
          >
            <FaPlay size={20} />
          </button>
        )}

        <div className="flex-1">
          <div className="text-sm text-gray-600">
            {isRecording ? 'Recording...' : audioBlob ? 'Preview' : 'Tap to record'}
          </div>
          <div className="text-lg font-mono">
            {formatTime(duration)}
          </div>
        </div>
      </div>

      {audioBlob && (
        <div className="flex space-x-2">
          <button
            onClick={handleSend}
            className="flex-1 bg-pink-500 text-white py-2 px-4 rounded-lg hover:bg-pink-600 transition-colors"
          >
            Send Voice Message
          </button>
        </div>
      )}

      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default VoiceRecorder;
