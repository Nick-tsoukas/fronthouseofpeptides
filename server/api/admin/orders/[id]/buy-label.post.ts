import { requireAdminAuth } from '~/server/utils/adminAuth'
import {
  getShippoConfig,
  purchaseShippoLabelFromRate,
  getShippoTransaction,
  sanitizeShippoErrorText,
  isShippoRateExpiredError,
} from '~/server/utils/shippo'
import { notifyOwnerPush } from '~/server/utils/ownerPush'

function pushLabelReady(orderId: number | string, orderNumber: string | null) {
  const label = orderNumber || `Order #${orderId}`
  void notifyOwnerPush({
    title: 'Shipping label ready',
    body: `Label and tracking are ready for order ${label}`,
    url: `/admin/orders/${orderId}`,
    tag: `order-${orderId}-label`,
  })
}

function pushLabelFailed(orderId: number | string, orderNumber: string | null) {
  const label = orderNumber || `Order #${orderId}`
  void notifyOwnerPush({
    title: 'Label purchase failed',
    body: `Review shipping details for order ${label}`,
    url: `/admin/orders/${orderId}`,
    tag: `order-${orderId}-label-fail`,
  })
}

function hasShippingAddress(attrs: Record<string, any>): boolean {
  const line1 = attrs.shippingAddressLine1 || attrs.shippingAddress1
  return Boolean(
    line1 &&
      attrs.shippingCity &&
      attrs.shippingState &&
      attrs.shippingPostalCode &&
      (attrs.shippingCountry || 'US')
  )
}

function isTestMode(config: ReturnType<typeof useRuntimeConfig>): boolean {
  const mode = String(config.public?.shippoMode || config.shippoMode || 'test').toLowerCase()
  return mode !== 'live' && mode !== 'production'
}

function isStrapiSchemaError(err: any): boolean {
  const raw = JSON.stringify(err?.data || err?.message || err || '').toLowerCase()
  return (
    raw.includes('invalid key') ||
    raw.includes('unknownfield') ||
    raw.includes('unknown field') ||
    raw.includes('not a valid enumeration') ||
    (raw.includes('attribute') && raw.includes('does not exist')) ||
    (raw.includes('enumeration') && raw.includes('must be one of'))
  )
}

function strapiSchemaMessage(): string {
  return 'Production Strapi schema is missing Shippo label fields. Redeploy Strapi before testing labels.'
}

function safeFail(
  event: any,
  statusCode: number,
  step: string,
  message: string,
  detail: string | null,
  includeDetail: boolean
) {
  setResponseStatus(event, statusCode)
  return {
    ok: false as const,
    step,
    message,
    detail: includeDetail && detail ? detail.slice(0, 400) : undefined,
  }
}

function logBuyLabelDiagnostics(payload: Record<string, unknown>) {
  console.info('[buy-label]', JSON.stringify(payload))
}

async function patchOrder(
  strapiUrl: string,
  headers: Record<string, string>,
  orderId: number | string,
  data: Record<string, unknown>
): Promise<{ ok: true } | { ok: false; schemaMissing: boolean; detail: string }> {
  try {
    await $fetch(`${strapiUrl}/api/orders/${orderId}`, {
      method: 'PUT',
      headers,
      body: { data },
    })
    return { ok: true }
  } catch (err: any) {
    const detail = sanitizeShippoErrorText(
      err?.data?.error?.message ||
        err?.data?.message ||
        err?.message ||
        'Strapi update failed',
      400
    )
    console.error('[buy-label] strapi_label_save failed:', detail)
    return {
      ok: false,
      schemaMissing: isStrapiSchemaError(err) || /invalid key|unknown field|enumeration/i.test(detail),
      detail,
    }
  }
}

