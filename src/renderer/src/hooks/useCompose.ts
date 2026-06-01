import { useState, useEffect, useCallback } from 'react'
import type { ComposeState, AirtableBase, AirtableTable } from '../../../shared/types'

const emptyCompose: ComposeState = {
  baseId: '', baseLabel: '', tableId: '', tableLabel: '',
  emailField: '', filters: [], templateName: '',
  subject: '', body: '',
}

export function useCompose(initial?: ComposeState | null) {
  const [compose, setCompose] = useState<ComposeState>(initial ?? emptyCompose)
  const [bases, setBases] = useState<AirtableBase[]>([])
  const [tables, setTables] = useState<AirtableTable[]>([])
  const [recipientCount, setRecipientCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    window.api.listBases().then(setBases).catch(console.error)
  }, [])

  // Auto-select first template if none is set
  useEffect(() => {
    if (compose.templateName) return
    window.api.listTemplates().then(templates => {
      if (templates.length > 0) {
        const preferred = templates.find(t => t === 'minimal') ?? templates[0]
        setCompose(prev => prev.templateName ? prev : { ...prev, templateName: preferred })
      }
    }).catch(console.error)
  }, [])

  useEffect(() => {
    if (!compose.baseId) return
    window.api.listTables(compose.baseId).then(setTables).catch(console.error)
  }, [compose.baseId])

  useEffect(() => {
    if (!compose.tableId || !compose.emailField) return
    setLoading(true)
    window.api
      .previewRecipients(compose.baseId, compose.tableId, compose.emailField, compose.filters)
      .then(r => setRecipientCount(r.count))
      .finally(() => setLoading(false))
  }, [compose.tableId, compose.emailField, compose.filters])

  useEffect(() => {
    window.api.onMcpStateUpdate((partial) => {
      setCompose(prev => ({ ...prev, ...partial }))
    })
  }, [])

  const selectBase = useCallback((base: AirtableBase) => {
    setCompose(prev => ({ ...prev, baseId: base.id, baseLabel: base.name, tableId: '', emailField: '', filters: [] }))
    setTables([])
    setRecipientCount(null)
  }, [])

  const selectTable = useCallback((table: AirtableTable) => {
    setCompose(prev => ({ ...prev, tableId: table.id, tableLabel: table.name, emailField: table.emailField, filters: [] }))
  }, [])

  return { compose, setCompose, bases, tables, recipientCount, loading, selectBase, selectTable }
}
