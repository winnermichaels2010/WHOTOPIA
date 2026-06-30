/**
 * HomePage Component
 * 
 * Main landing page for authenticated users.
 * This is a placeholder for the game lobby/dashboard.
 */

import { useAuthContext } from '../context/AuthContext';

const HomePage = () => {
  const { user, logout } = useAuthContext();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="home-page">
      <div className="home-container">
        <div className="home-header">
          <h1>Welcome to Whotopia!</h1>
          <p>Hello, {user?.displayName || 'Player'}!</p>
        </div>
        
        <div className="home-content">
          <div className="welcome-card">
            <h2>Ready to Play?</h2>
            <p>The game lobby and matchmaking features are coming soon.</p>
            <div className="placeholder-info">
              <p>🎮 Game features will be implemented here</p>
              <p>🏆 Leaderboards</p>
              <p>💬 Chat</p>
              <p>👥 Multiplayer rooms</p>
            </div>
          </div>
        </div>

        <div className="home-footer">
          <button onClick={handleLogout} className="logout-button">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
