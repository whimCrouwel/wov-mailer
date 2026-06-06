import { useEffect, useState } from 'react'
import { marked } from 'marked'
import type { Recipient } from '../../../../../shared/types'

interface Props {
  body: string
  templateHtml: string
  sample: Recipient | null
  isMarketing: boolean
}

function applyMergeTags(text: string, data: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? `{{${key}}}`)
}

export function EmailPreview({ body, templateHtml, sample, isMarketing }: Props) {
  const [html, setHtml] = useState('')

  useEffect(() => {
    async function render() {
      const resolvedBody = sample ? applyMergeTags(body, sample.mergeData) : body
      const bodyHtml = await marked(resolvedBody)
      let full = templateHtml.replace('{{BODY}}', bodyHtml)
      if (isMarketing) {
        full = full.replace(/\{\{UNSUBSCRIBE_URL\}\}/g, '#')
      } else {
        full = full.replace(/<a\b[^>]*href="[^"]*\{\{UNSUBSCRIBE_URL\}\}[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '')
        full = full.replace(/\s*&nbsp;·&nbsp;\s*(?=\s*<)/g, '')
      }
      setHtml(full)
    }
    render()
  }, [body, templateHtml, sample, isMarketing])

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
