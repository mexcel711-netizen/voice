import React, { useEffect } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useZara } from '../context/ZaraContext';
import { SkeletonCard } from '../components/ui/Primitives';

export function RequireOwnerUnlocked({ children }: { children: React.ReactNode }) {
  const { loading, supabaseConfigured, authAuthenticated, isOwner, isUnlocked, autostartUnlock } =
    useZara();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const autostart = searchParams.get('autostart') === '1';

  useEffect(() => {
    if (!supabaseConfigured && autostart && !isUnlocked) {
      autostartUnlock();
    }
  }, [supabaseConfigured, autostart, isUnlocked, autostartUnlock]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-container-lowest p-8 max-w-4xl mx-auto space-y-6">
        <SkeletonCard lines={4} />
        <SkeletonCard lines={3} />
      </div>
    );
  }

  if (supabaseConfigured && (!authAuthenticated || !isOwner)) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!isUnlocked && !(autostart && !supabaseConfigured)) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
