import { ipcMain } from 'electron'
import { randomUUID } from 'crypto'
import pty from 'node-pty'
import os from 'os'
import { IPC } from '../shared/ipc-channels'
import { getConfig, saveConfig } from './config'
import { listHistory, appendHistory, deleteHistory } from './history'
import { listDrafts, saveDraft, deleteDraft } from './drafts'
import { listBases, listTablesWithEmailFields, fetchRecipients, fetchSampleRecipient, fetchFieldValues } from './airtable'
import { listTemplates, getTemplate } from './templates'
import { sendBroadcast } from './resend'
import type { Config, HistoryEntry, DraftEntry, FilterCondition, ComposeState } from '../shared/types'

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC.CONFIG_GET, async () => getConfig())
  ipcMain.handle(IPC.CONFIG_SAVE, async (_event, config: Config) => saveConfig(config))

  ipcMain.handle(IPC.HISTORY_LIST, async () => listHistory())
  ipcMain.handle(IPC.HISTORY_APPEND, async (_event, entry: HistoryEntry) => appendHistory(entry))
  ipcMain.handle(IPC.HISTORY_DELETE, async (_event, id: string) => deleteHistory(id))

  ipcMain.handle(IPC.DRAFT_LIST, async () => listDrafts())
  ipcMain.handle(IPC.DRAFT_SAVE, async (_event, entry: DraftEntry) => saveDraft(entry))
  ipcMain.handle(IPC.DRAFT_DELETE, async (_event, id: string) => deleteDraft(id))

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

  ipcMain.handle(IPC.AIRTABLE_FETCH_SAMPLE, async (_event, baseId: string, tableId: string, emailField: string) => {
    const config = await getConfig()
    return fetchSampleRecipient(config.airtableToken, baseId, tableId, emailField)
  })

  ipcMain.handle(IPC.AIRTABLE_FIELD_VALUES, async (_event, baseId: string, tableId: string, fieldName: string, fieldType?: string) => {
    const config = await getConfig()
    return fetchFieldValues(config.airtableToken, baseId, tableId, fieldName, fieldType)
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
      const nameKeys = ['name', 'Name', '名前', '氏名', 'full_name', 'fullname', 'first_name', 'firstName']
      const savedRecipients = recipients.map(r => {
        const name = nameKeys.map(k => r.mergeData[k]).find(Boolean)
          ?? Object.values(r.mergeData).find(v => v.trim())
          ?? ''
        return { email: r.email, name }
      })
      await appendHistory({
        id: randomUUID(),
        sentAt: new Date().toISOString(),
        subject: compose.subject,
        recipientCount: result.sent,
        status: result.failed === 0 ? 'sent' : 'failed',
        errorMessage: result.errors.join('; ') || undefined,
        compose,
        recipients: savedRecipients,
      })
      return { success: true, ...result }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[ipc SEND_BROADCAST] error:', message)
      return { success: false, error: message, sent: 0, failed: 0, errors: [message] }
    }
  })

  // Only one PTY active at a time — reuse or kill on create
  let activePty: ReturnType<typeof pty.spawn> | null = null
  let activeOnInput: ((_e: Electron.IpcMainEvent, input: string) => void) | null = null
  let activeOnResize: ((_e: Electron.IpcMainEvent, cols: number, rows: number) => void) | null = null

  const teardownTerminal = () => {
    if (activeOnInput) { ipcMain.removeListener('terminal:input', activeOnInput); activeOnInput = null }
    if (activeOnResize) { ipcMain.removeListener('terminal:resize', activeOnResize); activeOnResize = null }
    if (activePty) { try { activePty.kill() } catch {} activePty = null }
  }

  ipcMain.on('terminal:create', (event) => {
    teardownTerminal()

    const shell = os.platform() === 'win32' ? 'powershell.exe' : process.env.SHELL ?? '/bin/zsh'
    try {
      activePty = pty.spawn(shell, [], {
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

    const ptyProcess = activePty
    ptyProcess.onData(data => event.sender.send('terminal:data', data))

    activeOnInput = (_e, input) => ptyProcess.write(input)
    activeOnResize = (_e, cols, rows) => ptyProcess.resize(cols, rows)

    ipcMain.on('terminal:input', activeOnInput)
    ipcMain.on('terminal:resize', activeOnResize)

    event.sender.on('destroyed', teardownTerminal)
  })

  ipcMain.on('terminal:destroy', teardownTerminal)
}
