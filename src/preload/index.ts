import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/ipc-channels'
import type { Config, ComposeState } from '../shared/types'

contextBridge.exposeInMainWorld('api', {
  getConfig: (): Promise<Config> => ipcRenderer.invoke(IPC.CONFIG_GET),
  saveConfig: (config: Config): Promise<void> => ipcRenderer.invoke(IPC.CONFIG_SAVE, config),
  onMcpStateUpdate: (cb: (state: Partial<ComposeState>) => void) => {
    ipcRenderer.on(IPC.MCP_STATE_UPDATE, (_event, state) => cb(state))
  },
})
