import { fetchStoreSettings } from '~/server/utils/storeSettings'
import { toPublicStoreSettings } from '~/utils/storeSettings'

/**
 * GET /api/store/public
 * Public-safe storefront settings only. No ship-from, no secrets.
 */
export default defineEventHandler(async (event) => {
  const { settings } = await fetchStoreSettings(event)
  return toPublicStoreSettings(settings)
})
