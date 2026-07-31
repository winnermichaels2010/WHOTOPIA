import { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { addReview, onReviewsChange } from '../firebase/services/firestoreService';
import {
  FaStar,
  FaPaperPlane,
  FaComments,
  FaClock,
  FaCheck,
  FaSpinner,
} from 'react-icons/fa';
import './ReviewPage.css';

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

const ReviewPage = () => {
  const { user } = useAuthContext();
  const [review, setReview] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!review.trim()) return;

    setSubmitting(true);
    try {
      await addReview({
        userId: user.uid,
        displayName: user.displayName || 'Player',
        email: user.email || '',
        review: review.trim(),
        suggestion: suggestion.trim()
      });
      setSubmitted(true);
      setReview('');
      setSuggestion('');
      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
    setSubmitting(false);
  };

  const getInitial = (name) => {
    if (!name) return 'P';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="review-page">
      {/* Header */}
      <section className="review-hero">
        <div className="review-hero-bg">
          <div className="review-hero-orb review-hero-orb-1" />
          <div className="review-hero-orb review-hero-orb-2" />
        </div>
        <div className="review-hero-content">
          <div className="review-hero-icon">
            <FaStar />
          </div>
          <h1>Share Your Feedback</h1>
          <p>Help us improve Whotopia by sharing your thoughts and suggestions.</p>
        </div>
      </section>

      {/* Submit Form */}
      <section className="review-form-section">
        <div className="review-form-card">
          <div className="review-form-header">
            <FaComments className="review-form-icon" />
            <h2>Write a Review</h2>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="review-field">
              <label htmlFor="review-input">Your Review</label>
              <textarea
                id="review-input"
                className="review-textarea"
                placeholder="What do you think about Whotopia? Share your experience..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={4}
                required
              />
            </div>
            <div className="review-field">
              <label htmlFor="suggestion-input">Suggested Changes</label>
              <textarea
                id="suggestion-input"
                className="review-textarea"
                placeholder="Any changes or features you think would improve the project?"
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                rows={3}
              />
            </div>
            <button
              type="submit"
              className="review-submit-btn"
              disabled={!review.trim() || submitting}
            >
              {submitting ? (
                <>
                  <FaSpinner className="spin" />
                  Posting...
                </>
              ) : submitted ? (
                <>
                  <FaCheck />
                  Posted!
                </>
              ) : (
                <>
                  <FaPaperPlane />
                  Post Review
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* Reviews List */}
      <section className="review-list-section">
        <div className="review-list-header">
          <h2>All Reviews</h2>
          <span className="review-count-badge">{reviews.length}</span>
        </div>

        {loading ? (
          <div className="review-loading">
            <FaSpinner className="spin" />
            <span>Loading reviews...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="review-empty">
            <FaComments className="review-empty-icon" />
            <p>No reviews yet. Be the first to share your feedback!</p>
          </div>
        ) : (
          <div className="review-list">
            {reviews.map((item) => (
              <div key={item.id} className="review-card">
                <div className="review-card-header">
                  <div className="review-card-avatar">
                    <span>{getInitial(item.displayName)}</span>
                  </div>
                  <div className="review-card-meta">
                    <span className="review-card-name">{item.displayName}</span>
                    <span className="review-card-time">
                      <FaClock />
                      {formatReviewTime(item.timestamp)}
                    </span>
                  </div>
                </div>
                <div className="review-card-body">
                  <p className="review-card-text">{item.review}</p>
                  {item.suggestion && (
                    <div className="review-card-suggestion">
                      <span className="review-suggestion-label">Suggestion:</span>
                      <p>{item.suggestion}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ReviewPage;
