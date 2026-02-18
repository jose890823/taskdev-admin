<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { EditableColumnDef } from './types'
import { Input } from '~/components/ui/input'
import { Switch } from '~/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

const props = defineProps<{
  value: any
  column: EditableColumnDef
  editing: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  'update:value': [value: any]
  'enter': []
  'escape': []
  'tab': []
  'toggle': []
}>()

const inputRef = ref<InstanceType<typeof Input> | null>(null)

const resolvedOptions = computed(() => {
  if (!props.column.options) return []
  return typeof props.column.options === 'function'
    ? props.column.options()
    : props.column.options
})

const displayValue = computed(() => {
  if (props.column.format) {
    return props.column.format(props.value)
  }
  if (props.column.type === 'select' && resolvedOptions.value.length) {
    const opt = resolvedOptions.value.find(o => String(o.value) === String(props.value))
    return opt?.label ?? props.value
  }
  if (props.column.type === 'toggle') {
    return props.value ? 'Si' : 'No'
  }
  if (props.value === null || props.value === undefined) return '-'
  return String(props.value)
})

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    emit('enter')
  } else if (e.key === 'Escape') {
    e.preventDefault()
    emit('escape')
  } else if (e.key === 'Tab') {
    e.preventDefault()
    emit('tab')
  }
}

const handleInput = (val: any) => {
  if (props.column.type === 'number') {
    emit('update:value', val === '' ? null : Number(val))
  } else {
    emit('update:value', val)
  }
}

watch(() => props.editing, async (isEditing) => {
  if (isEditing) {
    await nextTick()
    const el = inputRef.value?.$el?.querySelector('input') ?? inputRef.value?.$el
    if (el instanceof HTMLInputElement) {
      el.focus()
      el.select()
    }
  }
})
</script>

<template>
  <div class="relative w-full">
    <!-- Editing mode -->
    <template v-if="editing">
      <!-- Text / Number input -->
      <template v-if="column.type === 'text' || column.type === 'number' || !column.type">
        <Input
          ref="inputRef"
          :type="column.type === 'number' ? 'number' : 'text'"
          :model-value="value ?? ''"
          :placeholder="column.placeholder || ''"
          :min="column.min"
          :max="column.max"
          :step="column.step"
          class="h-8 text-sm"
          @update:model-value="handleInput"
          @keydown="handleKeydown"
        />
      </template>

      <!-- Select -->
      <template v-else-if="column.type === 'select'">
        <Select
          :model-value="value != null ? String(value) : undefined"
          @update:model-value="(val) => emit('update:value', val)"
        >
          <SelectTrigger class="h-8 text-sm" @keydown="handleKeydown">
            <SelectValue :placeholder="column.placeholder || 'Seleccionar'" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="opt in resolvedOptions"
              :key="opt.value"
              :value="String(opt.value)"
            >
              {{ opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </template>

      <!-- Toggle -->
      <template v-else-if="column.type === 'toggle'">
        <Switch
          :model-value="!!value"
          @update:model-value="(val) => emit('update:value', val)"
        />
      </template>

      <!-- Date -->
      <template v-else-if="column.type === 'date'">
        <Input
          ref="inputRef"
          type="date"
          :model-value="value ?? ''"
          class="h-8 text-sm"
          @update:model-value="handleInput"
          @keydown="handleKeydown"
        />
      </template>

      <!-- Color -->
      <template v-else-if="column.type === 'color'">
        <div class="flex items-center gap-2">
          <input
            type="color"
            :value="value || '#000000'"
            class="w-8 h-8 rounded border cursor-pointer"
            @input="(e) => emit('update:value', (e.target as HTMLInputElement).value)"
          />
          <Input
            :model-value="value ?? ''"
            placeholder="#hex"
            class="h-8 text-sm flex-1"
            @update:model-value="handleInput"
            @keydown="handleKeydown"
          />
        </div>
      </template>
    </template>

    <!-- Display mode -->
    <template v-else>
      <template v-if="column.type === 'toggle'">
        <Switch :model-value="!!value" @update:model-value="emit('toggle')" />
      </template>
      <template v-else-if="column.type === 'color'">
        <div class="flex items-center gap-2">
          <div
            v-if="value"
            class="w-4 h-4 rounded-full border"
            :style="{ backgroundColor: value }"
          />
          <span class="text-sm">{{ value || '-' }}</span>
        </div>
      </template>
      <template v-else>
        <span class="text-sm truncate block" :title="displayValue">
          {{ displayValue }}
        </span>
      </template>
    </template>

    <!-- Validation error -->
    <p v-if="error" class="text-xs text-destructive mt-0.5 absolute -bottom-4 left-0 whitespace-nowrap">
      {{ error }}
    </p>
  </div>
</template>
