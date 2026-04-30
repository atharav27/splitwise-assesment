---
name: express-production-grade-system
description: Build and harden production-grade Express.js services with pragmatic architecture, security, validation, observability, reliability, testing, and delivery checklists. Use when creating or refactoring Express backends, designing APIs, or preparing for production deployment.
---

# Express Production Grade System

## When To Use

Use this skill when the user asks for:

- production-ready Express.js setup
- scalable backend architecture
- security hardening or reliability improvements
- API design, validation, error handling, or observability
- deployment readiness checks

## Outcome Targets

Deliver these outcomes by default:

1. Predictable architecture and module boundaries
2. Secure-by-default request handling
3. Typed input/output contracts and validation
4. Consistent error model and logging
5. Health checks, metrics, and traceability
6. Test coverage for critical behavior
7. Deployment and runtime guardrails

## Implementation Workflow

Copy this checklist and mark progress:

```md
Production Express Task Progress:
- [ ] Step 1: Confirm requirements and NFRs
- [ ] Step 2: Establish architecture and conventions
- [ ] Step 3: Implement security and validation baseline
- [ ] Step 4: Add observability and reliability controls
- [ ] Step 5: Add test coverage and run checks
- [ ] Step 6: Produce deployment readiness summary
```

### Step 1: Confirm Requirements And NFRs

Capture:

- primary business flow
- expected traffic profile (RPS, peak patterns)
- SLO/SLA targets (latency, availability)
- security constraints (auth model, data classification)
- operational constraints (cloud/runtime, region, budget)

If information is missing, ask concise clarifying questions before coding.

### Step 2: Architecture And Conventions

Prefer a feature-oriented structure with explicit layers:

- `routes/` for transport concerns
- `controllers/` for request orchestration
- `services/` for business logic
- `repositories/` for persistence access
- `middleware/` for cross-cutting concerns
- `schemas/` for request/response validation
- `config/` for typed environment config

Rules:

- keep controllers thin
- keep business logic out of route files
- avoid direct DB calls from controllers
- keep side effects explicit and testable

### Step 3: Security And Validation Baseline

Apply this baseline in most APIs:

- `helmet` with appropriate CSP/referrer policy
- CORS allowlist by environment
- request body size limits
- rate limiting on sensitive/public endpoints
- strict input validation at boundaries (zod/joi/class-validator)
- centralized auth and authorization middleware
- safe secrets handling from environment/config provider
- dependency and lockfile hygiene

Never trust request input. Validate params, query, body, and headers where needed.

### Step 4: Observability And Reliability

Default production controls:

- structured JSON logging with request correlation id
- request/response timing logs at middleware level
- standardized error envelope and error codes
- `/health` and `/ready` endpoints
- graceful shutdown on `SIGTERM` and `SIGINT`
- timeout and retry policies for downstream calls
- idempotency for retry-prone write operations (when applicable)

### Step 5: Testing And Quality Gates

Minimum recommended coverage:

- unit tests for service logic and validators
- integration tests for key endpoints and error paths
- regression tests for auth and permission boundaries

Before finalizing, run project checks (adapt to repo tooling):

- lint
- typecheck
- test
- build

### Step 6: Deployment Readiness Summary

Return a concise readiness report:

- what changed
- risks and assumptions
- remaining gaps (if any)
- explicit next actions

## Express Defaults Template

Use these defaults unless repo conventions differ:

- `Node.js`: active LTS
- `TypeScript`: strict mode enabled
- `Error handling`: centralized error middleware
- `Validation`: schema-first on all external inputs
- `Logging`: JSON logs with correlation id
- `Config`: typed env parser with fail-fast startup
- `Auth`: stateless token or session strategy per product needs
- `Docs`: OpenAPI for external APIs

## API Contract Guidance

For each endpoint:

1. Define input schema
2. Define success and error response schema
3. Map domain errors to stable HTTP status and error code
4. Keep error payload machine-readable and user-safe

Prefer consistent envelope patterns across all endpoints.

## Security Review Quick List

- [ ] Auth required where expected
- [ ] Authorization enforced server-side
- [ ] Input validation and sanitization complete
- [ ] Rate limits applied to abuse-prone endpoints
- [ ] Sensitive data never logged
- [ ] Secrets not hardcoded
- [ ] Error responses do not leak internals
- [ ] Third-party calls have timeout/retry/circuit behavior

## Production PR Acceptance Criteria

- [ ] Architecture follows project conventions
- [ ] New endpoints include validation and tests
- [ ] Logs and errors are structured and consistent
- [ ] Health/readiness behavior is correct
- [ ] No blocking TODOs for security/reliability

## Response Style For This Skill

When applying this skill:

- lead with highest-risk issues first
- provide concrete file-level changes
- avoid generic theory unless requested
- include a short verification plan

## Additional Resources

- Detailed implementation checklist: [reference.md](reference.md)
