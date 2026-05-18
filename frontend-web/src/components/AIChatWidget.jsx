import React, { useState, useRef, useEffect } from 'react';
import { sendMessage } from '../services/geminiService';

const SUGGESTED_QUESTIONS = [
  '✈️ How do I search for flights?',
  '💰 How do I recharge my wallet?',
  '📈 What is markup setup?',
  '🛂 How to apply for visa assistance?',
  '🎟️ How to raise a support ticket?',
];

const TypingIndicator = () => (
  <div className="flex items-end gap-2 mb-3">
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">✦</div>
    <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
      <div className="flex gap-1 items-center h-4">
        <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

const MessageBubble = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex items-end gap-2 mb-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">✦</div>
      )}
      <div
        className={`max-w-[78%] px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl rounded-br-sm'
            : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-slate-700 rounded-2xl rounded-bl-sm'
        }`}
      >
        {msg.content}
      </div>
    </div>
  );
};

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Hey! I'm **Goyafly AI Assistant**. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [cooldown, setCooldown] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const cooldownRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Proactive Welcome Logic
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('goyafly_ai_welcome');
    if (!hasSeenWelcome) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        localStorage.setItem('goyafly_ai_welcome', 'true');
      }, 3000); // 3 second delay
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSend = async (text) => {
    const userText = (text || input).trim();
    if (!userText || isLoading) return;

    setInput('');
    setShowSuggestions(false);
    setError(null);
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setIsLoading(true);

    try {
      const history = messages.filter(m => m.role !== 'system');
      const reply = await sendMessage(history, userText);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      if (err.message === 'NO_API_KEY') {
        setError('⚠️ Please add your VITE_GEMINI_API_KEY to the .env file and restart the dev server.');
      } else if (err.message === 'RATE_LIMIT') {
        setError('⏳ Rate limit reached. Please wait a moment and try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 text-white shadow-2xl hover:shadow-blue-500/40 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center group"
        style={{ boxShadow: '0 8px 32px rgba(59,130,246,0.4)' }}
        title="Goyafly AI Assistant"
      >
        <span
          className="text-2xl transition-transform duration-300"
          style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
        >
          {isOpen ? '✕' : '✦'}
        </span>
        {/* Pulse ring */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-20" />
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] flex flex-col rounded-3xl overflow-hidden shadow-2xl transition-all duration-400 origin-bottom-right ${
          isOpen
            ? 'opacity-100 scale-100 pointer-events-auto translate-y-0'
            : 'opacity-0 scale-90 pointer-events-none translate-y-4'
        }`}
        style={{
          height: '520px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1)',
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 px-5 py-4 flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl font-black shadow-inner">
            ✦
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-white text-sm leading-tight">Goyafly AI</p>
            <p className="text-blue-100 text-[10px] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
              Your Smart Travel Assistant
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900 px-4 py-4 scroll-smooth">
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} />
          ))}
          {isLoading && <TypingIndicator />}
          {error && (
            <div className="text-center text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 mb-3">
              {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {showSuggestions && messages.length === 1 && (
          <div className="bg-gray-50 dark:bg-slate-900 px-4 pb-2 flex-shrink-0">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Quick questions</p>
            <div className="flex flex-col gap-1.5">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q.replace(/^[^\w]*/, ''))}
                  className="text-left text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-100 dark:border-blue-800 rounded-xl px-3 py-2 transition-colors font-medium truncate"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 px-4 py-3 flex items-center gap-2 flex-shrink-0">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about travel..."
            rows={1}
            className="flex-1 resize-none text-sm bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-100 rounded-2xl px-4 py-2.5 outline-none placeholder-gray-400 focus:ring-2 focus:ring-blue-500/30 transition-all max-h-24 overflow-y-auto"
            style={{ lineHeight: '1.4' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 shadow-lg shadow-blue-500/30 flex-shrink-0 text-xs font-black"
          >
            <svg className="w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>

        {/* Powered by */}
        <div className="bg-white dark:bg-slate-900 pb-3 text-center flex-shrink-0">
          <span className="text-[9px] text-gray-300 dark:text-slate-700 font-medium tracking-wider uppercase">
            Powered by Google Gemini
          </span>
        </div>
      </div>
    </>
  );
}
