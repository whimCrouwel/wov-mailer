import { useState } from 'react'
import { Settings } from './screens/Settings'
import { History } from './screens/History'
import { Compose } from './screens/Compose'
import { Terminal } from './components/Terminal'
import type { ComposeState } from '../../shared/types'

type Screen = 'compose' | 'history' | 'settings'

export default function App() {
  const [screen, setScreen] = useState<Screen>('settings')
  const [cloneCompose, setCloneCompose] = useState<ComposeState | null>(null)
  const [terminalOpen, setTerminalOpen] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <nav style={{ width: 160, background: '#1a1a2e', color: '#fff', padding: 16, flexShrink: 0, position: 'relative' }}>
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
          <div
            onClick={() => setTerminalOpen(o => !o)}
            style={{ position: 'absolute', bottom: 16, left: 16, cursor: 'pointer', color: '#aaa', fontSize: 12 }}
          >
            {terminalOpen ? '▼ Terminal' : '▲ Terminal'}
          </div>
        </nav>
        <main style={{ flex: 1, overflow: 'auto' }}>
          {screen === 'settings' && <Settings />}
          {screen === 'compose' && (
            <Compose
              initial={cloneCompose}
              onSent={() => { setCloneCompose(null); setScreen('history') }}
            />
          )}
          {screen === 'history' && (
            <History onClone={compose => { setCloneCompose(compose); setScreen('compose') }} />
          )}
        </main>
      </div>
      {terminalOpen && (
        <div style={{ height: 280, borderTop: '2px solid #333', background: '#1a1a1a' }}>
          <Terminal />
        </div>
      )}
    </div>
  )
}
