import type { H3Event } from 'h3'
import {
  DEFAULT_STORE_SETTINGS,
  normalizeSocialLinks,
  normalizeCashAppCashtag,
  cashAppPaymentUrlFromCashtag,
  isAutoCashAppPaymentUrl,
  type StoreSettings,
} from '~/utils/storeSettings'

let cache: { at: number; data: StoreSettings; persisted: boolean } | null = null
const CACHE_MS = 15_000

/** Hidden JSON bag inside socialLinks so payment settings persist even before Strapi schema redeploy. */
const PAYMENT_BACKUP_KEY = '_qbpPayment'

type PaymentBackup = {
  paymentMode?: StoreSettings['paymentMode']
  cashAppEnabled?: boolean
  cashAppCashtag?: string
  cashAppDisplayName?: string
  cashAppPaymentUrl?: string
  cashAppQrImageUrl?: string
  manualPaymentExpirationHours?: number
  manualPaymentSupportEmail?: string
  zelleEnabled?: boolean
  zelleHandle?: string
  zelleDisplayName?: string
}

export function invalidateStoreSettingsCache() {
  cache = null
}

function str(value: unknown, fallback = ''): string {
  if (value == null) return fallback
  return String(value).trim()
}

function numStr(value: unknown, fallback: string): string {
  if (value == null || value === '') return fallback
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return String(n)
}

function readPaymentBackup(rawSocial: unknown): PaymentBackup {
  if (!rawSocial || typeof rawSocial !== 'object') return {}
  const bag = (rawSocial as Record<string, unknown>)[PAYMENT_BACKUP_KEY]
  if (!bag || typeof bag !== 'object') return {}
  return bag as PaymentBackup
}

function buildPaymentFields(
  primary: Record<string, any>,
  backup: PaymentBackup = {}
): Pick<
  StoreSettings,
  | 'paymentMode'
  | 'cashAppEnabled'
  | 'cashAppCashtag'
  | 'cashAppDisplayName'
  | 'cashAppPaymentUrl'
  | 'cashAppQrImageUrl'
  | 'manualPaymentExpirationHours'
  | 'manualPaymentSupportEmail'
  | 'zelleEnabled'
  | 'zelleHandle'
  | 'zelleDisplayName'
> {
  const cashtag =
    normalizeCashAppCashtag(primary.cashAppCashtag) ||
    normalizeCashAppCashtag(backup.cashAppCashtag) ||
    DEFAULT_STORE_SETTINGS.cashAppCashtag

  let paymentUrl =
    str(primary.cashAppPaymentUrl) ||
    str(backup.cashAppPaymentUrl) ||
    ''
  if (!paymentUrl || isAutoCashAppPaymentUrl(paymentUrl, cashtag)) {
    paymentUrl = cashAppPaymentUrlFromCashtag(cashtag)
  }

  const modeRaw = primary.paymentMode ?? backup.paymentMode
  const paymentMode = (
    ['cashapp_manual', 'moov', 'manual_multi', 'disabled'].includes(String(modeRaw))
      ? String(modeRaw)
      : DEFAULT_STORE_SETTINGS.paymentMode
  ) as StoreSettings['paymentMode']

  const enabledPrimary = primary.cashAppEnabled
  const enabledBackup = backup.cashAppEnabled

  return {
    paymentMode,
    cashAppEnabled:
      enabledPrimary !== undefined && enabledPrimary !== null
        ? Boolean(enabledPrimary)
        : enabledBackup !== undefined && enabledBackup !== null
          ? Boolean(enabledBackup)
          : DEFAULT_STORE_SETTINGS.cashAppEnabled,
    cashAppCashtag: cashtag,
    cashAppDisplayName:
      str(primary.cashAppDisplayName) ||
      str(backup.cashAppDisplayName) ||
      DEFAULT_STORE_SETTINGS.cashAppDisplayName,
    cashAppPaymentUrl: paymentUrl,
    cashAppQrImageUrl: str(primary.cashAppQrImageUrl) || str(backup.cashAppQrImageUrl),
    manualPaymentExpirationHours: Math.max(
      1,
      Number(primary.manualPaymentExpirationHours) ||
        Number(backup.manualPaymentExpirationHours) ||
        DEFAULT_STORE_SETTINGS.manualPaymentExpirationHours
    ),
    manualPaymentSupportEmail:
      str(primary.manualPaymentSupportEmail) || str(backup.manualPaymentSupportEmail),
    zelleEnabled: Boolean(
      primary.zelleEnabled !== undefined ? primary.zelleEnabled : backup.zelleEnabled
    ),
    zelleHandle: str(primary.zelleHandle) || str(backup.zelleHandle),
    zelleDisplayName: str(primary.zelleDisplayName) || str(backup.zelleDisplayName),
  }
}

