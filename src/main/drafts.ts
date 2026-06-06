import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import type { DraftEntry } from '../shared/types'

function configDir(): string {
  return process.env.WOV_CONFIG_DIR ?? path.join(os.homedir(), '.config', 'wov-mailer')
}

function draftsPath(): string {
  return path.join(configDir(), 'drafts.json')
}

export async function listDrafts(): Promise<DraftEntry[]> {
  try {
    const raw = await fs.readFile(draftsPath(), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export async function saveDraft(entry: DraftEntry): Promise<void> {
  const existing = await listDrafts()
  const idx = existing.findIndex(d => d.id === entry.id)
  const updated = idx >= 0
    ? existing.map(d => d.id === entry.id ? entry : d)
    : [entry, ...existing]
  await fs.mkdir(configDir(), { recursive: true })
  await fs.writeFile(draftsPath(), JSON.stringify(updated, null, 2), 'utf-8')
}

export async function deleteDraft(id: string): Promise<void> {
  const existing = await listDrafts()
  const updated = existing.filter(d => d.id !== id)
  await fs.mkdir(configDir(), { recursive: true })
  await fs.writeFile(draftsPath(), JSON.stringify(updated, null, 2), 'utf-8')
}
