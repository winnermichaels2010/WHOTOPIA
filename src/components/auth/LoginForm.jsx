/**
 * LoginForm Component
 * 
 * Provides email/password login and Google Sign-In functionality.
 * Includes form validation and error handling.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { useAuthContext } from '../../context/AuthContext';

const LoginForm = ({ onSwitchToRegister, onSwitchToForgotPassword }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn, googleSignIn } = useAuthContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setIsSubmitting(false);
      return;
    }

    const result = await signIn(email, password);
    
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
        <h1>Welcome Back</h1>
        <p>Sign in to continue playing Whot</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
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

        <div className="form-options">
          <button
            type="button"
            className="text-button"
            onClick={onSwitchToForgotPassword}
            disabled={isSubmitting}
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          className="auth-button primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
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
          <span>Sign in with Google</span>
        </button>
      </form>

      <div className="auth-footer">
        <p>
          Don&apos;t have an account?{' '}
          <button
            type="button"
            className="text-button"
            onClick={onSwitchToRegister}
            disabled={isSubmitting}
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
