import { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { getAllUsers, removeUser, restoreUser } from '../firebase/services/firestoreService';
import AdminSidebar from '../components/AdminSidebar';
import { FaUsers, FaUserSlash, FaUserCheck, FaSpinner, FaSearch, FaTimes, FaExclamationCircle, FaUndo } from 'react-icons/fa';
import './AdminPlayersPage.css';

const colors = ['#e63946', '#f72585', '#FF9800', '#2196F3', '#4CAF50', '#9C27B0'];

const getInitials = (name) => (name || '?').slice(0, 2).toUpperCase();

const getColor = (name) => {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const AdminPlayersPage = () => {
  const { user } = useAuthContext();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('players');
  const [search, setSearch] = useState('');
  const [target, setTarget] = useState(null);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
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

  useEffect(() => {
    load();
  }, []);

  const activePlayers = players.filter((p) => !p.isRemoved);
  const removedPlayers = players.filter((p) => p.isRemoved);

  const query = search.trim().toLowerCase();
  const matches = (player) => {
    const name = (player.displayName || player.email || '').toLowerCase();
    return !query || name.includes(query);
  };

  const currentList = tab === 'players' ? activePlayers.filter(matches) : removedPlayers.filter(matches);

  const handleRemove = async () => {
    if (!target) return;
    setBusyId(target.id);
    setError('');
    try {
      await removeUser(target.id, user?.displayName || 'Admin');
      setPlayers((prev) =>
        prev.map((p) => (p.id === target.id ? { ...p, isRemoved: true, removedAt: new Date(), removedBy: user?.displayName || 'Admin' } : p))
      );
      setConfirmingRemove(false);
      setTarget(null);
    } catch (err) {
      console.error('Failed to remove player:', err);
      setError('Failed to remove player. Please try again.');
      setConfirmingRemove(false);
    }
    setBusyId(null);
  };

  const handleRestore = async (player) => {
    setBusyId(player.id);
    setError('');
    try {
      await restoreUser(player.id);
      setPlayers((prev) =>
        prev.map((p) => (p.id === player.id ? { ...p, isRemoved: false, wasReadded: true, readdedAt: new Date() } : p))
      );
    } catch (err) {
      console.error('Failed to re-add player:', err);
      setError('Failed to re-add player. Please try again.');
    }
    setBusyId(null);
  };

  return (
    <AdminSidebar>
      <div className="admin-players-page">
        <div className="admin-players-content">
          <section className="admin-players-hero">
            <div className="admin-players-hero-icon">
              <FaUsers />
            </div>
            <h1>Players Management</h1>
            <p>Manage the player list. Removed players are hidden from the Players page.</p>
          </section>

          <div className="admin-players-tabs">
            <button
              className={`admin-players-tab ${tab === 'players' ? 'active' : ''}`}
              onClick={() => setTab('players')}
            >
              <FaUsers />
              <span>Players</span>
              <span className="admin-players-tab-count">{activePlayers.length}</span>
            </button>
            <button
              className={`admin-players-tab ${tab === 'removed' ? 'active' : ''}`}
              onClick={() => setTab('removed')}
            >
              <FaUserSlash />
              <span>Removed Players</span>
              <span className="admin-players-tab-count">{removedPlayers.length}</span>
            </button>
          </div>

          <div className="admin-players-search">
            <FaSearch className="admin-players-search-icon" />
            <input
              type="text"
              placeholder={`Search ${tab === 'players' ? 'players' : 'removed players'} by name...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="admin-players-search-clear"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>

          {error && (
            <div className="admin-players-error">
              <FaExclamationCircle />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="admin-players-loading">
              <FaSpinner className="spin" />
              <span>Loading players...</span>
            </div>
          ) : currentList.length === 0 ? (
            <div className="admin-players-empty">
              <div className="admin-players-empty-icon">
                {tab === 'players' ? <FaUsers /> : <FaUserCheck />}
              </div>
              {players.length === 0 ? (
                <>
                  <h3>No players yet</h3>
                  <p>Be the first to sign up and start playing!</p>
                </>
              ) : tab === 'removed' ? (
                <>
                  <h3>No removed players</h3>
                  <p>Removed players will appear here.</p>
                </>
              ) : (
                <>
                  <h3>No players found</h3>
                  <p>No players match &quot;{search}&quot;.</p>
                </>
              )}
            </div>
          ) : (
            <div className="admin-players-list">
              {currentList.map((player) => {
                const name = player.displayName || player.email || 'Unknown';
                const stats = player.stats || {};
                const removed = tab === 'removed';

                return (
                  <div key={player.id} className={`admin-player-item ${removed ? 'removed' : ''}`}>
                    <div className="admin-player-avatar" style={{ background: getColor(name) }}>
                      {getInitials(name)}
                    </div>
                    <div className="admin-player-info">
                      <div className="admin-player-name">
                        {name}
                        {!removed && player.wasReadded && (
                          <span className="admin-player-readded-badge">
                            <FaUserCheck />
                            Readded
                          </span>
                        )}
                      </div>
                      <div className="admin-player-email">{player.email}</div>
                      <div className="admin-player-stats">
                        <span>W: {stats.wins || 0}</span>
                        <span>L: {stats.losses || 0}</span>
                        <span>Win Rate: {stats.winRate ? Math.round(stats.winRate) : 0}%</span>
                      </div>
                      {removed && player.removedAt && (
                        <div className="admin-player-removed-info">
                          Removed {formatDate(player.removedAt)}
                          {player.removedBy ? ` by ${player.removedBy}` : ''}
                        </div>
                      )}
                    </div>
                    <div className="admin-player-actions">
                      {removed ? (
                        <button
                          className="admin-player-action restore"
                          onClick={() => handleRestore(player)}
                          disabled={busyId === player.id}
                        >
                          {busyId === player.id ? <FaSpinner className="spin" /> : <FaUndo />}
                          <span>Re-add</span>
                        </button>
                      ) : (
                        <button
                          className="admin-player-action remove"
                          onClick={() => {
                            setTarget(player);
                            setConfirmingRemove(true);
                          }}
                          disabled={busyId === player.id}
                        >
                          <FaUserSlash />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {confirmingRemove && target && (
          <div className="admin-player-modal-overlay" onClick={() => setConfirmingRemove(false)}>
            <div className="admin-player-modal" onClick={(e) => e.stopPropagation()}>
              <div className="admin-player-modal-icon">
                <FaUserSlash />
              </div>
              <h3>Remove Player</h3>
              <p>
                Are you sure you want to remove <strong>{target.displayName || target.email || 'this player'}</strong>?
                They will no longer show up on the Players page until you re-add them.
              </p>
              <div className="admin-player-modal-actions">
                <button
                  className="admin-player-modal-btn cancel"
                  onClick={() => setConfirmingRemove(false)}
                  disabled={busyId === target.id}
                >
                  Cancel
                </button>
                <button
                  className="admin-player-modal-btn confirm danger"
                  onClick={handleRemove}
                  disabled={busyId === target.id}
                >
                  {busyId === target.id ? <FaSpinner className="spin" /> : <FaUserSlash />}
                  <span>{busyId === target.id ? 'Removing...' : 'Remove'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminSidebar>
  );
};

export default AdminPlayersPage;
