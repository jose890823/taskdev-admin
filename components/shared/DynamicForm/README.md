# DynamicForm Component

Componente de formulario dinámico reutilizable construido con **vee-validate**, **Zod** y **shadcn-vue**.

## Características

- Validación con Zod schemas
- Múltiples tipos de campos (text, email, password, number, textarea, select, checkbox, switch, date)
- Layout responsive con 1-4 columnas
- Manejo automático de estados de carga
- Valores iniciales configurables
- Validación en tiempo real
- TypeScript completo
- Totalmente personalizable

## Instalación

Las dependencias ya están instaladas en el proyecto:
- `vee-validate`
- `@vee-validate/zod`
- `zod`
- Componentes shadcn-vue (form, input, textarea, select, checkbox, switch, button)

## Uso Básico

```vue
<script setup lang="ts">
import { z } from 'zod'
import { DynamicForm } from '~/components/shared/DynamicForm'
import type { FormFieldConfig } from '~/components/shared/DynamicForm'

// Definir schema de validación con Zod
const schema = z.object({
  firstName: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  age: z.number().min(18),
})

// Definir campos del formulario
const fields: FormFieldConfig[] = [
  {
    name: 'firstName',
    label: 'Nombre',
    type: 'text',
    placeholder: 'Ingresa tu nombre',
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'tu@email.com',
  },
  {
    name: 'age',
    label: 'Edad',
    type: 'number',
    defaultValue: 18,
  },
]

// Manejar submit
const handleSubmit = (values: any) => {
  console.log('Formulario enviado:', values)
}
</script>

<template>
  <DynamicForm
    :fields="fields"
    :validation-schema="schema"
    @submit="handleSubmit"
  />
</template>
```

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `fields` | `FormFieldConfig[]` | requerido | Array de configuración de campos |
| `validationSchema` | `z.ZodObject` | requerido | Schema de validación Zod |
| `initialValues` | `Record<string, any>` | `{}` | Valores iniciales del formulario |
| `submitText` | `string` | `"Guardar"` | Texto del botón submit |
| `cancelText` | `string` | `"Cancelar"` | Texto del botón cancelar |
| `showCancel` | `boolean` | `false` | Mostrar botón de cancelar |
| `loading` | `boolean` | `false` | Estado de carga |
| `columns` | `1 \| 2 \| 3 \| 4` | `1` | Número de columnas en el layout |

## Configuración de Campos (FormFieldConfig)

```typescript
interface FormFieldConfig {
  name: string                    // Nombre del campo (debe coincidir con el schema)
  label: string                   // Etiqueta visible
  type: FieldType                 // Tipo de campo
  placeholder?: string            // Placeholder
  description?: string            // Descripción adicional debajo del campo
  defaultValue?: any              // Valor por defecto
  disabled?: boolean              // Campo deshabilitado
  options?: SelectOption[]        // Opciones para campos select
  attrs?: Record<string, any>     // Atributos HTML adicionales
  class?: string                  // Clase CSS personalizada
  hidden?: boolean                // Ocultar campo
}
```

## Tipos de Campos Soportados

### Text / Email / Password
```typescript
{
  name: 'email',
  label: 'Email',
  type: 'email',
  placeholder: 'tu@email.com',
}
```

### Number
```typescript
{
  name: 'age',
  label: 'Edad',
  type: 'number',
  defaultValue: 18,
  attrs: { min: 18, max: 100 },
}
```

### Date
```typescript
{
  name: 'birthDate',
  label: 'Fecha de Nacimiento',
  type: 'date',
}
```

### Textarea
```typescript
{
  name: 'bio',
  label: 'Biografía',
  type: 'textarea',
  placeholder: 'Cuéntanos sobre ti...',
  attrs: { rows: 4 },
}
```

### Select
```typescript
{
  name: 'role',
  label: 'Rol',
  type: 'select',
  placeholder: 'Selecciona un rol',
  options: [
    { label: 'Admin', value: 'admin' },
    { label: 'User', value: 'user' },
  ],
}
```

### Checkbox
```typescript
{
  name: 'acceptTerms',
  label: 'Términos',
  type: 'checkbox',
  placeholder: 'Acepto los términos y condiciones',
  defaultValue: false,
}
```

### Switch
```typescript
{
  name: 'isActive',
  label: 'Estado',
  type: 'switch',
  placeholder: 'Usuario activo',
  defaultValue: true,
}
```

## Eventos

