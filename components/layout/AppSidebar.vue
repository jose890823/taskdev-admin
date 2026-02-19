<template>
  <Sidebar collapsible="icon" variant="sidebar">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" as-child>
            <NuxtLink to="/">
              <div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <LayoutDashboardIcon class="size-5" />
              </div>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">
                  {{ $t('app.name') || 'TaskHub' }}
                </span>
                <span class="truncate text-xs">Admin Dashboard</span>
              </div>
            </NuxtLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent>
      <!-- Inicio -->
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton as-child :is-active="$route.path === '/'">
                <NuxtLink to="/">
                  <HomeIcon class="size-4 shrink-0" color="#64748b" />
                  <span>Inicio</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <!-- Grupos de modulos colapsables -->
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <Collapsible
              v-for="(groupModules, groupKey) in groupedModules"
              :key="groupKey"
              as-child
              :default-open="isGroupActive(groupKey as ModuleGroup, groupModules)"
              class="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger as-child>
                  <SidebarMenuButton>
                    <component
                      :is="getGroupIcon(groupKey as ModuleGroup)"
                      class="size-4 shrink-0"
                    />
                    <span>{{ moduleGroupConfig[groupKey as ModuleGroup]?.label || groupKey }}</span>
                    <ChevronRightIcon
                      class="ml-auto size-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                    />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem v-for="mod in groupModules" :key="mod.name">
                      <SidebarMenuSubButton
                        as-child
                        :is-active="$route.path.startsWith(mod.route)"
                      >
                        <NuxtLink :to="mod.route">
                          <component
                            :is="getModuleIcon(mod.icon)"
                            class="size-3.5 shrink-0"
                            :color="mod.iconColor"
                          />
                          <span>{{ mod.label }}</span>
                        </NuxtLink>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <NavUser />
    </SidebarFooter>
  </Sidebar>
</template>

<script setup lang="ts">
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '~/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible'
import {
  HomeIcon,
  UsersIcon,
  UserIcon,
  PackageIcon,
  SettingsIcon,
  FileTextIcon,
  BellIcon,
  ClockIcon,
  ShieldIcon,
  HardDriveIcon,
  DatabaseIcon,
  WebhookIcon,
  ToggleLeftIcon,
  LanguagesIcon,
  ChevronRightIcon,
  LayoutDashboardIcon,
  Building2Icon,
  TagsIcon,
  TruckIcon,
  ArrowLeftRightIcon,
  ContactIcon,
  ShoppingCartIcon,
  CheckSquareIcon,
  UserPlusIcon,
  FolderIcon,
  FolderKanbanIcon,
  CalendarCheckIcon,
} from 'lucide-vue-next'
import { getGroupedModulesForRole, moduleGroupConfig } from '~/app/module-config'
import type { ModuleGroup, ModuleConfig } from '~/app/module-config'
import { useAuth } from '~/modules/auth/composables/useAuth'
import NavUser from '~/components/layout/NavUser.vue'

const { user } = useAuth()
const route = useRoute()

const groupedModules = computed(() => getGroupedModulesForRole(user.value?.roles))

const isGroupActive = (groupKey: ModuleGroup, modules: ModuleConfig[]) => {
  return modules.some(mod => route.path.startsWith(mod.route))
}

const iconMap: Record<string, any> = {
  users: UsersIcon,
  user: UserIcon,
  package: PackageIcon,
  settings: SettingsIcon,
  'file-text': FileTextIcon,
  bell: BellIcon,
  clock: ClockIcon,
  shield: ShieldIcon,
  'hard-drive': HardDriveIcon,
  database: DatabaseIcon,
  webhook: WebhookIcon,
  'toggle-left': ToggleLeftIcon,
  languages: LanguagesIcon,
  'layout-dashboard': LayoutDashboardIcon,
  'building-2': Building2Icon,
  tags: TagsIcon,
  truck: TruckIcon,
  'arrow-left-right': ArrowLeftRightIcon,
  contact: ContactIcon,
  'shopping-cart': ShoppingCartIcon,
  'check-square': CheckSquareIcon,
  'user-plus': UserPlusIcon,
  folder: FolderIcon,
  'folder-kanban': FolderKanbanIcon,
  'calendar-check': CalendarCheckIcon,
}

const getModuleIcon = (icon?: string) => {
  if (!icon) return PackageIcon
  return iconMap[icon] || PackageIcon
}

const getGroupIcon = (groupKey: ModuleGroup) => {
  const config = moduleGroupConfig[groupKey]
  if (!config) return PackageIcon
  return iconMap[config.icon] || PackageIcon
}
</script>
