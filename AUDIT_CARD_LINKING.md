# Moov Customer Account + Card Linking — Implementation Audit

## Project Context
- **Frontend**: Nuxt 3 + Pinia + Tailwind, SSR enabled (`pages/`)
- **Backend for Nuxt**: Nitro server routes (`server/api/`)
- **CMS**: Strapi v4 (`backhouseofpeptides/`)
- **Payment Provider**: Moov (test mode only)
- **Goal of this stage**: Create a Moov individual customer account and securely link a card to a pending order without creating transfers or charging cards.

## What Was Implemented

### 1. Server-side API endpoints

#### `server/api/moov/card-session.post.ts`
- Validates `orderId` and `checkoutSessionToken` from the request body.
- Loads the pending order from Strapi.
- Rejects non-pending orders and invalid/missing checkout session tokens.
- Reuses the existing `moovCustomerAccountId` from the order if present.
- If missing, creates a new Moov **individual** account using the order's `customerName` + `email`.
- Stores the new `moovCustomerAccountId` on the order.
- Generates a short-lived Moov OAuth token scoped to `/accounts/{customerAccountID}/cards.write`.
- Sends the required `Origin` header based on `APP_URL` / forwarded headers.
- Returns: `{ ok, accessToken, customerAccountId, merchantAccountId, mode, expiresIn }`.

#### `server/api/moov/card-linked.post.ts`
- Validates the checkout session and order state.
- Calls `GET /accounts/{customerAccountID}/cards` to verify the browser-supplied `cardId` belongs to the customer account.
- Calls `GET /accounts/{customerAccountID}/payment-methods` to find the matching `card-payment` payment method.
- Saves `moovCardId`, `moovPaymentMethodId`, and `moovCardLinkedAt` to the Strapi order.
- Returns safe confirmation: `{ ok, orderNumber, cardLinked, paymentReady, paymentStatus }`.

#### `server/utils/moov.ts` (new)
- Moov API helpers: `getMoovConfig`, `getSiteOrigin`, `basicAuthHeader`, `moovHeaders`.
- `createMoovIndividualAccount`, `createMoovAccessToken`, `getAccountPaymentMethods`, `getAccountCards`.
- Checkout session token generation and SHA-256 hashing.
- `MOOV_API_VERSION` is set to `v2026.04.00` on all raw Moov API calls.

### 2. Strapi schema changes

File: `backhouseofpeptides/src/api/order/content-types/order/schema.json`

Added fields:
- `moovCardId` (string)
- `moovCardLinkedAt` (datetime)
- `checkoutSessionTokenHash` (string)

Removed field:
- `checkoutSessionToken` (plaintext token is no longer stored server-side; only its hash is kept)

**Action required**: Restart/rebuild Strapi to apply the new schema.

### 3. Checkout session security

- A 32-byte random hex token is generated server-side during `/api/checkout/prepare`.
- Only the SHA-256 hash is stored in Strapi.
- The plaintext token is returned to the browser once and passed to the payment page via URL query parameter `t`.
- On idempotent re-use of the same order, a fresh token/hash is generated and the hash is updated in Strapi.
- Server endpoints verify the hash before any Moov API calls.

### 4. Frontend changes

#### `pages/checkout/payment.vue` (new)
- Client-only page rendered inside `<ClientOnly>`.
- Loads `https://js.moov.io/v1` in `onMounted` only on the client.
- Fetches `/api/moov/card-session` to get the Moov customer account and OAuth token.
- Uses Moov **composable drops**:
  - `moov-form` (method POST, action `/accounts/{customerAccountID}/cards`)
  - `moov-text-input` for cardholder name and billing ZIP
  - `moov-card-number-input` for card number
  - `moov-expiration-date-input` for expiration date
  - `moov-card-security-code-input` for CVV
- Sends the Moov access token via the form's `requestHeaders` property (never through the Nuxt server).
- Card data is never stored in Vue state or logged.
- On `moov-form` `onSuccess`, sends the returned `cardID` to `/api/moov/card-linked`.
- Shows order number, total, Moov test mode notice, and a disabled submit state while processing.

#### `pages/checkout/card-success.vue` (new)
- Confirmation page shown after the card is linked.
- Payment processing is intentionally disabled (next stage).

#### `pages/checkout/success.vue`
- Replaced the disabled placeholder button with a real link to `/checkout/payment`.
- Link includes `orderId`, `orderNumber`, `totalCents`, and the checkout session token `t`.

