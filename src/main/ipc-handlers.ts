import { ipcMain } from 'electron'
import { IPC } from '../shared/ipc-channels'
import { getConfig, saveConfig } from './config'
import { listHistory, appendHistory } from './history'
import type { Config, HistoryEntry } from '../shared/types'

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC.CONFIG_GET, async () => getConfig())
  ipcMain.handle(IPC.CONFIG_SAVE, async (_event, config: Config) => saveConfig(config))

  ipcMain.handle(IPC.HISTORY_LIST, async () => listHistory())
  ipcMain.handle(IPC.HISTORY_APPEND, async (_event, entry: HistoryEntry) => appendHistory(entry))
}
