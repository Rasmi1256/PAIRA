export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  event_date: string; // ISO date string
  event_type: 'anniversary' | 'milestone' | 'custom';
  couple_id: number;
  created_by: number;
  created_at: string;
  updated_at?: string;
}

export interface CalendarEventCreate {
  title: string;
  description?: string;
  event_date: string; // ISO date string
  event_type: 'anniversary' | 'milestone' | 'custom';
}

export interface CalendarEventUpdate {
  title?: string;
  description?: string;
  event_date?: string; // ISO date string
  event_type?: 'anniversary' | 'milestone' | 'custom';
}

export interface CoupleAnniversary {
  anniversary_date?: string; // ISO date string
}
