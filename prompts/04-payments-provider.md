# Prompt 4: Payments Pack - Provider Contract & Stripe Implementation

You are a senior React Native mobile payments engineer. Your task is to define the **payments feature pack** for the CLI starter.

## Context
Prompt 1 defined core generation and pack contracts. This prompt applies when `--payments` is selected.

## Payments Modes
- `none`: no payments SDK/dependencies/files generated.
- `stripe`: generate Stripe-backed payments layer + reusable UI + example screens.

## Hard Requirements

### Pack Enablement Rules
1. If mode is `none`:
   - do not install Stripe dependency
   - do not generate payments provider/screens/components
2. If mode is `stripe`:
   - install Stripe dependency and generate full pack output

### Payments Interface Contract
Refine `src/providers/payments/payments.interface.ts` with:

```ts
interface PaymentsProvider {
  initialize(config: PaymentsConfig): Promise<void>

  createPaymentIntent(params: CreatePaymentParams): Promise<PaymentIntent>
  confirmPayment(paymentIntentId: string): Promise<PaymentResult>

  getProducts(): Promise<Product[]>
  getSubscriptionStatus(): Promise<SubscriptionStatus | null>
  createSubscription(priceId: string): Promise<SubscriptionResult>
  cancelSubscription(subscriptionId: string): Promise<void>
  restorePurchases(): Promise<SubscriptionStatus | null>

  presentPaymentSheet(params: PaymentSheetParams): Promise<PaymentResult>
}
```

Define: `PaymentsConfig`, `CreatePaymentParams`, `PaymentIntent`, `PaymentResult`, `Product`, `Price`, `SubscriptionStatus`, `SubscriptionResult`, `PaymentSheetParams`, `PaymentsError`.

### Responsibility Split (Critical)
1. **Stripe SDK responsibilities (client):**
   - provider initialization
   - payment sheet init/present
   - Apple Pay / Google Pay readiness checks
   - payment confirmation handling
2. **Backend API responsibilities:**
   - create intent
   - create/cancel subscription
   - list products/prices
   - subscription status
3. Implement typed backend client in `stripe-api.ts` for:
   - `POST /payments/create-intent`
   - `POST /payments/create-subscription`
   - `GET /payments/products`
   - `GET /payments/subscription-status`
   - `POST /payments/cancel-subscription`

### Payments API Surface
1. `src/providers/payments/usePayments.ts` is the only API screens import.
2. `src/providers/payments/index.ts` resolves implementation via config/resolver pattern.

### Reusable Components (`stripe` mode)
- `PricingCard`
- `SubscriptionBadge`
- `PaymentButton`

### Example Screens (`stripe` mode)
1. `app/(app)/paywall.tsx`
2. `app/(app)/settings/subscription.tsx`

### Error Handling
Use typed codes:
- `PAYMENT_FAILED`, `PAYMENT_CANCELLED`, `CARD_DECLINED`, `SUBSCRIPTION_EXISTS`, `NO_ACTIVE_SUBSCRIPTION`, `NETWORK_ERROR`, `PROVIDER_ERROR`, `UNKNOWN`

Map Stripe/backend errors to these codes and show user-friendly messages.

### Environment
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_API_URL`
- Runtime validation required.

## Output Format (Required)

### 1. Payments Pack Mode Matrix
- `none` vs `stripe` dependencies/files.

### 2. Final Interface
- `src/providers/payments/payments.interface.ts` full code.

### 3. Stripe Adapter Files
- `stripe-adapter.ts`, `stripe-provider.tsx`, `stripe-api.ts`, `index.ts`.

### 4. Payments Resolver + Hook
- `src/providers/payments/index.ts`
- `src/providers/payments/usePayments.ts`

### 5. Reusable Components
- all 3 full files.

### 6. Example Screens
- both full files.

### 7. Backend API Contract
- OpenAPI-style request/response shapes.

### 8. Error Mapping Table
- Source Error | PaymentsError Code | User Message.

### 9. Add-New-Provider Guide
- 5-7 concrete steps.

### 10. Pack Invariants
- prove no payments deps/files in `none` mode.

Be concrete. All code must be valid TypeScript/TSX.
