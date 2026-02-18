<template>
  <div class="min-h-screen bg-background">
    <!-- Header con menú horizontal -->
    <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="container flex h-16 items-center justify-between">
        <!-- Logo y nombre -->
        <div class="flex items-center gap-6">
          <NuxtLink to="/" class="flex items-center space-x-2">
            <span class="text-xl">🏢</span>
            <span class="font-bold text-xl">{{ $t('app.name') || 'Mi Aplicación' }}</span>
          </NuxtLink>

          <!-- Navegación horizontal -->
          <nav class="hidden md:flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              as-child
              :class="{ 'bg-accent': $route.path === '/' }"
            >
              <NuxtLink to="/" class="flex items-center gap-2">
                <HomeIcon class="size-4" />
                <span>Inicio</span>
              </NuxtLink>
            </Button>

            <Button
              v-for="module in activeModules"
              :key="module.name"
              variant="ghost"
              size="sm"
              as-child
              :class="{ 'bg-accent': $route.path.startsWith(module.route) }"
            >
              <NuxtLink :to="module.route" class="flex items-center gap-2">
                <component :is="getModuleIcon(module.icon)" class="size-4" />
                <span>{{ module.label }}</span>
              </NuxtLink>
            </Button>
          </nav>
        </div>

        <!-- Acciones a la derecha -->
        <div class="flex items-center gap-2">
          <!-- Controles del header -->
          <ThemeToggle />
          <LayoutSelector />
          <LanguageSwitcher />

          <!-- Menú móvil -->
          <Sheet>
            <SheetTrigger as-child>
              <Button variant="ghost" size="icon" class="md:hidden">
                <MenuIcon class="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Menú</SheetTitle>
              </SheetHeader>
              <nav class="flex flex-col gap-2 mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  as-child
                  :class="{ 'bg-accent': $route.path === '/' }"
                >
                  <NuxtLink to="/" class="flex items-center gap-2 justify-start">
                    <HomeIcon class="size-4" />
                    <span>Inicio</span>
                  </NuxtLink>
                </Button>

                <Button
                  v-for="module in activeModules"
                  :key="module.name"
                  variant="ghost"
                  size="sm"
                  as-child
                  :class="{ 'bg-accent': $route.path.startsWith(module.route) }"
                >
                  <NuxtLink :to="module.route" class="flex items-center gap-2 justify-start">
                    <component :is="getModuleIcon(module.icon)" class="size-4" />
                    <span>{{ module.label }}</span>
                  </NuxtLink>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>

    <!-- Contenido principal -->
    <main class="relative container py-6 overflow-hidden">
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
</template>

<script setup lang="ts">
import { Button } from '~/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet'
import LanguageSwitcher from '~/components/layout/LanguageSwitcher.vue'
import ThemeToggle from '~/components/layout/ThemeToggle.vue'
import LayoutSelector from '~/components/layout/LayoutSelector.vue'
import {
  HomeIcon,
  UsersIcon,
  PackageIcon,
  SettingsIcon,
  ChartBarIcon,
  FileTextIcon,
  MenuIcon
} from 'lucide-vue-next'
import { getActiveModulesForRole } from '~/app/module-config'
import { useAuth } from '~/modules/auth/composables/useAuth'

/**
 * Layout con menú horizontal
 * Perfecto para aplicaciones con menos opciones de navegación
 */

const { user } = useAuth()
const route = useRoute()

// Módulos filtrados por roles del usuario actual
const activeModules = computed(() => getActiveModulesForRole(user.value?.roles))

// Mapeo de iconos
const iconMap: Record<string, any> = {
  users: UsersIcon,
  package: PackageIcon,
  settings: SettingsIcon,
  chart: ChartBarIcon,
  file: FileTextIcon,
}

const getModuleIcon = (icon?: string) => {
  if (!icon) return PackageIcon
  return iconMap[icon] || PackageIcon
}
</script>
