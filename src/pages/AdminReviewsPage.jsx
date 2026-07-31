import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { onReviewsChange, getAllReviews, deleteReview, clearAllReviews } from '../firebase/services/firestoreService';
import {
  FaStar,
  FaComments,
  FaClock,
  FaEnvelope,
  FaSpinner,
  FaEye,
  FaSignOutAlt,
  FaSyncAlt,
  FaExclamationCircle,
  FaMoon,
  FaSun,
  FaTrashAlt,
  FaTrash,
} from 'react-icons/fa';
import './AdminReviewsPage.css';

const formatReviewTime = (timestamp) => {
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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const sortReviews = (docs) => [...docs].sort((a, b) => {
  const ta = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : (a.timestamp ? new Date(a.timestamp).getTime() : 0);
  const tb = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : (b.timestamp ? new Date(b.timestamp).getTime() : 0);
  return tb - ta;
});

const AdminReviewsPage = () => {
  const { logout } = useAuthContext();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [confirmingClearAll, setConfirmingClearAll] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchReviews = async () => {
    setRefreshing(true);
    setError('');
    try {
      const snapshot = await getAllReviews();
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReviews(sortReviews(reviewsData));
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setError(err?.message || 'Failed to load reviews.');
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    let unsubscribe;
    try {
      unsubscribe = onReviewsChange((snapshot) => {
        const reviewsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReviews(sortReviews(reviewsData));
        setLoading(false);
        setError('');
      }, (err) => {
        console.error('Review listener error:', err);
        setError(err?.message || 'Lost connection to reviews. Click refresh to reload.');
        setLoading(false);
      });
    } catch (err) {
      console.error('Failed to subscribe to reviews:', err);
      setError(err?.message || 'Failed to load reviews.');
      setLoading(false);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const getInitial = (name) => {
    if (!name) return 'P';
    return name.charAt(0).toUpperCase();
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;
    setDeleting(true);
    setError('');
    try {
      await deleteReview(reviewToDelete.id);
      setReviews((prev) => prev.filter((r) => r.id !== reviewToDelete.id));
      setReviewToDelete(null);
    } catch (err) {
      console.error('Failed to delete review:', err);
      setError(err?.message || 'Failed to delete review.');
      setReviewToDelete(null);
    }
    setDeleting(false);
  };

  const handleClearAll = async () => {
    setDeleting(true);
    setError('');
    try {
      await clearAllReviews();
      setReviews([]);
      setConfirmingClearAll(false);
    } catch (err) {
      console.error('Failed to clear reviews:', err);
      setError(err?.message || 'Failed to clear all reviews.');
      setConfirmingClearAll(false);
    }
    setDeleting(false);
  };

  return (
    <div className="admin-reviews-page">
      {/* Sticky Top Bar */}
      <nav className="admin-reviews-topbar">
        <div className="admin-reviews-topbar-left">
          <FaEye className="admin-reviews-topbar-icon" />
          <span className="admin-reviews-topbar-title">Player Reviews</span>
        </div>
        <div className="admin-reviews-topbar-actions">
          <button
            className="admin-reviews-theme-toggle"
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <FaSun /> : <FaMoon />}
          </button>
          <button className="admin-reviews-topbar-logout" onClick={handleSignOut}>
            <FaSignOutAlt />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Header */}
      <section className="admin-reviews-hero">
        <div className="admin-reviews-hero-bg">
          <div className="admin-reviews-hero-orb admin-reviews-hero-orb-1" />
          <div className="admin-reviews-hero-orb admin-reviews-hero-orb-2" />
        </div>
        <div className="admin-reviews-hero-content">
          <div className="admin-reviews-hero-icon">
            <FaEye />
          </div>
          <h1>Player Reviews</h1>
          <p>View all feedback submitted by players.</p>
        </div>
      </section>

      {/* Stats */}
      <section className="admin-reviews-stats">
        <div className="admin-reviews-stat-card">
          <FaComments className="admin-reviews-stat-icon" />
          <div className="admin-reviews-stat-info">
            <span className="admin-reviews-stat-value">{reviews.length}</span>
            <span className="admin-reviews-stat-label">Total Reviews</span>
          </div>
        </div>
        <div className="admin-reviews-stat-card">
          <FaStar className="admin-reviews-stat-icon" />
          <div className="admin-reviews-stat-info">
            <span className="admin-reviews-stat-value">
              {reviews.filter(r => r.suggestion).length}
            </span>
            <span className="admin-reviews-stat-label">With Suggestions</span>
          </div>
        </div>
      </section>

      {/* Reviews List */}
      <section className="admin-reviews-list-section">
        <div className="admin-reviews-list-header">
          <h2>All Player Reviews</h2>
          <div className="admin-reviews-list-actions">
            {reviews.length > 0 && (
              <button
                className="admin-reviews-clear-btn"
                onClick={() => setConfirmingClearAll(true)}
                disabled={deleting}
                title="Delete all reviews"
              >
                <FaTrash />
                <span>Clear All</span>
              </button>
            )}
            <button
              className="admin-reviews-refresh-btn"
              onClick={fetchReviews}
              disabled={refreshing}
              title="Refresh reviews"
            >
              <FaSyncAlt className={refreshing ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="admin-reviews-error">
            <FaExclamationCircle />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="admin-reviews-loading">
            <FaSpinner className="spin" />
            <span>Loading reviews...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="admin-reviews-empty">
            <FaComments className="admin-reviews-empty-icon" />
            <p>No reviews submitted yet.</p>
          </div>
        ) : (
          <div className="admin-reviews-list">
            {reviews.map((item) => (
              <div key={item.id} className="admin-review-card">
                <div className="admin-review-card-header">
                  <div className="admin-review-card-avatar">
                    <span>{getInitial(item.displayName)}</span>
                  </div>
                  <div className="admin-review-card-meta">
                    <span className="admin-review-card-name">{item.displayName}</span>
                    <span className="admin-review-card-email">
                      <FaEnvelope />
                      {item.email}
                    </span>
                  </div>
                  <span className="admin-review-card-time">
                    <FaClock />
                    {formatReviewTime(item.timestamp)}
                  </span>
                  <button
                    className="admin-review-card-delete"
                    onClick={() => setReviewToDelete(item)}
                    title="Delete this review"
                  >
                    <FaTrashAlt />
                  </button>
                </div>
                <div className="admin-review-card-body">
                  <div className="admin-review-card-section">
                    <span className="admin-review-section-label">Review</span>
                    <p className="admin-review-card-text">{item.review}</p>
                  </div>
                  {item.suggestion && (
                    <div className="admin-review-card-section admin-review-suggestion">
                      <span className="admin-review-section-label">Suggested Changes</span>
                      <p className="admin-review-card-text">{item.suggestion}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {reviewToDelete && (
        <div className="admin-review-modal-overlay" onClick={() => !deleting && setReviewToDelete(null)}>
          <div className="admin-review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-review-modal-icon">
              <FaTrashAlt />
            </div>
            <h3>Delete Review</h3>
            <p>
              Are you sure you want to delete this review by{' '}
              <strong>{reviewToDelete.displayName}</strong>? This action cannot be undone.
            </p>
            <div className="admin-review-modal-actions">
              <button
                className="admin-review-modal-btn cancel"
                onClick={() => setReviewToDelete(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="admin-review-modal-btn confirm danger"
                onClick={handleDeleteReview}
                disabled={deleting}
              >
                {deleting ? <FaSpinner className="spin" /> : <FaTrashAlt />}
                <span>{deleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmingClearAll && (
        <div className="admin-review-modal-overlay" onClick={() => !deleting && setConfirmingClearAll(false)}>
          <div className="admin-review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-review-modal-icon">
              <FaTrash />
            </div>
            <h3>Clear All Reviews</h3>
            <p>
              Are you sure you want to delete all {reviews.length} reviews? This action cannot be undone.
            </p>
            <div className="admin-review-modal-actions">
              <button
                className="admin-review-modal-btn cancel"
                onClick={() => setConfirmingClearAll(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="admin-review-modal-btn confirm danger"
                onClick={handleClearAll}
                disabled={deleting}
              >
                {deleting ? <FaSpinner className="spin" /> : <FaTrash />}
                <span>{deleting ? 'Clearing...' : 'Clear All'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviewsPage;
