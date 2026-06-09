import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '../../lib/api';
import { AuthContext, type AuthContextValue } from './auth-context';
import {
  getCurrentUserRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
} from './auth-api';
import {
  clearStoredAuthToken,
  getStoredAuthToken,
  setStoredAuthToken,
} from './auth-storage';
import type { AuthUser, LoginPayload, RegisterPayload } from './auth.types';

const AUTH_QUERY_KEY = ['auth', 'me'] as const;

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => getStoredAuthToken());

  const clearAuthState = useCallback(() => {
    clearStoredAuthToken();
    setToken(null);
    queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY });
  }, [queryClient]);

  const sessionQuery = useQuery({
    queryKey: [...AUTH_QUERY_KEY, token],
    queryFn: () => getCurrentUserRequest(token!),
    enabled: Boolean(token),
    staleTime: 30_000,
    retry: false,
  });

  useEffect(() => {
    if (
      sessionQuery.error instanceof ApiError &&
      sessionQuery.error.status === 401
    ) {
      clearAuthState();
    }
  }, [clearAuthState, sessionQuery.error]);

  const persistSession = useCallback(
    (nextToken: string, user: AuthUser) => {
      setStoredAuthToken(nextToken);
      setToken(nextToken);
      queryClient.setQueryData([...AUTH_QUERY_KEY, nextToken], { user });
    },
    [queryClient],
  );

  const login = useCallback(
    async (payload: LoginPayload) => {
      const response = await loginRequest(payload);
      persistSession(response.token, response.user);
    },
    [persistSession],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      await registerRequest(payload);
      await login({
        email: payload.email,
        password: payload.password,
      });
    },
    [login],
  );

  const logout = useCallback(async () => {
    const currentToken = token;

    try {
      if (currentToken) {
        await logoutRequest(currentToken);
      }
    } finally {
      clearAuthState();
    }
  }, [clearAuthState, token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      currentUser: sessionQuery.data?.user ?? null,
      isAuthenticated: Boolean(token && sessionQuery.data?.user),
      isLoadingSession: Boolean(token) && sessionQuery.isPending,
      login,
      register,
      logout,
    }),
    [
      login,
      logout,
      register,
      sessionQuery.data?.user,
      sessionQuery.isPending,
      token,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
