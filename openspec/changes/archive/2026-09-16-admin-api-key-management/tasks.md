# Tasks: Admin API-Key Management

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 650–850 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Typed API-key contract and authenticated lifecycle composable | PR 1 | `pnpm run test -- --run tests/unit/composables/useApiKeys.test.ts` | N/A: no integration/E2E harness configured | Revert `modules/api-keys/types/`, `modules/api-keys/composables/`, and composable tests |
| 2 | Protected page, forms, secret UX, and lifecycle controls | PR 2 | `pnpm run test -- --run tests/unit/pages/api-keys.test.ts` | N/A: page verification is Vitest-only by project configuration | Revert `pages/api-keys/` and page tests |
| 3 | Navigation wiring and release verification | PR 3 | `pnpm run test -- --run` | N/A: backend runtime is out of scope; use focused Vitest evidence | Revert module/access/sidebar/layout registrations only |

## Phase 1: Contract and Auth Foundation

- [x] 1.1 RED: Add failing `tests/unit/composables/useApiKeys.test.ts` cases asserting `/api-keys`, `/:id`, `/:id/replace`, `/:id/revoke` URLs/bodies, metadata-only list/detail, JWT headers, and envelopes.
- [x] 1.2 GREEN: Create `modules/api-keys/types/index.ts` with verified metadata, owner/project summaries, pagination, status/scope/expiry unions, DTOs, and secret-result types.
- [x] 1.3 RED: Extend the composable tests for one successful `401` refresh retry, failed-refresh logout/no retry, mutation refetch, and token/secret error redaction.
- [x] 1.4 GREEN: Create `modules/api-keys/composables/useApiKeys.ts` with typed list/detail/create/replace/revoke calls, local state, refresh handling, and safe errors.

## Phase 2: Page and Security UX

- [x] 2.1 RED: Add failing `tests/unit/pages/api-keys.test.ts` cases for role access, project/owner/scope/expiry bounds, server status rendering, rejection preservation, and no recovery call.
- [x] 2.2 GREEN: Create `pages/api-keys/index.vue` with auth/module metadata, project-bound form, superadmin-only owner behavior, `utils/date.ts` status/expiry rendering, inspect/replace/revoke flows, and confirmation.
- [x] 2.3 RED: Add failing page assertions for one-time secret display/copy, no toast/storage/URL persistence, and clearing the secret when disclosure closes.
- [x] 2.4 GREEN: Complete the page’s ephemeral secret dialog and safe create/replace/revoke error handling; prove each assertion with the focused page command.

## Phase 3: Integration and Verification

- [x] 3.1 GREEN: Register `api-keys` in `app/module-config.ts`, map it in `middleware/module-access.ts`, and add key navigation/breadcrumb metadata in `components/layout/AppSidebar.vue` and `layouts/sidebar-vertical.vue`.
- [x] 3.2 REFACTOR: Remove duplication while preserving typed contracts, exactly-once retry, server-authoritative status, and all RED→GREEN assertions.
- [x] 3.3 Verify: Run `pnpm run test -- --run`; record passing test files/counts and run `pnpm exec vue-tsc --noEmit`, distinguishing pre-existing type errors from change regressions.

## Apply Evidence — PR 2 / Work Unit 2

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 2.1 | `tests/unit/pages/api-keys.test.ts` | Unit | N/A (new) | ✅ Missing page import failed | ✅ 5/5 passed after page implementation | ✅ User/superadmin, bounds, status, rejection, inspect | ✅ Clean |
| 2.2 | `tests/unit/pages/api-keys.test.ts` | Unit | N/A (new) | ✅ 2.1 acceptance tests | ✅ 5/5 passed | ✅ Project, owner, metadata, and lifecycle controls | ✅ Clean |
| 2.3 | `tests/unit/pages/api-keys.test.ts` | Unit | ✅ 5/5 | ✅ Copy temporarily disabled: 1/7 failed | ✅ 7/7 passed after implementation | ✅ Create and replace secrets, persistence, dismissal; final suite 9/9 | ✅ Clean |
| 2.4 | `tests/unit/pages/api-keys.test.ts` | Unit | ✅ 9/9 | ✅ Generic fallback temporarily removed: 1/10 failed | ✅ 10/10 passed after implementation | ✅ Create, replace, revoke rejection paths | ✅ Clean |

### Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test command and exact result | `pnpm exec vitest run tests/unit/pages/api-keys.test.ts` — PASS; 1 file, 10 tests passed. |
| Runtime harness command/scenario and exact result | N/A — no integration/E2E harness is configured; page behavior is verified through happy-dom Vitest. |
| Rollback boundary | Revert `pages/api-keys/index.vue` and `tests/unit/pages/api-keys.test.ts`; no backend or sibling repository changes are required. |

### Verification Notes

- `pnpm run build` — PASS; Nuxt client and Nitro server built successfully.
- `pnpm exec vitest run tests/unit/composables/useApiKeys.test.ts` — PASS; 1 file, 4 tests passed.
- `pnpm exec vue-tsc --noEmit` — FAILS on existing repository errors in `app.vue`, categories, security, users, i18n, notifications, and tasks; no new API-key page/test error remains.
- `git diff --check` — PASS.
- Authenticated JWT behavior remains in the existing `useApiKeys` composable; this slice does not modify it.

