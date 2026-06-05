import { useCompanyStore } from '@/stores/CompanyStore';
import { client } from '@api/client';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import { cache } from 'react';
import { toast } from 'sonner';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  headers: {
    skip_zrok_interstitial: true,
  },
});

client.setConfig({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  headers: {
    skip_zrok_interstitial: true,
  },
  axios: axiosInstance,
});

export const getAuthToken = cache(async () => {
  if (typeof window === 'undefined') {
    const { cookies } = await import('next/headers');
    return cookies().then((c) => c.get('auth_token')?.value.replace('Bearer ', ''));
  }
  return Cookies.get('auth_token')?.replace('Bearer ', '');
});

async function authInterceptor(config: InternalAxiosRequestConfig) {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}

function companyInterceptor(config: InternalAxiosRequestConfig) {
  const { selectedCompany } = useCompanyStore.getState();

  if (selectedCompany) {
    config.headers['x-company-id'] = selectedCompany.id;
  }

  return config;
}

axiosInstance.interceptors.request.use(authInterceptor);

if (typeof window !== 'undefined') {
  axiosInstance.interceptors.request.use(companyInterceptor);
}

export default axiosInstance;

export function axiosErrorToast({ title, defaultDescription }: { title?: string; defaultDescription?: string }) {
  return (error: AxiosError<{ message?: string }>) => {
    const message =
      error.response?.data?.message ||
      defaultDescription ||
      'Ha ocurrido un error inesperado. Intente nuevamente más tarde.';
    toast.error(title ?? 'Ha ocurrido un error', {
      description: message,
    });
  };
}
