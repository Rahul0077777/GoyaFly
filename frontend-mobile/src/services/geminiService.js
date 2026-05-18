import api from './api';

export const sendMessage = async (history, newMessage) => {
  try {
    const response = await api.post('/ai/chat', { history, message: newMessage });
    
    if (response.data.success) {
      return response.data.reply;
    } else {
      throw new Error(response.data.message || 'AI request failed');
    }
  } catch (err) {
    if (err.response?.status === 429 || err.response?.data?.message === 'RATE_LIMIT') {
      throw new Error('RATE_LIMIT');
    }
    throw new Error(err.response?.data?.message || err.message || 'AI request failed');
  }
};