function mapStrapiAttributes(attrs: Record<string, any> | null | undefined, updatedAt?: string | null): StoreSettings {
  const a = attrs || {}
  const backup = readPaymentBackup(a.socialLinks)
  const payment = buildPaymentFields(a, backup)

  return {
    storeName: str(a.storeName, DEFAULT_STORE_SETTINGS.storeName) || DEFAULT_STORE_SETTINGS.storeName,
    legalBusinessName: str(a.legalBusinessName),
    dbaName: str(a.dbaName),
    supportEmail: str(a.supportEmail, DEFAULT_STORE_SETTINGS.supportEmail),
    supportPhone: str(a.supportPhone),
    websiteUrl: str(a.websiteUrl, DEFAULT_STORE_SETTINGS.websiteUrl),
    businessAddressLine1: str(a.businessAddressLine1),
    businessAddressLine2: str(a.businessAddressLine2),
    businessCity: str(a.businessCity),
    businessState: str(a.businessState),
    businessPostalCode: str(a.businessPostalCode),
    businessCountry: str(a.businessCountry, 'US') || 'US',
    shipFromName: str(a.shipFromName),
    shipFromCompany: str(a.shipFromCompany),
    shipFromAddressLine1: str(a.shipFromAddressLine1),
    shipFromAddressLine2: str(a.shipFromAddressLine2),
    shipFromCity: str(a.shipFromCity),
    shipFromState: str(a.shipFromState),
    shipFromPostalCode: str(a.shipFromPostalCode),
    shipFromCountry: str(a.shipFromCountry, 'US') || 'US',
    shipFromPhone: str(a.shipFromPhone),
    shipFromEmail: str(a.shipFromEmail),
    allowedCarriers: str(a.allowedCarriers, DEFAULT_STORE_SETTINGS.allowedCarriers) || 'USPS',
    defaultPackageLengthIn: numStr(a.defaultPackageLengthIn, DEFAULT_STORE_SETTINGS.defaultPackageLengthIn),
    defaultPackageWidthIn: numStr(a.defaultPackageWidthIn, DEFAULT_STORE_SETTINGS.defaultPackageWidthIn),
    defaultPackageHeightIn: numStr(a.defaultPackageHeightIn, DEFAULT_STORE_SETTINGS.defaultPackageHeightIn),
    defaultPackageWeightOz: numStr(a.defaultPackageWeightOz, DEFAULT_STORE_SETTINGS.defaultPackageWeightOz),
    freeShippingEnabled: Boolean(a.freeShippingEnabled),
    orderSupportMessage: str(a.orderSupportMessage),
    termsOfService: str(a.termsOfService),
    privacyPolicy: str(a.privacyPolicy),
    shippingPolicy: str(a.shippingPolicy),
    refundPolicy: str(a.refundPolicy),
    researchUseOnlyPolicy: str(a.researchUseOnlyPolicy),
    contactPolicy: str(a.contactPolicy),
    footerDisclaimer: str(a.footerDisclaimer, DEFAULT_STORE_SETTINGS.footerDisclaimer),
    researchUseOnlyShortDisclaimer: str(
      a.researchUseOnlyShortDisclaimer,
      DEFAULT_STORE_SETTINGS.researchUseOnlyShortDisclaimer
    ),
    socialLinks: normalizeSocialLinks(a.socialLinks),
    announcementBanner: str(a.announcementBanner),
    announcementBannerEnabled: Boolean(a.announcementBannerEnabled),
    ...payment,
    updatedAt: updatedAt || str(a.updatedAt) || null,
  }
}

