import { useCallback } from 'react'
import { useUser, useAuth, useSignIn, useSignUp } from '@clerk/expo'
import * as AuthSession from 'expo-auth-session'
import type {
  AuthProvider,
  AuthUser,
  AuthResult,
  AuthError,
  AuthErrorCode,
  OAuthProvider,
  SignInParams,
  SignUpParams,
  VerifyEmailCodeParams,
  ResendVerificationCodeParams,
} from '@/providers/auth/auth.interface'
import { useWarmUpBrowser } from '@/providers/auth/clerk/use-warm-up-browser'

const OAUTH_MAP: Record<OAuthProvider, `oauth_${string}`> = {
  google: 'oauth_google',
  apple: 'oauth_apple',
  github: 'oauth_github',
}

function mapClerkUser(user: ReturnType<typeof useUser>['user']): AuthUser | null {
  if (!user) return null
  return {
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress ?? null,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
  }
}

function mapClerkError(err: unknown): AuthError {
  if (err && typeof err === 'object' && 'errors' in err) {
    const clerkErrors = (err as { errors: Array<{ code: string }> }).errors
    const first = clerkErrors[0]

    if (first) {
      const codeMap: Record<string, { code: AuthErrorCode; message: string }> = {
        form_identifier_not_found: {
          code: 'INVALID_CREDENTIALS',
          message: 'No account found with that email',
        },
        form_password_incorrect: {
          code: 'INVALID_CREDENTIALS',
          message: 'Incorrect password',
        },
        form_identifier_exists: {
          code: 'ACCOUNT_EXISTS',
          message: 'An account with that email already exists',
        },
        session_exists: {
          code: 'ACCOUNT_EXISTS',
          message: "You're already signed in",
        },
        verification_failed: {
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Invalid verification code',
        },
        too_many_requests: {
          code: 'RATE_LIMITED',
          message: 'Too many attempts. Please wait and try again',
        },
      }

      const mapped = codeMap[first.code]
      if (mapped) return mapped
    }
  }

  if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Connection error. Check your network and try again',
    }
  }

  return {
    code: 'UNKNOWN',
    message: 'Something went wrong. Please try again',
  }
}

export function useClerkAuthAdapter(): AuthProvider {
  useWarmUpBrowser()

  const { isSignedIn, isLoaded, signOut: clerkSignOut, getToken: clerkGetToken } = useAuth()
  const { user } = useUser()
  const { signIn: clerkSignIn, setActive: setSignInActive } = useSignIn()
  const { signUp: clerkSignUp, setActive: setSignUpActive } = useSignUp()

  const signIn = useCallback(async (params: SignInParams): Promise<AuthResult> => {
    try {
      if (!clerkSignIn) return { success: false, error: mapClerkError(null) }

      const result = await clerkSignIn.create({
        identifier: params.email,
        password: params.password,
      })

      if (result.status === 'complete' && result.createdSessionId) {
        await setSignInActive({ session: result.createdSessionId })
        return { success: true }
      }

      return {
        success: false,
        error: { code: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email first' },
      }
    } catch (err) {
      return { success: false, error: mapClerkError(err) }
    }
  }, [clerkSignIn, setSignInActive])

  const signUp = useCallback(async (params: SignUpParams): Promise<AuthResult> => {
    try {
      if (!clerkSignUp) return { success: false, error: mapClerkError(null) }

      const result = await clerkSignUp.create({
        emailAddress: params.email,
        password: params.password,
      })

      if (result.status === 'complete' && result.createdSessionId) {
        await setSignUpActive({ session: result.createdSessionId })
        return { success: true }
      }

      // Email verification required
      await clerkSignUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      return { success: true }
    } catch (err) {
      return { success: false, error: mapClerkError(err) }
    }
  }, [clerkSignUp, setSignUpActive])

  const handleSignOut = useCallback(async (): Promise<void> => {
    await clerkSignOut()
  }, [clerkSignOut])

  const resetPassword = useCallback(async (email: string): Promise<void> => {
    if (!clerkSignIn) return

    await clerkSignIn.create({
      strategy: 'reset_password_email_code',
      identifier: email,
    })
  }, [clerkSignIn])

  const signInWithOAuth = useCallback(async (provider: OAuthProvider): Promise<AuthResult> => {
    try {
      if (!clerkSignIn) return { success: false, error: mapClerkError(null) }

      const redirectUrl = AuthSession.makeRedirectUri()
      const result = await clerkSignIn.authenticateWithRedirect({
        strategy: OAUTH_MAP[provider],
        redirectUrl,
        redirectUrlComplete: redirectUrl,
      })

      // OAuth flow continues in browser, result handled on redirect
      void result
      return { success: true }
    } catch (err) {
      return { success: false, error: mapClerkError(err) }
    }
  }, [clerkSignIn])

  const verifyEmailCode = useCallback(async (params: VerifyEmailCodeParams): Promise<AuthResult> => {
    try {
      if (!clerkSignUp) return { success: false, error: mapClerkError(null) }

      const result = await clerkSignUp.attemptEmailAddressVerification({
        code: params.code,
      })

      if (result.status === 'complete' && result.createdSessionId) {
        await setSignUpActive({ session: result.createdSessionId })
        return { success: true }
      }

      // Email verified but Clerk has additional optional fields (username, phone, etc.)
      // If email verification passed with no remaining unverified fields, treat as success
      if (
        result.status === 'missing_requirements' &&
        result.verifications?.emailAddress?.status === 'verified' &&
        result.unverifiedFields?.length === 0
      ) {
        // Try completing sign-up without the optional fields
        const updated = await clerkSignUp.update({})
        if (updated.status === 'complete' && updated.createdSessionId) {
          await setSignUpActive({ session: updated.createdSessionId })
          return { success: true }
        }
      }

      return {
        success: false,
        error: { code: 'EMAIL_NOT_VERIFIED', message: 'Invalid verification code' },
      }
    } catch (err) {
      return { success: false, error: mapClerkError(err) }
    }
  }, [clerkSignUp, setSignUpActive])

  const resendVerificationCode = useCallback(async (_params: ResendVerificationCodeParams): Promise<void> => {
    if (!clerkSignUp) return
    await clerkSignUp.prepareEmailAddressVerification({ strategy: 'email_code' })
  }, [clerkSignUp])

  const getToken = useCallback(async (): Promise<string | null> => {
    return clerkGetToken()
  }, [clerkGetToken])

  const refreshSession = useCallback(async (): Promise<void> => {
    // Clerk handles session refresh automatically
  }, [])

  return {
    isAuthenticated: !!isSignedIn,
    isLoading: !isLoaded,
    user: mapClerkUser(user),
    signIn,
    signUp,
    signOut: handleSignOut,
    resetPassword,
    signInWithOAuth,
    verifyEmailCode,
    resendVerificationCode,
    getToken,
    refreshSession,
  }
}
