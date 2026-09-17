/**
 * Get the API base URL from runtime config.
 * Use this instead of duplicating getApiUrl() in every composable.
 */
export const getApiUrl = (): string => {
  const config = useRuntimeConfig()
  return config.public.apiUrl as string
}
