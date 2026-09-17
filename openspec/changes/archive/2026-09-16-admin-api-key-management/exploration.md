## Exploration: Admin API-key management

### Current State

The Admin is an SSR-disabled Nuxt/Vue SPA that calls the NestJS API directly through `useRuntimeConfig().public.apiUrl`. Browser authentication is JWT-based: `useAuth()` stores access, refresh, and user values in cookies, retries a `401` once through `refreshAccessToken()`, and logs out only when refresh fails. There is no API-key module, page, or API-key-specific type/composable.

Admin domain modules conventionally provide `types/`, a composable, and a page. Existing authenticated composables (`useSecurity`, `useUsers`, and similar) duplicate a `$fetch` wrapper that adds the JWT, refreshes once on `401`, retries, and then logs out. The generic `useApiFetch` and `useCrud` do not add authentication and are not suitable as the lifecycle boundary.

The UI already provides shadcn-vue `DataTable`, `Table`, `Dialog`, `AlertDialog`, `Badge`, `Input`, `Select`, `Checkbox`, `Card`, and toast primitives. Security pages demonstrate metadata dialogs and destructive confirmations; personal modules are visible to both `user` and `super_admin`, while the current `security` module is superadmin-only. The sidebar is generated from `app/module-config.ts`, with route access resolved separately by `middleware/module-access.ts`; icons and breadcrumb labels require explicit maps.

The existing workspace API-key management specification defines JWT-only management, `GET/POST /api-keys`, `GET /api-keys/:id`, `POST /api-keys/:id/revoke`, and `POST /api-keys/:id/replace`. It requires one owner, exactly one project, selected scopes, 30/90/180/365-day expiry, metadata-only inspection, and a secret returned exactly once by create/replace. The approved scope catalog has `tasks:read` as the default and a six-scope maximum. The backend portion is recorded as verified, but exact DTO property names and response shapes are not present in this Admin repository.

### Affected Areas

- `modules/api-keys/types/index.ts` — typed key metadata, owner/project metadata, lifecycle status, scope catalog, create/replace DTOs, and response envelopes.
- `modules/api-keys/composables/useApiKeys.ts` — JWT-authenticated list/create/inspect/revoke/replace calls, one-refresh retry, state updates, and safe error extraction/redaction.
- `pages/api-keys/index.vue` — key list, metadata inspection, create/replace form, one-time secret display/copy, expiry/status presentation, and revoke confirmation.
- `app/module-config.ts` — register an enabled `/api-keys` personal module for both supported Admin roles.
- `middleware/module-access.ts` — map `/api-keys` to the registered module so route access is enforced consistently.
- `components/layout/AppSidebar.vue` and `layouts/sidebar-vertical.vue` — add the key icon and readable breadcrumb/sidebar metadata rather than falling back to generic labels.
- `modules/projects/composables/useProjects.ts` — reuse the existing accessible-project source for the exactly-one-project selector, while confirming its refresh behavior or loading options through the new authenticated boundary.
- `tests/unit/composables/useApiKeys.test.ts` and `tests/unit/pages/api-keys.test.ts` — cover lifecycle calls, one-time secret handling, ownership/superadmin views, expiry, safe errors, and JWT refresh retry behavior using the existing Vitest/happy-dom setup.
- `lang/en.json` and `lang/es.json` — optional if the page follows the bilingual resource convention; current security pages mostly use page-local Spanish strings, so this choice should be made consistently.

### Approaches

1. **Dedicated API-key module and lifecycle page (recommended)** — Add typed API-key domain code and a focused `/api-keys` page, reusing the existing authenticated composable pattern and shadcn-vue primitives.
   - Pros: preserves ownership boundaries, keeps JWT Admin calls separate from static API keys, supports one-time secret UX explicitly, and allows focused tests without changing shared auth behavior.
   - Cons: duplicates the repository's existing refresh wrapper unless a later shared-client refactor is approved; exact backend DTO and superadmin target semantics must be confirmed before implementation.
   - Effort: **Medium**

2. **Extend `useSecurity` or generic `useCrud`** — Treat API keys as another security CRUD resource and reuse the existing security page infrastructure.
   - Pros: fewer new composable patterns and potentially fewer files.
   - Cons: `useCrud` is unauthenticated and untyped for this contract; `useSecurity` is superadmin-scoped and does not model one-time secrets, owner visibility, project binding, replacement, or redacted errors. This would blur personal credential ownership and increase security coupling.
   - Effort: **Medium**, with higher security and maintenance risk

### Recommendation

Use the dedicated module approach. Implement a JWT-only `useApiKeys` composable modeled on `useSecurity`/`useUsers`, retrying an expired Admin access token once and never sending an API key to the Admin management endpoints. Normalize the standard `{ success, data, pagination, error }` envelope in one place, prefer `error.message`, and redact any accidental `thk_...` token-like text before assigning UI errors; do not log raw error objects or secrets.

The page should list metadata only, show owner/project/scopes/created/last-used/expiry/revocation fields, and treat server status as authoritative. Create and replace should require a name, one accessible project, at least one approved scope (default `tasks:read`, maximum six), and one of the four fixed expiry presets. Inspect should never call a secret-recovery endpoint. Create/replace responses should populate an ephemeral secret dialog with copy support, clear the secret when dismissed, and never place it in cookies, local storage, URLs, toasts, logs, or test snapshots. Revoke should use an `AlertDialog` and refresh the metadata list.

Register the route as a personal module for `user` and `super_admin`, add the sidebar icon/label maps, and keep server-side ownership and superadmin authorization authoritative. Before proposal, pin the backend Swagger/controller contract for DTO field names, pagination, owner selection, and whether superadmins may create/replace on behalf of another owner; the current Admin repository cannot safely infer those details.

Use `utils/date.ts` for expiry and lifecycle display instead of `new Date(...).toLocale*`, and add focused Vitest tests for successful create/replace secret disclosure, subsequent metadata-only inspection, revoke, expiry rendering, non-owner denial, superadmin owner metadata, redacted failures, and refresh-then-retry without altering `useAuth()`.

### Risks

- The endpoint paths are known, but exact create/replace DTO fields and response envelopes are not available in this Admin repository; guessing them would create a frontend/backend contract defect.
- Superadmin read/revoke/replace authority is specified, but creation or replacement on behalf of another owner is not explicit; the UI must not invent an owner selector or broaden permissions.
- The shared `DataTable` derives server pagination from the currently loaded rows, so it may be unsuitable if `GET /api-keys` is paginated; use a bounded list or a dedicated pagination path rather than silently showing incorrect page counts.
- A dismissed one-time secret cannot be recovered by design; the UI must make the copy/display warning clear and clear its local reference after dismissal.
- Existing Admin worktree files are dirty; implementation must add only the approved API-key files and registration changes, leaving unrelated changes untouched and monitoring the 400-line review budget.

### Ready for Proposal

Yes. The proposal should select the dedicated module/page approach, preserve unchanged JWT login and refresh behavior, and explicitly bind the Admin implementation to the verified backend Swagger contract before defining implementation tasks. No proposal, spec, design, or task artifact should be created during this exploration phase.
