/**
 * POST /api/admin/upload
 * Upload an image to Strapi Media Library (admin session required).
 * Accepts multipart field name: "file" or "files"
 * Optional fields: productId — when set, links the upload to product.image immediately
 */
import { requireAdminAuth } from '~/server/utils/adminAuth'
import FormData from 'form-data'
import http from 'node:http'
import https from 'node:https'

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
])

const MAX_BYTES = 8 * 1024 * 1024 // 8MB

function strapiUpload(url: string, token: string, form: FormData): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const driver = parsed.protocol === 'https:' ? https : http
    const formBuffer = form.getBuffer()
    const formHeaders = form.getHeaders()

    const req = driver.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname + (parsed.search || ''),
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Length': formBuffer.length,
          ...formHeaders,
        },
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk: Buffer) => chunks.push(chunk))
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8')
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`Strapi upload error ${res.statusCode}: ${body.slice(0, 400)}`))
            return
          }
          try {
            resolve(JSON.parse(body))
          } catch {
            reject(new Error(`Invalid JSON from Strapi upload: ${body.slice(0, 200)}`))
          }
        })
      }
    )

    req.on('error', reject)
    req.write(formBuffer)
    req.end()
  })
}

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

  const filePart = parts.find(
    (p) => (p.name === 'file' || p.name === 'files') && p.data && p.data.length > 0
  )
  if (!filePart) {
    throw createError({ statusCode: 400, message: 'Missing image file. Use field name "file".' })
  }

  const productIdPart = parts.find((p) => p.name === 'productId')
  const productIdRaw = productIdPart?.data ? productIdPart.data.toString('utf8').trim() : ''
  const productId =
    productIdRaw && !Number.isNaN(Number(productIdRaw)) ? Number(productIdRaw) : null

  const mime = String(filePart.type || '').toLowerCase() || 'application/octet-stream'
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
  form.append('files', filePart.data, {
    filename: filePart.filename || 'product-image.jpg',
    contentType: mime,
    knownLength: filePart.data.length,
  })

  if (productId) {
    form.append('ref', 'api::product.product')
    form.append('refId', String(productId))
    form.append('field', 'image')
  }

  let uploaded: any
  try {
    uploaded = await strapiUpload(`${strapiUrl}/api/upload`, strapiToken, form)
  } catch (err: any) {
    console.error('[admin/upload] Strapi upload failed:', err?.message || err)
    throw createError({
      statusCode: 502,
      message: err?.message || 'Image upload failed.',
    })
  }

  const entry = Array.isArray(uploaded) ? uploaded[0] : uploaded
  if (!entry?.id) {
    throw createError({ statusCode: 502, message: 'Upload succeeded but no media id was returned.' })
  }

  if (productId) {
    try {
      await $fetch(`${strapiUrl}/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${strapiToken}`,
          'Content-Type': 'application/json',
        },
        body: { data: { image: entry.id } },
      })
    } catch (err: any) {
      console.error('[admin/upload] product image link failed:', err?.message || err)
    }
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
    linkedProductId: productId,
  }
})
