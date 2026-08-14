import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { generatedProductImagePath } from '~/utils/getProductImage'

export const PRODUCT_IMAGE_GENERATION_MODE = 'branded_svg' as const

export type ProductImageGenerationMode = typeof PRODUCT_IMAGE_GENERATION_MODE | 'ai'

const WIDTH = 1200
const HEIGHT = 900

export function pickVariantDisplayName(
  variants: Array<{ name?: string; active?: boolean } | null | undefined>
): string | null {
  const names = variants
    .filter((v) => v && (v.active !== false))
    .map((v) => String(v?.name || '').trim())
    .filter(Boolean)

  const fallback = variants
    .map((v) => String(v?.name || '').trim())
    .filter(Boolean)

  const list = names.length ? names : fallback
  if (list.length === 0) return null
  if (list.length === 1) return list[0]
  return 'Multiple Strengths'
}

export function sanitizeLabel(text: string, max = 56): string {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

function escapeXml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function wrapTitle(text: string): string[] {
  const clean = sanitizeLabel(text, 64)
  if (clean.length <= 22) return [clean]
  const words = clean.split(' ')
  if (words.length === 1) {
    return [clean.slice(0, 22), clean.slice(22, 44)].filter(Boolean)
  }
  const lines: string[] = ['']
  for (const word of words) {
    const next = lines[lines.length - 1] ? `${lines[lines.length - 1]} ${word}` : word
    if (next.length > 22 && lines[lines.length - 1]) {
      if (lines.length >= 2) {
        lines[1] = sanitizeLabel(`${lines[1]} ${word}`, 24)
      } else {
        lines.push(word)
      }
    } else {
      lines[lines.length - 1] = next
    }
  }
  return lines.slice(0, 2)
}

export function buildProductFallbackSvg(opts: {
  productId: number
  productName: string
  variantName?: string | null
  brandName?: string
}): string {
  const id = Number(opts.productId) || 0
  const brand = escapeXml(sanitizeLabel(opts.brandName || 'Quantum Bio Peptides', 40))
  const variant = opts.variantName ? escapeXml(sanitizeLabel(opts.variantName, 32)) : ''
  const titleLines = wrapTitle(opts.productName).map((line) => escapeXml(line))
  const titleSize = titleLines.some((l) => l.length > 18) ? 56 : 68
  const uid = `p${id}`

  const titleTspans = titleLines
    .map((line, i) => {
      const dy = i === 0 ? 0 : titleSize + 8
      return `<tspan x="600" dy="${dy}">${line}</tspan>`
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${escapeXml(opts.productName)}">
  <defs>
    <linearGradient id="bg-${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="48%" stop-color="#0b2744"/>
      <stop offset="100%" stop-color="#082f3b"/>
    </linearGradient>
    <linearGradient id="card-${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="#020617" stop-opacity="0.82"/>
    </linearGradient>
    <pattern id="grid-${uid}" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#22d3ee" stroke-opacity="0.07" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg-${uid})"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grid-${uid})"/>
  <circle cx="180" cy="760" r="220" fill="#22d3ee" fill-opacity="0.05"/>
  <circle cx="1040" cy="120" r="180" fill="#2dd4bf" fill-opacity="0.06"/>
  <g opacity="0.2" stroke="#67e8f9" fill="none" stroke-width="2.2">
    <circle cx="980" cy="168" r="30"/>
    <circle cx="1086" cy="228" r="18"/>
    <circle cx="1018" cy="292" r="24"/>
    <line x1="980" y1="168" x2="1086" y2="228"/>
    <line x1="1086" y1="228" x2="1018" y2="292"/>
    <line x1="980" y1="168" x2="1018" y2="292"/>
  </g>
  <rect x="130" y="155" width="940" height="590" rx="32" fill="url(#card-${uid})" stroke="#22d3ee" stroke-opacity="0.28" stroke-width="2"/>
  <rect x="154" y="179" width="892" height="542" rx="22" fill="none" stroke="#ffffff" stroke-opacity="0.06"/>
  <text x="600" y="250" text-anchor="middle" fill="#67e8f9" font-family="Segoe UI, system-ui, sans-serif" font-size="18" font-weight="600" letter-spacing="4">${brand}</text>
  <text x="600" y="${variant ? 430 : 460}" text-anchor="middle" fill="#f8fafc" font-family="Segoe UI, system-ui, sans-serif" font-size="${titleSize}" font-weight="700">${titleTspans}</text>
  ${
    variant
      ? `<text x="600" y="560" text-anchor="middle" fill="#22d3ee" font-family="Segoe UI, system-ui, sans-serif" font-size="36" font-weight="600">${variant}</text>`
      : ''
  }
  <text x="600" y="680" text-anchor="middle" fill="#94a3b8" font-family="Segoe UI, system-ui, sans-serif" font-size="20" font-weight="500" letter-spacing="2.5">RESEARCH USE ONLY</text>
</svg>`
}

function storageDirs(): string[] {
  const dirs = [
    join(process.cwd(), '.data', 'generated-product-images'),
    join(process.cwd(), 'public', 'product-images', 'generated'),
  ]
  const outputPublic = join(process.cwd(), '.output', 'public', 'product-images', 'generated')
  dirs.push(outputPublic)
  return dirs
}

export function generatedImageFilename(productId: number): string {
  return `product-${productId}.svg`
}

export async function generateProductFallbackImage(opts: {
  productId: number
  productName: string
  variantName?: string | null
  brandName?: string
  generationMode?: ProductImageGenerationMode
}): Promise<{ url: string; generationMode: ProductImageGenerationMode }> {
  const generationMode = opts.generationMode || PRODUCT_IMAGE_GENERATION_MODE
  const svg = buildProductFallbackSvg({
    productId: opts.productId,
    productName: opts.productName,
    variantName: opts.variantName,
    brandName: opts.brandName,
  })
  const filename = generatedImageFilename(opts.productId)

  for (const dir of storageDirs()) {
    try {
      await mkdir(dir, { recursive: true })
      await writeFile(join(dir, filename), svg, 'utf8')
    } catch {
      // Some dirs (e.g. .output/public) may not exist yet.
    }
  }

  return {
    url: generatedProductImagePath(opts.productId),
    generationMode,
  }
}
