# Prompt 3: Auth Pack - Provider Contract & Clerk Implementation

You are a senior React Native authentication engineer. Your task is to define the **auth feature pack** for the CLI starter.

## Context
Prompt 1 defined core generation and pack contracts. This prompt applies when `--auth` is selected.

## Auth Modes
- `none`: no auth SDK dependencies; onboarding flows to app shell directly.
- `clerk`: install Clerk dependencies and generate auth provider + screens.

## Hard Requirements

### Pack Enablement Rules
1. If auth mode is `none`:
   - Do not install Clerk dependencies.
   - Do not generate auth screen files.
   - Route guard logic must skip auth gating.
2. If auth mode is `clerk`:
   - Generate full auth provider implementation and auth routes.

### Auth Provider Contract
Define `src/providers/auth/auth.interface.ts` with:

```ts
interface AuthProvider {
  isAuthenticated: boolean
  isLoading: boolean
  user: AuthUser | null

  signIn(params: SignInParams): Promise<AuthResult>
  signUp(params: SignUpParams): Promise<AuthResult>
  signOut(): Promise<void>
  resetPassword(email: string): Promise<void>

  signInWithOAuth(provider: OAuthProvider): Promise<AuthResult>

  verifyEmailCode(params: VerifyEmailCodeParams): Promise<AuthResult>
  resendVerificationCode(params: ResendVerificationCodeParams): Promise<void>

  getToken(): Promise<string | null>
  refreshSession(): Promise<void>
}
```

Also define `AuthUser`, `SignInParams`, `SignUpParams`, `VerifyEmailCodeParams`, `ResendVerificationCodeParams`, `AuthResult`, `OAuthProvider`, `AuthError`.

### Clerk Implementation (`clerk` mode)
1. Implement under `src/providers/auth/clerk/`.
2. Use `@clerk/clerk-expo` and `expo-secure-store` token cache.
3. Map Clerk-specific errors to typed `AuthError` codes:
   - `INVALID_CREDENTIALS`, `EMAIL_NOT_VERIFIED`, `ACCOUNT_EXISTS`, `NETWORK_ERROR`, `RATE_LIMITED`, `UNKNOWN`
4. Validate `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` at startup.

### Auth API Surface
1. `src/providers/auth/useAuth.ts` is the only API imported by screens.
2. `src/providers/auth/index.ts` resolves implementation via config/resolver pattern.

### Screens (`clerk` mode)
1. `app/(auth)/sign-in.tsx`
2. `app/(auth)/sign-up.tsx`
3. `app/(auth)/forgot-password.tsx`
4. `app/(auth)/verify-email.tsx`

Requirements:
- form validation
- loading states
- error mapping display
- OTP auto-submit + resend cooldown for verify screen

### Route Guard
1. Root flow in `app/_layout.tsx`:
   - splash while loading
   - onboarding gate
   - auth gate only when auth mode is not `none`
2. Use Expo Router `Redirect`.

## Output Format (Required)

### 1. Auth Pack Mode Matrix
- `none` vs `clerk` dependencies, files, routing behavior.

### 2. Final Auth Interface
- `src/providers/auth/auth.interface.ts` full code.

### 3. Clerk Adapter Files
- `clerk-adapter.ts`, `clerk-provider.tsx`, `token-cache.ts`, `index.ts`.

### 4. Auth Resolver + Hook
- `src/providers/auth/index.ts`
- `src/providers/auth/useAuth.ts`

### 5. Auth Screens
- all 4 full files.

### 6. Navigation Guard
- updated `app/_layout.tsx` showing `none` vs `clerk` behavior.

### 7. Error Mapping Table
- Clerk Error | AuthError Code | User Message.

### 8. Add-New-Provider Guide
- 5-7 concrete steps.

### 9. Pack Invariants
- prove no auth deps/files in `none` mode.

Be concrete. All code must be valid TypeScript/TSX.
