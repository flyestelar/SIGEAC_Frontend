'use client';

import { useEffect } from 'react';
import axiosInstance from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';

export const useHeartbeat = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      axiosInstance.post('/heartbeat').catch(() => {});
    }, 15_000);

    return () => clearInterval(interval);
  }, [user]);
};
