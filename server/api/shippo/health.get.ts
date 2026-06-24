import { type H3Event } from 'h3'
import { getShippoConfig, shippoFetch } from '~/server/utils/shippo'

export default defineEventHandler(async (event: H3Event) => {
  const config = getShippoConfig(event)

  if (!config.apiToken) {
    throw createError({ statusCode: 500, message: 'Shippo integration is not configured.' })
  }

  try {
    // Harmless authenticated request to the Shippo API
    await shippoFetch<any>(config, '/addresses/')
  } catch (err: any) {
    console.error('Shippo health check failed:', err?.message || err)
    throw createError({ statusCode: 502, message: 'Could not connect to Shippo.' })
  }

  return {
    ok: true,
    mode: config.mode,
    connected: true,
  }
})
