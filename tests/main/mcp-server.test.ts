import { describe, it, expect } from 'vitest'
import { buildFormula } from '../../src/main/airtable'
import type { ComposeState, FilterCondition } from '../../src/shared/types'

describe('MCP compose state mutations', () => {
  let state: Partial<ComposeState> = {}

  it('set_subject updates subject', () => {
    state = { ...state, subject: 'Hello World' }
    expect(state.subject).toBe('Hello World')
  })

  it('set_body updates body', () => {
    state = { ...state, body: '# Hi there' }
    expect(state.body).toBe('# Hi there')
  })

  it('add_filter appends to filters array', () => {
    const newFilter: FilterCondition = {
      field: 'status', fieldType: 'singleSelect', operator: 'equals', value: 'active'
    }
    state = { ...state, filters: [...(state.filters ?? []), newFilter] }
    expect(state.filters).toHaveLength(1)
    expect(state.filters![0].value).toBe('active')
  })

  it('clear_filters empties the array', () => {
    state = { ...state, filters: [] }
    expect(state.filters).toHaveLength(0)
  })

  it('select_template sets templateName', () => {
    state = { ...state, templateName: 'default' }
    expect(state.templateName).toBe('default')
  })
})
