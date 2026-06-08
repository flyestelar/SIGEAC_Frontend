import { User } from '@/types';
import { LoginData } from '@api/types';
import { UseMutationResult } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  loginMutation: UseMutationResult<void, Error, LoginData['body'], unknown>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
