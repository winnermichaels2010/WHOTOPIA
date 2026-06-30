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
      navigate('/home');
    } else {
      setError(result.error);
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsSubmitting(true);

    const result = await googleSignIn();
    
    if (result.success) {
      navigate('/home');
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
          <label htmlFor="displayName">Display Name</label>
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
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
          disabled={isSubmitting}
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
