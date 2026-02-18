<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUsers } from '~/modules/users/composables/useUsers'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'

definePageMeta({
  middleware: ['auth', 'module-access'],
})

const router = useRouter()
const { getStats, loading, error, clearError } = useUsers()

const stats = ref<any>(null)

// Cargar estadísticas al montar
onMounted(async () => {
  await loadStats()
})

// Cargar estadísticas
const loadStats = async () => {
  try {
    const response: any = await getStats()
    stats.value = response.data
  } catch (e) {
    console.error('Error loading stats:', e)
  }
}

// Volver a la lista
const goBack = () => {
  router.push('/users')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <div>
          <h1 class="text-lg font-semibold tracking-tight">Estadísticas de Usuarios</h1>
          <p class="text-muted-foreground text-sm mt-1">
            Vista general de métricas y análisis de usuarios
          </p>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" size="sm" @click="loadStats" :disabled="loading">
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

    <!-- Estado de carga -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="text-center space-y-4">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p class="text-muted-foreground">Cargando estadísticas...</p>
      </div>
    </div>

    <!-- Estadísticas -->
    <div v-else-if="stats" class="space-y-6">
      <!-- Tarjetas de resumen -->
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">
              Total de Usuarios
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 text-muted-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ stats.total || 0 }}</div>
            <p class="text-xs text-muted-foreground">
              Total de usuarios registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">
              Usuarios Activos
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 text-muted-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M5 12l5 5L20 7" />
            </svg>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ stats.active || 0 }}</div>
            <p class="text-xs text-muted-foreground">
              Usuarios con acceso habilitado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">
              Usuarios Inactivos
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 text-muted-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ stats.inactive || 0 }}</div>
            <p class="text-xs text-muted-foreground">
              Usuarios desactivados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">
              Email Verificados
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 text-muted-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ stats.emailVerified || 0 }}</div>
            <p class="text-xs text-muted-foreground">
              Emails verificados
            </p>
          </CardContent>
        </Card>
      </div>

      <!-- Distribución por roles -->
      <Card>
        <CardHeader>
          <CardTitle>Distribución por Roles</CardTitle>
          <CardDescription>
            Cantidad de usuarios por cada rol del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div v-if="stats.byRole" class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div
                v-for="(count, role) in stats.byRole"
                :key="role"
                class="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <p class="text-sm font-medium capitalize">{{ role }}</p>
                  <p class="text-2xl font-bold">{{ count }}</p>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-muted-foreground text-center py-4">
              No hay datos de roles disponibles
            </p>
          </div>
        </CardContent>
      </Card>

      <!-- Información adicional -->
      <div class="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>
              Últimas actividades del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p class="text-sm text-muted-foreground">
              Funcionalidad próximamente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Crecimiento</CardTitle>
            <CardDescription>
              Tendencia de registro de usuarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p class="text-sm text-muted-foreground">
              Funcionalidad próximamente
            </p>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Sin datos -->
    <div v-else class="text-center py-12">
      <p class="text-muted-foreground">No hay estadísticas disponibles</p>
    </div>
  </div>
</template>
