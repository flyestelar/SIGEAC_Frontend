'use server';

import { createCookie, deleteCookie } from '@/lib/cookie';
import { createSession, deleteSession } from '@/lib/session';
import { login } from '@api/sdk';
import { LoginData } from '@api/types';

const AUTH_TOKEN_COOKIE_NAME = 'auth_token';

export async function loginAction(credentials: LoginData['body']) {
  const { error, data, status } = await login({ body: credentials });

  if (status === 401) {
    return { success: false, error: 'Credenciales inválidas' };
  }

  if (error) {
    console.error('Error during login:', error, status);
    return { success: false, error: error.message, data: error };
  }

  const token = data.token;
  if (!token) return { success: false, error: 'No se recibió token de autenticación' };

  await createCookie(AUTH_TOKEN_COOKIE_NAME, token);
  await createSession(data.userId);

  return { success: true };
}

export async function logoutAction() {
  await Promise.all([deleteCookie(AUTH_TOKEN_COOKIE_NAME), deleteSession()]);
}
