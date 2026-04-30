# Splitwise Frontend

Frontend application for the Splitwise assessment project.

## Tech Stack

- React + Vite
- React Router
- React Query
- Axios
- Tailwind CSS
- Zod + React Hook Form

## Prerequisites

- Node.js 18+ (recommended)
- npm 9+

## Environment Variables

Create a `.env` file in `splitwise-frontend`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Notes:

- `VITE_API_BASE_URL` is the primary API variable.
- In development, if env is missing, app falls back to `http://localhost:5000/api`.
- In production, missing API base URL throws an explicit startup error.

## Install and Run

```bash
npm install
npm run dev
```

Frontend runs on Vite default:

- `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run preview` - Preview production build locally
- `npm run lint` - Run lint checks

## Build for Deployment

```bash
npm run build
```

Deploy the generated `dist` output using your hosting platform (for example Vercel/Netlify static hosting).

## Project Structure (Frontend)

- `src/app` - app-level router/providers
- `src/features` - feature modules (auth, expenses, groups, balances, settlements, activity)
- `src/components` - shared UI and form components
- `src/hooks` - API and state hooks
- `src/services` - API client and endpoint wrappers
- `src/schemas` - centralized Zod schemas
