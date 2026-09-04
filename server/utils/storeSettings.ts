import type { H3Event } from 'h3'
import {
  DEFAULT_STORE_SETTINGS,
  normalizeSocialLinks,
  type StoreSettings,
} from '~/utils/storeSettings'

let cache: { at: number; data: StoreSettings; persisted: boolean } | null = null
const CACHE_MS = 15_000

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

function mapStrapiAttributes(attrs: Record<string, any> | null | undefined, updatedAt?: string | null): StoreSettings {
  const a = attrs || {}
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
    paymentMode: (['cashapp_manual', 'moov', 'manual_multi', 'disabled'].includes(String(a.paymentMode))
      ? String(a.paymentMode)
      : DEFAULT_STORE_SETTINGS.paymentMode) as StoreSettings['paymentMode'],
    cashAppEnabled: a.cashAppEnabled !== false,
    cashAppCashtag: str(a.cashAppCashtag),
    cashAppDisplayName: str(a.cashAppDisplayName),
    cashAppPaymentUrl: str(a.cashAppPaymentUrl),
    cashAppQrImageUrl: str(a.cashAppQrImageUrl),
    manualPaymentExpirationHours: Math.max(
      1,
      Number(a.manualPaymentExpirationHours) || DEFAULT_STORE_SETTINGS.manualPaymentExpirationHours
    ),
    manualPaymentSupportEmail: str(a.manualPaymentSupportEmail),
    zelleEnabled: Boolean(a.zelleEnabled),
    zelleHandle: str(a.zelleHandle),
    zelleDisplayName: str(a.zelleDisplayName),
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

export function settingsToStrapiData(body: Partial<StoreSettings>): Record<string, any> {
  const social = normalizeSocialLinks(body.socialLinks)
  return {
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
    paymentMode: (['cashapp_manual', 'moov', 'manual_multi', 'disabled'].includes(String(body.paymentMode))
      ? String(body.paymentMode)
      : DEFAULT_STORE_SETTINGS.paymentMode),
    cashAppEnabled: body.cashAppEnabled !== false,
    cashAppCashtag: str(body.cashAppCashtag),
    cashAppDisplayName: str(body.cashAppDisplayName),
    cashAppPaymentUrl: str(body.cashAppPaymentUrl),
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

export async function saveStoreSettings(event: H3Event, body: Partial<StoreSettings>): Promise<StoreSettings> {
  const { strapiUrl, headers } = strapiHeaders(event)
  const payload = { data: settingsToStrapiData(body) }

  try {
    const res = await $fetch<{ data?: any }>(`${strapiUrl}/api/store-setting`, {
      method: 'PUT',
      headers,
      body: payload,
    })
    const data = res?.data
    const attrs = data?.attributes || data || payload.data
    const settings = mapStrapiAttributes(attrs, data?.updatedAt || attrs?.updatedAt || new Date().toISOString())
    cache = { at: Date.now(), data: settings, persisted: true }
    return settings
  } catch (err: any) {
    const status = err?.statusCode || err?.status || err?.response?.status
    if (status === 404) {
      const created = await $fetch<{ data?: any }>(`${strapiUrl}/api/store-setting`, {
        method: 'POST',
        headers,
        body: payload,
      }).catch((createErr: any) => {
        throw createError({
          statusCode: 503,
          message:
            'Store Settings are not available in Strapi yet. Redeploy the Strapi app so the store-setting type exists, then try again.',
        })
      })
      const data = created?.data
      const attrs = data?.attributes || data || payload.data
      const settings = mapStrapiAttributes(attrs, data?.updatedAt || attrs?.updatedAt || new Date().toISOString())
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
