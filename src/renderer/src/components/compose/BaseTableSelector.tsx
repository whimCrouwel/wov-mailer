import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Label } from '../ui/label'
import type { AirtableBase, AirtableTable } from '../../../../../shared/types'

interface Props {
  bases: AirtableBase[]
  tables: AirtableTable[]
  selectedBaseId: string
  selectedTableId: string
  onSelectBase: (base: AirtableBase) => void
  onSelectTable: (table: AirtableTable) => void
}

export function BaseTableSelector({ bases, tables, selectedBaseId, selectedTableId, onSelectBase, onSelectTable }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-zinc-500">Base</Label>
        <Select
          value={selectedBaseId || undefined}
          onValueChange={value => {
            const base = bases.find(b => b.id === value)
            if (base) onSelectBase(base)
          }}
        >
          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100 focus:ring-zinc-500">
            <SelectValue placeholder="Select base…" />
          </SelectTrigger>
          <SelectContent>
            {bases.map(b => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-zinc-500">Table</Label>
        <Select
          value={selectedTableId || undefined}
          onValueChange={value => {
            const table = tables.find(t => t.id === value)
            if (table) onSelectTable(table)
          }}
          disabled={tables.length === 0}
        >
          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100 focus:ring-zinc-500 disabled:opacity-40">
            <SelectValue placeholder="Select table…" />
          </SelectTrigger>
          <SelectContent>
            {tables.map(t => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
