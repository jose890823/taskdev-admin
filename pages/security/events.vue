<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { SecurityEventType, SecurityEventSeverity, SecurityEventFilterDto } from '~/modules/security/types'
import { useSecurity } from '~/modules/security/composables/useSecurity'
import type { ColumnDef } from '~/components/shared/DataTable/types'
import type { SecurityEvent } from '~/modules/security/types'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Textarea } from '~/components/ui/textarea'
import { Label } from '~/components/ui/label'
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XIcon,
  EyeIcon,
} from 'lucide-vue-next'

definePageMeta({
  middleware: ['auth', 'module-access'],
})

const router = useRouter()
const { events, loading, error, total, page, limit, fetchEvents, reviewEvent, clearError } = useSecurity()

const severityFilter = ref<string>('all')
const reviewedFilter = ref<string>('all')
const ipFilter = ref('')

// Review dialog
const showReviewDialog = ref(false)
const eventToReview = ref<SecurityEvent | null>(null)
const reviewNotes = ref('')

const columns: ColumnDef<SecurityEvent>[] = [
  { key: 'createdAt', label: 'Fecha', sortable: false },
  { key: 'eventType', label: 'Tipo', sortable: false },
  { key: 'severity', label: 'Severidad', sortable: false, align: 'center' },
  { key: 'description', label: 'Descripción', sortable: false },
  { key: 'ipAddress', label: 'IP', sortable: false },
  { key: 'reviewed', label: 'Revisado', sortable: false, align: 'center' },
  { key: 'actions', label: 'Acciones', sortable: false, align: 'center', width: '100px' },
]

onMounted(async () => {
  await loadEvents()
})

const loadEvents = async () => {
  const filters: SecurityEventFilterDto = {
    page: page.value,
    limit: limit.value,
  }
  if (severityFilter.value !== 'all') filters.severity = severityFilter.value as SecurityEventSeverity
  if (reviewedFilter.value !== 'all') filters.reviewed = reviewedFilter.value === 'true'
  if (ipFilter.value) filters.ipAddress = ipFilter.value
  await fetchEvents(filters)
}

const handleFilterChange = () => {
  page.value = 1
  loadEvents()
}

const handlePageChange = (newPage: number) => {
  page.value = newPage
  loadEvents()
}

const openReviewDialog = (event: SecurityEvent) => {
  eventToReview.value = event
  reviewNotes.value = ''
  showReviewDialog.value = true
}

const handleReview = async () => {
  if (!eventToReview.value) return
  try {
    await reviewEvent(eventToReview.value.id, { notes: reviewNotes.value || undefined })
    showReviewDialog.value = false
  } catch (e) {
    console.error('Error reviewing event:', e)
  }
}

const getSeverityVariant = (severity: string) => {
  if (severity === 'critical') return 'destructive' as const
  if (severity === 'high') return 'default' as const
  return 'secondary' as const
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

const getEventTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    login_failed: 'Login fallido',
    login_success: 'Login exitoso',
    login_blocked: 'Login bloqueado',
    rate_limit_exceeded: 'Rate limit excedido',
    suspicious_activity: 'Actividad sospechosa',
    password_changed: 'Password cambiado',
    ip_blocked: 'IP bloqueada',
    ip_unblocked: 'IP desbloqueada',
    session_revoked: 'Sesión revocada',
    admin_action: 'Acción admin',
    unauthorized_access: 'Acceso no autorizado',
  }
  return labels[type] || type.replace(/_/g, ' ')
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <Button variant="ghost" size="sm" @click="router.push('/security')">
        <ArrowLeftIcon class="h-4 w-4" />
      </Button>
      <div>
        <h1 class="text-xl font-semibold tracking-tight">Registro de Eventos</h1>
        <p class="text-xs text-muted-foreground">Auditoría de eventos de seguridad</p>
      </div>
    </div>

    <div v-if="error" class="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
      <div class="flex items-center justify-between">
        <p>{{ error }}</p>
        <Button variant="ghost" size="sm" @click="clearError"><XIcon class="h-4 w-4" /></Button>
      </div>
    </div>

    <div class="bg-card rounded-lg border p-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Select v-model="severityFilter" @update:model-value="handleFilterChange">
          <SelectTrigger><SelectValue placeholder="Severidad" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="critical">Crítica</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="low">Baja</SelectItem>
          </SelectContent>
        </Select>
        <Select v-model="reviewedFilter" @update:model-value="handleFilterChange">
          <SelectTrigger><SelectValue placeholder="Revisado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="false">Sin revisar</SelectItem>
            <SelectItem value="true">Revisados</SelectItem>
          </SelectContent>
        </Select>
        <Input v-model="ipFilter" placeholder="Filtrar por IP..." @keyup.enter="handleFilterChange" />
        <Button variant="outline" @click="handleFilterChange">Filtrar</Button>
      </div>
    </div>

    <DataTable
      :data="events"
      :columns="columns"
      :loading="loading"
      :pagination="{ page, pageSize: limit, total }"
      empty-message="No se encontraron eventos"
      row-key="id"
      @page-change="handlePageChange"
    >
      <template #cell-createdAt="{ row }">
        <span class="text-sm whitespace-nowrap">{{ formatDate(row.createdAt) }}</span>
      </template>

      <template #cell-eventType="{ row }">
        <span class="text-sm">{{ getEventTypeLabel(row.eventType) }}</span>
      </template>

      <template #cell-severity="{ row }">
        <Badge :variant="getSeverityVariant(row.severity)" class="text-xs">
          {{ row.severity }}
        </Badge>
      </template>

      <template #cell-description="{ row }">
        <p class="text-sm line-clamp-1 max-w-[300px]">{{ row.description }}</p>
      </template>

      <template #cell-ipAddress="{ row }">
        <span class="text-sm font-mono">{{ row.ipAddress }}</span>
      </template>

      <template #cell-reviewed="{ row }">
        <Badge v-if="row.reviewed" variant="outline" class="text-xs text-green-600">
          <CheckCircleIcon class="h-3 w-3 mr-1" /> Si
        </Badge>
        <Badge v-else variant="secondary" class="text-xs">No</Badge>
      </template>

      <template #cell-actions="{ row }">
        <Button v-if="!row.reviewed" variant="outline" size="sm" @click="openReviewDialog(row)" title="Marcar como revisado">
          <EyeIcon class="h-4 w-4" />
        </Button>
      </template>
    </DataTable>

    <!-- Review Dialog -->
    <Dialog v-model:open="showReviewDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revisar Evento</DialogTitle>
          <DialogDescription>
            Marcar evento como revisado. Opcionalmente agrega notas.
          </DialogDescription>
        </DialogHeader>
        <div v-if="eventToReview" class="space-y-3">
          <div>
            <Label class="text-muted-foreground">Tipo</Label>
            <p class="text-sm font-medium">{{ getEventTypeLabel(eventToReview.eventType) }}</p>
          </div>
          <div>
            <Label class="text-muted-foreground">Descripción</Label>
            <p class="text-sm">{{ eventToReview.description }}</p>
          </div>
          <div class="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea v-model="reviewNotes" placeholder="Notas de revisión..." rows="3" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showReviewDialog = false">Cancelar</Button>
          <Button @click="handleReview">
            <CheckCircleIcon class="h-4 w-4 mr-2" />
            Marcar como revisado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
