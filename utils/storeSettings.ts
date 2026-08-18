import {
  STARTER_CONTACT_POLICY,
  STARTER_FOOTER_DISCLAIMER,
  STARTER_PRIVACY_POLICY,
  STARTER_REFUND_POLICY,
  STARTER_RESEARCH_USE_ONLY,
  STARTER_RUO_SHORT,
  STARTER_SHIPPING_POLICY,
  STARTER_TERMS_OF_SERVICE,
} from '~/utils/storePolicyDefaults'

export interface StoreSocialLinks {
  instagram?: string
  twitter?: string
  facebook?: string
}

export interface StoreSettings {
  storeName: string
  legalBusinessName: string
  dbaName: string
  supportEmail: string
  supportPhone: string
  websiteUrl: string
  businessAddressLine1: string
  businessAddressLine2: string
  businessCity: string
  businessState: string
  businessPostalCode: string
  businessCountry: string
  shipFromName: string
  shipFromCompany: string
  shipFromAddressLine1: string
  shipFromAddressLine2: string
  shipFromCity: string
  shipFromState: string
  shipFromPostalCode: string
  shipFromCountry: string
  shipFromPhone: string
  shipFromEmail: string
  allowedCarriers: string
  defaultPackageLengthIn: string
  defaultPackageWidthIn: string
  defaultPackageHeightIn: string
  defaultPackageWeightOz: string
  freeShippingEnabled: boolean
  orderSupportMessage: string
  termsOfService: string
  privacyPolicy: string
  shippingPolicy: string
  refundPolicy: string
  researchUseOnlyPolicy: string
  contactPolicy: string
  footerDisclaimer: string
  researchUseOnlyShortDisclaimer: string
  socialLinks: StoreSocialLinks
  announcementBanner: string
  announcementBannerEnabled: boolean
  updatedAt: string | null
}

export type PublicStoreSettings = Pick<
  StoreSettings,
  | 'storeName'
  | 'legalBusinessName'
  | 'dbaName'
  | 'supportEmail'
  | 'supportPhone'
  | 'websiteUrl'
  | 'businessAddressLine1'
  | 'businessAddressLine2'
  | 'businessCity'
  | 'businessState'
  | 'businessPostalCode'
  | 'businessCountry'
  | 'orderSupportMessage'
  | 'termsOfService'
  | 'privacyPolicy'
  | 'shippingPolicy'
  | 'refundPolicy'
  | 'researchUseOnlyPolicy'
  | 'contactPolicy'
  | 'footerDisclaimer'
  | 'researchUseOnlyShortDisclaimer'
  | 'socialLinks'
  | 'announcementBanner'
  | 'announcementBannerEnabled'
  | 'updatedAt'
>

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'Quantum Bio Peptides',
  legalBusinessName: '',
  dbaName: '',
  supportEmail: 'orders@quantumbiopeptides.com',
  supportPhone: '',
  websiteUrl: 'https://quantumbiopeptides.com',
  businessAddressLine1: '',
  businessAddressLine2: '',
  businessCity: '',
  businessState: '',
  businessPostalCode: '',
  businessCountry: 'US',
  shipFromName: '',
  shipFromCompany: '',
  shipFromAddressLine1: '',
  shipFromAddressLine2: '',
  shipFromCity: '',
  shipFromState: '',
  shipFromPostalCode: '',
  shipFromCountry: 'US',
  shipFromPhone: '',
  shipFromEmail: '',
  allowedCarriers: 'USPS',
  defaultPackageLengthIn: '6',
  defaultPackageWidthIn: '4',
  defaultPackageHeightIn: '2',
  defaultPackageWeightOz: '6',
  freeShippingEnabled: false,
  orderSupportMessage: '',
  termsOfService: '',
  privacyPolicy: '',
  shippingPolicy: '',
  refundPolicy: '',
  researchUseOnlyPolicy: '',
  contactPolicy: '',
  footerDisclaimer: STARTER_FOOTER_DISCLAIMER,
  researchUseOnlyShortDisclaimer: STARTER_RUO_SHORT,
  socialLinks: {},
  announcementBanner: '',
  announcementBannerEnabled: false,
  updatedAt: null,
}

