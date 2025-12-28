import React, { useState, useEffect } from 'react';
import { FaPlus, FaImages, FaStar, FaHeart, FaClock, FaCalendarAlt } from 'react-icons/fa';
import { api } from '../../lib/api';
import { isAxiosError } from 'axios';
import { Album } from '../../types/gallery';

const AlbumListView: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchAlbums = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/gallery/albums');
      setAlbums(response.data);
    } catch (err) {
      console.error('Failed to fetch albums:', err);
      setError('Could not load your albums. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  const smartCollections = [
    { id: 'favorites', name: 'Favorites', icon: FaHeart, color: 'text-red-500' },
    { id: 'starred', name: 'Starred Moments', icon: FaStar, color: 'text-yellow-500' },
    { id: 'recent', name: 'Recent', icon: FaClock, color: 'text-blue-500' },
    { id: 'this-month', name: 'This Month', icon: FaCalendarAlt, color: 'text-green-500' },
  ];

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-16 border-2 border-dashed border-red-300 rounded-lg bg-red-50/50">
          <FaImages className="mx-auto text-4xl text-red-500 mb-4" />
          <p className="text-red-600 font-semibold">An Error Occurred</p>
          <p className="text-sm text-red-500 mt-1">{error}</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Smart Collections */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Smart Collections</h3>
          <div className="grid grid-cols-2 gap-3">
            {smartCollections.map(collection => {
              const IconComponent = collection.icon;
              return (
                <div
                  key={collection.id}
                  className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/80 transition-all cursor-pointer"
                >
                  <IconComponent className={`text-2xl ${collection.color} mb-2`} />
                  <h4 className="font-medium text-gray-800">{collection.name}</h4>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Albums */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">My Albums</h3>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center w-8 h-8 bg-pink-600 text-white rounded-full hover:bg-pink-700 transition-colors"
            >
              <FaPlus className="w-4 h-4" />
            </button>
          </div>

          {albums.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <FaImages className="mx-auto text-4xl text-gray-400 mb-4" />
              <p className="text-gray-500">No albums yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Create your first album to organize your memories.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {albums.map(album => (
                <div
                  key={album.id}
                  className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/80 transition-all cursor-pointer"
                >
                  <FaImages className="text-2xl text-pink-500 mb-2" />
                  <h4 className="font-medium text-gray-800 truncate">{album.name}</h4>
                  <p className="text-sm text-gray-500">
                    {album.mediaCount || 0} items
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-md p-6 border border-white/20">
      <div className="flex items-center mb-6">
        <FaImages className="text-3xl text-pink-600 mr-4" />
        <h2 className="text-2xl font-bold text-gray-800">Albums</h2>
      </div>

      {renderContent()}

      {/* Create Album Modal - Placeholder for now */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Create New Album</h3>
            <p className="text-gray-600 mb-4">Album creation modal will be implemented next.</p>
            <button
              onClick={() => setShowCreateModal(false)}
              className="w-full bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlbumListView;
