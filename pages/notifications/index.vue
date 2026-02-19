<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { BroadcastAudience, NotificationPriority, NotificationEventConfig } from '~/modules/notifications/types'
import { useAdminNotifications } from '~/modules/notifications/composables/useAdminNotifications'
import { useAuth } from '~/modules/auth/composables/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Badge } from '~/components/ui/badge'
import { Switch } from '~/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import {
  BellIcon,
  SendIcon,
  MegaphoneIcon,
  Loader2Icon,
  Trash2Icon,
  XIcon,
  UsersIcon,
  SettingsIcon,
} from 'lucide-vue-next'

definePageMeta({
  middleware: ['auth', 'module-access'],
})

const { accessToken } = useAuth()
const { loading, error, sendBroadcast, cleanExpired, clearError } = useAdminNotifications()

const config = useRuntimeConfig()
const apiUrl = config.public.apiUrl as string

// Broadcast form
const broadcastTitle = ref('')
const broadcastMessage = ref('')
const broadcastAudience = ref<BroadcastAudience>('all_users')
const broadcastPriority = ref<NotificationPriority>('normal')
const broadcastUserIds = ref('')
const broadcastActionUrl = ref('')
const broadcastActionText = ref('')
const broadcastSendEmail = ref(false)
const sending = ref(false)
const showSuccessDialog = ref(false)
const successInfo = ref({ queued: 0, audience: '' })

// Clean expired
const cleaning = ref(false)
const showCleanDialog = ref(false)
const cleanResult = ref(0)

// Event configs
const eventConfigs = ref<NotificationEventConfig[]>([])
const loadingConfigs = ref(false)
const togglingId = ref<string | null>(null)

const fetchEventConfigs = async () => {
  loadingConfigs.value = true
  try {
    const response = await $fetch<{ success: boolean; data: NotificationEventConfig[] }>(
      `${apiUrl}/v1/admin/notifications/event-configs`,
      { headers: { Authorization: `Bearer ${accessToken.value}` } },
    )
    if (response.success) {
      eventConfigs.value = response.data
    }
  } catch (e: any) {
    console.error('Error fetching event configs:', e)
  } finally {
    loadingConfigs.value = false
  }
}

const toggleEventConfig = async (config: NotificationEventConfig) => {
  togglingId.value = config.id
  try {
    await $fetch(`${apiUrl}/v1/admin/notifications/event-configs/${config.id}`, {
      method: 'PATCH',
      body: { isEnabled: !config.isEnabled },
      headers: { Authorization: `Bearer ${accessToken.value}` },
    })
    config.isEnabled = !config.isEnabled
  } catch (e: any) {
    console.error('Error toggling event config:', e)
  } finally {
    togglingId.value = null
  }
}

onMounted(() => {
  fetchEventConfigs()
})

const handleSendBroadcast = async () => {
  if (!broadcastTitle.value.trim() || !broadcastMessage.value.trim()) return

  sending.value = true
  try {
    const data: any = {
      title: broadcastTitle.value.trim(),
      message: broadcastMessage.value.trim(),
      audience: broadcastAudience.value,
      priority: broadcastPriority.value,
      sendEmail: broadcastSendEmail.value,
    }
    if (broadcastAudience.value === 'specific_users' && broadcastUserIds.value) {
      data.userIds = broadcastUserIds.value.split(',').map((id: string) => id.trim()).filter(Boolean)
    }
    if (broadcastActionUrl.value) data.actionUrl = broadcastActionUrl.value
    if (broadcastActionText.value) data.actionText = broadcastActionText.value

    const result = await sendBroadcast(data)
    if (result) {
      successInfo.value = { queued: result.queued, audience: result.audience }
      showSuccessDialog.value = true
      resetForm()
    }
  } catch (e) {
    console.error('Error sending broadcast:', e)
  } finally {
    sending.value = false
  }
}

const handleCleanExpired = async () => {
  cleaning.value = true
  try {
    const result = await cleanExpired()
    if (result) {
      cleanResult.value = result.deleted
      showCleanDialog.value = true
    }
  } catch (e) {
    console.error('Error cleaning expired:', e)
  } finally {
    cleaning.value = false
  }
}

const resetForm = () => {
  broadcastTitle.value = ''
  broadcastMessage.value = ''
  broadcastAudience.value = 'all_users'
  broadcastPriority.value = 'normal'
  broadcastUserIds.value = ''
  broadcastActionUrl.value = ''
  broadcastActionText.value = ''
  broadcastSendEmail.value = false
}

const getAudienceLabel = (audience: BroadcastAudience) => {
  const labels: Record<string, string> = {
    all_users: 'Todos los usuarios',
    organization_members: 'Miembros de organizacion',
    specific_users: 'Usuarios especificos',
  }
  return labels[audience] || audience
}

const getPriorityVariant = (priority: NotificationPriority) => {
  if (priority === 'urgent') return 'destructive' as const
  if (priority === 'high') return 'default' as const
  return 'secondary' as const
}

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    tasks: 'Tareas',
    projects: 'Proyectos',
    organizations: 'Organizaciones',
  }
  return labels[category] || category
}

