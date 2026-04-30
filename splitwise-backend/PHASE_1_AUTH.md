# Phase 1 — Auth (Signup / Login)

## Goal
JWT-based stateless authentication. bcrypt password hashing. Auth middleware that protects all subsequent routes. Rate-limited login.

---

## Files to Create / Edit

```
src/modules/auth/
  auth.controller.js
  auth.service.js
  auth.repository.js
  auth.validator.js
src/modules/users/
  user.controller.js
  user.service.js
  user.repository.js
src/middlewares/auth.middleware.js   ← replace placeholder
src/routes/index.js                  ← uncomment auth + users routes
```

---

## Implementation

### `src/modules/auth/auth.validator.js`
```js
const { z } = require('zod');

const signupSchema = z.object({
  name:     z.string().trim().min(1, 'Name is required').max(100),
  email:    z.string().trim().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email:    z.string().trim().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

module.exports = { signupSchema, loginSchema };
```

---

### `src/modules/auth/auth.repository.js`
```js
const { User } = require('../../models');

const findByEmail = (email, withPassword = false) => {
  const query = User.findOne({ email, isActive: true });
  return withPassword ? query.select('+passwordHash') : query;
};

const createUser = (userData) => User.create(userData);

module.exports = { findByEmail, createUser };
```

---

### `src/modules/auth/auth.service.js`
```js
const bcrypt      = require('bcryptjs');
const jwt         = require('jsonwebtoken');
const AppError    = require('../../utils/AppError');
const authRepo    = require('./auth.repository');

const SALT_ROUNDS = 12;

// ─── Signup ────────────────────────────────────────────────────────────────
const signup = async ({ name, email, password }) => {
  const existing = await authRepo.findByEmail(email);
  if (existing) throw new AppError('Email already in use', 409);

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await authRepo.createUser({ name, email, passwordHash });

  const token = signToken(user._id, user.email);
  return { token, user: sanitizeUser(user) };
};

// ─── Login ─────────────────────────────────────────────────────────────────
const login = async ({ email, password }) => {
  // Always use the same generic error — don't reveal whether email exists
  const GENERIC_ERROR = new AppError('Invalid credentials', 401);

  const user = await authRepo.findByEmail(email, true); // include passwordHash
  if (!user) throw GENERIC_ERROR;

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw GENERIC_ERROR;

  const token = signToken(user._id, user.email);
  return { token, user: sanitizeUser(user) };
};

// ─── Helpers ───────────────────────────────────────────────────────────────
const signToken = (userId, email) =>
  jwt.sign({ userId, email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// Strip passwordHash from user object returned to client
const sanitizeUser = (user) => ({
  _id:       user._id,
  name:      user.name,
  email:     user.email,
  avatar:    user.avatar,
  createdAt: user.createdAt,
});

module.exports = { signup, login };
```

---

### `src/modules/auth/auth.controller.js`
```js
const express     = require('express');
const router      = express.Router();
const authService = require('./auth.service');
const { signupSchema, loginSchema } = require('./auth.validator');
const { success } = require('../../utils/apiResponse');
const { loginLimiter } = require('../../middlewares/rateLimiter.middleware');

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const body   = signupSchema.parse(req.body);  // throws ZodError → caught by error middleware
  const result = await authService.signup(body);
  success(res, result, 'Account created', 201);
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  const body   = loginSchema.parse(req.body);
  const result = await authService.login(body);
  success(res, result, 'Login successful');
});

module.exports = router;
```

---

### `src/middlewares/auth.middleware.js` ← replace placeholder
```js
const jwt      = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const { User } = require('../models');

const protect = async (req, res, next) => {
  // 1. Extract token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('No token provided', 401));
  }
  const token = authHeader.split(' ')[1];

  // 2. Verify token (throws JsonWebTokenError / TokenExpiredError — caught by error middleware)
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 3. Confirm user still exists and is active
  const user = await User.findById(decoded.userId).select('_id name email isActive');
  if (!user || !user.isActive) {
    return next(new AppError('User no longer exists', 401));
  }

  // 4. Attach to request
  req.user = { id: user._id.toString(), name: user.name, email: user.email };
  next();
};

module.exports = { protect };
```

---

### `src/modules/users/user.repository.js`
```js
const { User } = require('../../models');

const findAll = () =>
  User.find({ isActive: true }).select('_id name email avatar createdAt').sort({ name: 1 });

const findById = (id) =>
  User.findById(id).select('_id name email avatar createdAt');

module.exports = { findAll, findById };
```

---

### `src/modules/users/user.service.js`
```js
const userRepo = require('./user.repository');

const getAllUsers = () => userRepo.findAll();

const getUserById = (id) => userRepo.findById(id);

module.exports = { getAllUsers, getUserById };
```

---

### `src/modules/users/user.controller.js`
```js
const express      = require('express');
const router       = express.Router();
const userService  = require('./user.service');
const { protect }  = require('../../middlewares/auth.middleware');
const { success }  = require('../../utils/apiResponse');

// GET /api/users
router.get('/', protect, async (req, res) => {
  const users = await userService.getAllUsers();
  success(res, users, 'Users fetched');
});

module.exports = router;
```

---

### `src/routes/index.js` — update
```js
const express = require('express');
const router  = express.Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      uptime:    Math.floor(process.uptime()),
      dbStatus:  require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV,
    },
    message: 'Server is running',
  });
});

router.use('/auth',  require('../modules/auth/auth.controller'));
router.use('/users', require('../modules/users/user.controller'));

module.exports = router;
```

---

## Edge Cases Handled

| Scenario | Handling |
|----------|----------|
| Duplicate email on signup | `409 Conflict` — checked before insert |
| Wrong password | `401` with generic "Invalid credentials" — no email leak |
| Expired JWT | `TokenExpiredError` caught by error middleware → `401` |
| Malformed JWT | `JsonWebTokenError` caught by error middleware → `401` |
| Missing Authorization header | `401` in `protect` middleware |
| Deleted/inactive user with valid token | `401` — re-checks DB in middleware |
| Brute-force login | Rate-limited to 15 req/15min per IP |

---

## Phase 1 Checklist

- [ ] `POST /api/auth/signup` creates user, returns `{ token, user }` — no passwordHash in response
- [ ] `POST /api/auth/login` returns `{ token, user }` on valid credentials
- [ ] Signup with existing email → `409`
- [ ] Login with wrong password → `401` (generic message, not "email not found")
- [ ] `GET /api/users` with no/expired token → `401`
- [ ] `GET /api/users` with valid token → array of users, no passwordHash
- [ ] 16th login attempt within 15min → rate limit response
- [ ] Zod validation failure on signup → `400` with field-level errors
