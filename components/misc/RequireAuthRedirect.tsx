'use client';

import { useAuth } from '@/contexts/AuthContext';
import { redirect, usePathname } from 'next/navigation';

export function useRequireAuthRedirect() {
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();

  if (!loading && !isAuthenticated) {
    const target = `/login?from=${encodeURIComponent(pathname)}`;
    redirect(target);
  }

  return null;
}
