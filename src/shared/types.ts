export interface Config {
  airtableToken: string
  resendApiKey: string
  senderName: string
  senderEmail: string
}

export interface FilterCondition {
  field: string
  fieldType: 'singleLineText' | 'multilineText' | 'singleSelect' | 'email' | 'number' | string
  operator: 'equals' | 'contains' | 'gt' | 'lt'
  value: string
}

export interface ComposeState {
  baseId: string
  baseLabel: string
  tableId: string
  tableLabel: string
  emailField: string
  filters: FilterCondition[]
  templateName: string
  subject: string
  body: string
}

export interface HistoryEntry {
  id: string
  sentAt: string
  subject: string
  recipientCount: number
  status: 'sent' | 'failed'
  errorMessage?: string
  compose: ComposeState
}

export interface AirtableBase {
  id: string
  name: string
}

export interface AirtableField {
  id: string
  name: string
  type: string
}

export interface AirtableTable {
  id: string
  name: string
  fields: AirtableField[]
  emailField: string
}

export interface Recipient {
  email: string
  mergeData: Record<string, string>
}
