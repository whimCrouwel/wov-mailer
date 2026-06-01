import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { FilterBuilder } from '../../src/renderer/src/components/compose/FilterBuilder'
import type { AirtableField, FilterCondition } from '../../src/shared/types'

const fields: AirtableField[] = [
  { id: 'f1', name: 'status', type: 'singleSelect' },
  { id: 'f2', name: 'city', type: 'singleLineText' },
]

describe('FilterBuilder', () => {
  it('renders Add Condition button', () => {
    render(<FilterBuilder fields={fields} filters={[]} onChange={() => {}} />)
    expect(screen.getByText('Add Condition')).toBeInTheDocument()
  })

  it('calls onChange when Add Condition is clicked', () => {
    const onChange = vi.fn()
    render(<FilterBuilder fields={fields} filters={[]} onChange={onChange} />)
    fireEvent.click(screen.getByText('Add Condition'))
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ field: 'status', operator: 'equals', value: '' })
    ])
  })

  it('shows remove button for existing conditions', () => {
    const filters: FilterCondition[] = [
      { field: 'status', fieldType: 'singleSelect', operator: 'equals', value: 'active' }
    ]
    render(<FilterBuilder fields={fields} filters={filters} onChange={() => {}} />)
    expect(screen.getByText('✕')).toBeInTheDocument()
  })
})
