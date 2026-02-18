import type { z } from 'zod'

/**
 * Tipos de campos soportados por el formulario dinámico
 */
export type FieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'checkboxGroup' // Para selección múltiple con checkboxes
  | 'switch'
  | 'date'

/**
 * Opción para campos select
 */
export interface SelectOption {
  label: string
  value: string | number
}

/**
 * Configuración de un campo del formulario
 */
export interface FormFieldConfig {
  /** Nombre del campo (debe coincidir con la clave del schema de validación) */
  name: string
  /** Etiqueta visible del campo */
  label: string
  /** Tipo de campo */
  type: FieldType
  /** Placeholder del campo */
  placeholder?: string
  /** Descripción adicional */
  description?: string
  /** Valor por defecto */
  defaultValue?: any
  /** Si el campo está deshabilitado */
  disabled?: boolean
  /** Opciones para campos select */
  options?: SelectOption[]
  /** Atributos HTML adicionales */
  attrs?: Record<string, any>
  /** Clase CSS personalizada */
  class?: string
  /** Si se debe ocultar el campo */
  hidden?: boolean
}

/**
 * Configuración del formulario completo
 */
export interface DynamicFormConfig {
  /** Campos del formulario */
  fields: FormFieldConfig[]
  /** Schema de validación Zod (puede ser ZodObject o ZodEffects) */
  validationSchema: z.ZodObject<any> | z.ZodEffects<any>
  /** Valores iniciales del formulario */
  initialValues?: Record<string, any>
  /** Texto del botón de submit */
  submitText?: string
  /** Texto del botón de cancelar */
  cancelText?: string
  /** Si se muestra el botón de cancelar */
  showCancel?: boolean
  /** Si el formulario está en modo de carga */
  loading?: boolean
  /** Layout de los campos (columnas) */
  columns?: 1 | 2 | 3 | 4
  /** Si los campos deben tener fondo blanco */
  whiteFieldBackground?: boolean
}

/**
 * Eventos del formulario
 */
export interface DynamicFormEmits {
  /** Emitido cuando se envía el formulario con datos válidos */
  submit: [values: Record<string, any>]
  /** Emitido cuando se cancela el formulario */
  cancel: []
  /** Emitido cuando cambian los valores del formulario */
  'update:modelValue': [values: Record<string, any>]
}
