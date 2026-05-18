// Routes all AI requests through the backend — key stays server-side, no 429 from browser
const BACKEND_URL = 'http://localhost:5000/api/ai/chat';

export const sendMessage = async (history, newMessage) => {
  const response = await fetch(BACKEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ history, message: newMessage }),
  });

  const data = await response.json().catch(() => ({ success: false, message: `HTTP ${response.status}` }));

  if (response.status === 429 || data.message === 'RATE_LIMIT') {
    throw new Error('RATE_LIMIT');
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || `Server error ${response.status}`);
  }

  return data.reply;
};
