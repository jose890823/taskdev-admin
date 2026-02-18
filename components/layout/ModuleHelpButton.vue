<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  HelpCircleIcon,
  Building2Icon,
  LayersIcon,
  PaletteIcon,
  TruckIcon,
  PackageIcon,
  DollarSignIcon,
  ZapIcon,
  ArrowLeftRightIcon,
  ShieldIcon,
  UsersIcon,
  ContactIcon,
  SettingsIcon,
  ShoppingCartIcon,
  CheckSquareIcon,
  LightbulbIcon,
  AlertCircleIcon,
  BellIcon,
} from 'lucide-vue-next'
import {
  Dialog,
  DialogScrollContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '~/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/ui/tabs'
import { moduleHelpData } from '~/app/module-help-data'
import type { ModuleHelpContent, HelpSection, HelpExample, ExampleTab } from '~/app/module-help-data'
import { useAuth } from '~/modules/auth/composables/useAuth'

const props = defineProps<{
  moduleName: string
}>()

const { user } = useAuth()

const isOpen = ref(false)

const helpContent = computed<ModuleHelpContent | null>(() => {
  return moduleHelpData[props.moduleName] || null
})

const isSuperAdmin = computed(() => {
  const roles = user.value?.roles || []
  return roles.includes('super_admin')
})

// Icon map
const iconMap: Record<string, any> = {
  building: Building2Icon,
  layers: LayersIcon,
  palette: PaletteIcon,
  truck: TruckIcon,
  package: PackageIcon,
  dollar: DollarSignIcon,
  zap: ZapIcon,
  arrows: ArrowLeftRightIcon,
  shield: ShieldIcon,
  users: UsersIcon,
  contact: ContactIcon,
  settings: SettingsIcon,
  cart: ShoppingCartIcon,
  check: CheckSquareIcon,
  lightbulb: LightbulbIcon,
  alert: AlertCircleIcon,
  bell: BellIcon,
}

const getIcon = (key: string) => iconMap[key] || HelpCircleIcon

// Color maps — full strings for Tailwind purge
const iconColorMap: Record<string, string> = {
  blue: 'text-blue-500',
  green: 'text-green-500',
  purple: 'text-purple-500',
  orange: 'text-orange-500',
  cyan: 'text-cyan-500',
  pink: 'text-pink-500',
  indigo: 'text-indigo-500',
  yellow: 'text-yellow-500',
  red: 'text-red-500',
}

const circleBgMap: Record<string, string> = {
  blue: 'bg-blue-500/10 text-blue-500',
  green: 'bg-green-500/10 text-green-500',
  purple: 'bg-purple-500/10 text-purple-500',
  orange: 'bg-orange-500/10 text-orange-500',
  cyan: 'bg-cyan-500/10 text-cyan-500',
  pink: 'bg-pink-500/10 text-pink-500',
  indigo: 'bg-indigo-500/10 text-indigo-500',
  yellow: 'bg-yellow-500/10 text-yellow-500',
  red: 'bg-red-500/10 text-red-500',
}

const dotColorMap: Record<string, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  cyan: 'bg-cyan-500',
  pink: 'bg-pink-500',
  indigo: 'bg-indigo-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
}

// Step highlight colors for examples
const stepHighlightMap: Record<string, string> = {
  blue: 'border-l-blue-500',
  green: 'border-l-green-500',
  orange: 'border-l-orange-500',
  red: 'border-l-red-500',
}

const stepLabelColorMap: Record<string, string> = {
  blue: 'text-blue-600 dark:text-blue-400',
  green: 'text-green-600 dark:text-green-400',
  orange: 'text-orange-600 dark:text-orange-400',
  red: 'text-red-600 dark:text-red-400',
}

// Tab button colors — full strings for Tailwind purge
const tabBtnActiveMap: Record<string, string> = {
  green: 'bg-green-500 text-white shadow-sm',
  orange: 'bg-orange-500 text-white shadow-sm',
  blue: 'bg-blue-500 text-white shadow-sm',
  red: 'bg-red-500 text-white shadow-sm',
  cyan: 'bg-cyan-500 text-white shadow-sm',
  purple: 'bg-purple-500 text-white shadow-sm',
}

