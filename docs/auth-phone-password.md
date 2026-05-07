# Phone + Password Auth Plan

Decision date: 2026-05-06

Zingpop product login should use:

```text
First registration: phone number + SMS verification code + set password
Later login: phone number + password
Password reset: phone number + SMS verification code + set new password
```

This is a Zingpop product-layer feature. It must not change opencode's reusable runtime/core.

## Existing Code To Reuse

The repository already has phone verification and account creation:

```text
packages/console/core/src/phone-auth.ts
packages/console/core/src/schema/login_code.sql.ts
packages/console/core/src/schema/auth.sql.ts
packages/console/core/src/schema/account.sql.ts
packages/console/core/src/schema/user.sql.ts
packages/console/app/src/routes/auth/phone.tsx
packages/console/app/src/context/auth.ts
```

Current behavior:

- Sends SMS verification code.
- Verifies code.
- Creates `account`.
- Adds `auth.provider = phone`.
- Creates or loads a workspace.
- Writes login session cookie.

Missing behavior:

- Password table. Added as `account_password`.
- Password hashing and verification. Added in `packages/console/core/src/password-auth.ts`.
- Login by phone + password. Added in `packages/console/app/src/routes/auth/phone.tsx`.
- Forgot-password reset flow. Added in `packages/console/app/src/routes/auth/phone.tsx`.
- Rate limiting for password attempts. Added as failed attempt counting plus temporary lockout.

## Target User Flow

### Register

```text
1. User enters phone number.
2. System sends SMS verification code.
3. User enters code and password.
4. System verifies code.
5. If phone is new, create account and workspace.
6. Store password hash.
7. Start product session.
8. Redirect to workspace or app entry.
```

If the phone already exists, do not create a duplicate account. Send the user to login or password reset.

### Login

```text
1. User enters phone number and password.
2. System normalizes phone number.
3. System verifies password hash.
4. System starts product session.
5. Redirect to workspace or app entry.
```

### Forgot Password

```text
1. User enters phone number.
2. System sends SMS verification code.
3. User enters code and new password.
4. System verifies code.
5. System replaces password hash.
6. System starts product session or redirects to login.
```

## Data Model

Added a product-layer password table:

```text
account_password
```

Recommended columns:

```text
account_id
password_hash
password_algorithm
time_password_updated
failed_attempt_count
locked_until
time_created
time_updated
time_deleted
```

Rules:

- Never store plaintext passwords.
- Use a slow password hash such as Argon2id, bcrypt, or scrypt.
- Keep one active password row per account.
- Keep `auth.provider = phone` as the phone-to-account binding.

## Security Rules

- Minimum password length: 8 characters.
- Maximum password length: 128 characters.
- Rate-limit login attempts by phone and IP.
- Temporarily lock account after repeated failed password attempts.
- Do not reveal whether a phone number exists during login/reset.
- SMS verification code remains one-time and short-lived.
- Session cookie must be `httpOnly`.
- In production, session cookie must be `secure`.
- Backend opencode port must stay private on `127.0.0.1`.

## Workbench Integration

Login protects the product entry, not opencode internals directly:

```text
User -> Zingpop auth/session -> workspace/project authorization -> app.zingpop.cn -> opencode backend
```

Before public multi-user launch, add an authorization layer that maps:

```text
accountID -> workspaceID -> projectID -> filesystem directory
```

The user should never type raw server paths.

Stage 1 workbench gate:

- `packages/console/app/src/routes/auth/status.ts` returns `401` when the product session is missing.
- `deploy/nginx/zingpop-app.conf` uses Nginx `auth_request` before proxying to `127.0.0.1:4096`.
- `AUTH_COOKIE_DOMAIN=.zingpop.cn` lets the login cookie apply to both `www.zingpop.cn` and `app.zingpop.cn`.

## Implementation Order

1. Add `account_password` schema and migration in `packages/console/core`. Done.
2. Add password hashing helpers in `packages/console/core`. Done.
3. Extend phone registration to set password after SMS verification. Done.
4. Add phone + password login action/page. Done.
5. Add forgot-password reset action/page. Done.
6. Add rate limiting and lockout. Done.
7. Gate app/workbench entry behind product session. Stage 1 Nginx gate added.
8. Connect workspace/project isolation before public launch. Still required.
