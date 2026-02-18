import { ref, type Ref } from 'vue'

export interface UseFetchOptions {
  immediate?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

export interface UseFetchReturn<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<Error | null>
  execute: () => Promise<void>
  refresh: () => Promise<void>
}

/**
 * Composable para manejar peticiones API con estado
 * @param url - URL del endpoint
 * @param options - Opciones de configuración
 * @returns Estado y métodos para manejar la petición
 */
export function useApiFetch<T = any>(
  url: string,
  options: UseFetchOptions = {}
): UseFetchReturn<T> {
  const { immediate = true, onSuccess, onError } = options

  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const execute = async () => {
    loading.value = true
    error.value = null

    try {
      const response = (await $fetch<T>(url)) as T
      data.value = response
      onSuccess?.(response)
    } catch (e: any) {
      error.value = e
      onError?.(e)
    } finally {
      loading.value = false
    }
  }

  const refresh = async () => {
    await execute()
  }

  if (immediate) {
    execute()
  }

  return {
    data,
    loading,
    error,
    execute,
    refresh,
  }
}
