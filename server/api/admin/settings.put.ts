import { requireAdminAuth } from '~/server/utils/adminAuth'
import { saveStoreSettings } from '~/server/utils/storeSettings'
import type { StoreSettings } from '~/utils/storeSettings'

/**
 * PUT /api/admin/settings
 * Admin-only. Persists store settings through Strapi. Never called from the browser with a Strapi token.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  requireAdminAuth(event, config.ownerSessionSecret as string)

  const body = await readBody<Partial<StoreSettings>>(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, message: 'Settings payload is required.' })
  }

  const settings = await saveStoreSettings(event, body)
  return { ok: true, settings }
})
