import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/ipc-channels'
import type { Config, ComposeState, HistoryEntry, AirtableBase, AirtableTable, FilterCondition } from '../shared/types'

contextBridge.exposeInMainWorld('api', {
  getConfig: (): Promise<Config> => ipcRenderer.invoke(IPC.CONFIG_GET),
  saveConfig: (config: Config): Promise<void> => ipcRenderer.invoke(IPC.CONFIG_SAVE, config),
  onMcpStateUpdate: (cb: (state: Partial<ComposeState>) => void) => {
    ipcRenderer.on(IPC.MCP_STATE_UPDATE, (_event, state) => cb(state))
  },
  listHistory: (): Promise<HistoryEntry[]> => ipcRenderer.invoke(IPC.HISTORY_LIST),
  appendHistory: (entry: HistoryEntry): Promise<void> => ipcRenderer.invoke(IPC.HISTORY_APPEND, entry),
  listBases: (): Promise<AirtableBase[]> => ipcRenderer.invoke(IPC.AIRTABLE_LIST_BASES),
  listTables: (baseId: string): Promise<AirtableTable[]> => ipcRenderer.invoke(IPC.AIRTABLE_LIST_TABLES, baseId),
  previewRecipients: (baseId: string, tableId: string, emailField: string, filters: FilterCondition[]) =>
    ipcRenderer.invoke(IPC.AIRTABLE_PREVIEW_RECIPIENTS, baseId, tableId, emailField, filters),
  fetchRecipients: (baseId: string, tableId: string, emailField: string, filters: FilterCondition[]) =>
    ipcRenderer.invoke(IPC.AIRTABLE_FETCH_RECIPIENTS, baseId, tableId, emailField, filters),
  listTemplates: (): Promise<string[]> => ipcRenderer.invoke(IPC.TEMPLATES_LIST),
  getTemplate: (name: string): Promise<string> => ipcRenderer.invoke(IPC.TEMPLATES_GET, name),
  sendBroadcast: (compose: ComposeState): Promise<{ sent: number; failed: number; errors: string[] }> =>
    ipcRenderer.invoke(IPC.SEND_BROADCAST, compose),
  terminal: {
    create: () => ipcRenderer.send('terminal:create'),
    onData: (cb: (data: string) => void) => { ipcRenderer.on('terminal:data', (_e, data) => cb(data)) },
    sendInput: (input: string) => ipcRenderer.send('terminal:input', input),
    resize: (cols: number, rows: number) => ipcRenderer.send('terminal:resize', cols, rows),
  },
})
