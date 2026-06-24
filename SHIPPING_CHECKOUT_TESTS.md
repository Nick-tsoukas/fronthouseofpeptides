# Shipping & Checkout Browser-Only Production Test Instructions

## Environment

* Deploy Strapi first after schema changes, then restart the Strapi process so the new columns are live.
* Deploy Nuxt second.
* All Shippo and Moov API keys are in **test mode**.
* No real money is moved; no real shipping label is purchased.

## What You Are Verifying

1. Checkout session is moved from the URL `t` parameter to a secure HttpOnly cookie.
2. Shipping address, contact information, and purchaser confirmations are collected and validated.
3. Shippo returns real test-mode shipping rates for the destination address.
4. Selecting a shipping rate stores the carrier/service/amount server-side and recalculates the final total.
5. The payment/card section is blocked until a shipping rate is selected.
6. Existing Moov card-linking behavior is preserved.

## Browser Test Steps

1. Add a product to the cart and go to `/checkout`.
2. Fill out:
   * First name, last name, email, phone
   * Shipping address (line 1, optional line 2, city, state, ZIP)
   * Country should default to `US` (only US shipping is supported)
3. Check every purchaser confirmation box.
4. Click **Get Shipping Rates**.
   * The page should redirect to `/checkout/success?orderId=...&t=...`.
5. Watch the URL:
   * After the page loads, the `t` query parameter should disappear (replaced by the cookie).
   * The URL should remain on `/checkout/success` with only non-sensitive query params.
6. Wait for the Shippo shipping rates to load.
   * Select one rate.
   * Click **Select Shipping Rate**.
   * The order summary should update with the shipping amount and a new final total.
7. Verify the shipping status changes to **Selected**.
8. Click **Continue to test payment**.
9. On `/checkout/payment`, the Moov card form should load.
10. Link a test card (Moov test cards work here; no real card).
11. After success, the order should show `paymentStatus` updated (card linked) but the order is still not paid and no transfer is created.

## Edge Cases

* Try refreshing `/checkout/success` after the token has been removed from the URL. The page should still work because the cookie is present.
* Try visiting `/checkout/payment` directly before selecting a shipping rate. You should see a "Payment Not Ready" message telling you to return to shipping.
* Double-click the **Select Shipping Rate** button quickly — the button should disable during the request and no duplicate Shippo charges or labels should be created.
* Leave a required shipping field blank or uncheck a confirmation box and submit. The server should reject the request with a clear error.
* Use an obviously invalid US address. Shippo address validation should return an error and no rates should be shown.

## Post-Test Cleanup

* You can leave the test orders in Strapi with status `awaiting_payment` and `paymentStatus` as appropriate.
* No inventory was reduced, no transfer was created, and no shipping label was purchased.

## What to Avoid

* Do not use real credit cards.
* Do not attempt to complete a real payment or capture funds.
* Do not purchase a shipping label or create a Moov transfer in this stage.
