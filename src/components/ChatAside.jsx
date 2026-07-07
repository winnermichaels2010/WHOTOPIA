import { useState, useEffect, useRef } from 'react';
import { realtimeDB, onNewChatMessage } from '../firebase/services/realtimeDBService';
import { ref, push } from 'firebase/database';
import { useAuthContext } from '../context/AuthContext';
import { FaComment, FaTimes, FaPaperPlane, FaUser } from 'react-icons/fa';
import './ChatAside.css';

const ChatAside = ({ roomId }) => {
  const { user } = useAuthContext();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;

    const unsub = onNewChatMessage(roomId, (snapshot) => {
      if (snapshot.exists()) {
        setMessages(prev => {
          const msg = { id: snapshot.key, ...snapshot.val() };
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    });

    return () => unsub();
  }, [roomId]);

  useEffect(() => {
    if (open) {
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

  return (
    <>
      <button
        className={`chat-toggle ${open ? 'open' : ''}`}
        onClick={() => setOpen(!open)}
        title="Toggle chat"
      >
        {open ? <FaTimes /> : <FaComment />}
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
