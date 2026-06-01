interface Props {
  value: string
  onChange: (value: string) => void
}

export function MarkdownEditor({ value, onChange }: Props) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#666' }}>Body (Markdown)</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={14}
        style={{ width: '100%', padding: '8px', fontFamily: 'monospace', fontSize: 13, boxSizing: 'border-box', resize: 'vertical' }}
        placeholder="# Hello {{name}}&#10;&#10;Write your email here..."
      />
    </div>
  )
}
