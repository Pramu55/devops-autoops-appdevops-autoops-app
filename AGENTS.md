## Cursor Cloud specific instructions

This is a single-service Node.js Express app (port 3000). No databases, caches, or external services are required.

### Quick reference

| Action | Command |
|--------|---------|
| Install deps | `npm ci` |
| Run tests | `npm test` |
| Start app | `npm start` |
| Smoke test | `SMOKE_TEST_URL=http://127.0.0.1:3000 npm run smoke` |

- Tests use Node.js built-in test runner (`node:test`); no extra test framework is needed.
- The smoke test requires the app to already be running on port 3000.
- All endpoints (`/`, `/health`, `/ready`, `/metrics`) return immediately with no external dependencies.
- Docker, Jenkins, Kubernetes, and Helm configs in the repo are DevOps infrastructure tooling and are not required for local development or testing.
