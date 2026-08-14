function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

export function useOwnerPush() {
  const permission = ref<NotificationPermission | 'unsupported'>('default')
  const subscribed = ref(false)
  const configured = ref(false)
  const busy = ref(false)
  const error = ref('')

  async function adminRegistration() {
    if (!import.meta.client || !('serviceWorker' in navigator)) return null
    return (
      (await navigator.serviceWorker.getRegistration('/admin')) ||
      (await navigator.serviceWorker.register('/sw-admin.js', { scope: '/admin' }))
    )
  }

  async function refresh() {
    error.value = ''
    if (!import.meta.client || !('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      permission.value = 'unsupported'
      return
    }
    permission.value = Notification.permission

    try {
      const vapid = await $fetch<{ ok: boolean; configured: boolean; publicKey: string }>(
        '/api/admin/push/vapid',
        { credentials: 'include' }
      )
      configured.value = Boolean(vapid.configured && vapid.publicKey)
    } catch {
      configured.value = false
    }

    const reg = await adminRegistration()
    const sub = await reg?.pushManager.getSubscription()
    subscribed.value = Boolean(sub)
  }

  async function enable() {
    busy.value = true
    error.value = ''
    try {
      if (!import.meta.client || !('Notification' in window)) {
        throw new Error('Push is not supported in this browser.')
      }

      const vapid = await $fetch<{ ok: boolean; configured: boolean; publicKey: string }>(
        '/api/admin/push/vapid',
        { credentials: 'include' }
      )
      if (!vapid.configured || !vapid.publicKey) {
        throw new Error('Push is not configured on the server yet.')
      }

      const permissionResult = await Notification.requestPermission()
      permission.value = permissionResult
      if (permissionResult !== 'granted') {
        throw new Error('Notifications were blocked. Enable them in the browser or phone settings.')
      }

      const reg = await adminRegistration()
      if (!reg) throw new Error('Admin app is not installed yet. Add QBP Owner to your home screen, then try again.')

      const existing = await reg.pushManager.getSubscription()
      const sub =
        existing ||
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapid.publicKey),
        }))

      await $fetch('/api/admin/push/subscribe', {
        method: 'POST',
        credentials: 'include',
        body: sub.toJSON(),
      })
      subscribed.value = true
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Could not enable notifications.'
      subscribed.value = false
    } finally {
      busy.value = false
    }
  }

  async function disable() {
    busy.value = true
    error.value = ''
    try {
      const reg = await adminRegistration()
      const sub = await reg?.pushManager.getSubscription()
      if (sub) {
        await $fetch('/api/admin/push/unsubscribe', {
          method: 'POST',
          credentials: 'include',
          body: { endpoint: sub.endpoint },
        }).catch(() => {})
        await sub.unsubscribe()
      }
      subscribed.value = false
    } catch (err: any) {
      error.value = err.message || 'Could not disable notifications.'
    } finally {
      busy.value = false
    }
  }

  async function sendTest() {
    busy.value = true
    error.value = ''
    try {
      await $fetch('/api/admin/push/test', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Test notification failed.'
    } finally {
      busy.value = false
    }
  }

  return {
    permission,
    subscribed,
    configured,
    busy,
    error,
    refresh,
    enable,
    disable,
    sendTest,
  }
}
