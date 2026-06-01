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
- Vitest — tests (21 passing)

## Local config at runtime
~/.config/wov-mailer/config.json  — API keys, sender name/email
~/.config/wov-mailer/history.json — past broadcast log
~/.config/wov-mailer/templates/   — HTML email templates

## Key source files
| File | Purpose |
|------|---------|
| src/main/index.ts | Electron entry, window creation |
| src/main/ipc-handlers.ts | All IPC: config, history, airtable, templates, send, terminal |
| src/main/mcp-server.ts | MCP HTTP server, 10 tools (no send tool) |
| src/main/resend.ts | sendBroadcast — individual sends, checks {data,error} from SDK v3 |
| src/main/airtable.ts | listBases, listTablesWithEmailFields, fetchRecipients |
| src/main/config.ts | read/write config.json |
| src/main/history.ts | read/write history.json |
| src/main/templates.ts | list/get/render HTML templates |
| src/shared/types.ts | Shared types: Config, ComposeState, HistoryEntry, etc. |
| src/shared/ipc-channels.ts | IPC channel constants |
| src/preload/index.ts | contextBridge — window.api |
| src/renderer/src/App.tsx | Sidebar nav + screen routing + terminal toggle |
| src/renderer/src/screens/Compose.tsx | Full compose flow (step-by-step cards) |
| src/renderer/src/screens/History.tsx | Past broadcasts + Clone button |
| src/renderer/src/screens/Settings.tsx | API keys form |
| src/renderer/src/components/Terminal.tsx | xterm.js panel |
| src/renderer/src/env.d.ts | Window.api type declarations |
| templates/default.html | Default email template (Whim on Vim branded) |

## Dev commands
```bash
npm run dev       # start in dev mode
npm run build     # build
npm test          # run tests (21 passing)
```

## Known gotchas
- node-pty is a native addon — must be rebuilt for Electron's ABI after `npm install`
  Handled by: `npm run postinstall` → `electron-rebuild -f -w node-pty`
- Resend SDK v3 returns `{ data, error }`, does NOT throw on failure — always check `.error`
- Airtable token needs scopes: `data.records:read` + `schema.bases:read`
- Sender email domain must be verified in Resend dashboard before first send

## Out of scope for v1
- Newsletter/drip sequences
- Scheduling (send at specific time)
- Open rate / click tracking
- Retry failed sends from History
- Multi-user / team access
