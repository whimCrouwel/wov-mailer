import { useState } from 'react'
import { Settings } from './screens/Settings'
import { History } from './screens/History'
import type { ComposeState } from '../../shared/types'

type Screen = 'compose' | 'history' | 'settings'

export default function App() {
  const [screen, setScreen] = useState<Screen>('settings')
  const [cloneCompose, setCloneCompose] = useState<ComposeState | null>(null)

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      <nav style={{ width: 160, background: '#1a1a2e', color: '#fff', padding: 16, flexShrink: 0 }}>
        <div style={{ fontWeight: 'bold', marginBottom: 24 }}>wov-mailer</div>
        {(['compose', 'history', 'settings'] as Screen[]).map(s => (
          <div
            key={s}
            onClick={() => setScreen(s)}
            style={{
              padding: '8px 0',
              cursor: 'pointer',
              color: screen === s ? '#fff' : '#aaa',
              fontWeight: screen === s ? 'bold' : 'normal',
            }}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </div>
        ))}
      </nav>
      <main style={{ flex: 1, overflow: 'auto' }}>
        {screen === 'settings' && <Settings />}
        {screen === 'compose' && <div style={{ padding: 24 }}>Compose — coming soon</div>}
        {screen === 'history' && (
          <History onClone={compose => { setCloneCompose(compose); setScreen('compose') }} />
        )}
      </main>
    </div>
  )
}
