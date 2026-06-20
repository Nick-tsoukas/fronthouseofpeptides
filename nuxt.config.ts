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

    // Public keys (available on client)
    public: {
      strapiUrl: process.env.STRAPI_URL || 'http://localhost:1337',
      appUrl: process.env.APP_URL || 'http://localhost:3000',
      moovMode: process.env.MOOV_MODE || 'test',
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
