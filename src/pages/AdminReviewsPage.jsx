import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { onReviewsChange, addPostedReview } from '../firebase/services/firestoreService';
import {
  FaStar,
  FaComments,
  FaClock,
  FaEnvelope,
  FaSpinner,
  FaEye,
  FaPaperPlane,
  FaCheck,
  FaTimes,
  FaSignOutAlt,
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

const AdminReviewsPage = () => {
  const { logout } = useAuthContext();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postingReview, setPostingReview] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);

  useEffect(() => {
    const unsubscribe = onReviewsChange((snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReviews(reviewsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getInitial = (name) => {
    if (!name) return 'P';
    return name.charAt(0).toUpperCase();
  };

  const handlePostClick = (review) => {
    setPostingReview(review);
    setShowConfirmModal(true);
    setPosted(false);
  };

  const handleConfirmPost = async () => {
    if (!postingReview) return;

    setPosting(true);
    try {
      await addPostedReview({
        displayName: postingReview.displayName,
        email: postingReview.email,
        review: postingReview.review,
        suggestion: postingReview.suggestion || '',
        originalReviewId: postingReview.id
      });
      setPosted(true);
      setTimeout(() => {
        setShowConfirmModal(false);
        setPostingReview(null);
        setPosted(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to post review:', error);
    }
    setPosting(false);
  };

  const handleCancelPost = () => {
    if (posting) return;
    setShowConfirmModal(false);
    setPostingReview(null);
    setPosted(false);
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-reviews-page">
      {/* Sticky Top Bar */}
      <nav className="admin-reviews-topbar">
        <div className="admin-reviews-topbar-left">
          <FaEye className="admin-reviews-topbar-icon" />
          <span className="admin-reviews-topbar-title">Player Reviews</span>
        </div>
        <button className="admin-reviews-topbar-logout" onClick={handleSignOut}>
          <FaSignOutAlt />
          <span>Sign Out</span>
        </button>
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
        </div>

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
                <div className="admin-review-card-actions">
                  <button
                    className="admin-review-post-btn"
                    onClick={() => handlePostClick(item)}
                  >
                    <FaPaperPlane />
                    Post to Homepage
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="admin-review-modal-overlay" onClick={handleCancelPost}>
          <div className="admin-review-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-review-modal-icon">
              {posted ? <FaCheck /> : <FaPaperPlane />}
            </div>
            <h3>{posted ? 'Review Posted!' : 'Post Review to Homepage?'}</h3>
            <p>
              {posted
                ? 'The review has been posted to the homepage.'
                : `Are you sure you want to post ${postingReview?.displayName}'s review to the homepage? It will be visible to all visitors.`}
            </p>
            {!posted && (
              <div className="admin-review-modal-actions">
                <button
                  className="admin-review-modal-btn confirm"
                  onClick={handleConfirmPost}
                  disabled={posting}
                >
                  {posting ? (
                    <>
                      <FaSpinner className="spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane />
                      Yes, Post It
                    </>
                  )}
                </button>
                <button
                  className="admin-review-modal-btn cancel"
                  onClick={handleCancelPost}
                  disabled={posting}
                >
                  <FaTimes />
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

export default AdminReviewsPage;
