import React, { useState, useEffect } from 'react';
import { FaBook, FaPlus, FaEdit, FaTrash, FaLock, FaPaperclip } from 'react-icons/fa';
import { journalApi } from '../../api/journal';
import type { JournalEntry, JournalEntryCreate } from '../../types/journal';

const JournalView: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [formData, setFormData] = useState<JournalEntryCreate>({
    content: '',
    mood: '',
    is_private: false
  });

  useEffect(() => {
    loadJournalEntries();
  }, []);

  const loadJournalEntries = async () => {
    try {
      const entriesData = await journalApi.getEntries();
      setEntries(entriesData);
    } catch (error) {
      console.error('Failed to load journal entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntry = async () => {
    try {
      await journalApi.createEntry(formData);
      setShowEntryForm(false);
      setFormData({ content: '', mood: '', is_private: false });
      loadJournalEntries();
    } catch (error) {
      console.error('Failed to create journal entry:', error);
    }
  };

  const handleUpdateEntry = async () => {
    if (!editingEntry) return;
    try {
      await journalApi.updateEntry(editingEntry.id, formData);
      setEditingEntry(null);
      setFormData({ content: '', mood: '', is_private: false });
      loadJournalEntries();
    } catch (error) {
      console.error('Failed to update journal entry:', error);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this journal entry?')) return;
    try {
      await journalApi.deleteEntry(entryId);
      loadJournalEntries();
    } catch (error) {
      console.error('Failed to delete journal entry:', error);
    }
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setFormData({
      content: entry.content,
      mood: entry.mood || '',
      is_private: entry.is_private
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMoodColor = (mood?: string) => {
    if (!mood) return 'bg-gray-500';
    switch (mood.toLowerCase()) {
      case 'happy': return 'bg-yellow-500';
      case 'sad': return 'bg-blue-500';
      case 'angry': return 'bg-red-500';
      case 'excited': return 'bg-green-500';
      case 'calm': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="w-full rounded-lg p-4 mb-4 bg-gradient-to-br from-indigo-600 to-blue-700 text-white">
        <div className="flex items-center mb-2">
          <FaBook className="text-2xl mr-3 drop-shadow-sm" />
          <h2 className="text-lg font-semibold">Journal</h2>
        </div>
        <div className="text-sm opacity-75">Loading journal entries...</div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg p-4 mb-4 bg-gradient-to-br from-indigo-600 to-blue-700 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <FaBook className="text-2xl mr-3 drop-shadow-sm" />
          <h2 className="text-lg font-semibold">Shared Journal</h2>
        </div>
        <button
          onClick={() => setShowEntryForm(true)}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <FaPlus className="text-sm" />
        </button>
      </div>

      {/* Entries List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="text-sm opacity-75 text-center py-4">
            No journal entries yet. Start writing your first entry!
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="p-4 bg-white/10 rounded-lg border border-white/20 hover:bg-white/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center flex-1">
                  {entry.mood && (
                    <span className={`w-3 h-3 rounded-full ${getMoodColor(entry.mood)} mr-2`}></span>
                  )}
                  <div className="text-xs opacity-75">
                    {formatDate(entry.created_at)}
                  </div>
                  {entry.is_private && (
                    <FaLock className="text-xs ml-2 opacity-75" />
                  )}
                </div>
                <div className="flex space-x-1 ml-2">
                  <button
                    onClick={() => handleEditEntry(entry)}
                    className="p-1 rounded hover:bg-white/20 transition-colors"
                  >
                    <FaEdit className="text-xs" />
                  </button>
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="p-1 rounded hover:bg-red-400/50 transition-colors"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              </div>

              <div className="text-sm mb-2 whitespace-pre-wrap">{entry.content}</div>

              {entry.mood && (
                <div className="text-xs opacity-75 mb-2">
                  Mood: {entry.mood}
                </div>
              )}

              {entry.attachments && entry.attachments.length > 0 && (
                <div className="flex items-center text-xs opacity-75">
                  <FaPaperclip className="mr-1" />
                  {entry.attachments.length} attachment{entry.attachments.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Entry Form Modal */}
      {(showEntryForm || editingEntry) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              {editingEntry ? 'Edit Journal Entry' : 'New Journal Entry'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={6}
                  placeholder="Write your thoughts..."
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mood (Optional)
                </label>
                <select
                  value={formData.mood}
                  onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select mood...</option>
                  <option value="happy">Happy</option>
                  <option value="sad">Sad</option>
                  <option value="angry">Angry</option>
                  <option value="excited">Excited</option>
                  <option value="calm">Calm</option>
                  <option value="anxious">Anxious</option>
                  <option value="grateful">Grateful</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_private"
                  checked={formData.is_private}
                  onChange={(e) => setFormData({ ...formData, is_private: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="is_private" className="text-sm text-gray-700">
                  Private entry (only visible to you)
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={editingEntry ? handleUpdateEntry : handleCreateEntry}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
              >
                {editingEntry ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setShowEntryForm(false);
                  setEditingEntry(null);
                  setFormData({ content: '', mood: '', is_private: false });
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

export default JournalView;
