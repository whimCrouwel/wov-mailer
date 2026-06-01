import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { createServer } from 'http'
import { z } from 'zod'
import type { BrowserWindow } from 'electron'
import { getConfig } from './config'
import { listBases, listTablesWithEmailFields, fetchRecipients } from './airtable'
import { listTemplates } from './templates'
import { IPC } from '../shared/ipc-channels'
import type { ComposeState, FilterCondition } from '../shared/types'

let mcpState: Partial<ComposeState> = {}

function pushState(win: BrowserWindow) {
  win.webContents.send(IPC.MCP_STATE_UPDATE, mcpState)
}

export function startMcpServer(win: BrowserWindow, port = 3741): void {
  const server = new McpServer({ name: 'wov-mailer', version: '1.0.0' })

  server.tool('list_bases', {}, async () => {
    const config = await getConfig()
    const bases = await listBases(config.airtableToken)
    return { content: [{ type: 'text' as const, text: JSON.stringify(bases, null, 2) }] }
  })

  server.tool('select_base', { baseId: z.string(), baseLabel: z.string().optional() }, async ({ baseId, baseLabel }) => {
    mcpState = { ...mcpState, baseId, baseLabel: baseLabel ?? baseId, tableId: '', emailField: '', filters: [] }
    pushState(win)
    return { content: [{ type: 'text' as const, text: `Base selected: ${baseId}` }] }
  })

  server.tool('select_table', { tableId: z.string(), tableLabel: z.string().optional() }, async ({ tableId, tableLabel }) => {
    if (!mcpState.baseId) return { content: [{ type: 'text' as const, text: 'Error: no base selected' }] }
    const config = await getConfig()
    const tables = await listTablesWithEmailFields(config.airtableToken, mcpState.baseId)
    const table = tables.find(t => t.id === tableId)
    if (!table) return { content: [{ type: 'text' as const, text: `Table ${tableId} not found or has no email field` }] }
    mcpState = { ...mcpState, tableId, tableLabel: tableLabel ?? table.name, emailField: table.emailField, filters: [] }
    pushState(win)
    return { content: [{ type: 'text' as const, text: `Table selected: ${table.name}, email field: ${table.emailField}` }] }
  })

  server.tool('add_filter', {
    field: z.string(),
    fieldType: z.string(),
    operator: z.enum(['equals', 'contains', 'gt', 'lt']),
    value: z.string(),
  }, async (filter) => {
    const newFilter: FilterCondition = filter
    mcpState = { ...mcpState, filters: [...(mcpState.filters ?? []), newFilter] }
    pushState(win)
    return { content: [{ type: 'text' as const, text: `Filter added: ${filter.field} ${filter.operator} ${filter.value}` }] }
  })

  server.tool('clear_filters', {}, async () => {
    mcpState = { ...mcpState, filters: [] }
    pushState(win)
    return { content: [{ type: 'text' as const, text: 'Filters cleared' }] }
  })

  server.tool('preview_recipients', {}, async () => {
    const { baseId, tableId, emailField, filters } = mcpState
    if (!baseId || !tableId || !emailField) {
      return { content: [{ type: 'text' as const, text: 'Error: select a base and table first' }] }
    }
    const config = await getConfig()
    const recipients = await fetchRecipients(config.airtableToken, baseId, tableId, emailField, filters ?? [])
    const sample = recipients.slice(0, 3).map(r => r.email)
    return { content: [{ type: 'text' as const, text: `${recipients.length} recipients. Sample: ${sample.join(', ')}` }] }
  })

  server.tool('set_subject', { subject: z.string() }, async ({ subject }) => {
    mcpState = { ...mcpState, subject }
    pushState(win)
    return { content: [{ type: 'text' as const, text: `Subject set: ${subject}` }] }
  })

  server.tool('set_body', { markdown: z.string() }, async ({ markdown }) => {
    mcpState = { ...mcpState, body: markdown }
    pushState(win)
    return { content: [{ type: 'text' as const, text: 'Body updated' }] }
  })

  server.tool('list_templates', {}, async () => {
    const templates = await listTemplates()
    return { content: [{ type: 'text' as const, text: templates.join('\n') }] }
  })

  server.tool('select_template', { templateName: z.string() }, async ({ templateName }) => {
    mcpState = { ...mcpState, templateName }
    pushState(win)
    return { content: [{ type: 'text' as const, text: `Template selected: ${templateName}` }] }
  })

  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
  const httpServer = createServer((req, res) => transport.handleRequest(req, res))

  server.connect(transport)
  httpServer.listen(port, '127.0.0.1', () => {
    console.log(`MCP server listening on http://127.0.0.1:${port}`)
  })
}
