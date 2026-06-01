import { describe, it, expect } from 'vitest'
import { filterRecords, buildFormula } from '../../src/main/airtable'
import type { FilterCondition } from '../../src/shared/types'

describe('buildFormula', () => {
  it('returns empty string for no filters', () => {
    expect(buildFormula([])).toBe('')
  })

  it('builds equals formula for single condition', () => {
    const filters: FilterCondition[] = [
      { field: 'status', fieldType: 'singleSelect', operator: 'equals', value: 'active' }
    ]
    expect(buildFormula(filters)).toBe("{status}='active'")
  })

  it('builds AND formula for multiple conditions', () => {
    const filters: FilterCondition[] = [
      { field: 'status', fieldType: 'singleSelect', operator: 'equals', value: 'active' },
      { field: 'city', fieldType: 'singleLineText', operator: 'contains', value: '金沢' },
    ]
    expect(buildFormula(filters)).toBe("AND({status}='active',FIND('金沢',{city})>0)")
  })

  it('builds gt formula for number field', () => {
    const filters: FilterCondition[] = [
      { field: 'count', fieldType: 'number', operator: 'gt', value: '10' }
    ]
    expect(buildFormula(filters)).toBe('{count}>10')
  })
})

describe('filterRecords', () => {
  it('returns only records where all conditions pass', () => {
    const records = [
      { email: 'a@a.com', status: 'active', city: '金沢' },
      { email: 'b@b.com', status: 'inactive', city: '東京' },
      { email: 'c@c.com', status: 'active', city: '東京' },
    ]
    const filters: FilterCondition[] = [
      { field: 'status', fieldType: 'singleSelect', operator: 'equals', value: 'active' },
    ]
    const result = filterRecords(records, filters)
    expect(result).toHaveLength(2)
    expect(result[0].email).toBe('a@a.com')
  })
})
