import { useEffect, useState } from 'react'

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
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#666' }}>Template</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ padding: '6px 8px' }}>
        <option value="">Select template…</option>
        {templates.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
    </div>
  )
}