function strapiHeaders(event: H3Event) {
  const config = useRuntimeConfig(event)
  const token = config.strapiToken as string
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  return { strapiUrl: config.public.strapiUrl as string, headers }
}

export async function fetchStoreSettings(
  event: H3Event,
  opts?: { skipCache?: boolean }
): Promise<{ settings: StoreSettings; persisted: boolean }> {
  if (!opts?.skipCache && cache && Date.now() - cache.at < CACHE_MS) {
    return { settings: cache.data, persisted: cache.persisted }
  }

  const { strapiUrl, headers } = strapiHeaders(event)
  if (!strapiUrl) {
    return { settings: { ...DEFAULT_STORE_SETTINGS }, persisted: false }
  }

  try {
    const res = await $fetch<{ data?: { attributes?: Record<string, any>; updatedAt?: string } | Record<string, any> }>(
      `${strapiUrl}/api/store-setting`,
      { headers }
    )
    const data = res?.data
    if (!data) {
      const fallback = { settings: { ...DEFAULT_STORE_SETTINGS }, persisted: false }
      cache = { at: Date.now(), data: fallback.settings, persisted: false }
      return fallback
    }
    const attrs = (data as any).attributes || data
    const updatedAt = (data as any).updatedAt || attrs.updatedAt || null
    const settings = mapStrapiAttributes(attrs, updatedAt)
    cache = { at: Date.now(), data: settings, persisted: true }
    return { settings, persisted: true }
  } catch (err: any) {
    const status = err?.statusCode || err?.status || err?.response?.status
    if (status !== 404) {
      console.error('[store-settings] fetch failed:', err?.message || err)
    }
    const fallback = { settings: { ...DEFAULT_STORE_SETTINGS }, persisted: false }
    cache = { at: Date.now(), data: fallback.settings, persisted: false }
    return fallback
  }
}

function paymentBackupFromBody(body: Partial<StoreSettings>): PaymentBackup {
  const cashtag = normalizeCashAppCashtag(body.cashAppCashtag) || DEFAULT_STORE_SETTINGS.cashAppCashtag
  let paymentUrl = str(body.cashAppPaymentUrl)
  if (!paymentUrl || isAutoCashAppPaymentUrl(paymentUrl, cashtag)) {
    paymentUrl = cashAppPaymentUrlFromCashtag(cashtag)
  }
  return {
    paymentMode: (['cashapp_manual', 'moov', 'manual_multi', 'disabled'].includes(String(body.paymentMode))
      ? (String(body.paymentMode) as StoreSettings['paymentMode'])
      : DEFAULT_STORE_SETTINGS.paymentMode),
    cashAppEnabled: body.cashAppEnabled !== false,
    cashAppCashtag: cashtag,
    cashAppDisplayName: str(body.cashAppDisplayName) || DEFAULT_STORE_SETTINGS.cashAppDisplayName,
    cashAppPaymentUrl: paymentUrl,
    cashAppQrImageUrl: str(body.cashAppQrImageUrl),
    manualPaymentExpirationHours: Math.max(
      1,
      Number(body.manualPaymentExpirationHours) || DEFAULT_STORE_SETTINGS.manualPaymentExpirationHours
    ),
    manualPaymentSupportEmail: str(body.manualPaymentSupportEmail),
    zelleEnabled: Boolean(body.zelleEnabled),
    zelleHandle: str(body.zelleHandle),
    zelleDisplayName: str(body.zelleDisplayName),
  }
}

