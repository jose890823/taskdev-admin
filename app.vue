<template>
  <div>
    <NuxtLayout :name="layoutName">
      <NuxtPage />
    </NuxtLayout>

    <!-- Layout Switcher Global (solo mostrar si no es empty) -->
    <LayoutSwitcher v-if="layoutName !== 'empty'" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LayoutKey } from '#build/types/layouts'
import LayoutSwitcher from '~/components/layout/LayoutSwitcher.vue'
import { useLayout } from '~/composables/useLayout'

const { currentLayout } = useLayout()
const route = useRoute()

// Priorizar el layout definido en definePageMeta sobre el localStorage
const layoutName = computed<LayoutKey>(() => {
  // Si la página tiene un layout específico en meta, usarlo
  if (route.meta.layout) {
    return route.meta.layout as LayoutKey
  }
  // Sino, usar el layout del composable (localStorage)
  return currentLayout.value as LayoutKey
})
</script>
