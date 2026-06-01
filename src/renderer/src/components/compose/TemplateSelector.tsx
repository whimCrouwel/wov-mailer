import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Label } from '../ui/label'

interface Props {
  value: string
  onChange: (name: string) => void
}

export function TemplateSelector({ value, onChange }: Props) {
  const [templates, setTemplates] = useState<string[]>([])

  useEffect(() => {
    window.api.listTemplates().then(setTemplates)
  }, [])

  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-zinc-500">HTML Template</Label>
      <Select
        value={value || undefined}
        onValueChange={onChange}
      >
        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100 focus:ring-zinc-500">
          <SelectValue placeholder="Select template…" />
        </SelectTrigger>
        <SelectContent>
          {templates.map(t => (
            <SelectItem key={t} value={t}>{t}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
