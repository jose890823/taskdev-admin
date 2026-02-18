export type EditableCellType = 'text' | 'number' | 'select' | 'date' | 'toggle' | 'computed' | 'readonly' | 'color'

export interface SelectOption {
  label: string
  value: string | number
}

export interface EditableColumnDef<T = any> {
  key: string
  label: string
  type?: EditableCellType
  editable?: boolean
  required?: boolean
  options?: SelectOption[] | (() => SelectOption[])
  computeFn?: (row: T) => any
  validate?: (value: any, row: T) => string | null
  placeholder?: string
  width?: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  format?: (value: any) => string
  min?: number
  max?: number
  step?: number
}

export interface EditableDataTableProps<T = any> {
  data: T[]
  columns: EditableColumnDef<T>[]
  loading?: boolean
  rowKey?: string
  newRowDefaults?: Partial<T>
  searchable?: boolean
  title?: string
  createLabel?: string
}

export interface CellUpdatePayload<T = any> {
  row: T
  key: string
  value: any
}
