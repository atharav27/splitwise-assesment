import app from './app';
import connectDB from './config/db';
import logger from './utils/logger';

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    logger.info({ port: PORT, env: process.env.NODE_ENV }, 'Server started');
  });
};

start();
