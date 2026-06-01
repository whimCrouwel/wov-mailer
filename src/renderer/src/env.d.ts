import type { Config, ComposeState, HistoryEntry, AirtableBase, AirtableTable, FilterCondition } from '../../shared/types'

declare global {
  interface Window {
    api: {
      getConfig(): Promise<Config>
      saveConfig(config: Config): Promise<void>
      onMcpStateUpdate(cb: (state: Partial<ComposeState>) => void): void
      listHistory(): Promise<HistoryEntry[]>
      appendHistory(entry: HistoryEntry): Promise<void>
      listBases(): Promise<AirtableBase[]>
      listTables(baseId: string): Promise<AirtableTable[]>
      previewRecipients(baseId: string, tableId: string, emailField: string, filters: FilterCondition[]): Promise<{ count: number; sample: string[] }>
      fetchRecipients(baseId: string, tableId: string, emailField: string, filters: FilterCondition[]): Promise<import('../../shared/types').Recipient[]>
    }
  }
}
