import 'express-async-errors';
import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import type { NextFunction, Request, Response } from 'express';

import { swaggerSpec } from './config/swagger';
import errorMiddleware from './middlewares/error.middleware';
import routes from './routes/index';
import logger from './utils/logger';

const app = express();
export const SWAGGER_PATH = '/api-docs';

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

app.use(pinoHttp({ logger }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);
app.use(
  SWAGGER_PATH,
  (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Content-Security-Policy', '');
    next();
  },
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

app.use((req, res) => {
  res.status(404).json({ success: false, data: null, message: `Route ${req.method} ${req.url} not found` });
});

app.use(errorMiddleware);

export default app;
