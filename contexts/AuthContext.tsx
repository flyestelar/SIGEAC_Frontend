'use client';

import { loginAction, logoutAction } from '@/lib/auth/login';
import { getCurrentUser } from '@/lib/auth/user';
import { useCompanyStore } from '@/stores/CompanyStore';
import { User } from '@/types';
import { LoginData } from '@api/types';
import { useMutation, UseMutationResult, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createContext, ReactNode, useCallback, useContext, useMemo } from 'react';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  loginMutation: UseMutationResult<void, Error, LoginData['body'], unknown>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_QUERY_KEY = ['user'] as const;

export function AuthProvider({ children, user: initialUser }: { children: ReactNode; user: User | null }) {
  const queryClient = useQueryClient();
  const reset = useCompanyStore((state) => state.reset);
  const router = useRouter();

  const query = useQuery({
    queryKey: USER_QUERY_KEY,
    queryFn: () => getCurrentUser(),
    initialData: initialUser,
    staleTime: Infinity,
  });
  const user = query.data;
  const isAuthenticated = !!query.data;

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData['body']) => {
      const { success, error } = await loginAction(credentials);
      if (!success) {
        throw new Error(error || 'Error desconocido al iniciar sesión');
      }
    },
    onSuccess: async () => {
      toast.success('¡Inicio correcto!', {
        description: 'Redirigiendo...',
        position: 'bottom-center',
      });
      // Después de login exitoso, hacemos fetch del usuario
      await query.refetch();
    },
    onError: (err) => {
      const errorMessage = err.message || 'Ocurrió un error inesperado';
      toast.error('Error al iniciar sesión', { description: errorMessage, position: 'bottom-center' });
    },
  });

  const error = query.error?.message || loginMutation.error?.message || null;
  const loading = query.isLoading;

  const logout = useCallback(async () => {
    try {
      await logoutAction();
      reset();
      queryClient.clear();
      queryClient.setQueryData(USER_QUERY_KEY, null);
      toast.success('Sesión cerrada correctamente', {
        position: 'bottom-center',
      });
      router.push('/login');
    } catch (err) {
      console.error('Error durante logout:', err);
      toast.error('Error al cerrar sesión', {
        description: 'Inténtalo de nuevo más tarde',
        position: 'bottom-center',
      });
    }
  }, [queryClient, reset, router]);

  const contextValue = useMemo(
    () => ({
      user,
      isAuthenticated,
      loading,
      error,
      loginMutation,
      logout,
    }),
    [user, isAuthenticated, loading, error, loginMutation, logout],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
