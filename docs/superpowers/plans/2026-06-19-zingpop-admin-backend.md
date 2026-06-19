# Zingpop Admin Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete local Zingpop admin backend and console UI for user data inspection and operator actions.

**Architecture:** Add a global admin service in `packages/console/core`, protected by explicit env-based account allowlists. Expose it through Solid Start `/admin` routes in `packages/console/app` using existing query/action patterns. Keep all writes audited in a new `admin_audit` table.

**Tech Stack:** Bun, TypeScript, Drizzle MySQL schema, Solid Start routes/actions, existing console core actors/database utilities.

---

### Task 1: Global Admin Authorization and Audit Schema

**Files:**
- Create: `packages/console/core/src/admin-access.ts`
- Create: `packages/console/core/src/schema/admin_audit.sql.ts`
- Modify: `packages/console/core/src/identifier.ts`
- Test: `packages/console/core/test/admin-access.test.ts`

- [ ] Write failing tests for admin allowlists by account id, phone, and login.
- [ ] Write failing tests that public actors and workspace-only admins are rejected.
- [ ] Add `adminAudit` identifier prefix.
- [ ] Add `AdminAuditTable`.
- [ ] Implement `AdminAccess.assert()` and `AdminAccess.allowed()`.
- [ ] Run `cd packages/console/core && bun test test/admin-access.test.ts`.

### Task 2: Admin Read Service

**Files:**
- Create: `packages/console/core/src/admin.ts`
- Test: `packages/console/core/test/admin.test.ts`

- [ ] Write failing tests for overview projections from fixture-like rows.
- [ ] Write failing tests for user search by account id, phone, email/login, workspace id, and user id.
- [ ] Write failing tests for detail payload shape: identity, memberships, billing, payments, usage, keys, projects, audits.
- [ ] Implement typed admin read methods using existing schema tables.
- [ ] Run `cd packages/console/core && bun test test/admin.test.ts`.

### Task 3: Admin Mutations and Audit Logging

**Files:**
- Modify: `packages/console/core/src/admin.ts`
- Test: `packages/console/core/test/admin.test.ts`

- [ ] Write failing tests for required reason validation.
- [ ] Write failing tests for balance adjustment, monthly limit updates, reload disable, user/workspace soft-delete and restore, and subscription cancellation.
- [ ] Implement each mutation through one transaction that writes an audit row.
- [ ] Keep balance adjustments traceable via `PaymentTable`.
- [ ] Run `cd packages/console/core && bun test test/admin.test.ts`.

### Task 4: Console Admin Routes

**Files:**
- Create: `packages/console/app/src/routes/admin/index.tsx`
- Create: `packages/console/app/src/routes/admin/index.css`
- Create: `packages/console/app/src/routes/admin/[id].tsx`
- Create: `packages/console/app/src/routes/admin/actions.ts`
- Test: `packages/console/app/test/adminRoutes.test.ts`

- [ ] Write route/helper tests for admin access decisions and action parsing.
- [ ] Build `/admin` overview/search page.
- [ ] Build `/admin/[id]` detail page and operation forms.
- [ ] Use existing `getActor()` and `Actor.provide()` flow; do not touch `packages/app`.
- [ ] Run `cd packages/console/app && bun test test/adminRoutes.test.ts`.

### Task 5: Local Verification

**Files:**
- Modify only if verification exposes bugs.

- [ ] Run `cd packages/console/core && bun typecheck`.
- [ ] Run `cd packages/console/app && bun typecheck`.
- [ ] Run targeted core/app tests.
- [ ] Start local console app with admin env set.
- [ ] Browser smoke test `/admin` as configured admin.
- [ ] Browser smoke test non-admin access is blocked.
- [ ] Fix every failed check before claiming completion.
