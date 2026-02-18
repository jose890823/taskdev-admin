<template>
  <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="container flex h-16 items-center justify-between">
      <div class="flex items-center gap-4">
        <NuxtLink to="/" class="flex items-center space-x-2">
          <span class="font-bold text-xl">{{ $t('app.title') }}</span>
        </NuxtLink>
      </div>

      <div class="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          @click="toggleLanguage"
        >
          {{ currentLocale === 'es' ? 'ES' : 'EN' }}
        </Button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Button } from '~/components/ui/button'

const { locale } = useI18n()
const currentLocale = computed(() => locale.value)

const toggleLanguage = () => {
  locale.value = locale.value === 'es' ? 'en' : 'es'
}
</script>
