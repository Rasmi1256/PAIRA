import { api } from '../lib/api';
import type { CalendarEvent, CalendarEventCreate, CalendarEventUpdate, CoupleAnniversary } from '../types/calendar';

export const calendarApi = {
  // Get all calendar events for the couple
  getEvents: async (): Promise<CalendarEvent[]> => {
    const response = await api.get('/calendar');
    return response.data;
  },

  // Create a new calendar event
  createEvent: async (event: CalendarEventCreate): Promise<CalendarEvent> => {
    const response = await api.post('/calendar', event);
    return response.data;
  },

  // Update a calendar event
  updateEvent: async (eventId: number, event: CalendarEventUpdate): Promise<CalendarEvent> => {
    const response = await api.put(`/calendar/${eventId}`, event);
    return response.data;
  },

  // Delete a calendar event
  deleteEvent: async (eventId: number): Promise<void> => {
    await api.delete(`/calendar/${eventId}`);
  },

  // Get couple anniversary
  getAnniversary: async (): Promise<CoupleAnniversary> => {
    const response = await api.get('/calendar/anniversary');
    return response.data;
  },

  // Update couple anniversary
  updateAnniversary: async (anniversary: CoupleAnniversary): Promise<CoupleAnniversary> => {
    const response = await api.put('/calendar/anniversary', anniversary);
    return response.data;
  },
};
