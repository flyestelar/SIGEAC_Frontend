import { useCompanyStore } from '@/stores/CompanyStore';
import axios from 'axios';
import Cookies from 'js-cookie';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  headers: {
    skip_zrok_interstitial: true,
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = Cookies.get('auth_token');
  if (token) {
    config.headers.Authorization = `${token}`;
  }

  const { selectedCompany } = useCompanyStore.getState();

  if (selectedCompany) {
    config.headers['x-sigeac-company-id'] = selectedCompany.id;
  }

  return config;
});

export default axiosInstance;
