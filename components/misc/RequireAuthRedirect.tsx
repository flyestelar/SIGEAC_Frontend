'use client';

import { useAuth } from '@/contexts/AuthContext';
import { redirect, usePathname } from 'next/navigation';

export function useRequireAuthRedirect() {
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();

  if (!loading && !isAuthenticated) {
    redirect(`/login?from=${encodeURIComponent(pathname)}`);
  }

  return null;
}
