import type { PublicStoreSettings } from '~/utils/storeSettings'
import { DEFAULT_STORE_SETTINGS, toPublicStoreSettings } from '~/utils/storeSettings'

export function usePublicStoreSettings() {
  return useAsyncData(
    'public-store-settings',
    () => $fetch<PublicStoreSettings>('/api/store/public'),
    {
      default: () => toPublicStoreSettings(DEFAULT_STORE_SETTINGS),
    }
  )
}
