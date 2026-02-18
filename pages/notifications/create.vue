<script setup lang="ts">
import { ref } from 'vue'
import type { NotificationType, NotificationChannel, NotificationPriority } from '~/modules/notifications/types'
import { useAdminNotifications } from '~/modules/notifications/composables/useAdminNotifications'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  BellIcon,
  SendIcon,
  Loader2Icon,
  ArrowLeftIcon,
  XIcon,
} from 'lucide-vue-next'

definePageMeta({
  middleware: ['auth', 'module-access'],
})

const router = useRouter()
const { loading, error, createNotification, clearError } = useAdminNotifications()

const userId = ref('')
const type = ref<NotificationType>('custom')
const title = ref('')
const message = ref('')
const channel = ref<NotificationChannel>('in_app')
const priority = ref<NotificationPriority>('normal')
const actionUrl = ref('')
const actionText = ref('')
const icon = ref('')
const sending = ref(false)

const notificationTypes: { value: NotificationType; label: string }[] = [
  { value: 'custom', label: 'Personalizado' },
  { value: 'system_announcement', label: 'Anuncio del sistema' },
  { value: 'enrollment_created', label: 'Inscripción creada' },
  { value: 'payment_received', label: 'Pago recibido' },
  { value: 'evaluation_available', label: 'Evaluación disponible' },
  { value: 'evaluation_graded', label: 'Evaluación calificada' },
  { value: 'certificate_issued', label: 'Certificado emitido' },
  { value: 'workshop_reminder', label: 'Recordatorio de taller' },
  { value: 'achievement_earned', label: 'Logro obtenido' },
  { value: 'course_completed', label: 'Curso completado' },
  { value: 'welcome', label: 'Bienvenida' },
  { value: 'account_security', label: 'Seguridad de cuenta' },
]

const handleSubmit = async () => {
  if (!userId.value.trim() || !title.value.trim() || !message.value.trim()) return

  sending.value = true
  try {
    const data: any = {
      userId: userId.value.trim(),
      type: type.value,
      title: title.value.trim(),
      message: message.value.trim(),
      channel: channel.value,
      priority: priority.value,
    }
    if (actionUrl.value) data.actionUrl = actionUrl.value
    if (actionText.value) data.actionText = actionText.value
    if (icon.value) data.icon = icon.value

    const result = await createNotification(data)
    if (result) {
      router.push('/notifications')
    }
  } catch (e) {
    console.error('Error creating notification:', e)
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <Button variant="ghost" size="sm" @click="router.push('/notifications')">
        <ArrowLeftIcon class="h-4 w-4" />
      </Button>
      <div>
        <h1 class="text-xl font-semibold tracking-tight">Nueva Notificación</h1>
        <p class="text-xs text-muted-foreground">Envía una notificación a un usuario específico</p>
      </div>
    </div>

    <div v-if="error" class="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
      <div class="flex items-center justify-between">
        <p>{{ error }}</p>
        <Button variant="ghost" size="sm" @click="clearError"><XIcon class="h-4 w-4" /></Button>
      </div>
    </div>

    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <BellIcon class="h-5 w-5" />
          Notificación Individual
        </CardTitle>
        <CardDescription>Envía una notificación directa a un usuario</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="userId">ID del Usuario *</Label>
            <Input id="userId" v-model="userId" placeholder="UUID del usuario" />
          </div>
          <div class="space-y-2">
            <Label>Tipo *</Label>
            <Select v-model="type">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="nt in notificationTypes" :key="nt.value" :value="nt.value">
                  {{ nt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="ntitle">Título *</Label>
          <Input id="ntitle" v-model="title" placeholder="Título de la notificación" />
        </div>

        <div class="space-y-2">
          <Label for="nmessage">Mensaje *</Label>
          <Textarea id="nmessage" v-model="message" placeholder="Contenido de la notificación..." rows="4" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-2">
            <Label>Canal</Label>
            <Select v-model="channel">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="in_app">In-App</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="push">Push</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label>Prioridad</Label>
            <Select v-model="priority">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baja</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label>Icono (opcional)</Label>
            <Input v-model="icon" placeholder="bell, alert, etc." />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label>URL de acción (opcional)</Label>
            <Input v-model="actionUrl" placeholder="https://..." />
          </div>
          <div class="space-y-2">
            <Label>Texto del botón (opcional)</Label>
            <Input v-model="actionText" placeholder="Ver más" />
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" @click="router.push('/notifications')">Cancelar</Button>
          <Button
            @click="handleSubmit"
            :disabled="sending || !userId.trim() || !title.trim() || !message.trim()"
          >
            <Loader2Icon v-if="sending" class="h-4 w-4 mr-2 animate-spin" />
            <SendIcon v-else class="h-4 w-4 mr-2" />
            {{ sending ? 'Enviando...' : 'Enviar Notificación' }}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
