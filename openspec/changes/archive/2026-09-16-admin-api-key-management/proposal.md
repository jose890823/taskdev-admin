# Proposal: Admin API-Key Management

## Intent

Give authenticated Admin users a safe UI for managing project-bound API keys without exposing secrets in metadata or changing JWT authentication.

## Scope

### In Scope
- Add a typed API-key domain module and JWT-authenticated composable for list, detail, create, revoke, and replace operations.
- Add `/api-keys` with project binding, approved scopes, fixed expiry presets, metadata status, destructive confirmation, and one-time secret display/copy.
- Register the personal module for `user` and `super_admin`, with route metadata and focused Vitest coverage.

### Out of Scope
- Backend, JWT/auth composable, API-key client authentication, or recovery behavior changes.
- Secret recovery: `POST /api/api-keys/:id/recover` is a deliberate 410 and must not be used by the Admin.
- Shared authenticated-client refactoring or unrelated UI cleanup.

## Capabilities

### New Capabilities
- `api-key-management`: JWT-protected Admin lifecycle management for project-bound API keys, including one-time secret disclosure.

### Modified Capabilities
- None.

## Approach

Implement a dedicated `modules/api-keys` module and page using existing authenticated composable and shadcn-vue patterns. Bind requests to the verified contract: `GET/POST /api/api-keys`, detail, revoke, and replace; create accepts name, one projectId, 1–6 scopes, 30/90/180/365-day expiry, and optional ownerId for superadmins. Keep authorization server-authoritative, retry JWT requests once, redact token-like errors, and clear the ephemeral secret when its dialog closes. Use `utils/date.ts`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `modules/api-keys/`, `pages/api-keys/index.vue` | New | Types, lifecycle calls, forms, metadata, secret UX. |
| `app/module-config.ts`, `middleware/module-access.ts` | Modified | Register and protect the route. |
| `components/layout/AppSidebar.vue`, `layouts/sidebar-vertical.vue` | Modified | Key icon, label, and breadcrumb metadata. |
| `tests/unit/{composables,pages}/api-keys.test.ts` | New | Lifecycle, security, refresh, and secret tests. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| DTO/response mismatch | Med | Implement only against verified Swagger/controller evidence before specs/tasks. |
| Secret retained or exposed | Med | Ephemeral state, no persistence/logging/toasts, clear on dismissal, redaction tests. |
| Incorrect pagination or owner authority | Med | Treat server status/authorization as authoritative and verify response shape. |

## Rollback Plan

Revert the Admin module, route registration, layout metadata, and tests as one change; no backend or persisted key data is modified.

## Dependencies

- Verified backend Swagger/controller DTO and response contract.
- Existing JWT `useAuth()` refresh behavior and accessible project data.

## Success Criteria

- [ ] Users can list, inspect, create, replace, and revoke keys through JWT-authenticated Admin flows.
- [ ] Create/replace secrets appear once, are never persisted, and are cleared on dialog dismissal.
- [ ] Tests cover all lifecycle calls, 401 refresh retry, authorization/error redaction, expiry, and secret handling.
- [ ] `pnpm run test -- --run` passes without changing unrelated dirty files.
