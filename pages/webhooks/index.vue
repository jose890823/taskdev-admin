<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { WebhookEvent, WebhookEventStatus } from '~/modules/webhooks/types'
import type { ColumnDef } from '~/components/shared/DataTable/types'
import { useWebhooks } from '~/modules/webhooks/composables/useWebhooks'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '~/components/ui/dialog'
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
  SearchIcon,
  EyeIcon,
  RefreshCwIcon,
  Trash2Icon,
  XIcon,
  WebhookIcon,
  CheckCircleIcon,
  XCircleIcon,
  ActivityIcon,
} from 'lucide-vue-next'

definePageMeta({
  middleware: ['auth', 'module-access'],
})

const {
  events,
  stats,
  loading,
  error,
  total,
  page,
  limit,
  fetchEvents,
  fetchEvent,
  retryEvent,
  fetchStats,
  cleanupEvents,
  clearError,
} = useWebhooks()

// Filtros
const statusFilter = ref<string>('all')
const eventTypeFilter = ref('')

// Dialogs
const showDetailDialog = ref(false)
const selectedEvent = ref<WebhookEvent | null>(null)
const showCleanupConfirm = ref(false)
const retryingId = ref<string | null>(null)

// Columnas de la tabla
const columns: ColumnDef<WebhookEvent>[] = [
  { key: 'eventType', label: 'Tipo de Evento', sortable: false },
  { key: 'url', label: 'URL', sortable: false },
  { key: 'status', label: 'Estado', sortable: false, align: 'center' },
  { key: 'attempts', label: 'Intentos', sortable: false, align: 'center', width: '100px' },
  { key: 'deliveredAt', label: 'Entregado', sortable: false },
  { key: 'error', label: 'Error', sortable: false },
  { key: 'actions', label: 'Acciones', sortable: false, align: 'center', width: '110px' },
]

// Computed
const deliveryRateFormatted = computed(() => {
  if (!stats.value?.deliveryRate) return '0%'
  return `${Number(stats.value.deliveryRate).toFixed(1)}%`
})

// ========================
// Carga de datos
// ========================

onMounted(async () => {
  await Promise.all([loadEvents(), fetchStats()])
})

const loadEvents = async () => {
  try {
    await fetchEvents({
      page: page.value,
      limit: limit.value,
      status: statusFilter.value !== 'all' ? statusFilter.value as WebhookEventStatus : undefined,
      eventType: eventTypeFilter.value || undefined,
    })
  } catch (e) {
    console.error('Error loading webhook events:', e)
  }
}

// ========================
// Handlers
// ========================

const handleFilterChange = async () => {
  page.value = 1
  await loadEvents()
}

const handleSearch = async () => {
  page.value = 1
  await loadEvents()
}

const handlePageChange = async (newPage: number) => {
  page.value = newPage
  await loadEvents()
}

const viewEventDetail = async (webhookEvent: WebhookEvent) => {
  try {
    const detail = await fetchEvent(webhookEvent.id)
    if (detail) {
      selectedEvent.value = detail
      showDetailDialog.value = true
    }
  } catch (e) {
    console.error('Error loading event detail:', e)
  }
}

const handleRetry = async (webhookEvent: WebhookEvent) => {
  retryingId.value = webhookEvent.id
  try {
    await retryEvent(webhookEvent.id)
    await fetchStats()
  } catch (e) {
    console.error('Error retrying event:', e)
  } finally {
    retryingId.value = null
  }
}

const handleCleanup = async () => {
  showCleanupConfirm.value = false
  try {
    await cleanupEvents()
  } catch (e) {
    console.error('Error cleaning up events:', e)
  }
}

// ========================
// Helpers de formato
// ========================

const getStatusText = (status: WebhookEventStatus) => {
  const statuses: Record<WebhookEventStatus, string> = {
    pending: 'Pendiente',
    processing: 'Procesando',
    delivered: 'Entregado',
    failed: 'Fallido',
    retrying: 'Reintentando',
  }
  return statuses[status] || status
}

const getStatusVariant = (status: WebhookEventStatus) => {
  switch (status) {
    case 'pending':
      return 'secondary' as const
    case 'processing':
      return 'default' as const
    case 'delivered':
      return 'default' as const
    case 'failed':
      return 'destructive' as const
    case 'retrying':
      return 'outline' as const
    default:
      return 'outline' as const
  }
}

