import { api } from '../lib/api';
import type { VoiceMessage, VoiceMessageCreate, VoiceMessageUpdate } from '../types/voice_message';

export const voiceMessageApi = {
  createVoiceMessage: async (data: VoiceMessageCreate): Promise<VoiceMessage> => {
    const formData = new FormData();
    formData.append('receiver_id', data.receiver_id.toString());
    formData.append('audio_file', data.audio_file);

    const response = await api.post('/voice-messages/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getVoiceMessages: async (): Promise<VoiceMessage[]> => {
    const response = await api.get('/voice-messages/');
    return response.data;
  },

  updateVoiceMessage: async (id: number, data: VoiceMessageUpdate): Promise<VoiceMessage> => {
    const response = await api.put(`/voice-messages/${id}`, data);
    return response.data;
  },

  deleteVoiceMessage: async (id: number): Promise<void> => {
    await api.delete(`/voice-messages/${id}`);
  },
};
