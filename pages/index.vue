<script setup lang="ts">
import { onMounted } from 'vue'
import { useTasks } from '~/modules/tasks/composables/useTasks'
import { useProjects } from '~/modules/projects/composables/useProjects'
import { useOrganizations } from '~/modules/organizations/composables/useOrganizations'
import { useAuth } from '~/modules/auth/composables/useAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import {
  FolderKanbanIcon,
  CheckSquareIcon,
  Building2Icon,
  CalendarCheckIcon,
  Loader2Icon,
} from 'lucide-vue-next'

definePageMeta({
  middleware: ['auth'],
  layout: 'sidebar-vertical',
})

const { user, isAuthenticated, initAuth } = useAuth()
const { tasks, fetchMyTasks } = useTasks()
const { projects, fetchAll: fetchProjects } = useProjects()
const { organizations, fetchAll: fetchOrgs } = useOrganizations()

const loading = ref(false)

onMounted(async () => {
  await initAuth()
  if (!isAuthenticated.value) {
    navigateTo('/login')
    return
  }
  loading.value = true
  await Promise.all([
    fetchMyTasks(),
    fetchProjects(),
    fetchOrgs(),
  ])
  loading.value = false
})

const pendingTasks = computed(() => tasks.value.filter(t => !t.completedAt))
const completedTasks = computed(() => tasks.value.filter(t => t.completedAt))

const priorityLabel = (priority: string) => {
  const map: Record<string, string> = { urgent: 'Urgente', high: 'Alta', medium: 'Media', low: 'Baja' }
  return map[priority] || priority
}

const priorityColor = (priority: string) => {
  const map: Record<string, string> = { urgent: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-blue-500', low: 'bg-gray-500' }
  return map[priority] || 'bg-gray-400'
}

const priorityBadgeClass = (priority: string) => {
  const map: Record<string, string> = {
    urgent: 'bg-red-500 text-white border-red-500',
    high: 'bg-orange-500 text-white border-orange-500',
    medium: 'bg-blue-500 text-white border-blue-500',
    low: 'bg-gray-500 text-white border-gray-500',
  }
  return map[priority] || ''
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-lg font-semibold tracking-tight">Dashboard</h1>
        <p class="text-xs text-muted-foreground">
          Bienvenido<ClientOnly>, {{ user?.firstName }} {{ user?.lastName }}</ClientOnly>
        </p>
      </div>
    </div>

    <ClientOnly>
      <div v-if="loading" class="flex items-center justify-center py-16">
        <Loader2Icon class="h-8 w-8 animate-spin text-muted-foreground" />
      </div>

      <template v-else>
        <!-- Summary Cards -->
        <div class="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent class="flex items-center justify-between p-4">
              <div>
                <p class="text-xs font-medium text-muted-foreground">Organizaciones</p>
                <div class="text-2xl font-bold">{{ organizations.length }}</div>
                <p class="text-[11px] text-muted-foreground">activas</p>
              </div>
              <Building2Icon class="h-5 w-5 text-blue-500" />
            </CardContent>
          </Card>

          <Card>
            <CardContent class="flex items-center justify-between p-4">
              <div>
                <p class="text-xs font-medium text-muted-foreground">Proyectos</p>
                <div class="text-2xl font-bold">{{ projects.length }}</div>
                <p class="text-[11px] text-muted-foreground">en total</p>
              </div>
              <FolderKanbanIcon class="h-5 w-5 text-purple-500" />
            </CardContent>
          </Card>

          <Card>
            <CardContent class="flex items-center justify-between p-4">
              <div>
                <p class="text-xs font-medium text-muted-foreground">Tareas Pendientes</p>
                <div class="text-2xl font-bold">{{ pendingTasks.length }}</div>
                <p class="text-[11px] text-muted-foreground">por completar</p>
              </div>
              <CheckSquareIcon class="h-5 w-5 text-orange-500" />
            </CardContent>
          </Card>

          <Card>
            <CardContent class="flex items-center justify-between p-4">
              <div>
                <p class="text-xs font-medium text-muted-foreground">Completadas</p>
                <div class="text-2xl font-bold">{{ completedTasks.length }}</div>
                <p class="text-[11px] text-muted-foreground">tareas finalizadas</p>
              </div>
              <CalendarCheckIcon class="h-5 w-5 text-green-500" />
            </CardContent>
          </Card>
        </div>

        <!-- Recent Tasks -->
        <Card>
          <CardContent class="p-4">
            <div class="flex items-center justify-between mb-3">
              <div>
                <h3 class="text-sm font-medium">Mis Tareas Pendientes</h3>
                <p class="text-[11px] text-muted-foreground">Tareas asignadas a ti</p>
              </div>
              <Button variant="ghost" size="sm" class="h-7 text-xs" @click="navigateTo('/tasks')">Ver todas</Button>
            </div>
            <div v-if="pendingTasks.length === 0" class="text-center py-4 text-muted-foreground text-sm">
              Sin tareas pendientes
            </div>
            <div v-else class="space-y-0.5">
              <div
                v-for="task in pendingTasks.slice(0, 10)"
                :key="task.id"
                class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer"
                @click="navigateTo(`/tasks/${task.id}`)"
              >
                <div class="flex items-center gap-2">
                  <div class="w-1.5 h-1.5 rounded-full" :class="priorityColor(task.priority)" />
                  <span class="text-sm">{{ task.title }}</span>
                </div>
                <Badge v-if="task.priority" variant="outline" class="text-[11px] px-1.5 py-0" :class="priorityBadgeClass(task.priority)">{{ priorityLabel(task.priority) }}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Quick Navigation -->
        <div class="grid gap-2 grid-cols-2 md:grid-cols-4">
          <Card class="cursor-pointer hover:shadow-md transition-shadow" @click="navigateTo('/organizations')">
            <CardContent class="flex items-center gap-2 p-3">
              <Building2Icon class="h-4 w-4 text-blue-500" />
              <span class="text-sm font-medium">Organizaciones</span>
            </CardContent>
          </Card>
          <Card class="cursor-pointer hover:shadow-md transition-shadow" @click="navigateTo('/projects')">
            <CardContent class="flex items-center gap-2 p-3">
              <FolderKanbanIcon class="h-4 w-4 text-purple-500" />
              <span class="text-sm font-medium">Proyectos</span>
            </CardContent>
          </Card>
          <Card class="cursor-pointer hover:shadow-md transition-shadow" @click="navigateTo('/tasks')">
            <CardContent class="flex items-center gap-2 p-3">
              <CheckSquareIcon class="h-4 w-4 text-orange-500" />
              <span class="text-sm font-medium">Tareas</span>
            </CardContent>
          </Card>
          <Card class="cursor-pointer hover:shadow-md transition-shadow" @click="navigateTo('/tasks/daily')">
            <CardContent class="flex items-center gap-2 p-3">
              <CalendarCheckIcon class="h-4 w-4 text-green-500" />
              <span class="text-sm font-medium">Tareas Diarias</span>
            </CardContent>
          </Card>
        </div>
      </template>

      <template #fallback>
        <div class="flex items-center justify-center py-16">
          <Loader2Icon class="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
