import { toast } from 'vue-sonner'

/**
 * Composable para mostrar notificaciones toast usando Sonner
 */
export function useToast() {
  const success = (title: string, description?: string) => {
    toast.success(title, {
      description,
    })
  }

  const error = (title: string, description?: string) => {
    toast.error(title, {
      description,
    })
  }

  const info = (title: string, description?: string) => {
    toast.info(title, {
      description,
    })
  }

  const warning = (title: string, description?: string) => {
    toast.warning(title, {
      description,
    })
  }

  const dismiss = (toastId?: string | number) => {
    toast.dismiss(toastId)
  }

  return {
    success,
    error,
    info,
    warning,
    dismiss,
    toast,
  }
}
