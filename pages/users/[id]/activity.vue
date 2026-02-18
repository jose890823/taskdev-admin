<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUsers } from '~/modules/users/composables/useUsers'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { useBreadcrumbMeta } from '~/composables/useBreadcrumbMeta'

definePageMeta({
  middleware: ['auth', 'module-access'],
})

const router = useRouter()
const route = useRoute()
const userId = computed(() => route.params.id as string)

const { fetchUser, getUserActivity, getUserActivityStats, currentUser, loading, error, clearError } = useUsers()
const { setMeta, clearMeta } = useBreadcrumbMeta()

const activities = ref<any[]>([])
const activityStats = ref<any>(null)
const loadingActivities = ref(false)
const loadingStats = ref(false)
const totalActivities = ref(0)
const currentPage = ref(1)
const itemsPerPage = ref(20)

// Calcular offset basado en página actual
const offset = computed(() => (currentPage.value - 1) * itemsPerPage.value)
const totalPages = computed(() => Math.ceil(totalActivities.value / itemsPerPage.value))

// Cargar usuario y actividad al montar
onMounted(async () => {
  await Promise.all([
    loadUser(),
    loadActivities(),
    loadActivityStats(),
  ])
})

// Cargar datos del usuario
const loadUser = async () => {
  try {
    await fetchUser(userId.value)
    if (currentUser.value?.systemCode) {
      setMeta(userId.value, { systemCode: currentUser.value.systemCode, uuid: userId.value, label: `${currentUser.value.firstName} ${currentUser.value.lastName}` })
    }
  } catch (e) {
    console.error('Error loading user:', e)
  }
}

// Cargar actividades
const loadActivities = async () => {
  loadingActivities.value = true
  try {
    const response: any = await getUserActivity(userId.value, itemsPerPage.value, offset.value)
    // Backend response: { success, data: { activities, total }, ... }
    activities.value = response?.data?.activities || response?.activities || []
    totalActivities.value = response?.data?.total || response?.total || 0
  } catch (e) {
    console.error('Error loading activities:', e)
  } finally {
    loadingActivities.value = false
  }
}

// Cambiar página
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// Recargar cuando cambia la página
watch(currentPage, () => {
  loadActivities()
})

// Cargar estadísticas de actividad
const loadActivityStats = async () => {
  loadingStats.value = true
  try {
    const response: any = await getUserActivityStats(userId.value)
    // Backend response: { success, data: { total, lastLogin, today, thisWeek, ... }, ... }
    activityStats.value = response?.data || response || null
  } catch (e) {
    console.error('Error loading activity stats:', e)
  } finally {
    loadingStats.value = false
  }
}

// Volver a la lista
const goBack = () => {
  router.push('/users')
}

