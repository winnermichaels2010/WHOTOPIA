import { useState, useEffect, useRef } from 'react';
import { realtimeDB, onNewChatMessage, onChatMessageUpdate } from '../firebase/services/realtimeDBService';
import { ref, push, update } from 'firebase/database';
import { useAuthContext } from '../context/AuthContext';
import { FaComment, FaTimes, FaPaperPlane, FaUser, FaVolumeUp, FaVolumeMute, FaCopy, FaTrash, FaCheck } from 'react-icons/fa';
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
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [locallyDeleted, setLocallyDeleted] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(`chat_deleted_me_${roomId}`) || '[]'));
    } catch {
      return new Set();
    }
  });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const openRef = useRef(false);
  const mutedRef = useRef(muted);
  const knownIdsRef = useRef(new Set());
  const dragRef = useRef(null);
  const longPressTimer = useRef(null);

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  useEffect(() => { openRef.current = open; }, [open]);

  useEffect(() => { mutedRef.current = muted; }, [muted]);

  useEffect(() => {
    try {
      setLocallyDeleted(new Set(JSON.parse(localStorage.getItem(`chat_deleted_me_${roomId}`) || '[]')));
    } catch {
      setLocallyDeleted(new Set());
    }
  }, [roomId]);

  useEffect(() => {
    if (!open) {
      clearLongPress();
      setSelectionMode(false);
      setSelected({});
      setShowDeleteConfirm(false);
    }
  }, [open]);

  useEffect(() => {
    if (Object.keys(selected).length === 0) {
      setSelectionMode(false);
    }
  }, [selected]);

  useEffect(() => {
    return () => clearLongPress();
  }, []);

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
            if (!mutedRef.current) playNotificationSound();
          }
        }
      }
    });

    return () => unsub();
  }, [roomId, user?.uid]);

  useEffect(() => {
    if (!roomId) return;

    const unsub = onChatMessageUpdate(roomId, (snapshot) => {
      if (snapshot.exists()) {
        const updated = { id: snapshot.key, ...snapshot.val() };
        setMessages(prev => prev.map(m => (m.id === updated.id ? { ...m, ...updated } : m)));
      }
    });

    return () => unsub();
  }, [roomId]);

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

  const enterSelectionMode = (msg) => {
    clearLongPress();
    dragRef.current = null;
    setDragId(null);
    setDragX(0);
    setSelectionMode(true);
    setSelected({ [msg.id]: true });
  };

  const toggleSelect = (msg) => {
    setSelected(prev => {
      const next = { ...prev };
      if (next[msg.id]) {
        delete next[msg.id];
      } else {
        next[msg.id] = true;
      }
      return next;
    });
  };

  const exitSelectionMode = () => {
    clearLongPress();
    dragRef.current = null;
    setSelectionMode(false);
    setSelected({});
    setShowDeleteConfirm(false);
  };

  const handleMsgPointerDown = (msg, e) => {
    if (msg.deleted) return;
    if (selectionMode) {
      dragRef.current = { x: e.clientX, y: e.clientY, msg, tap: true };
      e.currentTarget.setPointerCapture?.(e.pointerId);
      return;
    }
    dragRef.current = { x: e.clientX, y: e.clientY, msg };
    setDragId(msg.id);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    clearLongPress();
    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null;
      enterSelectionMode(msg);
    }, 500);
  };

  const handleMsgPointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    if (selectionMode) {
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (Math.abs(dx) > 12 || Math.abs(dy) > 12) drag.moved = true;
      return;
    }
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      clearLongPress();
    }
    if (dx > 0 && Math.abs(dx) > Math.abs(dy)) {
      setDragX(Math.min(dx, 80));
    } else {
      setDragX(0);
    }
  };

  const handleMsgPointerUp = (e) => {
    const drag = dragRef.current;
    if (selectionMode && drag) {
      if (drag.tap && !drag.moved) {
        toggleSelect(drag.msg);
      }
      dragRef.current = null;
      return;
    }
    const dx = drag ? e.clientX - drag.x : 0;
    if (drag && dx > 50) {
      startReply(drag.msg);
    }
    dragRef.current = null;
    setDragId(null);
    setDragX(0);
  };

  const handleMsgPointerCancel = () => {
    clearLongPress();
    dragRef.current = null;
    setDragId(null);
    setDragX(0);
  };

  const handleCopySelected = async () => {
    const texts = Object.keys(selected)
      .map(id => visibleMessages.find(m => m.id === id))
      .filter(m => m && m.text && !m.deleted)
      .map(m => m.text)
      .join('\n');
    if (!texts) return;
    try {
      await navigator.clipboard.writeText(texts);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard not available */
    }
  };

  const persistLocallyDeleted = (next) => {
    try {
      localStorage.setItem(`chat_deleted_me_${roomId}`, JSON.stringify([...next]));
    } catch {
      /* storage not available */
    }
  };

  const handleDeleteForMe = () => {
    const next = new Set(locallyDeleted);
    Object.keys(selected).forEach(id => next.add(id));
    setLocallyDeleted(next);
    persistLocallyDeleted(next);
    exitSelectionMode();
  };

  const handleDeleteForEveryone = async () => {
    const ids = Object.keys(selected);
    try {
      const updates = {};
      ids.forEach(id => {
        updates[`${id}/deleted`] = true;
        updates[`${id}/deletedBy`] = user?.displayName || 'Player';
      });
      await update(ref(realtimeDB, `chat/${roomId}`), updates);
      setMessages(prev => prev.map(m =>
        ids.includes(m.id)
          ? { ...m, deleted: true, deletedBy: user?.displayName || 'Player' }
          : m
      ));
    } catch (err) {
      console.error('Failed to delete messages for everyone:', err);
    }
    exitSelectionMode();
  };

  const toggleMute = () => {
    setMuted(prev => {
      const next = !prev;
      localStorage.setItem('chat_notifications_muted', next ? '1' : '0');
      return next;
    });
  };

  const visibleMessages = messages.filter(m => !locallyDeleted.has(m.id));
  const selectedCount = Object.keys(selected).length;
  const selectedMsgs = Object.keys(selected)
    .map(id => visibleMessages.find(m => m.id === id))
    .filter(Boolean);
  const canDeleteForEveryone =
    selectedMsgs.length > 0 && selectedMsgs.every(m => m.senderId === user?.uid);

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
          {visibleMessages.length === 0 && (
            <div className="chat-empty">
              <p>No messages yet. Say hello!</p>
            </div>
          )}
          {visibleMessages.map((msg) => {
            const status = msg.status || (msg.senderId === user?.uid ? 'sent' : null);
            const isSelected = !!selected[msg.id];
            const isDeleted = !!msg.deleted;
            return (
              <div
                key={msg.id}
                className={`chat-message ${msg.senderId === user?.uid ? 'own' : ''} ${dragId === msg.id ? 'dragging' : ''} ${isSelected ? 'selected' : ''} ${isDeleted ? 'deleted' : ''}`}
                style={{ transform: dragId === msg.id ? `translateX(${dragX}px)` : undefined }}
                onPointerDown={(e) => handleMsgPointerDown(msg, e)}
                onPointerMove={handleMsgPointerMove}
                onPointerUp={handleMsgPointerUp}
                onPointerCancel={handleMsgPointerCancel}
              >
                {selectionMode && (
                  <span className={`chat-selection-check ${isSelected ? 'selected' : ''}`}>
                    {isSelected && <FaCheck />}
                  </span>
                )}
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
                {isDeleted ? (
                  <div className="chat-deleted-text">
                    {msg.senderId === user?.uid ? 'You deleted this message' : `${msg.senderName} deleted this message`}
                  </div>
                ) : (
                  <>
                    {msg.replyTo && (
                      <div className="chat-reply-preview">
                        <span className="chat-reply-preview-name">{msg.replyTo.senderName}</span>
                        <span className="chat-reply-preview-text">{msg.replyTo.text}</span>
                      </div>
                    )}
                    <div className="chat-message-text">{msg.text}</div>
                  </>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {selectionMode && selectedCount > 0 && (
          <div className="chat-selection-bar">
            <span className="chat-selection-count">{selectedCount} selected</span>
            <div className="chat-selection-actions">
              {selectedCount === 1 && (
                <button className="chat-selection-action" onClick={handleCopySelected} title="Copy">
                  {copied ? <FaCheck /> : <FaCopy />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              )}
              <button
                className="chat-selection-action danger"
                onClick={() => setShowDeleteConfirm(true)}
                title="Delete"
              >
                <FaTrash /> Delete
              </button>
              <button
                className="chat-selection-action cancel"
                onClick={exitSelectionMode}
                title="Cancel selection"
                aria-label="Cancel selection"
              >
                <FaTimes />
              </button>
            </div>
          </div>
        )}

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

      {showDeleteConfirm && (
        <div className="chat-confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="chat-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h4>Delete {selectedCount > 1 ? `${selectedCount} messages` : 'message'}?</h4>
            <p>
              {canDeleteForEveryone
                ? 'Choose how you want to delete this content.'
                : 'You can only delete these messages for yourself.'}
            </p>
            <button className="chat-confirm-btn me" onClick={handleDeleteForMe}>
              Delete for me
            </button>
            {canDeleteForEveryone && (
              <button className="chat-confirm-btn everyone" onClick={handleDeleteForEveryone}>
                Delete for everyone
              </button>
            )}
            <button className="chat-confirm-btn cancel" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatAside;
