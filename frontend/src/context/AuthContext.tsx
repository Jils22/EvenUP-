import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types/api';
import { authApi } from '../api/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('evenup_auth_token'));
  const queryClient = useQueryClient();

  // Automatically fetch profile if we have a token
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['me'],
    queryFn: authApi.getMe,
    enabled: !!token,
    retry: false,
  });

  // Handle global unauthorized evictions globally catching axio interceptor events
  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null);
      queryClient.clear();
    };
    window.addEventListener('auth_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth_unauthorized', handleUnauthorized);
  }, [queryClient]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('evenup_auth_token', newToken);
    setToken(newToken);
    queryClient.setQueryData(['me'], newUser);
  };

  const logout = () => {
    localStorage.removeItem('evenup_auth_token');
    setToken(null);
    queryClient.clear();
  };

  // If we have a token but query is still fetching, we are technically loading auth state
  const isLoading = !!token && isUserLoading;

  return (
    <AuthContext.Provider value={{
      user: user || null,
      isLoading,
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
