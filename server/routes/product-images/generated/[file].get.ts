import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const NAME_RE = /^product-\d+\.svg$/

export default defineEventHandler(async (event) => {
  const file = String(getRouterParam(event, 'file') || '')
  if (!NAME_RE.test(file)) {
    throw createError({ statusCode: 404, message: 'Not found' })
  }

  const candidates = [
    join(process.cwd(), '.data', 'generated-product-images', file),
    join(process.cwd(), 'public', 'product-images', 'generated', file),
    join(process.cwd(), '.output', 'public', 'product-images', 'generated', file),
  ]

  for (const path of candidates) {
    try {
      const svg = await readFile(path, 'utf8')
      setHeader(event, 'Content-Type', 'image/svg+xml; charset=utf-8')
      setHeader(event, 'Cache-Control', 'public, max-age=0, must-revalidate')
      return svg
    } catch {
      // try next
    }
  }

  throw createError({ statusCode: 404, message: 'Not found' })
})