// Group configs by category
const groupedConfigs = computed(() => {
  const groups: Record<string, NotificationEventConfig[]> = {}
  for (const config of eventConfigs.value) {
    if (!groups[config.category]) groups[config.category] = []
    groups[config.category].push(config)
  }
  return groups
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold tracking-tight">Notificaciones</h1>
        <p class="text-xs text-muted-foreground">Gestion de notificaciones y configuracion de eventos</p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" @click="handleCleanExpired" :disabled="cleaning">
          <Trash2Icon class="h-4 w-4 mr-2" />
          Limpiar expiradas
        </Button>
      </div>
    </div>

    <div v-if="error" class="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
      <div class="flex items-center justify-between">
        <p>{{ error }}</p>
        <Button variant="ghost" size="sm" @click="clearError"><XIcon class="h-4 w-4" /></Button>
      </div>
    </div>

    <!-- Event Configs -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <SettingsIcon class="h-5 w-5" />
          Configuracion de Eventos
        </CardTitle>
        <CardDescription>Habilita o deshabilita tipos de notificacion a nivel global</CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="loadingConfigs" class="flex justify-center py-8">
          <Loader2Icon class="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
        <div v-else class="space-y-6">
          <div v-for="(configs, category) in groupedConfigs" :key="category">
            <h3 class="text-sm font-medium mb-3">{{ getCategoryLabel(category) }}</h3>
            <div class="space-y-3">
              <div
                v-for="cfg in configs"
                :key="cfg.id"
                class="flex items-center justify-between py-2 px-3 rounded-lg border"
              >
                <div>
                  <p class="text-sm font-medium">{{ cfg.label }}</p>
                  <p v-if="cfg.description" class="text-xs text-muted-foreground">{{ cfg.description }}</p>
                </div>
                <Switch
                  :model-value="cfg.isEnabled"
                  :disabled="togglingId === cfg.id"
                  @update:model-value="toggleEventConfig(cfg)"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Broadcast Form -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <MegaphoneIcon class="h-5 w-5" />
          Enviar Broadcast
        </CardTitle>
        <CardDescription>Envia una notificacion masiva a multiples usuarios</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="title">Titulo *</Label>
            <Input id="title" v-model="broadcastTitle" placeholder="Titulo de la notificacion" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>Audiencia *</Label>
              <Select v-model="broadcastAudience">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_users">Todos los usuarios</SelectItem>
                  <SelectItem value="organization_members">Miembros de org</SelectItem>
                  <SelectItem value="specific_users">Usuarios especificos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2">
              <Label>Prioridad</Label>
              <Select v-model="broadcastPriority">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div v-if="broadcastAudience === 'specific_users'" class="space-y-2">
          <Label>IDs de Usuarios</Label>
          <Input v-model="broadcastUserIds" placeholder="UUID1, UUID2, UUID3 (separados por comas)" />
        </div>

        <div class="space-y-2">
          <Label for="message">Mensaje *</Label>
          <Textarea id="message" v-model="broadcastMessage" placeholder="Contenido de la notificacion..." rows="4" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label>URL de accion (opcional)</Label>
            <Input v-model="broadcastActionUrl" placeholder="/tasks/..." />
          </div>
          <div class="space-y-2">
            <Label>Texto del boton (opcional)</Label>
            <Input v-model="broadcastActionText" placeholder="Ver mas" />
          </div>
        </div>

        <div class="flex items-center justify-between pt-2">
          <div class="flex items-center gap-2">
            <Switch id="sendEmail" v-model:checked="broadcastSendEmail" />
            <Label for="sendEmail">Enviar tambien por email</Label>
          </div>

          <div class="flex items-center gap-2">
            <Badge :variant="getPriorityVariant(broadcastPriority)">
              {{ broadcastPriority }}
            </Badge>
            <Badge variant="outline">
              <UsersIcon class="h-3 w-3 mr-1" />
              {{ getAudienceLabel(broadcastAudience) }}
            </Badge>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" @click="resetForm">Limpiar</Button>
          <Button
            @click="handleSendBroadcast"
            :disabled="sending || !broadcastTitle.trim() || !broadcastMessage.trim()"
          >
            <Loader2Icon v-if="sending" class="h-4 w-4 mr-2 animate-spin" />
            <SendIcon v-else class="h-4 w-4 mr-2" />
            {{ sending ? 'Enviando...' : 'Enviar Broadcast' }}
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Success Dialog -->
    <AlertDialog v-model:open="showSuccessDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Broadcast enviado</AlertDialogTitle>
          <AlertDialogDescription>
            Se encolaron {{ successInfo.queued }} notificaciones para: {{ successInfo.audience }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>Aceptar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Clean Dialog -->
    <AlertDialog v-model:open="showCleanDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Limpieza completada</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminaron {{ cleanResult }} notificaciones expiradas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>Aceptar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
