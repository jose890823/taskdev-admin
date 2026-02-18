import { config } from '@vue/test-utils'

// Mock de i18n para tests
config.global.mocks = {
  $t: (key: string) => key,
  $i18n: {
    locale: 'es',
  },
}
