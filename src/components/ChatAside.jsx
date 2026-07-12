import { useState, useEffect, useRef } from 'react';
import { realtimeDB, onNewChatMessage } from '../firebase/services/realtimeDBService';
import { ref, push } from 'firebase/database';
import { useAuthContext } from '../context/AuthContext';
import { FaComment, FaTimes, FaPaperPlane, FaUser } from 'react-icons/fa';
import './ChatAside.css';

const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    /* audio not available */
  }
};

const ChatAside = ({ roomId }) => {
  const { user } = useAuthContext();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const openRef = useRef(false);
  const knownIdsRef = useRef(new Set());

  useEffect(() => { openRef.current = open; }, [open]);

  useEffect(() => {
    if (!roomId) return;

    const unsub = onNewChatMessage(roomId, (snapshot) => {
      if (snapshot.exists()) {
        const msg = { id: snapshot.key, ...snapshot.val() };
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });

        if (!knownIdsRef.current.has(msg.id)) {
          knownIdsRef.current.add(msg.id);
          if (msg.senderId !== user?.uid && !openRef.current) {
            setUnreadCount(prev => prev + 1);
            playNotificationSound();
          }
        }
      }
    });

    return () => unsub();
  }, [roomId, user?.uid]);

  useEffect(() => {
    if (open) {
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !roomId || !user) return;

    try {
      const messagesRef = ref(realtimeDB, `chat/${roomId}`);
      await push(messagesRef, {
        text,
        senderId: user.uid,
        senderName: user.displayName || 'Player',
        timestamp: Date.now(),
      });
      setInput('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const badgeText = unreadCount > 9 ? '9+' : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <>
      <button
        className={`chat-toggle ${open ? 'open' : ''}`}
        onClick={() => setOpen(!open)}
        title="Toggle chat"
      >
        {open ? <FaTimes /> : <FaComment />}
        {badgeText && <span className="chat-badge">{badgeText}</span>}
      </button>

      <aside className={`chat-aside ${open ? 'open' : ''}`}>
        <div className="chat-header">
          <FaComment className="chat-header-icon" />
          <h3>Chat</h3>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              <p>No messages yet. Say hello!</p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-message ${msg.senderId === user?.uid ? 'own' : ''}`}
            >
              <div className="chat-message-sender">
                <FaUser className="chat-message-avatar" />
                <span>{msg.senderName}</span>
              </div>
              <div className="chat-message-text">{msg.text}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-area" onSubmit={sendMessage}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            maxLength={200}
          />
          <button type="submit" disabled={!input.trim()}>
            <FaPaperPlane />
          </button>
        </form>
      </aside>
    </>
  );
};

export default ChatAside;
