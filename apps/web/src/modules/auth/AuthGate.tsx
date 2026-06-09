import type { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from './use-auth';

const FullPageMessage = ({ message }: { message: string }) => (
  <div className="rounded-[2rem] border border-white/80 bg-white/90 p-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-700">
      Session
    </p>
    <p className="mt-4 text-base text-slate-600">{message}</p>
  </div>
);

export const ProtectedRoute = ({ children }: PropsWithChildren) => {
  const location = useLocation();
  const { token, isAuthenticated, isLoadingSession } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (isLoadingSession) {
    return <FullPageMessage message="Checking your session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export const PublicOnlyRoute = ({ children }: PropsWithChildren) => {
  const { token, isAuthenticated, isLoadingSession } = useAuth();

  if (token && isLoadingSession) {
    return <FullPageMessage message="Restoring your session..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};
