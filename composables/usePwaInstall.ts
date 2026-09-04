type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function readStandalone() {
  if (!import.meta.client) return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((navigator as any).standalone)
  )
}

function readIOS() {
  if (!import.meta.client) return false
  const ua = navigator.userAgent || ''
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export function usePwaInstall(kind: 'admin' | 'store' = 'admin') {
  const adminPrompt = useState<BeforeInstallPromptEvent | null>('pwa-admin-prompt', () => null)
  const storePrompt = useState<BeforeInstallPromptEvent | null>('pwa-store-prompt', () => null)
  const attached = useState('pwa-install-attached', () => false)
  const justInstalled = useState('pwa-just-installed', () => false)
  const standalone = useState('pwa-standalone', () => false)
  const ios = useState('pwa-ios', () => false)
  /** False until client attach() — prevents SSR/hydration install-chrome mismatches. */
  const ready = useState('pwa-install-ready', () => false)

  const promptEvent = computed(() => (kind === 'admin' ? adminPrompt.value : storePrompt.value))
  const canNativeInstall = computed(() => Boolean(promptEvent.value) && !standalone.value)
  const showInstall = computed(
    () => ready.value && !standalone.value && !justInstalled.value
  )

  function attach() {
    if (!import.meta.client || attached.value) return
    attached.value = true
    standalone.value = readStandalone()
    ios.value = readIOS()
    ready.value = true

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault()
      // Owner PWA only — never surface install UI on the customer storefront/checkout.
      if (window.location.pathname.startsWith('/admin')) {
        adminPrompt.value = event as BeforeInstallPromptEvent
      } else {
        storePrompt.value = null
      }
    })

    window.addEventListener('appinstalled', () => {
      adminPrompt.value = null
      storePrompt.value = null
      justInstalled.value = true
      standalone.value = true
    })

    window.matchMedia('(display-mode: standalone)').addEventListener('change', () => {
      standalone.value = readStandalone()
    })
  }

  async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    const ev = promptEvent.value
    if (!ev?.prompt) return 'unavailable'
    await ev.prompt()
    const { outcome } = await ev.userChoice
    if (kind === 'admin') adminPrompt.value = null
    else storePrompt.value = null
    if (outcome === 'accepted') {
      justInstalled.value = true
      standalone.value = true
    }
    return outcome
  }

  return {
    canNativeInstall,
    showInstall,
    ready,
    standalone,
    ios,
    justInstalled,
    attach,
    promptInstall,
  }
}
