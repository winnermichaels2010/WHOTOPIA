import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import { FaDice, FaMoon, FaSun, FaArrowLeft } from 'react-icons/fa';
import '../components/auth/Auth.css';

const LoginPage = () => {
  const [currentForm, setCurrentForm] = useState('login');
  const [animate, setAnimate] = useState(false);
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    setAnimate(true);
  }, []);

  const renderForm = () => {
    switch (currentForm) {
      case 'login':
        return (
          <LoginForm
            onSwitchToRegister={() => setCurrentForm('register')}
            onSwitchToForgotPassword={() => setCurrentForm('forgot')}
          />
        );
      case 'register':
        return (
          <RegisterForm
            onSwitchToLogin={() => setCurrentForm('login')}
          />
        );
      case 'forgot':
        return (
          <ForgotPasswordForm
            onSwitchToLogin={() => setCurrentForm('login')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`auth-page ${animate ? 'animate' : ''}`}>
      {/* Background decoration */}
      <div className="auth-bg-decor">
        <div className="bg-circle bg-circle-1"></div>
        <div className="bg-circle bg-circle-2"></div>
        <div className="bg-circle bg-circle-3"></div>
      </div>

      {/* Top bar */}
      <div className="auth-top-bar">
        <button className="auth-back-home" onClick={() => navigate('/')}>
          <FaArrowLeft /> Back to Home
        </button>
        <button className="auth-theme-toggle" onClick={toggleTheme}>
          {isDark ? <FaSun /> : <FaMoon />}
        </button>
      </div>

      <div className="auth-wrapper">
        {/* Brand side */}
        <div className="auth-brand">
          <div className="auth-brand-content">
            <div className="auth-brand-icon">
              <FaDice />
            </div>
            <h1 className="auth-brand-title">Whotopia</h1>
            <p className="auth-brand-subtitle">
              The classic Nigerian card game, reimagined for the digital age.
            </p>
            <div className="auth-brand-features">
              <div className="brand-feature">
                <span className="feature-dot"></span>
                Play with friends online
              </div>
              <div className="brand-feature">
                <span className="feature-dot"></span>
                Compete on leaderboards
              </div>
              <div className="brand-feature">
                <span className="feature-dot"></span>
                Real-time multiplayer
              </div>
            </div>
          </div>
        </div>

        {/* Form side */}
        <div className="auth-form-side">
          <div className="auth-form-container">
            {renderForm()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;