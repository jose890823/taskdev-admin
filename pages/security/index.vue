<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { SecurityAlertStatus } from '~/modules/security/types'
import { useSecurity } from '~/modules/security/composables/useSecurity'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import {
  ShieldIcon,
  ShieldAlertIcon,
  ActivityIcon,
  BanIcon,
  KeyIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  Loader2Icon,
  XIcon,
  Trash2Icon,
  CheckCircleIcon,
  WrenchIcon,
} from 'lucide-vue-next'

definePageMeta({
  middleware: ['auth', 'module-access'],
})

const {
  dashboard,
  alerts,
  loading,
  error,
  getDashboard,
  fetchAlerts,
  updateAlertStatus,
  runCleanup,
  clearError,
} = useSecurity()

const totalActiveAlerts = computed(() => {
  if (!dashboard.value?.alerts?.active) return 0
  const counts = dashboard.value.alerts.active
  return Object.values(counts).reduce((sum, n) => sum + n, 0)
})

const showCleanupDialog = ref(false)
const cleanupResult = ref<any>(null)
const cleaning = ref(false)

onMounted(async () => {
  await Promise.all([getDashboard(), fetchAlerts({ status: 'active' })])
})

const handleCleanup = async () => {
  cleaning.value = true
  try {
    const result = await runCleanup()
    if (result?.success) {
      cleanupResult.value = result.data
      showCleanupDialog.value = true
      await getDashboard()
    }
  } catch (e) {
    console.error('Error cleaning up:', e)
  } finally {
    cleaning.value = false
  }
}

const handleResolveAlert = async (alertId: string) => {
  try {
    await updateAlertStatus(alertId, { status: 'resolved' })
  } catch (e) {
    console.error('Error resolving alert:', e)
  }
}

const handleDismissAlert = async (alertId: string) => {
  try {
    await updateAlertStatus(alertId, { status: 'dismissed' })
  } catch (e) {
    console.error('Error dismissing alert:', e)
  }
}

const getSeverityVariant = (severity: string) => {
  if (severity === 'critical') return 'destructive' as const
  if (severity === 'high') return 'default' as const
  return 'secondary' as const
}

const getSeverityColor = (severity: string) => {
  if (severity === 'critical') return 'text-red-600'
  if (severity === 'high') return 'text-orange-600'
  if (severity === 'medium') return 'text-yellow-600'
  return 'text-muted-foreground'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold tracking-tight">Seguridad</h1>
        <p class="text-xs text-muted-foreground">Panel de control de seguridad de la plataforma</p>
      </div>
      <div class="flex gap-2">
        <NuxtLink to="/security/events">
          <Button variant="outline">
            <ActivityIcon class="h-4 w-4 mr-2" />
            Registro de Eventos
          </Button>
        </NuxtLink>
        <NuxtLink to="/security/blocked-ips">
          <Button variant="outline">
            <BanIcon class="h-4 w-4 mr-2" />
            IPs Bloqueadas
          </Button>
        </NuxtLink>
        <NuxtLink to="/security/config">
          <Button variant="outline">
            <KeyIcon class="h-4 w-4 mr-2" />
            Configuración
          </Button>
        </NuxtLink>
        <Button variant="outline" @click="handleCleanup" :disabled="cleaning">
          <WrenchIcon class="h-4 w-4 mr-2" />
          Mantenimiento
        </Button>
      </div>
    </div>

    <div v-if="error" class="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
      <div class="flex items-center justify-between">
        <p>{{ error }}</p>
        <Button variant="ghost" size="sm" @click="clearError"><XIcon class="h-4 w-4" /></Button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading && !dashboard" class="flex items-center justify-center py-12">
      <Loader2Icon class="h-8 w-8 animate-spin text-muted-foreground" />
    </div>

    <!-- Dashboard Stats -->
    <div v-if="dashboard" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Eventos (7 días)</CardTitle>
          <ActivityIcon class="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ dashboard.events.total }}</div>
          <p class="text-xs text-muted-foreground">{{ dashboard.events.unreviewed }} sin revisar | {{ dashboard.events.bySeverity?.critical || 0 }} críticos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">IPs Bloqueadas</CardTitle>
          <BanIcon class="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-red-600">{{ dashboard.blockedIps.totalActive }}</div>
          <p class="text-xs text-muted-foreground">{{ dashboard.blockedIps.totalPermanent }} permanentes | {{ dashboard.blockedIps.totalAutoBlocked }} automáticas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Alertas activas</CardTitle>
          <AlertTriangleIcon class="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-orange-600">{{ totalActiveAlerts }}</div>
          <p class="text-xs text-muted-foreground">{{ dashboard.alerts.active?.high || 0 }} altas | {{ dashboard.alerts.active?.critical || 0 }} críticas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Sesiones activas</CardTitle>
          <ShieldIcon class="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ dashboard.sessions.totalActive }}</div>
          <p class="text-xs text-muted-foreground">Intentos fallidos: {{ dashboard.loginAttempts.failed }} | Tasa éxito: {{ Math.round(dashboard.loginAttempts.successRate) }}%</p>
        </CardContent>
      </Card>
    </div>

    <!-- Active Alerts -->
    <Card v-if="alerts.length > 0">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <ShieldAlertIcon class="h-5 w-5 text-orange-500" />
          Alertas Activas
        </CardTitle>
        <CardDescription>Alertas de seguridad que requieren atención</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-3">
          <div
            v-for="alert in alerts"
            :key="alert.id"
            class="flex items-center justify-between p-3 border rounded-lg"
            :class="alert.severity === 'critical' ? 'border-red-300 bg-red-50' : ''"
          >
            <div class="flex items-center gap-3">
              <AlertTriangleIcon class="h-5 w-5" :class="getSeverityColor(alert.severity)" />
              <div>
                <p class="font-medium text-sm">{{ alert.title }}</p>
                <p class="text-xs text-muted-foreground">{{ alert.description }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <Badge :variant="getSeverityVariant(alert.severity)" class="text-xs">
                    {{ alert.severity }}
                  </Badge>
                  <span class="text-xs text-muted-foreground">{{ formatDate(alert.createdAt) }}</span>
                  <span v-if="alert.relatedIpAddress" class="text-xs font-mono text-muted-foreground">
                    IP: {{ alert.relatedIpAddress }}
                  </span>
                </div>
              </div>
            </div>
            <div class="flex gap-1">
              <Button variant="outline" size="sm" @click="handleResolveAlert(alert.id)" title="Resolver">
                <CheckCircleIcon class="h-4 w-4 text-green-600" />
              </Button>
              <Button variant="ghost" size="sm" @click="handleDismissAlert(alert.id)" title="Descartar">
                <XIcon class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <div v-if="dashboard && alerts.length === 0" class="text-center py-8 text-muted-foreground">
      <ShieldIcon class="h-12 w-12 mx-auto mb-2 text-green-500" />
      <p class="font-medium">Sin alertas activas</p>
      <p class="text-sm">El sistema no tiene alertas pendientes.</p>
    </div>

    <!-- Cleanup Result Dialog -->
    <AlertDialog v-model:open="showCleanupDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mantenimiento completado</AlertDialogTitle>
          <AlertDialogDescription>
            <template v-if="cleanupResult">
              Bloques expirados limpiados: {{ cleanupResult.cleaned?.expiredBlocks || 0 }}<br>
              Sesiones expiradas limpiadas: {{ cleanupResult.cleaned?.expiredSessions || 0 }}
            </template>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>Aceptar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
