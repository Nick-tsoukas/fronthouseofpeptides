# AUDIT: Quantum Bio Peptides — `POST /api/moov/create-transfer` returns 502

**Date:** 2026-07-28  
**Site:** https://quantumbiopeptides.com  
**Mode:** Moov test (`MOOV_MODE=test`)  
**Symptom:** Card verification succeeds; `POST /api/moov/create-transfer` returns **502 Bad Gateway**. Browser shows:

```
POST https://quantumbiopeptides.com/api/moov/create-transfer 502 (Bad Gateway)
Payment confirmation error: FetchError: [POST] "/api/moov/create-transfer": 502
```

**Ask for ChatGPT:** Identify the most likely root cause of this 502, what server logs / Network response body to inspect next, and the smallest code or Moov Dashboard fix. Do not redesign the checkout architecture.

---

## 1. What already works

Confirmed working on production (test mode):

1. Cart → checkout → Shippo rates → select rate
2. Order created in Strapi at `POST /api/checkout/prepare` (`status=awaiting_payment`, `paymentStatus=pending`)
3. Payment page loads order summary (order number, subtotal, shipping, total)
4. Moov customer account creation
5. Moov secure card entry (`moov-card-link` Drop)
6. `POST /api/moov/card-linked` succeeds and saves:
   - `moovCardId`
   - `moovPaymentMethodId`
   - `moovCardLinkedAt`
7. Immediately after card-linked, client calls `POST /api/moov/create-transfer` → **502**

So the failure is **after card verification**, during server-side transfer creation (or one of the checks immediately before/after the Moov transfer API call).

---

## 2. Architecture (relevant parts)

| Layer | Role |
|---|---|
| Nuxt 3 BFF (`fronthouseofpeptides`) | All commerce logic; Moov/Shippo/Strapi server calls |
| Strapi 4 (`backhouseofpeptides`) | CRUD store for Products, Variants, Orders, Order Items |
| Moov | Card vault + transfers (test mode) |
| Shippo | Shipping rates only (no label purchase yet) |

**Payment click sequence (client):**

1. Submit Moov Drop → get `cardID`
2. `POST /api/moov/card-linked` `{ orderId, cardId }`
3. `POST /api/moov/create-transfer` `{ orderId }`
4. Poll `GET /api/checkout/status` until `paymentStatus=paid` (via Moov webhook)

**Auth:** HttpOnly `checkout_session` cookie (path `/api`). Session validated by hashing cookie and matching `Order.checkoutSessionTokenHash`.

**Production Strapi (from `.env.example` comment):** `https://api.quantumbiopeptides.com`  
**Production app:** `https://quantumbiopeptides.com`

---

## 3. Exact Moov transfer request our code sends

File: `server/utils/moov.ts` → `createMoovTransfer`

```
POST https://api.moov.io/accounts/{MOOV_ACCOUNT_ID}/transfers
Authorization: Basic base64(MOOV_PUBLIC_KEY:MOOV_SECRET_KEY)
X-Moov-Version: v2026.04.00
X-Idempotency-Key: {Order.idempotencyKey OR "transfer-{orderNumber}"}
Content-Type: application/json

{
  "source": { "paymentMethodID": "<Order.moovPaymentMethodId card-payment>" },
  "destination": { "paymentMethodID": "<merchant moov-wallet paymentMethodID>" },
  "amount": { "currency": "USD", "value": <Order.totalCents integer> },
  "description": "<Order.orderNumber>",
  "metadata": {
    "orderId": "<strapi order id>",
    "orderNumber": "<QBP-...>"
  }
}
```

Notes:

- Amount `value` is **integer cents** (e.g. 7558 for $75.58).
- Destination is found by listing merchant payment methods and picking `paymentMethodType === "moov-wallet"`.
- Source is the customer account’s `card-payment` method saved by card-linked.
- No `X-Wait-For` header is currently sent.
- Idempotency key is **not** forced to UUID format; it uses the order’s `idempotencyKey` string.

---

## 4. Every path that returns HTTP 502 from create-transfer

File: `server/api/moov/create-transfer.post.ts`

| # | Condition | Client message |
|---|---|---|
| A | Existing `moovTransferId` present and `getMoovTransfer` fails | `Could not retrieve existing payment. Please try again.` |
| B | Strapi order-items fetch fails | `Could not load order items. Please try again.` |
| C | Moov get customer payment methods fails | `Could not verify card payment method.` |
| D | Moov get merchant payment methods fails | `Could not load merchant payment methods.` |
| E | `createMoovTransfer` throws (Moov non-2xx) | `Payment provider rejected the transfer: {safeDetail}` **or** `Could not submit payment. Please try again.` |
| F | Moov success but no `transferID` in response | `Payment provider did not return a transfer ID.` |
| G | Transfer created but Strapi PUT fails (even after retry without `paymentInitiatedAt`) | `Payment started but order could not be updated...` |

**Most likely for a first-time Pay after successful card-linked:** **E** (Moov rejects transfer) or **C/D** (payment method list fails) or **B** (Strapi items).

**Less likely first-time:** A (no transfer id yet), F, G.

