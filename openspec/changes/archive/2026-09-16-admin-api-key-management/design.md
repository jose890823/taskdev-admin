# Design: Admin API-Key Management

## Technical Approach

Add a dedicated `modules/api-keys` domain and `/api-keys` page. The page uses the existing direct `$fetch`/`useRuntimeConfig().public.apiUrl` pattern, while `useApiKeys` is the authenticated lifecycle boundary: it owns typed requests, metadata state, pagination, one-refresh JWT retry, safe errors, and mutation refreshes. The page keeps create/replace secrets in one ephemeral dialog state and never routes them through auth cookies, storage, URLs, logs, or toasts.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Domain boundary | New `modules/api-keys` types and composable | Extend `useSecurity` or `useCrud` | API keys are user/project credentials with one-time secrets; existing generic CRUD is unauthenticated and security is superadmin-scoped. |
| Auth behavior | Local wrapper modeled on `useSecurity`/`useUsers` | Change `useAuth`, `api.client`, or shared fetch utilities | Keeps JWT refresh behavior unchanged and limits this change to the required lifecycle boundary. Retry exactly once after `401`; failed refresh logs out and never retries. |
| Table/pagination | shadcn `Table` plus `PaginationControls` | Shared `DataTable` | `DataTable` paginates loaded rows and derives totals locally, which can misrepresent a server-paginated key list. |
| Ownership | Render server-authoritative owner/project metadata; expose owner selection only to `super_admin` when the verified DTO permits `ownerId` | Client-side ownership filtering or standard-user owner selection | The server remains authoritative; standard users cannot select another owner, while superadmin visibility is explicit. |

## Data Flow

```text
Page → useApiKeys.fetchWithAuth → /api/api-keys → JWT API
  │             │ 401 → useAuth.refreshAccessToken → retry once
  │             └────────── error extraction/redaction
  └→ useProjects.fetchAll → project selector

create/replace response → metadata list + ephemeral secret dialog
revoke confirmation → revoke endpoint → refetch metadata
```

List/detail responses contain metadata only. Create and replace return metadata plus the newly issued secret; the composable returns that result without persisting the secret. Closing the dialog sets the secret reference to `null`; inspection never calls `/recover` (the endpoint is deliberately unavailable).

## File Changes

| File | Action | Description |
|---|---|---|
| `modules/api-keys/types/index.ts` | Create | Typed metadata, owner/project summaries, server pagination, lifecycle status, approved scope/expiry unions, create/replace DTOs, and response envelopes matching verified Swagger. |
| `modules/api-keys/composables/useApiKeys.ts` | Create | JWT list, detail, create, replace, and revoke calls for `GET/POST /api-keys`, `GET /:id`, and `POST /:id/{replace,revoke}`; retry, state, and redacted errors. |
| `pages/api-keys/index.vue` | Create | Protected page with metadata table, project/scope/expiry form, role-aware owner display, inspect/replace flows, one-time copy/display dialog, and revoke `AlertDialog`. |
| `app/module-config.ts` | Modify | Add enabled personal `api-keys` module at `/api-keys` for `user` and `super_admin`. |
| `middleware/module-access.ts` | Modify | Map `/api-keys` to `api-keys` for route authorization. |
| `components/layout/AppSidebar.vue` | Modify | Register the key icon used by module navigation. |
| `layouts/sidebar-vertical.vue` | Modify | Add the readable `api-keys` breadcrumb label. |
| `tests/unit/composables/useApiKeys.test.ts` | Create | Contract, auth retry, lifecycle, ownership, pagination, and redaction tests. |
| `tests/unit/pages/api-keys.test.ts` | Create | Form bounds, status/owner rendering, secret dismissal/copy, and revoke confirmation tests. |

## Interfaces / Contracts

```ts
type ApiKeyStatus = 'active' | 'expired' | 'revoked'
type ApiKeyExpiryDays = 30 | 90 | 180 | 365

interface ApiKeyMetadata {
  id: string; name: string; scopes: ApiKeyScope[]
  owner: OwnerSummary; project: ProjectSummary
  createdAt: string; lastUsedAt?: string | null; expiresAt: string
  status: ApiKeyStatus; revokedAt?: string | null
}
interface ApiKeySecretResult { key: ApiKeyMetadata; secret: string }
```

`ApiKeyScope`, DTO property names, and envelope pagination fields MUST mirror the verified backend contract; implementation must not infer them from UI names. `useProjects` supplies accessible projects and is not refactored.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | Composable lifecycle and auth | Mock `$fetch` and `useAuth`; assert URLs, JWT headers, bodies, one `401` refresh retry, failed-refresh logout/no retry, metadata updates, and token/secret redaction. |
| Unit | Page security UX | Mount with shadcn stubs; assert role-scoped owner display, bounded form validation, server status/expiry rendering via `utils/date.ts`, copy without toast, secret clearing on close, no recovery call, and confirmed revoke. |
| Integration/E2E | Not configured | Verify through focused Vitest only; do not add a new test harness in this change. |

## Threat Matrix

`N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.` Route authorization is ordinary Nuxt middleware, not a routing/process integration boundary for this matrix.

## Migration / Rollout

No migration required. Roll back by reverting the module, registrations, layout metadata, and tests; no persisted key data changes.

## Open Questions

None — backend controller and DTO evidence confirms the response contract, approved scope catalog, expiry presets, and optional superadmin `ownerId` behavior. The implementation must still treat server responses as authoritative and omit owner selection for standard users.