// Formatear fecha
const formatDate = (date: string) => {
  return new Date(date).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Obtener variante de badge según el tipo de actividad
const getActivityBadgeVariant = (activityType: string) => {
  if (activityType.includes('login')) return 'default'
  if (activityType.includes('logout')) return 'secondary'
  if (activityType.includes('password')) return 'outline'
  if (activityType.includes('verified')) return 'default'
  if (activityType.includes('created')) return 'default'
  if (activityType.includes('updated')) return 'secondary'
  if (activityType.includes('deleted') || activityType.includes('deactivated')) return 'destructive'
  return 'outline'
}

// Obtener icono según el tipo de actividad
onUnmounted(() => clearMeta())

const getActivityIcon = (activityType: string) => {
  if (activityType.includes('login')) return 'log-in'
  if (activityType.includes('logout')) return 'log-out'
  if (activityType.includes('password')) return 'key'
  if (activityType.includes('verified')) return 'check'
  if (activityType.includes('created')) return 'plus'
  if (activityType.includes('updated')) return 'edit'
  if (activityType.includes('deleted')) return 'trash'
  return 'activity'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <div>
          <h1 class="text-lg font-semibold tracking-tight">Historial de Actividad</h1>
          <p class="text-muted-foreground text-sm mt-1">
            <span v-if="currentUser">
              {{ currentUser.firstName }} {{ currentUser.lastName }} - {{ currentUser.email }}
            </span>
            <span v-else>Cargando usuario...</span>
          </p>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" size="sm" @click="loadActivities" :disabled="loadingActivities">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 16h5v5" />
            </svg>
            Actualizar
          </Button>
          <Button variant="ghost" size="sm" @click="goBack">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Volver
          </Button>
        </div>
      </div>
    </div>

    <!-- Mensaje de error -->
    <div v-if="error" class="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
      <div class="flex items-center justify-between">
        <p>{{ error }}</p>
        <Button variant="ghost" size="sm" @click="clearError">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </Button>
      </div>
    </div>

    <!-- Estadísticas de actividad -->
    <div v-if="activityStats && !loadingStats" class="grid gap-4 md:grid-cols-4">
      <Card class="border-l-4 border-l-blue-500">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">
            Total de Actividades
          </CardTitle>
          <div class="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ activityStats.total || 0 }}</div>
          <p class="text-xs text-muted-foreground mt-1">Registro completo</p>
        </CardContent>
      </Card>

      <Card class="border-l-4 border-l-green-500">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">
            Último Login
          </CardTitle>
          <div class="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" x2="3" y1="12" y2="12" />
            </svg>
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-sm font-semibold text-green-600 dark:text-green-400">
            {{ activityStats.lastLogin ? formatDate(activityStats.lastLogin) : 'Nunca' }}
          </div>
          <p class="text-xs text-muted-foreground mt-1">Última sesión iniciada</p>
        </CardContent>
      </Card>

      <Card class="border-l-4 border-l-amber-500">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">
            Actividades Hoy
          </CardTitle>
          <div class="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ activityStats.today || 0 }}</div>
          <p class="text-xs text-muted-foreground mt-1">En las últimas 24h</p>
        </CardContent>
      </Card>

      <Card class="border-l-4 border-l-purple-500">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">
            Esta Semana
          </CardTitle>
          <div class="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ activityStats.thisWeek || 0 }}</div>
          <p class="text-xs text-muted-foreground mt-1">Últimos 7 días</p>
        </CardContent>
      </Card>
    </div>

    <!-- Lista de actividades -->
    <Card>
      <CardHeader>
        <CardTitle>Actividades Recientes</CardTitle>
        <CardDescription>
          Historial completo de acciones del usuario
        </CardDescription>
      </CardHeader>
      <CardContent>
        <!-- Estado de carga -->
        <div v-if="loadingActivities" class="flex items-center justify-center py-12">
          <div class="text-center space-y-4">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p class="text-muted-foreground">Cargando actividades...</p>
          </div>
        </div>

        <!-- Lista de actividades compacta -->
        <div v-else-if="activities.length > 0" class="space-y-1">
          <div
            v-for="activity in activities"
            :key="activity.id"
            class="flex items-center justify-between gap-4 rounded border px-3 py-2 hover:bg-muted/50 transition-colors"
          >
            <!-- Info principal -->
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <span class="text-sm text-muted-foreground whitespace-nowrap">
                {{ formatDate(activity.createdAt) }}
              </span>
              <Badge :variant="getActivityBadgeVariant(activity.activityType)" class="flex-shrink-0 text-xs">
                {{ activity.activityType }}
              </Badge>
              <span v-if="activity.ipAddress" class="text-xs text-muted-foreground hidden md:inline">
                {{ activity.ipAddress }}
              </span>
            </div>
            <!-- Descripción a la derecha -->
            <span class="text-sm text-muted-foreground flex-shrink-0">
              {{ activity.description || 'Sin descripción' }}
            </span>
          </div>
        </div>

        <!-- Sin actividades -->
        <div v-else class="text-center py-12">
          <p class="text-muted-foreground">No hay actividades registradas</p>
        </div>

        <!-- Paginación -->
        <div v-if="totalPages > 1" class="flex items-center justify-between pt-4 border-t mt-4">
          <div class="text-sm text-muted-foreground">
            Mostrando {{ offset + 1 }}-{{ Math.min(offset + itemsPerPage, totalActivities) }} de {{ totalActivities }}
          </div>
          <div class="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              :disabled="currentPage === 1"
              @click="goToPage(1)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="11 17 6 12 11 7" />
                <polyline points="18 17 13 12 18 7" />
              </svg>
            </Button>
            <Button
              variant="outline"
              size="sm"
              :disabled="currentPage === 1"
              @click="goToPage(currentPage - 1)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Button>
            <span class="px-3 text-sm">
              {{ currentPage }} / {{ totalPages }}
            </span>
            <Button
              variant="outline"
              size="sm"
              :disabled="currentPage === totalPages"
              @click="goToPage(currentPage + 1)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Button>
            <Button
              variant="outline"
              size="sm"
              :disabled="currentPage === totalPages"
              @click="goToPage(totalPages)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="13 17 18 12 13 7" />
                <polyline points="6 17 11 12 6 7" />
              </svg>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
