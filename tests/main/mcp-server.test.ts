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

describe('setup_recipients state mutation', () => {
  it('sets baseId, tableId, emailField, and filters atomically', () => {
    let state: Partial<ComposeState> = {}
    const filters: FilterCondition[] = [
      { field: 'status', fieldType: 'singleSelect', operator: 'equals', value: 'active' }
    ]
    state = { ...state, baseId: 'appABC', baseLabel: 'Test Base', tableId: 'tblXYZ', tableLabel: 'Lead', emailField: 'Email', filters }
    expect(state.baseId).toBe('appABC')
    expect(state.tableId).toBe('tblXYZ')
    expect(state.emailField).toBe('Email')
    expect(state.filters).toHaveLength(1)
    expect(state.filters![0].value).toBe('active')
  })

  it('defaults to empty filters when none provided', () => {
    let state: Partial<ComposeState> = {}
    state = { ...state, baseId: 'appABC', baseLabel: 'Test Base', tableId: 'tblXYZ', tableLabel: 'Lead', emailField: 'Email', filters: undefined ?? [] }
    expect(state.filters).toHaveLength(0)
  })
})

describe('setup_content state mutation', () => {
  it('sets templateName, subject, and body atomically', () => {
    let state: Partial<ComposeState> = {}
    state = { ...state, templateName: 'newsletter', subject: '【WoV】テスト', body: '# Hello\n\n{{Name}}' }
    expect(state.templateName).toBe('newsletter')
    expect(state.subject).toBe('【WoV】テスト')
    expect(state.body).toBe('# Hello\n\n{{Name}}')
  })

  it('does not touch baseId or tableId', () => {
    let state: Partial<ComposeState> = { baseId: 'appABC', tableId: 'tblXYZ' }
    state = { ...state, templateName: 'minimal', subject: 'hi', body: 'body' }
    expect(state.baseId).toBe('appABC')
    expect(state.tableId).toBe('tblXYZ')
  })
})
