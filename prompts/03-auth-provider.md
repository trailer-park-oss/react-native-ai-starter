# Prompt 3: Auth Provider Architecture & Clerk Implementation

You are a senior React Native engineer specializing in authentication. Your task is to implement the swappable auth provider system and the default Clerk implementation for an Expo-based React Native starter kit.

## Context
This is Prompt 3 in a series of 5.

**From Prompt 1 (already complete):**
- The project uses Expo Router with route groups: `(onboarding)`, `(auth)`, `(app)`.
- Auth provider interface is defined at `src/providers/auth/auth.interface.ts`.
- The active provider is selected via `starter.config.ts`.
- Zustand handles client state; TanStack Query handles server state.

**From Prompt 2 (already complete):**
- Design tokens and ThemeProvider are set up in `src/design-system/`.
- UI components use semantic tokens like `primary`, `surface`, `text`, etc.

Your job: implement the auth provider contract, the Clerk adapter, the auth screens, and the navigation guard logic.

## Hard Requirements

### Auth Interface Contract
Refine and finalize `src/providers/auth/auth.interface.ts` with these capabilities:
```ts
interface AuthProvider {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;

  // Actions
  signIn(params: SignInParams): Promise<AuthResult>;
  signUp(params: SignUpParams): Promise<AuthResult>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;

  // OAuth
  signInWithOAuth(provider: OAuthProvider): Promise<AuthResult>;

  // Session
  getToken(): Promise<string | null>;
  refreshSession(): Promise<void>;
}
```
Define all supporting types (`AuthUser`, `SignInParams`, `SignUpParams`, `AuthResult`, `OAuthProvider`, `AuthError`).

### Clerk Implementation
1. Implement the Clerk adapter at `src/providers/auth/clerk/`.
2. Use `@clerk/clerk-expo` with Expo-compatible token caching (`expo-secure-store`).
3. Map every `AuthProvider` method to the corresponding Clerk SDK call.
4. Handle Clerk-specific concerns (publishable key, token cache, warm-up) inside the adapter — none of this leaks outside `clerk/`.

### Auth Hook
1. Create `src/providers/auth/useAuth.ts` that:
   - Returns the `AuthProvider` interface (not Clerk-specific types).
   - Is the ONLY auth API that screens and components import.
   - Internally resolves the active provider from config.

### Auth Screens
Build these screens using semantic design tokens (from Prompt 2). Do NOT use Clerk's pre-built UI components — build custom screens that call the auth hook.

1. **Sign In** (`app/(auth)/sign-in.tsx`)
   - Email + password fields
   - "Forgot password?" link
   - OAuth buttons (Google, Apple)
   - Link to sign-up

2. **Sign Up** (`app/(auth)/sign-up.tsx`)
   - Name, email, password fields
   - Terms acceptance checkbox
   - OAuth buttons (Google, Apple)
   - Link to sign-in

3. **Forgot Password** (`app/(auth)/forgot-password.tsx`)
   - Email field
   - Submit button
   - Success/error feedback
   - Link back to sign-in

4. **Email Verification** (`app/(auth)/verify-email.tsx`)
   - OTP/code input (6 digits)
   - Resend code button with cooldown timer
   - Auto-submit on complete input

### Navigation Guard
1. In the root layout (`app/_layout.tsx`), implement this flow:
   - Show splash screen while auth state is loading (`isLoading`)
   - If auth loaded and `!onboardingComplete` -> redirect to `(onboarding)`
   - If auth loaded and `!isAuthenticated` -> redirect to `(auth)`
   - If auth loaded and authenticated -> allow `(app)` routes
2. Use Expo Router's `Redirect` component, not imperative navigation.
3. Protect `(app)` routes — unauthenticated access must redirect to `(auth)`.

### Error Handling
1. Define `AuthError` with typed error codes:
   - `INVALID_CREDENTIALS`, `EMAIL_NOT_VERIFIED`, `ACCOUNT_EXISTS`, `NETWORK_ERROR`, `RATE_LIMITED`, `UNKNOWN`
2. The Clerk adapter must catch Clerk-specific errors and map them to `AuthError` codes.
3. Auth screens must display user-friendly error messages per error code.

### Environment Variables
1. Clerk publishable key via `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`.
2. Document the `.env` setup required.
3. Add runtime validation — if the key is missing, throw a clear error at app startup, not a cryptic Clerk failure.

## Output Format (Required)

### 1. Final Auth Interface
- `src/providers/auth/auth.interface.ts` — all types and the provider interface.

### 2. Clerk Adapter
- `src/providers/auth/clerk/clerk-adapter.ts` — full implementation.
- `src/providers/auth/clerk/clerk-provider.tsx` — Clerk's `<ClerkProvider>` wrapper configured for Expo.
- `src/providers/auth/clerk/token-cache.ts` — SecureStore-based token cache.
- `src/providers/auth/clerk/index.ts` — barrel export.

### 3. Auth Hook
- `src/providers/auth/useAuth.ts` — full implementation.

### 4. Auth Barrel
- `src/providers/auth/index.ts` — re-exports based on `starter.config.ts`.

### 5. Auth Screens (all 4)
- Full screen components using the auth hook and design tokens.
- Include form validation (email format, password min length, required fields).
- Include loading states on buttons during async operations.
- Include error display using `AuthError` codes.

### 6. Navigation Guard
- Updated `app/_layout.tsx` showing the complete splash -> onboarding -> auth -> app flow.

### 7. Error Mapping Table
- Columns: Clerk Error | AuthError Code | User-Facing Message.

### 8. Adding a New Auth Provider Guide
- Step-by-step (5-7 steps) showing exactly what a developer does to add a new provider (e.g., Supabase Auth), including which files to create and which to modify.

Be concrete. All code must be valid TypeScript/TSX. Use realistic Clerk SDK calls. No pseudocode.
