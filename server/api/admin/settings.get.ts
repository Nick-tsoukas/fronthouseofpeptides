import { requireAdminAuth } from '~/server/utils/adminAuth'
import { fetchStoreSettings } from '~/server/utils/storeSettings'
import { getAllowedShippoCarriers } from '~/server/utils/shippo'
import { isShipFromComplete, policiesCompleted } from '~/utils/storeSettings'

/**
 * GET /api/admin/settings
 * Admin-only. Returns store settings plus non-secret environment status.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  requireAdminAuth(event, config.ownerSessionSecret as string)

  const { settings, persisted } = await fetchStoreSettings(event, { skipCache: true })
  const allowed = getAllowedShippoCarriers({
    storeAllowedCarriers: settings.allowedCarriers,
  })

  const envShipFromComplete = Boolean(
    String(config.shippingFromName || '').trim() &&
      String(config.shippingFromStreet1 || '').trim() &&
      String(config.shippingFromCity || '').trim() &&
      String(config.shippingFromState || '').trim() &&
      String(config.shippingFromZip || '').trim()
  )
  const settingsShipFromComplete = isShipFromComplete(settings)

  let shipFromSource: 'env' | 'settings' | 'incomplete' = 'incomplete'
  if (envShipFromComplete) shipFromSource = 'env'
  else if (settingsShipFromComplete) shipFromSource = 'settings'

  const envCarriers = (process.env.SHIPPO_ALLOWED_CARRIERS || '').trim()
  const allowedCarriersSource: 'env' | 'settings' | 'default' = envCarriers
    ? 'env'
    : settings.allowedCarriers?.trim()
      ? 'settings'
      : 'default'

  const moovMode = String(config.moovMode || config.public.moovMode || 'test').toLowerCase() === 'live' ? 'live' : 'test'
  const shippoMode =
    String(config.shippoMode || config.public.shippoMode || 'test').toLowerCase() === 'live' ? 'live' : 'test'

  return {
    settings,
    persisted,
    status: {
      moovMode,
      shippoMode,
      testModeActive: moovMode === 'test' || shippoMode === 'test',
      allowedCarriers: allowed,
      allowedCarriersSource,
      supportEmailConfigured: Boolean(settings.supportEmail?.trim()),
      shipFromConfigured: envShipFromComplete || settingsShipFromComplete,
      shipFromSource,
      policies: policiesCompleted(settings),
      smtpConfigured: Boolean(config.smtpHost && config.smtpUser && config.smtpPass),
    },
  }
})
