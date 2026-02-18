<script setup lang="ts">
import { ref } from 'vue'
import type { BroadcastAudience, NotificationPriority } from '~/modules/notifications/types'
import { useAdminNotifications } from '~/modules/notifications/composables/useAdminNotifications'
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
  AlertDialogCancel,
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
  BookOpenIcon,
} from 'lucide-vue-next'

definePageMeta({
  middleware: ['auth', 'module-access'],
})

const { loading, error, sendBroadcast, cleanExpired, clearError } = useAdminNotifications()

// Broadcast form
const broadcastTitle = ref('')
const broadcastMessage = ref('')
const broadcastAudience = ref<BroadcastAudience>('all_users')
const broadcastPriority = ref<NotificationPriority>('normal')
const broadcastCourseId = ref('')
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
    if (broadcastAudience.value === 'specific_course' && broadcastCourseId.value) {
      data.courseId = broadcastCourseId.value
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
  broadcastCourseId.value = ''
  broadcastUserIds.value = ''
  broadcastActionUrl.value = ''
  broadcastActionText.value = ''
  broadcastSendEmail.value = false
}

const getAudienceLabel = (audience: BroadcastAudience) => {
  const labels: Record<string, string> = {
    all_users: 'Todos los usuarios',
    active_clients: 'Clientes activos',
    specific_users: 'Usuarios específicos',
  }
  return labels[audience] || audience
}

const getPriorityVariant = (priority: NotificationPriority) => {
  if (priority === 'urgent') return 'destructive' as const
  if (priority === 'high') return 'default' as const
  return 'secondary' as const
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold tracking-tight">Notificaciones</h1>
        <p class="text-xs text-muted-foreground">Envía notificaciones a los usuarios</p>
      </div>
      <div class="flex gap-2">
        <NuxtLink to="/notifications/create">
          <Button variant="outline">
            <BellIcon class="h-4 w-4 mr-2" />
            Notificación individual
          </Button>
        </NuxtLink>
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

    <!-- Broadcast Form -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <MegaphoneIcon class="h-5 w-5" />
          Enviar Broadcast
        </CardTitle>
        <CardDescription>Envía una notificación masiva a múltiples usuarios</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="title">Título *</Label>
            <Input id="title" v-model="broadcastTitle" placeholder="Título de la notificación" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>Audiencia *</Label>
              <Select v-model="broadcastAudience">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_users">Todos los usuarios</SelectItem>
                  <SelectItem value="active_clients">Clientes activos</SelectItem>
                  <SelectItem value="specific_users">Usuarios específicos</SelectItem>
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

        <div v-if="broadcastAudience === 'specific_course'" class="space-y-2">
          <Label>ID del Curso</Label>
          <Input v-model="broadcastCourseId" placeholder="UUID del curso" />
        </div>

        <div v-if="broadcastAudience === 'specific_users'" class="space-y-2">
          <Label>IDs de Usuarios</Label>
          <Input v-model="broadcastUserIds" placeholder="UUID1, UUID2, UUID3 (separados por comas)" />
        </div>

        <div class="space-y-2">
          <Label for="message">Mensaje *</Label>
          <Textarea id="message" v-model="broadcastMessage" placeholder="Contenido de la notificación..." rows="4" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label>URL de acción (opcional)</Label>
            <Input v-model="broadcastActionUrl" placeholder="https://..." />
          </div>
          <div class="space-y-2">
            <Label>Texto del botón (opcional)</Label>
            <Input v-model="broadcastActionText" placeholder="Ver más" />
          </div>
        </div>

        <div class="flex items-center justify-between pt-2">
          <div class="flex items-center gap-2">
            <Switch id="sendEmail" v-model:checked="broadcastSendEmail" />
            <Label for="sendEmail">Enviar también por email</Label>
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
