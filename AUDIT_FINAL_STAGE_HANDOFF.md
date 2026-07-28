# AUDIT HANDOFF — Quantum Bio Peptides (Final Store Ops Stage)

**Date:** 2026-07-28  
**Purpose:** Give ChatGPT / next agent enough context to continue without re-discovering the architecture.  
**Workspace:** `c:\houseofpeptides`  
**Production app:** `https://quantumbiopeptides.com`  
**Production Strapi:** `https://api.quantumbiopeptides.com`  

**Standing user rule:** Do **not** run `npm run build` even if a prompt asks for it. User tests on production (Moov/Shippo test mode).

---

## 1. Architecture (do not redesign)

| Layer | Path | Role |
|---|---|---|
| Nuxt 3 BFF | `fronthouseofpeptides/` | All commerce logic; Moov/Shippo/Strapi called **server-side only** |
| Strapi 4 | `backhouseofpeptides/` | Products, Variants, Orders, Order Items, Inventory Adjustments |
| Moov | test mode | Card vault + transfers (`MOOV_MODE=test`) |
| Shippo | test mode | Rates + **label purchase now implemented** (`SHIPPO_MODE=test`) |
| Email | Brevo SMTP | Paid receipt + tracking email (admin-triggered) |

**Auth patterns:**
- Checkout: HttpOnly `checkout_session` cookie → `validateCheckoutSession`
- Owner panel (`/owner/*`): HttpOnly `owner_session` → `requireOwnerAuth` (password = `OWNER_ADMIN_PASSWORD`)
- Admin panel (`/admin/*`): HttpOnly `admin_session` → `requireAdminAuth` (same password env / fallback `admin123`)

**Hard constraints (always):**
- Do not redesign checkout.
- Do not break working Moov payment.
- Do not auto-buy Shippo labels after payment.
- Do not buy labels for unpaid orders.
- Do not expose Strapi/Moov/Shippo secrets or card data to the browser.
- Do not make order/admin endpoints public.
- Inventory decrement only once for online paid (`inventoryCommitted`).
- Quick Sale must not call Moov or Shippo.

---

## 2. What is WORKING in production (test mode)

Confirmed end-to-end earlier in this project arc:

1. Cart → checkout → prepare order (`status=awaiting_payment`, `paymentStatus=pending`)
2. Shippo rates + select rate (`shippingStatus=selected`, stores `shippoRateId`, carrier/service, cents)
3. Moov customer account + card Drop (`moov-card-link`)
4. `POST /api/moov/card-linked` saves `moovCardId`, `moovPaymentMethodId`
5. `POST /api/moov/create-transfer` creates transfer → `paymentStatus=processing`, stores `moovTransferId`
6. Payment finalization:
   - Poll `GET /api/checkout/status` (reconciles Moov transfer)
   - Moov webhook `POST /api/webhooks/moov`
   - **Critical Moov nuance:** transfer can stay `pending` while `source.cardDetails.status=confirmed`. Code treats **confirmed auth as paid** (not bare pending).
7. Paid → receipt emails (customer + owner), inventory once, success page
8. Admin orders list no longer empty (was broken: browser called public Strapi without token)
9. Admin products inventory + Quick Sale
10. Shippo **label purchase code is implemented** in repo (needs Strapi schema deploy + production smoke test)

---

## 3. Payment finalization (Moov) — current rules

**Files:**
- `server/api/moov/create-transfer.post.ts`
- `server/api/checkout/status.get.ts`
- `server/api/webhooks/moov.post.ts`
- `server/utils/moov.ts` — `mapMoovTransferToPaymentStatus`, `X-Wait-For: rail-response`
- `server/utils/moov-reconcile.ts` — verify + apply + inventory

**Paid mapping:**
- Transfer `completed` / `succeeded` → paid
- OR `cardDetails.status` in `confirmed` | `settled` | `completed` → paid (even if transfer still `pending`)
- `failed` / `canceled` → failed
- Bare `pending` without card confirmation → stay `processing`

