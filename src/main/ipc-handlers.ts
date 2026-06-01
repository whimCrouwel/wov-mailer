import { ipcMain } from 'electron'
import { randomUUID } from 'crypto'
import { IPC } from '../shared/ipc-channels'
import { getConfig, saveConfig } from './config'
import { listHistory, appendHistory } from './history'
import { listBases, listTablesWithEmailFields, fetchRecipients } from './airtable'
import { listTemplates, getTemplate } from './templates'
import { sendBroadcast } from './resend'
import type { Config, HistoryEntry, FilterCondition, ComposeState } from '../shared/types'

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

  ipcMain.handle(IPC.TEMPLATES_LIST, async () => listTemplates())
  ipcMain.handle(IPC.TEMPLATES_GET, async (_event, name: string) => getTemplate(name))

  ipcMain.handle(IPC.SEND_BROADCAST, async (_event, compose: ComposeState) => {
    const config = await getConfig()
    const recipients = await fetchRecipients(
      config.airtableToken, compose.baseId, compose.tableId, compose.emailField, compose.filters
    )
    const result = await sendBroadcast(
      config.resendApiKey, config.senderName, config.senderEmail, recipients, compose
    )
    await appendHistory({
      id: randomUUID(),
      sentAt: new Date().toISOString(),
      subject: compose.subject,
      recipientCount: result.sent,
      status: result.failed === 0 ? 'sent' : 'failed',
      errorMessage: result.errors.join('; ') || undefined,
      compose,
    })
    return result
  })
}
