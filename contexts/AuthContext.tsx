'use client';

import { AuthContext, useAuth } from '@/lib/auth/context';
import { logoutAction } from '@/lib/auth/login';
import { USER_QUERY_KEY, userQueryOptions } from '@/lib/auth/queries';
import { createCookie } from '@/lib/cookie';
import { createSession } from '@/lib/session';
import { useCompanyStore } from '@/stores/CompanyStore';
import { login, logout as logoutApi } from '@api/sdk';
import { LoginData } from '@api/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ReactNode, useCallback, useMemo } from 'react';
import { toast } from 'sonner';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const reset = useCompanyStore((state) => state.reset);
  const router = useRouter();

  const query = useQuery(userQueryOptions());
  const user = query.data ?? null;
  const isAuthenticated = !!query.data;

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData['body']) => {
      const { success, error } = await loginAction(credentials);
      if (!success) {
        console.error('Login error:', error);
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
      await Promise.all([logoutAction(), logoutApi()]);
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

const AUTH_TOKEN_COOKIE_NAME = 'auth_token';
export async function loginAction(credentials: LoginData['body']) {
  const { error, data, status } = await login({ body: credentials });
  console.log('Login response:', { data, error, status });
  if (status === 401) {
    return { success: false, error: 'Credenciales inválidas' };
  }

  if (error) {
    console.error('Error during login:', error, status);
    return { success: false, error: error.message, data: error };
  }

  const token = data.token;
  if (!token) return { success: false, error: 'No se recibió token de autenticación' };

  await createCookie(AUTH_TOKEN_COOKIE_NAME, token);
  await createSession(data.userId);

  return { success: true };
}

export { useAuth };