export function settingsToStrapiData(
  body: Partial<StoreSettings>,
  opts?: { includeNativePaymentFields?: boolean }
): Record<string, any> {
  const includeNative = opts?.includeNativePaymentFields !== false
  const social = normalizeSocialLinks(body.socialLinks) as Record<string, unknown>
  const payment = paymentBackupFromBody(body)
  social[PAYMENT_BACKUP_KEY] = payment

  const base: Record<string, any> = {
    storeName: str(body.storeName, DEFAULT_STORE_SETTINGS.storeName),
    legalBusinessName: str(body.legalBusinessName),
    dbaName: str(body.dbaName),
    supportEmail: str(body.supportEmail),
    supportPhone: str(body.supportPhone),
    websiteUrl: str(body.websiteUrl),
    businessAddressLine1: str(body.businessAddressLine1),
    businessAddressLine2: str(body.businessAddressLine2),
    businessCity: str(body.businessCity),
    businessState: str(body.businessState),
    businessPostalCode: str(body.businessPostalCode),
    businessCountry: str(body.businessCountry, 'US') || 'US',
    shipFromName: str(body.shipFromName),
    shipFromCompany: str(body.shipFromCompany),
    shipFromAddressLine1: str(body.shipFromAddressLine1),
    shipFromAddressLine2: str(body.shipFromAddressLine2),
    shipFromCity: str(body.shipFromCity),
    shipFromState: str(body.shipFromState),
    shipFromPostalCode: str(body.shipFromPostalCode),
    shipFromCountry: str(body.shipFromCountry, 'US') || 'US',
    shipFromPhone: str(body.shipFromPhone),
    shipFromEmail: str(body.shipFromEmail),
    allowedCarriers: str(body.allowedCarriers, 'USPS') || 'USPS',
    defaultPackageLengthIn: body.defaultPackageLengthIn === '' || body.defaultPackageLengthIn == null
      ? null
      : Number(body.defaultPackageLengthIn),
    defaultPackageWidthIn: body.defaultPackageWidthIn === '' || body.defaultPackageWidthIn == null
      ? null
      : Number(body.defaultPackageWidthIn),
    defaultPackageHeightIn: body.defaultPackageHeightIn === '' || body.defaultPackageHeightIn == null
      ? null
      : Number(body.defaultPackageHeightIn),
    defaultPackageWeightOz: body.defaultPackageWeightOz === '' || body.defaultPackageWeightOz == null
      ? null
      : Number(body.defaultPackageWeightOz),
    freeShippingEnabled: Boolean(body.freeShippingEnabled),
    orderSupportMessage: str(body.orderSupportMessage),
    termsOfService: typeof body.termsOfService === 'string' ? body.termsOfService : '',
    privacyPolicy: typeof body.privacyPolicy === 'string' ? body.privacyPolicy : '',
    shippingPolicy: typeof body.shippingPolicy === 'string' ? body.shippingPolicy : '',
    refundPolicy: typeof body.refundPolicy === 'string' ? body.refundPolicy : '',
    researchUseOnlyPolicy: typeof body.researchUseOnlyPolicy === 'string' ? body.researchUseOnlyPolicy : '',
    contactPolicy: typeof body.contactPolicy === 'string' ? body.contactPolicy : '',
    footerDisclaimer: str(body.footerDisclaimer),
    researchUseOnlyShortDisclaimer: str(body.researchUseOnlyShortDisclaimer),
    socialLinks: social,
    announcementBanner: str(body.announcementBanner),
    announcementBannerEnabled: Boolean(body.announcementBannerEnabled),
  }

  if (includeNative) {
    Object.assign(base, {
      paymentMode: payment.paymentMode,
      cashAppEnabled: payment.cashAppEnabled,
      cashAppCashtag: payment.cashAppCashtag,
      cashAppDisplayName: payment.cashAppDisplayName,
      cashAppPaymentUrl: payment.cashAppPaymentUrl,
      cashAppQrImageUrl: payment.cashAppQrImageUrl,
      manualPaymentExpirationHours: payment.manualPaymentExpirationHours,
      manualPaymentSupportEmail: payment.manualPaymentSupportEmail,
      zelleEnabled: payment.zelleEnabled,
      zelleHandle: payment.zelleHandle,
      zelleDisplayName: payment.zelleDisplayName,
    })
  }

  return base
}

