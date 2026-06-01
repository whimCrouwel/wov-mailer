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
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#666' }}>Preview</label>
      <iframe
        srcDoc={html}
        style={{ width: '100%', height: 400, border: '1px solid #ddd', borderRadius: 4 }}
        title="Email Preview"
      />
    </div>
  )
}
