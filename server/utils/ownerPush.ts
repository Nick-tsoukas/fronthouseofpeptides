import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import webpush from 'web-push'

export interface OwnerPushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

interface StoredSubscription {
  endpoint: string
  keys: { p256dh: string; auth: string }
  createdAt: string
}

function storePath() {
  return join(process.cwd(), '.data', 'owner-push-subscriptions.json')
}

function getVapid(config: ReturnType<typeof useRuntimeConfig>) {
  const publicKey = String(config.vapidPublicKey || config.public?.vapidPublicKey || '').trim()
  const privateKey = String(config.vapidPrivateKey || '').trim()
  const subject = String(config.vapidSubject || '').trim() || 'mailto:orders@quantumbiopeptides.com'
  return { publicKey, privateKey, subject }
}

export function isOwnerPushConfigured(config: ReturnType<typeof useRuntimeConfig>) {
  const { publicKey, privateKey } = getVapid(config)
  return Boolean(publicKey && privateKey)
}

async function loadSubscriptions(): Promise<StoredSubscription[]> {
  try {
    const raw = await readFile(storePath(), 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function saveSubscriptions(list: StoredSubscription[]) {
  const path = storePath()
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify(list, null, 2), 'utf8')
}

function isValidSubscription(body: any): body is StoredSubscription {
  return Boolean(
    body &&
      typeof body.endpoint === 'string' &&
      body.endpoint.startsWith('https://') &&
      body.keys &&
      typeof body.keys.p256dh === 'string' &&
      typeof body.keys.auth === 'string'
  )
}

export async function saveOwnerPushSubscription(sub: any) {
  if (!isValidSubscription(sub)) {
    throw createError({ statusCode: 400, message: 'Invalid push subscription.' })
  }
  const list = await loadSubscriptions()
  const next = list.filter((s) => s.endpoint !== sub.endpoint)
  next.push({
    endpoint: sub.endpoint,
    keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    createdAt: new Date().toISOString(),
  })
  await saveSubscriptions(next)
}

export async function removeOwnerPushSubscription(endpoint: string) {
  if (!endpoint) return
  const list = await loadSubscriptions()
  await saveSubscriptions(list.filter((s) => s.endpoint !== endpoint))
}

export async function notifyOwnerPush(payload: OwnerPushPayload) {
  try {
    const config = useRuntimeConfig()
    if (!isOwnerPushConfigured(config)) return

    const { publicKey, privateKey, subject } = getVapid(config)
    webpush.setVapidDetails(subject, publicKey, privateKey)

    const list = await loadSubscriptions()
    if (!list.length) return

    const body = JSON.stringify({
      title: payload.title.slice(0, 80),
      body: payload.body.slice(0, 180),
      url: payload.url || '/admin/orders',
      tag: payload.tag || 'qbp-owner',
    })

    const stale: string[] = []
    await Promise.all(
      list.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys,
            },
            body,
            { TTL: 60 * 60 * 12, urgency: 'high' }
          )
        } catch (err: any) {
          const status = err?.statusCode || err?.status
          if (status === 404 || status === 410) {
            stale.push(sub.endpoint)
          } else {
            console.error('[owner-push] send failed')
          }
        }
      })
    )

    if (stale.length) {
      await saveSubscriptions(list.filter((s) => !stale.includes(s.endpoint)))
    }
  } catch (err: any) {
    console.error('[owner-push] notify failed:', err?.message || err)
  }
}
