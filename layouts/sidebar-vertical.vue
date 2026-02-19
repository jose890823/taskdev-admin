<template>
  <SidebarProvider class="relative">
    <!-- Background with gradient blobs for glassmorphism effect -->
    <div class="fixed inset-0 -z-10 overflow-hidden bg-slate-100 dark:bg-slate-950">
      <div class="absolute -top-20 -right-20 w-[500px] h-[500px] bg-blue-500/30 dark:bg-blue-500/20 rounded-full blur-3xl"></div>
      <div class="absolute top-1/4 -left-32 w-[400px] h-[400px] bg-violet-500/25 dark:bg-violet-500/15 rounded-full blur-3xl"></div>
      <div class="absolute bottom-0 right-1/3 w-[600px] h-[600px] bg-cyan-400/25 dark:bg-cyan-400/15 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-32 left-1/4 w-[450px] h-[450px] bg-pink-400/20 dark:bg-pink-400/10 rounded-full blur-3xl"></div>
    </div>
    <AppSidebar />
    <SidebarInset class="bg-transparent">
      <!-- Header con breadcrumb y trigger -->
      <header class="flex h-11 shrink-0 items-center gap-2 border-b border-white/20 dark:border-slate-700/50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-10">
        <div class="flex items-center gap-2 px-4 w-full">
          <SidebarTrigger class="-ml-1" />
          <Separator orientation="vertical" class="mr-2 h-4" />

          <!-- Breadcrumb -->
          <Breadcrumb class="flex-1">
            <BreadcrumbList>
              <BreadcrumbItem class="hidden md:block">
                <BreadcrumbLink href="/">
                  Inicio
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator v-if="breadcrumbs.length > 0" class="hidden md:block" />
              <BreadcrumbItem v-for="(crumb, index) in breadcrumbs" :key="index">
                <!-- UUID segment with tooltip -->
                <template v-if="crumb.isUuid">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <BreadcrumbPage class="font-mono text-xs cursor-default">
                          {{ crumb.label }}
                        </BreadcrumbPage>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p class="font-mono text-xs">{{ crumb.uuid }}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </template>
                <!-- Regular segment -->
                <template v-else>
                  <BreadcrumbLink v-if="index < breadcrumbs.length - 1" :href="crumb.href">
                    {{ crumb.label }}
                  </BreadcrumbLink>
                  <BreadcrumbPage v-else>
                    {{ crumb.label }}
                  </BreadcrumbPage>
                </template>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <!-- Controles del header -->
          <div class="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <LayoutSelector />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <!-- Contenido principal -->
      <main class="relative flex flex-1 flex-col p-4 overflow-hidden">
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
    </SidebarInset>
  </SidebarProvider>
</template>

<script setup lang="ts">
import AppSidebar from '~/components/layout/AppSidebar.vue'
import LanguageSwitcher from '~/components/layout/LanguageSwitcher.vue'
import ThemeToggle from '~/components/layout/ThemeToggle.vue'
import LayoutSelector from '~/components/layout/LayoutSelector.vue'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/components/ui/breadcrumb'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip'
import { Separator } from '~/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '~/components/ui/sidebar'
import { useBreadcrumbMeta } from '~/composables/useBreadcrumbMeta'

/**
 * Layout con sidebar vertical colapsable
 * Similar a los dashboards modernos con menú lateral
 */

const route = useRoute()
const { isUuid, getMetaForUuid, truncateUuid } = useBreadcrumbMeta()

// Generar breadcrumbs dinamicamente desde la ruta
const breadcrumbs = computed(() => {
  const paths = route.path.split('/').filter(Boolean)
  const crumbs: Array<{ label: string; href: string; isUuid: boolean; uuid?: string }> = []

  let currentPath = ''
  paths.forEach((path) => {
    currentPath += `/${path}`

    if (isUuid(path)) {
      const meta = getMetaForUuid(path)
      crumbs.push({
        label: meta?.systemCode || truncateUuid(path),
        href: currentPath,
        isUuid: true,
        uuid: path,
      })
    } else {
      crumbs.push({
        label: path.charAt(0).toUpperCase() + path.slice(1),
        href: currentPath,
        isUuid: false,
      })
    }
  })

  return crumbs
})
</script>
