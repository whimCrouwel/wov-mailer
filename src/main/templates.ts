import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

function templateDir(): string {
  return process.env.WOV_CONFIG_DIR
    ? path.join(process.env.WOV_CONFIG_DIR, 'templates')
    : path.join(os.homedir(), '.config', 'wov-mailer', 'templates')
}

function bundledTemplateDir(): string {
  // In dev: project root /templates/; in prod: two levels up from out/main/
  return path.join(__dirname, '../../templates')
}

export async function ensureDefaultTemplate(): Promise<void> {
  const dir = templateDir()
  await fs.mkdir(dir, { recursive: true })

  // Copy all bundled templates that don't already exist in the user's config dir
  try {
    const srcDir = bundledTemplateDir()
    const files = await fs.readdir(srcDir)
    await Promise.all(
      files.filter(f => f.endsWith('.html')).map(async (file) => {
        const dest = path.join(dir, file)
        try {
          await fs.access(dest)
        } catch {
          const content = await fs.readFile(path.join(srcDir, file), 'utf-8')
          await fs.writeFile(dest, content, 'utf-8')
        }
      })
    )
  } catch {
    // bundled template dir not available (e.g. test env) — skip
  }
}

export async function listTemplates(): Promise<string[]> {
  await ensureDefaultTemplate()
  try {
    const files = await fs.readdir(templateDir())
    return files.filter(f => f.endsWith('.html')).map(f => f.replace('.html', '')).sort()
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
