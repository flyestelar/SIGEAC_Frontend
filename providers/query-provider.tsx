'use client';

import { ReactNode, useMemo } from 'react';
import { QueryClient, QueryClientProvider as RQQueryClientProvider } from '@tanstack/react-query';

// This code is only for TypeScript
declare global {
  interface Window {
    __TANSTACK_QUERY_CLIENT__: import('@tanstack/react-query').QueryClient;
  }
}

interface Props {
  children: ReactNode;
}

const QueryClientProvider = ({ children }: Props) => {
  const queryClient = useMemo(() => new QueryClient(), []);

  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    window.__TANSTACK_QUERY_CLIENT__ = queryClient;
  }

  return <RQQueryClientProvider client={queryClient}>{children}</RQQueryClientProvider>;
};

export default QueryClientProvider;
