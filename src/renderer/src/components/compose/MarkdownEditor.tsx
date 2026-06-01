import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'

interface Props {
  value: string
  onChange: (value: string) => void
}

export function MarkdownEditor({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-zinc-500">Body (Markdown)</Label>
      <Textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={14}
        className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-500 font-mono text-sm resize-y"
        placeholder={"# Hello {{name}}\n\nWrite your email here..."}
      />
      <p className="text-xs text-zinc-600">Use {'{{fieldName}}'} for Airtable field substitution.</p>
    </div>
  )
}
