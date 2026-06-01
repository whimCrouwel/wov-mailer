import { useEffect, useState } from 'react'
import { marked } from 'marked'

interface Props {
  body: string
  templateHtml: string
}

export function EmailPreview({ body, templateHtml }: Props) {
  const [html, setHtml] = useState('')

  useEffect(() => {
    async function render() {
      const bodyHtml = await marked(body)
      const full = templateHtml
        .replace('{{BODY}}', bodyHtml)
        .replace('{{UNSUBSCRIBE_URL}}', '#')
      setHtml(full)
    }
    render()
  }, [body, templateHtml])

  return (
    <div className="space-y-2">
      <iframe
        srcDoc={html}
        className="w-full h-96 rounded-md border border-zinc-700 bg-white"
        title="Email Preview"
      />
      <p className="text-xs text-zinc-600">Preview uses placeholder data. Actual emails will use recipient field values.</p>
    </div>
  )
}
