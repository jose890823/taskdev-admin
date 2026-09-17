# API-Key Management Specification

## Purpose

Define protected Admin management of project-bound API keys without exposing reusable secrets through metadata or recovery.

## Requirements

### Requirement: Protected module access

The `/api-keys` module MUST be available only to authenticated `user` and `super_admin` roles. Other access MUST be denied without key data.

#### Scenario: Supported role opens module

- GIVEN an authenticated `user` or `super_admin`
- WHEN the user navigates to `/api-keys`
- THEN the route and module navigation are available

#### Scenario: Unsupported access is denied

- GIVEN an unauthenticated or unsupported-role user
- WHEN the user requests `/api-keys`
- THEN access is denied without key data

### Requirement: List and inspect metadata

The system MUST list and inspect authorized keys using only name, owner, project, scopes, creation, last use, expiry, and revocation status. It MUST NOT display or request secret recovery.

#### Scenario: Authorized metadata view

- GIVEN an authorized user has keys
- WHEN the user lists or inspects a key
- THEN metadata is shown and no secret value is returned

#### Scenario: Role-scoped visibility

- GIVEN a standard user and a superadmin request metadata
- WHEN each request is evaluated
- THEN the user sees owned keys and the superadmin sees server-authorized keys with owner metadata

### Requirement: Create keys with bounded ownership and access

Creation MUST require a name, exactly one accessible project, one to six approved scopes, and expiry of 30, 90, 180, or 365 days. `tasks:read` SHOULD be the default. A superadmin MAY provide an owner when authorized; a standard user MUST NOT select another owner.

#### Scenario: Valid creation

- GIVEN valid name, project, scopes, and expiry
- WHEN an authorized user creates a key
- THEN it is created and its secret is returned for one-time disclosure

#### Scenario: Invalid creation is rejected

- GIVEN no project, no approved scope, more than six scopes, or unsupported expiry
- WHEN creation is submitted
- THEN it is rejected without disclosing a secret

### Requirement: One-time secret disclosure

Create and replace MUST disclose the returned secret only in the immediate result. Closing disclosure MUST clear it, and later metadata views MUST NOT recover it.

#### Scenario: Secret is dismissed

- GIVEN create or replace returned a secret
- WHEN the user views or copies it and closes disclosure
- THEN the Admin clears it and cannot show it again

#### Scenario: Recovery is unavailable

- GIVEN disclosure was dismissed
- WHEN the user inspects the key
- THEN only metadata is shown and no recovery operation is used

### Requirement: Revoke and replace lifecycle

The system MUST require revoke confirmation and show server-authoritative active, expired, and revoked states. An accepted replacement MUST update metadata and disclose its new secret once; rejection MUST preserve known state.

#### Scenario: Revoke a key

- GIVEN an authorized user confirms revocation
- WHEN revocation succeeds
- THEN the key is shown as revoked with no secret disclosed

#### Scenario: Replace or reject a key

- GIVEN an authorized user submits a replacement
- WHEN the server accepts or rejects it
- THEN acceptance shows a one-time secret; rejection preserves metadata and shows a safe error

### Requirement: Authenticated resilience and safe errors

Lifecycle requests MUST use JWT authentication and retry once after a successful refresh following `401`. Failed refresh MUST stop retries. User-visible errors MUST redact token-like and secret-like values.

#### Scenario: Expired Admin token refreshes

- GIVEN a lifecycle request receives `401` and refresh succeeds
- WHEN the request is retried once
- THEN the operation completes with refreshed authentication

#### Scenario: Refresh or authorization fails safely

- GIVEN refresh fails or the server denies an operation
- WHEN the Admin renders the failure
- THEN existing auth-failure behavior or a redacted error is shown without secret content
