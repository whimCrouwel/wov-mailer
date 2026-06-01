import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

const testDir = path.join(os.tmpdir(), `wov-mailer-test-${Date.now()}`)
process.env.WOV_CONFIG_DIR = testDir

import { getConfig, saveConfig } from '../../src/main/config'

describe('config', () => {
  beforeEach(() => fs.mkdir(testDir, { recursive: true }))
  afterEach(() => fs.rm(testDir, { recursive: true, force: true }))

  it('returns empty defaults when no config file exists', async () => {
    const config = await getConfig()
    expect(config.airtableToken).toBe('')
    expect(config.resendApiKey).toBe('')
    expect(config.senderName).toBe('')
    expect(config.senderEmail).toBe('')
  })

  it('saves and loads config', async () => {
    await saveConfig({ airtableToken: 'tok', resendApiKey: 'rk', senderName: 'Vim', senderEmail: 'vim@wov.com' })
    const config = await getConfig()
    expect(config.airtableToken).toBe('tok')
    expect(config.senderEmail).toBe('vim@wov.com')
  })
})
