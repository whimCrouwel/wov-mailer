import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import type { HistoryEntry } from '../shared/types'

function configDir(): string {
  return process.env.WOV_CONFIG_DIR ?? path.join(os.homedir(), '.config', 'wov-mailer')
}

function historyPath(): string {
  return path.join(configDir(), 'history.json')
}

export async function listHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await fs.readFile(historyPath(), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export async function appendHistory(entry: HistoryEntry): Promise<void> {
  const existing = await listHistory()
  const updated = [entry, ...existing]
  await fs.mkdir(configDir(), { recursive: true })
  await fs.writeFile(historyPath(), JSON.stringify(updated, null, 2), 'utf-8')
}
