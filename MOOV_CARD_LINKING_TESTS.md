# Moov Card Linking — Browser Test Instructions

## Prerequisites
- Strapi is running and the new Order fields (`moovCardId`, `moovCardLinkedAt`, `checkoutSessionTokenHash`) are applied.
  - If you changed the schema, restart/rebuild Strapi so the new columns exist.
- Nuxt is running with the required environment variables.
- Moov API keys are in **test mode**.

## Environment Variables
Ensure these are set in the Nuxt runtime (server-side):
```
MOOV_PUBLIC_KEY=...
MOOV_SECRET_KEY=...
MOOV_ACCOUNT_ID=...
MOOV_MODE=test
STRAPI_URL=...
STRAPI_TOKEN=...
```

## Steps (no Postman/curl required)

1. Add a product to the cart in the browser.
2. Go to `/checkout` and submit the form with:
   - First name, last name, email
   - Research-use confirmation checked
3. Click **Continue to test payment** on the success page.
4. The `/checkout/payment` page loads. You will see:
   - Order number and total
   - A yellow **MOOV TEST MODE** notice
   - A secure Moov card form
5. Use one of the Moov test card numbers below:
   - Visa: `4111111111111111`
   - Mastercard: `5100000000000008`
   - Use any future expiration date, any CVV, and any US ZIP.
6. Click **Link Test Card**.
7. On success, the browser redirects to `/checkout/card-success`.
8. The Strapi order should now have:
   - `moovCustomerAccountId`
   - `moovCardId`
   - `moovPaymentMethodId`
   - `moovCardLinkedAt`

## Server-Side Checks
- The `/api/moov/card-session` endpoint validates the checkout session token.
- The OAuth token is scoped to `/accounts/{customerAccountID}/cards.write`.
- The `/api/moov/card-linked` endpoint verifies the card belongs to the customer account.
- No inventory is decremented and no transfer is created.

## Automated Script
Run the Node.js test script from the project root:
```bash
node scripts/test-card-linking.mjs
```
It creates a pending order, requests a card session, and verifies rejection of a fake card ID.