export function withPolicyFallbacks<T extends Partial<StoreSettings>>(settings: T): T & {
  termsOfService: string
  privacyPolicy: string
  shippingPolicy: string
  refundPolicy: string
  researchUseOnlyPolicy: string
  contactPolicy: string
  footerDisclaimer: string
  researchUseOnlyShortDisclaimer: string
} {
  return {
    ...settings,
    termsOfService: (settings.termsOfService || '').trim() || STARTER_TERMS_OF_SERVICE,
    privacyPolicy: (settings.privacyPolicy || '').trim() || STARTER_PRIVACY_POLICY,
    shippingPolicy: (settings.shippingPolicy || '').trim() || STARTER_SHIPPING_POLICY,
    refundPolicy: (settings.refundPolicy || '').trim() || STARTER_REFUND_POLICY,
    researchUseOnlyPolicy: (settings.researchUseOnlyPolicy || '').trim() || STARTER_RESEARCH_USE_ONLY,
    contactPolicy: (settings.contactPolicy || '').trim() || STARTER_CONTACT_POLICY,
    footerDisclaimer: (settings.footerDisclaimer || '').trim() || STARTER_FOOTER_DISCLAIMER,
    researchUseOnlyShortDisclaimer:
      (settings.researchUseOnlyShortDisclaimer || '').trim() || STARTER_RUO_SHORT,
  }
}

export function toPublicStoreSettings(settings: StoreSettings): PublicStoreSettings {
  const withPolicies = withPolicyFallbacks(settings)
  return {
    storeName: withPolicies.storeName,
    legalBusinessName: withPolicies.legalBusinessName,
    dbaName: withPolicies.dbaName,
    supportEmail: withPolicies.supportEmail,
    supportPhone: withPolicies.supportPhone,
    websiteUrl: withPolicies.websiteUrl,
    businessAddressLine1: withPolicies.businessAddressLine1,
    businessAddressLine2: withPolicies.businessAddressLine2,
    businessCity: withPolicies.businessCity,
    businessState: withPolicies.businessState,
    businessPostalCode: withPolicies.businessPostalCode,
    businessCountry: withPolicies.businessCountry,
    orderSupportMessage: withPolicies.orderSupportMessage,
    termsOfService: withPolicies.termsOfService,
    privacyPolicy: withPolicies.privacyPolicy,
    shippingPolicy: withPolicies.shippingPolicy,
    refundPolicy: withPolicies.refundPolicy,
    researchUseOnlyPolicy: withPolicies.researchUseOnlyPolicy,
    contactPolicy: withPolicies.contactPolicy,
    footerDisclaimer: withPolicies.footerDisclaimer,
    researchUseOnlyShortDisclaimer: withPolicies.researchUseOnlyShortDisclaimer,
    socialLinks: withPolicies.socialLinks || {},
    announcementBanner: withPolicies.announcementBanner,
    announcementBannerEnabled: withPolicies.announcementBannerEnabled,
    updatedAt: withPolicies.updatedAt,
  }
}

export function isShipFromComplete(settings: Pick<
  StoreSettings,
  'shipFromName' | 'shipFromAddressLine1' | 'shipFromCity' | 'shipFromState' | 'shipFromPostalCode' | 'shipFromCountry'
>): boolean {
  return Boolean(
    settings.shipFromName?.trim() &&
      settings.shipFromAddressLine1?.trim() &&
      settings.shipFromCity?.trim() &&
      settings.shipFromState?.trim() &&
      settings.shipFromPostalCode?.trim() &&
      settings.shipFromCountry?.trim()
  )
}

export function policiesCompleted(settings: StoreSettings): {
  terms: boolean
  privacy: boolean
  shipping: boolean
  refund: boolean
  research: boolean
  contact: boolean
  all: boolean
} {
  const terms = Boolean(settings.termsOfService?.trim())
  const privacy = Boolean(settings.privacyPolicy?.trim())
  const shipping = Boolean(settings.shippingPolicy?.trim())
  const refund = Boolean(settings.refundPolicy?.trim())
  const research = Boolean(settings.researchUseOnlyPolicy?.trim())
  const contact = Boolean(settings.contactPolicy?.trim())
  return {
    terms,
    privacy,
    shipping,
    refund,
    research,
    contact,
    all: terms && privacy && shipping && refund && research && contact,
  }
}

export function normalizeSocialLinks(raw: unknown): StoreSocialLinks {
  if (!raw || typeof raw !== 'object') return {}
  const obj = raw as Record<string, unknown>
  const pick = (key: string) => (typeof obj[key] === 'string' ? String(obj[key]).trim() : '')
  const out: StoreSocialLinks = {}
  if (pick('instagram')) out.instagram = pick('instagram')
  if (pick('twitter')) out.twitter = pick('twitter')
  if (pick('facebook')) out.facebook = pick('facebook')
  return out
}
