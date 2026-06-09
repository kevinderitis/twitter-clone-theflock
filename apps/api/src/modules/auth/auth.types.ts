export type AuthUserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  username: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicUser = Omit<AuthUserRecord, 'passwordHash'>;

export type RegisterInput = {
  email: string;
  password: string;
  username: string;
  name: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type CreateUserInput = Omit<
  AuthUserRecord,
  'id' | 'createdAt' | 'updatedAt'
>;

export interface AuthUserStore {
  findById(id: string): Promise<AuthUserRecord | null>;
  findByEmail(email: string): Promise<AuthUserRecord | null>;
  findByUsername(username: string): Promise<AuthUserRecord | null>;
  createUser(input: CreateUserInput): Promise<AuthUserRecord>;
}
