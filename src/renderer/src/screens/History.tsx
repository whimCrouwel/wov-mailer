import { useEffect, useState } from 'react'
import type { HistoryEntry, ComposeState } from '../../../shared/types'

interface Props {
  onClone: (compose: ComposeState) => void
}

export function History({ onClone }: Props) {
  const [entries, setEntries] = useState<HistoryEntry[]>([])

  useEffect(() => {
    window.api.listHistory().then(setEntries)
  }, [])

  if (entries.length === 0) {
    return <div style={{ padding: 24, color: '#888' }}>No broadcasts sent yet.</div>
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>History</h2>
      {entries.map(entry => (
        <div key={entry.id} style={{
          border: '1px solid #ddd', borderRadius: 6, padding: 16, marginBottom: 12,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontWeight: 'bold' }}>{entry.subject}</div>
            <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
              {new Date(entry.sentAt).toLocaleString()} · {entry.recipientCount} recipients · {entry.status}
            </div>
          </div>
          <button onClick={() => onClone(entry.compose)}>Clone</button>
        </div>
      ))}
    </div>
  )
}
