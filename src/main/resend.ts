import { Resend } from 'resend'
import { marked } from 'marked'
import { renderTemplate } from './templates'
import type { Recipient, ComposeState } from '../shared/types'

export function applyMergeTags(html: string, data: Record<string, string>): string {
  return html.replace(/\{\{(\w+)\}\}/g, (match, key) => data[key] ?? match)
}

export function buildUnsubscribeUrl(email: string): string {
  return `https://resend.com/unsubscribe?email=${encodeURIComponent(email)}`
}

export interface SendResult {
  sent: number
  failed: number
  errors: string[]
}

export async function sendBroadcast(
  apiKey: string,
  senderName: string,
  senderEmail: string,
  recipients: Recipient[],
  compose: ComposeState
): Promise<SendResult> {
  const resend = new Resend(apiKey)
  const bodyHtml = await marked(compose.body)

  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const recipient of recipients) {
    try {
      const unsubscribeUrl = buildUnsubscribeUrl(recipient.email)
      const html = await renderTemplate(compose.templateName, applyMergeTags(bodyHtml, recipient.mergeData), unsubscribeUrl)
      const subject = applyMergeTags(compose.subject, recipient.mergeData)

      await resend.emails.send({
        from: `${senderName} <${senderEmail}>`,
        to: recipient.email,
        subject,
        html,
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })
      sent++
    } catch (err) {
      failed++
      errors.push(`${recipient.email}: ${String(err)}`)
    }
  }

  return { sent, failed, errors }
}
