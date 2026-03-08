# Prompt 4: Payments Provider Architecture & Stripe + Lemon Squeezy Implementation

You are a senior React Native engineer specializing in mobile payments. Your task is to implement the swappable payments provider system with both Stripe and Lemon Squeezy implementations for an Expo-based React Native starter kit.

## Context
This is Prompt 4 in a series of 5.

**From previous prompts (already complete):**
- Expo Router with `(onboarding)`, `(auth)`, `(app)` route groups.
- Payments provider interface at `src/providers/payments/payments.interface.ts`.
- Active provider selected via `starter.config.ts` (default: `stripe`).
- Auth is implemented — user is authenticated before reaching payment screens.
- Design tokens and ThemeProvider are available in `src/design-system/`.
- Zustand for client state, TanStack Query for server state.

Your job: implement the payments provider contract, both the Stripe and Lemon Squeezy adapters, reusable payment UI components, and example integration screens.

## Hard Requirements

### Payments Interface Contract
Refine and finalize `src/providers/payments/payments.interface.ts` with these capabilities:

```ts
interface PaymentsProvider {
  // Initialization
  initialize(config: PaymentsConfig): Promise<void>;

  // One-time payments
  createPaymentIntent(params: CreatePaymentParams): Promise<PaymentIntent>;
  confirmPayment(paymentIntentId: string): Promise<PaymentResult>;

  // Subscriptions
  getProducts(): Promise<Product[]>;
  getSubscriptionStatus(): Promise<SubscriptionStatus | null>;
  createSubscription(priceId: string): Promise<SubscriptionResult>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  restorePurchases(): Promise<SubscriptionStatus | null>;

  // Payment sheet / checkout
  presentPaymentSheet(params: PaymentSheetParams): Promise<PaymentResult>;
}
```

Define all supporting types: `PaymentsConfig`, `CreatePaymentParams`, `PaymentIntent`, `PaymentResult`, `Product`, `Price`, `SubscriptionStatus`, `SubscriptionResult`, `PaymentSheetParams`, `PaymentsError`.

### Stripe Implementation
1. Implement at `src/providers/payments/stripe/`.
2. Use `@stripe/stripe-react-native` for the native payment sheet.
3. Map every `PaymentsProvider` method to Stripe SDK calls.
4. Handle Stripe-specific concerns:
   - Publishable key + merchant ID configuration
   - Payment sheet initialization and presentation
   - Apple Pay / Google Pay readiness checks
   - Stripe customer creation (note: this typically requires a backend — document what the required API endpoints are, but stub them with typed fetch calls)
5. Include typed API client for required backend endpoints:
   - `POST /payments/create-intent` — creates payment intent, returns client secret
   - `POST /payments/create-subscription` — creates subscription, returns client secret
   - `GET /payments/products` — lists available products/prices
   - `GET /payments/subscription-status` — returns current user's subscription
   - `POST /payments/cancel-subscription` — cancels subscription

### Lemon Squeezy Implementation
1. Implement at `src/providers/payments/lemonsqueezy/`.
2. Lemon Squeezy doesn't have a native mobile SDK, so the approach is:
   - Use in-app WebView checkout for payment collection
   - Use Lemon Squeezy API for subscription management and status checks
3. Map `PaymentsProvider` methods:
   - `presentPaymentSheet` -> open Lemon Squeezy checkout URL in a WebView modal
   - `getProducts` -> fetch from Lemon Squeezy API
   - `getSubscriptionStatus` -> fetch from Lemon Squeezy API
   - `createSubscription` -> redirect to checkout URL
   - `cancelSubscription` -> API call
   - `restorePurchases` -> look up subscriptions by customer email
4. Include typed API client for Lemon Squeezy endpoints.
5. Include WebView checkout component that handles success/failure redirects.

### Payments Hook
1. Create `src/providers/payments/usePayments.ts` that:
   - Returns the `PaymentsProvider` interface.
   - Is the ONLY payments API that screens import.
   - Internally resolves the active provider from config.

### Payment UI Components
Build reusable components at `src/features/payments/components/`:

1. **PricingCard** — displays a product/plan with name, price, features list, CTA button.
2. **SubscriptionBadge** — shows current plan status (active, trial, expired, none).
3. **PaymentButton** — handles loading state, disabled state, and triggers payment flow.

### Example Screens
1. **Paywall / Pricing** (`app/(app)/paywall.tsx`)
   - Display available plans using PricingCard components
   - Handle plan selection and payment flow
   - Show current subscription status if subscribed
   - "Restore purchases" button

2. **Subscription Management** (`app/(app)/settings/subscription.tsx`)
   - Current plan details
   - Cancel subscription option (with confirmation)
   - Upgrade/downgrade options

### Error Handling
1. Define `PaymentsError` with typed codes:
   - `PAYMENT_FAILED`, `PAYMENT_CANCELLED`, `CARD_DECLINED`, `SUBSCRIPTION_EXISTS`, `NO_ACTIVE_SUBSCRIPTION`, `NETWORK_ERROR`, `PROVIDER_ERROR`, `UNKNOWN`
2. Both adapters must catch provider-specific errors and map to `PaymentsError` codes.
3. Payment screens must display user-friendly messages per error code.

### Environment Variables
- Stripe: `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Lemon Squeezy: `EXPO_PUBLIC_LEMONSQUEEZY_STORE_ID`, `EXPO_PUBLIC_LEMONSQUEEZY_API_KEY`
- Backend API URL: `EXPO_PUBLIC_API_URL`
- Add runtime validation for required keys based on active provider.

## Output Format (Required)

### 1. Final Payments Interface
- `src/providers/payments/payments.interface.ts` — all types and the provider interface.

### 2. Stripe Adapter
- `src/providers/payments/stripe/stripe-adapter.ts` — full implementation.
- `src/providers/payments/stripe/stripe-provider.tsx` — Stripe's `<StripeProvider>` wrapper.
- `src/providers/payments/stripe/stripe-api.ts` — typed backend API client.
- `src/providers/payments/stripe/index.ts` — barrel export.

### 3. Lemon Squeezy Adapter
- `src/providers/payments/lemonsqueezy/lemonsqueezy-adapter.ts` — full implementation.
- `src/providers/payments/lemonsqueezy/lemonsqueezy-api.ts` — typed API client.
- `src/providers/payments/lemonsqueezy/CheckoutWebView.tsx` — WebView checkout component.
- `src/providers/payments/lemonsqueezy/index.ts` — barrel export.

### 4. Payments Hook
- `src/providers/payments/usePayments.ts` — full implementation.

### 5. Payments Barrel
- `src/providers/payments/index.ts` — re-exports based on `starter.config.ts`.

### 6. Reusable Payment Components (all 3)
- Full component code using design tokens.

### 7. Example Screens (both)
- Full screen code using the payments hook and reusable components.
- Include loading states, error handling, empty states.

### 8. Backend API Contract
- OpenAPI-style specification for the required backend endpoints (request/response shapes).
- Note which endpoints are needed for Stripe vs. Lemon Squeezy vs. both.

### 9. Error Mapping Tables
- Table 1: Stripe Error -> PaymentsError Code -> User Message.
- Table 2: Lemon Squeezy Error -> PaymentsError Code -> User Message.

### 10. Adding a New Payments Provider Guide
- Step-by-step showing how to add a new provider (e.g., RevenueCat).

Be concrete. All code must be valid TypeScript/TSX. Use realistic SDK calls. Stub backend calls with typed fetch — do not use pseudocode.
