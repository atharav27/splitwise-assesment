import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../shared/LoadingSpinner';

const ProtectedRoute = () => {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
