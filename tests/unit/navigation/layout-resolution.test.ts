import { describe, expect, it } from 'vitest'
import { resolvePageLayout } from '~/middleware/layout.global'

describe('resolvePageLayout', () => {
  it('keeps the layout declared by the page', () => {
    expect(resolvePageLayout('empty', 'sidebar-vertical')).toBe('empty')
    expect(resolvePageLayout('sidebar-vertical', 'horizontal-menu')).toBe('sidebar-vertical')
  })

  it('falls back to the user-selected layout when the page declares none', () => {
    expect(resolvePageLayout(undefined, 'horizontal-menu')).toBe('horizontal-menu')
  })
})
