/**
 * Tipos para el componente DataTable reutilizable
 */

export type SortDirection = 'asc' | 'desc' | null

export interface SortConfig {
  key: string
  direction: SortDirection
}

export interface PaginationConfig {
  page: number
  pageSize: number
  total: number
  pageSizeOptions?: number[]
}

export interface FilterConfig {
  searchTerm: string
  searchableColumns: string[]
}

export interface ColumnDef<T = any> {
  /** Clave única de la columna */
  key: string
  /** Título que se muestra en el header */
  label: string
  /** Si la columna es ordenable */
  sortable?: boolean
  /** Si la columna es buscable/filtrable */
  searchable?: boolean
  /** Ancho personalizado de la columna */
  width?: string
  /** Alineación del contenido */
  align?: 'left' | 'center' | 'right'
  /** Función personalizada para renderizar el valor de la celda */
  render?: (row: T, value: any) => any
  /** Función para formatear el valor antes de mostrarlo */
  format?: (value: any, row: T) => string
  /** Clase CSS personalizada para la columna */
  class?: string
  /** Si la columna está oculta */
  hidden?: boolean
}

export interface DataTableProps<T = any> {
  /** Datos a mostrar en la tabla */
  data: T[]
  /** Definición de columnas */
  columns: ColumnDef<T>[]
  /** Configuración de paginación */
  pagination?: PaginationConfig
  /** Si se muestra el input de búsqueda */
  searchable?: boolean
  /** Placeholder para el input de búsqueda */
  searchPlaceholder?: string
  /** Si está cargando datos */
  loading?: boolean
  /** Mensaje cuando no hay datos */
  emptyMessage?: string
  /** Función para obtener la clave única de cada fila */
  rowKey?: string | ((row: T) => string | number)
  /** Clase personalizada para filas */
  rowClass?: string | ((row: T) => string)
  /** Si se puede hacer click en las filas */
  rowClickable?: boolean
}

export interface DataTableEmits {
  /** Evento cuando cambia la página */
  'update:pagination': [config: PaginationConfig]
  /** Evento cuando cambia el ordenamiento */
  'update:sort': [config: SortConfig]
  /** Evento cuando cambia el término de búsqueda */
  'update:search': [term: string]
  /** Evento cuando se hace click en una fila */
  'row-click': [row: any]
  /** Evento cuando se solicita refrescar los datos */
  'refresh': []
}