### @submit
Emitido cuando el formulario se envía con datos válidos.

```vue
<DynamicForm @submit="handleSubmit" />
```

```typescript
const handleSubmit = (values: Record<string, any>) => {
  console.log(values)
}
```

### @cancel
Emitido cuando se presiona el botón de cancelar.

```vue
<DynamicForm :show-cancel="true" @cancel="handleCancel" />
```

### @update:modelValue
Emitido cada vez que cambian los valores del formulario (tiempo real).

```vue
<DynamicForm @update:model-value="handleUpdate" />
```

## Ejemplos Avanzados

### Formulario con 2 Columnas

```vue
<DynamicForm
  :fields="fields"
  :validation-schema="schema"
  :columns="2"
  @submit="handleSubmit"
/>
```

### Con Valores Iniciales

```vue
<script setup lang="ts">
const initialValues = {
  firstName: 'Juan',
  email: 'juan@example.com',
  age: 25,
}
</script>

<template>
  <DynamicForm
    :fields="fields"
    :validation-schema="schema"
    :initial-values="initialValues"
    @submit="handleSubmit"
  />
</template>
```

### Con Estado de Carga

```vue
<script setup lang="ts">
const loading = ref(false)

const handleSubmit = async (values: any) => {
  loading.value = true
  try {
    await api.saveUser(values)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <DynamicForm
    :fields="fields"
    :validation-schema="schema"
    :loading="loading"
    @submit="handleSubmit"
  />
</template>
```

### Con Botón de Cancelar

```vue
<DynamicForm
  :fields="fields"
  :validation-schema="schema"
  :show-cancel="true"
  submit-text="Guardar Usuario"
  cancel-text="Volver"
  @submit="handleSubmit"
  @cancel="handleCancel"
/>
```

## Validación con Zod

### Validaciones Comunes

```typescript
import { z } from 'zod'

const schema = z.object({
  // String con longitud mínima/máxima
  name: z.string().min(2).max(50),

  // Email
  email: z.string().email(),

  // Número con rango
  age: z.number().min(18).max(100),

  // Campo opcional
  bio: z.string().optional(),

  // Enum/Select
  role: z.enum(['admin', 'user', 'guest']),

  // Boolean
  acceptTerms: z.boolean(),

  // Fecha
  birthDate: z.string().refine((date) => !isNaN(Date.parse(date))),

  // Validación personalizada
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
})
```

### Validaciones Condicionales

```typescript
const schema = z.object({
  hasCompany: z.boolean(),
  companyName: z.string().optional(),
}).refine((data) => {
  // Si hasCompany es true, companyName es requerido
  if (data.hasCompany) {
    return data.companyName && data.companyName.length > 0
  }
  return true
}, {
  message: 'El nombre de la empresa es requerido',
  path: ['companyName'],
})
```

## Layout Responsive

El componente usa clases de Tailwind para layout responsive:

- **1 columna**: `grid-cols-1` (móvil y todas las pantallas)
- **2 columnas**: `grid-cols-1 md:grid-cols-2` (2 columnas en tablet+)
- **3 columnas**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` (3 columnas en desktop)
- **4 columnas**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` (4 columnas en pantallas grandes)

## Página de Demo

Visita **/demo/form** para ver un ejemplo completo con todos los tipos de campos y funcionalidades.

## Personalización

### Agregar Atributos HTML

```typescript
{
  name: 'age',
  label: 'Edad',
  type: 'number',
  attrs: {
    min: 0,
    max: 120,
    step: 1,
  },
}
```

### Clases CSS Personalizadas

```typescript
{
  name: 'email',
  label: 'Email',
  type: 'email',
  class: 'custom-input-class',
}
```

### Descripciones en Campos

```typescript
{
  name: 'email',
  label: 'Email',
  type: 'email',
  description: 'Usaremos este email para enviarte notificaciones',
}
```

## Tips y Buenas Prácticas

1. **Nombres consistentes**: Asegúrate de que el `name` del campo coincida exactamente con la clave en el schema de Zod.

2. **Valores por defecto**: Define `defaultValue` en los campos para evitar errores de validación en campos no requeridos.

3. **Mensajes de error claros**: Usa mensajes descriptivos en las validaciones de Zod.

4. **Loading state**: Siempre usa el prop `loading` durante operaciones async para mejorar la UX.

5. **Layout apropiado**: Usa 1 columna para formularios móviles, 2 para formularios estándar, 3-4 para formularios largos en desktop.