async function putStoreSetting(
  strapiUrl: string,
  headers: Record<string, string>,
  data: Record<string, any>
) {
  return $fetch<{ data?: any }>(`${strapiUrl}/api/store-setting`, {
    method: 'PUT',
    headers,
    body: { data },
  })
}

export async function saveStoreSettings(event: H3Event, body: Partial<StoreSettings>): Promise<StoreSettings> {
  const { strapiUrl, headers } = strapiHeaders(event)
  const fullPayload = settingsToStrapiData(body, { includeNativePaymentFields: true })
  const backupOnlyPayload = settingsToStrapiData(body, { includeNativePaymentFields: false })

  try {
    let res: { data?: any }
    try {
      res = await putStoreSetting(strapiUrl, headers, fullPayload)
    } catch (err: any) {
      const status = err?.statusCode || err?.status || err?.response?.status
      // Production Strapi may not have payment columns yet — persist via socialLinks JSON backup.
      if (status === 400 || status === 500) {
        console.warn('[store-settings] native payment fields rejected; saving via socialLinks backup')
        res = await putStoreSetting(strapiUrl, headers, backupOnlyPayload)
      } else {
        throw err
      }
    }

    const data = res?.data
    const attrs = data?.attributes || data || backupOnlyPayload
    // Merge request payment values in case Strapi response omits backup keys briefly
    const settings = mapStrapiAttributes(
      { ...attrs, ...paymentBackupFromBody(body), socialLinks: attrs.socialLinks || backupOnlyPayload.socialLinks },
      data?.updatedAt || attrs?.updatedAt || new Date().toISOString()
    )
    cache = { at: Date.now(), data: settings, persisted: true }
    return settings
  } catch (err: any) {
    const status = err?.statusCode || err?.status || err?.response?.status
    if (status === 404) {
      const created = await $fetch<{ data?: any }>(`${strapiUrl}/api/store-setting`, {
        method: 'POST',
        headers,
        body: { data: backupOnlyPayload },
      }).catch(() => {
        throw createError({
          statusCode: 503,
          message:
            'Store Settings are not available in Strapi yet. Redeploy the Strapi app so the store-setting type exists, then try again.',
        })
      })
      const data = created?.data
      const attrs = data?.attributes || data || backupOnlyPayload
      const settings = mapStrapiAttributes(
        { ...attrs, ...paymentBackupFromBody(body), socialLinks: attrs.socialLinks || backupOnlyPayload.socialLinks },
        data?.updatedAt || attrs?.updatedAt || new Date().toISOString()
      )
      cache = { at: Date.now(), data: settings, persisted: true }
      return settings
    }
    console.error('[store-settings] save failed:', err?.message || err)
    throw createError({
      statusCode: 502,
      message: 'Could not save store settings. Try again.',
    })
  }
}

export async function getEmailBrand(event: H3Event): Promise<{
  storeName: string
  supportEmail: string
  websiteUrl: string
}> {
  const { settings } = await fetchStoreSettings(event)
  return {
    storeName: settings.storeName || DEFAULT_STORE_SETTINGS.storeName,
    supportEmail: settings.supportEmail || DEFAULT_STORE_SETTINGS.supportEmail,
    websiteUrl: settings.websiteUrl || DEFAULT_STORE_SETTINGS.websiteUrl,
  }
}
