import React, { useState, useEffect } from 'react';
import { FaComments } from 'react-icons/fa';
import { useAuth } from '../../context/useAuth';
import { api } from '../../lib/api';

const MessagesView: React.FC = () => {
  const { user } = useAuth();
  const [partnerId, setPartnerId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPartnerId = async () => {
      if (!user) return;

      try {
        const response = await api.get('/couples/me');
        const couple = response.data;
        const currentUserId = parseInt(user.id);
        const partnerId = couple.user1_id === currentUserId ? couple.user2_id : couple.user1_id;
        setPartnerId(partnerId);
      } catch (error) {
        console.error('Error fetching couple data:', error);
        // If not in a couple, keep partnerId undefined
      } finally {
        setLoading(false);
      }
    };

    fetchPartnerId();
  }, [user]);

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-md p-6 border border-white/20">
        <div className="flex items-center mb-4">
          <FaComments className="text-3xl text-green-600 mr-4" />
          <h2 className="text-2xl font-bold text-gray-800">Messages</h2>
        </div>
        <div className="text-center py-16">
          <p className="text-gray-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (!partnerId) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-md p-6 border border-white/20">
        <div className="flex items-center mb-4">
          <FaComments className="text-3xl text-green-600 mr-4" />
          <h2 className="text-2xl font-bold text-gray-800">Messages</h2>
        </div>
        <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500">You need to be in a couple to use the chat feature.</p>
          <p className="text-sm text-gray-400 mt-2">Connect with your partner to start messaging.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-md p-6 border border-white/20">
      <div className="flex items-center mb-4">
        <FaComments className="text-3xl text-green-600 mr-4" />
        <h2 className="text-2xl font-bold text-gray-800">Messages</h2>
      </div>
      <div className="h-96 overflow-hidden rounded-lg">
      </div>
    </div>
  );
};

export default MessagesView;
