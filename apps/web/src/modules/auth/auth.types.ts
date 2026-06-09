export type AuthUser = {
  id: string;
  email: string;
  username: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  username: string;
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type RegisterResponse = {
  user: AuthUser;
};

export type CurrentUserResponse = {
  user: AuthUser;
};

export type LogoutResponse = {
  success: boolean;
};
