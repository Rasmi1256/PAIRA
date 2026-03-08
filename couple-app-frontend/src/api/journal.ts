import type {
  JournalEntry,
  JournalEntryCreate,
  JournalEntryUpdate,
  JournalAttachment,
} from "../types/journal";
import { api } from "../lib/api";

export const journalApi = {
  async getEntries(): Promise<JournalEntry[]> {
    const res = await api.get("/journal");
    return res.data;
  },

  async createEntry(entry: JournalEntryCreate): Promise<JournalEntry> {
    const res = await api.post("/journal", entry);
    return res.data;
  },

  async updateEntry(
    entryId: string,
    entry: JournalEntryUpdate
  ): Promise<JournalEntry> {
    const res = await api.put(`/journal/${entryId}`, entry);
    return res.data;
  },

  async deleteEntry(entryId: string): Promise<void> {
    await api.delete(`/journal/${entryId}`);
  },

  async addAttachment(
    entryId: string,
    file: File,
    attachmentType: string = "file"
  ): Promise<JournalAttachment> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("attachment_type", attachmentType);

    const res = await api.post(`/journal/${entryId}/attachments`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  async removeAttachment(
    entryId: string,
    attachmentId: string
  ): Promise<void> {
    await api.delete(`/journal/${entryId}/attachments/${attachmentId}`);
  },
};
