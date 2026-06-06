import { useEffect, useState } from 'react'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { PenLine, Clock, Trash2 } from 'lucide-react'
import type { DraftEntry, ComposeState } from '../../../shared/types'

interface Props {
  onEdit: (compose: ComposeState) => void
}

export function Drafts({ onEdit }: Props) {
  const [drafts, setDrafts] = useState<DraftEntry[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    window.api.listDrafts().then(setDrafts)
  }, [])

  async function handleDelete(id: string) {
    setDeletingId(id)
    await window.api.deleteDraft(id)
    setDrafts(prev => prev.filter(d => d.id !== id))
    setDeletingId(null)
  }

  if (drafts.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center h-64">
        <PenLine className="w-10 h-10 text-zinc-700 mb-3" />
        <p className="text-zinc-500 text-sm">No drafts saved yet.</p>
        <p className="text-zinc-600 text-xs mt-1">Save a draft from the Compose screen to continue later.</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-100">Drafts</h1>
        <p className="text-sm text-zinc-500 mt-1">{drafts.length} draft{drafts.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="space-y-3">
        {drafts.map(draft => (
          <Card key={draft.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-zinc-200 truncate">
                    {draft.compose.subject || <span className="text-zinc-500 italic">Untitled</span>}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(draft.savedAt).toLocaleString('ja-JP', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                    {draft.compose.baseLabel && (
                      <span className="text-zinc-600 truncate">{draft.compose.baseLabel}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(draft.compose)}
                    className="border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 bg-transparent"
                  >
                    <PenLine className="w-3.5 h-3.5 mr-1.5" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(draft.id)}
                    disabled={deletingId === draft.id}
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