/**
 * POST /api/admin/orders/:id/buy-label
 * Purchase a Shippo label for a paid order using the previously selected rate.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const testMode = isTestMode(config)

  try {
    requireAdminAuth(event, config.ownerSessionSecret as string)
  } catch {
    return safeFail(event, 401, 'admin_auth', 'Unauthorized', null, testMode)
  }

  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    return safeFail(event, 400, 'order_load', 'Invalid order ID.', null, testMode)
  }

  const strapiUrl = config.public.strapiUrl as string
  const strapiToken = config.strapiToken as string
  if (!strapiToken) {
    return safeFail(event, 500, 'order_load', 'Strapi is not configured.', null, testMode)
  }

  const headers = {
    Authorization: `Bearer ${strapiToken}`,
    'Content-Type': 'application/json',
  }

  let entry: any
  try {
    const orderRes = await $fetch<{ data: any }>(`${strapiUrl}/api/orders/${id}`, { headers })
    entry = orderRes.data
  } catch (err: any) {
    logBuyLabelDiagnostics({
      step: 'order_load',
      orderId: id,
      ok: false,
    })
    return safeFail(event, 404, 'order_load', 'Order not found.', null, testMode)
  }

  if (!entry) {
    return safeFail(event, 404, 'order_load', 'Order not found.', null, testMode)
  }

  const attrs = entry.attributes || {}
  const orderId = entry.id
  const orderNumber = attrs.orderNumber || null

  const baseLog = {
    orderId,
    orderNumber,
    paymentStatus: attrs.paymentStatus || null,
    shippingStatus: attrs.shippingStatus || null,
    hasShippoRateId: Boolean(attrs.shippoRateId),
    hasShippoTransactionId: Boolean(attrs.shippoTransactionId),
    hasShippingLabelUrl: Boolean(attrs.shippingLabelUrl),
    hasTrackingNumber: Boolean(attrs.trackingNumber),
    hasShippingAddress: hasShippingAddress(attrs),
  }

  // Idempotent: already have a successful label
  if (attrs.shippoTransactionId && attrs.shippingLabelUrl) {
    logBuyLabelDiagnostics({ ...baseLog, step: 'already_has_label', ok: true })
    return {
      ok: true,
      orderNumber,
      shippingStatus: attrs.shippingStatus || 'label_purchased',
      shippoTransactionId: attrs.shippoTransactionId,
      shippingLabelUrl: attrs.shippingLabelUrl,
      trackingNumber: attrs.trackingNumber || null,
      trackingUrl: attrs.trackingUrl || null,
      alreadyPurchased: true,
      message: 'Label already purchased.',
    }
  }

  // If a transaction exists, refresh only — never buy a second label
  if (attrs.shippoTransactionId) {
    const shippoConfig = getShippoConfig(event)
    if (!shippoConfig.apiToken) {
      logBuyLabelDiagnostics({ ...baseLog, step: 'shippo_error', ok: false, reason: 'missing_token' })
      return safeFail(event, 500, 'shippo_error', 'Shippo is not configured.', null, testMode)
    }

    try {
      const existing = await getShippoTransaction(shippoConfig, attrs.shippoTransactionId)
      const status = String(existing.status || '').toUpperCase()
      logBuyLabelDiagnostics({
        ...baseLog,
        step: 'shippo_transaction_refresh',
        shippoTransactionStatus: status,
      })

      if (status === 'SUCCESS' && existing.label_url) {
        const patch = {
          shippingLabelUrl: existing.label_url,
          trackingNumber: existing.tracking_number || attrs.trackingNumber || null,
          trackingUrl: existing.tracking_url_provider || attrs.trackingUrl || null,
          shippingStatus: 'label_purchased',
          labelPurchasedAt: attrs.labelPurchasedAt || new Date().toISOString(),
          labelErrorMessage: null,
        }
        const saved = await patchOrder(strapiUrl, headers, orderId, patch)
        if (!saved.ok) {
          return {
            ok: true,
            orderNumber,
            shippingStatus: 'label_purchased',
            shippoTransactionId: attrs.shippoTransactionId,
            shippingLabelUrl: existing.label_url,
            trackingNumber: patch.trackingNumber,
            trackingUrl: patch.trackingUrl,
            alreadyPurchased: true,
            message: saved.schemaMissing
              ? strapiSchemaMessage()
              : 'Label exists in Shippo but could not be saved to Strapi. Redeploy Strapi or retry.',
            detail: testMode ? saved.detail : undefined,
            strapiSaveFailed: true,
          }
        }
        if (attrs.shippingStatus !== 'label_purchased') {
          pushLabelReady(orderId, orderNumber)
        }
        return {
          ok: true,
          orderNumber,
          shippingStatus: 'label_purchased',
          shippoTransactionId: attrs.shippoTransactionId,
          shippingLabelUrl: existing.label_url,
          trackingNumber: patch.trackingNumber,
          trackingUrl: patch.trackingUrl,
          alreadyPurchased: true,
          message: 'Label already purchased.',
        }
      }

      if (status === 'WAITING' || status === 'QUEUED') {
        await patchOrder(strapiUrl, headers, orderId, {
          shippingStatus: 'label_purchasing',
          labelErrorMessage: null,
        })
        return {
          ok: true,
          orderNumber,
          shippingStatus: 'label_purchasing',
          shippoTransactionId: attrs.shippoTransactionId,
          shippingLabelUrl: existing.label_url || null,
          trackingNumber: existing.tracking_number || attrs.trackingNumber || null,
          trackingUrl: existing.tracking_url_provider || attrs.trackingUrl || null,
          message: 'Label is being generated. Refresh shortly.',
        }
      }

      if (status === 'ERROR') {
        const errorMessage =
          sanitizeShippoErrorText(
            (existing.messages || [])
              .map((m: any) => m?.text)
              .filter(Boolean)
              .slice(0, 3)
              .join('; ') || 'Shippo returned an error creating the label.'
          )

        // Clear failed transaction id so Retry can purchase a new label (not refresh ERROR forever).
        await patchOrder(strapiUrl, headers, orderId, {
          shippingStatus: 'label_failed',
          labelErrorMessage: errorMessage,
          shippoTransactionId: null,
        })

        pushLabelFailed(orderId, orderNumber)

        logBuyLabelDiagnostics({
          ...baseLog,
          step: 'shippo_error',
          shippoTransactionStatus: status,
          ok: false,
        })
        return safeFail(event, 502, 'shippo_error', errorMessage, errorMessage, testMode)
      }

      // Unknown Shippo status — do not create a duplicate transaction
      return safeFail(
        event,
        502,
        'shippo_error',
        `Shippo transaction status is "${status || 'unknown'}". Refresh shortly or contact support.`,
        `transactionStatus=${status || 'unknown'}`,
        testMode
      )
    } catch (err: any) {
      const detail = sanitizeShippoErrorText(err?.shippoSafeDetail || err?.message || err)
      logBuyLabelDiagnostics({
        ...baseLog,
        step: 'shippo_error',
        ok: false,
        reason: 'refresh_failed',
      })
      // Never fall through to a second purchase when a transaction id already exists
      if (attrs.shippingStatus === 'label_purchasing') {
        return {
          ok: true,
          orderNumber,
          shippingStatus: 'label_purchasing',
          shippoTransactionId: attrs.shippoTransactionId,
          shippingLabelUrl: null,
          trackingNumber: attrs.trackingNumber || null,
          trackingUrl: attrs.trackingUrl || null,
          message: 'Label is being generated. Refresh shortly.',
          detail: testMode ? detail : undefined,
        }
      }
      return safeFail(
        event,
        502,
        'shippo_error',
        'Could not refresh the existing Shippo label transaction. Retry shortly — a second label was not purchased.',
        detail,
        testMode
      )
    }
  }

  if (attrs.paymentStatus !== 'paid') {
    logBuyLabelDiagnostics({ ...baseLog, step: 'not_paid', ok: false })
    return safeFail(
      event,
      400,
      'not_paid',
      'Label can be purchased after payment is confirmed.',
      null,
      testMode
    )
  }

  if (attrs.status === 'cancelled' || attrs.paymentStatus === 'refunded' || attrs.paymentStatus === 'cancelled') {
    return safeFail(
      event,
      400,
      'invalid_shipping_status',
      'Cannot buy a label for a cancelled or refunded order.',
      null,
      testMode
    )
  }

  if (!attrs.shippoRateId) {
    logBuyLabelDiagnostics({ ...baseLog, step: 'missing_rate', ok: false })
    return safeFail(
      event,
      400,
      'missing_rate',
      'No Shippo rate is selected for this order.',
      null,
      testMode
    )
  }

  if (!hasShippingAddress(attrs)) {
    logBuyLabelDiagnostics({ ...baseLog, step: 'missing_shipping_address', ok: false })
    return safeFail(
      event,
      400,
      'missing_shipping_address',
      'Shipping address is incomplete.',
      null,
      testMode
    )
  }

  // Recover stuck label_purchasing when no transaction was persisted (pre-fix / save failure).
  const allowedStatuses = ['selected', 'ready_to_ship', 'label_failed', 'label_purchasing']
  if (!allowedStatuses.includes(attrs.shippingStatus)) {
    logBuyLabelDiagnostics({ ...baseLog, step: 'invalid_shipping_status', ok: false })
    return safeFail(
      event,
      400,
      'invalid_shipping_status',
      `Cannot buy a label when shipping status is "${attrs.shippingStatus}".`,
      null,
      testMode
    )
  }
  // label_purchasing with a transaction id is handled above via refresh — never reach here with an id.

  const shippoConfig = getShippoConfig(event)
  if (!shippoConfig.apiToken) {
    return safeFail(event, 500, 'shippo_error', 'Shippo is not configured.', null, testMode)
  }

  // Mark purchasing before Shippo call (best-effort)
  const purchasingPatch = await patchOrder(strapiUrl, headers, orderId, {
    shippingStatus: 'label_purchasing',
    labelErrorMessage: null,
  })
  if (!purchasingPatch.ok && purchasingPatch.schemaMissing) {
    logBuyLabelDiagnostics({ ...baseLog, step: 'strapi_label_save', ok: false, schemaMissing: true })
    return safeFail(event, 502, 'strapi_label_save', strapiSchemaMessage(), purchasingPatch.detail, testMode)
  }

  let result
  try {
    logBuyLabelDiagnostics({ ...baseLog, step: 'shippo_transaction_create', ok: true })
    result = await purchaseShippoLabelFromRate(shippoConfig, attrs.shippoRateId, {
      labelFileType: 'PDF_4x6',
      async: false,
    })
  } catch (err: any) {
    const detail = sanitizeShippoErrorText(err?.shippoSafeDetail || err?.message || err)
    const expired = isShippoRateExpiredError(detail)
    const message = expired
      ? 'The selected Shippo shipping rate has expired or is invalid. Re-quote shipping for this order before buying a label.'
      : 'Label purchase failed. Review the address, package details, and Shippo error.'

    await patchOrder(strapiUrl, headers, orderId, {
      shippingStatus: 'label_failed',
      labelErrorMessage: expired ? message : detail.slice(0, 400),
    })

    pushLabelFailed(orderId, orderNumber)

    logBuyLabelDiagnostics({
      ...baseLog,
      step: 'shippo_transaction_create',
      ok: false,
      rateExpired: expired,
    })

    return safeFail(event, 502, 'shippo_transaction_create', message, detail, testMode)
  }

  const status = String(result.status || '').toUpperCase()
  logBuyLabelDiagnostics({
    ...baseLog,
    step: 'shippo_transaction_create',
    shippoTransactionStatus: status,
    hasLabelUrl: Boolean(result.labelUrl),
    hasTracking: Boolean(result.trackingNumber),
  })

  if (status === 'SUCCESS') {
    const patch = {
      shippoTransactionId: result.transactionId,
      shippingLabelUrl: result.labelUrl,
      trackingNumber: result.trackingNumber,
      trackingUrl: result.trackingUrl,
      labelCostCents: result.labelCostCents,
      labelPurchasedAt: new Date().toISOString(),
      shippingStatus: 'label_purchased',
      labelErrorMessage: null,
    }

    // Persist transaction id first so retries are idempotent even if the full patch fails.
    const idSaved = await patchOrder(strapiUrl, headers, orderId, {
      shippoTransactionId: result.transactionId,
      shippingStatus: 'label_purchasing',
    })
    if (!idSaved.ok) {
      logBuyLabelDiagnostics({
        ...baseLog,
        step: 'strapi_label_save',
        ok: false,
        schemaMissing: idSaved.schemaMissing,
        shippoTransactionStatus: status,
        phase: 'transaction_id_only',
      })
      setResponseStatus(event, 502)
      return {
        ok: false,
        step: 'strapi_label_save',
        message: idSaved.schemaMissing
          ? strapiSchemaMessage()
          : 'Shippo created the label, but saving the transaction id to Strapi failed. Do not buy again until Strapi is fixed — print using the URL below if available.',
        detail: testMode ? idSaved.detail : undefined,
        shippoTransactionId: result.transactionId,
        shippingLabelUrl: result.labelUrl,
        trackingNumber: result.trackingNumber,
        trackingUrl: result.trackingUrl,
        shippingStatus: 'label_purchased',
      }
    }

    const saved = await patchOrder(strapiUrl, headers, orderId, patch)
    if (!saved.ok) {
      logBuyLabelDiagnostics({
        ...baseLog,
        step: 'strapi_label_save',
        ok: false,
        schemaMissing: saved.schemaMissing,
        shippoTransactionStatus: status,
        phase: 'full_patch',
      })
      // Transaction id is saved — next Buy Label will refresh, not repurchase.
      setResponseStatus(event, 502)
      return {
        ok: false,
        step: 'strapi_label_save',
        message: saved.schemaMissing
          ? strapiSchemaMessage()
          : 'Shippo created the label and the transaction id was saved. Click Buy Shipping Label again to refresh label fields from Shippo (no duplicate purchase).',
        detail: testMode ? saved.detail : undefined,
        shippoTransactionId: result.transactionId,
        shippingLabelUrl: result.labelUrl,
        trackingNumber: result.trackingNumber,
        trackingUrl: result.trackingUrl,
        shippingStatus: 'label_purchased',
      }
    }

    pushLabelReady(orderId, orderNumber)
    return {
      ok: true,
      orderNumber,
      shippingStatus: 'label_purchased',
      shippoTransactionId: result.transactionId,
      shippingLabelUrl: result.labelUrl,
      trackingNumber: result.trackingNumber,
      trackingUrl: result.trackingUrl,
      labelCostCents: result.labelCostCents,
      message: 'Shipping label purchased.',
    }
  }

  if (status === 'WAITING' || status === 'QUEUED') {
    const saved = await patchOrder(strapiUrl, headers, orderId, {
      shippoTransactionId: result.transactionId,
      shippingStatus: 'label_purchasing',
      labelErrorMessage: null,
    })
    if (!saved.ok && saved.schemaMissing) {
      return safeFail(event, 502, 'strapi_label_save', strapiSchemaMessage(), saved.detail, testMode)
    }
    return {
      ok: true,
      orderNumber,
      shippingStatus: 'label_purchasing',
      shippoTransactionId: result.transactionId,
      shippingLabelUrl: null,
      trackingNumber: null,
      trackingUrl: null,
      message: 'Label is being generated. Refresh shortly.',
    }
  }

  // ERROR or unknown
  const errorMessage =
    result.errorMessage || 'Shippo returned an error creating the label.'
  await patchOrder(strapiUrl, headers, orderId, {
    shippoTransactionId: result.transactionId || null,
    shippingStatus: 'label_failed',
    labelErrorMessage: errorMessage,
  })

  pushLabelFailed(orderId, orderNumber)
  return safeFail(event, 502, 'shippo_error', errorMessage, errorMessage, testMode)
})
