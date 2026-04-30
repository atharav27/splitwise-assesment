import AppRouter from './app/router';
import { AppProviders } from './app/providers';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <AppRouter />
        <Toaster position="top-right" />
      </AppProviders>
    </ErrorBoundary>
  );
}

export default App;
