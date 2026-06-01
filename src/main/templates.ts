import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

function templateDir(): string {
  return process.env.WOV_CONFIG_DIR
    ? path.join(process.env.WOV_CONFIG_DIR, 'templates')
    : path.join(os.homedir(), '.config', 'wov-mailer', 'templates')
}

function defaultTemplateSrc(): string {
  // In dev: relative to src/main/; in prod: relative to out/main/
  return path.join(__dirname, '../../templates/default.html')
}

export async function ensureDefaultTemplate(): Promise<void> {
  const dir = templateDir()
  const dest = path.join(dir, 'default.html')
  await fs.mkdir(dir, { recursive: true })
  try {
    await fs.access(dest)
  } catch {
    try {
      const src = await fs.readFile(defaultTemplateSrc(), 'utf-8')
      await fs.writeFile(dest, src, 'utf-8')
    } catch {
      // defaultTemplateSrc not available (e.g. in test env) — skip
    }
  }
}

export async function listTemplates(): Promise<string[]> {
  await ensureDefaultTemplate()
  try {
    const files = await fs.readdir(templateDir())
    return files.filter(f => f.endsWith('.html')).map(f => f.replace('.html', ''))
  } catch {
    return []
  }
}

export async function getTemplate(name: string): Promise<string> {
  const filePath = path.join(templateDir(), `${name}.html`)
  return fs.readFile(filePath, 'utf-8')
}

export async function renderTemplate(templateName: string, bodyHtml: string, unsubscribeUrl: string): Promise<string> {
  const template = await getTemplate(templateName)
  return template
    .replace('{{BODY}}', bodyHtml)
    .replace('{{UNSUBSCRIBE_URL}}', unsubscribeUrl)
}
