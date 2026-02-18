// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  // Desactivar SSR - El admin es privado, no necesita SEO
  // Esto elimina todos los errores de hydration mismatch
  ssr: false,

  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/images/favicon.svg' }
      ]
    }
  },

  runtimeConfig: {
    // Private (server-side only)
    apiUrl: process.env.NUXT_API_URL || process.env.NUXT_PUBLIC_API_URL || 'http://localhost:3001/api',
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:3001/api',
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'TaskHub',
    },
  },

  nitro: {},

  modules: [
    '@nuxtjs/tailwindcss',
    'shadcn-nuxt',
    '@nuxtjs/i18n',
    '@nuxtjs/color-mode'
  ],

  colorMode: {
    classSuffix: '',
    preference: 'light',
    fallback: 'light',
  },

  i18n: {
    defaultLocale: 'es',
    locales: [
      { code: 'en', file: 'en.json', name: 'English' },
      { code: 'es', file: 'es.json', name: 'Español' },
    ],
    langDir: './lang',
  },

  shadcn: {
    prefix: '',
    componentDir: './components/ui'
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  css: ['~/assets/css/main.css'],

  components: [
    {
      path: '~/components',
      pathPrefix: false,
      extensions: ['.vue'],
      ignore: ['**/*.ts', '**/*.js', '**/types.ts', '**/index.ts']
    },
    // Auto-descubrimiento de componentes de módulos
    {
      path: '~/modules/*/components',
      pathPrefix: false,
      global: false,
      extensions: ['.vue'],
      ignore: ['**/*.ts', '**/*.js', '**/types.ts', '**/index.ts']
    },
    {
      path: '~/modules/_shared/components',
      pathPrefix: false,
      global: true,
      extensions: ['.vue'],
      ignore: ['**/*.ts', '**/*.js', '**/types.ts', '**/index.ts']
    }
  ],
})
