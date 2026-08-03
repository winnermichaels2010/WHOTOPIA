import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { useNotifications } from '../firebase/hooks';
import { getGameRoom } from '../firebase/services/realtimeDBService';
import LoadingSpinner from '../components/LoadingSpinner';
import { FaBell, FaDoorOpen, FaArrowLeft, FaUserCircle, FaClock, FaGamepad } from 'react-icons/fa';
import './NotificationsPage.css';

const formatTime = (timestamp) => {
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

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const { notifications, loading, markRead, markExpired } = useNotifications(user?.uid);
  const [roomStatuses, setRoomStatuses] = useState({});
  const [joining, setJoining] = useState(null);

  useEffect(() => {
    if (user?.uid && notifications.length > 0) {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
      if (unreadIds.length > 0) markRead(unreadIds);
    }
  }, [user, notifications, markRead]);

  useEffect(() => {
    const roomCodes = [
      ...new Set(
        notifications
          .filter((n) => n.roomCode && !n.expired)
          .map((n) => n.roomCode)
      ),
    ];

    let cancelled = false;
    roomCodes.forEach(async (code) => {
      try {
        const snapshot = await getGameRoom(code);
        if (cancelled) return;
        const room = snapshot.exists() ? snapshot.val() : null;
        const active = !!room && room.status === 'waiting';
        setRoomStatuses((prev) => ({ ...prev, [code]: active }));
        if (!active) {
          markExpired(code);
        }
      } catch (err) {
        console.error('Failed to check room status:', err);
        if (!cancelled) setRoomStatuses((prev) => ({ ...prev, [code]: false }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [notifications, markExpired]);

  const handleJoin = (notification) => {
    if (!notification.roomCode) return;
    setJoining(notification.id);
    navigate(`/lobby?join=${notification.roomCode}`);
  };

  if (authLoading || loading) {
    return (
      <div className="notif-page">
        <div className="notif-loading">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="notif-page">
      <button className="notif-back-btn" onClick={() => navigate('/dashboard')}>
        <FaArrowLeft /> Back to Dashboard
      </button>

      <div className="notif-hero">
        <div className="notif-hero-icon">
          <FaBell />
        </div>
        <h1>Notifications</h1>
        <p>Room codes and invites shared with you</p>
      </div>

      {notifications.length > 0 ? (
        <div className="notif-list">
          {notifications.map((notification) => {
            const isExpired = notification.expired || roomStatuses[notification.roomCode] === false;

            return (
              <div key={notification.id} className={`notif-item ${isExpired ? 'expired' : ''}`}>
                <div className="notif-icon">
                  <FaUserCircle />
                </div>
                <div className="notif-body">
                  <div className="notif-title">
                    {notification.senderName || 'A player'} sent you a room code
                  </div>
                  <p className="notif-message">
                    {notification.message || 'Join the room before the game starts.'}
                  </p>
                  {notification.roomCode && (
                    <div className="notif-code-row">
                      <span className="notif-code-label">Room Code</span>
                      <span className="notif-code">{notification.roomCode}</span>
                      {isExpired ? (
                        <span className="notif-expired-badge">Expired</span>
                      ) : (
                        <button
                          className="notif-join-btn"
                          onClick={() => handleJoin(notification)}
                          disabled={joining === notification.id}
                        >
                          <FaDoorOpen />
                          {joining === notification.id ? 'Joining...' : 'Join Room'}
                        </button>
                      )}
                    </div>
                  )}
                  <div className="notif-meta">
                    <span className="notif-time">
                      <FaClock /> {formatTime(notification.createdAt)}
                    </span>
                    {!isExpired && notification.roomCode && (
                      <span className="notif-live">
                        <FaGamepad /> Waiting for host to start
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="notif-empty">
          <div className="notif-empty-icon">
            <FaBell />
          </div>
          <h3>No notification yet</h3>
          <p>When a host shares a room code with you, it will show up here.</p>
        </div>
      )}
    </div>
  );
}
