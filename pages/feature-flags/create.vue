<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { z } from 'zod'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import type { CreateFeatureFlagDto } from '~/modules/feature-flags/types'
import { useFeatureFlags } from '~/modules/feature-flags/composables/useFeatureFlags'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Switch } from '~/components/ui/switch'
import {
  ArrowLeftIcon,
  Loader2Icon,
  XIcon,
  ToggleLeftIcon,
} from 'lucide-vue-next'

definePageMeta({
  middleware: ['auth', 'module-access'],
})

const router = useRouter()
const route = useRoute()
const {
  createFlag,
  updateFlag,
  fetchFlag,
  loading,
  error,
  clearError,
  currentFlag,
} = useFeatureFlags()

// Modo edicion
const editId = ref<string | null>(null)
const isEditMode = ref(false)
const initialLoading = ref(false)

// Estado del formulario
const isEnabled = ref(false)

// Schema de validacion con Zod
const validationSchema = toTypedSchema(
  z.object({
    key: z
      .string()
      .min(1, 'El key es requerido')
      .regex(
        /^[a-z0-9]+(-[a-z0-9]+)*$/,
        'El key debe estar en formato kebab-case (ej: mi-feature-flag)'
      ),
    name: z
      .string()
      .min(1, 'El nombre es requerido')
      .min(3, 'El nombre debe tener al menos 3 caracteres'),
    description: z.string().optional(),
  })
)

const { handleSubmit, values, errors, setFieldValue, resetForm } = useForm({
  validationSchema,
  initialValues: {
    key: '',
    name: '',
    description: '',
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
      const flag = await fetchFlag(editParam)
      if (flag) {
        setFieldValue('key', flag.key)
        setFieldValue('name', flag.name)
        setFieldValue('description', flag.description || '')
        isEnabled.value = flag.isEnabled
      }
    } catch (e) {
      console.error('Error loading flag for edit:', e)
    } finally {
      initialLoading.value = false
    }
  }
})

// Manejar envio del formulario
const onSubmit = handleSubmit(async (formValues) => {
  clearError()

  try {
    const flagData: CreateFeatureFlagDto = {
      key: formValues.key,
      name: formValues.name,
      description: formValues.description || undefined,
      isEnabled: isEnabled.value,
    }

    if (isEditMode.value && editId.value) {
      const updated = await updateFlag(editId.value, flagData)
      if (updated) {
        router.push('/feature-flags')
      }
    } else {
      const created = await createFlag(flagData)
      if (created) {
        router.push('/feature-flags')
      }
    }
  } catch (e) {
    console.error('Error saving feature flag:', e)
  }
})

// Cancelar y volver a la lista
const goBack = () => {
  router.push('/feature-flags')
}
</script>

<template>
  <div class="max-w-4xl space-y-6">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <div>
          <h1 class="text-lg font-semibold tracking-tight">
            {{ isEditMode ? 'Editar Feature Flag' : 'Crear Feature Flag' }}
          </h1>
          <p class="text-muted-foreground text-sm mt-1">
            {{ isEditMode ? 'Modifique los datos del feature flag' : 'Complete el formulario para crear un nuevo feature flag' }}
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
            <ToggleLeftIcon class="h-5 w-5" />
            {{ isEditMode ? 'Datos del Flag' : 'Nuevo Feature Flag' }}
          </CardTitle>
          <CardDescription>
            Los feature flags permiten activar o desactivar funcionalidades del sistema sin necesidad de desplegar nuevo codigo.
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
                placeholder="mi-feature-flag"
                :disabled="isEditMode"
              />
              <p class="text-xs text-muted-foreground">
                Identificador unico en formato kebab-case (ej: dark-mode, new-checkout)
              </p>
              <p v-if="errors.key" class="text-xs text-destructive">{{ errors.key }}</p>
            </div>

            <!-- Name -->
            <div class="space-y-2">
              <Label for="name">Nombre *</Label>
              <Input
                id="name"
                :model-value="values.name"
                @update:model-value="(val: string | number) => setFieldValue('name', String(val))"
                placeholder="Mi Feature Flag"
              />
              <p v-if="errors.name" class="text-xs text-destructive">{{ errors.name }}</p>
            </div>

            <!-- Description -->
            <div class="space-y-2">
              <Label for="description">Descripcion</Label>
              <Textarea
                id="description"
                :model-value="values.description"
                @update:model-value="(val: string | number) => setFieldValue('description', String(val))"
                placeholder="Describe para que sirve este feature flag..."
                rows="3"
              />
            </div>

            <!-- isEnabled -->
            <div class="flex items-center gap-3 rounded-lg border p-4">
              <Switch
                id="isEnabled"
                :checked="isEnabled"
                @update:checked="(val: boolean) => isEnabled = val"
              />
              <div>
                <Label for="isEnabled" class="cursor-pointer">Activado</Label>
                <p class="text-xs text-muted-foreground">
                  {{ isEnabled ? 'El feature flag esta activo' : 'El feature flag esta desactivado' }}
                </p>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" @click="goBack">
                Cancelar
              </Button>
              <Button type="submit" :disabled="loading">
                <Loader2Icon v-if="loading" class="h-4 w-4 mr-2 animate-spin" />
                {{ loading ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Crear Flag') }}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
