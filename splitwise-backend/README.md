# Splitwise Backend

Backend API for the Splitwise assessment project.

## Tech Stack

- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- Zod validation
- JWT authentication
- Pino logging

## Prerequisites

- Node.js 18+ (recommended)
- npm 9+
- MongoDB instance (Atlas/local)

## Environment Variables

Create a `.env` file in `splitwise-backend`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=7d
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,https://your-frontend-domain.vercel.app
```

Notes:

- `CORS_ORIGIN` supports comma-separated origins.
- In production, set strong `JWT_SECRET` and real deployment origins.

## Install and Run

```bash
npm install
npm run dev
```

Backend default URL:

- `http://localhost:5000`

Health check:

- `GET /api/health`

## Available Scripts

- `npm run dev` - Run backend in development (tsx + nodemon)
- `npm run build` - Compile TypeScript to `dist`
- `npm run start` - Start production server from `dist/server.js`

## Build for Deployment

```bash
npm install
npm run build
npm run start
```

## API Base Path

All routes are mounted under:

- `/api`

Detailed endpoint list:

- See `API_ENDPOINTS.md`

Main modules:

- `/api/auth`
- `/api/users`
- `/api/groups`
- `/api/expenses`
- `/api/balances`
- `/api/settlements`
- `/api/activity`

## Expense Endpoints (important)

- `GET /api/expenses` (supports query `groupId`)
- `GET /api/expenses/group/:groupId` (assignment-compatibility route)

## Project Structure (Backend)

- `src/modules` - Feature modules (controller, service, repository, validator)
- `src/middlewares` - Auth, idempotency, error handling
- `src/config` - DB and swagger configuration
- `src/utils` - Shared helpers (logger, responses, AppError)
- `src/routes` - API route registration
