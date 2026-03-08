import React from "react";
import { FaPhone, FaPhoneSlash } from "react-icons/fa";

interface IncomingCallModalProps {
  isOpen: boolean;
  callerName: string;
  callerEmail: string;
  onAccept: () => void;
  onReject: () => void;
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  isOpen,
  callerName,
  callerEmail,
  onAccept,
  onReject,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white/20 backdrop-blur-2xl rounded-2xl p-8 shadow-2xl border border-white/30 max-w-sm w-full mx-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 mx-auto mb-4 flex items-center justify-center">
            <FaPhone className="text-white text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Incoming Call</h2>
          <p className="text-white/80 mb-1">{callerName}</p>
          <p className="text-white/60 text-sm mb-6">{callerEmail}</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={onReject}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white transition"
            >
              <FaPhoneSlash />
            </button>
            <button
              onClick={onAccept}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 text-white transition"
            >
              <FaPhone />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
