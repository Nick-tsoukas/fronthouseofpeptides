/**
 * POST /api/admin/upload
 * Upload an image to Strapi Media Library (admin session required).
 * Accepts multipart form field name: "file"
 */
import { requireAdminAuth } from '~/server/utils/adminAuth'

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
])

const MAX_BYTES = 8 * 1024 * 1024 // 8MB

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  requireAdminAuth(event, config.ownerSessionSecret as string)

  const strapiUrl = config.public.strapiUrl as string
  const strapiToken = config.strapiToken as string

  if (!strapiToken) {
    throw createError({ statusCode: 500, message: 'Strapi is not configured.' })
  }

  const parts = await readMultipartFormData(event)
  if (!parts?.length) {
    throw createError({ statusCode: 400, message: 'No file uploaded.' })
  }

  const filePart = parts.find((p) => p.name === 'file' && p.data && p.filename)
  if (!filePart || !filePart.data?.length) {
    throw createError({ statusCode: 400, message: 'Missing image file. Use field name "file".' })
  }

  const mime = String(filePart.type || '').toLowerCase()
  if (!ALLOWED_TYPES.has(mime)) {
    throw createError({
      statusCode: 400,
      message: 'Unsupported file type. Use JPG, PNG, WEBP, or GIF.',
    })
  }

  if (filePart.data.length > MAX_BYTES) {
    throw createError({ statusCode: 400, message: 'Image must be 8MB or smaller.' })
  }

  const form = new FormData()
  // filePart.data is a Buffer in Nitro multipart parsing
  const bytes = new Uint8Array(filePart.data)
  const blob = new Blob([bytes], { type: mime || 'application/octet-stream' })
  form.append('files', blob, filePart.filename || 'product-image.jpg')

  let uploaded: any
  try {
    uploaded = await $fetch(`${strapiUrl}/api/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${strapiToken}`,
      },
      body: form,
    })
  } catch (err: any) {
    console.error('[admin/upload] Strapi upload failed:', err?.message || err)
    throw createError({
      statusCode: 502,
      message: err?.data?.error?.message || err?.message || 'Image upload failed.',
    })
  }

  const entry = Array.isArray(uploaded) ? uploaded[0] : uploaded
  if (!entry?.id) {
    throw createError({ statusCode: 502, message: 'Upload succeeded but no media id was returned.' })
  }

  const rawUrl = entry.url || entry.formats?.medium?.url || entry.formats?.small?.url || null
  const absoluteUrl =
    rawUrl && (String(rawUrl).startsWith('http://') || String(rawUrl).startsWith('https://'))
      ? String(rawUrl)
      : rawUrl
        ? `${strapiUrl}${rawUrl}`
        : null

  return {
    ok: true,
    id: entry.id,
    url: absoluteUrl,
    name: entry.name || filePart.filename || null,
    mime: entry.mime || mime,
    size: entry.size ?? null,
  }
})
