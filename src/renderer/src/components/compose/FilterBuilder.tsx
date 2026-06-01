import type { AirtableField, FilterCondition } from '../../../../../shared/types'

interface Props {
  fields: AirtableField[]
  filters: FilterCondition[]
  onChange: (filters: FilterCondition[]) => void
}

function operatorsFor(type: string): { value: FilterCondition['operator']; label: string }[] {
  if (type === 'number') return [
    { value: 'equals', label: '=' },
    { value: 'gt', label: '>' },
    { value: 'lt', label: '<' },
  ]
  if (type === 'singleSelect') return [{ value: 'equals', label: 'equals' }]
  return [
    { value: 'equals', label: 'equals' },
    { value: 'contains', label: 'contains' },
  ]
}

export function FilterBuilder({ fields, filters, onChange }: Props) {
  const nonEmailFields = fields.filter(f => f.type !== 'email')

  function addCondition() {
    if (nonEmailFields.length === 0) return
    const first = nonEmailFields[0]
    const newFilter: FilterCondition = {
      field: first.name,
      fieldType: first.type,
      operator: 'equals',
      value: '',
    }
    onChange([...filters, newFilter])
  }

  function updateCondition(index: number, patch: Partial<FilterCondition>) {
    const updated = filters.map((f, i) => i === index ? { ...f, ...patch } : f)
    onChange(updated)
  }

  function removeCondition(index: number) {
    onChange(filters.filter((_, i) => i !== index))
  }

  return (
    <div>
      {filters.map((filter, i) => {
        const field = nonEmailFields.find(f => f.name === filter.field) ?? nonEmailFields[0]
        const ops = operatorsFor(field?.type ?? 'singleLineText')
        return (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <select
              value={filter.field}
              onChange={e => {
                const f = nonEmailFields.find(x => x.name === e.target.value)!
                updateCondition(i, { field: f.name, fieldType: f.type, operator: 'equals', value: '' })
              }}
            >
              {nonEmailFields.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
            </select>
            <select
              value={filter.operator}
              onChange={e => updateCondition(i, { operator: e.target.value as FilterCondition['operator'] })}
            >
              {ops.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input
              value={filter.value}
              onChange={e => updateCondition(i, { value: e.target.value })}
              placeholder="value"
              style={{ flex: 1, padding: '4px 6px' }}
            />
            <button onClick={() => removeCondition(i)}>✕</button>
          </div>
        )
      })}
      <button onClick={addCondition}>Add Condition</button>
    </div>
  )
}
