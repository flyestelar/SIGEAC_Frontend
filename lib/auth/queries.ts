import { queryOptions } from '@tanstack/react-query';
import { getCurrentUser } from './user';

export const USER_QUERY_KEY = ['user'] as const;

export const userQueryOptions = () =>
  queryOptions({
    queryKey: USER_QUERY_KEY,
    queryFn: () => getCurrentUser(),
    staleTime: Infinity,
    gcTime: Infinity,
  });
