<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { z } from 'zod'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import type { CreateTranslationDto, TranslationLocale } from '~/modules/i18n/types'
import { useTranslations } from '~/modules/i18n/composables/useTranslations'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  ArrowLeftIcon,
  Loader2Icon,
  XIcon,
  LanguagesIcon,
} from 'lucide-vue-next'

definePageMeta({
  middleware: ['auth', 'module-access'],
})

const router = useRouter()
const route = useRoute()
const {
  createTranslation,
  updateTranslation,
  fetchTranslation,
  loading,
  error,
  clearError,
  currentTranslation,
} = useTranslations()

// Modo edicion
const editId = ref<string | null>(null)
const isEditMode = ref(false)
const initialLoading = ref(false)

// Locales disponibles
const locales = [
  { value: 'es', label: 'Espanol' },
  { value: 'en', label: 'Ingles' },
  { value: 'fr', label: 'Frances' },
  { value: 'pt', label: 'Portugues' },
]

// Schema de validacion con Zod
const validationSchema = toTypedSchema(
  z.object({
    key: z
      .string()
      .min(1, 'El key es requerido')
      .min(2, 'El key debe tener al menos 2 caracteres'),
    value: z
      .string()
      .min(1, 'El valor es requerido'),
    locale: z.enum(['es', 'en', 'fr', 'pt'], {
      required_error: 'El idioma es requerido',
    }),
    namespace: z
      .string()
      .min(1, 'El namespace es requerido')
      .min(2, 'El namespace debe tener al menos 2 caracteres'),
  })
)

const { handleSubmit, values, errors, setFieldValue, resetForm } = useForm({
  validationSchema,
  initialValues: {
    key: '',
    value: '',
    locale: undefined as any,
    namespace: '',
  },
})

// Cargar datos si es edicion
onMounted(async () => {
  const editParam = route.query.edit as string
  if (editParam) {
    editId.value = editParam
    isEditMode.value = true
    initialLoading.value = true

    try {
      const translation = await fetchTranslation(editParam)
      if (translation) {
        setFieldValue('key', translation.key)
        setFieldValue('value', translation.value)
        setFieldValue('locale', translation.locale)
        setFieldValue('namespace', translation.namespace)
      }
    } catch (e) {
      console.error('Error loading translation for edit:', e)
    } finally {
      initialLoading.value = false
    }
  }
})

// Manejar envio del formulario
const onSubmit = handleSubmit(async (formValues) => {
  clearError()

  try {
    const translationData: CreateTranslationDto = {
      key: formValues.key,
      value: formValues.value,
      locale: formValues.locale as TranslationLocale,
      namespace: formValues.namespace,
    }

    if (isEditMode.value && editId.value) {
      const updated = await updateTranslation(editId.value, translationData)
      if (updated) {
        router.push('/i18n')
      }
    } else {
      const created = await createTranslation(translationData)
      if (created) {
        router.push('/i18n')
      }
    }
  } catch (e) {
    console.error('Error saving translation:', e)
  }
})

// Cancelar y volver a la lista
const goBack = () => {
  router.push('/i18n')
}
</script>

<template>
  <div class="max-w-4xl space-y-6">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <div>
          <h1 class="text-lg font-semibold tracking-tight">
            {{ isEditMode ? 'Editar Traduccion' : 'Crear Traduccion' }}
          </h1>
          <p class="text-muted-foreground text-sm mt-1">
            {{ isEditMode ? 'Modifique los datos de la traduccion' : 'Complete el formulario para crear una nueva traduccion' }}
          </p>
        </div>
        <Button variant="ghost" size="sm" @click="goBack">
          <ArrowLeftIcon class="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>
    </div>

    <!-- Loading inicial (modo edicion) -->
    <div v-if="initialLoading" class="flex items-center justify-center py-12">
      <Loader2Icon class="h-8 w-8 animate-spin text-muted-foreground" />
    </div>

    <template v-else>
      <!-- Error -->
      <div v-if="error" class="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
        <div class="flex items-center justify-between">
          <p>{{ error }}</p>
          <Button variant="ghost" size="sm" @click="clearError">
            <XIcon class="h-4 w-4" />
          </Button>
        </div>
      </div>

      <!-- Formulario -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <LanguagesIcon class="h-5 w-5" />
            {{ isEditMode ? 'Datos de la Traduccion' : 'Nueva Traduccion' }}
          </CardTitle>
          <CardDescription>
            Las traducciones permiten gestionar el contenido multiidioma del sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="onSubmit" class="space-y-6">
            <!-- Key -->
            <div class="space-y-2">
              <Label for="key">Key *</Label>
              <Input
                id="key"
                :model-value="values.key"
                @update:model-value="(val: string | number) => setFieldValue('key', String(val))"
                placeholder="common.welcome_message"
                class="font-mono"
                :class="{ 'border-destructive': errors.key }"
              />
              <p class="text-xs text-muted-foreground">
                Identificador unico de la traduccion (ej: common.welcome_message, auth.login_button)
              </p>
              <p v-if="errors.key" class="text-xs text-destructive">{{ errors.key }}</p>
            </div>

            <!-- Locale y Namespace en grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Locale -->
              <div class="space-y-2">
                <Label>Idioma *</Label>
                <Select
                  :model-value="values.locale"
                  @update:model-value="setFieldValue('locale', $event)"
                >
                  <SelectTrigger :class="{ 'border-destructive': errors.locale }">
                    <SelectValue placeholder="Seleccionar idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="locale in locales" :key="locale.value" :value="locale.value">
                      {{ locale.label }} ({{ locale.value }})
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p v-if="errors.locale" class="text-xs text-destructive">{{ errors.locale }}</p>
              </div>

              <!-- Namespace -->
              <div class="space-y-2">
                <Label for="namespace">Namespace *</Label>
                <Input
                  id="namespace"
                  :model-value="values.namespace"
                  @update:model-value="(val: string | number) => setFieldValue('namespace', String(val))"
                  placeholder="common"
                  :class="{ 'border-destructive': errors.namespace }"
                />
                <p class="text-xs text-muted-foreground">
                  Grupo de traducciones (ej: common, auth, errors, products)
                </p>
                <p v-if="errors.namespace" class="text-xs text-destructive">{{ errors.namespace }}</p>
              </div>
            </div>

            <!-- Value -->
            <div class="space-y-2">
              <Label for="value">Valor *</Label>
              <Textarea
                id="value"
                :model-value="values.value"
                @update:model-value="(val: string | number) => setFieldValue('value', String(val))"
                placeholder="Texto de la traduccion..."
                rows="4"
                :class="{ 'border-destructive': errors.value }"
              />
              <p class="text-xs text-muted-foreground">
                Texto traducido en el idioma seleccionado
              </p>
              <p v-if="errors.value" class="text-xs text-destructive">{{ errors.value }}</p>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" @click="goBack">
                Cancelar
              </Button>
              <Button type="submit" :disabled="loading">
                <Loader2Icon v-if="loading" class="h-4 w-4 mr-2 animate-spin" />
                {{ loading ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Crear Traduccion') }}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
