<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Seleccionar Layout</DialogTitle>
        <DialogDescription>
          Elige el diseño que prefieras para tu aplicación
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <div
          v-for="layout in availableLayouts"
          :key="layout.value"
          class="flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors hover:bg-accent"
          :class="{
            'border-primary bg-accent': currentLayout === layout.value
          }"
          @click="selectLayout(layout.value)"
        >
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-background">
            <component :is="getLayoutIcon(layout.value)" class="size-5" />
          </div>
          <div class="flex-1">
            <h4 class="font-semibold mb-1">{{ layout.label }}</h4>
            <p class="text-sm text-muted-foreground">{{ layout.description }}</p>
          </div>
          <div v-if="currentLayout === layout.value" class="flex items-center">
            <CheckIcon class="size-5 text-primary" />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="isOpen = false">
          Cerrar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import {
  LayoutDashboardIcon,
  LayoutGridIcon,
  RectangleHorizontalIcon,
  SquareIcon,
  CheckIcon
} from 'lucide-vue-next'
import { useLayout, type LayoutType } from '~/composables/useLayout'

const { currentLayout, setLayout, availableLayouts } = useLayout()
const isOpen = ref(false)

// Mapeo de iconos para cada layout
const layoutIcons: Record<LayoutType, any> = {
  'empty': SquareIcon,
  'sidebar-vertical': LayoutDashboardIcon,
  'horizontal-menu': RectangleHorizontalIcon,
  'default': LayoutGridIcon,
}

const getLayoutIcon = (layout: LayoutType) => {
  return layoutIcons[layout] || LayoutGridIcon
}

const selectLayout = (layout: LayoutType) => {
  setLayout(layout)

  // Cerrar el diálogo
  isOpen.value = false

  // Recargar la página después de un momento para aplicar el nuevo layout
  // Esto es necesario porque Nuxt necesita reinicializar el componente de layout
  setTimeout(() => {
    window.location.reload()
  }, 200)
}

// Escuchar evento custom para abrir el dialog
onMounted(() => {
  const handleOpenLayoutSelector = () => {
    isOpen.value = true
  }

  window.addEventListener('open-layout-selector', handleOpenLayoutSelector)

  onUnmounted(() => {
    window.removeEventListener('open-layout-selector', handleOpenLayoutSelector)
  })
})
</script>
