import { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { getAllUsers } from '../firebase/services/firestoreService';
import LoadingSpinner from '../components/LoadingSpinner';
import { FaUsers, FaSearch, FaTimes } from 'react-icons/fa';
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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authLoading]);

  const query = search.trim().toLowerCase();
  const visiblePlayers = players.filter((player) => !player.isRemoved);
  const filteredPlayers = visiblePlayers.filter((player) => {
    const name = (player.displayName || player.email || '').toLowerCase();
    return !query || name.includes(query);
  });

  if (authLoading || loading) {
    return (
      <div className="players-page">
        <div className="players-loading">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="players-page">
      <div className="players-hero">
        <div className="players-hero-icon">
          <FaUsers />
        </div>
        <h1>Players</h1>
        <p>See all registered players</p>
      </div>

      <div className="players-header">
        <div className="players-search">
          <FaSearch className="players-search-icon" />
          <input
            type="text"
            placeholder="Search players by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="players-search-clear"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              <FaTimes />
            </button>
          )}
        </div>
        <div className="players-count">
          {filteredPlayers.length} {filteredPlayers.length === 1 ? 'player' : 'players'}
        </div>
      </div>

      {filteredPlayers.length > 0 ? (
        <div className="players-list">
          {filteredPlayers.map((player) => {
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
                </div>

                <div className="player-info">
                  <div className="player-name">
                    {name}
                    {isCurrent && <span className="current-user-badge">You</span>}
                    {!isCurrent && player.wasReadded && (
                      <span className="readded-badge">Readded</span>
                    )}
                  </div>
                  <div className="player-stats">
                    <span className="wins">W: {stats.wins || 0}</span>
                    <span className="losses">L: {stats.losses || 0}</span>
                    <span>Win Rate: {stats.winRate ? Math.round(stats.winRate) : 0}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="players-empty">
          <div className="players-empty-icon">
            <FaUsers />
          </div>
          {players.length === 0 ? (
            <>
              <h3>No players yet</h3>
              <p>Be the first to sign up and start playing!</p>
            </>
          ) : visiblePlayers.length === 0 ? (
            <>
              <h3>No active players</h3>
              <p>All registered players are currently removed.</p>
            </>
          ) : (
            <>
              <h3>No players found</h3>
              <p>No players match &quot;{search}&quot;.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