**Not 502 (would be 400/500):** missing Moov IDs, totals mismatch, shipping not selected, merchant wallet missing (500).

---

## 5. Steps create-transfer performs before calling Moov transfers API

1. Validate checkout session cookie + load order fields from Strapi
2. Reject if cancelled / paid / wrong status / shipping not selected / missing Moov IDs / invalid total
3. If `moovTransferId` already set and paymentStatus ≠ failed → retrieve existing transfer (idempotent)
4. Load order items from Strapi with `populate[variant][populate]=product`
5. Recalculate product subtotal from current variant prices; must equal stored `subtotalCents`
6. Soft-verify Shippo rate (non-fatal if shipment/rates missing); hard-fail only if rate found and cents differ
7. Recalculate `totalCents = subtotal + shipping + tax - discount`; must equal stored `totalCents`
8. Load customer payment methods; verify `moovPaymentMethodId` is `card-payment` and usable
9. Load merchant (`MOOV_ACCOUNT_ID`) payment methods; find `moov-wallet`
10. `POST /accounts/{MOOV_ACCOUNT_ID}/transfers`
11. Save `moovTransferId`, `paymentStatus=processing`, `paymentProvider=moov`, `paymentMethod=card`, `paymentInitiatedAt`

---

## 6. Known prior bugs already fixed (context for ChatGPT)

1. **Spinner hang / `postMessage` null:** Payment UI unmounted `<moov-card-link>` during submit. Fixed by keeping Drop mounted.
2. **Retry `POST /accounts/undefined/cards` 401:** After prepare/processing UI remounted Drop without `accountID`. Fixed by keeping Drop mounted + rebinding `accountID`/`oauthToken` on submit; retry after successful card-linked skips Drop and only calls create-transfer.
3. **Orders “not in admin”:** Orders are created at prepare as `awaiting_payment` / `pending`, not paid. Owner/Strapi must use the same `STRAPI_URL` as Nuxt.

These do **not** explain the current first-attempt create-transfer 502 by themselves, but retries can confuse diagnostics if an order already has partial Moov fields.

---

## 7. Environment / Moov configuration checklist

Production Nuxt must have (private runtimeConfig):

```
MOOV_PUBLIC_KEY=...
MOOV_SECRET_KEY=...
MOOV_ACCOUNT_ID=...          # merchant/platform account used in /accounts/{id}/transfers
MOOV_MODE=test
MOOV_WEBHOOK_SECRET=...      # needed later for paid webhook; NOT required for create-transfer 502
STRAPI_URL=https://api.quantumbiopeptides.com   # expected prod
STRAPI_TOKEN=...
APP_URL=https://quantumbiopeptides.com
```

**Critical Moov Dashboard questions:**

1. Does `MOOV_ACCOUNT_ID` have **transfers.write** / card acceptance capabilities in **test** mode?
2. Does the merchant account have a **moov-wallet** payment method?
3. Can card-payment → moov-wallet transfers be created for this account in test?
4. Are API keys test-mode keys matching the test account?
5. Is `X-Moov-Version: v2026.04.00` compatible with the account’s API behavior?

---

## 8. What to inspect RIGHT NOW (highest signal)

### A. Browser Network tab — Response body of create-transfer

Open DevTools → Network → failed `create-transfer` → Response JSON.

Look for `statusMessage` / `message` / `data.message`.  
Our handler returns different messages for A–G above. **That message identifies the failing step.**

If message is:
- `Payment provider rejected the transfer: ...` → Moov API rejected; use the detail text
- `Could not submit payment...` → Moov failed but safeDetail empty (check server logs for full Moov body)
- `Could not verify card payment method.` → customer PM list failed
- `Could not load merchant payment methods.` → merchant PM list failed
- `Could not load order items...` → Strapi order-items failed
- `Payment started but order could not be updated...` → Moov succeeded; Strapi write failed

### B. Server logs on Nuxt host

Search for:

```
[checkout-trace] create-transfer:
Moov create transfer failed
Moov customer payment method lookup failed
Moov merchant payment methods failed
Order items load failed
Failed to save Moov transfer
```

Safe logs include: `orderId`, `orderNumber`, `strapiHost`, `paymentStatus`, booleans for Moov IDs, `moovStatus`.  
They must **not** include secrets, PAN, CVV, OAuth tokens.

### C. Strapi order record for the failing order number

Confirm fields populated after card-linked:

- `moovCustomerAccountId`
- `moovCardId`
- `moovPaymentMethodId`
- `moovTransferId` (should still be empty if transfer never created)
- `paymentStatus` (should still be `pending`)
- `totalCents`, `subtotalCents`, `shippingCostCents`
- `shippoRateId`, `shippingStatus=selected`
- `status=awaiting_payment`

### D. Manual Moov API test (server-side, with same keys)

1. `GET /accounts/{MOOV_ACCOUNT_ID}/payment-methods` → confirm a `moov-wallet` exists  
2. `GET /accounts/{moovCustomerAccountId}/payment-methods` → confirm `card-payment` with matching `paymentMethodID`  
3. Replay the same `POST .../transfers` body with Basic auth

