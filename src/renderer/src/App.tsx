import { useState } from 'react'
import { Settings } from './screens/Settings'
import { History } from './screens/History'
import { Compose } from './screens/Compose'
import { Terminal } from './components/Terminal'
import { cn } from './lib/utils'
import { Mail, History as HistoryIcon, Settings as SettingsIcon, TerminalSquare, ChevronUp, ChevronDown } from 'lucide-react'
import type { ComposeState } from '../../shared/types'

type Screen = 'compose' | 'history' | 'settings'

const NAV_ITEMS: { id: Screen; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'compose', label: 'Compose', icon: Mail },
  { id: 'history', label: 'History', icon: HistoryIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

export default function App() {
  const [screen, setScreen] = useState<Screen>('compose')
  const [cloneCompose, setCloneCompose] = useState<ComposeState | null>(null)
  const [terminalOpen, setTerminalOpen] = useState(false)

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="w-52 bg-zinc-900 border-r border-zinc-800 flex flex-col flex-shrink-0">
          <div className="px-4 py-5 border-b border-zinc-800">
            <div className="text-sm font-bold text-zinc-100 tracking-widest uppercase">wov-mailer</div>
            <div className="text-xs text-zinc-500 mt-0.5">broadcast tool</div>
          </div>

          <div className="flex-1 py-3 px-2 space-y-0.5">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setScreen(id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                  screen === id
                    ? "bg-zinc-700 text-zinc-100 font-medium"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </div>

          <div className="p-2 border-t border-zinc-800">
            <button
              onClick={() => setTerminalOpen(o => !o)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
            >
              <TerminalSquare className="w-4 h-4 flex-shrink-0" />
              <span>Terminal</span>
              {terminalOpen
                ? <ChevronDown className="w-3 h-3 ml-auto" />
                : <ChevronUp className="w-3 h-3 ml-auto" />}
            </button>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-zinc-950">
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

      {/* Terminal panel */}
      {terminalOpen && (
        <div className="h-72 border-t border-zinc-700 bg-zinc-950 flex-shrink-0">
          <Terminal />
        </div>
      )}
    </div>
  )
}
