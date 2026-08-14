import { access } from 'node:fs/promises'
import { join } from 'node:path'
import {
  generateProductFallbackImage,
  generatedImageFilename,
  pickVariantDisplayName,
  PRODUCT_IMAGE_GENERATION_MODE,
} from '~/server/utils/productImageGenerator'
import { generatedProductImagePath } from '~/utils/getProductImage'

export function variantsFromStrapi(entry: any): Array<{ name?: string; active?: boolean }> {
  const attrs = entry?.attributes || entry || {}
  const raw = attrs.variants?.data || attrs.variants || []
  return (Array.isArray(raw) ? raw : []).map((v: any) => ({
    name: v?.attributes?.name || v?.name || '',
    active: v?.attributes?.active ?? v?.active ?? true,
  }))
}

export async function generatedFileExists(productId: number): Promise<boolean> {
  const filename = generatedImageFilename(productId)
  const candidates = [
    join(process.cwd(), '.data', 'generated-product-images', filename),
    join(process.cwd(), 'public', 'product-images', 'generated', filename),
    join(process.cwd(), '.output', 'public', 'product-images', 'generated', filename),
  ]
  for (const path of candidates) {
    try {
      await access(path)
      return true
    } catch {
      // try next
    }
  }
  return false
}

export async function persistGeneratedImageFields(opts: {
  strapiUrl: string
  headers: Record<string, string>
  productId: number
  generatedImageUrl: string
  hasUploadedImage: boolean
}): Promise<{ imageSource: 'uploaded' | 'generated'; generatedImageUrl: string }> {
  const imageSource = opts.hasUploadedImage ? 'uploaded' : 'generated'
  const generatedImageUrl = `${opts.generatedImageUrl.split('?')[0]}?v=${Date.now()}`
  try {
    await $fetch(`${opts.strapiUrl}/api/products/${opts.productId}`, {
      method: 'PUT',
      headers: opts.headers,
      body: {
        data: {
          generatedImageUrl,
          imageSource,
        },
      },
    })
  } catch (err: any) {
    // Schema may not be deployed yet — file URL still works on the storefront.
    console.warn('[product-image] could not persist generatedImageUrl:', err?.message || err)
    return { imageSource, generatedImageUrl: opts.generatedImageUrl.split('?')[0] }
  }
  return { imageSource, generatedImageUrl }
}

export async function ensureProductFallbackImage(opts: {
  productId: number
  productName: string
  variants?: Array<{ name?: string; active?: boolean }>
  hasUploadedImage: boolean
  strapiUrl?: string
  headers?: Record<string, string>
  force?: boolean
  /** Persist generatedImageUrl/imageSource even when the SVG already exists (admin save). */
  syncFields?: boolean
}): Promise<{ generatedImageUrl: string; imageSource: 'uploaded' | 'generated' }> {
  const publicUrl = generatedProductImagePath(opts.productId)
  const exists = await generatedFileExists(opts.productId)

  if (!opts.force && exists) {
    let imageSource: 'uploaded' | 'generated' = opts.hasUploadedImage ? 'uploaded' : 'generated'
    let generatedImageUrl = publicUrl
    if (opts.syncFields && opts.strapiUrl && opts.headers) {
      const persisted = await persistGeneratedImageFields({
        strapiUrl: opts.strapiUrl,
        headers: opts.headers,
        productId: opts.productId,
        generatedImageUrl: publicUrl,
        hasUploadedImage: opts.hasUploadedImage,
      })
      imageSource = persisted.imageSource
      generatedImageUrl = persisted.generatedImageUrl
    }
    return { generatedImageUrl, imageSource }
  }

  const generated = await generateProductFallbackImage({
    productId: opts.productId,
    productName: opts.productName,
    variantName: pickVariantDisplayName(opts.variants || []),
    brandName: 'Quantum Bio Peptides',
    generationMode: PRODUCT_IMAGE_GENERATION_MODE,
  })

  let imageSource: 'uploaded' | 'generated' = opts.hasUploadedImage ? 'uploaded' : 'generated'
  let generatedImageUrl = generated.url
  if (opts.strapiUrl && opts.headers) {
    const persisted = await persistGeneratedImageFields({
      strapiUrl: opts.strapiUrl,
      headers: opts.headers,
      productId: opts.productId,
      generatedImageUrl: generated.url,
      hasUploadedImage: opts.hasUploadedImage,
    })
    imageSource = persisted.imageSource
    generatedImageUrl = persisted.generatedImageUrl
  }

  return { generatedImageUrl, imageSource }
}
