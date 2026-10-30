import { useLayout, type LayoutType } from '~/composables/useLayout'

/**
 * Pages that declare `layout` in definePageMeta keep it (login, register, etc.).
 * Pages without one use the layout selected by the user.
 */
export function resolvePageLayout(pageLayout: string | undefined, userLayout: LayoutType): string {
  return pageLayout || userLayout
}

/**
 * Middleware global de layout
 * Resuelve el layout en route.meta para que <NuxtLayout> lo aplique de forma nativa,
 * sincronizado con <NuxtPage>. Pasar `name` a <NuxtLayout> rompe esa sincronizacion
 * y en produccion deja el layout anterior montado tras una redireccion (ej: a /login).
 */
export default defineNuxtRouteMiddleware((to) => {
  const { currentLayout } = useLayout()
  to.meta.layout = resolvePageLayout(to.meta.layout as string | undefined, currentLayout.value) as typeof to.meta.layout
})
