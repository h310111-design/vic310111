import { AuthProvider } from './AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import AppContent from './AppContent';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
