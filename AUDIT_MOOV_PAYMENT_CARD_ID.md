# Moov Payment / Card ID Failure — Audit for ChatGPT

**Date:** 2026-07-27  
**Product:** Quantum Bio Peptides  
**Repos:** `fronthouseofpeptides` (Nuxt 3) + `backhouseofpeptides` (Strapi 4)  
**Goal of this audit:** Diagnose why card payment fails after Moov form submit with an error about missing `cardID` / card confirmation, so another model (ChatGPT) can propose a precise fix.

---

## 1. Reported symptom

User reports the **same error** as before when clicking pay / submitting the Moov card form.

### Historical error (older composable-drop code)
```
Card linked confirmation error: Card linking did not return a card ID.
```

That exact string came from previous `handleCardSuccess` logic that only checked:
```ts
const cardId = response?.cardID
if (!cardId) throw new Error('Card linking did not return a card ID.')
```

### Current local code error string (after recent rewrite)
```
Payment provider did not return a usable card reference. Please try again.
```
Logged as:
```
Payment confirmation error: ...
```

**Important:** If production still shows the **old** wording (`Card linking did not return a card ID`), the latest `pages/checkout/payment.vue` is likely **not deployed**. Ask the user which exact UI string they see.

---

## 2. Intended business flow (current stage)

1. Cart → `/checkout` (prepare order + Shippo rates + select rate)
2. `/checkout/payment?orderId=N`
3. Server `POST /api/moov/card-session`:
   - validates checkout session cookie
   - requires `shippingStatus === 'selected'`
   - creates/reuses Moov **individual** customer account
   - returns scoped OAuth token (`/accounts/{customerAccountID}/cards.write`)
   - returns order money fields (subtotal/shipping/tax/total)
4. Browser loads Moov Drop, user enters card details (PCI data never hits Nuxt)
5. Moov success → extract `cardID`
6. Browser `POST /api/moov/card-linked` with `{ orderId, cardId }`
7. Server verifies card on Moov account + finds `card-payment` payment method
8. Saves `moovCardId`, `moovPaymentMethodId`, `moovCardLinkedAt` on Strapi order
9. UI shows: **“Card verified. Payment submission is not enabled yet.”**

### Explicitly NOT implemented yet
- No `/api/moov/create-transfer`
- No charge / transfer
- No `paymentStatus = paid`
- No inventory decrement
- No Shippo label purchase

---

## 3. Current frontend implementation

**File:** `fronthouseofpeptides/pages/checkout/payment.vue`

### Moov UI choice
Recently switched from composable drops (`moov-form` + inputs) to prebuilt:
```html
<moov-card-link ref="cardLinkRef"></moov-card-link>
```

Configured in JS:
```ts
drop.oauthToken = accessToken
drop.accountID = customerAccountId          // Moov customer account
drop.merchantAccountID = merchantAccountId  // platform/merchant account from MOOV_ACCOUNT_ID
drop.cardOnFile = true
drop.holderName = customerName (optional)
drop.inputStyle = { ... }
drop.onSuccess = handleCardSuccess
drop.onError = handleCardError
drop.submit()
```

Script loaded from CDN: `https://js.moov.io/v1`  
Nuxt treats `moov-*` as custom elements via `nuxt.config.ts` `compilerOptions.isCustomElement`.

### Card ID extraction (current)
```ts
function extractMoovCardId(payload: any): string | null {
  return (
    payload?.cardID ??
    payload?.cardId ??
    payload?.id ??
    payload?.detail?.cardID ??
    payload?.detail?.cardId ??
    payload?.detail?.id ??
    payload?.detail?.result?.cardID ??
    payload?.detail?.result?.cardId ??
    payload?.detail?.data?.cardID ??
    payload?.detail?.data?.cardId ??
    payload?.card?.cardID ??
    payload?.card?.cardId ??
    null
  )
}
```

Dev/test-only shape log (no secrets / PAN / CVV):
```ts
console.info('[moov-payment] success payload shape', { topKeys, detailKeys })
```
Only runs when `MOOV_MODE=test` **and** `import.meta.dev`.

### After successful card-linked
Sets `paymentStage = 'verified'` and shows “Payment submission is not enabled yet.”  
Does **not** call transfer creation.

---

## 4. Current backend endpoints

### `POST /api/moov/card-session`
**File:** `server/api/moov/card-session.post.ts`

- Auth: checkout session cookie (HttpOnly `checkout_session`) or body token fallback
- Creates Moov individual account if `moovCustomerAccountId` missing
- OAuth token via client_credentials with `Origin: APP_URL` host
- Returns:
  - `accessToken`, `customerAccountId`, `merchantAccountId`
  - order summary cents + shipping metadata

### `POST /api/moov/card-linked`
**File:** `server/api/moov/card-linked.post.ts`

Body: `{ orderId, cardId }`

