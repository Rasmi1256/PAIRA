import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaTimes } from 'react-icons/fa';
import { api } from '../../lib/api';
import { useAuth } from '../../context/useAuth';
import { toast } from 'react-toastify';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);


  useEffect(() => {
    if (user) {
      setFullName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadProfilePicture = async () => {
    if (!profilePicture) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', profilePicture);

    try {
      // When uploading FormData, do NOT set the 'Content-Type' header manually.
      // Axios and the browser will automatically set it to 'multipart/form-data'
      // with the correct boundary, which is crucial for the server to parse it.
      const response = await api.post('/users/me/profile-picture', formData);

      const updatedUser = response.data;
      toast.success('Profile picture updated successfully!');
      
      // TODO: Update user context with the new profile picture URL from updatedUser

      setProfilePicture(null);
      setProfilePicturePreview(null);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'An unexpected error occurred during upload.';
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await api.patch('/users/me', {
        full_name: fullName,
        email
      });

      const data = response.data;

      toast.success('Profile updated successfully!');
      // TODO: Update user context with new name/email
      onClose();

    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'An unexpected error occurred.';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <FaTimes size={20} />
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Profile</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name Input */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <FaUser className="text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Your Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          {/* Email Input */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <FaEnvelope className="text-gray-400" />
            </span>
            <input
              type="email"
              placeholder="Your Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          {/* Profile Picture Upload */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
            />
            {profilePicturePreview && (
              <div className="flex items-center space-x-3">
                <img
                  src={profilePicturePreview}
                  alt="Preview"
                  className="w-16 h-16 rounded-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleUploadProfilePicture}
                  disabled={isUploading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-pink-600 rounded-md hover:bg-pink-700 disabled:bg-pink-400"
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="px-6 py-2 text-sm font-semibold text-white bg-pink-600 rounded-md hover:bg-pink-700 disabled:bg-pink-400"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};