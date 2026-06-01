import { useEffect, useState } from 'react'
import { marked } from 'marked'
import type { Recipient } from '../../../../../shared/types'

interface Props {
  body: string
  templateHtml: string
  sample: Recipient | null
}

function applyMergeTags(text: string, data: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? `{{${key}}}`)
}

export function EmailPreview({ body, templateHtml, sample }: Props) {
  const [html, setHtml] = useState('')

  useEffect(() => {
    async function render() {
      const resolvedBody = sample ? applyMergeTags(body, sample.mergeData) : body
      const bodyHtml = await marked(resolvedBody)
      const full = templateHtml
        .replace('{{BODY}}', bodyHtml)
        .replace('{{UNSUBSCRIBE_URL}}', '#')
      setHtml(full)
    }
    render()
  }, [body, templateHtml, sample])

  return (
    <div className="space-y-2">
      {sample && (
        <p className="text-xs text-zinc-500">
          Previewing with: <span className="text-zinc-300">{sample.mergeData['Name'] ?? sample.mergeData['name'] ?? ''}</span>
          {' '}<span className="text-zinc-600">&lt;{sample.email}&gt;</span>
        </p>
      )}
      <iframe
        srcDoc={html}
        className="w-full h-96 rounded-md border border-zinc-700 bg-white"
        title="Email Preview"
      />
    </div>
  )
}
