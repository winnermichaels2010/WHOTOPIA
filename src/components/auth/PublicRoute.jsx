import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../LoadingSpinner';

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuthContext();

  if (loading) {
    return <LoadingSpinner text="Authenticating..." />;
  }

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default PublicRoute;
