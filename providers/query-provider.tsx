'use client';

import { ReactNode, useMemo } from 'react';
import { QueryClient, QueryClientProvider as RQQueryClientProvider } from '@tanstack/react-query';

interface Props {
  children: ReactNode;
}

const QueryClientProvider = ({ children }: Props) => {
  const queryClient = useMemo(() => new QueryClient(), []);
  return <RQQueryClientProvider client={queryClient}>{children}</RQQueryClientProvider>;
};

export default QueryClientProvider;
