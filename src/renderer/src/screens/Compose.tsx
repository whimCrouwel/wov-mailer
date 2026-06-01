import { useEffect, useState } from 'react'
import { useCompose } from '../hooks/useCompose'
import { BaseTableSelector } from '../components/compose/BaseTableSelector'
import { FilterBuilder } from '../components/compose/FilterBuilder'
import { TemplateSelector } from '../components/compose/TemplateSelector'
import { MarkdownEditor } from '../components/compose/MarkdownEditor'
import { EmailPreview } from '../components/compose/EmailPreview'
import { SendButton } from '../components/compose/SendButton'
import type { ComposeState } from '../../../shared/types'

interface Props {
  initial?: ComposeState | null
  onSent: () => void
}

export function Compose({ initial, onSent }: Props) {
  const { compose, setCompose, bases, tables, recipientCount, loading, selectBase, selectTable } = useCompose(initial)
  const [templateHtml, setTemplateHtml] = useState('')

  useEffect(() => {
    if (!compose.templateName) return
    window.api.getTemplate(compose.templateName).then(setTemplateHtml)
  }, [compose.templateName])

  const selectedTable = tables.find(t => t.id === compose.tableId)

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h2>New Broadcast</h2>

      <BaseTableSelector
        bases={bases}
        tables={tables}
        selectedBaseId={compose.baseId}
        selectedTableId={compose.tableId}
        onSelectBase={selectBase}
        onSelectTable={selectTable}
      />

      {selectedTable && (
        <>
          <div style={{ marginBottom: 8, fontSize: 13, color: '#666' }}>Filters (AND logic)</div>
          <FilterBuilder
            fields={selectedTable.fields}
            filters={compose.filters}
            onChange={filters => setCompose(c => ({ ...c, filters }))}
          />
          <div style={{ marginBottom: 16, fontSize: 13, color: loading ? '#888' : '#333' }}>
            {loading ? 'Counting…' : `${recipientCount ?? 0} recipients`}
          </div>
        </>
      )}

      <TemplateSelector
        value={compose.templateName}
        onChange={templateName => setCompose(c => ({ ...c, templateName }))}
      />

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#666' }}>Subject</label>
        <input
          value={compose.subject}
          onChange={e => setCompose(c => ({ ...c, subject: e.target.value }))}
          style={{ width: '100%', padding: '6px 8px', boxSizing: 'border-box' }}
          placeholder="Subject line…"
        />
      </div>

      <MarkdownEditor
        value={compose.body}
        onChange={body => setCompose(c => ({ ...c, body }))}
      />

      {compose.templateName && compose.body && (
        <EmailPreview body={compose.body} templateHtml={templateHtml} />
      )}

      <SendButton compose={compose} recipientCount={recipientCount} onSent={onSent} />
    </div>
  )
}
