/**
 * ForgotPasswordForm Component
 * 
 * Provides password reset functionality via email.
 * Includes form validation and success/error handling.
 */

import { useState } from 'react';
import { useAuthContext } from '../../context/AuthContext';

const ForgotPasswordForm = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { resetPassword } = useAuthContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsSubmitting(true);

    const result = await resetPassword(email);
    
    if (result.success) {
      setSuccess(true);
      setIsSubmitting(false);
    } else {
      setError(result.error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-form">
      <div className="auth-header">
        <h1>Reset Password</h1>
        <p>Enter your email to receive a password reset link</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          Password reset email sent! Check your inbox for further instructions.
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form-content">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            disabled={isSubmitting || success}
          />
        </div>

        {!success && (
          <button
            type="submit"
            className="auth-button primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        )}

        {success && (
          <button
            type="button"
            className="auth-button primary"
            onClick={() => {
              setSuccess(false);
              setEmail('');
            }}
          >
            Send Another Link
          </button>
        )}
      </form>

      <div className="auth-footer">
        <button
          type="button"
          className="text-button back-button"
          onClick={onSwitchToLogin}
          disabled={isSubmitting}
        >
          ← Back to Sign In
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
