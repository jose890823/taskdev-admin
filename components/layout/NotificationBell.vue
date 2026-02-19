<script setup lang="ts">
import { BellIcon } from 'lucide-vue-next'
import { useNotifications } from '~/composables/useNotifications'

const { unreadCount, hasUnread } = useNotifications()

const emit = defineEmits<{
  'click': []
}>()
</script>

<template>
  <button
    class="relative inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
    @click="emit('click')"
  >
    <BellIcon class="h-5 w-5" />
    <span
      v-if="hasUnread"
      class="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1 leading-none"
    >
      {{ unreadCount > 99 ? '99+' : unreadCount }}
    </span>
  </button>
</template>
