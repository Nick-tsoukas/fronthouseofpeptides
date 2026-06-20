/**
 * Manual test for the Moov customer account + card linking flow.
 * Run with: node scripts/test-card-linking.mjs
 *
 * This script:
 * 1. Creates a pending order via /api/checkout/prepare.
 * 2. Calls /api/moov/card-session to get a scoped OAuth token and customer account.
 * 3. Calls /api/moov/card-linked with a fake card ID to verify authorization (it will fail because the card does not belong to the account).
 *
 * Browser-based flow:
 * - After the prepare call succeeds, the user should click "Continue to test payment" in the browser.
 * - The payment page loads Moov.js, requests /api/moov/card-session, and shows the Moov card-link Drop.
 * - Use Moov test card numbers (e.g., 4111111111111111 for Visa) in the browser.
 * - After linking, the browser calls /api/moov/card-linked and redirects to the card-success page.
 */

const BASE_URL = process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'

function randomEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`
}

function generateIdempotencyKey() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

async function api(path, opts = {}) {
  const url = `${BASE_URL}${path}`
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  })
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = { raw: text }
  }
  return { status: res.status, data }
}

async function main() {
  console.log(`Testing against ${BASE_URL}\n`)

  // Step 1: create a pending order (requires a real variantId in your Strapi)
  const prepareBody = {
    items: [{ variantId: 1, quantity: 1 }],
    firstName: 'Test',
    lastName: 'Customer',
    email: randomEmail(),
    idempotencyKey: generateIdempotencyKey(),
  }

  console.log('1) POST /api/checkout/prepare')
  const prepare = await api('/api/checkout/prepare', {
    method: 'POST',
    body: JSON.stringify(prepareBody),
  })
  console.log(`Status: ${prepare.status}`)
  console.log(prepare.data)

  if (prepare.status !== 200 || !prepare.data?.ok) {
    console.error('Prepare failed. Make sure a variant with id=1 exists or update this script.')
    process.exit(1)
  }

  const { orderId, checkoutSessionToken } = prepare.data

  // Step 2: get a card session token
  console.log('\n2) POST /api/moov/card-session')
  const cardSession = await api('/api/moov/card-session', {
    method: 'POST',
    body: JSON.stringify({ orderId, checkoutSessionToken }),
  })
  console.log(`Status: ${cardSession.status}`)
  console.log({
    ok: cardSession.data?.ok,
    mode: cardSession.data?.mode,
    customerAccountId: cardSession.data?.customerAccountId,
    merchantAccountId: cardSession.data?.merchantAccountId,
    hasAccessToken: !!cardSession.data?.accessToken,
  })

  if (cardSession.status !== 200 || !cardSession.data?.ok) {
    console.error('Card session failed.')
    process.exit(1)
  }

  // Step 3: verify card-linked endpoint rejects an unknown card
  console.log('\n3) POST /api/moov/card-linked (with fake cardId, expected 400)')
  const cardLinked = await api('/api/moov/card-linked', {
    method: 'POST',
    body: JSON.stringify({
      orderId,
      checkoutSessionToken,
      cardId: 'card-test-does-not-exist',
    }),
  })
  console.log(`Status: ${cardLinked.status}`)
  console.log(cardLinked.data)

  console.log('\n4) POST /api/moov/card-session with bad token (expected 401)')
  const badSession = await api('/api/moov/card-session', {
    method: 'POST',
    body: JSON.stringify({
      orderId,
      checkoutSessionToken: 'bad-token',
    }),
  })
  console.log(`Status: ${badSession.status}`)
  console.log(badSession.data)

  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
