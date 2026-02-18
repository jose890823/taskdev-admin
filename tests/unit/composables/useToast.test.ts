import { describe, it, expect, vi } from 'vitest'

// Mock vue-sonner
vi.mock('vue-sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    dismiss: vi.fn(),
  }),
}))

import { useToast } from '~/composables/useToast'
import { toast } from 'vue-sonner'

describe('useToast', () => {
  it('should call toast.success with correct arguments', () => {
    const { success } = useToast()

    success('Success message', 'Success description')

    expect(toast.success).toHaveBeenCalledWith('Success message', {
      description: 'Success description',
    })
  })

  it('should call toast.error with correct arguments', () => {
    const { error } = useToast()

    error('Error message', 'Error description')

    expect(toast.error).toHaveBeenCalledWith('Error message', {
      description: 'Error description',
    })
  })

  it('should call toast.info with correct arguments', () => {
    const { info } = useToast()

    info('Info message')

    expect(toast.info).toHaveBeenCalledWith('Info message', {
      description: undefined,
    })
  })

  it('should call toast.warning with correct arguments', () => {
    const { warning } = useToast()

    warning('Warning message', 'Be careful')

    expect(toast.warning).toHaveBeenCalledWith('Warning message', {
      description: 'Be careful',
    })
  })

  it('should call toast.dismiss', () => {
    const { dismiss } = useToast()

    dismiss('toast-id')

    expect(toast.dismiss).toHaveBeenCalledWith('toast-id')
  })
})
