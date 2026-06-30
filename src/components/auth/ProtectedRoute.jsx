/**
 * ProtectedRoute Component
 * 
 * Protects routes that require authentication.
 * Redirects unauthenticated users to the login page.
 */

import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
