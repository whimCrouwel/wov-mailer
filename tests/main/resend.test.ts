import { describe, it, expect } from 'vitest'
import { applyMergeTags, buildUnsubscribeUrl } from '../../src/main/resend'

describe('applyMergeTags', () => {
  it('replaces merge tags with recipient data', () => {
    const template = 'Hello {{name}}, your company is {{company}}.'
    const result = applyMergeTags(template, { name: 'Vim', company: 'WoV' })
    expect(result).toBe('Hello Vim, your company is WoV.')
  })

  it('leaves unknown tags unchanged', () => {
    const result = applyMergeTags('Hello {{name}}', {})
    expect(result).toBe('Hello {{name}}')
  })
})

describe('buildUnsubscribeUrl', () => {
  it('returns a URL with encoded email', () => {
    const url = buildUnsubscribeUrl('test@example.com')
    expect(url).toContain('test%40example.com')
    expect(url).toContain('unsubscribe')
  })
})
