export type OAuthProvider = 'google' | 'apple' | 'github'

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_VERIFIED'
  | 'ACCOUNT_EXISTS'
  | 'NETWORK_ERROR'
  | 'RATE_LIMITED'
  | 'UNKNOWN'

export interface AuthError {
  code: AuthErrorCode
  message: string
}

export interface AuthUser {
  id: string
  email: string | null
  firstName: string | null
  lastName: string | null
  imageUrl: string | null
}

export interface SignInParams {
  email: string
  password: string
}

export interface SignUpParams {
  email: string
  password: string
}

export interface VerifyEmailCodeParams {
  code: string
}

export interface ResendVerificationCodeParams {
  email: string
}

export type AuthResult =
  | { success: true }
  | { success: false; error: AuthError }

export interface AuthProvider {
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