Steps:
1. Validate checkout session
2. `GET /accounts/{customerAccountId}/cards` — require matching `cardID`
3. `GET /accounts/{customerAccountId}/payment-methods` — require:
   ```
   paymentMethodType === 'card-payment' && pm.card?.cardID === cardId
   ```
4. Persist to Strapi:
   - `moovCardId`
   - `moovPaymentMethodId`
   - `moovCardLinkedAt`
5. Return `{ ok, orderNumber, cardVerified: true, paymentReady: true, paymentStatus: 'pending' }`

### Moov helpers
**File:** `server/utils/moov.ts`
- API version header: `X-Moov-Version: v2026.04.00`
- Base URL: `https://api.moov.io`

### Missing
- `server/api/moov/create-transfer.post.ts` — **does not exist**

---

## 5. Likely root causes (ranked)

### A. Moov `onSuccess` payload shape ≠ what we parse (MOST LIKELY for “no card ID”)
Docs say `onSuccess` receives a result containing `cardID`, but in practice Moov Drops sometimes deliver:
- a plain card object `{ cardID, ... }`
- a CustomEvent-like object where data is in `.detail`
- a nested structure (`detail.result`, `detail.data`, etc.)
- occasionally a string ID

If the live payload nests differently from `extractMoovCardId`, extraction returns `null` → user-facing failure **before** `/api/moov/card-linked` is called.

**Evidence needed from browser console:**
1. Exact error text
2. Whether `[moov-payment] success payload shape` logged (dev+test only)
3. Network tab: did `POST /api/moov/card-linked` fire?
   - If **no** request → frontend extraction failed
   - If **yes** request → backend verification failed (different error)

### B. Production not running latest payment.vue
Old error string still present in user’s report strongly suggests stale deploy/CDN/cache.

### C. Vue ref may not point at the real custom element
`ref="cardLinkRef"` on `<moov-card-link>` should be the HTMLElement because of `isCustomElement`, but if Vue wraps it, `drop.onSuccess = ...` / `drop.submit()` may not bind to Moov’s API.

**Check:** In console after load:
```js
document.querySelector('moov-card-link')
// compare to Vue ref behavior
```

Safer pattern often used:
```ts
const el = cardLinkRef.value?.$el ?? cardLinkRef.value
// or always:
const el = document.querySelector('moov-card-link')
```

### D. Success callback never fires / wrong callback property
If Moov expects `addEventListener('success', ...)` or `onsuccess` differently from `onSuccess`, our handler may receive unexpected args (or an Event whose useful data is deeper).

### E. Even with cardID, `/api/moov/card-linked` can fail next
Especially:
- **Payment method not ready yet** — prebuilt `moov-card-link` may not send `X-Wait-For: payment-method` (that header was only on previous composable `moov-form` requestHeaders). Then:
  ```
  Card payment method could not be verified.
  ```
- Card exists but list cards returns different casing / structure
- Checkout session cookie missing/expired on production domain mismatch

### F. OAuth Origin / domain mismatch
Token is minted with `Origin` from `APP_URL`. If user pays on a different HTTPS host than `APP_URL`, Drops can fail earlier (usually error callback, not success-without-id). Still verify `APP_URL` matches the browser origin.

### G. HTTPS / CSP
`cards.moov.io` requires HTTPS parent (`frame-ancestors 'self' https://*`). Localhost HTTP is blocked. User said they can use the form on production HTTPS, so likely past this for the current report — but still relevant for local.

---

## 6. Environment contract (frontend)

Private runtimeConfig (server-only):
```
MOOV_PUBLIC_KEY
MOOV_SECRET_KEY
MOOV_ACCOUNT_ID
MOOV_MODE=test|production
MOOV_WEBHOOK_SECRET
STRAPI_TOKEN
SHIPPO_API_TOKEN
...
```

Public:
```
STRAPI_URL
APP_URL          # must be the HTTPS origin users use
MOOV_MODE
SHIPPO_MODE
```

Checkout session cookie:
- name: `checkout_session`
- HttpOnly, SameSite=strict, path `/api`, ~15 min

---

## 7. Security constraints (do not violate when fixing)

- Never send PAN/CVV to Nuxt/Strapi
- Never put Moov OAuth token in localStorage/sessionStorage
- Never mark order `paid` from client success alone
- Never create transfer in the browser
- Never log secrets, full OAuth tokens, PAN, CVV
- Safe logging only: key names / shapes

---

## 8. Files to inspect / edit

| File | Role |
|------|------|
| `pages/checkout/payment.vue` | Moov Drop UI + success/error handling + cardID extract |
| `server/api/moov/card-session.post.ts` | OAuth + customer account + order summary |
| `server/api/moov/card-linked.post.ts` | Verify card + payment method + persist IDs |
| `server/utils/moov.ts` | Moov API helpers / version |
| `server/utils/checkout-session.ts` | Cookie + hash validation |
| `nuxt.config.ts` | `moov-*` custom elements + runtimeConfig |
| *(missing)* `server/api/moov/create-transfer.post.ts` | Next stage |

