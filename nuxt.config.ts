// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  
  ssr: true,

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
    
    // Public keys (available on client)
    public: {
      strapiUrl: process.env.STRAPI_URL || 'http://localhost:1337',
      appUrl: process.env.APP_URL || 'http://localhost:3000',
    }
  },

  app: {
    head: {
      title: 'House of Peptides | Research-Grade Peptides',
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
