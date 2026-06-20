/**
 * Manual test script for /api/checkout/prepare
 *
 * Usage (PowerShell):
 *   $env:FRONTEND_URL="http://localhost:3000"
 *   $env:STRAPI_URL="http://localhost:1337"
 *   $env:STRAPI_TOKEN="your-strapi-token"
 *   node scripts/test-checkout-prepare.mjs
 */
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337'
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || ''

const authHeaders = STRAPI_TOKEN
  ? { Authorization: `Bearer ${STRAPI_TOKEN}`, 'Content-Type': 'application/json' }
  : { 'Content-Type': 'application/json' }

async function strapi(path, options = {}) {
  const res = await fetch(`${STRAPI_URL}/api${path}`, {
    ...options,
    headers: { ...authHeaders, ...options.headers },
  })
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = { raw: text }
  }
  if (!res.ok) {
    throw new Error(`Strapi ${path} failed ${res.status}: ${JSON.stringify(json)}`)
  }
  return json
}

async function prepare(body) {
  const res = await fetch(`${FRONTEND_URL}/api/checkout/prepare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = { raw: text }
  }
  return { status: res.status, body: json }
}

function assert(condition, message) {
  if (!condition) {
    console.error('FAIL:', message)
    process.exitCode = 1
  } else {
    console.log('PASS:', message)
  }
}

async function main() {
  console.log('Testing /api/checkout/prepare')
  console.log('Frontend:', FRONTEND_URL)
  console.log('Strapi:', STRAPI_URL)
  console.log('')

  // Find an active variant with inventory
  const variants = await strapi(`/variants?populate=product&filters[active][$eq]=true`)
  const variant = variants.data?.find((v) => {
    const inv = v.attributes?.inventory
    return inv === null || inv === undefined || inv > 5
  })

  if (!variant) {
    console.error('No active variant with sufficient inventory found.')
    process.exit(1)
  }

  const product = variant.attributes.product?.data
  const variantId = variant.id
  const quantity = 2
  const idempotencyKey = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const email = `test-${Date.now()}@example.com`

  console.log('Using variant:', variantId, product?.attributes?.name, variant.attributes?.name)
  console.log('')

  // 1. Valid request creates a pending order
  const valid = await prepare({
    items: [{ variantId, quantity }],
    firstName: 'Test',
    lastName: 'User',
    email,
    idempotencyKey,
  })
  assert(valid.status === 200, `valid request returns 200 (got ${valid.status})`)
  assert(valid.body.ok === true, 'valid response has ok=true')
  assert(Number.isInteger(valid.body.orderId), 'valid response has integer orderId')
  assert(valid.body.orderNumber?.startsWith('QBP-'), 'orderNumber starts with QBP-')
  assert(valid.body.currency === 'USD', 'currency is USD')
  assert(valid.body.subtotalCents > 0, 'subtotalCents is positive')
  assert(valid.body.totalCents === valid.body.subtotalCents, 'totalCents equals subtotalCents with zero shipping/tax')
  assert(valid.body.paymentStatus === 'pending', 'paymentStatus is pending')

  const orderId = valid.body.orderId

  // 2. Altered prices from browser are ignored
  const tampered = await prepare({
    items: [{ variantId, quantity }],
    firstName: 'Test',
    lastName: 'User',
    email: `tamper-${Date.now()}@example.com`,
    idempotencyKey: `tamper-${idempotencyKey}`,
    // browser-supplied price fields are ignored
    price: 0.01,
    subtotalCents: 1,
    totalCents: 1,
  })
  assert(tampered.status === 200, 'tampered price request returns 200')
  assert(tampered.body.subtotalCents === valid.body.subtotalCents, 'tampered subtotalCents matches server-calculated value')
  assert(tampered.body.totalCents === valid.body.totalCents, 'tampered totalCents matches server-calculated value')

  // 3. Invalid variant ID fails
  const invalidVariant = await prepare({
    items: [{ variantId: 999999, quantity }],
    firstName: 'Test',
    lastName: 'User',
    email: `invalid-${Date.now()}@example.com`,
    idempotencyKey: `invalid-${idempotencyKey}`,
  })
  assert(invalidVariant.status === 400, `invalid variant returns 400 (got ${invalidVariant.status})`)

  // 4. Excessive quantity fails
  const excessiveQuantity = await prepare({
    items: [{ variantId, quantity: 999999 }],
    firstName: 'Test',
    lastName: 'User',
    email: `qty-${Date.now()}@example.com`,
    idempotencyKey: `qty-${idempotencyKey}`,
  })
  assert(excessiveQuantity.status === 400, `excessive quantity returns 400 (got ${excessiveQuantity.status})`)

  // 5. Repeated idempotency key does not duplicate order
  const duplicate = await prepare({
    items: [{ variantId, quantity: 1 }],
    firstName: 'Different',
    lastName: 'Name',
    email: `different-${Date.now()}@example.com`,
    idempotencyKey,
  })
  assert(duplicate.status === 200, `duplicate idempotency key returns 200 (got ${duplicate.status})`)
  assert(duplicate.body.orderId === orderId, 'duplicate idempotency key returns the same orderId')

  // 6. Verify order exists in Strapi with pending status
  const order = await strapi(`/orders/${orderId}?populate=orderItems`)
  assert(order.data?.attributes?.paymentStatus === 'pending', 'Strapi order paymentStatus is pending')
  assert(order.data?.attributes?.idempotencyKey === idempotencyKey, 'Strapi order idempotencyKey matches')
  assert(order.data?.attributes?.orderItems?.data?.length >= 1, 'Strapi order has at least one order item')

  console.log('')
  console.log('Done. Order ID:', orderId)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