const getStatusClass = (status: WebhookEventStatus) => {
  switch (status) {
    case 'pending':
      return 'bg-slate-100 text-slate-800 border-slate-200'
    case 'processing':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'delivered':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'retrying':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    default:
      return ''
  }
}

const canRetry = (status: WebhookEventStatus) => {
  return status === 'failed' || status === 'retrying'
}

const truncateText = (text: string, maxLength: number) => {
  if (!text) return '-'
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const formatDate = (date?: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatJson = (data: any) => {
  if (!data) return 'N/A'
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold tracking-tight">Webhooks</h1>
        <p class="text-xs text-muted-foreground">Monitorea y gestiona los webhook events del sistema</p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" @click="loadEvents">
          <RefreshCwIcon class="h-4 w-4 mr-2" />
          Actualizar
        </Button>
        <Button variant="destructive" size="sm" @click="showCleanupConfirm = true">
          <Trash2Icon class="h-4 w-4 mr-2" />
          Limpiar antiguos
        </Button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div v-if="stats" class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-card rounded-lg border p-4">
        <div class="flex items-center gap-2 mb-1">
          <WebhookIcon class="h-4 w-4 text-muted-foreground" />
          <p class="text-sm text-muted-foreground">Total Events</p>
        </div>
        <p class="text-2xl font-bold">{{ stats.totalEvents }}</p>
      </div>
      <div class="bg-card rounded-lg border p-4">
        <div class="flex items-center gap-2 mb-1">
          <CheckCircleIcon class="h-4 w-4 text-green-500" />
          <p class="text-sm text-muted-foreground">Entregados</p>
        </div>
        <p class="text-2xl font-bold text-green-600">{{ stats.delivered }}</p>
      </div>
      <div class="bg-card rounded-lg border p-4">
        <div class="flex items-center gap-2 mb-1">
          <XCircleIcon class="h-4 w-4 text-red-500" />
          <p class="text-sm text-muted-foreground">Fallidos</p>
        </div>
        <p class="text-2xl font-bold text-red-600">{{ stats.failed }}</p>
      </div>
      <div class="bg-card rounded-lg border p-4">
        <div class="flex items-center gap-2 mb-1">
          <ActivityIcon class="h-4 w-4 text-blue-500" />
          <p class="text-sm text-muted-foreground">Tasa de Entrega</p>
        </div>
        <p class="text-2xl font-bold text-blue-600">{{ deliveryRateFormatted }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-card rounded-lg border p-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="relative">
          <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            v-model="eventTypeFilter"
            placeholder="Filtrar por tipo de evento..."
            class="pl-9"
            @keyup.enter="handleSearch"
          />
        </div>
        <div>
          <Select v-model="statusFilter" @update:model-value="handleFilterChange">
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="processing">Procesando</SelectItem>
              <SelectItem value="delivered">Entregado</SelectItem>
              <SelectItem value="failed">Fallido</SelectItem>
              <SelectItem value="retrying">Reintentando</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Button variant="outline" class="w-full" @click="handleSearch">
            <SearchIcon class="h-4 w-4 mr-2" />
            Buscar
          </Button>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
      <div class="flex items-center justify-between">
        <p>{{ error }}</p>
        <Button variant="ghost" size="sm" @click="clearError"><XIcon class="h-4 w-4" /></Button>
      </div>
    </div>

    <!-- Table -->
    <DataTable
      :data="events"
      :columns="columns"
      :loading="loading"
      :pagination="{ page, pageSize: limit, total }"
      empty-message="No se encontraron webhook events"
      row-key="id"
      @page-change="handlePageChange"
    >
      <template #cell-eventType="{ row }">
        <span class="font-mono text-sm font-medium">{{ row.eventType }}</span>
      </template>

      <template #cell-url="{ row }">
        <span class="text-sm text-muted-foreground" :title="row.url">{{ truncateText(row.url, 40) }}</span>
      </template>

      <template #cell-status="{ row }">
        <Badge :variant="getStatusVariant(row.status)" :class="['text-xs', getStatusClass(row.status)]">
          {{ getStatusText(row.status) }}
        </Badge>
      </template>

      <template #cell-attempts="{ row }">
        <span class="text-sm font-mono">{{ row.attempts }}/{{ row.maxAttempts }}</span>
      </template>

      <template #cell-deliveredAt="{ row }">
        <span class="text-sm">{{ formatDate(row.deliveredAt) }}</span>
      </template>

      <template #cell-error="{ row }">
        <span v-if="row.error" class="text-sm text-destructive" :title="row.error">
          {{ truncateText(row.error, 30) }}
        </span>
        <span v-else class="text-sm text-muted-foreground">-</span>
      </template>

      <template #cell-actions="{ row }">
        <div class="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            title="Ver detalle"
            @click="viewEventDetail(row)"
          >
            <EyeIcon class="h-4 w-4" />
          </Button>
          <Button
            v-if="canRetry(row.status)"
            variant="ghost"
            size="sm"
            title="Reintentar"
            :disabled="retryingId === row.id"
            @click="handleRetry(row)"
          >
            <RefreshCwIcon class="h-4 w-4" :class="{ 'animate-spin': retryingId === row.id }" />
          </Button>
        </div>
      </template>
    </DataTable>

    <!-- Detail Dialog -->
    <Dialog v-model:open="showDetailDialog">
      <DialogContent class="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle del Webhook Event</DialogTitle>
          <DialogDescription>
            Informacion completa del evento
          </DialogDescription>
        </DialogHeader>

        <div v-if="selectedEvent" class="space-y-4">
          <!-- Info basica -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-muted-foreground">ID</p>
              <p class="text-sm font-mono">{{ selectedEvent.id }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Tipo de Evento</p>
              <p class="text-sm font-mono font-medium">{{ selectedEvent.eventType }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Estado</p>
              <Badge :variant="getStatusVariant(selectedEvent.status)" :class="['text-xs', getStatusClass(selectedEvent.status)]">
                {{ getStatusText(selectedEvent.status) }}
              </Badge>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Intentos</p>
              <p class="text-sm font-mono">{{ selectedEvent.attempts }} / {{ selectedEvent.maxAttempts }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">URL</p>
              <p class="text-sm font-mono break-all">{{ selectedEvent.url }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Creado</p>
              <p class="text-sm">{{ formatDate(selectedEvent.createdAt) }}</p>
            </div>
            <div v-if="selectedEvent.deliveredAt">
              <p class="text-sm text-muted-foreground">Entregado</p>
              <p class="text-sm">{{ formatDate(selectedEvent.deliveredAt) }}</p>
            </div>
            <div v-if="selectedEvent.lastAttemptAt">
              <p class="text-sm text-muted-foreground">Ultimo intento</p>
              <p class="text-sm">{{ formatDate(selectedEvent.lastAttemptAt) }}</p>
            </div>
            <div v-if="selectedEvent.nextRetryAt">
              <p class="text-sm text-muted-foreground">Proximo reintento</p>
              <p class="text-sm">{{ formatDate(selectedEvent.nextRetryAt) }}</p>
            </div>
          </div>

          <!-- Error -->
          <div v-if="selectedEvent.error">
            <p class="text-sm text-muted-foreground mb-1">Error</p>
            <div class="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p class="text-sm text-destructive font-mono whitespace-pre-wrap">{{ selectedEvent.error }}</p>
            </div>
          </div>

          <!-- Payload -->
          <div>
            <p class="text-sm text-muted-foreground mb-1">Payload</p>
            <div class="bg-muted rounded-lg p-3 max-h-48 overflow-y-auto">
              <pre class="text-xs font-mono whitespace-pre-wrap">{{ formatJson(selectedEvent.payload) }}</pre>
            </div>
          </div>

          <!-- Response -->
          <div v-if="selectedEvent.response">
            <p class="text-sm text-muted-foreground mb-1">
              Respuesta
              <span class="ml-2 font-mono">({{ selectedEvent.response.statusCode }})</span>
            </p>
            <div class="bg-muted rounded-lg p-3 max-h-48 overflow-y-auto">
              <pre class="text-xs font-mono whitespace-pre-wrap">{{ formatJson(selectedEvent.response.body) }}</pre>
            </div>
          </div>

          <!-- Retry button in dialog -->
          <div v-if="canRetry(selectedEvent.status)" class="flex justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              :disabled="retryingId === selectedEvent.id"
              @click="handleRetry(selectedEvent)"
            >
              <RefreshCwIcon class="h-4 w-4 mr-2" :class="{ 'animate-spin': retryingId === selectedEvent.id }" />
              Reintentar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Cleanup Confirmation Dialog -->
    <AlertDialog v-model:open="showCleanupConfirm">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Limpiar eventos antiguos</AlertDialogTitle>
          <AlertDialogDescription>
            Esta accion eliminara los webhook events antiguos que ya fueron procesados.
            Esta accion no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="handleCleanup"
          >
            Limpiar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
