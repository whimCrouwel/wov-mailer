import { useState } from 'react'
import type { ComposeState } from '../../../../../shared/types'

interface Props {
  compose: ComposeState
  recipientCount: number | null
  onSent: () => void
}

export function SendButton({ compose, recipientCount, onSent }: Props) {
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null)
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
      if (res.success === false) {
        setSendError(res.error ?? 'Unknown error')
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
    <div>
      <button
        onClick={handleSend}
        disabled={!canSend || sending}
        style={{
          padding: '10px 24px',
          background: canSend ? '#1a1a2e' : '#ccc',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: canSend ? 'pointer' : 'default',
          fontSize: 15,
        }}
      >
        {sending ? 'Sending…' : `Send to ${recipientCount ?? '…'} recipients`}
      </button>
      {sendError && (
        <div style={{ marginTop: 8, color: 'red', fontSize: 13 }}>
          Error: {sendError}
        </div>
      )}
      {result && (
        <div style={{ marginTop: 8, color: result.failed === 0 ? 'green' : 'orange' }}>
          Sent: {result.sent} | Failed: {result.failed}
          {result.failed > 0 && (result as { errors?: string[] }).errors?.length ? (
            <ul style={{ margin: '4px 0 0 16px', fontSize: 12 }}>
              {(result as { errors: string[] }).errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  )
}
