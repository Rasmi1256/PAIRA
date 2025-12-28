export interface MediaItem {
    id: number;
    url: string;
    type: 'image' | 'video';
    createdAt: string;
    is_favorite: boolean;
    is_starred: boolean;
}

export interface Album {
    id: number;
    name: string;
    description?: string;
    user_id: number;
    album_type: 'user_created' | 'smart_collection';
    is_smart_collection: boolean;
    smart_criteria?: string;
    created_at: string;
    updated_at: string;
}

export interface Tag {
    id: number;
    name: string;
    user_id: number;
    color: string;
    created_at: string;
}