---

## 9. Moov docs expectations (as used by this project)

### Prebuilt Drop `moov-card-link`
- Props: `oauthToken`, `accountID`, optional `merchantAccountID`, `cardOnFile`, `holderName`, `billingAddress`, `inputStyle`, `onSuccess`, `onError`
- `onSuccess(result)`: result should include `cardID`
- Then server should locate payment method for transfers

### Link card API
`POST /accounts/{accountID}/cards` returns card object with `cardID`.  
Optional header `X-Wait-For: payment-method` waits until payment methods exist.

**Gap:** current `moov-card-link` integration does **not** explicitly set wait-for payment-method behavior. That can cause a second failure mode after cardID is fixed.

---

## 10. Recommended diagnostic steps (for ChatGPT / engineer)

1. Confirm exact on-screen / console error string (old vs new).
2. Confirm deploy commit includes latest `payment.vue`.
3. In browser Network:
   - `POST /api/moov/card-session` → 200?
   - Moov `POST https://api.moov.io/accounts/.../cards` → 200 or 422?
   - `POST /api/moov/card-linked` → present? status? response body?
4. Temporarily (test only) broaden safe shape logging:
   - `typeof payload`
   - `payload?.constructor?.name`
   - recursive key paths that contain `card` / `id` (values redacted except UUID-looking cardID)
5. If Moov cards POST succeeds but frontend gets no cardID:
   - normalize success handler to accept Event/CustomEvent:
     ```ts
     const data = payload?.detail ?? payload
     const cardId = extractMoovCardId(data) || extractMoovCardId(payload)
     ```
   - also try `document.querySelector('moov-card-link')` instead of Vue ref
6. If card-linked fails on payment method:
   - after cardID obtained, poll Moov payment-methods server-side for a few seconds
   - or use API path that waits for payment-method creation
7. Only after card verification is solid: implement server `create-transfer` and webhook → `paid`.

---

## 11. Suggested fix directions (do not implement blindly)

### Fix 1 — Harden success payload normalization
```ts
function normalizeMoovSuccessPayload(payload: any) {
  if (!payload) return null
  if (typeof payload === 'string') return { cardID: payload }
  if (payload instanceof CustomEvent) return payload.detail
  if (payload?.detail) return payload.detail
  return payload
}
```
Then `extractMoovCardId(normalizeMoovSuccessPayload(payload))`.

### Fix 2 — Resolve Drop element robustly
```ts
function getCardLinkEl() {
  const refVal = cardLinkRef.value
  if (refVal && typeof refVal.submit === 'function') return refVal
  return document.querySelector('moov-card-link')
}
```

### Fix 3 — Server-side resilience in `card-linked`
If card exists but payment method missing, retry payment-methods GET with short backoff (e.g. 5× 400ms) before failing.

### Fix 4 — Keep customer copy as payment language
Internal logs may say “card linked”; UI must continue saying Pay / Card verified / Processing payment.

---

## 12. What success looks like

1. User clicks **Pay $XX.XX**
2. Moov accepts test card
3. Frontend extracts UUID `cardID`
4. `POST /api/moov/card-linked` returns 200
5. Strapi order has `moovCardId` + `moovPaymentMethodId`
6. UI: **Card verified. Payment submission is not enabled yet.**
7. `paymentStatus` remains `pending` until transfer stage exists

---

## 13. Open questions for the user / ChatGPT

1. Exact current error string?
2. Production URL + is latest frontend deployed?
3. Does Network show `/api/moov/card-linked`?
4. Console: any `[moov-payment] success payload shape` log? What keys?
5. Moov dashboard: does a card appear on the customer account after the attempt?
6. Are `APP_URL` and browser origin identical (scheme + host)?

---

## 14. One-paragraph summary for ChatGPT

Quantum Bio Peptides’ Nuxt checkout reaches Moov card entry on `/checkout/payment`, mints a scoped Moov OAuth token via `/api/moov/card-session`, and uses the prebuilt `moov-card-link` Drop so PAN/CVV never touch the server. After Drop success, the frontend must extract `cardID` and call `/api/moov/card-linked`, which verifies the card and `card-payment` payment method in Moov, then stores IDs on the Strapi order without charging. The recurring failure is that the success handler cannot find a `cardID` in the Moov callback payload (historically: “Card linking did not return a card ID”), and/or production may still be on old code; a secondary risk is payment-method not being ready immediately after link because wait-for-payment-method is not wired on the prebuilt Drop. There is no transfer endpoint yet, so even a perfect card verification must leave the order `pending` and show that payment submission is not enabled.
