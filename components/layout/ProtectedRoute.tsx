'use client';
import { useAuth } from '@/contexts/AuthContext';
import { authorizeUser } from '@/lib/auth/authorization';
import { ReactNode } from 'react';
import LoadingPage from '../misc/LoadingPage';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: string[];
  permissions?: string[];
  directPermissions?: string[];
}

function ProtectedRoute({ children, ...authorizeOptions }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingPage />;

  authorizeUser({ ...authorizeOptions, user, redirect: true });

  return children;
}

export default ProtectedRoute;
