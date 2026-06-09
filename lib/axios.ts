import { client } from '@api/client';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { getAuthToken, getCompanyId } from '@/lib/cookies/server';

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

async function authInterceptor(config: InternalAxiosRequestConfig) {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}

async function companyInterceptor(config: InternalAxiosRequestConfig) {
  const companyId = await getCompanyId();

  if (companyId) {
    config.headers['x-company-id'] = companyId;
  }

  return config;
}

axiosInstance.interceptors.request.use(authInterceptor);
axiosInstance.interceptors.request.use(companyInterceptor);

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
