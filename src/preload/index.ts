import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/ipc-channels'
import type { Config, ComposeState, HistoryEntry } from '../shared/types'

contextBridge.exposeInMainWorld('api', {
  getConfig: (): Promise<Config> => ipcRenderer.invoke(IPC.CONFIG_GET),
  saveConfig: (config: Config): Promise<void> => ipcRenderer.invoke(IPC.CONFIG_SAVE, config),
  onMcpStateUpdate: (cb: (state: Partial<ComposeState>) => void) => {
    ipcRenderer.on(IPC.MCP_STATE_UPDATE, (_event, state) => cb(state))
  },
  listHistory: (): Promise<HistoryEntry[]> => ipcRenderer.invoke(IPC.HISTORY_LIST),
  appendHistory: (entry: HistoryEntry): Promise<void> => ipcRenderer.invoke(IPC.HISTORY_APPEND, entry),
})
