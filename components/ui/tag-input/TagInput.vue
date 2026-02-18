<script setup lang="ts">
import { ref, computed } from 'vue'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'

const props = defineProps<{
  modelValue: string[]
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const inputValue = ref('')

const tags = computed({
  get: () => props.modelValue || [],
  set: (value) => emit('update:modelValue', value)
})

const addTag = () => {
  const value = inputValue.value.trim()
  if (value && !tags.value.includes(value)) {
    tags.value = [...tags.value, value]
    inputValue.value = ''
  }
}

const removeTag = (index: number) => {
  tags.value = tags.value.filter((_, i) => i !== index)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault()
    addTag()
  }
  // Allow backspace to remove last tag when input is empty
  if (event.key === 'Backspace' && inputValue.value === '' && tags.value.length > 0) {
    removeTag(tags.value.length - 1)
  }
}

const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const pastedText = event.clipboardData?.getData('text') || ''
  const newTags = pastedText
    .split(',')
    .map(t => t.trim())
    .filter(t => t && !tags.value.includes(t))

  if (newTags.length > 0) {
    tags.value = [...tags.value, ...newTags]
  }
}
</script>

<template>
  <div class="flex flex-wrap gap-2 p-2 min-h-[42px] rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
    <Badge
      v-for="(tag, index) in tags"
      :key="index"
      variant="secondary"
      class="flex items-center gap-1 px-2 py-1"
    >
      <span>{{ tag }}</span>
      <button
        type="button"
        class="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
        @click="removeTag(index)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </Badge>
    <input
      v-model="inputValue"
      type="text"
      :placeholder="tags.length === 0 ? placeholder : ''"
      class="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-muted-foreground"
      @keydown="handleKeydown"
      @paste="handlePaste"
    />
  </div>
</template>
