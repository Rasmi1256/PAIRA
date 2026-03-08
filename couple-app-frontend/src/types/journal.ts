export interface JournalAttachment {
  id: string; // UUID
  journal_id: string; // UUID
  type: 'image' | 'audio' | 'file';
  file_path: string;
  created_at: string; // ISO date string
}

export interface JournalEntry {
  id: string; // UUID
  couple_id: number;
  author_id: number;
  content: string;
  mood?: string;
  is_private: boolean;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  attachments: JournalAttachment[];
}

export interface JournalEntryCreate {
  content: string;
  mood?: string;
  is_private: boolean;
}

export interface JournalEntryUpdate {
  content?: string;
  mood?: string;
  is_private?: boolean;
}
