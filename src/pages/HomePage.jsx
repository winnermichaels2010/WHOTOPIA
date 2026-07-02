import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { FaRobot, FaGlobe, FaGamepad, FaTrophy, FaUserFriends } from 'react-icons/fa';
import './HomePage.css';

const HomePage = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-greeting">
          <h1>Welcome back, {user?.displayName || 'Player'}!</h1>
          <p>Ready for a game of Whot?</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dash-card play-card" onClick={() => navigate('/play/ai')}>
          <div className="dash-card-icon"><FaRobot /></div>
          <div className="dash-card-body">
            <h3>Play vs Computer</h3>
            <p>Practice against AI opponents at any difficulty level.</p>
          </div>
          <span className="dash-card-action">Play Now →</span>
        </div>

        <div className="dash-card play-card disabled">
          <div className="dash-card-icon"><FaGlobe /></div>
          <div className="dash-card-body">
            <h3>Play Online</h3>
            <p>Join or create a room and play against real opponents.</p>
          </div>
          <span className="dash-card-badge">Coming Soon</span>
        </div>

        <div className="dash-card stat-card">
          <div className="dash-card-icon"><FaGamepad /></div>
          <div className="dash-card-body">
            <h3>Match History</h3>
            <p className="stat-value">0</p>
            <p className="stat-label">games played</p>
          </div>
        </div>

        <div className="dash-card stat-card">
          <div className="dash-card-icon"><FaTrophy /></div>
          <div className="dash-card-body">
            <h3>Win Rate</h3>
            <p className="stat-value">—</p>
            <p className="stat-label">0% win rate</p>
          </div>
        </div>

        <div className="dash-card stat-card">
          <div className="dash-card-icon"><FaUserFriends /></div>
          <div className="dash-card-body">
            <h3>Leaderboard</h3>
            <p className="stat-value">—</p>
            <p className="stat-label">rank not available</p>
          </div>
        </div>
      </div>

      <div className="dashboard-recent">
        <h2>Recent Matches</h2>
        <div className="recent-empty">
          <p>No matches played yet. Start a game to see your history here!</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
