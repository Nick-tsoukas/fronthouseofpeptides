import { requireOwnerAuth } from '~/server/utils/ownerAuth'
import FormData from 'form-data'
import http from 'node:http'
import https from 'node:https'

function strapiUpload(
  url: string,
  token: string,
  form: FormData,
): Promise<any[]> {
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
            reject(new Error(`Strapi upload error ${res.statusCode}: ${body}`))
            return
          }
          try {
            resolve(JSON.parse(body))
          } catch {
            reject(new Error(`Invalid JSON from Strapi upload: ${body}`))
          }
        })
      },
    )

    req.on('error', reject)
    req.write(formBuffer)
    req.end()
  })
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  requireOwnerAuth(event, config.ownerSessionSecret as string)

  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'Invalid product ID.' })
  }

  const strapiUrl = config.public.strapiUrl as string
  const strapiToken = config.strapiToken as string

  const incomingForm = await readMultipartFormData(event)
  if (!incomingForm || incomingForm.length === 0) {
    throw createError({ statusCode: 400, message: 'No file received.' })
  }

  const filePart = incomingForm.find((p) => p.name === 'files')
  if (!filePart || !filePart.data) {
    throw createError({ statusCode: 400, message: 'Expected a field named "files".' })
  }

  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const mime = filePart.type || 'application/octet-stream'
  if (!allowedMimes.includes(mime)) {
    throw createError({ statusCode: 400, message: 'Only JPEG, PNG, WebP or GIF images are allowed.' })
  }

  if (filePart.data.length > 5 * 1024 * 1024) {
    throw createError({ statusCode: 400, message: 'Image must be under 5 MB.' })
  }

  const form = new FormData()
  form.append('files', filePart.data, {
    filename: filePart.filename || 'product-image',
    contentType: mime,
    knownLength: filePart.data.length,
  })
  form.append('ref', 'api::product.product')
  form.append('refId', String(id))
  form.append('field', 'image')

  const uploaded = await strapiUpload(
    `${strapiUrl}/api/upload`,
    strapiToken,
    form,
  ).catch((err: Error) => {
    throw createError({ statusCode: 502, message: `Upload failed: ${err.message}` })
  })

  const file = Array.isArray(uploaded) ? uploaded[0] : uploaded
  if (!file) throw createError({ statusCode: 502, message: 'Upload returned no file.' })

  const imageUrl: string = file.url?.startsWith('http')
    ? file.url
    : `${strapiUrl}${file.url}`

  return { ok: true, imageUrl }
})
