# wov-mailer — CLAUDE.md

## What this is
Electron desktop app for sending one-off broadcast emails.
- Reads recipients from Airtable (read-only)
- Sends via Resend (individual sends per recipient, suppression list handles unsubscribes)
- Embedded Claude Code terminal backed by a local MCP server (port 3741)
- Human must manually confirm before any email is sent — no MCP send tool

## Design spec & plan
- Spec: `/Users/labomba/Dropbox/superpowers/specs/2026-06-01-email-marketing-design.md`
- Plan: `/Users/labomba/Dropbox/superpowers/plans/2026-06-01-wov-mailer.md`

## Stack
- Electron 28 + electron-vite + React 18 + TypeScript
- Tailwind CSS v3 + shadcn/ui (Radix UI primitives) — dark zinc theme
- node-pty + xterm.js for embedded terminal
- @modelcontextprotocol/sdk — MCP HTTP server
- Resend Node SDK v3 — email delivery
- airtable.js — Airtable client (read-only)
- electron-builder — macOS DMG packaging
- Vitest — tests (21 passing)

## Local config at runtime
```
~/.config/wov-mailer/config.json   — API keys, sender name/email
~/.config/wov-mailer/history.json  — past broadcast log
~/.config/wov-mailer/templates/    — HTML email templates (copied from bundled templates on first launch)
```

## Dev commands
```bash
npm run dev    # start in dev mode
npm run build  # compile only (no packaging)
npm run dist   # build + package → dist/*.dmg
npm test       # run tests (21 passing)
```

## Key source files
| File | Purpose |
|------|---------|
| src/main/index.ts | Electron entry, window creation |
| src/main/ipc-handlers.ts | All IPC: config, history, airtable, templates, send, terminal |
| src/main/mcp-server.ts | MCP HTTP server port 3741, 10 tools (no send tool) |
| src/main/resend.ts | sendBroadcast — individual sends, checks {data,error} from SDK v3 |
| src/main/airtable.ts | listBases, listTablesWithEmailFields, fetchRecipients, fetchSampleRecipient, fetchFieldValues |
| src/main/config.ts | read/write config.json |
| src/main/history.ts | read/write/delete history.json |
| src/main/templates.ts | list/get/render HTML templates, copies bundled templates on first run |
| src/shared/types.ts | Shared types: Config, ComposeState, HistoryEntry, etc. |
| src/shared/ipc-channels.ts | IPC channel constants |
| src/preload/index.ts | contextBridge — window.api |
| src/renderer/src/App.tsx | Sidebar nav + screen routing + terminal toggle (starts on Compose) |
| src/renderer/src/screens/Compose.tsx | Full compose flow (step-by-step cards) |
| src/renderer/src/screens/History.tsx | Past broadcasts + Clone + Delete + View recipients |
| src/renderer/src/screens/Settings.tsx | API keys form |
| src/renderer/src/components/Terminal.tsx | xterm.js panel |
| src/renderer/src/components/compose/FilterBuilder.tsx | Condition builder with async value dropdowns |
| src/renderer/src/components/compose/MarkdownEditor.tsx | Markdown textarea with @ field picker |
| src/renderer/src/components/compose/EmailPreview.tsx | iframe preview with first-row sample data |
| src/renderer/src/components/compose/RecipientListDialog.tsx | Modal showing full name+email list |
| src/renderer/src/env.d.ts | Window.api type declarations |
| templates/*.html | Bundled email templates (minimal, newsletter, promo, announcement, default) |

## Email templates
Five bundled templates in `templates/` — all table-based HTML, safe across Gmail/Outlook/Apple Mail:
- **minimal** — white card, thin black bar (default)
- **newsletter** — dark zinc background, purple accents
- **promo** — white card, purple gradient hero header
- **announcement** — white with green accent bar, serif body font
- **default** — original simple layout

Templates are copied to `~/.config/wov-mailer/templates/` on first launch. Existing files are never overwritten, so user customizations are safe. Users can add their own `.html` files there.

## Compose features
- **@ field picker** — type `@` in body editor to insert `{{fieldName}}` from a dropdown
- **Live preview** — shows first Airtable row as sample data; renders `{{name}}` etc. with real values
- **Filter values** — filter value input fetches all distinct values from the column as a Select dropdown
- **Checkbox filters** — shows "Yes (checked)" / "No (unchecked)"; formula uses `TRUE()` / `FALSE()`
- **Recipient count** — live count updates as filters change
- **View list** — button opens modal with full name + email list for current filters

## History features
- **Clone** — opens past broadcast in Compose pre-filled
- **View list** — same recipient modal, using stored filters
- **Delete** — removes entry from history.json immediately

## MCP server (port 3741)
Register once with: `claude mcp add wov-mailer --transport http http://127.0.0.1:3741 --scope user`

Tools: `list_bases`, `select_base`, `select_table`, `add_filter`, `clear_filters`,
`preview_recipients`, `set_subject`, `set_body`, `list_templates`, `select_template`

All tool calls live-update the Compose screen. No `send` tool — sending is always manual.

## Packaging (macOS)
```bash
npm run dist
# → dist/wov-mailer-0.1.0-arm64.dmg  (Apple Silicon)
# → dist/wov-mailer-0.1.0.dmg        (Intel)
```
App is ad-hoc signed (no Apple Developer cert). First launch: right-click → Open → Open to bypass Gatekeeper.

## Known gotchas
- node-pty is a native addon — rebuilt automatically by electron-builder during `npm run dist`
  In dev: `npm run postinstall` → `electron-rebuild -f -w node-pty`
- Resend SDK v3 returns `{ data, error }`, does NOT throw on failure — always check `.error`
- Airtable token needs scopes: `data.records:read` + `schema.bases:read`
- Sender email domain must be verified in Resend dashboard before first send
- MCP server only runs while the app is open

## Out of scope for v1
- Newsletter/drip sequences
- Scheduling (send at specific time)
- Open rate / click tracking
- Retry failed sends from History
- Multi-user / team access
