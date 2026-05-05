# Splitwise Assessment (MERN)

A full-stack expense sharing application inspired by Splitwise, built for the level-wise MERN assessment.

## Live Links

- Frontend (Vercel): [https://splitwise-three-eta.vercel.app](https://splitwise-three-eta.vercel.app)
- Backend (Render): [https://splitwise-assesment.onrender.com](https://splitwise-assesment.onrender.com)
- Backend Health Check: [https://splitwise-assesment.onrender.com/api/health](https://splitwise-assesment.onrender.com/api/health)

## GitHub Repository

- Repository URL:(https://github.com/atharav27/splitwise-assesment.git)

## What This Project Solves

This app helps users and groups track shared expenses, calculate who owes whom, and settle dues with clear transaction history.

## How the Project Works (Logic)

1. A user creates an expense with payer, participants, and split type (`equal`, `unequal`, `percentage`).
2. Backend validates split rules and stores normalized split details.
3. Ledger/balance logic computes net relationships (who owes/gets paid).
4. Users can settle dues; settlements update balances and activity timeline.
5. Group and personal views filter data by authenticated user scope for privacy.

## Core Features

### Level 1 (Mandatory)

- Create/list/delete expenses
- Balance calculation (who owes whom)
- Basic dashboard and balances views

### Level 2 (Auth + Security)

- User signup/login with JWT
- Protected routes
- Login rate limiting
- Idempotency handling for expense creation

### Level 3 (Advanced)

- Group creation and membership management
- Group-scoped expenses and balances
- Multiple split types (`equal`, `unequal`, `percentage`)
- Settlement flows and optimized settlement plans
- Activity feed with enriched actor/group/target names

## Tech Stack

### Frontend

- React + Vite
- React Router
- React Query
- Axios
- Tailwind CSS
- Zod + React Hook Form

### Backend

- Node.js + Express + TypeScript
- MongoDB + Mongoose
- JWT auth + middleware guards
- Zod validation
- Pino logger

## API Overview

All backend endpoints are under `/api`.

- Auth: `/api/auth`
- Users: `/api/users`
- Groups: `/api/groups`
- Expenses: `/api/expenses`
- Balances: `/api/balances`
- Settlements: `/api/settlements`
- Activity: `/api/activity`

Expense-group compatibility route:

- `GET /api/expenses/group/:groupId`

## Settlement and Balance Scope Contract

- `All Balances` is the primary actionable settlement surface and represents pair-net across scopes.
- `By Group` is a group-scoped informational breakdown and is secondary context.
- Settlement actions should originate from `All Balances` entries where the current user is debtor.
- Group views can display scope-specific residuals even when overall pair-net is near zero.
- When settlement scope is ambiguous, the client must block action instead of defaulting to an incorrect scope.

## Local Setup

### 1) Backend

```bash
cd splitwise-backend
npm install
npm run dev
```

Set backend `.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_secret
JWT_EXPIRES_IN=7d
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### 2) Frontend

```bash
cd splitwise-frontend
npm install
npm run dev
```

Set frontend `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Build Commands

### Backend Build

```bash
cd splitwise-backend
npm run build
npm run start
```

### Frontend Build

```bash
cd splitwise-frontend
npm run build
```

## Notes

- Frontend and backend each contain their own dedicated README with module-level setup details.
- For submission, replace the GitHub repository placeholder with your actual repo link.
