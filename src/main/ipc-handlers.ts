import { ipcMain } from 'electron'
import { IPC } from '../shared/ipc-channels'
import { getConfig, saveConfig } from './config'
import type { Config } from '../shared/types'

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC.CONFIG_GET, async () => getConfig())
  ipcMain.handle(IPC.CONFIG_SAVE, async (_event, config: Config) => saveConfig(config))
}