**On first paid:**
- `paidAt`, `paymentStatus=paid`
- If `status=awaiting_payment` → `status=approved`
- If `shippoRateId` present and no `shippoTransactionId` and shipping was `selected`/`quoted` → **`shippingStatus=ready_to_ship`**
- Inventory decrement once + `inventoryCommitted=true`
- Inventory adjustment log `source=online_order`
- Paid emails via `sendPaidOrderEmails`

**Debug (test only):** `GET /api/moov/payment-debug?orderId=...` when `MOOV_MODE=test`

**Frontend payment UX:** `pages/checkout/payment.vue`
- After create-transfer → processing message
- Poll 2s × 60s
- Timeout → stable “waiting for Moov” + Check status / View order status
- Moov Drop kept mounted (do not remount during submit)

---

## 4. Admin / inventory / Quick Sale — current state

### Admin auth
- Login: `POST /api/admin/login` → cookie `admin_session`
- Password: `OWNER_ADMIN_PASSWORD` or fallback `admin123`
- Middleware: `middleware/admin.ts` checks `/api/admin/session`

### Admin Orders
- List: `pages/admin/orders/index.vue` → `GET /api/admin/orders` (server Strapi token)
- Detail: `pages/admin/orders/[id].vue` → `GET /api/admin/orders/:id`
- Filters by paymentStatus / shipping (All, Pending, Processing, Paid, Failed, Cancelled, Shipped)

### Admin Products + Quick Sale
- `pages/admin/products/index.vue`
- Inventory column; expand multi-variant
- **Quick Sale** → `POST /api/admin/manual-sales/quick`  
  Body: `{ variantId, quantity, paymentMethod, note }`  
  No customer/address/Moov/Shippo/email. Decrements stock + inventory-adjustment log (`source=manual_sale`, `reason=manual_sale`)
- **+ Add / − Remove** → `POST /api/admin/inventory/adjust`
- Older fuller endpoint still exists: `POST /api/admin/manual-sale` (creates optional Order; Quick Sale is the preferred path)

### Inventory adjustment collection (Strapi)
Path: `backhouseofpeptides/src/api/inventory-adjustment/`  
Fields include: variant, product, adjustmentType, quantity, previous/new inventory, reason, note, paymentMethod, source, relatedOrder, createdByAdmin

### Dashboard
- `GET /api/admin/dashboard` + `pages/admin/index.vue`
- Cards: total/pending/paid/revenue/low stock/out of stock/**manual sales today**/**online orders today**

### Dual admin surfaces
There is also a separate **Owner** panel (`/owner/*`) with its own APIs. Primary polish work in this arc targeted **`/admin/*`**. Do not confuse the two.

---

## 5. Shippo label purchase — IMPLEMENTED IN CODE (needs deploy + test)

### Schema additions (Order) — must redeploy Strapi
In `backhouseofpeptides/src/api/order/content-types/order/schema.json`:

**New / extended fields:**
- `shippoTransactionId`
- `shippingLabelUrl`
- `trackingNumber`
- `trackingUrl`
- `labelCostCents`
- `labelPurchasedAt`
- `labelPrintedAt`
- `trackingEmailSentAt`
- `shippedAt`
- `labelErrorMessage`
- `trackingStatus`, `trackingStatusUpdatedAt`, `deliveredAt` (prep for future webhooks)

**`shippingStatus` enum now includes:**
`not_quoted`, `quoted`, `selected`, `ready_to_ship`, `label_purchasing`, `label_purchased`, `shipped`, `in_transit`, `delivered`, `exception`, `label_failed`, `not_required`, `cancelled`

Existing fields already present earlier: `shippoShipmentId`, `shippoRateId`, `shippingCarrier`, `shippingService`, `shippingCostCents`, etc.

