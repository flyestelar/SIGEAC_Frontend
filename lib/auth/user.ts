import { User } from '@/types';
import { user } from '@api/sdk';
import { cache } from 'react';
import axiosInstance, { getAuthToken } from '../axios';

export const getCurrentUser = cache(async (): Promise<User | null> => {
  if (!(await getAuthToken())) {
    return null;
  }

  const response = await user({ axios: axiosInstance, throwOnError: true });

  if (response.status === 401) {
    return null;
  }

  const data: any = response.data;

  if (response.status !== 200) {
    throw new Error(data?.message || 'Error al obtener el usuario actual');
  }

  return data;
});
