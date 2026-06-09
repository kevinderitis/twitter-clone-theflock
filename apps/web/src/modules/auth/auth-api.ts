import { apiRequest } from '../../lib/api';
import type {
  CurrentUserResponse,
  LoginPayload,
  LoginResponse,
  LogoutResponse,
  RegisterPayload,
  RegisterResponse,
} from './auth.types';

export const loginRequest = (payload: LoginPayload) =>
  apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: payload,
  });

export const registerRequest = (payload: RegisterPayload) =>
  apiRequest<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: payload,
  });

export const getCurrentUserRequest = (token: string) =>
  apiRequest<CurrentUserResponse>('/auth/me', {
    token,
  });

export const logoutRequest = (token: string) =>
  apiRequest<LogoutResponse>('/auth/logout', {
    method: 'POST',
    token,
  });
