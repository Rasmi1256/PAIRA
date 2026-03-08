import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaPlus, FaEdit, FaTrash, FaHeart } from 'react-icons/fa';
import { calendarApi } from '../../api/calendar';
import type { CalendarEvent, CalendarEventCreate, CoupleAnniversary } from '../../types/calendar';

const CalendarView: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [anniversary, setAnniversary] = useState<CoupleAnniversary>({});
  const [loading, setLoading] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formData, setFormData] = useState<CalendarEventCreate>({
    title: '',
    description: '',
    event_date: '',
    event_type: 'custom'
  });

  useEffect(() => {
    loadCalendarData();
  }, []);

  const loadCalendarData = async () => {
    try {
      const [eventsData, anniversaryData] = await Promise.all([
        calendarApi.getEvents(),
        calendarApi.getAnniversary()
      ]);
      setEvents(eventsData);
      setAnniversary(anniversaryData);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    try {
      await calendarApi.createEvent(formData);
      setShowEventForm(false);
      setFormData({ title: '', description: '', event_date: '', event_type: 'custom' });
      loadCalendarData();
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent) return;
    try {
      await calendarApi.updateEvent(editingEvent.id, formData);
      setEditingEvent(null);
      setFormData({ title: '', description: '', event_date: '', event_type: 'custom' });
      loadCalendarData();
    } catch (error) {
      console.error('Failed to update event:', error);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await calendarApi.deleteEvent(eventId);
      loadCalendarData();
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      event_date: event.event_date,
      event_type: event.event_type
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'anniversary': return 'bg-pink-500';
      case 'milestone': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="w-full rounded-lg p-4 mb-4 bg-gradient-to-br from-indigo-600 to-blue-700 text-white">
        <div className="flex items-center mb-2">
          <FaCalendarAlt className="text-2xl mr-3 drop-shadow-sm" />
          <h2 className="text-lg font-semibold">Calendar</h2>
        </div>
        <div className="text-sm opacity-75">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg p-4 mb-4 bg-gradient-to-br from-indigo-600 to-blue-700 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <FaCalendarAlt className="text-2xl mr-3 drop-shadow-sm" />
          <h2 className="text-lg font-semibold">Shared Calendar</h2>
        </div>
        <button
          onClick={() => setShowEventForm(true)}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <FaPlus className="text-sm" />
        </button>
      </div>

      {/* Anniversary Display */}
      {anniversary.anniversary_date && (
        <div className="mb-4 p-3 bg-pink-500/20 rounded-lg border border-pink-400/30">
          <div className="flex items-center mb-1">
            <FaHeart className="text-pink-300 mr-2" />
            <span className="font-semibold text-pink-200">Anniversary</span>
          </div>
          <div className="text-sm text-pink-100">
            {formatDate(anniversary.anniversary_date)}
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {events.length === 0 ? (
          <div className="text-sm opacity-75 text-center py-4">
            No events yet. Add your first special date!
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="p-3 bg-white/10 rounded-lg border border-white/20 hover:bg-white/20 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <span className={`w-2 h-2 rounded-full ${getEventTypeColor(event.event_type)} mr-2`}></span>
                    <h3 className="font-semibold text-sm">{event.title}</h3>
                  </div>
                  <div className="text-xs opacity-75 mb-1">
                    {formatDate(event.event_date)}
                  </div>
                  {event.description && (
                    <div className="text-xs opacity-90">{event.description}</div>
                  )}
                </div>
                <div className="flex space-x-1 ml-2">
                  <button
                    onClick={() => handleEditEvent(event)}
                    className="p-1 rounded hover:bg-white/20 transition-colors"
                  >
                    <FaEdit className="text-xs" />
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="p-1 rounded hover:bg-red-400/50 transition-colors"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Event Form Modal */}
      {(showEventForm || editingEvent) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              {editingEvent ? 'Edit Event' : 'Add New Event'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Event title"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.event_type}
                  onChange={(e) => setFormData({ ...formData, event_type: e.target.value as 'anniversary' | 'milestone' | 'custom' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="custom">Custom</option>
                  <option value="anniversary">Anniversary</option>
                  <option value="milestone">Milestone</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Add a description..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={editingEvent ? handleUpdateEvent : handleCreateEvent}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
              >
                {editingEvent ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setShowEventForm(false);
                  setEditingEvent(null);
                  setFormData({ title: '', description: '', event_date: '', event_type: 'custom' });
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
