import { api } from '../lib/api';
import type { Album, Photo, AlbumCreate } from '../types/gallery';

export const galleryApi = {
  /**
   * Get all photo albums for the couple.
   * @returns A promise that resolves to an array of albums.
   */
  getAlbums: async (): Promise<Album[]> => {
    const response = await api.get('/gallery/albums');
    return response.data;
  },

  /**
   * Create a new photo album.
   * @param data - The data for creating the album.
   * @returns A promise that resolves to the created album.
   */
  createAlbum: async (data: AlbumCreate): Promise<Album> => {
    const response = await api.post('/gallery/albums', data);
    return response.data;
  },

  /**
   * Delete a photo album.
   * @param albumId - The ID of the album to delete.
   */
  deleteAlbum: async (albumId: number): Promise<void> => {
    await api.delete(`/gallery/albums/${albumId}`);
  },

  /**
   * Get all photos for a specific album.
   * @param albumId - The ID of the album.
   * @returns A promise that resolves to an array of photos.
   */
  getPhotos: async (albumId: number): Promise<Photo[]> => {
    const response = await api.get(`/gallery/albums/${albumId}/photos`);
    return response.data;
  },

  /**
   * Delete a photo.
   * @param photoId - The ID of the photo to delete.
   */
  deletePhoto: async (photoId: number): Promise<void> => {
    await api.delete(`/gallery/photos/${photoId}`);
  },
};