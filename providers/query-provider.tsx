'use client';
import { getQueryClient } from '@/lib/query-client';
import { QueryClientProvider as RQQueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const QueryClientProvider = ({ children }: Props) => {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient();

  return <RQQueryClientProvider client={queryClient}>{children}</RQQueryClientProvider>;
};

export default QueryClientProvider;
