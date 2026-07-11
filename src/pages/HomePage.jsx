import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
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
  FaTachometerAlt,
  FaHistory,
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

const HomePage = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const displayName = user?.displayName || 'Player';
  const initial = getInitial(displayName);

  return (
    <div className="dashboard">
      {/* Welcome Hero */}
      <section className="dash-hero">
        <div className="dash-hero-content">
          <div className="dash-hero-text">
            <h1>{getGreeting()}, <span className="dash-hero-name">{displayName}</span></h1>
            <p className="dash-hero-sub">
              <FaCalendarAlt className="dash-hero-date-icon" />
              {getFormattedDate()}
            </p>
          </div>
          <div className="dash-hero-avatar" title={displayName}>
            {initial}
          </div>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="dash-stats">
        <div className="dash-stat">
          <div className="dash-stat-icon dash-stat-icon--games">
            <FaGamepad />
          </div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">0</span>
            <span className="dash-stat-label">Games Played</span>
          </div>
        </div>

        <div className="dash-stat-divider" />

        <div className="dash-stat">
          <div className="dash-stat-icon dash-stat-icon--wins">
            <FaTrophy />
          </div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">—</span>
            <span className="dash-stat-label">Win Rate</span>
          </div>
        </div>

        <div className="dash-stat-divider" />

        <div className="dash-stat">
          <div className="dash-stat-icon dash-stat-icon--rank">
            <FaTachometerAlt />
          </div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">—</span>
            <span className="dash-stat-label">Rank</span>
          </div>
        </div>

        <div className="dash-stat-divider" />

        <div className="dash-stat">
          <div className="dash-stat-icon dash-stat-icon--streak">
            <FaFire />
          </div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">0</span>
            <span className="dash-stat-label">Win Streak</span>
          </div>
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

      {/* Recent Activity */}
      <section className="dash-recent">
        <div className="dash-section-header">
          <h2>
            <FaHistory className="dash-section-icon" />
            Recent Matches
          </h2>
        </div>
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
      </section>
    </div>
  );
};

export default HomePage;