#### `pages/checkout.vue`
- Updated type/interface and redirect URL to include `checkoutSessionToken`.

#### `nuxt.config.ts`
- Added `vue.compilerOptions.isCustomElement` so `moov-*` tags are treated as custom elements.

### 5. Test/audit artifacts

- `scripts/test-card-linking.mjs` — Creates a pending order, calls `/api/moov/card-session`, and verifies that a fake cardId is rejected by `/api/moov/card-linked`.
- `MOOV_CARD_LINKING_TESTS.md` — Browser-based manual test instructions with Moov test card numbers.
- This audit file.

## Package Added

`@moovio/moov-js` was installed in `package.json` / `node_modules`.

## Environment Variables Required

Server-side (Nuxt runtime):
```
MOOV_PUBLIC_KEY=
MOOV_SECRET_KEY=
MOOV_ACCOUNT_ID=
MOOV_MODE=test
MOOV_WEBHOOK_SECRET=
STRAPI_URL=
STRAPI_TOKEN=
APP_URL=           # Used for Origin header on Moov OAuth token requests
```

Public:
```
STRAPI_URL=        # already in public config
MOOV_MODE=test     # already in public config
APP_URL=           # already in public config
```

## Important Security Decisions

- No raw card data touches the Nuxt server or is stored in Vue state.
- Moov secrets and Strapi token are server-only.
- Browser only provides the Moov card ID; the server verifies ownership via Moov API before saving.
- No inventory decrement, no transfer creation, no charge at this stage.
- No plaintext checkout session token stored in Strapi.

## Known Issues / Notes

- The `run_command` tool was unable to execute from the project directory in the current IDE session, so `npm run build` and `npx nuxt typecheck` were not run locally. They should be verified before deploying.
- The `nuxt.config.ts` shows a TypeScript lint note about `nitro` not being in the InputConfig type, but this is a pre-existing false-positive and does not affect runtime.
- For the Moov OAuth token request to succeed, the Moov API key must allow the domain in the `Origin` header (`APP_URL`). Localhost is not accepted by Moov; use a tunnel or the deployed domain for testing.

## Next Steps

1. Run Strapi migrations/restart so the new Order fields exist.
2. Run `npm run build` or `npx nuxt typecheck` to catch TypeScript errors.
3. Run `node scripts/test-card-linking.mjs` from the Nuxt project root.
4. Test the browser flow using the instructions in `MOOV_CARD_LINKING_TESTS.md`.
5. Next isolated stage: payment capture / transfer creation.

# Shipping, Confirmations, and Shippo Integration — Implementation Audit

## Goal of This Stage

Add complete shipping information, mandatory purchaser confirmations, Shippo address validation, test shipping rates, rate selection, and final server-calculated totals. The payment/card section remains disabled until a shipping rate is selected and the total is recalculated server-side.

## What Was Implemented

### Checkout Session Security

- `server/utils/checkout-session.ts` sets a short-lived, HttpOnly, Secure (in production), SameSite=Strict, path `/api` cookie named `checkout_session`.
- The plaintext checkout session token is no longer kept in localStorage/sessionStorage; it is exchanged once and removed from the URL.
- `server/api/checkout/session.post.ts` performs a one-time exchange: validates the token hash against the order, sets the cookie, and returns safe order details.
- `server/utils/checkout-session.ts` provides a reusable `validateCheckoutSession` helper used by `/api/checkout/session`, `/api/shipping/rates`, `/api/shipping/select-rate`, `/api/moov/card-session`, and `/api/moov/card-linked`.
- All secure endpoints read the cookie first, and fall back to an explicit body token only during the transition period.

### Shippo Server Helper

- `server/utils/shippo.ts` is a server-only helper for `https://api.goshippo.com`.
- It uses `Authorization: ShippoToken ${token}` and JSON request/response handling.
- It does not log the token or return raw Shippo errors to the client.
- It includes a `toCentsFromDecimal` helper that converts Shippo decimal-string amounts to integer cents without floating-point rounding errors.

### Shippo Health Endpoint

- `server/api/shippo/health.get.ts` makes a harmless authenticated request and returns only `{ ok: true, mode: "test", connected: true }`.

### Order Schema Extensions

File: `backhouseofpeptides/src/api/order/content-types/order/schema.json`

