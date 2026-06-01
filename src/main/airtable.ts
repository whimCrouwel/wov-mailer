import Airtable from 'airtable'
import type { AirtableBase, AirtableTable, FilterCondition, Recipient } from '../shared/types'

function client(token: string) {
  return new Airtable({ apiKey: token })
}

export async function listBases(token: string): Promise<AirtableBase[]> {
  const res = await fetch('https://api.airtable.com/v0/meta/bases', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Airtable error: ${res.status}`)
  const data = await res.json()
  return data.bases.map((b: { id: string; name: string }) => ({ id: b.id, name: b.name }))
}

export async function listTablesWithEmailFields(token: string, baseId: string): Promise<AirtableTable[]> {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Airtable error: ${res.status}`)
  const data = await res.json()

  return data.tables
    .map((t: { id: string; name: string; fields: { id: string; name: string; type: string }[] }) => {
      const emailField = t.fields.find(f => f.type === 'email')
      if (!emailField) return null
      return {
        id: t.id,
        name: t.name,
        fields: t.fields.map(f => ({ id: f.id, name: f.name, type: f.type })),
        emailField: emailField.name,
      }
    })
    .filter(Boolean) as AirtableTable[]
}

export function buildFormula(filters: FilterCondition[]): string {
  if (filters.length === 0) return ''

  const parts = filters.map(f => {
    if (f.operator === 'equals') return `{${f.field}}='${f.value}'`
    if (f.operator === 'contains') return `FIND('${f.value}',{${f.field}})>0`
    if (f.operator === 'gt') return `{${f.field}}>${f.value}`
    if (f.operator === 'lt') return `{${f.field}}<${f.value}`
    return `{${f.field}}='${f.value}'`
  })

  return parts.length === 1 ? parts[0] : `AND(${parts.join(',')})`
}

export function filterRecords(
  records: Record<string, string>[],
  filters: FilterCondition[]
): Record<string, string>[] {
  return records.filter(record =>
    filters.every(f => {
      const val = record[f.field] ?? ''
      if (f.operator === 'equals') return val === f.value
      if (f.operator === 'contains') return val.includes(f.value)
      if (f.operator === 'gt') return Number(val) > Number(f.value)
      if (f.operator === 'lt') return Number(val) < Number(f.value)
      return true
    })
  )
}

export async function fetchRecipients(
  token: string,
  baseId: string,
  tableId: string,
  emailField: string,
  filters: FilterCondition[]
): Promise<Recipient[]> {
  const formula = buildFormula(filters)
  const base = client(token).base(baseId)

  const records: Recipient[] = []
  await base(tableId).select({ ...(formula ? { filterByFormula: formula } : {}) }).eachPage(
    (pageRecords, fetchNextPage) => {
      for (const r of pageRecords) {
        const email = r.get(emailField) as string | undefined
        if (!email) continue
        const mergeData: Record<string, string> = {}
        for (const [key, value] of Object.entries(r.fields)) {
          if (key !== emailField && typeof value === 'string') {
            mergeData[key] = value
          }
        }
        records.push({ email, mergeData })
      }
      fetchNextPage()
    }
  )
  return records
}