---

## 9. Hypotheses ranked (most → least likely)

1. **Moov rejects transfer (capabilities / source-destination combo / scopes)**  
   Card link works with Drop OAuth (`cards.write`), but server Basic-auth transfer needs `transfers.write` and card-collecting capability on the merchant account. Classic split: link succeeds, transfer 4xx → we map to 502.

2. **Merchant has no usable `moov-wallet` payment method**  
   Would normally return **500** (`Merchant wallet payment method is not available`), unless payment-methods list itself fails → **502** path D.

3. **Customer `card-payment` method not found / not ready yet**  
   card-linked retries PM lookup 5×400ms and saves ID. create-transfer re-fetches PMs; if list call fails → 502 C. If not found → 400 (not 502).

4. **Strapi order-items populate fails in production**  
   Filter/populate query issue or token permissions → 502 B.

5. **Totals mismatch**  
   Would be **400**, not 502 — unless misclassified (currently not).

6. **Idempotency key format**  
   Possible Moov rejection if key invalid; would show in Moov error detail (path E).

7. **Strapi schema missing `paymentInitiatedAt`**  
   Code retries without that field; only 502 if both PUTs fail **after** Moov success (path G). Check whether `moovTransferId` got saved despite UI 502.

---

## 10. Important diagnostic: did Moov actually create a transfer?

If Strapi order has `moovTransferId` after the 502, Moov succeeded and Strapi save failed (path G).  
If `moovTransferId` is still empty, Moov never accepted the transfer (or failed before the POST).

Also check Moov Dashboard → Transfers for a transfer with description = order number.

---

## 11. Code references (repo paths)

| Path | Purpose |
|---|---|
| `fronthouseofpeptides/server/api/moov/create-transfer.post.ts` | Endpoint returning 502 |
| `fronthouseofpeptides/server/utils/moov.ts` | `createMoovTransfer`, PM helpers, `MOOV_API_VERSION=v2026.04.00` |
| `fronthouseofpeptides/server/api/moov/card-linked.post.ts` | Saves card + payment method IDs |
| `fronthouseofpeptides/server/api/moov/card-session.post.ts` | OAuth for Drop + customer account |
| `fronthouseofpeptides/pages/checkout/payment.vue` | Client Pay → card-linked → create-transfer |
| `fronthouseofpeptides/server/api/webhooks/moov.post.ts` | Marks paid (not involved in this 502) |
| `fronthouseofpeptides/server/utils/checkout-trace.ts` | Safe hostname/order logs |

---

## 12. Constraints for any proposed fix

- Do **not** mark order paid from create-transfer
- Do **not** decrement inventory from create-transfer
- Do **not** purchase Shippo labels
- Do **not** put Moov/Shippo/Strapi secrets in `runtimeConfig.public` or client logs
- Keep Moov in **test** mode
- Prefer minimal change: surface exact failure step + fix Moov request/scopes/wallet selection

---

## 13. Suggested next fix options (for ChatGPT to choose among)

1. **Observability first:** Ensure create-transfer response body message is visible; temporarily return `step` enum (`items|customer_pm|merchant_pm|moov_transfer|strapi_save`) without secrets.
2. If Moov rejects: fix API key scopes / enable card payments / wallet on merchant test account; optionally add `X-Wait-For: rail-response`.
3. If wallet missing: create/ensure moov-wallet; harden wallet selection logging (`paymentMethodTypes` list only).
4. If Strapi items fail: fix populate query / token permissions.
5. Use UUID idempotency keys if Moov rejects current key format.

---

## 14. Copy-paste prompt for ChatGPT

```
You are debugging a Nuxt 3 BFF checkout. Card linking via Moov Drop works.
POST /api/moov/create-transfer returns 502 on quantumbiopeptides.com (Moov test mode).

Read the audit above. The create-transfer handler maps several failures to 502.
Most likely Moov POST /accounts/{MOOV_ACCOUNT_ID}/transfers is failing, or payment-method listing / Strapi order-items fails before that.

Please:
1. Rank the top 3 root causes given this architecture.
2. Tell me exactly what to look for in the Network response body and Nuxt server logs.
3. Propose the smallest code change and/or Moov Dashboard change to fix it.
4. Call out if our transfer payload shape (source card-payment → destination moov-wallet, amount.value in cents, X-Moov-Version v2026.04.00, Basic auth) is wrong for Moov's current API.
5. Do not redesign the whole checkout.
```

---

## 15. Secrets policy

Do **not** paste into ChatGPT:

- `MOOV_SECRET_KEY`, `MOOV_PUBLIC_KEY`, `MOOV_WEBHOOK_SECRET`
- `STRAPI_TOKEN`
- `SHIPPO_API_TOKEN`
- SMTP / owner passwords
- Card numbers, CVV, OAuth access tokens
- Full webhook/request headers

Safe to paste:

- Order number
- HTTP status codes
- create-transfer JSON error `message`
- `[checkout-trace]` log lines
- Whether Strapi fields like `moovPaymentMethodId` / `moovTransferId` are present (IDs themselves optional; prefer booleans)
