import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import type { Config } from '../shared/types'

function configDir(): string {
  return process.env.WOV_CONFIG_DIR ?? path.join(os.homedir(), '.config', 'wov-mailer')
}

function configPath(): string {
  return path.join(configDir(), 'config.json')
}

const defaults: Config = {
  airtableToken: '',
  resendApiKey: '',
  senderName: '',
  senderEmail: '',
}

export async function getConfig(): Promise<Config> {
  try {
    const raw = await fs.readFile(configPath(), 'utf-8')
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return { ...defaults }
  }
}

export async function saveConfig(config: Config): Promise<void> {
  await fs.mkdir(configDir(), { recursive: true })
  await fs.writeFile(configPath(), JSON.stringify(config, null, 2), 'utf-8')
}
