'use server';

import { cookies } from 'next/headers';

export async function createCookie(name: string, value: string) {
  const cookieStore = await cookies();
  cookieStore.set(name, value, {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function deleteCookie(name: string) {
  const cookieStore = await cookies();
  cookieStore.delete({
    name,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}
