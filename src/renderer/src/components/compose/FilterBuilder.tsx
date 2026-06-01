import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Plus, X } from 'lucide-react'
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
    <div className="space-y-2">
      {filters.map((filter, i) => {
        const field = nonEmailFields.find(f => f.name === filter.field) ?? nonEmailFields[0]
        const ops = operatorsFor(field?.type ?? 'singleLineText')
        return (
          <div key={i} className="flex gap-2 items-center">
            <Select
              value={filter.field}
              onValueChange={value => {
                const f = nonEmailFields.find(x => x.name === value)!
                updateCondition(i, { field: f.name, fieldType: f.type, operator: 'equals', value: '' })
              }}
            >
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100 focus:ring-zinc-500 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {nonEmailFields.map(f => <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select
              value={filter.operator}
              onValueChange={value => updateCondition(i, { operator: value as FilterCondition['operator'] })}
            >
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100 focus:ring-zinc-500 w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ops.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>

            <Input
              value={filter.value}
              onChange={e => updateCondition(i, { value: e.target.value })}
              placeholder="value"
              className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-500"
            />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeCondition(i)}
              className="text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )
      })}

      <Button
        variant="outline"
        size="sm"
        onClick={addCondition}
        disabled={nonEmailFields.length === 0}
        className="mt-1 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 bg-transparent"
      >
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        Add Condition
      </Button>
    </div>
  )
}
