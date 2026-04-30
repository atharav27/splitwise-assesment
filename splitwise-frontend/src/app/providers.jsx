import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';

const queryClient = new QueryClient();

export const AppProviders = ({ children }) => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  </AuthProvider>
);
