import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')
const fontFiles = [
  'C:\\Windows\\Fonts\\arialbd.ttf',
  'C:\\Windows\\Fonts\\arial.ttf',
]

function iconSvg({ size, padding, text }) {
  const inner = size - padding * 2
  const radius = Math.round(inner * 0.22)
  const fontSize = text.length <= 1 ? inner * 0.52 : inner * 0.34
  const y = size / 2 + fontSize * 0.36
  const tracking = text.length <= 1 ? 0 : Math.max(1, size * 0.012)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#020617"/>
  <rect x="${padding}" y="${padding}" width="${inner}" height="${inner}" rx="${radius}" fill="#06b6d4"/>
  <text
    x="${size / 2}"
    y="${y}"
    text-anchor="middle"
    font-family="Arial"
    font-weight="700"
    font-size="${fontSize}"
    letter-spacing="${tracking}"
    fill="#ffffff"
  >${text}</text>
</svg>`
}

function render(svg, filename) {
  const png = new Resvg(svg, {
    fitTo: { mode: 'original' },
    font: {
      fontFiles,
      defaultFontFamily: 'Arial',
      defaultFontWeight: 700,
      loadSystemFonts: true,
    },
  })
    .render()
    .asPng()
  writeFileSync(join(outDir, filename), png)
  console.log('wrote', filename, png.length, 'bytes')
}

mkdirSync(outDir, { recursive: true })

render(iconSvg({ size: 512, padding: 28, text: 'QBP' }), 'icon-512.png')
render(iconSvg({ size: 192, padding: 10, text: 'QBP' }), 'icon-192.png')
render(iconSvg({ size: 512, padding: 72, text: 'QBP' }), 'icon-512-maskable.png')
render(iconSvg({ size: 192, padding: 28, text: 'QBP' }), 'icon-192-maskable.png')
render(iconSvg({ size: 180, padding: 12, text: 'QBP' }), 'apple-touch-icon.png')
render(iconSvg({ size: 32, padding: 2, text: 'Q' }), 'favicon-32.png')
render(iconSvg({ size: 16, padding: 1, text: 'Q' }), 'favicon-16.png')

writeFileSync(join(outDir, 'icon.svg'), iconSvg({ size: 512, padding: 28, text: 'QBP' }))
console.log('wrote icon.svg')
