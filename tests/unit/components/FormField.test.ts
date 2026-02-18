import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FormField from '~/components/forms/BaseFormField.vue'

describe('FormField', () => {
  it('should render label when provided', () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Test Label',
        modelValue: '',
      },
    })

    expect(wrapper.text()).toContain('Test Label')
  })

  it('should show required asterisk when required is true', () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Required Field',
        modelValue: '',
        required: true,
      },
    })

    expect(wrapper.html()).toContain('*')
  })

  it('should display error message when error prop is provided', () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Field',
        modelValue: '',
        error: 'This field is required',
      },
    })

    expect(wrapper.text()).toContain('This field is required')
  })

  it('should display hint when no error', () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Field',
        modelValue: '',
        hint: 'Enter your email address',
      },
    })

    expect(wrapper.text()).toContain('Enter your email address')
  })

  it('should emit update:modelValue when input changes', async () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Field',
        modelValue: '',
      },
    })

    const input = wrapper.find('input')
    await input.setValue('new value')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['new value'])
  })

  it('should be disabled when disabled prop is true', () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Field',
        modelValue: '',
        disabled: true,
      },
    })

    const input = wrapper.find('input')
    expect(input.attributes('disabled')).toBeDefined()
  })
})