const tabBtnInactiveMap: Record<string, string> = {
  green: 'text-green-600 hover:bg-green-500/10 dark:text-green-400',
  orange: 'text-orange-600 hover:bg-orange-500/10 dark:text-orange-400',
  blue: 'text-blue-600 hover:bg-blue-500/10 dark:text-blue-400',
  red: 'text-red-600 hover:bg-red-500/10 dark:text-red-400',
  cyan: 'text-cyan-600 hover:bg-cyan-500/10 dark:text-cyan-400',
  purple: 'text-purple-600 hover:bg-purple-500/10 dark:text-purple-400',
}

// Variant-based container styles
const getContainerClass = (section: HelpSection) => {
  if (section.variant === 'warning') {
    const borderMap: Record<string, string> = {
      orange: 'border-orange-500/30 bg-orange-500/5',
      red: 'border-red-500/30 bg-red-500/5',
    }
    return `rounded-lg border p-3 ${borderMap[section.color] || 'border-orange-500/30 bg-orange-500/5'}`
  }
  if (section.variant === 'tip') {
    const borderMap: Record<string, string> = {
      yellow: 'border-yellow-500/30 bg-yellow-500/5',
      orange: 'border-orange-500/30 bg-orange-500/5',
      cyan: 'border-cyan-500/30 bg-cyan-500/5',
    }
    return `rounded-lg border p-3 ${borderMap[section.color] || 'border-primary/30 bg-primary/5'}`
  }
  return 'rounded-lg border bg-card p-4 space-y-3'
}

// ExampleTabs state
const activeExampleTab = ref<Record<string, number>>({})

const getActiveTab = (key: string) => activeExampleTab.value[key] ?? 0
const setActiveTab = (key: string, index: number) => {
  activeExampleTab.value[key] = index
}
</script>

