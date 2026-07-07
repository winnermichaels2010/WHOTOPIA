/**
 * RegisterForm Component
 * 
 * Provides user registration with email/password and Google Sign-In.
 * Includes form validation and error handling.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { useAuthContext } from '../../context/AuthContext';

const RegisterForm = ({ onSwitchToLogin }) => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signUp, googleSignIn } = useAuthContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!displayName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (displayName.includes(' ')) {
      setError('Nick name must not contain spaces');
      return;
    }

    if (displayName.length > 10) {
      setError('Nick name must not exceed 10 characters');
      return;
    }

    if (!agreeTerms) {
      setError('You must agree to the Terms & Conditions');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    const result = await signUp(email, password, displayName);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!agreeTerms) {
      setError('You must agree to the Terms & Conditions');
      return;
    }
    setError('');
    setIsSubmitting(true);

    const result = await googleSignIn();
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-form">
      <div className="auth-header">
        <h1>Create Account</h1>
        <p>Join Whotopia and start playing</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form-content">
        <div className="form-group">
          <label htmlFor="displayName">Nick Name</label>
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value.replace(/\s/g, '').slice(0, 10))}
            placeholder="Nick name"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              disabled={isSubmitting}
            />
            <span className="checkbox-custom"></span>
            <span>
              I agree to the{' '}
              <button
                type="button"
                className="text-button"
                onClick={(e) => { e.preventDefault(); navigate('/terms'); }}
              >
                Terms & Conditions
              </button>
            </span>
          </label>
        </div>

        <button
          type="submit"
          className="auth-button primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating account...' : 'Create Account'}
        </button>

        <div className="divider">
          <span>or continue with</span>
        </div>

        <button
          type="button"
          className="auth-button google"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting || !agreeTerms}
        >
          <FcGoogle className="google-icon" />
          <span>Sign up with Google</span>
        </button>
      </form>

      <div className="auth-footer">
        <p>
          Already have an account?{' '}
          <button
            type="button"
            className="text-button"
            onClick={onSwitchToLogin}
            disabled={isSubmitting}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
