import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../shared/LoadingSpinner';

const GuestRoute = ({ children }) => {
  const { isAuthenticated, isInitializing } = useAuth();
  if (isInitializing) return <LoadingSpinner />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

export default GuestRoute;
