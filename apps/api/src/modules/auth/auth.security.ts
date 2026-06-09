import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';

import { getJwtExpiresIn, getJwtSecret } from '../../config/env.js';

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string) =>
  bcrypt.hash(password, SALT_ROUNDS);

export const verifyPassword = async (password: string, passwordHash: string) =>
  bcrypt.compare(password, passwordHash);

export const signAuthToken = (userId: string) =>
  jwt.sign({ sub: userId }, getJwtSecret(), {
    expiresIn: getJwtExpiresIn() as SignOptions['expiresIn'],
  });
