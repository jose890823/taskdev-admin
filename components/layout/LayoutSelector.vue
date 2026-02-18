<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon">
        <component :is="getCurrentIcon()" class="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Seleccionar Layout</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuRadioGroup :model-value="currentLayout">
        <DropdownMenuRadioItem
          v-for="layout in availableLayouts"
          :key="layout.value"
          :value="layout.value"
          @click="selectLayout(layout.value)"
        >
          <component :is="getLayoutIcon(layout.value)" class="size-4 mr-2" />
          {{ layout.label }}
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import {
  LayoutDashboardIcon,
  LayoutGridIcon,
  RectangleHorizontalIcon,
} from 'lucide-vue-next'
import { useLayout, type LayoutType } from '~/composables/useLayout'

const { currentLayout, setLayout, availableLayouts } = useLayout()

// Mapeo de iconos para cada layout
const layoutIcons: Record<LayoutType, any> = {
  'empty': LayoutGridIcon,
  'sidebar-vertical': LayoutDashboardIcon,
  'horizontal-menu': RectangleHorizontalIcon,
  'default': LayoutGridIcon,
}

const getLayoutIcon = (layout: LayoutType) => {
  return layoutIcons[layout] || LayoutGridIcon
}

const getCurrentIcon = () => {
  return getLayoutIcon(currentLayout.value)
}

const selectLayout = (layout: LayoutType) => {
  if (layout === currentLayout.value) return

  setLayout(layout)

  // Recargar la página para aplicar el nuevo layout
  setTimeout(() => {
    window.location.reload()
  }, 200)
}
</script>
