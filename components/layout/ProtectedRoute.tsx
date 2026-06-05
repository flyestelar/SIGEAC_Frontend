'use client';
import useAuthorize from '@/hooks/auth/useAuthorize';
import { ReactNode } from 'react';
import LoadingPage from '../misc/LoadingPage';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: string[];
  permissions?: string[];
  directPermissions?: string[];
}

const ProtectedRoute = ({ children, roles, permissions, directPermissions }: ProtectedRouteProps) => {
  const authorized = useAuthorize({ roles, permissions, directPermissions, redirect: true });

  if (authorized.loading) return <LoadingPage />;

  return <>{children}</>;
};

export default ProtectedRoute;
