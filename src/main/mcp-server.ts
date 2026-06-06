import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { createServer } from 'http'
import { z } from 'zod'
import type { BrowserWindow } from 'electron'
import { getConfig } from './config'
import { listBases, listTablesWithEmailFields, fetchRecipients } from './airtable'
import { listTemplates } from './templates'
import { listDrafts, saveDraft, deleteDraft } from './drafts'
import { IPC } from '../shared/ipc-channels'
import type { ComposeState, FilterCondition } from '../shared/types'
import { randomUUID } from 'crypto'

let mcpState: Partial<ComposeState> = {}

function pushState(win: BrowserWindow) {
  win.webContents.send(IPC.MCP_STATE_UPDATE, mcpState)
}

export async function startMcpServer(win: BrowserWindow, port = 3741): Promise<void> {
  const server = new McpServer({ name: 'wov-mailer', version: '1.0.0' })

  server.resource(
    'context',
    'wov-mailer://context',
    async (uri) => {
      const config = await getConfig()
      const bases = await listBases(config.airtableToken)
      const tablesByBase: Record<string, { id: string; name: string; emailField: string }[]> = {}
      await Promise.all(
        bases.map(async (base) => {
          const tables = await listTablesWithEmailFields(config.airtableToken, base.id)
          tablesByBase[base.id] = tables.map(t => ({ id: t.id, name: t.name, emailField: t.emailField }))
        })
      )
      const templates = await listTemplates()
      return {
        contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify({ bases, tablesByBase, templates }, null, 2) }],
      }
    }
  )

  server.tool(
    'list_bases',
    'List all Airtable bases available. Call this first to discover which bases contain contact data for broadcasts.',
    {},
    async () => {
      const config = await getConfig()
      const bases = await listBases(config.airtableToken)
      return { content: [{ type: 'text' as const, text: JSON.stringify(bases, null, 2) }] }
    }
  )

  server.tool(
    'select_base',
    'Select an Airtable base as the data source for recipients. Must be called before select_table.',
    { baseId: z.string(), baseLabel: z.string().optional() },
    async ({ baseId, baseLabel }) => {
      mcpState = { ...mcpState, baseId, baseLabel: baseLabel ?? baseId, tableId: '', emailField: '', filters: [] }
      pushState(win)
      return { content: [{ type: 'text' as const, text: `Base selected: ${baseId}` }] }
    }
  )

  server.tool(
    'list_tables',
    'List all tables in the selected base that have an email field. Call this after select_base to discover valid tableIds for select_table.',
    {},
    async () => {
      if (!mcpState.baseId) return { content: [{ type: 'text' as const, text: 'Error: no base selected. Call select_base first.' }] }
      const config = await getConfig()
      const tables = await listTablesWithEmailFields(config.airtableToken, mcpState.baseId)
      if (tables.length === 0) return { content: [{ type: 'text' as const, text: 'No tables with email fields found in this base.' }] }
      const lines = tables.map(t => `id: ${t.id}  name: ${t.name}  emailField: ${t.emailField}`)
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] }
    }
  )

  server.tool(
    'select_table',
    'Select a table within the chosen base. Only tables with an email field are valid. This also auto-detects the email field.',
    { tableId: z.string(), tableLabel: z.string().optional() },
    async ({ tableId, tableLabel }) => {
      if (!mcpState.baseId) return { content: [{ type: 'text' as const, text: 'Error: no base selected' }] }
      const config = await getConfig()
      const tables = await listTablesWithEmailFields(config.airtableToken, mcpState.baseId)
      const table = tables.find(t => t.id === tableId)
      if (!table) return { content: [{ type: 'text' as const, text: `Table ${tableId} not found or has no email field` }] }
      mcpState = { ...mcpState, tableId, tableLabel: tableLabel ?? table.name, emailField: table.emailField, filters: [] }
      pushState(win)
      return { content: [{ type: 'text' as const, text: `Table selected: ${table.name}, email field: ${table.emailField}` }] }
    }
  )

  server.tool(
    'add_filter',
    'Add a filter condition to narrow down recipients. Multiple filters are combined with AND logic. Use preview_recipients to check the count after adding filters.',
    {
      field: z.string(),
      fieldType: z.string(),
      operator: z.enum(['equals', 'not_equals', 'contains', 'gt', 'lt']),
      value: z.string(),
    },
    async (filter) => {
      const newFilter: FilterCondition = filter
      mcpState = { ...mcpState, filters: [...(mcpState.filters ?? []), newFilter] }
      pushState(win)
      return { content: [{ type: 'text' as const, text: `Filter added: ${filter.field} ${filter.operator} ${filter.value}` }] }
    }
  )

  server.tool(
    'clear_filters',
    'Remove all active recipient filters. Use this to reset to all recipients in the selected table.',
    {},
    async () => {
      mcpState = { ...mcpState, filters: [] }
      pushState(win)
      return { content: [{ type: 'text' as const, text: 'Filters cleared' }] }
    }
  )

  server.tool(
    'setup_recipients',
    'Set base, table, and optional filters in one atomic call. Returns recipient count and one sample email. Use instead of select_base → select_table → add_filter sequence.',
    {
      baseId: z.string(),
      tableId: z.string(),
      filters: z.array(z.object({
        field: z.string(),
        fieldType: z.string(),
        operator: z.enum(['equals', 'not_equals', 'contains', 'gt', 'lt']),
        value: z.string(),
      })).optional(),
    },
    async ({ baseId, tableId, filters }) => {
      const config = await getConfig()
      const [bases, tables] = await Promise.all([
        listBases(config.airtableToken),
        listTablesWithEmailFields(config.airtableToken, baseId),
      ])
      const table = tables.find(t => t.id === tableId)
      if (!table) {
        return { content: [{ type: 'text' as const, text: `Error: table ${tableId} not found or has no email field` }] }
      }
      const base = bases.find(b => b.id === baseId)
      const resolvedFilters = (filters ?? []) as FilterCondition[]
      mcpState = {
        ...mcpState,
        baseId,
        baseLabel: base?.name ?? baseId,
        tableId,
        tableLabel: table.name,
        emailField: table.emailField,
        filters: resolvedFilters,
      }
      pushState(win)
      const recipients = await fetchRecipients(config.airtableToken, baseId, tableId, table.emailField, resolvedFilters)
      const sample = recipients[0]?.email ?? 'none'
      return { content: [{ type: 'text' as const, text: JSON.stringify({ recipients: recipients.length, sample }) }] }
    }
  )

  server.tool(
    'setup_content',
    'Set template, subject, and body in one atomic call. Safe to call in parallel with setup_recipients. Use instead of select_template → set_subject → set_body sequence.',
    {
      templateName: z.string(),
      subject: z.string(),
      body: z.string(),
    },
    async ({ templateName, subject, body }) => {
      mcpState = { ...mcpState, templateName, subject, body }
      pushState(win)
      return { content: [{ type: 'text' as const, text: 'ok' }] }
    }
  )

  server.tool(
    'preview_recipients',
    'Show the total recipient count and a sample of email addresses for the current base/table/filter selection. Use this to verify the audience before composing.',
    {},
    async () => {
      const { baseId, tableId, emailField, filters } = mcpState
      if (!baseId || !tableId || !emailField) {
        return { content: [{ type: 'text' as const, text: 'Error: select a base and table first' }] }
      }
      const config = await getConfig()
      const recipients = await fetchRecipients(config.airtableToken, baseId, tableId, emailField, filters ?? [])
      const sample = recipients.slice(0, 3).map(r => r.email)
      return { content: [{ type: 'text' as const, text: `${recipients.length} recipients. Sample: ${sample.join(', ')}` }] }
    }
  )

  server.tool(
    'set_subject',
    'Set the email subject line for the broadcast.',
    { subject: z.string() },
    async ({ subject }) => {
      mcpState = { ...mcpState, subject }
      pushState(win)
      return { content: [{ type: 'text' as const, text: `Subject set: ${subject}` }] }
    }
  )

  server.tool(
    'set_body',
    'Set the email body content in Markdown. Use {{fieldName}} placeholders to insert Airtable field values per recipient (e.g. {{Name}}, {{Company}}).',
    { markdown: z.string() },
    async ({ markdown }) => {
      mcpState = { ...mcpState, body: markdown }
      pushState(win)
      return { content: [{ type: 'text' as const, text: 'Body updated' }] }
    }
  )

  server.tool(
    'list_templates',
    'List available HTML email templates. Use select_template to apply one. Templates wrap the body content and control the visual layout.',
    {},
    async () => {
      const templates = await listTemplates()
      return { content: [{ type: 'text' as const, text: templates.join('\n') }] }
    }
  )

  server.tool(
    'select_template',
    'Apply an HTML email template by name (from list_templates). The template wraps the body and determines the visual design of the email.',
    { templateName: z.string() },
    async ({ templateName }) => {
      mcpState = { ...mcpState, templateName }
      pushState(win)
      return { content: [{ type: 'text' as const, text: `Template selected: ${templateName}` }] }
    }
  )

  server.tool(
    'set_marketing',
    'Toggle marketing mode. ON: adds an unsubscribe link to the email footer and applies Resend suppression list filtering. OFF: transactional send with no unsubscribe link.',
    { isMarketing: z.boolean() },
    async ({ isMarketing }) => {
      mcpState = { ...mcpState, isMarketing }
      pushState(win)
      return { content: [{ type: 'text' as const, text: `Marketing mode: ${isMarketing ? 'on (unsubscribe link + suppression filter)' : 'off (transactional, no unsubscribe)'}` }] }
    }
  )

  server.tool(
    'list_drafts',
    'List all saved broadcast drafts with their IDs and subjects. Use load_draft to restore one.',
    {},
    async () => {
      const drafts = await listDrafts()
      if (drafts.length === 0) return { content: [{ type: 'text' as const, text: 'No drafts saved.' }] }
      const lines = drafts.map(d =>
        `[${d.id}] "${d.compose.subject || 'Untitled'}" — saved ${new Date(d.savedAt).toLocaleString()}`
      )
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] }
    }
  )

  server.tool(
    'save_draft',
    'Save the current compose state as a draft. If the current state already has a draft ID it will overwrite that draft; otherwise a new draft is created.',
    {},
    async () => {
      const id = mcpState.draftId ?? randomUUID()
      const entry = {
        id,
        savedAt: new Date().toISOString(),
        compose: { ...mcpState, draftId: id } as ComposeState,
      }
      await saveDraft(entry)
      mcpState = { ...mcpState, draftId: id }
      pushState(win)
      return { content: [{ type: 'text' as const, text: `Draft saved: ${id} ("${mcpState.subject || 'Untitled'}")` }] }
    }
  )

  server.tool(
    'load_draft',
    'Restore a previously saved draft by ID (from list_drafts). This replaces the current compose state with the draft.',
    { draftId: z.string() },
    async ({ draftId }) => {
      const drafts = await listDrafts()
      const draft = drafts.find(d => d.id === draftId)
      if (!draft) return { content: [{ type: 'text' as const, text: `Draft not found: ${draftId}` }] }
      mcpState = { ...draft.compose }
      pushState(win)
      return { content: [{ type: 'text' as const, text: `Draft loaded: "${draft.compose.subject || 'Untitled'}"` }] }
    }
  )

  server.tool(
    'delete_draft',
    'Permanently delete a saved draft by ID.',
    { draftId: z.string() },
    async ({ draftId }) => {
      await deleteDraft(draftId)
      if (mcpState.draftId === draftId) mcpState = { ...mcpState, draftId: undefined }
      return { content: [{ type: 'text' as const, text: `Draft deleted: ${draftId}` }] }
    }
  )

  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => randomUUID() })

  const httpServer = createServer(async (req, res) => {
    try {
      if (req.method === 'POST') {
        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk as Buffer)
        const raw = Buffer.concat(chunks).toString('utf-8')
        const parsedBody = raw ? JSON.parse(raw) : undefined
        await transport.handleRequest(req, res, parsedBody)
      } else {
        await transport.handleRequest(req, res)
      }
    } catch (err) {
      console.error('[mcp] error:', err)
      if (!res.headersSent) res.writeHead(500).end(String(err))
    }
  })

  await server.connect(transport)
  httpServer.listen(port, '127.0.0.1', () => {
    console.log(`MCP server listening on http://127.0.0.1:${port}`)
  })
}
