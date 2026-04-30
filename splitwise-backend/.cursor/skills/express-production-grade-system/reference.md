# Express Production Reference

## Suggested Folder Blueprint

```txt
src/
  app.ts
  server.ts
  config/
  routes/
  controllers/
  services/
  repositories/
  middleware/
  schemas/
  utils/
  tests/
```

## Error Envelope Example

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "requestId": "b4a1..."
  }
}
```

## Readiness Checklist

### Runtime

- [ ] Node LTS pinned in runtime
- [ ] `NODE_ENV=production` in prod
- [ ] Startup fails on invalid config
- [ ] Graceful shutdown tested

### Security

- [ ] Helmet configured
- [ ] CORS restricted
- [ ] Rate limits configured
- [ ] Body limits configured
- [ ] AuthN/AuthZ tests present

### Observability

- [ ] Correlation id in logs
- [ ] Error logs include stack in non-prod only
- [ ] Health and readiness endpoints present
- [ ] Alerts defined for key failure modes

### Data And Integrations

- [ ] DB queries are indexed and bounded
- [ ] External calls have timeout/retry policies
- [ ] Idempotency strategy documented for unsafe retries

### CI/CD

- [ ] Lint/typecheck/test/build in pipeline
- [ ] Vulnerability scan enabled
- [ ] Rollback path documented
