import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { getAllUsers, sendRoomInvites } from '../firebase/services/firestoreService';
import LoadingSpinner from '../components/LoadingSpinner';
import { FaShareAlt, FaCheck, FaArrowLeft, FaUsers, FaCopy, FaSpinner, FaSearch, FaTimes } from 'react-icons/fa';
import './ShareCodePage.css';

const colors = ['#e63946', '#f72585', '#FF9800', '#2196F3', '#4CAF50', '#9C27B0'];

function getInitials(name) {
  return (name || '?').slice(0, 2).toUpperCase();
}

function getColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function ShareCodePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuthContext();

  const roomCode = location.state?.roomCode || location.state?.code || new URLSearchParams(location.search).get('code') || '';

  const [players, setPlayers] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (roomCode && navigator.clipboard) {
      navigator.clipboard.writeText(roomCode).catch(() => {});
      setCopied(true);
    }
  }, [roomCode]);

  useEffect(() => {
    if (!roomCode && !authLoading) {
      navigate('/lobby', { replace: true });
    }
  }, [roomCode, authLoading, navigate]);

  useEffect(() => {
    if (authLoading) return;

    const load = async () => {
      try {
        const snapshot = await getAllUsers();
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setPlayers(list);
      } catch (err) {
        console.error('Failed to load players:', err);
        setError('Failed to load players. Check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authLoading]);

  const toggleSelect = (playerId) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[playerId]) {
        delete next[playerId];
      } else {
        next[playerId] = true;
      }
      return next;
    });
  };

  const selectAll = () => {
    if (Object.keys(selected).length === filteredPlayers.length) {
      setSelected({});
    } else {
      setSelected(Object.fromEntries(filteredPlayers.map((p) => [p.id, true])));
    }
  };

  const selectedIds = Object.keys(selected);
  const eligiblePlayers = players.filter((p) => p.id !== user?.uid && !p.isRemoved);

  const query = search.trim().toLowerCase();
  const filteredPlayers = eligiblePlayers.filter((player) => {
    const name = (player.displayName || player.email || '').toLowerCase();
    return !query || name.includes(query);
  });

  const handleSend = async () => {
    if (selectedIds.length === 0 || !roomCode) {
      setError('Select at least one player to share the code with.');
      return;
    }

    setSending(true);
    setError('');
    try {
      await sendRoomInvites(selectedIds, {
        senderId: user?.uid || 'guest',
        senderName: user?.displayName || 'Player',
        roomCode,
        roomName: `${user?.displayName || 'Player'}'s Game`,
        message: `${user?.displayName || 'Player'} invited you to join their room.`,
      });
      setSent(true);
      setTimeout(() => navigate('/lobby', { state: { roomCode } }), 1500);
    } catch (err) {
      console.error('Failed to send invites:', err);
      setError('Failed to send the room code. Please try again.');
    }
    setSending(false);
  };

  if (authLoading || loading) {
    return (
      <div className="share-page">
        <div className="share-loading">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="share-page">
      <button className="share-back-btn" onClick={() => navigate('/lobby', { state: { roomCode } })}>
        <FaArrowLeft /> Back to Lobby
      </button>

      <div className="share-hero">
        <div className="share-hero-icon">
          <FaShareAlt />
        </div>
        <h1>Share Room Code</h1>
        <p>Select the players you want to send your room code to.</p>
      </div>

      <div className="share-code-card">
        <span className="share-code-label">Room Code</span>
        <div className="share-code-row">
          <span className="share-code-value">{roomCode || 'No room code'}</span>
          <button
            className={`share-code-copy ${copied ? 'copied' : ''}`}
            onClick={() => {
              if (roomCode) {
                navigator.clipboard.writeText(roomCode);
                setCopied(true);
              }
            }}
            title="Copy room code"
          >
            {copied ? <FaCheck /> : <FaCopy />}
          </button>
        </div>
        {copied && <span className="share-code-copied-text">Room code copied to clipboard</span>}
      </div>

      <div className="share-header">
        <h2>
          <FaUsers /> Players
        </h2>
        <div className="share-header-actions">
          {eligiblePlayers.length > 0 && (
            <button className="share-select-all" onClick={selectAll}>
              {Object.keys(selected).length === filteredPlayers.length ? 'Clear All' : 'Select All'}
            </button>
          )}
          <div className="share-count">
            {selectedIds.length} selected
          </div>
        </div>
      </div>

      {eligiblePlayers.length > 0 && (
        <div className="share-search">
          <FaSearch className="share-search-icon" />
          <input
            type="text"
            placeholder="Search players by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="share-search-clear"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              <FaTimes />
            </button>
          )}
        </div>
      )}

      {eligiblePlayers.length > 0 ? (
        filteredPlayers.length > 0 ? (
          <div className="share-list">
            {filteredPlayers.map((player) => {
              const name = player.displayName || player.email || 'Unknown';
              const isSelected = !!selected[player.id];
              const stats = player.stats || {};

              return (
                <label
                  key={player.id}
                  className={`share-item ${isSelected ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    className="share-checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(player.id)}
                  />
                  <div className="share-avatar" style={{ background: getColor(name) }}>
                    {getInitials(name)}
                  </div>
                  <div className="share-info">
                    <span className="share-name">{name}</span>
                    <span className="share-stats">W: {stats.wins || 0} · L: {stats.losses || 0}</span>
                  </div>
                  <span className={`share-check ${isSelected ? 'checked' : ''}`}>
                    {isSelected && <FaCheck />}
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="share-empty">
            <div className="share-empty-icon">
              <FaUsers />
            </div>
            <h3>No players found</h3>
            <p>No players match &quot;{search}&quot;.</p>
          </div>
        )
      ) : (
        <div className="share-empty">
          <div className="share-empty-icon">
            <FaUsers />
          </div>
          <h3>No players found</h3>
          <p>There are no other registered players to share your room code with.</p>
        </div>
      )}

      {error && <p className="share-error">{error}</p>}

      <div className="share-footer">
        <button
          className="share-send-btn"
          onClick={handleSend}
          disabled={sending || selectedIds.length === 0 || !roomCode}
        >
          {sending ? <FaSpinner className="share-spinner" /> : <FaShareAlt />}
          {sending ? 'Sending...' : sent ? 'Sent!' : `Send Code to ${selectedIds.length} Player${selectedIds.length === 1 ? '' : 's'}`}
        </button>
      </div>
    </div>
  );
}