## Apply Evidence — PR 3 / Work Unit 3

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 3.1 | `tests/unit/navigation/api-keys-navigation.test.ts` | Unit | ✅ 14/14 focused API-key tests | ✅ 2 assertions failed before registration and route export | ✅ 2/2 passed after wiring | ✅ Supported/unsupported roles and root/child/non-matching routes | ✅ Clean |
| 3.2 | `tests/unit/composables/useApiKeys.test.ts` | Unit | ✅ 14/14 focused API-key tests | ✅ Approval assertions existed before refactor | ✅ 16/16 passed after `runMutation` extraction | ✅ List, detail, create, replace, revoke, refresh, and redaction paths | ✅ Mutation loading/error/refetch duplication removed |
| 3.3 | `tests/unit/navigation/api-keys-navigation.test.ts` | Unit | N/A — verification-only | N/A — no production behavior added | ✅ Final suite passed | ✅ Focused and full-suite counts recorded | ✅ No further refactor required |

### Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test command and exact result | `pnpm exec vitest run tests/unit/composables/useApiKeys.test.ts tests/unit/pages/api-keys.test.ts tests/unit/navigation/api-keys-navigation.test.ts` — PASS; 3 files, 16 tests passed. Final `pnpm run test -- --run` — PASS; 7 files, 35 tests passed. |
| Runtime harness command/scenario and exact result | N/A — no integration/E2E harness is configured; backend runtime is explicitly out of scope, so navigation and lifecycle behavior use Vitest coverage. |
| Rollback boundary | Revert only the `api-keys` entries/export/icon/label additions in `app/module-config.ts`, `middleware/module-access.ts`, `components/layout/AppSidebar.vue`, and `layouts/sidebar-vertical.vue`; revert `runMutation` extraction in `modules/api-keys/composables/useApiKeys.ts` and `tests/unit/navigation/api-keys-navigation.test.ts`, preserving unrelated dirty changes in shared files. |

### Verification Notes

- `pnpm run test -- --run` — PASS; 7 test files and 35 tests passed.
- `pnpm exec vue-tsc --noEmit` — FAIL; 22 pre-existing diagnostics remain in `app.vue`, categories, RichTextEditor, security, users, i18n, notifications, and task pages. No diagnostic references the API-key module, navigation wiring, layout metadata, or new navigation test.
- `pnpm run build` — PASS; Nuxt client and Nitro server built successfully. Browserslist stale-data warning only.
- `git diff --check` — PASS.
- Authenticated JWT behavior, one-refresh retry, server-authoritative status, and ephemeral secret handling remain covered by the existing RED→GREEN API-key tests.

## Remediation Evidence — Verification Revision `sha256:f47481167c4acfb8d588c11eafafd57484bfc076cf3f9a74e1678de209f7db37`

Original implementation tasks remain unchanged at 11/11 complete. This section records only the approved remediation evidence; no new implementation task was added.

### TDD Cycle Evidence

| Finding / scenario | Test File | RED | GREEN | REFACTOR |
|---|---|---|---|---|
| Successful create/replace secret survives metadata refetch failure | `tests/unit/composables/useApiKeys.test.ts` | ✅ Initial focused run rejected the mutation when refetch failed | ✅ Final focused run passed create and replace disclosure assertions | ✅ Best-effort refetch handling is isolated in shared `runMutation` |
| Rendered server pagination | `tests/unit/pages/api-keys.test.ts` | ✅ Initial focused run failed because no pagination component was rendered | ✅ Final focused run passed rendered-control and `{ page, limit }` request assertions | ✅ Uses existing `PaginationControls`; server pagination remains authoritative |
| Distinct role-scoped server responses | `tests/unit/composables/useApiKeys.test.ts` | N/A — proof-only scenario; existing lifecycle behavior already supported separate responses | ✅ User and superadmin session responses remain distinct and unmodified | ✅ No client-side ownership filtering or response derivation added |
| More-than-six and unsupported-expiry rejection | `tests/unit/pages/api-keys.test.ts` | ✅ Initial focused run failed before the targeted form proof was complete | ✅ Final focused run passed both invalid-input rejection assertions without mutation | ✅ Existing bounded `isFormValid` guard reused |
| Successful revoke UI transition | `tests/unit/pages/api-keys.test.ts` | ✅ Initial focused run failed because the successful transition was not asserted | ✅ Final focused run passed server-returned revoked rendering and action removal | ✅ Existing composable refetch remains the state transition boundary |

### Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test command and exact result | `pnpm exec vitest run tests/unit/composables/useApiKeys.test.ts tests/unit/pages/api-keys.test.ts tests/unit/navigation/api-keys-navigation.test.ts` — PASS; 3 files, 21 tests passed. |
| Runtime harness command/scenario and exact result | N/A — no integration/E2E harness is configured; the Admin page and composable boundaries are covered by happy-dom Vitest. |
| Rollback boundary | Revert the `runMutation` best-effort refetch handling in `modules/api-keys/composables/useApiKeys.ts`, the pagination wiring in `pages/api-keys/index.vue`, and the remediation assertions in `tests/unit/composables/useApiKeys.test.ts` and `tests/unit/pages/api-keys.test.ts`; preserve all unrelated dirty files. |

### Remediation Verification Notes

- `pnpm run test -- --run` — PASS; 7 files, 40 tests passed.
- `pnpm run build` — PASS; Nuxt 3.21.2/Nitro production build completed. Browserslist stale-data warning only.
- `pnpm exec vue-tsc --noEmit` — EXIT 2; 22 known pre-existing diagnostic sites remain outside the API-key remediation. No API-key diagnostic appeared.
- `git diff --check` — PASS; no whitespace errors.
- Secret state remains page-local and ephemeral; no toast, storage, URL, or recovery path was introduced.
- JWT exactly-once retry and existing error redaction behavior remain unchanged.
