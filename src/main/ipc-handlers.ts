import { ipcMain } from 'electron'
import { randomUUID } from 'crypto'
import pty from 'node-pty'
import os from 'os'
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
    try {
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
      return { success: true, ...result }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[ipc SEND_BROADCAST] error:', message)
      return { success: false, error: message, sent: 0, failed: 0, errors: [message] }
    }
  })

  ipcMain.on('terminal:create', (event) => {
    const shell = os.platform() === 'win32' ? 'powershell.exe' : process.env.SHELL ?? '/bin/zsh'

    let ptyProcess: ReturnType<typeof pty.spawn>
    try {
      ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 24,
        cwd: os.homedir(),
        env: process.env as Record<string, string>,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[terminal:create] spawn failed:', message)
      event.sender.send('terminal:data', `\r\nFailed to start terminal: ${message}\r\n`)
      return
    }

    ptyProcess.onData(data => event.sender.send('terminal:data', data))

    const onInput = (_e: Electron.IpcMainEvent, input: string) => ptyProcess.write(input)
    const onResize = (_e: Electron.IpcMainEvent, cols: number, rows: number) => ptyProcess.resize(cols, rows)

    ipcMain.on('terminal:input', onInput)
    ipcMain.on('terminal:resize', onResize)

    event.sender.on('destroyed', () => {
      ipcMain.removeListener('terminal:input', onInput)
      ipcMain.removeListener('terminal:resize', onResize)
      ptyProcess.kill()
    })
  })
}
