import { useState } from 'react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import type { ComposeState } from '../../../../../shared/types'

interface Props {
  compose: ComposeState
  recipientCount: number | null
  onSent: () => void
}

export function SendButton({ compose, recipientCount, onSent }: Props) {
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: number; failed: number; errors?: string[] } | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)

  const canSend = !!(compose.tableId && compose.subject && compose.body && compose.templateName)

  async function handleSend() {
    if (!canSend) return
    const confirmed = window.confirm(
      `Send "${compose.subject}" to ${recipientCount ?? '?'} recipients?`
    )
    if (!confirmed) return

    setSending(true)
    setSendError(null)
    try {
      const res = await window.api.sendBroadcast(compose)
      if ((res as { success?: boolean }).success === false) {
        setSendError((res as { error?: string }).error ?? 'Unknown error')
        return
      }
      setResult(res)
      if (res.failed === 0) {
        onSent()
      }
    } catch (err) {
      setSendError(err instanceof Error ? err.message : String(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-3">
      {!canSend && (
        <p className="text-xs text-zinc-600">
          Complete all steps above (base, table, template, subject, and body) to send.
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button
          onClick={handleSend}
          disabled={!canSend || sending}
          size="lg"
          className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 disabled:opacity-40 font-semibold px-8"
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send to {recipientCount !== null ? recipientCount : '…'} recipients
            </>
          )}
        </Button>

        {recipientCount !== null && recipientCount > 0 && (
          <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
            {recipientCount} emails will be sent
          </Badge>
        )}
      </div>

      {sendError && (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Error: {sendError}</span>
        </div>
      )}

      {result && (
        <div className={`space-y-1 text-sm ${result.failed === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
          <div className="flex items-center gap-2">
            {result.failed === 0
              ? <CheckCircle2 className="w-4 h-4" />
              : <AlertCircle className="w-4 h-4" />
            }
            <span>
              Sent: <strong>{result.sent}</strong>
              {result.failed > 0 && <> · Failed: <strong>{result.failed}</strong></>}
            </span>
          </div>
          {result.failed > 0 && result.errors?.length ? (
            <ul className="ml-6 text-xs space-y-0.5 text-amber-500">
              {result.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  )
}
