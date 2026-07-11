import { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { getAllUsers } from '../firebase/services/firestoreService';
import { onAllPresenceChange } from '../firebase/services/realtimeDBService';
import LoadingSpinner from '../components/LoadingSpinner';
import { FaUsers } from 'react-icons/fa';
import './PlayersPage.css';

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

export default function PlayersPage() {
  const { user, loading: authLoading } = useAuthContext();
  const [players, setPlayers] = useState([]);
  const [presence, setPresence] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    let unsubPresence = null;

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
      } finally {
        setLoading(false);
      }
    };

    load();

    unsubPresence = onAllPresenceChange((snapshot) => {
      if (snapshot.exists()) {
        setPresence(snapshot.val());
      } else {
        setPresence({});
      }
    });

    return () => {
      if (typeof unsubPresence === 'function') unsubPresence();
    };
  }, [authLoading]);

  if (authLoading || loading) {
    return (
      <div className="players-page">
        <div className="players-loading">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  const onlineCount = players.filter((p) => presence[p.id]?.online).length;

  return (
    <div className="players-page">
      <div className="players-hero">
        <div className="players-hero-icon">
          <FaUsers />
        </div>
        <h1>Players</h1>
        <p>See who's online and ready to play</p>
      </div>

      <div className="players-header">
        <div />
        <div className="players-count">
          <span className="online-dot" />
          {onlineCount} online &middot; {players.length} total
        </div>
      </div>

      {players.length > 0 ? (
        <div className="players-list">
          {players.map((player) => {
            const isOnline = !!presence[player.id]?.online;
            const isCurrent = player.id === user?.uid;
            const name = player.displayName || player.email || 'Unknown';
            const stats = player.stats || {};

            return (
              <div
                key={player.id}
                className={`player-item ${isCurrent ? 'current-user' : ''}`}
              >
                <div className="player-avatar-wrapper">
                  <div
                    className="player-avatar"
                    style={{ background: getColor(name) }}
                  >
                    {getInitials(name)}
                  </div>
                  <div className={isOnline ? 'online-indicator' : 'offline-indicator'} />
                </div>

                <div className="player-info">
                  <div className="player-name">
                    {name}
                    {isCurrent && <span className="current-user-badge">You</span>}
                  </div>
                  <div className="player-stats">
                    <span className="wins">W: {stats.wins || 0}</span>
                    <span className="losses">L: {stats.losses || 0}</span>
                    <span>Win Rate: {stats.winRate ? Math.round(stats.winRate) : 0}%</span>
                  </div>
                </div>

                <span className={`player-status-badge ${isOnline ? 'online' : 'offline'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="players-empty">
          <div className="players-empty-icon">
            <FaUsers />
          </div>
          <h3>No players yet</h3>
          <p>Be the first to sign up and start playing!</p>
        </div>
      )}
    </div>
  );
}
