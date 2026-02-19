<script setup lang="ts">
import { watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'

const props = withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
  rows?: number
  disabled?: boolean
}>(), {
  modelValue: '',
  placeholder: 'Escribe aqui...',
  rows: 6,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editor = useEditor({
  content: props.modelValue,
  editable: !props.disabled,
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3] },
    }),
    Underline,
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none',
    },
  },
  onUpdate: ({ editor }) => {
    const html = editor.getHTML()
    emit('update:modelValue', html === '<p></p>' ? '' : html)
  },
})

watch(() => props.modelValue, (val) => {
  if (!editor.value) return
  const current = editor.value.getHTML()
  if (current !== val) {
    editor.value.commands.setContent(val || '', false)
  }
})

watch(() => props.disabled, (val) => {
  editor.value?.setEditable(!val)
})

const minHeight = computed(() => `${props.rows * 1.5}rem`)

// Toolbar actions
const isActive = (type: string, attrs?: Record<string, any>) => {
  return editor.value?.isActive(type, attrs) ?? false
}
</script>

<template>
  <div class="rounded-md border border-input overflow-hidden" :class="{ 'opacity-50 pointer-events-none': disabled }">
    <!-- Toolbar -->
    <div v-if="editor" class="flex items-center gap-0.5 border-b border-input bg-muted/30 px-1 py-1 flex-wrap">
      <button
        type="button"
        class="h-7 w-7 inline-flex items-center justify-center rounded text-sm hover:bg-muted transition-colors"
        :class="{ 'bg-muted text-foreground': isActive('bold') }"
        @click="editor!.chain().focus().toggleBold().run()"
        title="Negrita"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"/></svg>
      </button>
      <button
        type="button"
        class="h-7 w-7 inline-flex items-center justify-center rounded text-sm hover:bg-muted transition-colors"
        :class="{ 'bg-muted text-foreground': isActive('italic') }"
        @click="editor!.chain().focus().toggleItalic().run()"
        title="Cursiva"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" x2="10" y1="4" y2="4"/><line x1="14" x2="5" y1="20" y2="20"/><line x1="15" x2="9" y1="4" y2="20"/></svg>
      </button>
      <button
        type="button"
        class="h-7 w-7 inline-flex items-center justify-center rounded text-sm hover:bg-muted transition-colors"
        :class="{ 'bg-muted text-foreground': isActive('underline') }"
        @click="editor!.chain().focus().toggleUnderline().run()"
        title="Subrayado"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" x2="20" y1="20" y2="20"/></svg>
      </button>
      <button
        type="button"
        class="h-7 w-7 inline-flex items-center justify-center rounded text-sm hover:bg-muted transition-colors"
        :class="{ 'bg-muted text-foreground': isActive('strike') }"
        @click="editor!.chain().focus().toggleStrike().run()"
        title="Tachado"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" x2="20" y1="12" y2="12"/></svg>
      </button>

      <div class="w-px h-5 bg-border mx-0.5" />

      <button
        type="button"
        class="h-7 w-7 inline-flex items-center justify-center rounded text-sm hover:bg-muted transition-colors"
        :class="{ 'bg-muted text-foreground': isActive('heading', { level: 2 }) }"
        @click="editor!.chain().focus().toggleHeading({ level: 2 }).run()"
        title="Titulo"
      >
        <span class="font-bold text-xs">H2</span>
      </button>
      <button
        type="button"
        class="h-7 w-7 inline-flex items-center justify-center rounded text-sm hover:bg-muted transition-colors"
        :class="{ 'bg-muted text-foreground': isActive('heading', { level: 3 }) }"
        @click="editor!.chain().focus().toggleHeading({ level: 3 }).run()"
        title="Subtitulo"
      >
        <span class="font-bold text-xs">H3</span>
      </button>

      <div class="w-px h-5 bg-border mx-0.5" />

      <button
        type="button"
        class="h-7 w-7 inline-flex items-center justify-center rounded text-sm hover:bg-muted transition-colors"
        :class="{ 'bg-muted text-foreground': isActive('bulletList') }"
        @click="editor!.chain().focus().toggleBulletList().run()"
        title="Lista"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
      </button>
      <button
        type="button"
        class="h-7 w-7 inline-flex items-center justify-center rounded text-sm hover:bg-muted transition-colors"
        :class="{ 'bg-muted text-foreground': isActive('orderedList') }"
        @click="editor!.chain().focus().toggleOrderedList().run()"
        title="Lista numerada"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" x2="21" y1="6" y2="6"/><line x1="10" x2="21" y1="12" y2="12"/><line x1="10" x2="21" y1="18" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
      </button>

      <div class="w-px h-5 bg-border mx-0.5" />

      <button
        type="button"
        class="h-7 w-7 inline-flex items-center justify-center rounded text-sm hover:bg-muted transition-colors"
        :class="{ 'bg-muted text-foreground': isActive('blockquote') }"
        @click="editor!.chain().focus().toggleBlockquote().run()"
        title="Cita"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 6H3"/><path d="M21 12H8"/><path d="M21 18H8"/><path d="M3 12v6"/></svg>
      </button>
      <button
        type="button"
        class="h-7 w-7 inline-flex items-center justify-center rounded text-sm hover:bg-muted transition-colors"
        :class="{ 'bg-muted text-foreground': isActive('codeBlock') }"
        @click="editor!.chain().focus().toggleCodeBlock().run()"
        title="Bloque de codigo"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
      </button>

      <div class="w-px h-5 bg-border mx-0.5" />

      <button
        type="button"
        class="h-7 w-7 inline-flex items-center justify-center rounded text-sm hover:bg-muted transition-colors"
        @click="editor!.chain().focus().setHorizontalRule().run()"
        title="Linea horizontal"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" x2="22" y1="12" y2="12"/></svg>
      </button>
    </div>

    <!-- Editor -->
    <EditorContent :editor="editor" class="px-3 py-2 overflow-y-auto" :style="{ minHeight }" />
  </div>
</template>

<style>
.tiptap p.is-editor-empty:first-child::before {
  color: hsl(var(--muted-foreground));
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.tiptap {
  outline: none;
}

.tiptap h2 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0.75rem 0 0.25rem;
}

.tiptap h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0.5rem 0 0.25rem;
}

.tiptap ul,
.tiptap ol {
  padding-left: 1.5rem;
  margin: 0.25rem 0;
}

.tiptap ul {
  list-style: disc;
}

.tiptap ol {
  list-style: decimal;
}

.tiptap blockquote {
  border-left: 3px solid hsl(var(--border));
  padding-left: 0.75rem;
  margin: 0.5rem 0;
  color: hsl(var(--muted-foreground));
}

.tiptap pre {
  background: hsl(var(--muted));
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  margin: 0.5rem 0;
  font-family: monospace;
  font-size: 0.85rem;
  overflow-x: auto;
}

.tiptap code {
  background: hsl(var(--muted));
  border-radius: 0.25rem;
  padding: 0.1rem 0.3rem;
  font-size: 0.85rem;
}

.tiptap pre code {
  background: none;
  padding: 0;
}

.tiptap hr {
  border-color: hsl(var(--border));
  margin: 0.75rem 0;
}

.tiptap p {
  margin: 0.15rem 0;
}
</style>
