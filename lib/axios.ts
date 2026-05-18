import { toast } from 'sonner';
import { useCompanyStore } from '@/stores/CompanyStore';
import { client } from '@api/client';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

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
  auth() {
    return getAuthToken();
  },
});

function getAuthToken() {
  return Cookies.get('auth_token')?.replace('Bearer ', '');
}

function authInterceptor(config: InternalAxiosRequestConfig) {
  const token = getAuthToken();
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
axiosInstance.interceptors.request.use(companyInterceptor);
client.instance.interceptors.request.use(companyInterceptor);

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
