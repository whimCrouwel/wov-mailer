import { useEffect, useState } from 'react'
import type { Config } from '../../../shared/types'

export function Settings() {
  const [config, setConfig] = useState<Config>({
    airtableToken: '', resendApiKey: '', senderName: '', senderEmail: '',
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.api.getConfig().then(setConfig)
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    await window.api.saveConfig(config)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ padding: 24, maxWidth: 480 }}>
      <h2>Settings</h2>
      <form onSubmit={handleSave}>
        {([
          ['Airtable Personal Access Token', 'airtableToken', 'password'],
          ['Resend API Key', 'resendApiKey', 'password'],
          ['Sender Name', 'senderName', 'text'],
          ['Sender Email', 'senderEmail', 'email'],
        ] as const).map(([label, key, type]) => (
          <div key={key} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>{label}</label>
            <input
              type={type}
              value={config[key]}
              onChange={e => setConfig(c => ({ ...c, [key]: e.target.value }))}
              style={{ width: '100%', padding: '6px 8px', boxSizing: 'border-box' }}
            />
          </div>
        ))}
        <button type="submit">Save</button>
        {saved && <span style={{ marginLeft: 12, color: 'green' }}>Saved!</span>}
      </form>
    </div>
  )
}
