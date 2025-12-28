import React, { useState, useEffect, useRef } from 'react';
import { FaImages, FaUpload, FaSpinner, FaExclamationCircle, FaTrash, FaHeart, FaStar } from 'react-icons/fa';
import { api } from '../../lib/api';
import { isAxiosError } from 'axios';
import type { MediaItem } from '../../types/gallery';

const GalleryView: React.FC = () => {
    const [items, setItems] = useState<MediaItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
    const [togglingFavorite, setTogglingFavorite] = useState<number | null>(null);
    const [togglingStar, setTogglingStar] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    const getFullMediaUrl = (relativeUrl?: string) => {
        if (!relativeUrl) return '';
        if (relativeUrl.startsWith('http')) return relativeUrl;
        try {
            return new URL(relativeUrl, BACKEND_URL).href;
        } catch (error) {
            console.error('Error constructing full media URL:', error);
            return '';
        }
    };

    const fetchGalleryItems = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get('/gallery');
            setItems(response.data);
        } catch (err) {
            console.error('Failed to fetch gallery items:', err);
            setError('Could not load your gallery. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchGalleryItems();
    }, []);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            // 1️⃣ Request pre-signed URL
            const presignResponse = await api.post('/uploads/presigned-url', {
                fileName: file.name,
                fileType: file.type,
            });

            const { presignedUrl, key } = presignResponse.data;

            // 2️⃣ Upload directly to S3
            const uploadResponse = await fetch(presignedUrl, {
                headers: {
                    'Content-Type': file.type,
                },

                method: 'PUT',
                body: file,
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload file to S3.');
            }

            // 3️⃣ Confirm upload
            await api.post('/uploads/complete', {
                key,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
            });

            // 4️⃣ Refresh gallery
            // Refresh gallery on success
            await fetchGalleryItems();
        } catch (err) {
            console.error('Gallery upload failed:', err);

            let errorMessage = 'Upload failed. Please try again.';
            if (isAxiosError(err) && err.response?.data?.detail) {
                errorMessage = err.response.data.detail;
            }

            setError(errorMessage);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleDeleteItem = async (itemId: number) => {
        if (!window.confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
            return;
        }

        setDeletingItemId(itemId);
        setError(null);

        try {
            await api.delete(`/gallery/${itemId}`);
            // Refresh gallery on success
            await fetchGalleryItems();
        } catch (err) {
            console.error('Gallery delete failed:', err);
            let errorMessage = 'Failed to delete photo. Please try again.';
            if (isAxiosError(err) && err.response?.data?.detail) {
                errorMessage = err.response.data.detail;
            }
            setError(errorMessage);
        } finally {
            setDeletingItemId(null);
        }
    };

    const handleToggleFavorite = async (itemId: number) => {
        setTogglingFavorite(itemId);
        setError(null);

        try {
            await api.post(`/gallery/media/${itemId}/favorite`);
            // Refresh gallery on success
            await fetchGalleryItems();
        } catch (err) {
            console.error('Toggle favorite failed:', err);
            let errorMessage = 'Failed to toggle favorite. Please try again.';
            if (isAxiosError(err) && err.response?.data?.detail) {
                errorMessage = err.response.data.detail;
            }
            setError(errorMessage);
        } finally {
            setTogglingFavorite(null);
        }
    };

    const handleToggleStar = async (itemId: number) => {
        setTogglingStar(itemId);
        setError(null);

        try {
            await api.post(`/gallery/media/${itemId}/star`);
            // Refresh gallery on success
            await fetchGalleryItems();
        } catch (err) {
            console.error('Toggle star failed:', err);
            let errorMessage = 'Failed to toggle star. Please try again.';
            if (isAxiosError(err) && err.response?.data?.detail) {
                errorMessage = err.response.data.detail;
            }
            setError(errorMessage);
        } finally {
            setTogglingStar(null);
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center py-16">
                    <FaSpinner className="animate-spin text-4xl text-pink-500" />
                </div>
            );
        }

        if (error && items.length === 0) {
            return (
                <div className="text-center py-16 border-2 border-dashed border-red-300 rounded-lg bg-red-50/50">
                    <FaExclamationCircle className="mx-auto text-4xl text-red-500 mb-4" />
                    <p className="text-red-600 font-semibold">An Error Occurred</p>
                    <p className="text-sm text-red-500 mt-1">{error}</p>
                </div>
            );
        }

        if (items.length === 0) {
            return (
                <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500">Your shared photos and videos will appear here.</p>
                    <p className="text-sm text-gray-400 mt-2">
                        Click 'Upload' to add your first memory.
                    </p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map(item => {
                    const isImage = item.type === 'image';
                    const mediaUrl = item.url; // The API already returns signed URLs

                    return (
                        <div
                            key={item.id}
                            className="relative aspect-square rounded-lg overflow-hidden shadow-md group"
                        >
                            {isImage ? (
                                <img
                                    src={mediaUrl}
                                    alt="Gallery item"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <video
                                    src={mediaUrl}
                                    className="w-full h-full object-cover"
                                    controls
                                    preload="metadata"
                                    onError={(e) => {
                                        console.error('Video load error:', e);
                                        // Optionally hide or replace the video element
                                    }}
                                />
                            )}

                            {/* Favorite/Star buttons */}
                            <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleToggleFavorite(item.id)}
                                    disabled={togglingFavorite === item.id}
                                    className={`p-2 rounded-full transition-colors ${
                                        item.is_favorite
                                            ? 'bg-red-500 text-white hover:bg-red-600'
                                            : 'bg-white/80 text-gray-600 hover:bg-white'
                                    } disabled:bg-gray-400`}
                                    title={item.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                                >
                                    {togglingFavorite === item.id ? (
                                        <FaSpinner className="animate-spin w-4 h-4" />
                                    ) : (
                                        <FaHeart className={item.is_favorite ? 'text-white' : 'text-red-500'} />
                                    )}
                                </button>

                                <button
                                    onClick={() => handleToggleStar(item.id)}
                                    disabled={togglingStar === item.id}
                                    className={`p-2 rounded-full transition-colors ${
                                        item.is_starred
                                            ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                                            : 'bg-white/80 text-gray-600 hover:bg-white'
                                    } disabled:bg-gray-400`}
                                    title={item.is_starred ? 'Remove star' : 'Add star'}
                                >
                                    {togglingStar === item.id ? (
                                        <FaSpinner className="animate-spin w-4 h-4" />
                                    ) : (
                                        <FaStar className={item.is_starred ? 'text-white' : 'text-yellow-500'} />
                                    )}
                                </button>
                            </div>

                            {/* Delete button */}
                            <button
                                onClick={() => handleDeleteItem(item.id)}
                                disabled={deletingItemId === item.id}
                                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:bg-red-400"
                                title="Delete photo"
                            >
                                {deletingItemId === item.id ? (
                                    <FaSpinner className="animate-spin w-4 h-4" />
                                ) : (
                                    <FaTrash className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-md p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <FaImages className="text-3xl text-pink-600 mr-4" />
                    <h2 className="text-2xl font-bold text-gray-800">Gallery</h2>
                </div>
                <button
                    onClick={triggerFileInput}
                    disabled={isUploading}
                    className="flex items-center justify-center py-2 px-4 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition-all shadow-sm disabled:bg-pink-400 disabled:cursor-not-allowed"
                >
                    {isUploading ? (
                        <>
                            <FaSpinner className="animate-spin mr-2" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <FaUpload className="mr-2" />
                            Upload
                        </>
                    )}
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    disabled={isUploading}
                />
            </div>

            {error && items.length > 0 && (
                <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
            )}

            {renderContent()}
        </div>
    );
};

export default GalleryView;