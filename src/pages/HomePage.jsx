import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { useUserProfile, useMatchHistory } from '../firebase/hooks';
import {
  FaRobot,
  FaGlobe,
  FaGamepad,
  FaTrophy,
  FaPlay,
  FaArrowRight,
  FaCalendarAlt,
  FaFire,
  FaLayerGroup,
  FaHistory,
  FaMedal,
  FaBolt,
  FaStar,
  FaTrashAlt,
  FaExclamationTriangle,
  FaCheck,
  FaUsers,
  FaBookOpen,
} from 'react-icons/fa';
import './HomePage.css';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const getFormattedDate = () => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const getInitial = (name) => {
  if (!name) return 'P';
  return name.charAt(0).toUpperCase();
};

const formatMatchTime = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const HomePage = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const displayName = user?.displayName || 'Player';
  const initial = getInitial(displayName);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  const { profile } = useUserProfile(user?.uid);
  const { matches, clearHistory } = useMatchHistory(user?.uid, 10);

  const stats = profile?.stats || {};
  const totalMatches = stats.totalMatches || 0;
  const winRate = stats.winRate != null ? Math.round(stats.winRate) : null;
  const winStreak = stats.winStreak || 0;
  const bestWinStreak = stats.bestWinStreak || 0;
  const totalWins = stats.wins || 0;

  const handleClearHistory = async () => {
    setClearing(true);
    const result = await clearHistory();
    if (result.success) {
      setCleared(true);
      setTimeout(() => {
        setCleared(false);
        setShowClearConfirm(false);
      }, 2000);
    }
    setClearing(false);
  };

  return (
    <div className="dashboard">
      {/* Welcome Hero */}
      <section className="dash-hero">
        <div className="dash-hero-bg">
          <div className="dash-hero-orb dash-hero-orb-1" />
          <div className="dash-hero-orb dash-hero-orb-2" />
          <div className="dash-hero-orb dash-hero-orb-3" />
        </div>
        <div className="dash-hero-content">
          <div className="dash-hero-text">
            <p className="dash-hero-greeting">{getGreeting()}</p>
            <h1 className="dash-hero-name">{displayName}</h1>
            <p className="dash-hero-sub">
              <FaCalendarAlt className="dash-hero-date-icon" />
              {getFormattedDate()}
            </p>
          </div>
          <div className="dash-hero-avatar" title={displayName}>
            <span>{initial}</span>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="dash-stats-grid">
        <div className="dash-stat-card dash-stat-card--games">
          <div className="dash-stat-card-icon">
            <FaGamepad />
          </div>
          <div className="dash-stat-card-info">
            <span className="dash-stat-card-value">{totalMatches}</span>
            <span className="dash-stat-card-label">Games Played</span>
          </div>
          <div className="dash-stat-card-decoration" />
        </div>

        <div className="dash-stat-card dash-stat-card--wins">
          <div className="dash-stat-card-icon">
            <FaTrophy />
          </div>
          <div className="dash-stat-card-info">
            <span className="dash-stat-card-value">{totalWins}</span>
            <span className="dash-stat-card-label">Total Wins</span>
          </div>
          <div className="dash-stat-card-decoration" />
        </div>

        <div className="dash-stat-card dash-stat-card--rate">
          <div className="dash-stat-card-icon">
            <FaBolt />
          </div>
          <div className="dash-stat-card-info">
            <span className="dash-stat-card-value">{winRate != null ? `${winRate}%` : '—'}</span>
            <span className="dash-stat-card-label">Win Rate</span>
          </div>
          <div className="dash-stat-card-decoration" />
        </div>

        <div className="dash-stat-card dash-stat-card--streak">
          <div className="dash-stat-card-icon">
            <FaFire />
          </div>
          <div className="dash-stat-card-info">
            <span className="dash-stat-card-value">{winStreak}</span>
            <span className="dash-stat-card-label">Win Streak</span>
          </div>
          <div className="dash-stat-card-decoration" />
        </div>

        <div className="dash-stat-card dash-stat-card--best">
          <div className="dash-stat-card-icon">
            <FaStar />
          </div>
          <div className="dash-stat-card-info">
            <span className="dash-stat-card-value">{bestWinStreak || '—'}</span>
            <span className="dash-stat-card-label">Best Streak</span>
          </div>
          <div className="dash-stat-card-decoration" />
        </div>
      </section>

      {/* Quick Actions */}
      <section className="dash-actions">
        <div className="dash-section-header">
          <h2>Quick Play</h2>
          <span className="dash-section-badge">Get started</span>
        </div>
        <div className="dash-action-grid">
          <button
            className="dash-action-card dash-action-card--ai"
            onClick={() => navigate('/play/ai')}
          >
            <div className="dash-action-icon">
              <FaRobot />
            </div>
            <div className="dash-action-body">
              <h3>Play vs Computer</h3>
              <p>Practice against AI opponents at any difficulty level.</p>
            </div>
            <div className="dash-action-cta">
              <span>Play Now</span>
              <FaArrowRight />
            </div>
          </button>

          <button
            className="dash-action-card dash-action-card--online"
            onClick={() => navigate('/lobby')}
          >
            <div className="dash-action-icon">
              <FaGlobe />
            </div>
            <div className="dash-action-body">
              <h3>Play Online</h3>
              <p>Join or create a room and play against real opponents.</p>
            </div>
            <div className="dash-action-cta">
              <span>Find Match</span>
              <FaArrowRight />
            </div>
          </button>
        </div>
      </section>

      {/* Quick Links */}
      <section className="dash-links">
        <button className="dash-link-card" onClick={() => navigate('/how-to-play')}>
          <FaBookOpen className="dash-link-icon" />
          <span>How to Play</span>
          <FaArrowRight className="dash-link-arrow" />
        </button>
        <button className="dash-link-card" onClick={() => navigate('/lobby')}>
          <FaUsers className="dash-link-icon" />
          <span>Multiplayer Lobby</span>
          <FaArrowRight className="dash-link-arrow" />
        </button>
        <button className="dash-link-card" onClick={() => navigate('/settings')}>
          <FaGamepad className="dash-link-icon" />
          <span>Game Settings</span>
          <FaArrowRight className="dash-link-arrow" />
        </button>
      </section>

      {/* Recent Activity */}
      <section className="dash-recent">
        <div className="dash-section-header">
          <h2>
            <FaHistory className="dash-section-icon" />
            Recent Matches
          </h2>
          {matches.length > 0 && (
            <button
              className="dash-clear-btn"
              onClick={() => setShowClearConfirm(true)}
              title="Clear match history"
            >
              <FaTrashAlt />
            </button>
          )}
        </div>
        {matches.length > 0 ? (
          <div className="dash-recent-list">
            {matches.map((match) => {
              const myId = user?.uid;
              const didWin = match.winner === myId;
              const isDraw = match.winner === null || match.winner === undefined;
              const opponentLabel = match.gameMode === 'ai' ? 'Computer' : 'Opponent';
              return (
                <div key={match.id} className="dash-recent-item">
                  <div className={`dash-recent-result ${didWin ? 'win' : isDraw ? 'draw' : 'loss'}`}>
                    {didWin ? <FaTrophy /> : isDraw ? '—' : <FaMedal />}
                  </div>
                  <div className="dash-recent-details">
                    <span className="dash-recent-opponent">vs {opponentLabel}</span>
                    <span className="dash-recent-mode">{match.gameMode === 'ai' ? 'AI Match' : 'Online Match'}</span>
                  </div>
                  <span className="dash-recent-time">{formatMatchTime(match.timestamp)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="dash-recent-empty">
            <div className="dash-recent-empty-icon">
              <FaLayerGroup />
            </div>
            <p className="dash-recent-empty-title">No matches yet</p>
            <p className="dash-recent-empty-text">
              Your game history will appear here once you start playing.
            </p>
            <button
              className="dash-recent-empty-action"
              onClick={() => navigate('/play/ai')}
            >
              <FaPlay />
              Start your first game
            </button>
          </div>
        )}
      </section>

      {/* Clear History Confirmation Modal */}
      {showClearConfirm && (
        <div className="dash-modal-overlay" onClick={() => !clearing && setShowClearConfirm(false)}>
          <div className="dash-modal" onClick={e => e.stopPropagation()}>
            <div className="dash-modal-icon">
              {cleared ? <FaCheck /> : <FaExclamationTriangle />}
            </div>
            <h3>{cleared ? 'History Cleared!' : 'Clear Match History?'}</h3>
            <p>
              {cleared
                ? 'Your match history and stats have been reset.'
                : 'This will permanently delete all your match history and reset your stats. This action cannot be undone.'}
            </p>
            {!cleared && (
              <div className="dash-modal-actions">
                <button
                  className="dash-modal-btn danger"
                  onClick={handleClearHistory}
                  disabled={clearing}
                >
                  {clearing ? 'Clearing...' : 'Yes, Clear Everything'}
                </button>
                <button
                  className="dash-modal-btn cancel"
                  onClick={() => setShowClearConfirm(false)}
                  disabled={clearing}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
