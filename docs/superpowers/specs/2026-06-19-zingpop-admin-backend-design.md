# Zingpop Admin Backend Design

## Goal

Build a local-first Zingpop operator backend that lets a trusted global admin inspect complete user, workspace, billing, usage, project, and identity data, then execute common support operations from a console UI. The implementation stays in `packages/console` and does not modify `packages/app` or opencode core runtime.

## Boundary

- Add global admin authorization separate from workspace admin rights.
- Use `packages/console/core` for data access, mutation, and audit logging.
- Use `packages/console/app` for `/admin` routes and server actions.
- Do not deploy to Huawei Cloud in this phase.
- Do not expose this backend to any account unless the account matches explicit admin environment configuration.

## Admin Access

Admin access is granted only to logged-in account actors whose `accountID`, phone, or login appears in one of these env lists:

- `ZINGPOP_ADMIN_ACCOUNT_IDS`
- `ZINGPOP_ADMIN_PHONES`
- `ZINGPOP_ADMIN_LOGINS`

Workspace `admin` role is not enough. Public actors and normal workspace admins must be rejected before any global data is queried.

## Data Surface

The dashboard shows:

- Account identity: account id, login, phone/email providers, created/deleted timestamps.
- Workspace membership: user id, workspace id/name/slug, role, deleted state, last seen, per-user monthly limit and usage.
- Workspace business state: billing balance, reload state, monthly limit/usage, Black/Lite subscription fields.
- Activity: recent payments, usage rows, API keys, and workbench projects.
- Overview metrics: total accounts, users, workspaces, active/deleted counts, active subscription count, balances, and recent usage cost.

## Operations

All write operations require a reason and write an audit entry:

- Adjust workspace balance by a signed dollar amount.
- Set workspace monthly limit.
- Set user monthly limit.
- Soft-delete or restore a user membership.
- Soft-delete or restore a workspace.
- Disable reload for a workspace.
- Cancel Black or Lite subscription references.

Dangerous operations are soft-delete or reversible where possible. Balance changes go through the existing billing/payment path so finance history remains traceable.

## Audit

Create `admin_audit` with:

- admin account id/login
- action
- target type/id
- optional workspace id/user id/account id
- reason
- before/after JSON snapshots
- request metadata JSON
- normal timestamps

Audit rows are queryable in the admin UI and in tests.

## UI

Add a work-focused `/admin` console area:

- Overview counters and search.
- User/workspace result table.
- Detail view with identity, workspaces, billing, usage, keys, projects, and audit.
- Forms for the supported backend operations.

The UI uses existing Solid Start route/action/query patterns and its own admin CSS, not the workbench frontend.

## Testing

Required local checks:

- Core tests for admin allow/deny behavior.
- Core tests for list/detail projections.
- Core tests for each mutation and audit entry.
- App tests for route access and non-admin redirects/rejections where practical.
- `bun typecheck` in `packages/console/core` and `packages/console/app`.
- Browser smoke test against local console routes with admin and non-admin environment cases.
