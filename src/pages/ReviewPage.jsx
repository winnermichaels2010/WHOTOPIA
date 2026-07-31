import { useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { addReview } from '../firebase/services/firestoreService';
import {
  FaStar,
  FaPaperPlane,
  FaComments,
  FaCheck,
  FaSpinner,
  FaExclamationCircle,
} from 'react-icons/fa';
import './ReviewPage.css';

const ReviewPage = () => {
  const { user } = useAuthContext();
  const [review, setReview] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!review.trim()) return;

    setSubmitting(true);
    setSubmitError('');
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
      setSubmitError(error?.message || 'Failed to submit your review. Please try again.');
    }
    setSubmitting(false);
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
            {submitError && (
              <div className="review-error-banner">
                <FaExclamationCircle />
                <span>{submitError}</span>
              </div>
            )}
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
                  Review
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default ReviewPage;
