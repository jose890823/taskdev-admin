<template>
  <Button variant="ghost" size="sm" @click="toggleLanguage">
    {{ currentLocale === 'es' ? 'ES' : 'EN' }}
  </Button>
</template>

<script setup lang="ts">
import { Button } from '~/components/ui/button'

const { locale } = useI18n()
const currentLocale = computed(() => locale.value)

const toggleLanguage = () => {
  locale.value = locale.value === 'es' ? 'en' : 'es'
}
</script>
