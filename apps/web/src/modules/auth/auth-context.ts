import { createContext } from 'react';

import type { AuthUser, LoginPayload, RegisterPayload } from './auth.types';

export type AuthContextValue = {
  token: string | null;
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  isLoadingSession: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
