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

  runtimeConfig: {
    nodeEnv: process.env.NODE_ENV || 'development',

    // Server-only keys
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

    // Moov (server-only — never expose in public)
    moovPublicKey: process.env.MOOV_PUBLIC_KEY || '',
    moovSecretKey: process.env.MOOV_SECRET_KEY || '',
    moovAccountId: process.env.MOOV_ACCOUNT_ID || '',
    moovMode: process.env.MOOV_MODE || 'test',
    moovWebhookSecret: process.env.MOOV_WEBHOOK_SECRET || '',

    // Shippo (server-only — never expose in public)
    shippoApiToken: process.env.SHIPPO_API_TOKEN || '',
    shippoMode: process.env.SHIPPO_MODE || 'test',
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

    // Public keys (available on client)
    public: {
      strapiUrl: process.env.STRAPI_URL || 'http://localhost:1337',
      appUrl: process.env.APP_URL || 'http://localhost:3000',
      moovMode: process.env.MOOV_MODE || 'test',
      shippoMode: process.env.SHIPPO_MODE || 'test',
    }
  },

  app: {
    head: {
      title: 'Quantum Bio Peptides | Research-Grade Peptides',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Premium research-grade peptides for qualified professionals. US shipping only.' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  compatibilityDate: '2024-04-03'
})
