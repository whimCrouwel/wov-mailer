import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '../ui/dialog'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { Users, Loader2 } from 'lucide-react'
import type { ComposeState, Recipient } from '../../../../../shared/types'

interface Props {
  compose: ComposeState
  recipientCount: number | null
}

function guessName(mergeData: Record<string, string>): string {
  const nameKeys = ['name', 'Name', '名前', '氏名', 'full_name', 'fullname', 'first_name', 'firstName']
  for (const key of nameKeys) {
    if (mergeData[key]) return mergeData[key]
  }
  // Fall back to first non-empty string value
  const first = Object.values(mergeData).find(v => v.trim())
  return first ?? '—'
}

export function RecipientListDialog({ compose, recipientCount }: Props) {
  const [open, setOpen] = useState(false)
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [loading, setLoading] = useState(false)

  async function load() {
    if (!compose.baseId || !compose.tableId || !compose.emailField) return
    setLoading(true)
    try {
      const list = await window.api.fetchRecipients(
        compose.baseId, compose.tableId, compose.emailField, compose.filters
      )
      setRecipients(list)
    } finally {
      setLoading(false)
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) load()
    else setRecipients([])
  }

  const disabled = !compose.baseId || !compose.tableId

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-7 px-2 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 gap-1.5"
        >
          <Users className="w-3.5 h-3.5" />
          View list
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Recipients</DialogTitle>
          <DialogDescription>
            {loading ? 'Loading…' : `${recipients.length} recipient${recipients.length !== 1 ? 's' : ''} match the current filters`}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-zinc-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Fetching recipients…
            </div>
          ) : recipients.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-500">No recipients found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide w-2/5">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Email</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((r, i) => (
                  <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="px-6 py-3 text-zinc-300 truncate max-w-0 w-2/5">
                      <span className="block truncate">{guessName(r.mergeData)}</span>
                    </td>
                    <td className="px-6 py-3 text-zinc-400 truncate max-w-0">
                      <span className="block truncate">{r.email}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
