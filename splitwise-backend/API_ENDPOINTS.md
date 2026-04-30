# Splitwise Backend API Endpoint List

Base URL:

- Local: `http://localhost:5000`
- API Prefix: `/api`

Authentication:

- Protected endpoints require `Authorization: Bearer <JWT_TOKEN>`.

## Health

- `GET /api/health` - Service health, uptime, DB status, environment.

## Auth

- `POST /api/auth/signup` - Register a new user.
- `POST /api/auth/login` - Login user and return JWT.

## Users

- `GET /api/users` - Get users list for participant selection. (`Protected`)

## Groups

- `POST /api/groups` - Create group. (`Protected`)
- `GET /api/groups` - Get current user's groups. (`Protected`)
- `GET /api/groups/:id` - Get group details by ID. (`Protected`)
- `POST /api/groups/:id/members` - Add member to group. (`Protected`)
- `DELETE /api/groups/:id/members/:userId` - Remove member from group. (`Protected`)
- `DELETE /api/groups/:id` - Delete group. (`Protected`)

## Expenses

- `POST /api/expenses` - Create expense. (`Protected`, idempotency-enabled)
- `GET /api/expenses` - Get paginated expenses (supports `groupId`, `category`, `page`, `limit`). (`Protected`)
- `GET /api/expenses/group/:groupId` - Get paginated expenses for a specific group (assignment compatibility route). (`Protected`)
- `GET /api/expenses/:id` - Get single expense details. (`Protected`)
- `GET /api/expenses/:id/history` - Get expense history/audit trail. (`Protected`)
- `PUT /api/expenses/:id` - Update expense. (`Protected`)
- `DELETE /api/expenses/:id` - Delete expense. (`Protected`)

## Balances

- `GET /api/balances` - Get global balances for current user. (`Protected`)
- `GET /api/balances/group/:id` - Get balances scoped to one group. (`Protected`)

## Settlements

- `POST /api/settlements/pay` - Record a settlement payment. (`Protected`)
- `GET /api/settlements` - Get paginated settlement history for current user. (`Protected`)
- `GET /api/settlements/group/:id` - Get paginated settlement history for group. (`Protected`)
- `GET /api/settlements/optimize/group/:id` - Get optimized settlement plan for group. (`Protected`)

## Activity

- `GET /api/activity` - Get paginated personal activity feed (`cursor`, `limit`). (`Protected`)
- `GET /api/activity/group/:id` - Get paginated group activity feed (`cursor`, `limit`). (`Protected`)

## Docs / Swagger

- Swagger UI path: `/api-docs`
