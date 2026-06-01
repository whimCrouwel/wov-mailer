import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

const testDir = path.join(os.tmpdir(), `wov-mailer-history-test-${Date.now()}`)
process.env.WOV_CONFIG_DIR = testDir

import { listHistory, appendHistory } from '../../src/main/history'
import type { HistoryEntry } from '../../src/shared/types'

const entry: HistoryEntry = {
  id: '1',
  sentAt: '2026-06-01T00:00:00Z',
  subject: 'Test',
  recipientCount: 5,
  status: 'sent',
  compose: {
    baseId: 'b1', baseLabel: 'Base', tableId: 't1', tableLabel: 'Table',
    emailField: 'email', filters: [], templateName: 'default',
    subject: 'Test', body: '# Hello',
  },
}

describe('history', () => {
  beforeEach(() => fs.mkdir(testDir, { recursive: true }))
  afterEach(() => fs.rm(testDir, { recursive: true, force: true }))

  it('returns empty array when no history file exists', async () => {
    expect(await listHistory()).toEqual([])
  })

  it('appends an entry and retrieves it', async () => {
    await appendHistory(entry)
    const list = await listHistory()
    expect(list).toHaveLength(1)
    expect(list[0].subject).toBe('Test')
  })

  it('prepends new entries (most recent first)', async () => {
    await appendHistory({ ...entry, id: '1', subject: 'First' })
    await appendHistory({ ...entry, id: '2', subject: 'Second' })
    const list = await listHistory()
    expect(list[0].subject).toBe('Second')
  })
})
