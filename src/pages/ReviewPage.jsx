import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { addReview, hasUserReviewed } from '../firebase/services/firestoreService';
import {
  hasLocalReview,
  setReviewedUserId,
  dispatchReviewSubmitted,
} from '../utils/reviewStatus';
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
  const navigate = useNavigate();
  const redirectTimer = useRef(null);
  const [review, setReview] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [reviewStatus, setReviewStatus] = useState('checking');
  const [justSubmitted, setJustSubmitted] = useState(false);

  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const checkStatus = async () => {
      if (!user) {
        if (mounted) setReviewStatus('open');
        return;
      }
      if (hasLocalReview(user.uid)) {
        if (mounted) setReviewStatus('done');
        return;
      }
      try {
        const reviewed = await hasUserReviewed(user.uid);
        if (mounted) {
          setReviewStatus(reviewed ? 'done' : 'open');
          if (reviewed) {
            setReviewedUserId(user.uid);
            setJustSubmitted(false);
          }
        }
      } catch (err) {
        console.error('Failed to check review status:', err);
        if (mounted) setReviewStatus('open');
      }
    };
    checkStatus();
    return () => { mounted = false; };
  }, [user]);

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
      setReviewStatus('done');
      setJustSubmitted(true);
      setReviewedUserId(user.uid);
      dispatchReviewSubmitted();
      redirectTimer.current = setTimeout(() => navigate('/dashboard'), 3000);
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

      <section className="review-form-section">
        <div className="review-note">
          <FaStar className="review-note-icon" />
          <p>
            We value your reviews and suggestions. Please note that you can only review us once,
            so please tell us everything you need to tell us. Thanks.
          </p>
        </div>

        {reviewStatus === 'checking' ? (
          <div className="review-loading">
            <FaSpinner className="spin" />
            <span>Checking review status...</span>
          </div>
        ) : reviewStatus === 'done' ? (
          <div className="review-done-card">
            <div className="review-done-icon">
              <FaCheck />
            </div>
            <h2>Thank You for Your Review!</h2>
            <p>
              {justSubmitted
                ? 'Your feedback has been submitted. We truly appreciate your review and it will help us improve Whotopia.'
                : 'You have already submitted a review. We truly appreciate your feedback and it will help us improve Whotopia.'}
            </p>
            {justSubmitted && (
              <p className="review-done-redirect">Redirecting you to your dashboard...</p>
            )}
          </div>
        ) : (
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
                ) : (
                  <>
                    <FaPaperPlane />
                    Review
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </section>
    </div>
  );
};

export default ReviewPage;
