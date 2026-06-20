'use server';

import { createCookie, deleteCookie } from '@/lib/cookie';
import { createSession, deleteSession } from '@/lib/session';
import { login } from '@api/sdk';
import { LoginData } from '@api/types';

const AUTH_TOKEN_COOKIE_NAME = 'auth_token';


export async function logoutAction() {
  await Promise.all([deleteCookie(AUTH_TOKEN_COOKIE_NAME), deleteSession()]);
}
