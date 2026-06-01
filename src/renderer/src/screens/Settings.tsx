import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Separator } from '../components/ui/separator'
import { CheckCircle2, KeyRound, Mail, User } from 'lucide-react'
import type { Config } from '../../../shared/types'

const FIELDS: {
  label: string
  key: keyof Config
  type: 'text' | 'password' | 'email'
  icon: React.ComponentType<{ className?: string }>
  placeholder: string
}[] = [
  { label: 'Airtable Personal Access Token', key: 'airtableToken', type: 'password', icon: KeyRound, placeholder: 'pat...' },
  { label: 'Resend API Key', key: 'resendApiKey', type: 'password', icon: KeyRound, placeholder: 're_...' },
  { label: 'Sender Name', key: 'senderName', type: 'text', icon: User, placeholder: 'Your Name' },
  { label: 'Sender Email', key: 'senderEmail', type: 'email', icon: Mail, placeholder: 'you@example.com' },
]

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
    <div className="p-8 max-w-xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-100">Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">Configure your API keys and sender details.</p>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-4">
          <CardTitle className="text-base text-zinc-200">API Configuration</CardTitle>
          <CardDescription className="text-zinc-500">
            These credentials are stored locally on your machine.
          </CardDescription>
        </CardHeader>
        <Separator className="bg-zinc-800" />
        <CardContent className="pt-6">
          <form onSubmit={handleSave} className="space-y-5">
            {FIELDS.map(({ label, key, type, icon: Icon, placeholder }) => (
              <div key={key} className="space-y-2">
                <Label className="text-zinc-300 flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-zinc-500" />
                  {label}
                </Label>
                <Input
                  type={type}
                  value={config[key]}
                  onChange={e => setConfig(c => ({ ...c, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-500"
                />
              </div>
            ))}

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200">
                Save Settings
              </Button>
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Saved!
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
