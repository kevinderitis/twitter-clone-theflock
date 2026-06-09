import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';

import { AppError } from '../../lib/errors.js';
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

export const verifyAuthToken = (token: string) => {
  try {
    const payload = jwt.verify(token, getJwtSecret());

    if (
      typeof payload !== 'object' ||
      payload === null ||
      typeof payload.sub !== 'string'
    ) {
      throw new AppError(
        401,
        'INVALID_TOKEN',
        'Authentication token is invalid.',
      );
    }

    return {
      userId: payload.sub,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      401,
      'INVALID_TOKEN',
      'Authentication token is invalid.',
    );
  }
};