<template>
  <button
    v-if="helpContent"
    type="button"
    class="inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors p-0.5"
    @click="isOpen = true"
  >
    <HelpCircleIcon class="size-4 shrink-0" />
    <span class="sr-only">Ayuda sobre {{ helpContent.title }}</span>
  </button>

  <Dialog v-model:open="isOpen">
    <DialogScrollContent v-if="helpContent" class="max-w-2xl">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2 text-lg">
          <HelpCircleIcon class="h-5 w-5 text-primary" />
          {{ helpContent.title }}
        </DialogTitle>
        <DialogDescription>Informacion y reglas del modulo</DialogDescription>
      </DialogHeader>

      <!-- Admin/Owner: tabs Admin y Cliente -->
      <template v-if="isSuperAdmin">
        <Tabs default-value="admin" class="mt-2">
          <TabsList class="grid w-full grid-cols-2">
            <TabsTrigger value="admin">Admin</TabsTrigger>
            <TabsTrigger value="cliente">Cliente</TabsTrigger>
          </TabsList>

          <TabsContent value="admin" class="mt-4 space-y-3">
            <div
              v-for="(section, idx) in helpContent.adminSections"
              :key="idx"
              :class="getContainerClass(section)"
            >
              <!-- Section with variant (tip/warning) - compact layout -->
              <template v-if="section.variant">
                <div v-if="section.items.length === 1" class="flex items-start gap-2">
                  <component :is="getIcon(section.icon)" class="h-4 w-4 shrink-0 mt-0.5" :class="iconColorMap[section.color]" />
                  <p class="text-sm text-muted-foreground">
                    <strong class="text-foreground">{{ section.title }}:</strong> {{ section.items[0] }}
                  </p>
                </div>
                <div v-else class="space-y-2">
                  <h3 class="font-semibold text-sm flex items-center gap-2">
                    <component :is="getIcon(section.icon)" class="h-4 w-4" :class="iconColorMap[section.color]" />
                    {{ section.title }}
                  </h3>
                  <ul class="space-y-1 ml-6">
                    <li
                      v-for="(item, i) in section.items"
                      :key="i"
                      class="text-sm text-muted-foreground flex gap-2"
                    >
                      <span class="select-none">&bull;</span>
                      <span>{{ item }}</span>
                    </li>
                  </ul>
                </div>
              </template>

              <!-- Default section - card layout -->
              <template v-else>
                <h3 class="font-semibold text-sm flex items-center gap-2">
                  <component :is="getIcon(section.icon)" class="h-4 w-4" :class="iconColorMap[section.color]" />
                  {{ section.title }}
                </h3>
                <p v-if="section.description" class="text-sm text-muted-foreground leading-relaxed">
                  {{ section.description }}
                </p>
                <div class="flex flex-col gap-1.5">
                  <div
                    v-for="(item, i) in section.items"
                    :key="i"
                    class="flex items-start gap-3 rounded-md bg-muted/50 px-3 py-2"
                  >
                    <div class="flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold shrink-0 mt-0.5" :class="circleBgMap[section.color]">
                      {{ i + 1 }}
                    </div>
                    <span class="text-sm">{{ item }}</span>
                  </div>
                </div>
              </template>
            </div>

            <!-- Admin example (single) -->
            <div v-if="helpContent.adminExample" class="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
              <h3 class="font-semibold text-sm flex items-center gap-2">
                <LightbulbIcon class="h-4 w-4 text-yellow-500" />
                {{ helpContent.adminExample.title }}
              </h3>
              <p class="text-sm text-muted-foreground leading-relaxed">
                {{ helpContent.adminExample.description }}
              </p>
              <div class="bg-background rounded-md border overflow-hidden">
                <div
                  v-for="(step, i) in helpContent.adminExample.steps"
                  :key="i"
                  class="flex items-start gap-3 px-3 py-2.5 border-l-2"
                  :class="[stepHighlightMap[step.highlight || 'blue'], i > 0 ? 'border-t' : '']"
                >
                  <div class="flex items-center justify-center h-5 w-5 rounded-full bg-muted text-[10px] font-bold shrink-0 mt-0.5">
                    {{ i + 1 }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <span class="text-sm font-medium" :class="stepLabelColorMap[step.highlight || 'blue']">{{ step.label }}</span>
                    <p class="text-xs text-muted-foreground mt-0.5">{{ step.detail }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Admin example tabs -->
            <div v-if="helpContent.adminExampleTabs" class="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
              <h3 class="font-semibold text-sm flex items-center gap-2">
                <LightbulbIcon class="h-4 w-4 text-yellow-500" />
                Ejemplos por tipo
              </h3>
              <!-- Tab buttons -->
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="(tab, i) in helpContent.adminExampleTabs"
                  :key="i"
                  type="button"
                  class="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
                  :class="getActiveTab('admin') === i ? tabBtnActiveMap[tab.color] : tabBtnInactiveMap[tab.color]"
                  @click="setActiveTab('admin', i)"
                >
                  {{ tab.label }}
                </button>
              </div>
              <!-- Active tab content -->
              <div
                v-for="(tab, i) in helpContent.adminExampleTabs"
                :key="i"
              >
                <template v-if="getActiveTab('admin') === i">
                  <p class="text-sm text-muted-foreground leading-relaxed mb-3">
                    {{ tab.description }}
                  </p>
                  <div class="bg-background rounded-md border overflow-hidden">
                    <div
                      v-for="(step, si) in tab.steps"
                      :key="si"
                      class="flex items-start gap-3 px-3 py-2.5 border-l-2"
                      :class="[stepHighlightMap[step.highlight || 'blue'], si > 0 ? 'border-t' : '']"
                    >
                      <div class="flex items-center justify-center h-5 w-5 rounded-full bg-muted text-[10px] font-bold shrink-0 mt-0.5">
                        {{ si + 1 }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <span class="text-sm font-medium" :class="stepLabelColorMap[step.highlight || 'blue']">{{ step.label }}</span>
                        <p class="text-xs text-muted-foreground mt-0.5">{{ step.detail }}</p>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cliente" class="mt-4 space-y-3">
            <div
              v-for="(section, idx) in helpContent.clientSections"
              :key="idx"
              class="rounded-lg border bg-card p-4 space-y-3"
            >
              <h3 class="font-semibold text-sm flex items-center gap-2">
                <component :is="getIcon(section.icon)" class="h-4 w-4" :class="iconColorMap[section.color]" />
                {{ section.title }}
              </h3>
              <p v-if="section.description" class="text-sm text-muted-foreground leading-relaxed">
                {{ section.description }}
              </p>
              <div class="grid gap-1.5">
                <div
                  v-for="(item, i) in section.items"
                  :key="i"
                  class="flex items-start gap-3 p-2 rounded-md border"
                >
                  <span class="mt-0.5 shrink-0 h-1.5 w-1.5 rounded-full" :class="dotColorMap[section.color]" />
                  <span class="text-sm">{{ item }}</span>
                </div>
              </div>
            </div>

            <!-- Client example (single) -->
            <div v-if="helpContent.clientExample" class="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
              <h3 class="font-semibold text-sm flex items-center gap-2">
                <LightbulbIcon class="h-4 w-4 text-yellow-500" />
                {{ helpContent.clientExample.title }}
              </h3>
              <p class="text-sm text-muted-foreground leading-relaxed">
                {{ helpContent.clientExample.description }}
              </p>
              <div class="bg-background rounded-md border overflow-hidden">
                <div
                  v-for="(step, i) in helpContent.clientExample.steps"
                  :key="i"
                  class="flex items-start gap-3 px-3 py-2.5 border-l-2"
                  :class="[stepHighlightMap[step.highlight || 'blue'], i > 0 ? 'border-t' : '']"
                >
                  <div class="flex items-center justify-center h-5 w-5 rounded-full bg-muted text-[10px] font-bold shrink-0 mt-0.5">
                    {{ i + 1 }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <span class="text-sm font-medium" :class="stepLabelColorMap[step.highlight || 'blue']">{{ step.label }}</span>
                    <p class="text-xs text-muted-foreground mt-0.5">{{ step.detail }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Client example tabs -->
            <div v-if="helpContent.clientExampleTabs" class="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
              <h3 class="font-semibold text-sm flex items-center gap-2">
                <LightbulbIcon class="h-4 w-4 text-yellow-500" />
                Ejemplos por tipo
              </h3>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="(tab, i) in helpContent.clientExampleTabs"
                  :key="i"
                  type="button"
                  class="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
                  :class="getActiveTab('client') === i ? tabBtnActiveMap[tab.color] : tabBtnInactiveMap[tab.color]"
                  @click="setActiveTab('client', i)"
                >
                  {{ tab.label }}
                </button>
              </div>
              <div
                v-for="(tab, i) in helpContent.clientExampleTabs"
                :key="i"
              >
                <template v-if="getActiveTab('client') === i">
                  <p class="text-sm text-muted-foreground leading-relaxed mb-3">
                    {{ tab.description }}
                  </p>
                  <div class="bg-background rounded-md border overflow-hidden">
                    <div
                      v-for="(step, si) in tab.steps"
                      :key="si"
                      class="flex items-start gap-3 px-3 py-2.5 border-l-2"
                      :class="[stepHighlightMap[step.highlight || 'blue'], si > 0 ? 'border-t' : '']"
                    >
                      <div class="flex items-center justify-center h-5 w-5 rounded-full bg-muted text-[10px] font-bold shrink-0 mt-0.5">
                        {{ si + 1 }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <span class="text-sm font-medium" :class="stepLabelColorMap[step.highlight || 'blue']">{{ step.label }}</span>
                        <p class="text-xs text-muted-foreground mt-0.5">{{ step.detail }}</p>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </template>

      <!-- Employee: solo vista cliente -->
      <template v-else>
        <div class="mt-2 space-y-3">
          <div
            v-for="(section, idx) in helpContent.clientSections"
            :key="idx"
            class="rounded-lg border bg-card p-4 space-y-3"
          >
            <h3 class="font-semibold text-sm flex items-center gap-2">
              <component :is="getIcon(section.icon)" class="h-4 w-4" :class="iconColorMap[section.color]" />
              {{ section.title }}
            </h3>
            <p v-if="section.description" class="text-sm text-muted-foreground leading-relaxed">
              {{ section.description }}
            </p>
            <div class="grid gap-1.5">
              <div
                v-for="(item, i) in section.items"
                :key="i"
                class="flex items-start gap-3 p-2 rounded-md border"
              >
                <span class="mt-0.5 shrink-0 h-1.5 w-1.5 rounded-full" :class="dotColorMap[section.color]" />
                <span class="text-sm">{{ item }}</span>
              </div>
            </div>
          </div>

          <!-- Client example (single) -->
          <div v-if="helpContent.clientExample" class="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
            <h3 class="font-semibold text-sm flex items-center gap-2">
              <LightbulbIcon class="h-4 w-4 text-yellow-500" />
              {{ helpContent.clientExample.title }}
            </h3>
            <p class="text-sm text-muted-foreground leading-relaxed">
              {{ helpContent.clientExample.description }}
            </p>
            <div class="bg-background rounded-md border overflow-hidden">
              <div
                v-for="(step, i) in helpContent.clientExample.steps"
                :key="i"
                class="flex items-start gap-3 px-3 py-2.5 border-l-2"
                :class="[stepHighlightMap[step.highlight || 'blue'], i > 0 ? 'border-t' : '']"
              >
                <div class="flex items-center justify-center h-5 w-5 rounded-full bg-muted text-[10px] font-bold shrink-0 mt-0.5">
                  {{ i + 1 }}
                </div>
                <div class="flex-1 min-w-0">
                  <span class="text-sm font-medium" :class="stepLabelColorMap[step.highlight || 'blue']">{{ step.label }}</span>
                  <p class="text-xs text-muted-foreground mt-0.5">{{ step.detail }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Client example tabs -->
          <div v-if="helpContent.clientExampleTabs" class="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
            <h3 class="font-semibold text-sm flex items-center gap-2">
              <LightbulbIcon class="h-4 w-4 text-yellow-500" />
              Ejemplos por tipo
            </h3>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="(tab, i) in helpContent.clientExampleTabs"
                :key="i"
                type="button"
                class="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
                :class="getActiveTab('employee-client') === i ? tabBtnActiveMap[tab.color] : tabBtnInactiveMap[tab.color]"
                @click="setActiveTab('employee-client', i)"
              >
                {{ tab.label }}
              </button>
            </div>
            <div
              v-for="(tab, i) in helpContent.clientExampleTabs"
              :key="i"
            >
              <template v-if="getActiveTab('employee-client') === i">
                <p class="text-sm text-muted-foreground leading-relaxed mb-3">
                  {{ tab.description }}
                </p>
                <div class="bg-background rounded-md border overflow-hidden">
                  <div
                    v-for="(step, si) in tab.steps"
                    :key="si"
                    class="flex items-start gap-3 px-3 py-2.5 border-l-2"
                    :class="[stepHighlightMap[step.highlight || 'blue'], si > 0 ? 'border-t' : '']"
                  >
                    <div class="flex items-center justify-center h-5 w-5 rounded-full bg-muted text-[10px] font-bold shrink-0 mt-0.5">
                      {{ si + 1 }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <span class="text-sm font-medium" :class="stepLabelColorMap[step.highlight || 'blue']">{{ step.label }}</span>
                      <p class="text-xs text-muted-foreground mt-0.5">{{ step.detail }}</p>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </template>
    </DialogScrollContent>
  </Dialog>
</template>
