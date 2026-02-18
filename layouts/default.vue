<template>
  <div class="min-h-screen bg-background">
    <AppHeader />

    <div class="flex">
      <!-- Sidebar de navegación de módulos -->
      <aside class="w-64 border-r bg-muted/40 min-h-[calc(100vh-4rem)] p-4">
        <nav class="space-y-2">
          <h3 class="font-semibold text-sm text-muted-foreground px-3 mb-2">
            Módulos
          </h3>

          <NuxtLink
            to="/"
            class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
            active-class="bg-accent font-medium"
          >
            <span>🏠</span>
            <span>Inicio</span>
          </NuxtLink>

          <NuxtLink
            v-for="module in activeModules"
            :key="module.name"
            :to="module.route"
            class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
            active-class="bg-accent font-medium"
          >
            <span>{{ module.icon ? moduleIcons[module.icon] || '📦' : '📦' }}</span>
            <span>{{ module.label }}</span>
          </NuxtLink>
        </nav>
      </aside>

      <!-- Contenido principal -->
      <main class="relative flex-1 overflow-hidden">
        <!-- Watermark -->
        <div class="pointer-events-none absolute inset-0 flex items-center justify-center select-none" aria-hidden="true">
          <div class="flex flex-col items-center gap-0 leading-none">
            <span class="text-[clamp(3rem,10vw,8rem)] font-extralight tracking-[0.3em] uppercase text-muted-foreground/[0.03]">
              Task
            </span>
            <span class="text-[clamp(1.5rem,4vw,3.5rem)] font-semibold tracking-[0.5em] uppercase text-muted-foreground/[0.04]">
              Hub
            </span>
          </div>
        </div>
        <slot />
      </main>
    </div>

    <!-- Sonner Toast Notifications -->
    <Sonner />
  </div>
</template>

<script setup lang="ts">
import AppHeader from '~/components/layout/AppHeader.vue'
import { Sonner } from '~/components/ui/sonner'
import { getActiveModules } from '~/app/module-config'

const activeModules = getActiveModules()

const moduleIcons: Record<string, string> = {
  users: '👥',
  package: '📦',
  settings: '⚙️',
  chart: '📊',
  file: '📄',
}
</script>
