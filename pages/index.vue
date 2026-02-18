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
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold tracking-tight">Dashboard</h1>
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
        <div class="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-sm font-medium">Organizaciones</CardTitle>
              <Building2Icon class="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">{{ organizations.length }}</div>
              <p class="text-xs text-muted-foreground">activas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-sm font-medium">Proyectos</CardTitle>
              <FolderKanbanIcon class="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">{{ projects.length }}</div>
              <p class="text-xs text-muted-foreground">en total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-sm font-medium">Tareas Pendientes</CardTitle>
              <CheckSquareIcon class="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">{{ pendingTasks.length }}</div>
              <p class="text-xs text-muted-foreground">por completar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-sm font-medium">Completadas</CardTitle>
              <CalendarCheckIcon class="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">{{ completedTasks.length }}</div>
              <p class="text-xs text-muted-foreground">tareas finalizadas</p>
            </CardContent>
          </Card>
        </div>

        <!-- Recent Tasks -->
        <Card>
          <CardHeader class="pb-3">
            <div class="flex items-center justify-between">
              <div>
                <CardTitle class="text-sm font-medium">Mis Tareas Pendientes</CardTitle>
                <CardDescription class="text-xs">Tareas asignadas a ti</CardDescription>
              </div>
              <Button variant="ghost" size="sm" @click="navigateTo('/tasks')">Ver todas</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div v-if="pendingTasks.length === 0" class="text-center py-6 text-muted-foreground text-sm">
              Sin tareas pendientes
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="task in pendingTasks.slice(0, 8)"
                :key="task.id"
                class="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 cursor-pointer"
                @click="navigateTo(`/tasks/${task.id}`)"
              >
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-gray-300" />
                  <span class="text-sm">{{ task.title }}</span>
                </div>
                <Badge v-if="task.priority" variant="outline" class="text-xs">{{ task.priority }}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Quick Navigation -->
        <div class="grid gap-3 grid-cols-2 md:grid-cols-4">
          <Card class="cursor-pointer hover:shadow-md transition-shadow" @click="navigateTo('/organizations')">
            <CardContent class="flex items-center gap-3 py-4">
              <Building2Icon class="h-5 w-5 text-blue-500" />
              <span class="text-sm font-medium">Organizaciones</span>
            </CardContent>
          </Card>
          <Card class="cursor-pointer hover:shadow-md transition-shadow" @click="navigateTo('/projects')">
            <CardContent class="flex items-center gap-3 py-4">
              <FolderKanbanIcon class="h-5 w-5 text-purple-500" />
              <span class="text-sm font-medium">Proyectos</span>
            </CardContent>
          </Card>
          <Card class="cursor-pointer hover:shadow-md transition-shadow" @click="navigateTo('/tasks')">
            <CardContent class="flex items-center gap-3 py-4">
              <CheckSquareIcon class="h-5 w-5 text-orange-500" />
              <span class="text-sm font-medium">Tareas</span>
            </CardContent>
          </Card>
          <Card class="cursor-pointer hover:shadow-md transition-shadow" @click="navigateTo('/tasks/daily')">
            <CardContent class="flex items-center gap-3 py-4">
              <CalendarCheckIcon class="h-5 w-5 text-green-500" />
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
