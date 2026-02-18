/**
 * Composable para comunicar metadata de entidades desde paginas [id] al layout
 * para mostrar systemCode en breadcrumbs en vez de UUIDs crudos.
 *
 * Usa useState() (global, SSR-safe) para que las paginas hijas
 * comuniquen datos al layout padre.
 */

export interface BreadcrumbEntityMeta {
  systemCode: string
  uuid: string
  label?: string
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function useBreadcrumbMeta() {
  const metaMap = useState<Record<string, BreadcrumbEntityMeta>>(
    'breadcrumb-meta',
    () => ({}),
  )

  /**
   * Registra metadata para un UUID (la pagina llama esto despues del fetch)
   */
  const setMeta = (uuid: string, meta: BreadcrumbEntityMeta) => {
    metaMap.value = { ...metaMap.value, [uuid]: meta }
  }

  /**
   * Obtiene metadata registrada para un UUID
   */
  const getMetaForUuid = (uuid: string): BreadcrumbEntityMeta | undefined => {
    return metaMap.value[uuid]
  }

  /**
   * Limpia toda la metadata (al desmontar pagina)
   */
  const clearMeta = () => {
    metaMap.value = {}
  }

  /**
   * Detecta si un string es un UUID
   */
  const isUuid = (str: string): boolean => {
    return UUID_REGEX.test(str)
  }

  /**
   * Trunca un UUID para mostrar una version corta
   */
  const truncateUuid = (uuid: string): string => {
    return `${uuid.substring(0, 8)}...`
  }

  return {
    metaMap,
    setMeta,
    getMetaForUuid,
    clearMeta,
    isUuid,
    truncateUuid,
  }
}
