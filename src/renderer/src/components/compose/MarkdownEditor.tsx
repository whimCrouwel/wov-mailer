import { useRef, useState, useCallback } from 'react'
import { Label } from '../ui/label'
import type { AirtableField } from '../../../../../shared/types'

interface Props {
  value: string
  onChange: (value: string) => void
  fields?: AirtableField[]
}

export function MarkdownEditor({ value, onChange, fields = [] }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [mention, setMention] = useState<{ query: string; start: number } | null>(null)

  const nonEmailFields = fields.filter(f => f.type !== 'email')
  const filteredFields = mention
    ? nonEmailFields.filter(f => f.name.toLowerCase().includes(mention.query.toLowerCase()))
    : []

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    const cursor = e.target.selectionStart ?? text.length
    onChange(text)

    // Detect @mention: find last @ before cursor with no space after it
    const before = text.slice(0, cursor)
    const match = before.match(/@([\w]*)$/)
    if (match) {
      setMention({ query: match[1], start: cursor - match[0].length })
    } else {
      setMention(null)
    }
  }, [onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!mention) return
    if (e.key === 'Escape') { setMention(null); e.preventDefault() }
    if (e.key === 'Enter' && filteredFields.length === 1) {
      insertField(filteredFields[0])
      e.preventDefault()
    }
  }, [mention, filteredFields])

  function insertField(field: AirtableField) {
    if (!textareaRef.current || !mention) return
    const tag = `{{${field.name}}}`
    const before = value.slice(0, mention.start)
    const cursor = textareaRef.current.selectionStart ?? value.length
    const after = value.slice(cursor)
    const newValue = before + tag + after
    onChange(newValue)
    setMention(null)
    // Restore focus + cursor after tag
    requestAnimationFrame(() => {
      textareaRef.current?.focus()
      const pos = mention.start + tag.length
      textareaRef.current?.setSelectionRange(pos, pos)
    })
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-zinc-500">Body (Markdown)</Label>
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={14}
          className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 font-mono resize-y"
          placeholder={"# Hello {{name}}\n\nWrite your email here...\n\nType @ to insert a field tag."}
        />
        {mention && filteredFields.length > 0 && (
          <div className="absolute left-0 right-0 bottom-full mb-1 z-50 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg overflow-hidden max-h-48 overflow-y-auto">
            {filteredFields.map(f => (
              <button
                key={f.id}
                onMouseDown={e => { e.preventDefault(); insertField(f) }}
                className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700 flex items-center gap-2"
              >
                <span className="text-zinc-500 font-mono text-xs">{'{{'}</span>
                <span>{f.name}</span>
                <span className="text-zinc-500 font-mono text-xs">{'}}'}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-zinc-600">
        Type <kbd className="px-1 rounded bg-zinc-700 text-zinc-400">@</kbd> to insert a field tag.
        Use <code className="text-zinc-400">{'{{fieldName}}'}</code> for Airtable field substitution.
      </p>
    </div>
  )
}
