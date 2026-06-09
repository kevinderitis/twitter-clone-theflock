import express from 'express';

export const createApp = () => {
  const app = express();

  app.use(express.json());

  app.get('/health', (_request, response) => {
    response.status(200).json({
      status: 'ok',
      service: 'api',
    });
  });

  return app;
};
