<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { computed } from 'vue'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Checkbox } from '~/components/ui/checkbox'
import { Switch } from '~/components/ui/switch'
import { Button } from '~/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import type {
  DynamicFormConfig,
  DynamicFormEmits,
  FormFieldConfig,
} from './types'

// Props
const props = withDefaults(defineProps<DynamicFormConfig>(), {
  submitText: 'Guardar',
  cancelText: 'Cancelar',
  showCancel: false,
  loading: false,
  columns: 1,
  whiteFieldBackground: false,
})

// Emits
const emit = defineEmits<DynamicFormEmits>()

// Clase de fondo para los campos
const fieldBackgroundClass = computed(() => {
  return props.whiteFieldBackground ? 'bg-white' : ''
})

// Configurar vee-validate con el schema de Zod
const validationSchema = toTypedSchema(props.validationSchema)

// Crear valores iniciales del formulario
const getInitialValues = () => {
  const values: Record<string, any> = {}

  props.fields.forEach((field) => {
    if (props.initialValues && field.name in props.initialValues) {
      let value = props.initialValues[field.name]

      // Para checkboxGroup, asegurar que sea un array
      if (field.type === 'checkboxGroup') {
        if (Array.isArray(value)) {
          values[field.name] = value
        } else if (typeof value === 'string' && value) {
          // Si viene como string separado por comas, convertir a array
          values[field.name] = value.split(',').filter(Boolean)
        } else {
          values[field.name] = []
        }
      } else {
        values[field.name] = value
      }
    } else if (field.defaultValue !== undefined) {
      values[field.name] = field.defaultValue
    } else {
      // Valores por defecto según el tipo de campo
      switch (field.type) {
        case 'checkbox':
        case 'switch':
          values[field.name] = false
          break
        case 'checkboxGroup':
          values[field.name] = []
          break
        case 'number':
          values[field.name] = 0
          break
        default:
          values[field.name] = ''
      }
    }
  })

  return values
}

// Inicializar el formulario
const { handleSubmit, values, setFieldValue } = useForm({
  validationSchema,
  initialValues: getInitialValues(),
})

// Manejar submit del formulario
const onSubmit = handleSubmit((formValues) => {
  emit('submit', formValues)
})

// Manejar cancelación
const onCancel = () => {
  emit('cancel')
}

// Obtener clases de grid según el número de columnas
const gridClass = computed(() => {
  const classes = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }
  return classes[props.columns] || classes[1]
})

// Campos visibles
const visibleFields = computed(() => props.fields.filter((field) => !field.hidden))

// Emitir cambios de valores
watch(values, (newValues) => {
  emit('update:modelValue', newValues)
}, { deep: true })
</script>

<template>
  <form @submit="onSubmit" class="space-y-6">
    <div class="grid gap-4" :class="gridClass">
      <FormField
        v-for="field in visibleFields"
        :key="field.name"
        v-slot="{ componentField }"
        :name="field.name"
      >
        <FormItem>
          <FormLabel>{{ field.label }}</FormLabel>
          <FormControl>
            <!-- Text Input -->
            <Input
              v-if="field.type === 'text' || field.type === 'email' || field.type === 'password'"
              :type="field.type"
              :placeholder="field.placeholder"
              :disabled="field.disabled || loading"
              v-bind="{ ...componentField, ...field.attrs }"
              :class="[field.class, fieldBackgroundClass]"
            />

            <!-- Number Input -->
            <Input
              v-else-if="field.type === 'number'"
              type="number"
              :placeholder="field.placeholder"
              :disabled="field.disabled || loading"
              v-bind="{ ...componentField, ...field.attrs }"
              :class="[field.class, fieldBackgroundClass]"
            />

            <!-- Date Input -->
            <Input
              v-else-if="field.type === 'date'"
              type="date"
              :placeholder="field.placeholder"
              :disabled="field.disabled || loading"
              v-bind="{ ...componentField, ...field.attrs }"
              :class="[field.class, fieldBackgroundClass]"
            />

            <!-- Textarea -->
            <Textarea
              v-else-if="field.type === 'textarea'"
              :placeholder="field.placeholder"
              :disabled="field.disabled || loading"
              v-bind="{ ...componentField, ...field.attrs }"
              :class="[field.class, fieldBackgroundClass]"
            />

            <!-- Select -->
            <Select
              v-else-if="field.type === 'select'"
              :disabled="field.disabled || loading"
              v-bind="componentField"
            >
              <SelectTrigger :class="[field.class, fieldBackgroundClass]">
                <SelectValue :placeholder="field.placeholder || 'Seleccionar...'" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="option in field.options"
                  :key="option.value"
                  :value="String(option.value)"
                >
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>

            <!-- Checkbox -->
            <div v-else-if="field.type === 'checkbox'" class="flex items-center space-x-2">
              <Checkbox
                :id="field.name"
                :disabled="field.disabled || loading"
                :checked="componentField.modelValue"
                @update:checked="componentField['onUpdate:modelValue']"
                :class="field.class"
              />
              <label
                :for="field.name"
                class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {{ field.placeholder || field.label }}
              </label>
            </div>

            <!-- Switch -->
            <div v-else-if="field.type === 'switch'" class="flex items-center space-x-2">
              <Switch
                :id="field.name"
                :disabled="field.disabled || loading"
                :modelValue="!!componentField.modelValue"
                @update:modelValue="componentField['onUpdate:modelValue']"
                :class="field.class"
              />
              <label
                :for="field.name"
                class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {{ field.placeholder || field.label }}
              </label>
            </div>

            <!-- Checkbox Group (selección múltiple) -->
            <div v-else-if="field.type === 'checkboxGroup'" class="space-y-2">
              <div
                v-for="option in field.options"
                :key="option.value"
                class="flex items-center space-x-2"
              >
                <input
                  type="checkbox"
                  :id="`${field.name}-${option.value}`"
                  :disabled="field.disabled || loading"
                  :checked="Array.isArray(componentField.modelValue) && componentField.modelValue.includes(option.value)"
                  :value="option.value"
                  class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                  @change="(event: Event) => {
                    const target = event.target as HTMLInputElement
                    const checked = target.checked
                    const val = componentField.modelValue
                    const currentValues = Array.isArray(val) ? [...val] : []
                    if (checked) {
                      if (!currentValues.includes(option.value)) {
                        currentValues.push(option.value)
                      }
                    } else {
                      const index = currentValues.indexOf(option.value)
                      if (index > -1) {
                        currentValues.splice(index, 1)
                      }
                    }
                    const updateFn = componentField['onUpdate:modelValue']
                    if (updateFn) {
                      updateFn(currentValues)
                    }
                  }"
                />
                <label
                  :for="`${field.name}-${option.value}`"
                  class="text-sm font-medium leading-none cursor-pointer"
                >
                  {{ option.label }}
                </label>
              </div>
            </div>
          </FormControl>

          <FormDescription v-if="field.description">
            {{ field.description }}
          </FormDescription>
          <FormMessage />
        </FormItem>
      </FormField>
    </div>

    <!-- Botones de acción -->
    <div class="flex justify-end gap-2">
      <Button
        v-if="showCancel"
        type="button"
        variant="outline"
        @click="onCancel"
        :disabled="loading"
      >
        {{ cancelText }}
      </Button>
      <Button type="submit" :disabled="loading">
        {{ loading ? 'Guardando...' : submitText }}
      </Button>
    </div>
  </form>
</template>
