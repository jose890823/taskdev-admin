<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogScrollContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '~/components/ui/dialog'
import { HelpCircleIcon } from 'lucide-vue-next'

export interface HelpSection {
  title: string
  content: string
  icon?: string
}

export interface HelpExample {
  label: string
  before: string
  after: string
  highlight?: string
}

const props = withDefaults(defineProps<{
  title: string
  description?: string
  sections?: HelpSection[]
  triggerLabel?: string
  triggerSize?: 'default' | 'sm' | 'lg' | 'icon'
  maxWidth?: string
}>(), {
  triggerLabel: '',
  triggerSize: 'icon',
  maxWidth: 'max-w-2xl',
})

const isOpen = ref(false)
</script>

<template>
  <Dialog v-model:open="isOpen">
    <!-- Trigger button -->
    <Button
      variant="ghost"
      :size="triggerSize"
      @click="isOpen = true"
      class="text-muted-foreground hover:text-foreground"
      title="Ayuda"
    >
      <HelpCircleIcon class="h-5 w-5" />
      <span v-if="triggerLabel" class="ml-1.5">{{ triggerLabel }}</span>
    </Button>

    <!-- Dialog content -->
    <DialogScrollContent :class="maxWidth">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2 text-lg">
          <HelpCircleIcon class="h-5 w-5 text-primary" />
          {{ title }}
        </DialogTitle>
        <DialogDescription v-if="description">
          {{ description }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 mt-2">
        <!-- Slot for fully custom content -->
        <slot />
      </div>
    </DialogScrollContent>
  </Dialog>
</template>
