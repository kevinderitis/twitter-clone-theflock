import express from 'express';

import { isAppError } from './lib/errors.js';
import { createAuthRouter } from './modules/auth/auth.router.js';
import { AuthService } from './modules/auth/auth.service.js';

type AppDependencies = {
  authService?: AuthService;
};

export const createApp = ({ authService }: AppDependencies = {}) => {
  const app = express();

  app.use(express.json());

  app.use('/auth', createAuthRouter({ authService }));

  app.get('/health', (_request, response) => {
    response.status(200).json({
      status: 'ok',
      service: 'api',
    });
  });

  app.use(
    (
      error: unknown,
      _request: express.Request,
      response: express.Response,
      next: express.NextFunction,
    ) => {
      void next;

      if (isAppError(error)) {
        response.status(error.statusCode).json({
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        });
        return;
      }

      console.error(error);

      response.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred.',
        },
      });
    },
  );

  return app;
};