Added fields:
- `shippingFirstName`, `shippingLastName`, `shippingPhone`, `shippingAddress1`, `shippingAddress2`
- `ageConfirmed`, `researchUseConfirmed`, `qualifiedPurchaserConfirmed`, `termsAccepted`, `verificationAcknowledged`
- `attestationsAcceptedAt`, `termsVersion`, `researchAttestationVersion`
- `shippoAddressToId`, `shippoShipmentId`, `shippoRateId`
- `shippingCarrier`, `shippingService`, `shippingDeliveryDays`, `shippingCostCents`, `discountCents`
- `shippingStatus` (enum: `not_quoted`, `quoted`, `selected`, `label_purchased`, `shipped`, `delivered`, `cancelled`)

### Shipping Rates Endpoint

`server/api/shipping/rates.post.ts`:
- Validates the secure checkout session.
- Loads the pending order and rejects unauthorized, expired, paid, or cancelled orders.
- Validates contact/shipping fields and requires all five confirmations as literal booleans.
- Creates and validates the destination address via Shippo.
- Uses the configured private ship-from address and default parcel (6x4x2 in, 6 oz).
- Creates a Shippo Shipment with `address_from`, `address_to`, `parcels`, and the order number as safe metadata.
- Reuses the existing Shippo shipment when the order is already `quoted` to prevent duplicate Shippo objects from double-clicks.
- Stores the normalized address and Shippo IDs (`shippoAddressToId`, `shippoShipmentId`).
- Sets `shippingStatus` to `quoted`, sets `attestationsAcceptedAt` server-side, and sets `termsVersion` and `researchAttestationVersion` to `2026-06-20`.
- Returns only sanitized USD rates with `rateId`, `carrier`, `service`, `serviceToken`, `amountCents`, `currency`, `deliveryDays`, `test`.

### Rate Selection Endpoint

`server/api/shipping/select-rate.post.ts`:
- Validates the checkout session and loads the order.
- Accepts only `rateId` from the browser.
- Retrieves the stored Shippo Shipment and verifies the rate belongs to it.
- Ignores any browser-supplied shipping amount, carrier, service, or total.
- Stores `shippoRateId`, `shippingCarrier`, `shippingService`, `shippingDeliveryDays`, `shippingCostCents`.
- Sets `shippingStatus` to `selected`.
- Recalculates `totalCents = subtotalCents + shippingCostCents + taxCents - discountCents` server-side and persists it.
- Returns only the verified selected rate and the updated totals.

### Frontend Checkout Changes

- `pages/checkout.vue` collects contact information (first/last name, email, phone), full US shipping address, and all five mandatory purchaser confirmations. Primary action is now **Get Shipping Rates**.
- `pages/checkout/success.vue` exchanges the query token for the cookie, removes the `t` parameter from the URL, fetches Shippo rates, lets the user select a rate, displays the updated subtotal/shipping/tax/final total, and only enables the payment button when `shippingStatus` is `selected`.
- `pages/checkout/payment.vue` relies on the cookie for session validation and displays a blocking message if shipping is not yet selected. The Moov card-linking flow is preserved.
- `server/api/moov/card-session.post.ts` and `server/api/moov/card-linked.post.ts` now use the shared `validateCheckoutSession` helper and can read the cookie or a fallback body token.

### Configuration

- `nuxt.config.ts` adds all Shippo environment variables to server-only `runtimeConfig` and exposes `shippoMode` publicly.
- `.env.example` documents Moov and Shippo environment variables.

### Testing Artifacts

- `MOOV_CARD_LINKING_TESTS.md` — browser-only test steps for the Moov card-linking flow.
- `SHIPPING_CHECKOUT_TESTS.md` — browser-only test steps for the secure checkout session, shipping address validation, Shippo rate selection, and payment gating.
- This audit file.

## Security and Idempotency Notes

- `SHIPPO_API_TOKEN` is never exposed to the browser or logged.
- Browser-supplied prices, shipping costs, and totals are ignored.
- No shipping label is purchased; no Moov transfer is created; the order is not marked paid; inventory is not reduced.
- Rate buttons disable while requests run; duplicate Shippo shipments are prevented by reusing the existing shipment when the order is already `quoted`.
- The pending-order idempotency behavior in `/api/checkout/prepare` is preserved.
- Existing Moov card-linking behavior is preserved.

## Action Required

1. Restart/rebuild Strapi so the new Order schema columns are live.
2. Run `npm run build` and `npx nuxt typecheck` to catch compile errors.
3. Deploy Strapi first, then Nuxt.
4. Test the browser flow using `SHIPPING_CHECKOUT_TESTS.md`.
