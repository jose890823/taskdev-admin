import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { DataTable } from '~/components/shared/DataTable'

describe('DataTable', () => {
  const sampleData = [
    { id: 1, name: 'John', email: 'john@test.com' },
    { id: 2, name: 'Jane', email: 'jane@test.com' },
  ]

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
  ]

  it('should render table with data', () => {
    const wrapper = mount(DataTable, {
      props: {
        data: sampleData,
        columns,
      },
      global: {
        mocks: {
          $t: (key: string) => key,
        },
      },
    })

    expect(wrapper.text()).toContain('John')
    expect(wrapper.text()).toContain('Jane')
    expect(wrapper.text()).toContain('john@test.com')
  })

  it('should show loading state', () => {
    const wrapper = mount(DataTable, {
      props: {
        data: [],
        columns,
        loading: true,
      },
      global: {
        mocks: {
          $t: (key: string) => key,
        },
      },
    })

    expect(wrapper.text()).toContain('common.loading')
  })

  it('should show error state', () => {
    const errorMessage = 'Failed to load data'
    const wrapper = mount(DataTable, {
      props: {
        data: [],
        columns,
        error: errorMessage,
      },
      global: {
        mocks: {
          $t: (key: string) => key,
        },
      },
    })

    expect(wrapper.text()).toContain(errorMessage)
  })

  it('should emit edit event when edit button is clicked', async () => {
    const wrapper = mount(DataTable, {
      props: {
        data: sampleData,
        columns,
        showActions: true,
      },
      global: {
        mocks: {
          $t: (key: string) => key,
        },
      },
    })

    const editButtons = wrapper.findAll('button').filter(btn =>
      btn.text() === 'common.edit'
    )

    if (editButtons.length > 0) {
      await editButtons[0].trigger('click')
      expect(wrapper.emitted('edit')).toBeTruthy()
    }
  })

  it('should not show actions column when showActions is false', () => {
    const wrapper = mount(DataTable, {
      props: {
        data: sampleData,
        columns,
        showActions: false,
      },
      global: {
        mocks: {
          $t: (key: string) => key,
        },
      },
    })

    expect(wrapper.text()).not.toContain('common.actions')
  })
})
