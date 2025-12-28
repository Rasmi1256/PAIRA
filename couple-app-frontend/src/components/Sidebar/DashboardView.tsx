import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { isAxiosError } from 'axios';
import { api } from '../../lib/api';
import { FaUser, FaEnvelope, FaHeart, FaCalendarAlt, FaImages, FaPencilAlt, FaTimes, FaSignOutAlt, FaComments } from 'react-icons/fa';

/* --- Reusable Card Component --- */
interface DashboardCardProps {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    iconColor: string;
    onClick?: () => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ icon, title, subtitle, iconColor, onClick }) => (
    <div
        className="
            rounded-xl
            p-6
            bg-white/70
            backdrop-blur-xl
            border border-white/30
            shadow-lg
            hover:shadow-2xl
            transition-all
            duration-300
            hover:scale-[1.02]
            cursor-pointer
        "
        onClick={onClick}
    >
        <div className="flex items-center">
            <div
                className={`
                    p-3 rounded-full shadow-sm 
                    ${iconColor} 
                `}
            >
                {icon}
            </div>

            <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <p className="text-gray-600">{subtitle}</p>
            </div>
        </div>
    </div>
);

/* --- Main Dashboard View --- */
const DashboardView: React.FC = () => {
    // NOTE: You will need to expose an `updateUser` function from your `useAuth` hook
    // to allow the user object to be updated globally after an upload, and a `logout`
    // function to handle signing out.
    const { user, updateUser, loading, logout } = useAuth();
    const navigate = useNavigate();
    const [isProfileModalOpen, setProfileModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Define the base URL of your backend.
    // IMPORTANT: For production, this should come from an environment variable.
    // Example: const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
   const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    // Helper to construct the full image URL, handling both relative and absolute paths.
    const getFullImageUrl = (relativeUrl?: string) => {
        if (!relativeUrl) return undefined;
        if (relativeUrl.startsWith('http')) return relativeUrl; // It's already an absolute URL.
        try {
            // Use the URL constructor for robust path joining.
            return new URL(relativeUrl, BACKEND_URL).href;
        } catch (error) {
            console.error('Error constructing full image URL:', error);
            return undefined;
        }
    };

    const profileImageUrl = getFullImageUrl(user?.profile_picture_url); // Keep optional chaining here for initial render before guards

    const handleProfilePictureChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            // IMPORTANT: Replace with your actual backend endpoint for uploading a profile picture.
            const response = await api.post(`/users/me/profile-picture`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Assuming the backend returns the updated user object
            if (updateUser) {
                updateUser(response.data);
            }
            setProfileModalOpen(false); // Close modal on success
        } catch (error) {
            let errorMessage = 'Failed to upload image. Please try again.';
            // Check if it's an Axios error with a response from the server for better debugging.
            if (isAxiosError(error) && error.response) {
                console.error('Server Error Details:', error.response.data);
                // Show a more specific, yet user-friendly, message for server-side issues.
                errorMessage = 'Upload failed due to a server error.';
            }
            console.error('Profile picture upload failed:', error);
            setUploadError(errorMessage);
        } finally {
            setIsUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-20">
                <svg className="animate-spin h-10 w-10 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none"
                     viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }

    if (!user) {
        // This case handles when loading is finished but the user is not authenticated.
        // You could render a message or redirect to a login page.
        return <div className="text-center p-10">Could not load user profile. Please log in.</div>;
    }

    // Now that we've confirmed user exists, we can safely use its properties.

    return (
        <div
            className="
                grid 
                grid-cols-1 
                lg:grid-cols-3 
                gap-10 
                relative 
                z-10 
            "
        >
            {/* ---------------- Profile Section ---------------- */}
            <div className="lg:col-span-1">
                <div
                    className="
                        bg-white/70 
                        backdrop-blur-2xl 
                        rounded-2xl 
                        p-8 
                        shadow-xl 
                        border border-white/30 
                        hover:shadow-2xl 
                        transition-all 
                        duration-300 
                        hover:scale-[1.02]
                        relative
                    "
                >
                    <div className="flex flex-col items-center text-center">
                        <button
                            type="button"
                            onClick={() => setProfileModalOpen(true)}
                            className="mb-5 rounded-full ring-4 ring-white/40 shadow-2xl focus:outline-none focus:ring-purple-400 transition-all"
                        >
                            {profileImageUrl ? (
                                <img 
                                    src={profileImageUrl} 
                                    alt='P'
                                    className="w-32 h-32 rounded-full object-cover cursor-pointer"
                                />
                            ) : (
                                <div
                                    className="
                                        w-32 h-32 rounded-full 
                                        bg-gradient-to-br from-purple-500 to-pink-500 
                                        flex items-center justify-center 
                                        cursor-pointer
                                    "
                                >
                                    <FaUser className="text-white text-5xl" />
                                </div>
                            )}
                        </button>

                        <h2 className="text-3xl font-extrabold text-gray-900 drop-shadow-sm">
                            {user.name}
                        </h2>

                        <p className="text-gray-700 flex items-center mt-2 text-sm">
                            <FaEnvelope className="mr-2 opacity-75" /> {user.email}
                        </p>

                        {user.partnerName && (
                            <div
                                className="
                                    flex 
                                    items-center 
                                    text-pink-600 
                                    mt-4 
                                    text-lg 
                                    font-medium
                                "
                            >
                                <FaHeart className="mr-2" />
                                <span>Connected with {user.partnerName}</span>
                            </div>
                        )}

                        {logout && (
                            <button
                                onClick={logout}
                                className="
                                    mt-8 w-full flex items-center justify-center py-2.5 px-4 
                                    border border-transparent text-sm font-medium rounded-xl
                                    text-red-700 bg-red-100 hover:bg-red-200 
                                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
                                    transition-all duration-300
                                "
                            >
                                <FaSignOutAlt className="mr-2" />
                                Logout
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ---------------- Right Grid ---------------- */}
            <div className="lg:col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">

                    {/* Calendar Card */}
                    <DashboardCard
                        icon={<FaCalendarAlt className="h-6 w-6" />}
                        title="Upcoming Dates"
                        subtitle="No upcoming dates."
                        iconColor="bg-blue-100 text-blue-600"
                    />

                    {/* Memories Card */}
                    <DashboardCard
                        icon={<FaImages className="h-6 w-6" />}
                        title="Shared Memories"
                        subtitle="View your gallery."
                        iconColor="bg-pink-100 text-pink-600"
                    />

                    {/* Chat Card */}
                    <DashboardCard
                        icon={<FaComments className="h-6 w-6" />}
                        title="Chat with Partner"
                        subtitle={user.partnerName ? "Start a conversation." : "Connect with partner first."}
                        iconColor="bg-green-100 text-green-600"
                        onClick={() => {
                            if (user.partnerName) {
                                navigate('/messages');
                            } else {
                                // Could show a message or navigate to pairing
                                alert('You need to connect with your partner first to use the chat feature.');
                            }
                        }}
                    />
                </div>
            </div>

            {/* ---------------- Profile Picture Modal ---------------- */}
            {isProfileModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
                    <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md m-4">
                        {/* --- Close Button --- */}
                        <button
                            onClick={() => setProfileModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
                        >
                            <FaTimes className="h-6 w-6" />
                        </button>

                        <h3 className="text-2xl font-bold text-center mb-6 text-gray-800">Profile Picture</h3>

                        {/* --- Image Display --- */}
                        <div className="flex justify-center mb-6">
                            {profileImageUrl ? (
                                <img
                                    src={profileImageUrl}
                                    alt="Profile"
                                    className="w-48 h-48 rounded-full object-cover ring-4 ring-purple-300"
                                />
                            ) : (
                                <div className="w-48 h-48 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center ring-4 ring-purple-300">
                                    <FaUser className="text-white text-6xl" />
                                </div>
                            )}
                        </div>

                        {/* --- Upload Status --- */}
                        <div className="text-center mb-4 h-5">
                            {isUploading && <p className="text-gray-600 animate-pulse">Uploading...</p>}
                            {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}
                        </div>

                        {/* --- Edit Button --- */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="
                                w-full 
                                flex items-center justify-center 
                                py-3 px-4 
                                bg-gray-800 
                                text-white 
                                rounded-lg 
                                font-semibold 
                                hover:bg-gray-900 
                                transition-all
                            "
                            disabled={isUploading}
                        >
                            <FaPencilAlt className="mr-2" />
                            Change Picture
                        </button>

                        {/* --- Hidden File Input --- */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleProfilePictureChange}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardView;
