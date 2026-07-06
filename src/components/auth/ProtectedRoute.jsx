import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuthContext();

  if (loading) {
    return <LoadingSpinner text="Authenticating..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
