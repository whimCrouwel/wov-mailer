import { useEffect, useRef } from 'react'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'

export function Terminal() {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<XTerm | null>(null)

  useEffect(() => {
    if (!containerRef.current || termRef.current) return

    const term = new XTerm({ cursorBlink: true, fontSize: 13, fontFamily: 'monospace' })
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(containerRef.current)
    fitAddon.fit()
    termRef.current = term

    const startSession = () => {
      term.clear()
      window.api.terminal.create()
    }

    startSession()
    window.api.terminal.onData(data => term.write(data))
    window.api.terminal.onExit(() => {
      term.write('\r\n\r\n[session ended — press any key to restart]\r\n')
      term.onKey(() => startSession())
    })
    term.onData(input => window.api.terminal.sendInput(input))

    const observer = new ResizeObserver(() => {
      fitAddon.fit()
      window.api.terminal.resize(term.cols, term.rows)
    })
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      term.dispose()
      termRef.current = null
      window.api.terminal.destroy()
    }
  }, [])

  return <div ref={containerRef} style={{ height: '100%', width: '100%', background: '#1a1a1a' }} />
}
