import type { Config, ComposeState, HistoryEntry } from '../../shared/types'

declare global {
  interface Window {
    api: {
      getConfig(): Promise<Config>
      saveConfig(config: Config): Promise<void>
      onMcpStateUpdate(cb: (state: Partial<ComposeState>) => void): void
      listHistory(): Promise<HistoryEntry[]>
      appendHistory(entry: HistoryEntry): Promise<void>
    }
  }
}
