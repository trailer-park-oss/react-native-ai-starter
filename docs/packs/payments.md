# Payments Pack

## Modes
- `none`
- `stripe`

## Responsibilities
- Expose payments provider interface.
- Implement Stripe client flows when enabled.
- Define backend API contract expectations.

## Responsibility Split
### Stripe SDK (client)
- Provider initialization
- Payment sheet setup/presentation
- Wallet readiness checks
- Payment confirmation

### Backend API
- Create payment intents
- Product/price retrieval
- Subscription lifecycle operations

## Generated Files
- `src/providers/payments/payments.interface.ts`
- `src/providers/payments/usePayments.ts`
- `src/providers/payments/index.ts`
- `src/providers/payments/stripe/*` in stripe mode
- `src/features/payments/components/*` in stripe mode
- `app/(app)/paywall.tsx` and subscription settings in stripe mode

## Environment
- Requires `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Requires `EXPO_PUBLIC_API_URL`

## Acceptance Checklist
- [ ] No Stripe dependency/files in `none` mode.
- [ ] Backend API client is typed and explicit.
- [ ] UI uses provider-agnostic hook surface.
