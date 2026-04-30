import app, { SWAGGER_PATH } from './app';
import connectDB from './config/db';
import logger from './utils/logger';

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    const host = process.env.HOST || 'localhost';
    const swaggerUrl = `http://${host}:${PORT}${SWAGGER_PATH}`;
    logger.info({ port: PORT, env: process.env.NODE_ENV, swaggerUrl }, 'Server started');
  });
};

start();
