<script setup lang="ts">
import { onMounted } from 'vue'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '~/components/ui/sheet'
import { Button } from '~/components/ui/button'
import {
  BellIcon,
  CheckCheckIcon,
  Loader2Icon,
  InboxIcon,
  UserPlusIcon,
  UserMinusIcon,
  ArrowRightLeftIcon,
  CheckCircle2Icon,
  MessageCircleIcon,
  ClockIcon,
  ListPlusIcon,
  FolderPlusIcon,
  FolderMinusIcon,
  BuildingIcon,
  MailIcon,
} from 'lucide-vue-next'
import { useNotifications } from '~/composables/useNotifications'
import type { Notification } from '~/modules/notifications/types'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const {
  notifications,
  loading,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  hasUnread,
} = useNotifications()

onMounted(async () => {
  if (notifications.value.length === 0) {
    await fetchNotifications()
  }
})

const handleOpen = (val: boolean) => {
  emit('update:open', val)
  if (val && notifications.value.length === 0) {
    fetchNotifications()
  }
}

const handleNotificationClick = async (notification: Notification) => {
  if (!notification.isRead) {
    await markAsRead(notification.id)
  }

  if (notification.actionUrl) {
    emit('update:open', false)
    await navigateTo(notification.actionUrl)
  }
}

const getIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    task_assigned: UserPlusIcon,
    task_unassigned: UserMinusIcon,
    task_status_changed: ArrowRightLeftIcon,
    task_completed: CheckCircle2Icon,
    task_commented: MessageCircleIcon,
    task_due_soon: ClockIcon,
    subtask_created: ListPlusIcon,
    project_member_added: FolderPlusIcon,
    project_member_removed: FolderMinusIcon,
    org_member_added: BuildingIcon,
    org_invitation_received: MailIcon,
  }
  return iconMap[type] || BellIcon
}

const timeAgo = (dateStr: string) => {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'Ahora'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}
</script>

<template>
  <Sheet :open="props.open" @update:open="handleOpen">
    <SheetContent side="right" class="w-[380px] sm:max-w-[380px] p-0 flex flex-col">
      <SheetHeader class="p-4 pb-2 border-b">
        <div class="flex items-center justify-between">
          <SheetTitle class="text-base">Notificaciones</SheetTitle>
          <Button
            v-if="hasUnread"
            variant="ghost"
            size="sm"
            class="text-xs h-7"
            @click="markAllAsRead"
          >
            <CheckCheckIcon class="h-3.5 w-3.5 mr-1" />
            Marcar todas
          </Button>
        </div>
        <SheetDescription class="sr-only">Panel de notificaciones</SheetDescription>
      </SheetHeader>

      <div class="flex-1 overflow-y-auto">
        <!-- Loading -->
        <div v-if="loading && notifications.length === 0" class="flex items-center justify-center py-12">
          <Loader2Icon class="h-6 w-6 animate-spin text-muted-foreground" />
        </div>

        <!-- Empty -->
        <div v-else-if="notifications.length === 0" class="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <InboxIcon class="h-10 w-10 mb-3 opacity-40" />
          <p class="text-sm">No hay notificaciones</p>
        </div>

        <!-- List -->
        <div v-else class="divide-y">
          <button
            v-for="notif in notifications"
            :key="notif.id"
            class="w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors flex gap-3"
            :class="{ 'bg-accent/30': !notif.isRead }"
            @click="handleNotificationClick(notif)"
          >
            <!-- Icon -->
            <div
              class="flex-shrink-0 mt-0.5 w-8 h-8 rounded-full flex items-center justify-center"
              :class="notif.isRead ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'"
            >
              <component :is="getIcon(notif.type)" class="h-4 w-4" />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <p
                class="text-sm leading-tight"
                :class="notif.isRead ? 'text-muted-foreground' : 'font-medium'"
              >
                {{ notif.title }}
              </p>
              <p class="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {{ notif.message }}
              </p>
              <span class="text-[10px] text-muted-foreground/70 mt-1 block">
                {{ timeAgo(notif.createdAt) }}
              </span>
            </div>

            <!-- Unread dot -->
            <div v-if="!notif.isRead" class="flex-shrink-0 mt-2">
              <div class="w-2 h-2 rounded-full bg-primary" />
            </div>
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t p-3">
        <NuxtLink to="/notifications" @click="emit('update:open', false)">
          <Button variant="outline" size="sm" class="w-full text-xs">
            Ver todas las notificaciones
          </Button>
        </NuxtLink>
      </div>
    </SheetContent>
  </Sheet>
</template>
