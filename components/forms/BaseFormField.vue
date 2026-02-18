<template>
  <div class="space-y-2">
    <Label v-if="label" :for="id">
      {{ label }}
      <span v-if="required" class="text-destructive">*</span>
    </Label>

    <Input
      :id="id"
      :type="type"
      :placeholder="placeholder"
      :model-value="modelValue"
      :disabled="disabled"
      :class="{ 'border-destructive': error }"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <p v-if="error" class="text-sm text-destructive">
      {{ error }}
    </p>

    <p v-if="hint && !error" class="text-sm text-muted-foreground">
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

interface Props {
  id?: string
  label?: string
  type?: string
  placeholder?: string
  modelValue?: string | number
  error?: string
  hint?: string
  required?: boolean
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
  disabled: false,
})

defineEmits<{
  'update:modelValue': [value: string | number | undefined]
}>()
</script>
