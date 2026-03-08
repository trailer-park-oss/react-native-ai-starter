# Auth Pack

## Modes
- `none`
- `clerk`

## Responsibilities
- Provide unified auth interface.
- Generate auth implementation and routes only for enabled mode.
- Enforce provider isolation.

## `none` Mode
- No Clerk dependencies.
- No `app/(auth)` screens.
- Route guard skips auth gating after onboarding.

## `clerk` Mode
- Generate `src/providers/auth/clerk/*`.
- Add `useAuth` + resolver implementation.
- Generate sign-in/sign-up/forgot-password/verify-email screens.

## Contract Requirements
- Includes sign in/up/out, reset password, OAuth.
- Includes email verification methods:
  - `verifyEmailCode`
  - `resendVerificationCode`

## Environment
- Requires `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in clerk mode.

## Acceptance Checklist
- [ ] No auth SDK installed when mode is `none`.
- [ ] Auth screens only exist in clerk mode.
- [ ] Error mapping uses typed `AuthError` codes.
