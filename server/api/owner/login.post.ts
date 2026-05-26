import { setOwnerSession } from '~/server/utils/ownerAuth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<{ password?: string }>(event)

  if (!body.password) {
    throw createError({ statusCode: 400, message: 'Password is required.' })
  }

  const adminPassword = config.ownerAdminPassword as string
  if (!adminPassword) {
    throw createError({ statusCode: 500, message: 'Owner auth not configured.' })
  }

  if (body.password !== adminPassword) {
    throw createError({ statusCode: 401, message: 'Incorrect password.' })
  }

  setOwnerSession(event, config.ownerSessionSecret as string)

  return { ok: true }
})