### Helpers
`server/utils/shippo.ts`:
- Existing: rates/config/fetch/sanitize
- New: `purchaseShippoLabelFromRate(config, rateId, { labelFileType: 'PDF_4x6', async: false })`
- New: `getShippoTransaction`

### Admin endpoints
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/admin/orders/:id/buy-label` | Purchase label from `shippoRateId`; idempotent |
| POST | `/api/admin/orders/:id/email-tracking` | Send tracking email; set `trackingEmailSentAt` |
| POST | `/api/admin/orders/:id/mark-shipped` | Set `shippingStatus=shipped`, `shippedAt` |

### Buy-label rules
- Require admin auth
- Require `paymentStatus=paid`
- Require `shippoRateId`, shipping address
- Allow shippingStatus: `selected` | `ready_to_ship` | `label_failed`
- If already has `shippoTransactionId` + `shippingLabelUrl` → return existing (no duplicate buy)
- Shippo SUCCESS → save label/tracking, `shippingStatus=label_purchased`
- WAITING/QUEUED → `label_purchasing`
- ERROR → `label_failed` + safe message
- Does **not** call Moov, change payment, or decrement inventory

### Admin UI
`pages/admin/orders/[id].vue` fulfillment panel states:
- Paid ready → **Buy Shipping Label**
- Purchasing → **Refresh Order**
- Purchased → **Print Label** (opens `shippingLabelUrl`), **Email Tracking**, **Mark as Shipped**
- Failed → **Retry Label Purchase**
- Unpaid → message only: label after payment confirmed

### Customer success page
`pages/checkout/success.vue`:
- Loads from `/api/checkout/status` (session), not cart
- Paid copy: payment confirmed, receipt emailed, tracking when ships
- No label/tracking shown unless later intentionally added

### Tracking email
`sendTrackingEmail` in `server/utils/sendOrderEmails.ts`  
Subject: `Your Quantum Bio Peptides order has tracking`

---

## 6. Explicitly NOT done / deferred

- Shippo tracking webhooks (fields prepared only)
- Auto label purchase after Moov paid
- ACH / Apple Pay / crypto
- Production Moov keys (still test mode)
- Tax engine
- Making admin auth as strong as full Strapi users-permissions (cookie + shared password is MVP)
- Owner panel feature parity with new admin shipping UI
- Confirmed production smoke test of **Buy Shipping Label** after latest schema deploy

---

## 7. Deploy checklist for next agent / ChatGPT

1. **Redeploy Strapi** (`backhouseofpeptides`) so Order label fields + expanded `shippingStatus` + `inventory-adjustment` (+ `paymentMethod` on adjustments) exist.
2. **Redeploy Nuxt** (`fronthouseofpeptides`).
3. Re-login to `/admin/login` (cookie auth).
4. Smoke test label flow in Shippo **test** mode:
   - Fresh checkout → paid
   - Admin order shows Buy Label
   - Buy Label → transaction + label URL + tracking
   - Print Label opens PDF
   - Email Tracking
   - Mark as Shipped
   - Second Buy Label click must **not** create duplicate
   - Unpaid order cannot buy label
5. Confirm Railway logs for Moov webhook if used: `[moov-webhook] received`

---

## 8. Key file map (for next work)

### Checkout / Moov
- `pages/checkout/payment.vue`
- `pages/checkout/success.vue`
- `server/api/moov/create-transfer.post.ts`
- `server/api/moov/card-linked.post.ts`
- `server/api/checkout/status.get.ts`
- `server/api/webhooks/moov.post.ts`
- `server/utils/moov.ts`
- `server/utils/moov-reconcile.ts`

### Shipping / Shippo
- `server/utils/shippo.ts`
- `server/api/shipping/rates.post.ts`
- `server/api/shipping/select-rate.post.ts`
- `server/api/admin/orders/[id]/buy-label.post.ts`
- `server/api/admin/orders/[id]/email-tracking.post.ts`
- `server/api/admin/orders/[id]/mark-shipped.post.ts`

### Admin
- `pages/admin/orders/index.vue`
- `pages/admin/orders/[id].vue`
- `pages/admin/products/index.vue`
- `pages/admin/index.vue`
- `server/utils/adminAuth.ts`
- `server/api/admin/manual-sales/quick.post.ts`
- `server/api/admin/inventory/adjust.post.ts`
- `server/api/admin/dashboard.get.ts`

### Strapi
- `backhouseofpeptides/src/api/order/content-types/order/schema.json`
- `backhouseofpeptides/src/api/inventory-adjustment/**`
- `backhouseofpeptides/src/api/variant/content-types/variant/schema.json` (inventory integer)

### Env (server-only secrets)
See `fronthouseofpeptides/.env.example`:  
`STRAPI_TOKEN`, `MOOV_*`, `SHIPPO_API_TOKEN`, `SMTP_*`, `OWNER_ADMIN_PASSWORD`, `OWNER_SESSION_SECRET`, ship-from address fields.

Public only: `STRAPI_URL`, `APP_URL`, `MOOV_MODE`, `SHIPPO_MODE`.

---

## 9. Known pitfalls (learned the hard way)

1. **Admin orders empty:** page used to call Strapi from browser without token → always empty. Fixed via `/api/admin/orders`.
2. **Moov Drop remount:** unmounting `<moov-card-link>` during submit loses `accountID` → 401. Keep mounted/hidden.
3. **Moov “pending forever”:** transfer pending ≠ unpaid. Use `cardDetails.confirmed` for ecommerce paid.
4. **Do not force bare pending → paid.**
5. **Shippo rates expire:** create-transfer soft-skips expired shipment verify if cents already stored.
6. **Two panels:** `/admin` vs `/owner` — shipping label UI is on **admin** order detail.
7. **Schema deploy required** before label fields save; without Strapi redeploy, buy-label PUTs may fail on unknown fields.

---

## 10. Suggested next prompts for ChatGPT

**A. Production smoke test / fix buy-label failures**  
“Shippo buy-label fails on production after Strapi redeploy. Inspect Railway logs and `POST /api/admin/orders/:id/buy-label`. Do not redesign checkout. Do not run builds.”

**B. Backfill existing paid orders**  
“Add a safe admin action or one-time script to set `shippingStatus=ready_to_ship` for already-paid orders that have `shippoRateId` but no label.”

**C. Shippo tracking webhooks**  
“Add Shippo tracking webhook to update `in_transit` / `delivered` / `exception` using prepared Order fields. Admin-only; no auto-label.”

**D. Owner panel parity**  
“Mirror admin shipping fulfillment panel onto `/owner/orders/[id]` using owner auth.”

---

## 12. Code verification pass (2026-07-28 follow-up)

### Schema (repo) — PASS
All required Order label/tracking fields and expanded `shippingStatus` enum exist in:
`backhouseofpeptides/src/api/order/content-types/order/schema.json`

**Production Strapi:** must be redeployed for these fields to exist live. Cannot confirm live schema from this workspace without Strapi admin access.

### Admin fulfillment UI — PASS
`pages/admin/orders/[id].vue` implements unpaid / ready / purchasing / purchased / failed states with Buy, Print, Email Tracking, Mark Shipped, Retry.

### buy-label — PASS (+ hardened)
- Admin auth, paid-only, rate + address required
- Shippo server-side, PDF_4x6, sync
- SUCCESS / WAITING|QUEUED / ERROR handled
- Idempotent when transaction+label exist
- **Hardened:** if `shippoTransactionId` already exists, refresh Shippo only — never buy a second label
- **UI:** Refresh Order during `label_purchasing` now calls buy-label (refresh path), not Strapi-only GET

### email-tracking / mark-shipped — PASS
Match audit requirements; no Moov; no auto email from buy-label.

### Production smoke test — NOT RUN HERE
Requires deployed Strapi+Nuxt + admin login + paid test order. User must run Phase 6 checklist on production after deploy.

