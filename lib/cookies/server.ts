import Cookies from 'js-cookie';
import { cache } from 'react';
import { AUTH_TOKEN_COOKIE, COMPANY_ID_COOKIE } from './constants';

export const getAuthToken = cache(async () => {
  if (typeof window === 'undefined') {
    const { cookies } = await import('next/headers');
    return cookies().then((c) => c.get(AUTH_TOKEN_COOKIE)?.value.replace('Bearer ', ''));
  }
  return Cookies.get(AUTH_TOKEN_COOKIE)?.replace('Bearer ', '');
});

export const getCompanyId = cache(async () => {
  if (typeof window === 'undefined') {
    const { cookies } = await import('next/headers');
    return cookies().then((c) => c.get(COMPANY_ID_COOKIE)?.value);
  }
  return Cookies.get(COMPANY_ID_COOKIE);
});
