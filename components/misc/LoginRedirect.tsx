'use client';

import { useAuth } from '@/contexts/AuthContext';
import { redirect } from 'next/navigation';

interface LoginRedirectProps {
  redirectTo?: string;
}

export const LoginRedirect = ({ redirectTo }: LoginRedirectProps) => {
  const { isAuthenticated, loading } = useAuth();
  console.log('LoginRedirect - isAuthenticated:', isAuthenticated, 'loading:', loading);

  if (!loading && isAuthenticated) {
    redirect(redirectTo ?? '/inicio');
  }

  return null;
};
