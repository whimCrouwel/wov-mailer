import { ipcMain } from 'electron'
import { IPC } from '../shared/ipc-channels'
import { getConfig, saveConfig } from './config'
import { listHistory, appendHistory } from './history'
import { listBases, listTablesWithEmailFields, fetchRecipients } from './airtable'
import type { Config, HistoryEntry, FilterCondition } from '../shared/types'

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC.CONFIG_GET, async () => getConfig())
  ipcMain.handle(IPC.CONFIG_SAVE, async (_event, config: Config) => saveConfig(config))

  ipcMain.handle(IPC.HISTORY_LIST, async () => listHistory())
  ipcMain.handle(IPC.HISTORY_APPEND, async (_event, entry: HistoryEntry) => appendHistory(entry))

  ipcMain.handle(IPC.AIRTABLE_LIST_BASES, async () => {
    const config = await getConfig()
    return listBases(config.airtableToken)
  })

  ipcMain.handle(IPC.AIRTABLE_LIST_TABLES, async (_event, baseId: string) => {
    const config = await getConfig()
    return listTablesWithEmailFields(config.airtableToken, baseId)
  })

  ipcMain.handle(IPC.AIRTABLE_PREVIEW_RECIPIENTS, async (
    _event, baseId: string, tableId: string, emailField: string, filters: FilterCondition[]
  ) => {
    const config = await getConfig()
    const recipients = await fetchRecipients(config.airtableToken, baseId, tableId, emailField, filters)
    return { count: recipients.length, sample: recipients.slice(0, 3).map(r => r.email) }
  })

  ipcMain.handle(IPC.AIRTABLE_FETCH_RECIPIENTS, async (
    _event, baseId: string, tableId: string, emailField: string, filters: FilterCondition[]
  ) => {
    const config = await getConfig()
    return fetchRecipients(config.airtableToken, baseId, tableId, emailField, filters)
  })
}
