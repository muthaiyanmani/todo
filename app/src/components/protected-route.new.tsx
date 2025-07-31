import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth-store.new';
import { Spinner } from './ui/spinner';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const location = useLocation();

  // Still initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated, redirect to signin
  if (!isAuthenticated()) {
    return <Navigate to="/auth/signin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}