'use server';

import { createCookie, deleteCookie } from '@/lib/cookie';
import { createSession, deleteSession } from '@/lib/session';
import { login } from '@api/sdk';
import { LoginData } from '@api/types';
import { redirect, RedirectType } from 'next/navigation';
import { getCurrentUser } from './user';

const AUTH_TOKEN_COOKIE_NAME = 'auth_token';

export async function loginAction(credentials: LoginData['body']) {
  const { error, data, status } = await login({ body: credentials });

  if (status === 401) {
    return { success: false, error: 'Credenciales inválidas' };
  }

  if (error) {
    console.error('Error during login:', error);
    return { success: false, error: error.message };
  }

  const token = data.token;
  if (!token) return { success: false, error: 'No se recibió token de autenticación' };

  await createCookie(AUTH_TOKEN_COOKIE_NAME, token);
  await createSession(data.userId);

  return { success: true };
}

export async function logoutAction() {
  await deleteCookie(AUTH_TOKEN_COOKIE_NAME);
  await deleteSession();
}

function isSafeRedirect(path: string): boolean {
  // Only allow relative paths starting with /, reject protocol-relative // and external schemes
  return path.startsWith('/') && !path.startsWith('//');
}

export async function loginRedirect(from: string | undefined) {
  const user = await getCurrentUser();

  if (user) {
    const target = from && isSafeRedirect(from) ? from : '/inicio';
    redirect(target, RedirectType.replace);
  }
}
