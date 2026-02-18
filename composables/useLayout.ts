/**
 * Composable para gestionar el layout de la aplicación
 * Permite cambiar dinámicamente entre diferentes layouts
 * El layout se persiste en localStorage
 */

export type LayoutType = 'default' | 'empty' | 'sidebar-vertical' | 'horizontal-menu'

const LAYOUT_STORAGE_KEY = 'app-layout'
const DEFAULT_LAYOUT: LayoutType = 'sidebar-vertical'

// Función helper para obtener el layout desde localStorage (SSR-safe)
const getStoredLayout = (): LayoutType => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(LAYOUT_STORAGE_KEY) as LayoutType | null
    return stored || DEFAULT_LAYOUT
  }
  return DEFAULT_LAYOUT
}

// Estado global del layout
const currentLayout = ref<LayoutType>(getStoredLayout())

export const useLayout = () => {
  /**
   * Cambiar el layout actual y guardarlo en localStorage
   */
  const setLayout = (layout: LayoutType) => {
    currentLayout.value = layout
    if (typeof window !== 'undefined') {
      localStorage.setItem(LAYOUT_STORAGE_KEY, layout)
    }
  }

  /**
   * Obtener el layout actual
   */
  const getLayout = () => currentLayout.value

  /**
   * Layouts disponibles para selección del usuario
   * Nota: 'empty' no está incluido porque solo se usa para páginas específicas (login, error, etc.)
   */
  const availableLayouts: Array<{ value: LayoutType; label: string; description: string }> = [
    {
      value: 'sidebar-vertical',
      label: 'Sidebar Vertical',
      description: 'Menú vertical colapsable a la izquierda'
    },
    {
      value: 'horizontal-menu',
      label: 'Menú Horizontal',
      description: 'Menú horizontal en la parte superior'
    },
    {
      value: 'default',
      label: 'Default',
      description: 'Layout simple con sidebar básico'
    }
  ]

  return {
    currentLayout: readonly(currentLayout),
    setLayout,
    getLayout,
    availableLayouts
  }
}
