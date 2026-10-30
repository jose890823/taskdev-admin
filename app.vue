<template>
  <div>
    <!-- El layout se resuelve en route.meta (definePageMeta o middleware/layout.global.ts) -->
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- Layout Switcher Global (solo mostrar si no es empty) -->
    <LayoutSwitcher v-if="route.meta.layout !== 'empty'" />
  </div>
</template>

<script setup lang="ts">
import LayoutSwitcher from '~/components/layout/LayoutSwitcher.vue'

const route = useRoute()
</script>
