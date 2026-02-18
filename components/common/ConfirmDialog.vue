<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    @click.self="$emit('update:isOpen', false)"
  >
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle>{{ title }}</CardTitle>
        <CardDescription v-if="description">
          {{ description }}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <slot>
          <p>{{ message }}</p>
        </slot>
      </CardContent>

      <CardFooter class="flex justify-end gap-2">
        <Button
          variant="outline"
          @click="$emit('update:isOpen', false)"
        >
          {{ cancelText || $t('common.cancel') }}
        </Button>
        <Button
          :variant="confirmVariant"
          @click="handleConfirm"
        >
          {{ confirmText || $t('common.confirm') }}
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '~/components/ui/card'

interface Props {
  isOpen: boolean
  title: string
  description?: string
  message?: string
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
}

withDefaults(defineProps<Props>(), {
  confirmVariant: 'default',
})

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  confirm: []
}>()

const handleConfirm = () => {
  emit('confirm')
  emit('update:isOpen', false)
}
</script>
