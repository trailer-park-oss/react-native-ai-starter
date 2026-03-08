export { useAuth } from '@/providers/auth/useAuth'
export type {
  AuthProvider,
  AuthUser,
  AuthError,
  AuthErrorCode,
  OAuthProvider,
  SignInParams,
  SignUpParams,
  VerifyEmailCodeParams,
  ResendVerificationCodeParams,
  AuthResult,
} from '@/providers/auth/auth.interface'
export {
  signInSchema,
  signUpSchema,
  forgotPasswordSchema,
  verifyEmailSchema,
  type SignInFormData,
  type SignUpFormData,
  type ForgotPasswordFormData,
  type VerifyEmailFormData,
} from '@/providers/auth/auth.schemas'
