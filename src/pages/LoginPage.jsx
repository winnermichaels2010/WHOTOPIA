/**
 * LoginPage Component
 * 
 * Main login page that handles switching between login, register, and forgot password forms.
 */

import { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import '../components/auth/Auth.css';

const LoginPage = () => {
  const [currentForm, setCurrentForm] = useState('login'); // 'login', 'register', 'forgot'

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
    <div className="auth-page">
      <div className="auth-container">
        {renderForm()}
      </div>
    </div>
  );
};

export default LoginPage;
