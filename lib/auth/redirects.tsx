"use client";
import { redirect, RedirectType } from 'next/navigation';
import { useAuth } from './context';
import { isSafeRedirect } from './utils';

export function LoginRedirect({ from }: { from?: string }) {
  const { user, loading } = useAuth();

  if (user && !loading) {
    const target = from && isSafeRedirect(from) ? from : '/inicio';
    redirect(target, RedirectType.replace);
  }

  return null;
}
