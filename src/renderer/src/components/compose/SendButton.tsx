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

  const canSend = !!(compose.tableId && compose.subject && compose.body && compose.templateName)

  async function handleSend() {
    if (!canSend) return
    const confirmed = window.confirm(
      `Send "${compose.subject}" to ${recipientCount ?? '?'} recipients?`
    )
    if (!confirmed) return

    setSending(true)
    try {
      const res = await window.api.sendBroadcast(compose)
      setResult(res)
      onSent()
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
      {result && (
        <div style={{ marginTop: 8, color: result.failed === 0 ? 'green' : 'orange' }}>
          Sent: {result.sent} | Failed: {result.failed}
        </div>
      )}
    </div>
  )
}
