const bearerAuthSecurity = [{ BearerAuth: [] }];

const objectIdParam = {
  in: 'path',
  required: true,
  schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
};

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Splitwise Backend API',
    version: '1.0.0',
    description: 'Module-wise API documentation for auth, users, groups, expenses, balances, settlements, and activity.',
  },
  servers: [{ url: '/api', description: 'API base path' }],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Users' },
    { name: 'Groups' },
    { name: 'Expenses' },
    { name: 'Balances' },
    { name: 'Settlements' },
    { name: 'Activity' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ApiError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          data: { nullable: true, example: null },
          message: { type: 'string', example: 'Validation failed' },
        },
      },
      UserRef: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          avatar: { type: 'string', nullable: true },
        },
      },
      GroupRef: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          currency: { type: 'string' },
          members: { type: 'array', items: { $ref: '#/components/schemas/UserRef' } },
          createdBy: { $ref: '#/components/schemas/UserRef' },
        },
      },
      SplitDetail: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          amount: { type: 'number' },
          percentage: { type: 'number' },
        },
        required: ['userId'],
      },
      ExpenseRef: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          description: { type: 'string' },
          amount: { type: 'number' },
          currency: { type: 'string' },
          paidBy: { $ref: '#/components/schemas/UserRef' },
          groupId: { type: 'string', nullable: true },
          category: { type: 'string' },
          splitType: { type: 'string', enum: ['equal', 'unequal', 'percentage'] },
          splitDetails: { type: 'array', items: { $ref: '#/components/schemas/SplitDetail' } },
          history: { type: 'array', items: { type: 'object' } },
        },
      },
      BalanceBreakdownLine: {
        type: 'object',
        properties: {
          groupId: { type: 'string', nullable: true },
          amount: { type: 'number' },
          direction: { type: 'string', enum: ['owe', 'owed'] },
        },
      },
      BalanceEntry: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/UserRef' },
          netAmount: { type: 'number', description: 'Absolute net balance with this counterparty' },
          amount: {
            type: 'number',
            description: 'Same as netAmount; included for backward compatibility with clients expecting `amount`',
          },
          direction: { type: 'string', enum: ['owe', 'owed'] },
          breakdown: { type: 'array', items: { $ref: '#/components/schemas/BalanceBreakdownLine' } },
        },
      },
      SettlementRef: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          fromUser: { $ref: '#/components/schemas/UserRef' },
          toUser: { $ref: '#/components/schemas/UserRef' },
          amount: { type: 'number' },
          groupId: { type: 'string', nullable: true },
          note: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      OptimizedSettlementTx: {
        type: 'object',
        properties: {
          from: { $ref: '#/components/schemas/UserRef' },
          to: { $ref: '#/components/schemas/UserRef' },
          amount: { type: 'number' },
        },
      },
      OptimizedSettlementResponse: {
        type: 'object',
        properties: {
          transactions: {
            type: 'array',
            items: { $ref: '#/components/schemas/OptimizedSettlementTx' },
          },
          count: { type: 'integer' },
        },
      },
      ActivityRef: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          userId: { type: 'string' },
          action: { type: 'string' },
          entityType: { type: 'string' },
          entityId: { type: 'string' },
          groupId: { type: 'string', nullable: true },
          metadata: { type: 'object' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Unauthorized',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
      },
      NotFound: {
        description: 'Not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          200: {
            description: 'Server health',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        uptime: { type: 'number' },
                        dbStatus: { type: 'string' },
                        environment: { type: 'string' },
                      },
                    },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Create account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Account created' } },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: { email: { type: 'string' }, password: { type: 'string' } },
              },
            },
          },
        },
        responses: { 200: { description: 'Login successful' } },
      },
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List users',
        security: bearerAuthSecurity,
        responses: { 200: { description: 'Users fetched' }, 401: { $ref: '#/components/responses/Unauthorized' } },
      },
    },
    '/groups': {
      get: {
        tags: ['Groups'],
        summary: 'List my groups',
        security: bearerAuthSecurity,
        responses: { 200: { description: 'Groups fetched' } },
      },
      post: {
        tags: ['Groups'],
        summary: 'Create group',
        security: bearerAuthSecurity,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  members: { type: 'array', items: { type: 'string' } },
                  currency: { type: 'string', default: 'INR' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Group created' } },
      },
    },
    '/groups/{id}': {
      get: {
        tags: ['Groups'],
        summary: 'Get group by id',
        security: bearerAuthSecurity,
        parameters: [{ name: 'id', ...objectIdParam }],
        responses: { 200: { description: 'Group fetched' }, 404: { $ref: '#/components/responses/NotFound' } },
      },
      delete: {
        tags: ['Groups'],
        summary: 'Delete group',
        security: bearerAuthSecurity,
        parameters: [{ name: 'id', ...objectIdParam }],
        responses: { 200: { description: 'Group deleted' } },
      },
    },
    '/groups/{id}/members': {
      post: {
        tags: ['Groups'],
        summary: 'Add member',
        security: bearerAuthSecurity,
        parameters: [{ name: 'id', ...objectIdParam }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['userId'], properties: { userId: { type: 'string' } } },
            },
          },
        },
        responses: { 200: { description: 'Member added' } },
      },
    },
    '/groups/{id}/members/{userId}': {
      delete: {
        tags: ['Groups'],
        summary: 'Remove member',
        security: bearerAuthSecurity,
        parameters: [{ name: 'id', ...objectIdParam }, { name: 'userId', ...objectIdParam }],
        responses: { 200: { description: 'Member removed' } },
      },
    },
    '/expenses': {
      get: {
        tags: ['Expenses'],
        summary: 'List expenses',
        security: bearerAuthSecurity,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'groupId', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Expenses fetched' } },
      },
      post: {
        tags: ['Expenses'],
        summary: 'Create expense',
        security: bearerAuthSecurity,
        parameters: [{ name: 'Idempotency-Key', in: 'header', schema: { type: 'string' }, required: false }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['description', 'amount', 'paidBy', 'splitType', 'splitDetails'],
                properties: {
                  description: { type: 'string' },
                  amount: { type: 'number' },
                  currency: { type: 'string', default: 'INR' },
                  paidBy: { type: 'string' },
                  groupId: { type: 'string', nullable: true },
                  category: { type: 'string', enum: ['food', 'travel', 'utilities', 'entertainment', 'other'] },
                  splitType: { type: 'string', enum: ['equal', 'unequal', 'percentage'] },
                  splitDetails: { type: 'array', items: { $ref: '#/components/schemas/SplitDetail' } },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Expense created' } },
      },
    },
    '/expenses/{id}': {
      get: {
        tags: ['Expenses'],
        summary: 'Get expense by id',
        security: bearerAuthSecurity,
        parameters: [{ name: 'id', ...objectIdParam }],
        responses: { 200: { description: 'Expense fetched' } },
      },
      put: {
        tags: ['Expenses'],
        summary: 'Update expense',
        security: bearerAuthSecurity,
        parameters: [{ name: 'id', ...objectIdParam }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } },
        },
        responses: { 200: { description: 'Expense updated' } },
      },
      delete: {
        tags: ['Expenses'],
        summary: 'Delete expense',
        security: bearerAuthSecurity,
        parameters: [{ name: 'id', ...objectIdParam }],
        responses: { 200: { description: 'Expense deleted' } },
      },
    },
    '/expenses/{id}/history': {
      get: {
        tags: ['Expenses'],
        summary: 'Get expense history',
        security: bearerAuthSecurity,
        parameters: [{ name: 'id', ...objectIdParam }],
        responses: { 200: { description: 'Expense history fetched' } },
      },
    },
    '/balances': {
      get: {
        tags: ['Balances'],
        summary: 'Get global balances',
        description:
          'Returns one row per counterparty: `user`, `netAmount`, `amount` (alias of `netAmount`), `direction`, and `breakdown` by group.',
        security: bearerAuthSecurity,
        responses: {
          200: {
            description: 'List of balance rows for the authenticated user',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/BalanceEntry' },
                    },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/balances/group/{id}': {
      get: {
        tags: ['Balances'],
        summary: 'Get group balances',
        security: bearerAuthSecurity,
        parameters: [{ name: 'id', ...objectIdParam }],
        responses: { 200: { description: 'Group balances fetched' } },
      },
    },
    '/settlements/pay': {
      post: {
        tags: ['Settlements'],
        summary: 'Record settlement payment',
        security: bearerAuthSecurity,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fromUser', 'toUser', 'amount'],
                properties: {
                  fromUser: { type: 'string' },
                  toUser: { type: 'string' },
                  amount: { type: 'number' },
                  groupId: { type: 'string', nullable: true },
                  overall: { type: 'boolean', default: false },
                  note: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Settlement recorded' } },
      },
    },
    '/settlements': {
      get: {
        tags: ['Settlements'],
        summary: 'List my settlements',
        security: bearerAuthSecurity,
        parameters: [
          { name: 'cursor', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Settlements fetched' } },
      },
    },
    '/settlements/group/{id}': {
      get: {
        tags: ['Settlements'],
        summary: 'List group settlements',
        security: bearerAuthSecurity,
        parameters: [
          { name: 'id', ...objectIdParam },
          { name: 'cursor', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Group settlements fetched' } },
      },
    },
    '/settlements/optimize/group/{id}': {
      get: {
        tags: ['Settlements'],
        summary: 'Optimize group settlements',
        security: bearerAuthSecurity,
        parameters: [{ name: 'id', ...objectIdParam }],
        responses: {
          200: {
            description: 'Optimized settlements computed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/OptimizedSettlementResponse' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/activity': {
      get: {
        tags: ['Activity'],
        summary: 'My activity feed',
        security: bearerAuthSecurity,
        parameters: [
          { name: 'cursor', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Activity fetched' } },
      },
    },
    '/activity/group/{id}': {
      get: {
        tags: ['Activity'],
        summary: 'Group activity feed',
        security: bearerAuthSecurity,
        parameters: [
          { name: 'id', ...objectIdParam },
          { name: 'cursor', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Group activity fetched' } },
      },
    },
  },
} as const;

