import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const src = join(process.cwd(), '.output', 'public')
const dest = join(process.cwd(), '.output', 'server', 'chunks', 'public')

if (!existsSync(src)) {
  console.warn('[copy-nitro-public] skipped — .output/public not found')
  process.exit(0)
}

mkdirSync(dest, { recursive: true })
cpSync(src, dest, { recursive: true })
console.log('[copy-nitro-public] copied .output/public → .output/server/chunks/public')
