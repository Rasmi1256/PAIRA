import axios from 'axios';

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: apiBaseUrl,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export async function getConversation() {
  const res = await api.get('/chat/conversation');
  return res.data;
}

export async function getMessages(conversationId: string) {
  const res = await api.get(`/chat/messages/${conversationId}`);
  return res.data;
}
