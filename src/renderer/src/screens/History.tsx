import { useEffect, useState } from 'react'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Copy, Mail, Users, Clock, Trash2 } from 'lucide-react'
import { RecipientListDialog } from '../components/compose/RecipientListDialog'
import type { HistoryEntry, ComposeState } from '../../../shared/types'

interface Props {
  onClone: (compose: ComposeState) => void
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'sent') return <Badge variant="success">Sent</Badge>
  if (status === 'failed') return <Badge variant="destructive">Failed</Badge>
  if (status === 'partial') return <Badge variant="warning">Partial</Badge>
  return <Badge variant="secondary">{status}</Badge>
}

export function History({ onClone }: Props) {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    window.api.listHistory().then(setEntries)
  }, [])

  async function handleDelete(id: string) {
    setDeletingId(id)
    await window.api.deleteHistory(id)
    setEntries(prev => prev.filter(e => e.id !== id))
    setDeletingId(null)
  }

  if (entries.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center h-64">
        <Mail className="w-10 h-10 text-zinc-700 mb-3" />
        <p className="text-zinc-500 text-sm">No broadcasts sent yet.</p>
        <p className="text-zinc-600 text-xs mt-1">Your sent campaigns will appear here.</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-100">History</h1>
        <p className="text-sm text-zinc-500 mt-1">{entries.length} broadcast{entries.length !== 1 ? 's' : ''} sent</p>
      </div>

      <div className="space-y-3">
        {entries.map(entry => (
          <Card key={entry.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={entry.status} />
                  </div>
                  <h3 className="font-medium text-zinc-200 truncate">{entry.subject}</h3>
                  <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(entry.sentAt).toLocaleString('ja-JP', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {entry.recipientCount} recipients
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <RecipientListDialog compose={entry.compose} recipientCount={entry.recipientCount} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onClone(entry.compose)}
                    className="border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 bg-transparent"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Clone
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(entry.id)}
                    disabled={deletingId === entry.id}
                    className="text-zinc-600 hover:text-red-400 hover:bg-red-400/10 w-8 h-8"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
