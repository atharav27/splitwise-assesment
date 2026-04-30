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

const parseCorsOrigins = (rawOrigins?: string) =>
  (rawOrigins || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const configuredCorsOrigins = parseCorsOrigins(process.env.CORS_ORIGIN);
const corsAllowlist =
  configuredCorsOrigins.length > 0 ? configuredCorsOrigins : process.env.NODE_ENV === 'development' ? ['http://localhost:5173'] : [];

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server and tools that don't send Origin.
      if (!origin) return callback(null, true);
      // If allowlist is empty, keep permissive behavior (same as previous fallback).
      if (corsAllowlist.length === 0) return callback(null, true);
      if (corsAllowlist.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
  })
);

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
