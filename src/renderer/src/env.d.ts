import type { Config, ComposeState, HistoryEntry, AirtableBase, AirtableTable, FilterCondition, Recipient } from '../../shared/types'

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
      fetchRecipients(baseId: string, tableId: string, emailField: string, filters: FilterCondition[]): Promise<Recipient[]>
      fetchSample(baseId: string, tableId: string, emailField: string): Promise<Recipient | null>
      getFieldValues(baseId: string, tableId: string, fieldName: string, fieldType?: string): Promise<string[]>
      listTemplates(): Promise<string[]>
      getTemplate(name: string): Promise<string>
      sendBroadcast(compose: ComposeState): Promise<{ sent: number; failed: number; errors: string[] }>
      terminal: {
        create(): void
        destroy(): void
        onData(cb: (data: string) => void): void
        sendInput(input: string): void
        resize(cols: number, rows: number): void
      }
    }
  }
}
