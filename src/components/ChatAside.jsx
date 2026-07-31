import { useState, useEffect, useRef } from 'react';
import { realtimeDB, onNewChatMessage } from '../firebase/services/realtimeDBService';
import { ref, push } from 'firebase/database';
import { useAuthContext } from '../context/AuthContext';
import { FaComment, FaTimes, FaPaperPlane, FaUser, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
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

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const ChatAside = ({ roomId }) => {
  const { user } = useAuthContext();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [muted, setMuted] = useState(() => localStorage.getItem('chat_notifications_muted') === '1');
  const [replyingTo, setReplyingTo] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [dragX, setDragX] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const openRef = useRef(false);
  const knownIdsRef = useRef(new Set());
  const dragRef = useRef(null);

  useEffect(() => { openRef.current = open; }, [open]);

  useEffect(() => {
    if (!roomId) return;

    const unsub = onNewChatMessage(roomId, (snapshot) => {
      if (snapshot.exists()) {
        const msg = { id: snapshot.key, ...snapshot.val() };
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          const pendingIdx = prev.findIndex(
            m => m.id && m.id.startsWith('local-') && m.senderId === msg.senderId && m.text === msg.text
          );
          if (pendingIdx !== -1) {
            const next = [...prev];
            next[pendingIdx] = { ...msg, status: 'sent' };
            return next;
          }
          return [...prev, msg];
        });

        if (!knownIdsRef.current.has(msg.id)) {
          knownIdsRef.current.add(msg.id);
          if (msg.senderId !== user?.uid && !openRef.current) {
            setUnreadCount(prev => prev + 1);
            if (!muted) playNotificationSound();
          }
        }
      }
    });

    return () => unsub();
  }, [roomId, user?.uid, muted]);

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

    const tempId = `local-${Date.now()}`;
    const replyTo = replyingTo
      ? { id: replyingTo.id, text: replyingTo.text, senderName: replyingTo.senderName }
      : null;

    setMessages(prev => [
      ...prev,
      {
        id: tempId,
        text,
        senderId: user.uid,
        senderName: user.displayName || 'Player',
        timestamp: Date.now(),
        status: 'sending',
        replyTo,
      },
    ]);
    setInput('');
    setReplyingTo(null);

    try {
      const messagesRef = ref(realtimeDB, `chat/${roomId}`);
      const payload = {
        text,
        senderId: user.uid,
        senderName: user.displayName || 'Player',
        timestamp: Date.now(),
      };
      if (replyTo) payload.replyTo = replyTo;
      const newRef = await push(messagesRef, payload);
      const realKey = newRef.key;
      knownIdsRef.current.add(realKey);
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: realKey, status: 'sent' } : m));
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
    }
  };

  const startReply = (msg) => {
    setReplyingTo(msg);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleMsgPointerDown = (msg, e) => {
    dragRef.current = { x: e.clientX, y: e.clientY, msg };
    setDragId(msg.id);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handleMsgPointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (dx > 0 && Math.abs(dx) > Math.abs(dy)) {
      setDragX(Math.min(dx, 80));
    } else {
      setDragX(0);
    }
  };

  const handleMsgPointerUp = (e) => {
    const drag = dragRef.current;
    const dx = drag ? e.clientX - drag.x : 0;
    if (drag && dx > 50) {
      startReply(drag.msg);
    }
    dragRef.current = null;
    setDragId(null);
    setDragX(0);
  };

  const toggleMute = () => {
    setMuted(prev => {
      const next = !prev;
      localStorage.setItem('chat_notifications_muted', next ? '1' : '0');
      return next;
    });
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
          <button
            className={`chat-sound-toggle ${muted ? 'muted' : ''}`}
            onClick={toggleMute}
            title={muted ? 'Unmute message notifications' : 'Mute message notifications'}
            aria-label={muted ? 'Unmute message notifications' : 'Mute message notifications'}
          >
            {muted ? <FaVolumeMute /> : <FaVolumeUp />}
          </button>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              <p>No messages yet. Say hello!</p>
            </div>
          )}
          {messages.map((msg) => {
            const status = msg.status || (msg.senderId === user?.uid ? 'sent' : null);
            return (
              <div
                key={msg.id}
                className={`chat-message ${msg.senderId === user?.uid ? 'own' : ''} ${dragId === msg.id ? 'dragging' : ''}`}
                style={{ transform: dragId === msg.id ? `translateX(${dragX}px)` : undefined }}
                onPointerDown={(e) => handleMsgPointerDown(msg, e)}
                onPointerMove={handleMsgPointerMove}
                onPointerUp={handleMsgPointerUp}
                onPointerCancel={handleMsgPointerUp}
              >
                <div className="chat-message-header">
                  <div className="chat-message-sender">
                    <FaUser className="chat-message-avatar" />
                    <span>{msg.senderName}</span>
                  </div>
                  <div className="chat-message-meta">
                    <span className="chat-message-time">{formatTime(msg.timestamp)}</span>
                    {msg.senderId === user?.uid && (
                      <span className={`chat-message-status ${status === 'sent' ? 'sent' : 'pending'}`}>
                        {status === 'sent' ? '✓' : '!!'}
                      </span>
                    )}
                  </div>
                </div>
                {msg.replyTo && (
                  <div className="chat-reply-preview">
                    <span className="chat-reply-preview-name">{msg.replyTo.senderName}</span>
                    <span className="chat-reply-preview-text">{msg.replyTo.text}</span>
                  </div>
                )}
                <div className="chat-message-text">{msg.text}</div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {replyingTo && (
          <div className="chat-reply-bar">
            <div className="chat-reply-bar-info">
              <span className="chat-reply-bar-label">Replying to {replyingTo.senderName}</span>
              <span className="chat-reply-bar-text">{replyingTo.text}</span>
            </div>
            <button
              className="chat-reply-bar-close"
              onClick={() => setReplyingTo(null)}
              title="Cancel reply"
              aria-label="Cancel reply"
            >
              <FaTimes />
            </button>
          </div>
        )}

        <form className="chat-input-area" onSubmit={sendMessage}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={replyingTo ? 'Reply...' : 'Type a message...'}
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
