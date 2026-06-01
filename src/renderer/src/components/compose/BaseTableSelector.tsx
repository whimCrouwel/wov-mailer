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
    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
      <div>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#666' }}>Base</label>
        <select
          value={selectedBaseId}
          onChange={e => {
            const base = bases.find(b => b.id === e.target.value)
            if (base) onSelectBase(base)
          }}
          style={{ padding: '6px 8px' }}
        >
          <option value="">Select base…</option>
          {bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#666' }}>Table</label>
        <select
          value={selectedTableId}
          onChange={e => {
            const table = tables.find(t => t.id === e.target.value)
            if (table) onSelectTable(table)
          }}
          style={{ padding: '6px 8px' }}
          disabled={tables.length === 0}
        >
          <option value="">Select table…</option>
          {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
    </div>
  )
}
