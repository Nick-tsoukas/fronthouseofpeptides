// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: process.env.NODE_ENV !== 'production' },

  nitro: {
    preset: 'node-server',
  },

  ssr: true,

  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag.startsWith('moov-'),
    },
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
  ],

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: 'tailwind.config.js',
  },

  // Env contract (see .env.example):
  // Private: STRAPI_TOKEN, MOOV_*, SHIPPO_API_TOKEN, SHIPPING_FROM_*, DEFAULT_PARCEL_*, SMTP_*, OWNER_*
  // Public:  STRAPI_URL, APP_URL, MOOV_MODE, SHIPPO_MODE (modes only — no secrets)
  // Legacy names NOT supported: PUBLIC_MOOV, SECRET_MOOV, SHIPPO_TEST, API_TOKEN_STRAPI
  runtimeConfig: {
    nodeEnv: process.env.NODE_ENV || 'development',

    // Server-only keys (never put secrets under `public`)
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    strapiToken: process.env.STRAPI_TOKEN || '',
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: process.env.SMTP_PORT || '587',
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    orderFromEmail: process.env.ORDER_FROM_EMAIL || '',
    ownerOrderEmail: process.env.OWNER_ORDER_EMAIL || '',
    ownerAdminPassword: process.env.OWNER_ADMIN_PASSWORD || '',
    ownerSessionSecret: process.env.OWNER_SESSION_SECRET || 'changeme-dev-secret',

    // Web Push (server-only private key)
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
    vapidSubject: process.env.VAPID_SUBJECT || 'mailto:orders@quantumbiopeptides.com',

    // Moov (server-only — never expose in public)
    moovPublicKey: process.env.MOOV_PUBLIC_KEY || '',
    moovSecretKey: process.env.MOOV_SECRET_KEY || '',
    moovAccountId: process.env.MOOV_ACCOUNT_ID || '',
    moovMode: process.env.MOOV_MODE || 'test',
    moovWebhookSecret: process.env.MOOV_WEBHOOK_SECRET || '',

    // Shippo (server-only — never expose in public)
    shippoApiToken: process.env.SHIPPO_API_TOKEN || '',
    shippoMode: process.env.SHIPPO_MODE || 'test',
    // Comma-separated carrier allowlist for checkout rates (default: usps)
    shippoAllowedCarriers: process.env.SHIPPO_ALLOWED_CARRIERS || 'usps',
    shippingFromName: process.env.SHIPPING_FROM_NAME || '',
    shippingFromCompany: process.env.SHIPPING_FROM_COMPANY || '',
    shippingFromStreet1: process.env.SHIPPING_FROM_STREET1 || '',
    shippingFromStreet2: process.env.SHIPPING_FROM_STREET2 || '',
    shippingFromCity: process.env.SHIPPING_FROM_CITY || '',
    shippingFromState: process.env.SHIPPING_FROM_STATE || '',
    shippingFromZip: process.env.SHIPPING_FROM_ZIP || '',
    shippingFromCountry: process.env.SHIPPING_FROM_COUNTRY || 'US',
    shippingFromPhone: process.env.SHIPPING_FROM_PHONE || '',
    shippingFromEmail: process.env.SHIPPING_FROM_EMAIL || '',
    defaultParcelLengthIn: process.env.DEFAULT_PARCEL_LENGTH_IN || '6',
    defaultParcelWidthIn: process.env.DEFAULT_PARCEL_WIDTH_IN || '4',
    defaultParcelHeightIn: process.env.DEFAULT_PARCEL_HEIGHT_IN || '2',
    defaultParcelWeightOz: process.env.DEFAULT_PARCEL_WEIGHT_OZ || '6',

    // Public (client-safe only — no API keys/tokens)
    public: {
      strapiUrl: process.env.STRAPI_URL || 'http://localhost:1337',
      appUrl: process.env.APP_URL || 'http://localhost:3000',
      moovMode: process.env.MOOV_MODE || 'test',
      shippoMode: process.env.SHIPPO_MODE || 'test',
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
    }
  },

  app: {
    head: {
      title: 'Quantum Bio Peptides | Research-Grade Peptides',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'Premium research-grade peptides for qualified professionals. US shipping only.' },
        { name: 'theme-color', content: '#000000' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'QBP' },
        { name: 'application-name', content: 'QBP' },
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/icons/favicon-32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/icons/favicon-16.png' },
        { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' },
      ]
    }
  },

  compatibilityDate: '2024-04-03'
})
